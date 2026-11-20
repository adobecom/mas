const { errorResponse, getBearerToken, isAllowed } = require('../../utils.js');
const { exposeRequestId } = require('../response-headers.js');
const { getPermissions } = require('./permissions.js');

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
        const permissions = await getPermissions(token);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
            body: permissions,
        };
    } catch (error) {
        return errorResponse(error.statusCode ?? 502, error.message);
    }
}

exports.main = exposeRequestId(main);
