import { MAS_PRODUCT_CODE_PREFIX } from '../constants.js';

/**
 * Normalizes tag references to short "mas:path/to/tag" form
 * @param {string|{id?: string, path?: string}} tag
 * @returns {string}
 */
export function normalizeTagId(tag) {
    const rawValue = typeof tag === 'string' ? tag : tag?.id || tag?.path || '';
    if (!rawValue) return '';

    if (rawValue.startsWith('/content/cq:tags/')) {
        const match = rawValue.match(/\/content\/cq:tags\/([^/]+)\/(.+)$/);
        return match ? `${match[1]}:${match[2]}` : '';
    }

    return rawValue;
}

/**
 * Formats product_code tag title with PAC suffix when a nested leaf is selected
 * @param {string} title
 * @param {string} matchingId - normalized tag id starting with mas:product_code/
 * @returns {string|undefined}
 */
export function formatProductCodeNestedTitle(title, matchingId) {
    const productCodePath = matchingId.replace(MAS_PRODUCT_CODE_PREFIX, '');
    const parts = productCodePath.split('/').filter(Boolean);

    if (parts.length > 1) {
        const pac = parts[parts.length - 1]?.toUpperCase();
        if (title && pac) return `${title} (${pac})`;
    }
    return undefined;
}
