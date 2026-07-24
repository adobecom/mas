import {
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    COMPARE_CHART_FIELD,
    MAS_PRODUCT_CODE_PREFIX,
    TAG_PROMOTION_PREFIX,
    STATUS_PUBLISHED,
    TAG_MERCH_CARD,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD_COLLECTION,
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
} from './constants.js';
import { VARIANTS } from './editors/variant-picker.js';
import Events from './events.js';
import { MAS_ROOT, PATH_TOKENS } from '../../io/www/src/fragment/utils/paths.js';

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

/**
 * Shared UUID pattern used for fragment-id searches.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UserFriendlyError extends Error {}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isUUID(value) {
    return UUID_REGEX.test(value);
}

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

function getWebComponentName(fragment) {
    if (fragment?.model?.path === COLLECTION_MODEL_PATH && hasNonEmptyCompareChart(fragment)) {
        return 'mas-compare-chart';
    }
    return MODEL_WEB_COMPONENT_MAPPING[fragment?.model?.path];
}

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
                product_code:
                    fragment?.getCurrentTagTitle?.(MAS_PRODUCT_CODE_PREFIX) || fragment?.getTagTitle?.('mas:product/'),
                promotion: fragment?.getCurrentTagTitle?.(TAG_PROMOTION_PREFIX),
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
            fragmentParts = `${surface}${buildPart(props.variantLabel)}${buildPart(props.customerSegment)}${buildPart(props.marketSegment)}${buildPart(props.product_code)}${buildPart(props.promotion)}`;
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
    const webComponentName = getWebComponentName(fragment);
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
    const href = buildStudioFragmentHref({
        webComponentName,
        fragmentId: fragment?.id,
        page,
        path,
    });
    const linkText = fragment?.title ? `${authorPath} : ${fragment.title}` : authorPath;
    const richText = `<a href="${href}" target="_blank">${linkText}</a>`;
    return { authorPath, code, richText, href };
}

function buildStudioFragmentHref({ webComponentName, fragmentId, page, path, fieldName }) {
    const params = new URLSearchParams();
    params.set('content-type', webComponentName);
    if (page) params.set('page', page);
    if (path) params.set('path', path);
    if (fragmentId) params.set('query', fragmentId);
    if (fieldName) params.set('field', fieldName);
    return `https://mas.adobe.com/studio.html#${params.toString()}`;
}

/**
 * Cards deep link for a merch card or merch-card-collection
 * @param {{ id: string, model?: { path?: string } }} fragment
 * @param {string} [path] surface path
 * @param {string} [page] hash page param
 * @returns {string | null}
 */
export function buildCardsDeepLink(fragment, path, page = 'content') {
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[fragment?.model?.path];
    if (!webComponentName || !fragment?.id) return null;
    return buildStudioFragmentHref({ webComponentName, fragmentId: fragment.id, page, path });
}

/**
 * Parses pasted multi-line URLs
 * @param {string} text
 * @returns {{ contentType: string, fragmentId: string }[]}
 */
export function parseStudioDeepLinksFromText(text) {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split(/\s+/).filter(Boolean);
    const out = [];
    for (const line of lines) {
        const hashIdx = line.indexOf('#');
        if (hashIdx === -1) continue;
        try {
            const params = new URLSearchParams(line.slice(hashIdx + 1));
            const contentType = params.get('content-type');
            const query = params.get('query');
            if (!query || !isUUID(query)) continue;
            if (contentType !== 'merch-card' && contentType !== 'merch-card-collection' && contentType !== 'mas-compare-chart')
                continue;
            out.push({ contentType, fragmentId: query });
        } catch {
            /* skip invalid entries */
        }
    }
    return out;
}

