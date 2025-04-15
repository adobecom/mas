const MAS_CONSUMER_GROUPS = {
    mas: 805267566,
    acom: 805679776,
    'adobe-home': 805679786,
    ccd: 805679796,
    commerce: 860864926,
    nala: 867883497,
    [SANDBOX]: 867872193,
};

/**
 * Creates headers with service token for API requests
 * @param {string} serviceToken - The service token to use for authentication
 * @returns {Object} Headers object with authentication and content type
 */
function createHeaders(serviceToken) {
    return {
        Authorization: `Bearer ${serviceToken}`,
        'X-Api-Key': 'mas-studio',
        'Content-Type': 'application/json',
    };
}

/**
 * Load users from a specific group
 * @param {string} groupId - The ID of the group to load users from
 * @param {string} serviceToken - The service token for authentication
 * @returns {Promise<Array>} Array of users or empty array if error occurs
 */
export async function loadUsers(groupId, serviceToken) {
    if (groupId === MAS_CONSUMER_GROUPS[SANDBOX]) {
        Store.selectedUserId.set(Store.profile.value.userId);
    }
    try {
        const response = await fetch(
            `https://bps-il.adobe.io/jil-api/v2/organizations/3B962FB55F5F922E0A495C88@AdobeOrg/user-groups/${groupId}/users/?page=0&page_size=100&sort=FNAME_LNAME&sort_order=ASC&currentPage=1&filterQuery=`,
            {
                headers: createHeaders(serviceToken),
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
 * Fetch user groups for a specific user
 * @param {string} userId - The ID of the user to fetch groups for
 * @param {string} serviceToken - The service token for authentication
 * @returns {Promise<Object|null>} User groups data or null if error occurs
 */
export async function fetchUserGroups(userId, serviceToken) {
    try {
        const response = await fetch(
            `https://bps-il.adobe.io/jil-api/v2/organizations/3B962FB55F5F922E0A495C88@AdobeOrg/users/${userId}`,
            {
                headers: createHeaders(serviceToken),
            },
        );
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        const { userGroups } = await response.json();
        Store.userGroups.set(userGroups);
        return userGroups;
    } catch (e) {
        console.error(e);
        return null;
    }
}
