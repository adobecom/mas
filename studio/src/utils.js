import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TAG_PROMOTION_PREFIX } from './constants.js';
import { VARIANTS } from './editors/variant-picker.js';
import Events from './events.js';

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

/**
 * Normalizes a string to be used as a key or fragment name
 * Converts to lowercase, replaces spaces with hyphens, and removes special characters
 * @param {string} str - The string to normalize
 * @returns {string} - The normalized string
 */
export function normalizeKey(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

/**
 * Returns the fragment mapping for a given variant
 * @param {string} variant
 * @returns {object | null}
 */
export function getFragmentMapping(variant) {
    const merchCardCustomElement = customElements.get('merch-card');
    if (!merchCardCustomElement) return null;
    return merchCardCustomElement.getFragmentMapping(variant);
}

export function getService() {
    return document.querySelector('mas-commerce-service');
}

export const MODEL_WEB_COMPONENT_MAPPING = {
    [CARD_MODEL_PATH]: 'merch-card',
    [COLLECTION_MODEL_PATH]: 'merch-card-collection',
};

export function getFragmentPartsToUse(fragment, path) {
    let fragmentParts = '';
    let title = '';
    const surface = path?.toUpperCase();
    switch (fragment?.model?.path) {
        case CARD_MODEL_PATH:
            const props = {
                cardName: fragment?.getField('name')?.values[0],
                cardTitle: fragment?.getField('cardTitle')?.values[0],
                variantCode: fragment?.getField('variant')?.values[0],
                marketSegment: fragment?.getTagTitle('market_segment'),
                customerSegment: fragment?.getTagTitle('customer_segment'),
                product: fragment?.getTagTitle('mas:product/'),
                promotion: fragment?.getTagTitle(TAG_PROMOTION_PREFIX),
            };

            VARIANTS.forEach((variant) => {
                if (variant.value === props.variantCode) {
                    props.variantLabel = variant.label;
                }
            });
            const buildPart = (part) => {
                if (part) return ` / ${part}`;
                return '';
            };
            fragmentParts = `${surface}${buildPart(props.variantLabel)}${buildPart(props.customerSegment)}${buildPart(props.marketSegment)}${buildPart(props.product)}${buildPart(props.promotion)}`;
            title = props.cardTitle;
            break;
        case COLLECTION_MODEL_PATH:
            title = fragment?.title;
            fragmentParts = `${surface} / ${title}`;
            break;
    }
    return { fragmentParts, title };
}

export function generateCodeToUse(fragment, path, page, failMessage) {
    const { fragmentParts, title } = getFragmentPartsToUse(fragment, path);
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[fragment?.model?.path];
    if (!webComponentName) {
        if (failMessage)
            Events.toast.emit({
                variant: 'negative',
                content: 'Failed to copy code to clipboard',
            });
        return [];
    }

    const code = `<${webComponentName}><aem-fragment fragment="${fragment?.id}" title="${title}"></aem-fragment></${webComponentName}>`;
    const authorPath = `${webComponentName}: ${fragmentParts}`;
    const href = `https://mas.adobe.com/studio.html#content-type=${webComponentName}&page=${page}&path=${path}&query=${fragment?.id}`;
    const richText = `<a href="${href}" target="_blank">${authorPath}</a>`;
    return { authorPath, code, richText, href };
}

export function generateFieldLink(fragment, path, fieldName) {
    const { fragmentParts } = getFragmentPartsToUse(fragment, path);
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[fragment?.model?.path];
    if (!webComponentName) return null;
    const alias = fragmentParts
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const displayText = `${alias} → ${fieldName}`;
    const href = `https://mas.adobe.com/studio.html#content-type=${webComponentName}&fragment=${fragment?.id}&field=${fieldName}`;
    const richText = `<a href="${href}">${displayText}</a>`;
    return { displayText, href, richText };
}

/*
 * Helper method to show toast messages with consistent formatting
 * @param {string} message - The message to display
 * @param {string} variant - The toast variant (positive, negative, info)
 */
export function showToast(message, variant = 'info') {
    Events.toast.emit({
        variant,
        content: message,
    });
}

/**
 * Extracts the locale code from a fragment path
 * Path format: /content/dam/mas/{surface}/{locale}/{fragment-name}
 * @param {string} fragmentPath - The full AEM fragment path
 * @returns {string | null} - The locale code (e.g., 'en_US') or null if not found
 */
export function extractLocaleFromPath(fragmentPath) {
    if (!fragmentPath) return null;
    const parts = fragmentPath.split('/');
    const localePattern = /^[a-z]{2}_[A-Z]{2,}$/;
    return parts.find((part) => localePattern.test(part)) || null;
}

/**
 * Copies text to clipboard
 * @param {Event} e - The event object
 * @param {string} text - The text to copy
 */
export async function copyToClipboard(e, text) {
    e.stopPropagation();
    if (!text) {
        showToast('No text to copy', 'negative');
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'positive');
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Failed to copy', 'negative');
    }
}