/**
 * Generates a rich link for a single fragment field.
 * Used by the "Copy Field" sidebar button to produce a clipboard entry
 * that pastes as a clickable "alias → fieldName" link in SharePoint.
 * @param {object} fragment - The AEM content fragment
 * @param {string} path - The current surface path (e.g. "/acom")
 * @param {string} page - The current Studio page (e.g. "content")
 * @param {string} fieldName - The field to link to (e.g. "prices", "description")
 * @param {string} fieldNameText - Alternative value for fieldName
 * @returns {{ displayText: string, href: string, richText: string } | null}
 */
export function generateFieldLink(fragment, path, page, fieldName, fieldNameText) {
    const resolvedFieldName = fieldName ?? page;
    const resolvedPage = fieldName ? page : 'content';
    const { fragmentParts } = getFragmentPartsToUse(fragment, path);
    const webComponentName = getWebComponentName(fragment);
    if (!webComponentName) return null;
    const displayText = `mas-field: ${fragmentParts} → ${fieldNameText ?? resolvedFieldName}`;
    const href = buildStudioFragmentHref({
        webComponentName,
        fragmentId: fragment?.id,
        page: resolvedPage,
        path,
        fieldName: resolvedFieldName,
    });
    const richText = `<a href="${href}" target="_blank">${displayText}</a>`;
    return { displayText, href, richText };
}

export function generateJsonLdLink(fragment, path, page) {
    const { fragmentParts } = getFragmentPartsToUse(fragment, path);
    const webComponentName = getWebComponentName(fragment);
    if (!webComponentName) return null;
    const displayText = `mas-field: ${fragmentParts} → jsonLdSchema`;
    const baseHref = buildStudioFragmentHref({
        webComponentName,
        fragmentId: fragment?.id,
        page: page ?? 'content',
        path,
    });
    const href = `${baseHref}&jsonld=on`;
    const richText = `<a href="${href}" target="_blank">${displayText}</a>`;
    return { displayText, href, richText };
}

// --- Copy Field display helpers ---

/**
 * Converts a camelCase field name to Title Case.
 * e.g. "cardTitle" → "Card Title", "borderColor" → "Border Color"
 * @param {string} name
 * @returns {string}
 */
