const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed } = require('../../utils.js');
const { resolvePaths } = require('./resolver.js');
const { publishChunk } = require('./publisher.js');

const logger = Core.Logger('bulk-publish', { level: 'info' });
const MAX_PATHS = 500;
const MAX_LOCALES = 50;
const MAX_RESOLVED = 5000;
const MAX_CHUNK_SIZE = 50;
const PATH_PREFIX = '/content/dam/mas/';
const LOCALE_REGEX = /^\/content\/dam\/mas\/[\w-_]+\/(?<locale>[\w-_]+)\//;
const STATUS = { PUBLISHED: 'published', SKIPPED: 'skipped', FAILED: 'failed' };

async function main(params) {
    return run(params);
}

async function run(params) {
    try {
        logger.info(JSON.stringify({ event: 'run-start' }));

        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const requiredHeaders = ['Authorization'];
        const requiredParams = ['paths'];
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

        const chunks = groupAndChunk(resolved, MAX_CHUNK_SIZE);
        logger.info(JSON.stringify({ event: 'resolved', total: resolved.length, chunks: chunks.length }));

        const details = [];
        for (const chunk of chunks) {
            const chunkResults = await publishOneChunk(chunk, odinEndpoint, authToken);
            details.push(...chunkResults);
        }

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

async function publishOneChunk({ locale, paths }, odinEndpoint, authToken) {
    logger.info(JSON.stringify({ event: 'chunk-start', locale, size: paths.length }));
    const results = await publishChunk({ chunk: paths, odinEndpoint, authToken, logger });
    const counts = results.reduce(
        (acc, r) => {
            if (r.status === STATUS.PUBLISHED) acc.published += 1;
            else if (r.status === STATUS.FAILED) acc.failed += 1;
            return acc;
        },
        { published: 0, failed: 0 },
    );
    logger.info(JSON.stringify({ event: 'chunk-result', locale, size: paths.length, ...counts }));
    return results;
}

function extractLocale(path) {
    if (typeof path !== 'string') return 'unknown';
    const match = path.match(LOCALE_REGEX);
    return match?.groups?.locale || 'unknown';
}

function groupAndChunk(paths, maxChunkSize) {
    const groups = new Map();
    for (const path of paths) {
        const locale = extractLocale(path);
        const list = groups.get(locale);
        if (list) list.push(path);
        else groups.set(locale, [path]);
    }
    const chunks = [];
    for (const [locale, list] of groups) {
        for (let i = 0; i < list.length; i += maxChunkSize) {
            chunks.push({ locale, paths: list.slice(i, i + maxChunkSize) });
        }
    }
    return chunks;
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

exports.main = main;
