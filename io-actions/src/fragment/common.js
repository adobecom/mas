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

async function getErrorMessage(response) {
    let message = 'nok';
    try {
        const json = await response.json();
        message = json?.detail;
    } catch (e) {}
    return message;
}

async function internalFetch(path, context) {
    try {
        const response = await fetch(path, {
            headers: context.DEFAULT_HEADERS,
        });
        const success = response.status == 200;
        const message = success ? 'ok' : await getErrorMessage(response);
        log(
            `fetch ${path} (${response?.status}) ${message}`,
            context,
            success ? 'info' : 'error',
        );
        return response;
    } catch (e) {
        logError(`[fetch] ${path} fetch error: ${e.message}`, context);
    }
    return {
        status: 500,
        message: 'fetch error',
    };
}

module.exports = {
    fetch: internalFetch,
    log,
    logError,
};
