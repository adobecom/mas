const { Core } = require('@adobe/aio-sdk');
const logger = Core.Logger('common', { level: 'info' });

async function postToOdin(odinEndpoint, URI, authToken, payload) {
    return fetchOdin(odinEndpoint, URI, authToken, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * common function to fetch from Odin with error handling
 *
 * @param {*} odinEndpoint
 * @param {*} URI
 * @param {*} authToken
 * @param {*} options.method
 * @param {*} options.body
 * @param {*} options.etag
 * @param {*} options.ignoreErrors list of HTTP status codes method should forward without throwing an error
 * @throws Error when response is not ok and status code is not in ignoreErrors
 * @returns response object
 */
async function fetchOdin(
    odinEndpoint,
    URI,
    authToken,
    { method = 'GET', body = null, contentType = null, etag = null, ignoreErrors = [] } = {},
) {
    const path = `${odinEndpoint}${URI}`;
    logger.info(`fetching ${path}`);
    const headers = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': contentType || 'application/json',
    };
    if (etag) {
        headers['If-Match'] = etag;
    }
    const response = await fetch(path, {
        headers,
        method,
        body,
    });
    if (!response.ok && !ignoreErrors.includes(response.status)) {
        let errorBody = {};
        try {
            errorBody = await response.json();
        } catch (e) {
            // Response body is not valid JSON, use empty object
        }
        logger.error(`Failed to fetch translation project: ${response.status} ${response.statusText}`);
        logger.error(`Error body: ${JSON.stringify(errorBody, null, 2)}`);
        throw new Error(`Failed to fetch translation project: ${response.status} ${response.statusText}`);
    }
    logger.info(`${URI}: ${response.status} (${response.statusText})`);
    return response;
}

// Helper function to process items in batches with concurrency limit
async function processBatchWithConcurrency(items, batchSize, processor) {
    const allResults = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}`);

        const batchResults = await Promise.all(batch.map(processor));
        allResults.push(...batchResults);
    }

    return allResults;
}

module.exports = {
    postToOdin,
    fetchOdin,
    processBatchWithConcurrency,
};
