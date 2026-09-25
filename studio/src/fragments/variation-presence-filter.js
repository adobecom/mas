import { Fragment } from '../aem/fragment.js';
import {
    isPromoVariationPath,
    getPromoNameFromPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from '../promotions/promotion-model.js';

/**
 * Selectable "Has variation?" filter options for the fragment table filter bar.
 * @type {{ id: string, label: string }[]}
 */
export const VARIATION_PRESENCE_OPTIONS = [
    { id: 'has-promo-variation', label: 'Has promo variation' },
    { id: 'has-grouped-variation', label: 'Has grouped variation' },
    { id: 'no-variations', label: 'No variations' },
];

const EMPTY_SET = new Set();

/**
 * Promo variations are their own top-level fragments under a `promotions/<name>/` path and are
 * never added to the parent's `variations` field (createPromoVariation only tags the variation
 * itself), unlike locale/grouped variations. So a card's promo-variation presence can't be read
 * off the card itself — it has to be inferred from sibling promo-variation fragments elsewhere in
 * the same list, resolved back to their default fragment path by path convention.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @returns {Set<string>} default fragment paths that have at least one promo variation among fragmentStores
 */
export function collectPromoVariationDefaultPaths(fragmentStores) {
    const defaultPaths = new Set();
    for (const fs of fragmentStores) {
        const fragment = fs.get?.() ?? fs.value;
        const path = fragment?.path;
        if (!isPromoVariationPath(path)) continue;
        const promoName = getPromoNameFromPromoVariationPath(path);
        if (!promoName) continue;
        for (const candidate of resolveDefaultPathFromPromoVariation(path, promoName)) {
            defaultPaths.add(candidate);
        }
    }
    return defaultPaths;
}

/**
 * Reads promo/grouped/locale variation counts from a fragment.
 *
 * Fragment table list items are search results, which are not hydrated with
 * `references`, so the Fragment API's reference-based counters (getPromoVariationCount,
 * etc.) always read as 0 for them. Classifying by the `variations` field's paths
 * (available on every list item) instead lets grouped/locale detection work against the
 * actual list without requiring reference hydration. Promo variations are never listed in
 * `variations` at all, so their presence is instead looked up from `promoVariationDefaultPaths`
 * (see collectPromoVariationDefaultPaths), keyed by the fragment's own path.
 * @param {*} fragment
 * @param {Set<string>} [promoVariationDefaultPaths]
 * @returns {{ promo: number, grouped: number, locale: number }}
 */
export function getVariationCounts(fragment, promoVariationDefaultPaths = EMPTY_SET) {
    if (!fragment) return { promo: 0, grouped: 0, locale: 0 };
    let counts;
    if (typeof fragment.getVariations === 'function') {
        const variationPaths = fragment.getVariations() || [];
        counts = variationPaths.reduce(
            (acc, path) => {
                if (Fragment.isGroupedVariationPath(path)) acc.grouped++;
                else if (isPromoVariationPath(path)) acc.promo++;
                else acc.locale++;
                return acc;
            },
            { promo: 0, grouped: 0, locale: 0 },
        );
    } else {
        counts = {
            promo: fragment.getPromoVariationCount?.() ?? fragment.listPromoVariations?.()?.length ?? 0,
            grouped: fragment.getGroupedVariationCount?.() ?? fragment.listGroupedVariations?.()?.length ?? 0,
            locale: fragment.getLocaleVariationCount?.() ?? fragment.listLocaleVariations?.()?.length ?? 0,
        };
    }
    if (counts.promo === 0 && fragment.path && promoVariationDefaultPaths.has(fragment.path)) {
        counts.promo = 1;
    }
    return counts;
}

/**
 * Whether a fragment matches the given "Has variation?" option id.
 * @param {*} fragment
 * @param {string} optionId
 * @param {Set<string>} [promoVariationDefaultPaths]
 * @returns {boolean}
 */
export function matchesVariationPresence(fragment, optionId, promoVariationDefaultPaths = EMPTY_SET) {
    const { promo, grouped, locale } = getVariationCounts(fragment, promoVariationDefaultPaths);
    switch (optionId) {
        case 'has-promo-variation':
            return promo > 0;
        case 'has-grouped-variation':
            return grouped > 0;
        case 'no-variations':
            return promo === 0 && grouped === 0 && locale === 0;
        default:
            return true;
    }
}

/**
 * Narrows fragment stores by "Has variation?" presence. Returns the input unchanged
 * when no option is selected (null/undefined/''), so it composes with other filters.
 *
 * Promo-variation presence is resolved from sibling promo-variation fragments within
 * fragmentStores itself, so callers must pass this the list before any step that excludes
 * promo-variation fragments (e.g. the CONTENT page's own-card-only display filter) — otherwise
 * every card would appear to have no promo variation.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {string|null|undefined} optionId
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByVariationPresence(fragmentStores, optionId) {
    if (!optionId) return fragmentStores;
    const promoVariationDefaultPaths = collectPromoVariationDefaultPaths(fragmentStores);
    return fragmentStores.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return matchesVariationPresence(fragment, optionId, promoVariationDefaultPaths);
    });
}
