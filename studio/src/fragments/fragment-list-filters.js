import { PAGE_NAMES } from '../constants.js';
import { fragmentIsPromoVariation } from '../promotions/promotion-model.js';
import { fragmentHasPersonalizationTag } from '../common/utils/personalization-utils.js';
import { filterStoresByVariationPresence } from './variation-presence-filter.js';

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
 * Applies content-list filters (personalization + hide promo variations on CONTENT page + "Has variation?").
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean, variationPresence?: string }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(fragmentStores, { page, personalizationFilterEnabled, variationPresence }) {
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    // Resolve "Has variation?" before excluding promo-variation fragments below: promo presence for
    // a default card is inferred from sibling promo-variation fragments still in the list at this point.
    const narrowedByVariationPresence = filterStoresByVariationPresence(filteredByPersonalization, variationPresence);
    return page !== PAGE_NAMES.CONTENT
        ? narrowedByVariationPresence
        : narrowedByVariationPresence.filter((fs) => {
              const fragment = fs.get?.() ?? fs.value;
              return !fragmentIsPromoVariation(fragment);
          });
}
