const { Core } = require('@adobe/aio-sdk');
const openwhisk = require('openwhisk');
const logger = Core.Logger('common', { level: 'info' });

const DEFAULT_PACKAGE_NAME = 'MerchAtScaleStudio';
const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;

/**
 * Returns the target path for the given path and locale.
 * Replaces the locale segment in the path with the given locale.
 * @param {string} path - Full fragment path (e.g. /content/dam/mas/surface/locale/fragmentPath)
 * @param {string} locale - Target locale
 * @returns {string|null} Target path or null if path does not match
 */
function getTargetPath(path, locale) {
    const match = path.match(PATH_TOKENS);
    if (!match?.groups) return null;
    const { surface, fragmentPath } = match.groups;
    return `/content/dam/mas/${surface}/${locale}/${fragmentPath}`;
}

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
 * @returns { path, values}
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

/**
 * @param {*} fragment fragment json representation
 * @param {*} property nested property path, e.g. "modified.by"
 * @returns value
 */
function getInternalValue(fragment, property) {
    if (!fragment || !property) {
        return null;
    }

    const segments = property.split('.');
    let value = fragment;
    for (const segment of segments) {
        if (value == null || !Object.prototype.hasOwnProperty.call(value, segment)) {
            return null;
        }
        value = value[segment];
    }

    return value;
}

function buildSiblingActionName(params = {}, targetActionName, options = {}) {
    if (!targetActionName) {
        throw new Error('Target action name is required');
    }

    const overrideParamName = options.overrideParamName;
    if (overrideParamName && params[overrideParamName]) {
        return params[overrideParamName];
    }

    const currentActionName = params.__ow_action_name;
    if (currentActionName) {
        return currentActionName.replace(/[^/]+$/, targetActionName);
    }

    return `${options.defaultPackageName || DEFAULT_PACKAGE_NAME}/${targetActionName}`;
}

function createRuntimeClient(params = {}, options = {}) {
    const openwhiskFactory = options.openwhiskFactory || openwhisk;
    return openwhiskFactory({
        api_key: params.__ow_api_key,
        apihost: params.__ow_api_host,
        namespace: params.__ow_namespace,
    });
}

async function invokeAsyncAction(actionName, actionParams, params = {}, options = {}) {
    const client = options.client || createRuntimeClient(params, options);
    return client.actions.invoke({
        name: actionName,
        params: actionParams,
        blocking: false,
    });
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
    if (response?.status === 404) {
        return { fragment: null, status: 404 };
    }
    if (response?.ok) {
        if (response.json) {
            const responseObject = await response.json();
            if (responseObject.items?.length > 0) {
                const fragment = responseObject.items[0];
                const { etag } = fragment;
                return { fragment, status: 200, etag };
            }
        }
        return { fragment: null, status: 404 };
    }
    return { fragment: null, status: response?.status || 500 };
}

/**
 * Get referencedBy information for given fragment paths
 * @param {string} odinEndpoint - The Odin endpoint URL
 * @param {string[]} paths - Array of fragment paths to check
 * @param {string} authToken - Authentication token
 * @returns {Promise<{parentReferences: Array, status: number}>} Parent references and status
 */
async function getReferencedBy(odinEndpoint, paths, authToken) {
    try {
        const response = await fetchOdin(odinEndpoint, '/adobe/sites/cf/fragments/referencedBy', authToken, {
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({ paths }),
            ignoreErrors: [400, 404, 500],
        });

        if (!response.ok) {
            logger.error(`Error getting referencedBy for paths ${paths.join(', ')}: ${response.status} ${response.statusText}`);
            return { parentReferences: [], status: response.status };
        }

        const data = await response.json();
        logger.info(`referencedBy response: ${JSON.stringify(data)}`);
        const item = data.items?.[0];
        const parentReferences = item?.parentReferences || [];
        return { parentReferences, status: response.status };
    } catch (error) {
        logger.error(`Error getting referencedBy for paths ${paths.join(', ')}: ${error.message}`);
        return { parentReferences: [], status: 500 };
    }
}

/**
 * Get the parent fragment for a variation path
 * Finds the parent fragment whose variations field contains the given variation path
 * @param {string} odinEndpoint - The Odin endpoint URL
 * @param {string} variationPath - The variation fragment path
 * @param {string} authToken - Authentication token
 * @returns {Promise<{parentFragment: Object|null, status: number}>} Parent fragment and status
 */
