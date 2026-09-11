import { PAGE_NAMES } from '../constants.js';
import { fragmentIsPromoVariation, isPromoVariationPath } from '../promotions/promotion-model.js';
import { fragmentHasPersonalizationTag } from '../common/utils/personalization-utils.js';
import { Fragment } from '../aem/fragment.js';

/** "Has variation?" filter values, keyed by the same names used as their Store.filters.variationPresence value. */
export const VARIATION_PRESENCE = Object.freeze({
    PROMO: 'promo',
    GROUPED: 'grouped',
    NONE: 'none',
});

export const VARIATION_PRESENCE_LABELS = Object.freeze({
    [VARIATION_PRESENCE.PROMO]: 'Has promo variation',
    [VARIATION_PRESENCE.GROUPED]: 'Has grouped variation',
    [VARIATION_PRESENCE.NONE]: 'No variations',
});

/** @param {{ getVariations?: () => string[], variations?: string[] }} [fragment] */
function getVariationPaths(fragment) {
    return fragment?.getVariations?.() ?? fragment?.variations ?? [];
}

/** True when at least one of the fragment's `variations` field paths is a promo variation. */
export function fragmentHasPromoVariation(fragment) {
    return getVariationPaths(fragment).some((path) => isPromoVariationPath(path));
}

/** True when at least one of the fragment's `variations` field paths is a grouped (pzn) variation. */
export function fragmentHasGroupedVariation(fragment) {
    return getVariationPaths(fragment).some((path) => Fragment.isGroupedVariationPath(path));
}

/** True when the fragment has no variations of any type. */
export function fragmentHasNoVariations(fragment) {
    if (typeof fragment?.hasVariations === 'function') return !fragment.hasVariations();
    return getVariationPaths(fragment).length === 0;
}

const VARIATION_PRESENCE_PREDICATES = {
    [VARIATION_PRESENCE.PROMO]: fragmentHasPromoVariation,
    [VARIATION_PRESENCE.GROUPED]: fragmentHasGroupedVariation,
    [VARIATION_PRESENCE.NONE]: fragmentHasNoVariations,
};

/**
 * Filters fragment stores by "Has variation?" value. Unset/unknown values return the list unchanged (unfiltered default).
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {string} [variationPresence]
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByVariationPresence(fragmentStores, variationPresence) {
    const predicate = VARIATION_PRESENCE_PREDICATES[variationPresence];
    if (!predicate) return fragmentStores;
    return fragmentStores.filter((fs) => predicate(fs.get?.() ?? fs.value));
}

/**
 * When personalization is off, exclude fragments that carry mas:pzn/… tags except mas:pzn/country/….
 * When on, search omits non-country pzn tags from the API; narrowing by those tags happens in mas-content.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {boolean} personalizationFilterEnabled
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled) {
    if (personalizationFilterEnabled === true) return fragmentStores;
    return fragmentStores.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return !fragmentHasPersonalizationTag(fragment);
    });
}

function filterOutPromoVariationsOnContentPage(fragmentStores, page) {
    if (page !== PAGE_NAMES.CONTENT) return fragmentStores;
    return fragmentStores.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return !fragmentIsPromoVariation(fragment);
    });
}

/**
 * Applies content-list filters (personalization + hide promo variations on CONTENT page + "Has variation?").
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean, variationPresence?: string }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(fragmentStores, { page, personalizationFilterEnabled, variationPresence }) {
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    const filteredByPage = filterOutPromoVariationsOnContentPage(filteredByPersonalization, page);
    return filterStoresByVariationPresence(filteredByPage, variationPresence);
}
