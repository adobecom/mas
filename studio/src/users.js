import Store from './store.js';

export async function loadUsers() {
    const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    try {
        const response = await fetch(`${ioBaseUrl}/listMembers`, {
            headers: {
                Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
                accept: 'application/json',
                'x-gw-ims-org-id': '3B962FB55F5F922E0A495C88',
            },
        });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        const userData = await response.json();
        return userData;
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function loadBulkPublishAccess() {
    const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    try {
        const response = await fetch(`${ioBaseUrl}/bulk-publish-access`, {
            headers: {
                Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
                accept: 'application/json',
            },
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return false;
        const access = await response.json();
        return access.allowed === true;
    } catch {
        return false;
    }
}

export async function initUsers() {
    Store.users.setMeta('loaded', false);
    Store.users.setMeta('imsBulkPublishAccess', null);
    Store.users.notify();
    try {
        const profile = await window.adobeIMS.getProfile();
        Store.profile.set(profile);
        const email = profile.email?.toLowerCase();
        const [uniqueEditors, allowed] = await Promise.all([
            loadUsers(),
            email?.endsWith('@adobetest.com') ? loadBulkPublishAccess() : false,
        ]);
        if (email?.endsWith('@adobetest.com')) {
            Store.users.setMeta('imsBulkPublishAccess', { email, allowed });
        }
        Store.users.set(uniqueEditors);

        Store.search.subscribe(() => {
            Store.createdByUsers.set([]);
        });
    } catch (e) {
        console.error('Error initializing users', e);
        Store.users.set([]);
    } finally {
        Store.users.setMeta('loaded', true);
        Store.users.notify();
    }
}
