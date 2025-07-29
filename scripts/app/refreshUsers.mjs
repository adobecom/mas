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
            reject(new Error(`No access token in response. Check IMS server response for details.`));
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
    const fetchPromises = tenants.map((tenant) => {
        const apiEndpoint = `${LDAP_BASE_URL}/groups/GRP-ODIN-MAS-${tenant}-EDITORS/members?show_all=true`;
        console.log('Fetching from:', apiEndpoint);
        return fetch(apiEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }).then(async (res) => {
            if (!res.ok) {
                throw new Error(`Request to ${apiEndpoint} failed with status code ${res.status}`);
            }
            return res.json();
        });
    });

    const results = await Promise.all(fetchPromises);
    const mergedResults = [].concat(...results);

    // Deduplicate based on userPrincipalName and only return userPrincipalName, displayName
    const uniqueUsers = Array.from(new Set(mergedResults.map((user) => user.userPrincipalName))).map((userPrincipalName) => {
        const user = mergedResults.find((user) => user.userPrincipalName === userPrincipalName);
        return {
            userPrincipalName: user.userPrincipalName,
            displayName: user.displayName,
        };
    });

    return uniqueUsers;
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
        await sendToEndpoint(users, token);
        console.log(`Successfully processed ${users.length} unique users`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
