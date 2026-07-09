import Store from '../store.js';
import { canProbePromoVariationsForFragment } from './promotion-model.js';
import { mergePromoVariationReferences } from './promotion-variations.js';
import * as promotionVariations from './promotion-variations.js';

const PROMOTIONS_LIST_FETCHED_META = 'listFetched';

/**
 * @returns {Array<Object>}
 */
function readPromotionProjectsFromStore() {
    return (
        Store.promotions.list.data
            .get()
            ?.map((store) => store.get())
            .filter(Boolean) || []
    );
}

/**
 * @param {() => Promise<void>} loadPromotions
 * @returns {Promise<Array<Object>>}
 */
export async function getPromotionProjectsForProbe(loadPromotions) {
    let projects = readPromotionProjectsFromStore();
    if (!projects.length && !Store.promotions.list.data.hasMeta(PROMOTIONS_LIST_FETCHED_META)) {
        await loadPromotions();
        projects = readPromotionProjectsFromStore();
    }
    return projects;
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} fragmentData
 * @param {() => Promise<void>} loadPromotions
 * @returns {Promise<Object>}
 */
export async function mergePromoReferencesIntoFragmentData(aem, fragmentData, loadPromotions) {
    if (!canProbePromoVariationsForFragment(fragmentData)) return fragmentData;
    return promotionVariations.mergePromoReferencesForDefaultFragment(
        aem,
        fragmentData,
        await getPromotionProjectsForProbe(loadPromotions),
    );
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} promoVariationPath
 * @param {string} [promoVariationId]
 * @param {() => Promise<void>} loadPromotions
 * @returns {Promise<Object|null>}
 */
export async function resolveDefaultFragmentForPromoVariation(aem, promoVariationPath, promoVariationId, loadPromotions) {
    const parent = await promotionVariations.resolveDefaultFragmentForPromoVariation(aem, promoVariationPath, promoVariationId);
    if (!parent) return null;
    return mergePromoReferencesIntoFragmentData(aem, parent, loadPromotions);
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
export async function getUnpublishedAttachedPromoVariations(aem, promotionFragment) {
    return promotionVariations.getUnpublishedAttachedPromoVariations(aem, promotionFragment);
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
export async function getAllAttachedPromoVariations(aem, promotionFragment) {
    return promotionVariations.getAllAttachedPromoVariations(aem, promotionFragment);
}

/**
 * @param {string} sourceFragmentId
 * @param {(store: import('../reactivity/fragment-store.js').FragmentStore) => Promise<void>} refreshFragment
 * @returns {(created: Object) => Promise<void>}
 */
export function buildPromoVariationParentRefreshCallback(sourceFragmentId, refreshFragment) {
    return async (createdFragment) => {
        const parentStore = Store.fragments.list.data.get().find((store) => store.get()?.id === sourceFragmentId);
        if (!parentStore) return;
        await refreshFragment(parentStore);
        const parent = parentStore.get();
        if (!parent) return;
        const enriched = mergePromoVariationReferences(parent, [createdFragment]);
        parentStore.refreshFrom(enriched);
    };
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} sourceFragmentId
 * @param {string} promoTagId
 * @param {(store: import('../reactivity/fragment-store.js').FragmentStore) => Promise<void>} [refreshFragment]
 * @returns {Promise<Object>}
 */
export async function createPromoVariation(aem, sourceFragmentId, promoTagId, refreshFragment) {
    const onCreated = refreshFragment ? buildPromoVariationParentRefreshCallback(sourceFragmentId, refreshFragment) : undefined;
    const createdFragment = await promotionVariations.createPromoVariation(aem, sourceFragmentId, promoTagId);
    if (onCreated) await onCreated(createdFragment);
    return createdFragment;
}
