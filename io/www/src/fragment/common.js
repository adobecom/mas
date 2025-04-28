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

async function computeBody(response, context) {
    let body = await response.json();
    if (context.preview && Array.isArray(body.fields)) {
        log('massaging old school schema for preview', context);
        const { fields, id, tags, references } = body;
        body = fields.reduce(
            (acc, { name, multiple, values }) => {
                acc.fields[name] = multiple ? values : values[0];
                return acc;
            },
            { fields: {}, id, tags },
        );
        body.references = references?.reduce((acc, ref) => {
            const fields = ref.fields.reduce((fieldAcc, field) => {
                if (field.name === 'key' || field.name === 'value') {
                    fieldAcc[field.name] = field.values[0];
                } else if (field.name === 'richTextValue') {
                    fieldAcc[field.name] = {
                        mimeType: field.mimeType || 'text/html',
                    };
                }
                return fieldAcc;
            }, {});

            acc[ref.id] = {
                type: ref.type,
                value: {
                    name: ref.name || '',
                    id: ref.id,
                    model: { id: ref.model.id },
                    fields,
                },
            };
            return acc;
        }, {});
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
};
