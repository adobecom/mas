const { Core } = require('@adobe/aio-sdk');
const { Ims } = require('@adobe/aio-lib-ims');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils.js');
const { processBatchWithConcurrency } = require('../common.js');
const { resolvePaths } = require('./resolver.js');
const { publishPath } = require('./publisher.js');
const { enqueue } = require('./queue.js');

const logger = Core.Logger('bulk-publish', { level: 'info' });
const DEFAULT_CONCURRENCY = 5;

async function main(params) {
    return enqueue(() => run(params));
}

async function run(params) {
    try {
        logger.info(JSON.stringify({ event: 'run-start' }));

        const requiredHeaders = ['Authorization'];
        const requiredParams = ['paths', 'odinEndpoint'];
        const missing = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (missing) {
            return errorResponse(400, missing, logger);
        }

        if (!Array.isArray(params.paths) || params.paths.length === 0) {
            return errorResponse(400, 'paths must be a non-empty array', logger);
        }
        if (params.locales !== undefined && !Array.isArray(params.locales)) {
            return errorResponse(400, 'locales must be an array when provided', logger);
        }

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId);
        if (!allowed) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const resolved = resolvePaths(params.paths, params.locales);
        if (resolved.length === 0) {
            return errorResponse(400, 'No valid paths after resolution', logger);
        }

        const concurrency = Number(params.concurrencyLimit) || DEFAULT_CONCURRENCY;
        logger.info(JSON.stringify({ event: 'resolved', total: resolved.length, concurrency }));

        const details = await processBatchWithConcurrency(resolved, concurrency, (path) =>
            publishPath({
                path,
                odinEndpoint: params.odinEndpoint,
                authToken,
                logger,
            }),
        );

        const summary = buildSummary(details);
        logger.info(JSON.stringify({ event: 'run-complete', summary }));

        return {
            statusCode: 200,
            body: { summary, details },
        };
    } catch (error) {
        logger.error(`Error in bulk-publish main: ${error.message || error}`);
        return errorResponse(500, `Internal server error - ${error.message || error}`, logger);
    }
}

function buildSummary(details) {
    const summary = { total: details.length, published: 0, skipped: 0, failed: 0 };
    for (const detail of details) {
        if (detail.status === 'published') summary.published += 1;
        else if (detail.status === 'skipped') summary.skipped += 1;
        else if (detail.status === 'failed') summary.failed += 1;
    }
    return summary;
}

async function isAllowed(token, allowedClientId) {
    if (!token || !allowedClientId) return false;
    logger.info(`Validating IMS token for client ID: ${allowedClientId}`);
    const ims = new Ims('prod');
    const imsValidation = await ims.validateTokenAllowList(token, [allowedClientId]);
    if (!imsValidation || !imsValidation.valid) {
        logger.error(`IMS token validation failed: ${JSON.stringify(imsValidation, null, 2)}`);
        return false;
    }
    return true;
}

exports.main = main;
