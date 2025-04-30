const fetch = require('node-fetch');

function logPrefix(context, type = 'info') {
    return `[${type}][${context.api_key}][${context.requestId}][${context.transformer}]`;
}

function log(message, context) {
    console.log(`${logPrefix(context)} ${message}`);
}

function logError(message, context) {
    console.error(`${logPrefix(context, 'error')} ${message}`);
}

function logDebug(getMessage, context) {
    if (context.debugLogs) {
        console.log(`${logPrefix(context, 'debug')} ${getMessage()}`);
    }
}

async function getErrorContext(response) {
    return {
        status: response.status,
        message: await getErrorMessage(response),
    };
}
async function getErrorMessage(response) {
    let message = 'nok';
    try {
        const json = await response.json();
        message = json?.detail;
    } catch (e) {}
    return message;
}

function transformFields(body) {
    const { fields, id, tags, references } = body;
    const transformedBody = fields.reduce(
        (acc, { name, multiple, values }) => {
            acc.fields[name] = multiple ? values : values[0];
            return acc;
        },
        { fields: {}, id, tags, references },
    );
    return transformedBody;
}

const REFERENCE_FIELDS = ['cards', 'collections', 'tags', 'entries'];
function collectReferences(fields, references) {
    if (!fields) return [];
    const referencesTree = [];
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        // Handle array of references (like cards or collections)
        if (REFERENCE_FIELDS.includes(fieldName) && Array.isArray(fieldValue)) {
            fieldValue.forEach((id) => {
                if (references[id]) {
                    const ref = {
                        fieldName,
                        identifier: id,
                        referencesTree: [],
                    }
                    const nestedRef = references[id];
                    if (nestedRef.type === 'content-fragment') {
                        ref.referencesTree = collectReferences(
                            nestedRef.value.fields,
                            references,
                        );
                    }
                    referencesTree.push(ref);
                }
            });
        }
    }
    return referencesTree;
}

async function computeBody(response, context) {
    let body = await response.json();
    if (context.preview && Array.isArray(body.fields)) {
        log('massaging old school schema for preview', context);
        body = transformFields(body);
        body = collectReferences(body.fields, body.references);
    }
    return body;
}

async function internalFetch(path, context) {
    try {
        const start = Date.now();
        const response = await fetch(path, {
            headers: context.DEFAULT_HEADERS,
        });
        const success = response.status == 200;
        const message = success ? 'ok' : await getErrorMessage(response);
        log(
            `fetch ${path} (${response?.status}) ${message} in ${Date.now() - start}ms`,
            context,
            success ? 'info' : 'error',
        );
        logDebug(
            () =>
                `response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`,
            context,
        );
        if (response.status === 200) {
            return {
                status: 200,
                body: await computeBody(response, context),
            };
        }
        return response;
    } catch (e) {
        logError(`[fetch] ${path} fetch error: ${e.message}`, context);
    }
    return {
        ...context,
        status: 500,
        message: 'fetch error',
    };
}

module.exports = {
    fetch: internalFetch,
    getErrorContext,
    log,
    logDebug,
    logError,
    collectReferences,
};
