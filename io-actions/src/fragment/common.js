const fetch = require('node-fetch');

function logPrefix(context, type = 'info') {
    return `[${type}][${context.requestId}][${context.transformer}]`;
}

function log(message, context, type) {
    console.log(`${logPrefix(context, type)} ${message}`);
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
        console.error(
            `${logPrefix(context, 'error')}[fetch] ${path} fetch error`,
            e,
        );
    }
    return {
        status: 500,
        message: 'fetch error',
    };
}

module.exports = {
    fetch: internalFetch,
    log,
};
