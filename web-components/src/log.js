import { LOG_NAMESPACE } from './constants.js';
import { lanaAppender } from './lana.js';
import { getParameter, toBoolean } from './utilities.js';

const Level = {
    DEBUG: 'debug',
    ERROR: 'error',
    INFO: 'info',
    WARN: 'warn',
};

const appenders = new Set();
const loggerIndexes = new Map();
let debugEnabled = false;

// Basic console logging for development
const consoleAppender = {
    append({ level, message, params, timestamp, source }) {
        console[level](
            `${timestamp}ms [${source}] %c${message}`,
            'font-weight: bold;',
            ...params,
        );
    },
};

export function createLog(namespace) {
    const index = (loggerIndexes.get(namespace) ?? 0) + 1;
    loggerIndexes.set(namespace, index);
    const source = `${namespace} #${index}`;
    const method =
        (level) =>
        (message, ...params) => {
            if (!appenders.size || (level === Level.DEBUG && !debugEnabled)) {
                return;
            }
            const timestamp = performance.now().toFixed(3);
            const entry = {
                level,
                message,
                namespace,
                params,
                source,
                timestamp,
            };
            for (const append of appenders) append(entry);
        };
    return {
        id: source,
        namespace,
        module: (name) => createLog(`${namespace}/${name}`),
        debug: method(Level.DEBUG),
        error: method(Level.ERROR),
        info: method(Level.INFO),
        warn: method(Level.WARN),
    };
}

/** Adds appenders: objects with an `append(entry)` method. */
function use(...plugins) {
    for (const { append } of plugins) appenders.add(append);
}

/**
 * Debug entries are logged to the console with `?commerce.debug=true` (also
 * read from storage and metadata) or on a local host env, and dropped otherwise.
 * Errors go to Lana on a prod host env.
 */
function init({ name } = {}) {
    debugEnabled = toBoolean(getParameter('commerce.debug'), name === 'local');
    if (debugEnabled) use(consoleAppender);
    if (name === 'prod') use(lanaAppender);
    return Log;
}

function reset() {
    appenders.clear();
    debugEnabled = false;
}

export const Log = {
    ...createLog(LOG_NAMESPACE),
    Level,
    Plugins: { consoleAppender, lanaAppender },
    init,
    reset,
    use,
};
