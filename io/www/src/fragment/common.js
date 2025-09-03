const fetch = require('node-fetch');
const { transformBody } = require('./odinSchemaTransform.js');

function logPrefix(context, type = 'info') {
    return `[${type}][${context.api_key}][${context.requestId}][${context.id}][${context.locale}][${context.transformer}]`;
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
    let message = response.message ?? 'nok';
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
        body = transformBody(body);
    }
    return body;
}

function createTimeoutPromise(timeout, handler) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            const error = new Error(`Request timed out after ${timeout}ms`);
            error.isTimeout = true;
            handler?.(error);
            reject(error);
        }, timeout);
    });
}

function mark(context, label) {
    context.marks = context.marks || {};
    context.marks[label] = performance.now().toFixed(2);
}

function measureTiming(context, label, startLabel = label) {
    const measure = { label, duration: 0 };
    if (context.marks && context.marks[startLabel]) {
        const start = context.marks.start;
        measure.startTime = (context.marks[startLabel] - start).toFixed(2);
        measure.duration = (performance.now() - context.marks[startLabel]).toFixed(2);
    }
    context.measures = context.measures || [];
    context.measures.push(measure);
    return measure;
}

/**
 * fetch attempt with a timeout
 * @param {*} path
 * @param {*} context
 * @param {*} timeout
 * @returns response with status, out of which status 200 is success, 503 is fetch error, 504 is timeout,
 * other errors code from the server
 */
async function fetchAttempt(path, context, timeout, marker) {
    try {
        mark(context, marker);
        const responsePromise = fetch(path, {
            headers: context.DEFAULT_HEADERS,
        });

        // Race the fetch promise with a timeout
        const response = await Promise.race([responsePromise, createTimeoutPromise(timeout)]);
        const measure = measureTiming(context, marker);
        const success = response.status === 200;
        response.message = success ? 'ok' : response.message || (await getErrorMessage(response));
        log(
            `fetch ${path} (${response?.status}) ${response?.message} in ${measure.duration}ms`,
            context,
            success ? 'info' : 'error',
        );
        logDebug(() => `response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`, context);
        if (success) {
            return {
                status: 200,
                message: 'ok',
                body: await computeBody(response, context),
            };
        }
        return response;
    } catch (e) {
        const errorMeasure = measureTiming(context, `fetch-error-${marker}`, marker);
        // Check if this is a timeout error
        if (e.isTimeout) {
            logError(`[fetch] ${path} timed out after ${errorMeasure.duration}ms`, context);
            return {
                ...context,
                status: 504, // Request Timeout
                message: 'fetch timeout',
            };
        }

        // This is a fetch error (network, DNS, etc.)
        logError(`[fetch] ${path} fetch error: ${e.message} after ${errorMeasure.duration}ms`, context);
        return {
            ...context,
            status: 503,
            message: 'fetch error',
        };
    }
}

/**
 * fetches a path with retries and timeout
 * @param {*} path
 * @param {*} context
 * @param {*} timeout
 * @param {*} retries
 */
async function internalFetch(path, context, marker = '') {
    mark(context, `${marker}`);
    const { retries = 3, fetchTimeout = 2000, retryDelay = 100 } = context.networkConfig || {};
    let delay = retryDelay;
    let response;
    for (let attempt = 0; attempt < retries; attempt++) {
        // Race the fetch promise with a timeout
        response = await fetchAttempt(path, context, fetchTimeout, `${marker}-${attempt}`);
        if ([503, 504].includes(response.status)) {
            log(
                `fetch ${path} (attempt #${attempt}) failed with status ${response.status}, retrying in ${delay}ms...`,
                context,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        } else {
            break;
        }
    }
    measureTiming(context, `main-fetch-${marker}`, marker);
    return response;
}

async function getFromState(key, context) {
    mark(context, `state-${key}`);
    const value = (await context?.state?.get(key))?.value;
    measureTiming(context, `state-${key}`);
    return value;
}

async function getJsonFromState(key, context) {
    const str = await getFromState(key, context);
    if (str) {
        try {
            return { str, json: JSON.parse(str) };
        } catch (e) {
            logError(`Error parsing cached ${key}->${str}: ${e.message}`, context);
        }
    }
    return { str: null, json: null };
}

module.exports = {
    createTimeoutPromise,
    fetch: internalFetch,
    getErrorContext,
    getJsonFromState,
    getFromState,
    log,
    logDebug,
    logError,
    mark,
    measureTiming,
};
