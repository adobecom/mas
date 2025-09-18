import Store from './store.js';

export async function loadUsers() {
    const urlParams = new URLSearchParams(window.location.search);
    let masIoStudioBase = urlParams.get('mas-io-studio-base');
    if (!masIoStudioBase) {
        masIoStudioBase = 'https://mas.adobe.com/io';
    }
    if (!masIoStudioBase.endsWith('/')) {
        masIoStudioBase += '/';
    }
    try {
        const response = await fetch(`${masIoStudioBase}listMembers`, {
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
        if (uniqueEditors.length > 0) {
            Store.users.set(uniqueEditors);
        }

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
    }
}
