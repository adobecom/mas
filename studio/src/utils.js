/**
 * @param {string} input
 * @returns {string}
 */
export function toPascalCase(input) {
    return input.replace(/(\w)(\w*)/g, function (_g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
    });
}

/**
 * @param {any} value1
 * @param {any} value2
 * @returns {boolean}
 */
export function looseEquals(value1, value2) {
    if (!value1 && !value2) return true;
    return value1 == value2;
}

/**
 * @param {(event: Event) => void} fn
 * @returns {(event: Event) => void}
 */
export function preventDefault(fn) {
    return function (event) {
        event.preventDefault();
        fn(event);
    };
}

/**
 * @param {(event: Event) => void} fn
 * @returns {(event: Event) => void}
 */
export function extractValue(fn) {
    return function (event) {
        fn(event.target.value);
    };
}

/**
 * @param {string} param
 * @returns {string | null}
 */
export function getHashParam(param) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    return params.get(param);
}

/**
 * @returns {URLSearchParams}
 */
export function getHashParams() {
    return new URLSearchParams(window.location.hash.slice(1));
}

/**
 * @returns {Record<string, string>}
 */
export function getHashParamsAsObject() {
    const obj = {};
    const params = getHashParams();
    params.forEach((_, key) => {
        obj[key] = params.get(key);
    });
    return obj;
}

/**
 * @param {URLSearchParams} params
 * @param {string} param
 * @param {unknown} value
 */
export function setHashParam(params, param, value) {
    if (!value) {
        if (params.has(param)) {
            params.delete(param);
        }
    } else {
        params.set(param, value);
    }
}

/**
 * @param {URLSearchParams} params
 * @param {Object} source
 */
export function setHashParams(params, source) {
    Object.keys(source).map((key) => {
        setHashParam(params, key, source[key]);
    });
}

/**
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

export class UserFriendlyError extends Error {}

/**
 * Deeply compares two values for equality
 * @param {any} left - First value to compare
 * @param {any} right - Second value to compare
 * @returns {boolean} - True if values are deeply equal
 */
export function deepCompare(left, right) {
    // Handle null/undefined cases
    if (left === null || left === undefined) return left === right;
    if (right === null || right === undefined) return false;

    // Handle primitive types
    if (typeof left !== typeof right) return false;
    if (typeof left !== 'object') return left === right;

    // Handle arrays
    if (Array.isArray(left) && Array.isArray(right)) {
        if (left.length !== right.length) return false;
        return left.every((item, index) => deepCompare(item, right[index]));
    }

    // Handle objects
    if (Array.isArray(left) || Array.isArray(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => {
        if (!right.hasOwnProperty(key)) return false;
        return deepCompare(left[key], right[key]);
    });
}
