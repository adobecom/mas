#!/usr/bin/env node

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const LDAP_BASE_URL = process.env.LDAP_BASE_URL;
const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT;
const ORG_ID = process.env.ORG_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !LDAP_BASE_URL || !TARGET_ENDPOINT || !ORG_ID) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
}

async function getAccessToken() {
    const tokenUrl = 'https://ims-na1.adobelogin.com/ims/token/v3';
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'AdobeID,openid,read_organizations,additional_info.projectedProductContext,additional_info.roles,adobeio_api,read_client_secret,manage_client_secrets',
    });

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            // Throw an error with details from the response if available
            throw new Error(
                `Failed to fetch access token: ${response.status} ${response.statusText}. Check IMS server response for details.`,
            );
        }

        if (data.access_token) {
            return data.access_token;
        } else {
            // Log the actual response if no token is found
            throw new Error(`No access token in response. Check IMS server response for details.`);
        }
    } catch (error) {
        console.error('Error fetching access token:', error);
        // Re-throw the error to be caught by the main function's catch block
        throw error;
    }
}

async function fetchLdapMembers(token) {
    console.log('Retrieving users from LDAP');

    const tenants = ['CCD', 'ACOM', 'COMMERCE', 'AH', 'SANDBOX', 'NALA'];
    const fetchPromises = tenants.map(async (tenant) => {
        const groupName = `GRP-ODIN-MAS-${tenant}-EDITORS`;
        const apiEndpoint = `${LDAP_BASE_URL}/groups/${groupName}/members?show_all=true`;
        const res = await fetch(apiEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });

        const rawResponse = await res.text();
        if (!res.ok) {
            throw new Error(`Request to ${apiEndpoint} failed with status code ${res.status}. Response body: ${rawResponse}`);
        }

        try {
            return {
                groupName,
                members: JSON.parse(rawResponse),
            };
        } catch (error) {
            throw new Error(`Invalid JSON from ${apiEndpoint}. Response body: ${rawResponse}`);
        }
    });

    const results = await Promise.all(fetchPromises);
    const usersByPrincipalName = new Map();

    for (const { members } of results) {
        for (const user of members) {
            if (!user.userPrincipalName) {
                continue;
            }

            const key = user.userPrincipalName.toLowerCase();
            if (usersByPrincipalName.has(key)) {
                continue;
            }

            usersByPrincipalName.set(key, {
                userPrincipalName: user.userPrincipalName,
                displayName: user.displayName,
                userId: user.userId || user.userPrincipalName.split('@')[0],
            });
        }
    }

    const uniqueUsers = Array.from(usersByPrincipalName.values()).sort((a, b) =>
        a.userPrincipalName.localeCompare(b.userPrincipalName),
    );

    return uniqueUsers;
}

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let index = 0;

    async function worker() {
        while (true) {
            const currentIndex = index;
            index += 1;

            if (currentIndex >= items.length) {
                return;
            }

            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }

    const workerCount = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
}

function extractGroupsFromMemberOfResponse(data) {
    const memberships = Array.isArray(data)
        ? data
        : Array.isArray(data?.value)
          ? data.value
          : Array.isArray(data?.groups)
            ? data.groups
            : Array.isArray(data?.memberOf)
              ? data.memberOf
              : [];

    return Array.from(
        new Set(
            memberships
                .map((group) => {
                    if (typeof group === 'string') {
                        return group;
                    }

                    if (group && typeof group === 'object') {
                        return group.displayName || group.groupName || group.cn || group.name || group.id || null;
                    }

                    return null;
                })
                .filter(Boolean)
                .filter((name) => /-MAS-/.test(name)),
        ),
    ).sort();
}

async function fetchMemberOfGroups(users, token) {
    console.log(`Fetching memberOf groups for ${users.length} users with concurrency 5`);
    const normalizedBaseUrl = LDAP_BASE_URL.endsWith('/') ? LDAP_BASE_URL.slice(0, -1) : LDAP_BASE_URL;

    const usersWithGroups = await mapWithConcurrency(users, 5, async (user) => {
        const username = user.userId || user.userPrincipalName.split('@')[0];
        const apiEndpoint = `${normalizedBaseUrl}/${encodeURIComponent(username)}/memberOf`;
        console.log('Fetching memberOf from:', apiEndpoint);

        const res = await fetch(apiEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });

        const rawResponse = await res.text();
        if (!res.ok) {
            throw new Error(`Request to ${apiEndpoint} failed with status code ${res.status}. Response body: ${rawResponse}`);
        }

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(rawResponse);
        } catch (error) {
            throw new Error(`Invalid JSON from ${apiEndpoint}. Response body: ${rawResponse}`);
        }

        return {
            userPrincipalName: user.userPrincipalName,
            displayName: user.displayName,
            groups: extractGroupsFromMemberOfResponse(parsedResponse),
        };
    });

    return usersWithGroups.sort((a, b) => a.userPrincipalName.localeCompare(b.userPrincipalName));
}

async function sendToEndpoint(users, token) {
    try {
        const response = await fetch(TARGET_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-api-id': CLIENT_ID,
                'x-gw-ims-org-id': ORG_ID,
            },
            body: JSON.stringify({ users }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send data to endpoint: ${response.status}`);
        }

        console.log('Successfully sent data to endpoint');
    } catch (error) {
        console.error('Error sending data to endpoint:', error);
        throw error;
    }
}

async function main() {
    try {
        const token = await getAccessToken();
        const users = await fetchLdapMembers(token);
        const usersWithGroups = await fetchMemberOfGroups(users, token);
        await sendToEndpoint(usersWithGroups, token);
        console.log(`Successfully processed ${usersWithGroups.length} unique users`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
