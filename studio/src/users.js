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
        if (uniqueEditors.length > 0) {
            Store.users.set(uniqueEditors);
        }
    } catch (e) {
        console.error('Error initializing users', e);
    }
}
