const { Core } = require('@adobe/aio-sdk');
const logger = Core.Logger('common', { level: 'info' });

async function postToOdinWithRetry(odinEndpoint, URI, authToken, payload, maxRetries = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await postToOdin(odinEndpoint, URI, authToken, payload);
            return true;
        } catch (error) {
            lastError = error.message || error.toString();
            logger.warn(`Error POSTing ${URI} (attempt ${attempt}/${maxRetries}): ${lastError}`);
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                logger.info(`Waiting ${delay}ms before retry...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
        }
    }
    throw new Error(`Failed to POST to ${URI} after ${maxRetries} attempts: ${lastError}`);
}

function findFieldIndex(fragment, fieldName) {
    const propertyIndex = fragment.fields.findIndex((field) => field.name === fieldName);
    if (propertyIndex === -1) {
        return {};
    }
    return {
        field: fragment.fields[propertyIndex],
        path: `/fields/${propertyIndex}`,
    };
}

/**
 * @param {*} fragment fragment json representation
 * @param {*} property property name to find
 * @returns { path, value}
 */
function getValues(fragment, property) {
    const { field, path } = findFieldIndex(fragment, property);
    return field ? { values: field.values, path } : null;
}

/**
 * @param {*} fragment fragment json representation
 * @param {*} property property name to find
 * @returns { path, value}
 */
function getValue(fragment, property) {
    const { field, path } = findFieldIndex(fragment, property);
    return field ? { value: field.values[0], path } : null;
}

async function postToOdin(odinEndpoint, URI, authToken, payload) {
    return fetchOdin(odinEndpoint, URI, authToken, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

async function fetchFragmentByPath(odinEndpoint, fragmentPath, authToken) {
    let response = null;
    try {
        response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments?path=${fragmentPath}`, authToken, {
            ignoreErrors: [404],
        });
    } catch (error) {
        logger.error(`Error fetching fragment by path ${fragmentPath}: ${error.message}`);
    }
    if (response.status === 404) {
        return { fragment: null, status: 404 };
    }
    if (response.ok) {
        if (response.json) {
            const responseObject = await response.json();
            if (responseObject.items?.length > 0) {
                return { fragment: responseObject.items[0], status: 200 };
            }
        }
        return { fragment: null, status: 404 };
    }
    return { fragment: null, status: response.status, etag: response.headers.get('ETag') };
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
    const startTime = performance.now();
    const path = `${odinEndpoint}${URI}`;
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
        const errorMessage = errorBody && Object.keys(errorBody).length > 0 ? ` - ${JSON.stringify(errorBody)}` : '';
        logger.error(`${method} ${URI}: ${response.status} (${response.statusText}${errorMessage})`);
        throw new Error(`${method} ${URI} failed with status ${response.status}: ${response.statusText}`);
    }
    const duration = (performance.now() - startTime).toFixed(2);
    logger.info(`${method} ${URI}: ${response.status} (${response.statusText}) - ${duration}ms`);
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
    fetchFragmentByPath,
    fetchOdin,
    getValue,
    getValues,
    postToOdinWithRetry,
    processBatchWithConcurrency,
};
