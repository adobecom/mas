const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { invokeAsyncAction, buildSiblingActionName } = require('../common.js');

const logger = Core.Logger('bulk-publish', { level: 'info' });
const WORKER_ACTION_NAME = 'bulk-publish-worker';

async function main(params) {
    if (!params.projectId) params = parseOwBody(params);
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);

        const missing = checkMissingRequestInputs(params, ['projectId'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId);
        if (!allowed) return errorResponse(401, 'Authorization failed', logger);

        const workerActionName = buildSiblingActionName(params, WORKER_ACTION_NAME, {
            overrideParamName: 'bulkPublishWorkerActionName',
        });
        const workerResult = await invokeAsyncAction(
            workerActionName,
            {
                projectId: params.projectId,
                publishedBy: params.publishedBy || '',
                authToken,
                includeCards: params.includeCards || false,
                includeVariations: params.includeVariations || false,
            },
            params,
        );

        logger.info(
            JSON.stringify({ event: 'dispatched', projectId: params.projectId, activationId: workerResult?.activationId }),
        );
        return { statusCode: 202, body: { accepted: true, activationId: workerResult?.activationId || null } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'dispatch-error', error: error.message || String(error) }));
        return errorResponse(500, 'Internal server error', logger);
    }
}

exports.main = main;
