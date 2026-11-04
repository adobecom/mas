const { errorResponse, getBearerToken, isAllowed } = require('../../utils.js');

const STUDIO_ORG_ID = '3B962FB55F5F922E0A495C88';
const BULK_PUBLISH_GROUPS = new Set(['GRP-ODIN-MAS-ACOM-CURATORS', 'GRP-ODIN-MAS-ADMINS']);

async function main(params) {
    if ((params.__ow_method || 'get').toLowerCase() !== 'get') {
        return errorResponse(405, 'Method not allowed');
    }
    const token = getBearerToken(params);
    if (!token) return errorResponse(401, 'Authorization failed');
    try {
        if (!(await isAllowed(token, 'mas-studio'))) return errorResponse(401, 'Authorization failed');
    } catch {
        return errorResponse(401, 'Authorization failed');
    }

    try {
        const response = await fetch('https://ims-na1.adobelogin.com/ims/organizations/v5', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            redirect: 'error',
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            const statusCode = [401, 403].includes(response.status) ? response.status : 502;
            return errorResponse(statusCode, 'Unable to verify IMS membership');
        }
        const organizations = await response.json();
        const organization = organizations.find(
            ({ orgRef }) =>
                orgRef?.authSrc === 'AdobeOrg' && [STUDIO_ORG_ID, `${STUDIO_ORG_ID}@AdobeOrg`].includes(orgRef.ident),
        );
        const allowed =
            organization?.groups?.some(({ groupName }) => BULK_PUBLISH_GROUPS.has(groupName?.toUpperCase())) ?? false;
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
            body: { allowed },
        };
    } catch {
        return errorResponse(502, 'Unable to verify IMS membership');
    }
}

exports.main = main;
