const { Core } = require('@adobe/aio-sdk');
const { Ims } = require('@adobe/aio-lib-ims');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils.js');
const { processBatchWithConcurrency } = require('../common.js');
const { resolvePaths } = require('./resolver.js');
const { publishPath } = require('./publisher.js');
const { enqueue } = require('./queue.js');

const logger = Core.Logger('bulk-publish', { level: 'info' });
const DEFAULT_CONCURRENCY = 5;
const MAX_CONCURRENCY = 20;
const MAX_PATHS = 500;
const MAX_LOCALES = 50;
const MAX_RESOLVED = 5000;
const PATH_PREFIX = '/content/dam/mas/';
const STATUS = { PUBLISHED: 'published', SKIPPED: 'skipped', FAILED: 'failed' };

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
        if (params.paths.length > MAX_PATHS) {
            return errorResponse(400, `paths exceeds maximum of ${MAX_PATHS}`, logger);
        }
        const invalidPath = params.paths.find((p) => typeof p !== 'string' || !p.startsWith(PATH_PREFIX));
        if (invalidPath !== undefined) {
            return errorResponse(400, `path must be a non-empty string starting with ${PATH_PREFIX}: ${invalidPath}`, logger);
        }
        if (params.locales !== undefined && !Array.isArray(params.locales)) {
            return errorResponse(400, 'locales must be an array when provided', logger);
        }
        if (Array.isArray(params.locales) && params.locales.length > MAX_LOCALES) {
            return errorResponse(400, `locales exceeds maximum of ${MAX_LOCALES}`, logger);
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
        if (resolved.length > MAX_RESOLVED) {
            return errorResponse(400, `Resolved ${resolved.length} paths exceeds maximum of ${MAX_RESOLVED}`, logger);
        }

        const concurrency = Math.min(Number(params.concurrencyLimit) || DEFAULT_CONCURRENCY, MAX_CONCURRENCY);
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
        logger.error(JSON.stringify({ event: 'run-error', error: error.message || String(error) }));
        return errorResponse(500, 'Internal server error', logger);
    }
}

function buildSummary(details) {
    const summary = { total: details.length, published: 0, skipped: 0, failed: 0 };
    for (const detail of details) {
        if (detail.status === STATUS.PUBLISHED) summary.published += 1;
        else if (detail.status === STATUS.SKIPPED) summary.skipped += 1;
        else if (detail.status === STATUS.FAILED) summary.failed += 1;
    }
    return summary;
}

async function isAllowed(token, allowedClientId) {
    if (!token || !allowedClientId) return false;
    logger.info(JSON.stringify({ event: 'ims-validate', allowedClientId }));
    const ims = new Ims('prod');
    const imsValidation = await ims.validateTokenAllowList(token, [allowedClientId]);
    if (!imsValidation || !imsValidation.valid) {
        logger.error(JSON.stringify({ event: 'ims-validate-failed', allowedClientId }));
        return false;
    }
    return true;
}

exports.main = main;
