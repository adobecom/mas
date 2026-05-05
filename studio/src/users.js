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

export async function initUsers() {
    try {
        const profile = await window.adobeIMS.getProfile();
        Store.profile.set(profile);
        const uniqueEditors = await loadUsers();
        Store.users.set(uniqueEditors);

        Store.search.subscribe(() => {
            Store.createdByUsers.set([]);
        });
    } catch (e) {
        console.error('Error initializing users', e);
        Store.users.set([]);
    } finally {
        Store.users.setMeta('loaded', true);
    }
}