export function camelToTitle(name) {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/**
 * Strips HTML tags from a string, returning the text content.
 * @param {string} value
 * @returns {string}
 */
export function stripHtml(value) {
    return new DOMParser().parseFromString(value, 'text/html').body.textContent || '';
}

/**
 * Returns a preview of the first value in an array.
 * HTML is stripped except {@html <s>} tags (strikethrough prices).
 * @param {any[]} values
 * @returns {string}
 */
export function previewValue(values) {
    const raw = values?.[0] ?? '';
    if (!raw) return '';
    if (typeof raw !== 'string' || !raw.includes('<')) return String(raw);
    // Strip all HTML except <s> tags used for strikethrough prices.
    return raw.replace(/<(?!\/?s\b)[^>]+>/g, '');
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
 * Builds the error message for a failed project create, distinguishing a
 * duplicate-name conflict (HTTP 409) from other failures.
 * @param {Error} error - The error thrown by repository.createFragment
 * @returns {string}
 */
export function getCreateProjectErrorMessage(error) {
    return error?.message?.includes(': 409') ? 'Project with this name already exists.' : 'Failed to create project.';
}

/**
 * Extracts the surface from a fragment path
 * Path format: /content/dam/mas/{surface}/{locale}/{fragment-name}
 * @param {string} fragmentPath - The full AEM fragment path
 * @returns {string | null} - The surface (e.g., 'acom') or null if not found
 */
export function extractSurfaceFromPath(fragmentPath) {
    if (!fragmentPath) return null;
    const match = fragmentPath.match(PATH_TOKENS);
    return match?.groups?.surface ?? null;
}

/**
 * Extracts the locale code from a fragment path
 * Path format: /content/dam/mas/{surface}/{locale}/{fragment-name}
 * @param {string} fragmentPath - The full AEM fragment path
 * @returns {string | null} - The locale code (e.g., 'en_US') or null if not found
 */
export function extractLocaleFromPath(fragmentPath) {
    if (!fragmentPath) return null;
    const match = fragmentPath.match(PATH_TOKENS);
    return match?.groups?.parsedLocale ?? null;
}

export function previewFragmentOnPage(fragment) {
    if (!fragment?.id) return;

    const locale = extractLocaleFromPath(fragment.path);
    const type = fragment?.model?.path === CARD_MODEL_PATH ? 'merch-card' : 'merch-card-collection';
    const hostname = fragment?.status === STATUS_PUBLISHED ? 'milo.adobe.com' : 'main--milo--adobecom.aem.page';
    window.open(
        `https://${hostname}/merch/mas/preview?fragment-id=${fragment?.id}&content-type=${type}&locale=${locale}`,
        '_blank',
    );
}

/**
 * Builds a fragment path with the locale segment replaced (e.g. for fil_PH check).
 * Uses PATH_TOKENS from paths.js so the path shape is the single source of truth.
 * Path format: /content/dam/mas/{surface}/{locale}/{fragment-path}
 * @param {string} fragmentPath - The full AEM fragment path
 * @param {string} newLocale - The new locale code (e.g. 'fil_PH')
 * @returns {string | null} - The path with locale replaced, or null if path does not match PATH_TOKENS
 */
export function replaceLocaleInPath(fragmentPath, newLocale) {
    if (!fragmentPath || !newLocale) return null;
    const match = fragmentPath.match(PATH_TOKENS);
    if (!match?.groups) return null;
    const { surface, fragmentPath: fragmentPathSuffix } = match.groups;
    return `${MAS_ROOT}/${surface}/${newLocale}/${fragmentPathSuffix}`;
}

export function deepEquals(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function hasNonEmptyCompareChart(item) {
    const values =
        item?.getFieldValues?.(COMPARE_CHART_FIELD) ||
        item?.getField?.(COMPARE_CHART_FIELD)?.values ||
        item?.fields?.find((field) => field.name === COMPARE_CHART_FIELD)?.values ||
        [];
    return values.some((value) => {
        if (typeof value === 'string') return value.trim() !== '';
        return value !== null && value !== undefined && value !== '';
    });
}

export function matchesContentTypeFilter(contentTypes, item) {
    if (!contentTypes.length) return true;
    const modelPath = item?.model?.path;
    if (modelPath === CARD_MODEL_PATH) return contentTypes.includes(TAG_MERCH_CARD);
    if (modelPath === COLLECTION_MODEL_PATH) {
        const isCompareChart = hasNonEmptyCompareChart(item);
        return isCompareChart ? contentTypes.includes(TAG_COMPARE_CHART) : contentTypes.includes(TAG_MERCH_CARD_COLLECTION);
    }
    return false;
}

export function resolveContentTypeFilters(tags) {
    const contentTypes = tags.filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE));
    const modelIds = [
        ...new Set(
            contentTypes
                .map((tag) =>
                    tag === TAG_COMPARE_CHART ? TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION] : TAG_MODEL_ID_MAPPING[tag],
                )
                .filter(Boolean),
        ),
    ];
    return { contentTypes, modelIds };
}

/**
 * Runs `load` only when `computeKey()` differs from the last run — skips
 * redundant re-fetches when the derived data would come out the same.
 * @returns {(options: {
 *   guard: () => boolean,
 *   computeKey: () => unknown,
 *   load: () => Promise<unknown>,
 *   apply: (result: unknown) => void,
 *   reset?: () => void,
 * }) => Promise<void>}
 */
export function createKeyedAsyncLoader() {
    let lastKey = null;
    return async function runIfNeeded({ guard, computeKey, load, apply, reset }) {
        if (!guard()) {
            lastKey = null;
            reset?.();
            return;
        }
        const key = computeKey();
        if (lastKey === key) return;
        lastKey = key;
        apply(await load());
    };
}
