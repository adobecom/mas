function logPrefix(context, type = 'info') {
    return `[${type}][${context.api_key}][${context.requestId}][${context.id}][${context.locale}][${context.loggedTransformer}]`;
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
        status: response?.status || 503,
        message: await getErrorMessage(response),
    };
}

async function getErrorMessage(response) {
    let message = response?.message ?? 'nok';
    try {
        const json = await response?.json();
        message = json?.detail;
    } catch (e) {}
    return message;
}

export { log, logDebug, logError, getErrorContext, getErrorMessage };
