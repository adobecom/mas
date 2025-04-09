import Store from './store.js';

const SANDBOX = 'sandbox';

const MAS_CONSUMER_GROUPS = {
    mas: 805679776,
    acom: 805679776,
    'adobe-home': 805679786,
    ccd: 805679796,
    commerce: 860864926,
    nala: 867883497,
    [SANDBOX]: 867872193,
};

let consumerName;

const headers = {
    Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
    'X-Api-Key': 'mas-studio',
    'Content-Type': 'application/json',
};

export async function loadUsers(groupId) {
    if (groupId === MAS_CONSUMER_GROUPS[SANDBOX]) {
        Store.selectedUserId.set(Store.profile.value.userId);
    }
    const response = await fetch(
        `https://bps-il.adobe.io/jil-api/v2/organizations/3B962FB55F5F922E0A495C88@AdobeOrg/user-groups/${groupId}/users/?page=0&page_size=100&sort=FNAME_LNAME&sort_order=ASC&currentPage=1&filterQuery=`,
        {
            headers,
        },
    );
    const userData = await response.json();
    return userData;
}

/**
 * Fetch user details and store group names
 * @param {string} userId - The ID of the user to fetch details for
 * @returns {Promise<object|null>} - The user data or null if an error occurred
 */
export async function fetchUserGroups(userId) {
    const response = await fetch(
        `https://bps-il.adobe.io/jil-api/v2/organizations/3B962FB55F5F922E0A495C88@AdobeOrg/users/${userId}`,
        {
            headers,
        },
    );
    const { userGroups } = await response.json();
    Store.userGroups.set(userGroups);
}

async function init() {
    const profile = await window.adobeIMS.getProfile();
    Store.profile.set(profile);
    fetchUserGroups(profile.userId);

    Store.search.subscribe(async ({ path }) => {
        if (!path) return;
        if (path === consumerName) return;
        consumerName = path;
        const groupId = MAS_CONSUMER_GROUPS[consumerName];
        Store.users.set([]);
        const [masEditors, consumerEditors] = await Promise.all([
            loadUsers(MAS_CONSUMER_GROUPS.mas),
            loadUsers(groupId),
        ]);
        const mergedEditors = [...masEditors, ...consumerEditors];
        const uniqueEditors = mergedEditors.filter(
            (user, index, self) =>
                index === self.findIndex((t) => t.id === user.id),
        );
        Store.users.set(uniqueEditors);
    });
}

init();
