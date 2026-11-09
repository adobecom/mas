const { fetchOdin } = require('../common.js');

const PUBLISH_URI = '/adobe/sites/cf/fragments/publish';
const WORKFLOW_MODEL_ID = '/var/workflow/models/scheduled_activation_with_references';
const DEFAULT_MAX_RETRIES = 3;

const WORKFLOW_STATUS_MAP = {
    SUCCESS_TRIGGERED: { status: 'published' },
    ERROR_NOT_FOUND: { status: 'failed', reason: 'not-found' },
    ERROR_REFERENCED: { status: 'failed', reason: 'error-referenced' },
    ERROR_FORBIDDEN: { status: 'failed', reason: 'error-forbidden' },
    ERROR_INVALID: { status: 'failed', reason: 'error-invalid' },
};

async function publishChunk({
    chunk,
    odinEndpoint,
    authToken,
    logger,
    maxRetries = DEFAULT_MAX_RETRIES,
    filterReferencesByStatus = ['DRAFT', 'MODIFIED', 'UNPUBLISHED'],
    replicate = false,
}) {
    const chunks = replicate ? chunk.map((path) => [path]) : [chunk];
    const results = [];
    const csrfTokenCache = {};
    for (const paths of chunks) {
        try {
            results.push(
                ...(await doPublishChunk({
                    chunk: paths,
                    odinEndpoint,
                    authToken,
                    logger,
                    maxRetries,
                    filterReferencesByStatus,
                    replicate,
                    csrfTokenCache,
                })),
            );
        } catch (error) {
            const message = error.message || String(error);
            logger.error(JSON.stringify({ event: 'publish-unexpected-error', chunkSize: paths.length, error: message }));
            results.push(...paths.map((path) => ({ path, status: 'failed', reason: 'unexpected-error', retries: 0 })));
        }
    }
    return results;
}

async function replicatePath({ path, odinEndpoint, authToken, csrfTokenCache }) {
    if (!csrfTokenCache.token) {
        const response = await fetchOdin(odinEndpoint, '/libs/granite/csrf/token.json', authToken);
        const { token } = await response.json();
        csrfTokenCache.token = token;
    }
    await fetchOdin(odinEndpoint, '/bin/replicate', authToken, {
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        body: new URLSearchParams({ cmd: 'Activate', path }).toString(),
        csrfToken: csrfTokenCache.token,
    });
}

async function doPublishChunk({
    chunk,
    odinEndpoint,
    authToken,
    logger,
    maxRetries,
    filterReferencesByStatus,
    replicate,
    csrfTokenCache,
}) {
    logger.info(JSON.stringify({ event: 'publish-start', chunkSize: chunk.length }));

    let lastError = null;
    let csrfRefreshes = 0;
    let retries = 0;
    for (let attempt = 1; attempt <= maxRetries + csrfRefreshes; attempt++) {
        retries = attempt - 1;
        try {
            if (replicate) {
                await replicatePath({ path: chunk[0], odinEndpoint, authToken, csrfTokenCache });
                logger.info(JSON.stringify({ event: 'replicate-success', chunkSize: chunk.length, retries }));
                return chunk.map((path) => ({ path, status: 'published', retries }));
            }
            const response = await fetchOdin(odinEndpoint, PUBLISH_URI, authToken, {
                method: 'POST',
                contentType: 'application/json',
                body: JSON.stringify({
                    paths: chunk,
                    filterReferencesByStatus,
                    workflowModelId: WORKFLOW_MODEL_ID,
                }),
            });
            const data = await parseResponse(response);
            logger.info(JSON.stringify({ event: 'publish-success', chunkSize: chunk.length, retries }));
            return mapItemsToResults(chunk, data, retries);
        } catch (error) {
            if (replicate) csrfTokenCache.token = null;
            lastError = error.message || String(error);
            const statusMatch = lastError.match(/status (\d{3})/);
            const httpStatus = statusMatch ? Number(statusMatch[1]) : 0;
            const refreshCsrf = replicate && httpStatus === 403 && csrfRefreshes === 0;
            const retryable = refreshCsrf || httpStatus === 0 || httpStatus === 429 || httpStatus >= 500;
            logger.warn(JSON.stringify({ event: 'retry', attempt, chunkSize: chunk.length, error: lastError, retryable }));
            if (!retryable) break;
            if (refreshCsrf) {
                csrfRefreshes++;
                continue;
            }
            if (attempt < maxRetries + csrfRefreshes) {
                const delay = Math.min(1000 * Math.pow(2, attempt - csrfRefreshes - 1), 5000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    logger.error(JSON.stringify({ event: 'publish-failed', chunkSize: chunk.length, error: lastError, retries }));
    return chunk.map((path) => ({ path, status: 'failed', reason: lastError, retries }));
}

async function parseResponse(response) {
    if (!response || typeof response.json !== 'function') return {};
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

function mapItemsToResults(chunk, data, retries) {
    const workflowInstanceId = data?.workflowInstanceId;
    const itemsByPath = new Map();
    if (Array.isArray(data?.items)) {
        for (const item of data.items) {
            if (item?.path) itemsByPath.set(item.path, item);
        }
    }
    return chunk.map((path) => {
        const item = itemsByPath.get(path);
        if (!item) {
            return { path, status: 'failed', reason: 'no-response-item', retries, workflowInstanceId };
        }
        const mapped = WORKFLOW_STATUS_MAP[item.status] || { status: 'failed', reason: 'unknown-status' };
        return { path, ...mapped, retries, workflowInstanceId };
    });
}

module.exports = { publishChunk };
