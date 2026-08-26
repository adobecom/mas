import Store from '../store.js';
import { canProbePromoVariationsForFragment, getPromotionTagFromFragment, isPromoVariationPath } from './promotion-model.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
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
 * @param {Array<Object>} projects
 * @param {string} promoTagId
 * @returns {Object|undefined}
 */
function findProjectByTag(projects, promoTagId) {
    const normalized = normalizeTagId(promoTagId);
    return projects.find((candidate) => getPromotionTagFromFragment(candidate) === normalized);
}

/**
 * @param {Object|undefined} project
 * @returns {string[]}
 */
function getAttachedFragmentPaths(project) {
    return project?.getFieldValues?.('fragments') ?? [];
}

/**
 * @param {Array<Object>} projects
 * @param {string} promoTagId
 * @returns {string[]}
 */
function getAttachedFragmentPathsForTag(projects, promoTagId) {
    return getAttachedFragmentPaths(findProjectByTag(projects, promoTagId));
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
    if (!canProbePromoVariationsForFragment(fragmentData)) return { ...fragmentData, promoVariationProbeNotNeeded: true };
    const merged = await promotionVariations.mergePromoReferencesForDefaultFragment(
        aem,
        fragmentData,
        await getPromotionProjectsForProbe(loadPromotions),
    );
    return { ...merged, promoVariationProbeNotNeeded: true };
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} promoVariationPath
 * @param {string} [promoVariationId]
 * @param {() => Promise<void>} loadPromotions
 * @returns {Promise<Object|null>}
 */
export async function resolveDefaultFragmentForPromoVariation(aem, promoVariationPath, promoVariationId, loadPromotions) {
    const projects = await getPromotionProjectsForProbe(loadPromotions);
    let attachedFragmentPaths = [];
    if (promoVariationId) {
        const variation = await aem.sites.cf.fragments.getById(promoVariationId);
        const promoTag = getPromotionTagFromFragment(variation);
        if (promoTag) attachedFragmentPaths = getAttachedFragmentPathsForTag(projects, promoTag);
    }
    const parent = await promotionVariations.resolveDefaultFragmentForPromoVariation(
        aem,
        promoVariationPath,
        promoVariationId,
        attachedFragmentPaths,
    );
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
export async function getPublishedAttachedPromoVariations(aem, promotionFragment) {
    return promotionVariations.getPublishedAttachedPromoVariations(aem, promotionFragment);
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
 * @param {string[]} [geoTags]
 * @param {(store: import('../reactivity/fragment-store.js').FragmentStore) => Promise<void>} [refreshFragment]
 * @param {() => Promise<void>} [loadPromotions]
 * @returns {Promise<Object>}
 */
export async function createPromoVariation(aem, sourceFragmentId, promoTagId, geoTags = [], refreshFragment, loadPromotions) {
    const projects = await getPromotionProjectsForProbe(loadPromotions);
    const attachedFragmentPaths = getAttachedFragmentPathsForTag(projects, promoTagId);
    const onCreated = refreshFragment ? buildPromoVariationParentRefreshCallback(sourceFragmentId, refreshFragment) : undefined;
    const createdFragment = await promotionVariations.createPromoVariation(
        aem,
        sourceFragmentId,
        promoTagId,
        geoTags,
        attachedFragmentPaths,
    );
    if (onCreated) await onCreated(createdFragment);
    return createdFragment;
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {string} promoTagId
 * @returns {Promise<Array<{ path: string, index: number, id: string, pznTags: string[] }>>}
 */
export async function probePromoVariationsForFragment(aem, defaultPath, promoTagId) {
    return promotionVariations.probePromoVariationsForFragment(aem, defaultPath, promoTagId);
}

/**
 * @param {Object|undefined} project
 * @returns {string[]|undefined} the project's configured geos, or undefined when the project
 * has none configured (skips project-containment validation rather than blocking every geo)
 */
function getProjectGeos(project) {
    const geos = project?.getFieldValues?.('geos') ?? [];
    return geos.length ? geos : undefined;
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} fragment - the promo variation fragment being saved
 * @param {string[]} geoTags - the pznTags currently set on the fragment
 * @param {() => Promise<void>} [loadPromotions]
 * @returns {Promise<void>}
 */
export async function assertPromoVariationGeoTagsValid(aem, fragment, geoTags, loadPromotions) {
    if (!isPromoVariationPath(fragment.path)) return;

    const promoTagId = getPromotionTagFromFragment(fragment);
    if (!promoTagId) return;

    const projects = await getPromotionProjectsForProbe(loadPromotions);
    const project = findProjectByTag(projects, promoTagId);
    const attachedFragmentPaths = getAttachedFragmentPaths(project);
    const defaultFragment = await promotionVariations.resolveDefaultFragmentForPromoVariation(
        aem,
        fragment.path,
        fragment.id,
        attachedFragmentPaths,
    );
    if (!defaultFragment) return;

    const siblings = await promotionVariations.probePromoVariationsForFragment(aem, defaultFragment.path, promoTagId);
    const existingVariations = siblings.filter((variation) => variation.id !== fragment.id);
    promotionVariations.assertPromoVariationGeoTagsValid(existingVariations, geoTags, getProjectGeos(project));
}
