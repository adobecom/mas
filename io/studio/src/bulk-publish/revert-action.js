const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed } = require('../../utils.js');
const { revertSnapshot } = require('./snapshot.js');

const logger = Core.Logger('bulk-revert', { level: 'info' });

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

        const result = await revertSnapshot({ entries, odinEndpoint, authToken });
        return { statusCode: 200, body: result };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'revert-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

exports.main = main;
