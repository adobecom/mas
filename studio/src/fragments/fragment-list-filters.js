import { PAGE_NAMES } from '../constants.js';
import { fragmentIsPromoVariation } from '../promotions/promotion-model.js';
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

/**
 * Applies content-list filters (personalization + hide promo variations on CONTENT page).
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(fragmentStores, { page, personalizationFilterEnabled }) {
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    if (page !== PAGE_NAMES.CONTENT) return filteredByPersonalization;
    return filteredByPersonalization.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return !fragmentIsPromoVariation(fragment);
    });
}
