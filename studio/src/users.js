import Store from './store.js';

let consumerName;
export async function loadUsers() {
    try {
        const response = await fetch(`http://mas.adobe.com/io/listMembers`, {
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

async function init() {
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
}

init();
