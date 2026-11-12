// Side-effect free helpers: safe to import in Node (io/www) and from lazy
// satellites. The value helpers keep the semantics of @dexter/tacocat-core 1.13.1.
import {
    HEADER_X_REQUEST_ID,
    PROMO_CONTEXT_CANCEL_VALUE,
    TAG_NAME_SERVICE,
} from './constants.js';

export const FETCH_INFO_HEADERS = {
    requestId: HEADER_X_REQUEST_ID,
    etag: 'Etag',
    lastModified: 'Last-Modified',
    serverTiming: 'server-timing',
};

export const setImmediate = (callback) => window.setTimeout(callback);

export const equalsCaseInsensitive = (value1, value2) =>
    String(value1 ?? '').toLowerCase() === String(value2 ?? '').toLowerCase();

export const isNotEmptyString = (value) => typeof value === 'string' && value;

export const isPositiveFiniteNumber = (value) =>
    Number.isFinite(value) && value > 0;

export function toPositiveFiniteInteger(value, defaultValue = 1) {
    if (typeof value !== 'number') value = Number.parseInt(value, 10);
    return isPositiveFiniteNumber(value) ? value : defaultValue;
}

/**
 * Converts `true`/`'true'`/`'1'` and `false`/`'false'`/`'0'` to booleans,
 * anything else to `defaultValue`.
 */
export function toBoolean(value, defaultValue) {
    if (value === true || value === false) return value;
    const string = String(value);
    if (string === '1' || string === 'true') return true;
    if (string === '0' || string === 'false') return false;
    return defaultValue;
}

/**
 * Finds `value` among the values of `enumeration`, ignoring case.
 * Falls back to `defaultValue`, then to the first value of `enumeration`.
 */
export function toEnumeration(value, enumeration, defaultValue) {
    const values = Object.values(enumeration);
    return (
        values.find((candidate) => equalsCaseInsensitive(candidate, value)) ??
        defaultValue ??
        values[0]
    );
}

/** Deletes the properties of `target` holding null, undefined or ''. */
export function omitProperties(target) {
    for (const [key, value] of Object.entries(target)) {
        if (value == null || value === '') delete target[key];
    }
    return target;
}

/** The promotion code to request, `undefined` when unset or cancelled. */
export const toEffectivePromoCode = (code) =>
    code !== PROMO_CONTEXT_CANCEL_VALUE && code?.length > 0 ? code : undefined;

const toKebabCase = (key) =>
    key
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\W+/g, '-')
        .toLowerCase();

/**
 * Creates a reader of page parameters. `read(key, defaults, options)` returns
 * the first value found in: the query string, sessionStorage, localStorage
 * (unless `options.storage` is false), `<meta name="kebab-case-key">` (unless
 * `options.metadata` is false), then `defaults[key]`.
 * A reader parses the query string and collects the metas once, so use one
 * reader for a batch of lookups.
 */
export function createParameterReader() {
    const search = new URLSearchParams(window.location.search);
    let metas;
    return (key, defaults = {}, { metadata = true, storage = true } = {}) => {
        let value = search.get(key);
        if (storage) {
            value ??=
                window.sessionStorage.getItem(key) ??
                window.localStorage.getItem(key);
        }
        if (metadata && value == null) {
            if (!metas) {
                metas = new Map();
                for (const { name, content } of document.querySelectorAll(
                    'meta[name]',
                )) {
                    if (!metas.has(name)) metas.set(name, content);
                }
            }
            value = metas.get(toKebabCase(key));
        }
        return value ?? defaults[key];
    };
}

/** Reads one page parameter, see `createParameterReader`. */
export const getParameter = (key, defaults, options) =>
    createParameterReader()(key, defaults, options);

/**
 * @param {any} value
 * @param {number} defaultValue
 * @returns {number[]}
 */
export function toQuantity(value, defaultValue = 1) {
    if (value == null) return [defaultValue];
    const quantity = (Array.isArray(value) ? value : String(value).split(','))
        .map(toPositiveFiniteInteger)
        .filter(isPositiveFiniteNumber);
    return quantity.length ? quantity : [defaultValue];
}

/**
 * Splits comma-separated promo codes into an array,
 * keeping empty entries for OSI positions without a promo.
 * @param {any} value
 * @returns {string[]}
 */
export function toPromotionCodes(value) {
    if (value == null) return [];
    return Array.isArray(value)
        ? value
        : String(value)
              .split(',')
              .map((code) => code.trim());
}

/**
 * Zips OSI and promo-code lists by position for a soft bundle:
 * osi="A,B,C" promo="P1,,P3" -> A=P1, B=none, C=P3.
 * A single code (no comma) broadcasts to all OSIs.
 * A blank OSI also drops its paired code, so later OSIs keep their own.
 * @param {any} osiValue
 * @param {any} promotionCodeValue
 * @returns {{ wcsOsi: string[], promotionCodes: string[] }}
 */
export function toWcsOsiAndPromotionCodes(osiValue, promotionCodeValue) {
    const codes = toPromotionCodes(promotionCodeValue);
    if (osiValue == null) return { wcsOsi: [], promotionCodes: codes };
    const ids = Array.isArray(osiValue)
        ? osiValue
        : String(osiValue).split(',');
    if (codes.length <= 1) {
        return { wcsOsi: ids.filter(isNotEmptyString), promotionCodes: codes };
    }
    const wcsOsi = [];
    const promotionCodes = [];
    for (const [index, id] of ids.entries()) {
        if (!isNotEmptyString(id)) continue;
        wcsOsi.push(id);
        promotionCodes.push(codes[index] ?? '');
    }
    return { wcsOsi, promotionCodes };
}

/**
 * Returns the active commerce service element, if any.
 * There is no document in Node (io/www), where this returns undefined.
 * @returns {HTMLElement|undefined}
 */
export const getService = () =>
    globalThis.document?.getElementsByTagName(TAG_NAME_SERVICE)[0];

/**
 * Returns headers to be logged
 * @param {Response} response - fetch response
 * @returns {Object}
 */
export function getLogHeaders(response) {
    const logHeaders = {};
    if (!response?.headers) return logHeaders;
    for (const [key, name] of Object.entries(FETCH_INFO_HEADERS)) {
        const value = response.headers.get(name);
        if (value) {
            logHeaders[key] = value
                .replace(/[,;]/g, '|')
                .replace(/[| ]+/g, '|');
        }
    }
    return logHeaders;
}
