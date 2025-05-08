import Store from './store.js';

const headers = {
    Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
    accept: 'application/json',
};

let consumerName;
export async function loadUsers() {
    try {
        const response = await fetch(
            `https://localhost:9080/api/v1/web/MerchAtScaleStudio/group?tenant=${consumerName}`,
            {
                headers,
            },
        );
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

/**
 * Fetch user details and store group names
 * @param {string} userId - The ID of the user to fetch details for
 * @returns {Promise<object|null>} - The user data or null if an error occurred
 */
export async function fetchUserGroups(userId) {}

async function init() {
    const profile = await window.adobeIMS.getProfile();
    Store.profile.set(profile);
    fetchUserGroups(profile.userId);

    Store.search.subscribe(async ({ path }) => {
        if (!path) return;
        if (path === consumerName) return;
        consumerName = path;
        const uniqueEditors = await loadUsers();

        Store.users.set([]);

        Store.users.set(uniqueEditors);
    });
}

init();
