const { Core } = require('@adobe/aio-sdk');
const { Ims } = require('@adobe/aio-lib-ims');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils.js');
const { checkModifications } = require('./snapshot.js');

const logger = Core.Logger('bulk-check-modifications', { level: 'info' });

async function main(params) {
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const missing = checkMissingRequestInputs(params, ['entries'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { entries } = params;
        if (!Array.isArray(entries) || entries.length === 0) {
            return errorResponse(400, 'entries must be a non-empty array', logger);
        }

        const results = await checkModifications({ entries, odinEndpoint, authToken });
        return { statusCode: 200, body: results };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'check-modifications-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

async function isAllowed(token, allowedClientId) {
    if (!token || !allowedClientId) return false;
    const ims = new Ims('prod');
    const result = await ims.validateTokenAllowList(token, [allowedClientId]);
    return !!result?.valid;
}

exports.main = main;
