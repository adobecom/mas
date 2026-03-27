import Store from './store.js';

export async function loadUsers() {
    const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    try {
        const response = await fetch(`${ioBaseUrl}/listMembers`, {
            headers: {
                Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
                accept: 'application/json',
                'x-gw-ims-org-id': '9E1005A551ED61CA0A490D45',
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

        Store.search.subscribe(async ({ path }) => {
            if (path !== 'sandbox') return;
            Store.createdByUsers.set([
                {
                    displayName: profile.displayName,
                    userPrincipalName: profile.email,
                },
            ]);
        });
    } catch (e) {
        console.error('Error initializing users', e);
        Store.users.set([]);
    } finally {
        Store.users.setMeta('loaded', true);
    }
}
