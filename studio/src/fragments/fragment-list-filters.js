import { PAGE_NAMES } from '../constants.js';
import { fragmentIsPromoVariation, isPromoVariationPath } from '../promotions/promotion-model.js';
import { Fragment } from '../aem/fragment.js';
import { VARIATION_FILTER } from './variation-filter.js';
import { fragmentHasPersonalizationTag } from '../common/utils/personalization-utils.js';

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

function getVariationPaths(fragment) {
    return (
        fragment.getFieldValues?.('variations') ?? fragment.fields?.find((field) => field.name === 'variations')?.values ?? []
    );
}

function hasPromoVariation(fragment, promoParentPaths) {
    return promoParentPaths?.has(fragment.path) || (fragment.references || []).some((ref) => isPromoVariationPath(ref.path));
}

/**
 * Keeps the cards that match the "Variations" filter.
 * Promo variations are not listed in the `variations` field, so promo parents come from a separate lookup.
 * Selecting promo and grouped matches either type; none excludes variations of every type, including regional.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {string|undefined} variation comma-separated VARIATION_FILTER values, falsy for no filtering
 * @param {Set<string>} [promoParentPaths] paths of cards that have promo variations
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByVariation(fragmentStores, variation, promoParentPaths) {
    if (!variation) return fragmentStores;
    const selected = variation.split(',');
    return fragmentStores.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        const variationPaths = getVariationPaths(fragment);
        if (selected.includes(VARIATION_FILTER.NONE)) {
            return variationPaths.length === 0 && !hasPromoVariation(fragment, promoParentPaths);
        }
        return (
            (selected.includes(VARIATION_FILTER.PROMO) && hasPromoVariation(fragment, promoParentPaths)) ||
            (selected.includes(VARIATION_FILTER.GROUPED) &&
                variationPaths.some((path) => Fragment.isGroupedVariationPath(path)))
        );
    });
}

/**
 * Applies content-list filters (personalization + hide promo variations and variation presence on CONTENT page).
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean, variation?: string, promoParentPaths?: Set<string> }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(fragmentStores, { page, personalizationFilterEnabled, variation, promoParentPaths }) {
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    if (page !== PAGE_NAMES.CONTENT) return filteredByPersonalization;
    const withoutPromoVariations = filteredByPersonalization.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return !fragmentIsPromoVariation(fragment);
    });
    return filterStoresByVariation(withoutPromoVariations, variation, promoParentPaths);
}