async function getVariationParent(odinEndpoint, variationPath, authToken) {
    try {
        const { parentReferences: allParentReferences, status } = await getReferencedBy(
            odinEndpoint,
            [variationPath],
            authToken,
        );

        if (status !== 200) {
            logger.warn(`Failed to get referencedBy for ${variationPath}: ${status}`);
            return { parentFragment: null, status };
        }

        const parentReferences = allParentReferences.filter((ref) => ref.type === 'content-fragment');

        // Find the parent whose variations field contains this grouped variation path
        for (const parentRef of parentReferences) {
            const { fragment, status: parentStatus } = await fetchFragmentByPath(odinEndpoint, parentRef.path, authToken);

            if (parentStatus === 200 && fragment) {
                const { values: variations = [] } = getValues(fragment, 'variations') || {};
                if (variations.includes(variationPath)) {
                    return { parentFragment: fragment, status: 200 };
                }
            } else {
                logger.warn(`Failed to fetch parent fragment ${parentRef.path}: ${parentStatus}`);
            }
        }

        return { parentFragment: null, status: 404 };
    } catch (error) {
        logger.error(`Error finding parent for variation ${variationPath}: ${error.message}`);
        return { parentFragment: null, status: 500 };
    }
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
        'User-Agent': 'mas-translation-project',
    };
    if (etag) {
        headers['If-Match'] = etag;
    }
    if (method !== 'GET' && body) {
        headers['Content-Type'] = contentType || 'application/json';
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
    logger.info(
        `${method} ${URI}: ${response.status} (${response.statusText}) (etag: ${response?.headers?.get('etag')}) - ${duration}ms`,
    );
    return response;
}

/**
 * Update a content fragment with a full PUT (title, description, fields).
 * @param {string} odinEndpoint - Odin API base URL
 * @param {string} fragmentId - Fragment ID
 * @param {string} authToken - Bearer token
 * @param {Object} payload - { title, description, fields, etag }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function putToOdin(odinEndpoint, fragmentId, authToken, { title, description, fields, etag }) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}`, authToken, {
        method: 'PUT',
        contentType: 'application/json',
        etag,
        body: JSON.stringify({
            title: title ?? '',
            description: description ?? '',
            fields,
        }),
    });

    if (!response.ok) {
        const message = `PUT request failed for fragment ${fragmentId}: ${response.status}: ${response.statusText}`;
        logger.error(message);
        return { success: false, error: message };
    }

    await response.json();
    return { success: true };
}

/**
 * Patch a content fragment with JSON Patch (e.g. replace a field).
 * @param {string} odinEndpoint - Odin API base URL
 * @param {string} fragmentId - Fragment ID
 * @param {string} authToken - Bearer token
 * @param {Array<{ op: string, path: string, value?: unknown }>} patchBody - JSON Patch operations
 * @param {string|null} [etag] - Optional etag for conditional update
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function patchToOdin(odinEndpoint, fragmentId, authToken, patchBody, etag) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}`, authToken, {
        method: 'PATCH',
        contentType: 'application/json-patch+json',
        etag,
        body: JSON.stringify(patchBody),
    });

    if (!response.ok) {
        const message = `PATCH request failed for fragment ${fragmentId}: ${response.status}: ${response.statusText}`;
        logger.error(message);
        return { success: false, error: message };
    }

    return { success: true };
}

// Helper function to process items in batches with concurrency limit and optional RPS throttle.
// rpsLimit enforces a minimum batch cycle time of (batchSize / rpsLimit) seconds so that the
// sustained request rate never exceeds rpsLimit, regardless of individual request latency.
// onBatchCompleted(batchResults) is called after each batch completes (before the throttle wait).
async function processBatchWithConcurrency(items, batchSize, processor, rpsLimit = null, onBatchCompleted = null) {
    const allResults = [];
    const minBatchMs = rpsLimit ? (batchSize / rpsLimit) * 1000 : 0;

    for (let i = 0; i < items.length; i += batchSize) {
        const batchStart = Date.now();
        const batch = items.slice(i, i + batchSize);
        logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}`);

        const batchResults = await Promise.all(batch.map(processor));
        allResults.push(...batchResults);

        if (onBatchCompleted) await onBatchCompleted(batchResults);

        if (minBatchMs > 0) {
            const wait = minBatchMs - (Date.now() - batchStart);
            if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        }
    }

    return allResults;
}

async function getFragmentWithEtag(odinEndpoint, fragmentId, authToken) {
    const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}`, authToken, {
        method: 'GET',
    });
    const etag = response.headers.get('etag') || response.headers.get('Etag');
    const fragment = await response.json();
    return { fragment, etag };
}

async function deleteFragmentById(odinEndpoint, fragmentId, authToken, etag) {
    await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/${fragmentId}`, authToken, {
        method: 'DELETE',
        etag,
    });
}

module.exports = {
    DEFAULT_PACKAGE_NAME,
    buildSiblingActionName,
    createRuntimeClient,
    fetchFragmentByPath,
    fetchOdin,
    getInternalValue,
    getReferencedBy,
    getTargetPath,
    getValue,
    getValues,
    getVariationParent,
    invokeAsyncAction,
    patchToOdin,
    postToOdinWithRetry,
    processBatchWithConcurrency,
    putToOdin,
    getFragmentWithEtag,
    deleteFragmentById,
};
