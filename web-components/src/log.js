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
const filters = new Set();
const loggerIndexes = new Map();

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

const debugFilter = { filter: ({ level }) => level !== Level.DEBUG };
const quietFilter = { filter: () => false };

export function createLog(namespace) {
    const index = (loggerIndexes.get(namespace) ?? 0) + 1;
    loggerIndexes.set(namespace, index);
    const source = `${namespace} #${index}`;
    const method =
        (level) =>
        (message, ...params) => {
            if (
                !appenders.size ||
                (level === Level.DEBUG && filters.has(debugFilter.filter))
            ) {
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
            for (const filter of filters) if (!filter(entry)) return;
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

/** Adds plugins: objects with an `append(entry)` and/or a `filter(entry)` method. */
function use(...plugins) {
    for (const { append, filter } of plugins) {
        if (append) appenders.add(append);
        if (filter) filters.add(filter);
    }
}

/**
 * Debug entries are logged to the console with `?commerce.debug=true` (also
 * read from storage and metadata) or on a local host env, and dropped otherwise.
 * Errors go to Lana on a prod host env.
 */
function init({ name } = {}) {
    const debug = toBoolean(getParameter('commerce.debug'), name === 'local');
    use(debug ? consoleAppender : debugFilter);
    if (name === 'prod') use(lanaAppender);
    return Log;
}

function reset() {
    appenders.clear();
    filters.clear();
}

export const Log = {
    ...createLog(LOG_NAMESPACE),
    Level,
    Plugins: { consoleAppender, debugFilter, quietFilter, lanaAppender },
    init,
    reset,
    use,
};
