import { isPromoVariationPath } from '../promotions/promotion-model.js';

export const VARIATION_PRESENCE = {
    HAS_PROMO_VARIATION: 'has-promo-variation',
    NO_VARIATIONS: 'no-variations',
};

export const VARIATION_PRESENCE_OPTIONS = [
    { id: VARIATION_PRESENCE.HAS_PROMO_VARIATION, title: 'Has promo variation' },
    { id: VARIATION_PRESENCE.NO_VARIATIONS, title: 'No variations' },
];

/**
 * Reads variation paths from either a Fragment instance or a raw AEM search-result item.
 * @param {{ getVariations?: () => string[], fields?: Array<{ name: string, values?: string[] }> }} fragment
 * @returns {string[]}
 */
function getVariationPaths(fragment) {
    if (typeof fragment?.getVariations === 'function') return fragment.getVariations();
    return fragment?.fields?.find((field) => field.name === 'variations')?.values || [];
}

/**
 * Whether a fragment matches the selected "Has variation?" filter values (OR semantics).
 * An empty/absent selection means unfiltered and always matches.
 * @param {{ getVariations?: () => string[], fields?: Array<{ name: string, values?: string[] }> }} fragment
 * @param {string[]} [selected]
 * @returns {boolean}
 */
export function matchesVariationPresence(fragment, selected) {
    if (!selected?.length) return true;
    const variations = getVariationPaths(fragment);
    return selected.some((value) => {
        if (value === VARIATION_PRESENCE.HAS_PROMO_VARIATION) return variations.some(isPromoVariationPath);
        if (value === VARIATION_PRESENCE.NO_VARIATIONS) return variations.length === 0;
        return false;
    });
}
