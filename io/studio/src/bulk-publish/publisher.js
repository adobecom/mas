const { fetchOdin, fetchFragmentByPath } = require('../common.js');
const { isAlreadyPublished } = require('./skip-check.js');

const PUBLISH_URI = '/adobe/sites/cf/fragments/publish';
const DEFAULT_MAX_RETRIES = 3;
const WORKFLOW_MODEL_ID = '/var/workflow/models/scheduled_activation_with_references';

async function publishPath({ path, odinEndpoint, authToken, logger, maxRetries = DEFAULT_MAX_RETRIES }) {
    logger.info(JSON.stringify({ event: 'fetch-metadata', path }));
    const { fragment, status, etag } = await fetchFragmentByPath(odinEndpoint, path, authToken);

    if (status === 404 || !fragment) {
        logger.error(JSON.stringify({ event: 'fragment-not-found', path, status }));
        return { path, status: 'failed', reason: 'not-found', httpStatus: status, retries: 0 };
    }

    const decision = isAlreadyPublished(fragment);
    if (decision.skip) {
        logger.info(
            JSON.stringify({
                event: 'skip',
                path,
                reason: decision.reason,
                publishedAt: decision.publishedAt,
                modifiedAt: decision.modifiedAt,
            }),
        );
        return { path, status: 'skipped', reason: decision.reason, retries: 0 };
    }

    logger.info(JSON.stringify({ event: 'publish-start', path, fragmentId: fragment.id }));
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await fetchOdin(odinEndpoint, PUBLISH_URI, authToken, {
                method: 'POST',
                contentType: 'application/json',
                etag,
                body: JSON.stringify({
                    paths: [fragment.path],
                    filterReferencesByStatus: ['DRAFT', 'UNPUBLISHED'],
                    workflowModelId: WORKFLOW_MODEL_ID,
                }),
            });
            logger.info(JSON.stringify({ event: 'publish-success', path, retries: attempt - 1 }));
            return { path, status: 'published', retries: attempt - 1 };
        } catch (error) {
            lastError = error.message || String(error);
            logger.warn(JSON.stringify({ event: 'retry', path, attempt, error: lastError }));
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    logger.error(JSON.stringify({ event: 'publish-failed', path, error: lastError, retries: maxRetries - 1 }));
    return { path, status: 'failed', reason: lastError, retries: maxRetries - 1 };
}

module.exports = { publishPath };
