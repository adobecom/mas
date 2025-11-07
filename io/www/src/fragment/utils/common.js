import { transformBody } from './odinSchemaTransform.js';
import { log, logDebug, logError, getErrorMessage } from '../utils/log.js';

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
    return (context.marks[label] = performance.now().toFixed(2));
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
async function internalFetch(path, context, marker) {
    mark(context, `${marker}`);
    const { retries = 3, fetchTimeout = 2000, retryDelay = 100 } = context.networkConfig || {};
    let delay = retryDelay;
    let response;
    for (let attempt = 0; attempt < retries; attempt++) {
        // Race the fetch promise with a timeout
        response = await fetchAttempt(path, context, fetchTimeout, `fetch-${marker}-${attempt}`);
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

/**
 * get fragment id from odin for a given path
 * @param {*} context
 * @param {*} odinUrl
 * @param {*} mark
 * @returns {id, status}
 */
async function getFragmentId(context, odinUrl, mark) {
    if (context.fragmentsIds) {
        const cachedId = context.fragmentsIds[mark];
        if (cachedId) {
            logDebug(() => `Using cached fragment id for ${mark}: ${cachedId}`, context);
            return {
                id: cachedId,
                status: 200,
            };
        }
    }
    const response = await internalFetch(odinUrl, context, mark);
    if (response.status == 200) {
        const { items } = response.body;
        if (items?.length > 0) {
            const id = items[0].id;
            context.fragmentsIds = context.fragmentsIds || {};
            context.fragmentsIds[mark] = id;
            return {
                id,
                status: 200,
            };
        } else {
            return {
                message: 'Fragment not found',
                status: 404,
            };
        }
    }
    return {
        message: response.message || 'Error fetching fragment id',
        status: 503,
    };
}

/**
 * get default request information either from state cache, or from fetchFragment promise
 * @param {*} context
 * @returns parsedLocale, surface, fragmentPath
 */
async function getRequestInfos(context) {
    let { body, parsedLocale, surface, fragmentPath } = context;
    if (!parsedLocale || !surface || !fragmentPath || !body) {
        const fetchResult = await context.promises?.fetchFragment;
        if (fetchResult) {
            ({ parsedLocale, surface, fragmentPath, body } = fetchResult);
        }
    }
    return { parsedLocale, surface, fragmentPath, body };
}

export {
    createTimeoutPromise,
    internalFetch as fetch,
    getRequestInfos,
    getFragmentId,
    getJsonFromState,
    getFromState,
    mark,
    measureTiming,
};
