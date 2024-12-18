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
