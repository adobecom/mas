import { STATUS_PUBLISHED, TAG_PROMOTION_PREFIX } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { UserFriendlyError } from '../utils.js';
import { processConcurrently, VARIATIONS_CONCURRENCY_LIMIT } from '../common/utils/item-loading.js';
import {
    buildPromoVariationPath,
    buildPromoVariationPathForTag,
    getFragmentByPathOrNull,
    getPromoNameFromTag,
    getPromotionTagFromFragment,
    isPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from './promotion-model.js';

/**
 * Creates a promo variation for a default fragment under promotions/{promoName}/.
 * Promo variations are bound by mas:promotion/ tag + deterministic path (not parent variations field).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} sourceFragmentId
 * @param {string} promoTagId
 * @returns {Promise<Object>}
 */
export async function createPromoVariation(aem, sourceFragmentId, promoTagId) {
    const promoName = getPromoNameFromTag(promoTagId);
    if (!promoName) {
        throw new UserFriendlyError('Invalid promotion tag');
    }

    const sourceFragment = await aem.sites.cf.fragments.getById(sourceFragmentId);
    if (!sourceFragment) {
        throw new Error('Failed to fetch source fragment');
    }
    if (isPromoVariationPath(sourceFragment.path)) {
        throw new UserFriendlyError('Cannot create a promo variation from a promo variation');
    }

    const targetPath = buildPromoVariationPath(sourceFragment.path, promoName);
    if (!targetPath) {
        throw new UserFriendlyError('Could not determine promo variation path from fragment path');
    }

    const existingFragment = await getFragmentByPathOrNull(aem.sites.cf.fragments, targetPath);
    if (existingFragment) {
        throw new UserFriendlyError('Promo variation already exists for this fragment in this promotion project.');
    }

    const parentFolder = targetPath.split('/').slice(0, -1).join('/');
    const fragmentName = targetPath.split('/').pop();
    await aem.sites.cf.fragments.ensureFolderExists(parentFolder);

    const csrfToken = await aem.getCsrfToken();
    const createdDraft = await aem.createFragmentCopy(sourceFragment, parentFolder, fragmentName, csrfToken);
    await aem.wait(1000);

    const parentTags = (sourceFragment.tags || [])
        .map((tag) => tag.id || tag)
        .filter((id) => id && !normalizeTagId(id).startsWith(TAG_PROMOTION_PREFIX));
    const variationTags = [...parentTags, normalizeTagId(promoTagId)];
    await aem.saveTags({ ...createdDraft, newTags: variationTags });

    const createdFragment = await aem.sites.cf.fragments.pollCreatedFragment(createdDraft);
    if (!createdFragment) {
        throw new Error('Failed to create promo variation');
    }

    return createdFragment;
}

/**
 * Merges promo variation references into fragment payload references (deduped by path).
 * @param {Object} fragmentData
 * @param {Array<{ id: string, path: string, tags?: unknown[] }>} discovered
 * @returns {Object}
 */
export function mergePromoVariationReferences(fragmentData, discovered) {
    if (!fragmentData || !discovered?.length) return fragmentData;

    const references = [...(fragmentData.references || [])];
    const knownPaths = new Set(references.map((ref) => ref.path));

    for (const ref of discovered) {
        if (!ref?.path || knownPaths.has(ref.path)) continue;
        references.push(ref);
        knownPaths.add(ref.path);
    }

    return { ...fragmentData, references };
}

/**
 * Probes deterministic promo variation paths for known promotion projects (tag + path; not parent variations field).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {Array<Object>} promotionProjects
 * @returns {Promise<Array<{ id: string, path: string, tags?: unknown[] }>>}
 */
export async function probePromoVariationReferences(aem, defaultPath, promotionProjects = []) {
    if (!aem || !defaultPath || isPromoVariationPath(defaultPath) || !promotionProjects.length) return [];

    const refs = await processConcurrently(
        promotionProjects,
        async (project) => {
            const tagId = getPromotionTagFromFragment(project);
            const targetPath = tagId ? buildPromoVariationPathForTag(defaultPath, tagId) : null;
            if (!targetPath) return null;
            const variation = await getFragmentByPathOrNull(aem.sites.cf.fragments, targetPath);
            return variation?.id && variation?.path ? variation : null;
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );
    return refs.filter(Boolean);
}

/**
 * Merges probed promo variation references into a default fragment payload for listPromoVariations().
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} fragmentData
 * @param {Array<Object>} promotionProjects
 * @returns {Promise<Object>}
 */
export async function mergePromoReferencesForDefaultFragment(aem, fragmentData, promotionProjects = []) {
    if (!fragmentData?.path || isPromoVariationPath(fragmentData.path)) return fragmentData;
    const discovered = await probePromoVariationReferences(aem, fragmentData.path, promotionProjects);
    return mergePromoVariationReferences(fragmentData, discovered);
}

/**
 * Resolves the default fragment for a promo variation path.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} promoVariationPath
 * @param {string} [promoVariationId]
 * @returns {Promise<Object|null>}
 */
export async function resolveDefaultFragmentForPromoVariation(aem, promoVariationPath, promoVariationId) {
    let promoTag = null;
    if (promoVariationId) {
        const variation = await aem.sites.cf.fragments.getById(promoVariationId);
        promoTag = getPromotionTagFromFragment(variation);
    }
    const promoName = promoTag ? getPromoNameFromTag(promoTag) : null;
    if (!promoName) return null;
    const parentPath = resolveDefaultPathFromPromoVariation(promoVariationPath, promoName);
    if (!parentPath) return null;
    return getFragmentByPathOrNull(aem.sites.cf.fragments, parentPath);
}

/**
 * Resolves promo variations for fragments attached to a promotion project.
 * Discovered via project promo tag + buildPromoVariationPathForTag (not parent variations field).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @param {{ onlyUnpublished?: boolean }} [options]
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
async function collectAttachedPromoVariations(aem, promotionFragment, { onlyUnpublished = false } = {}) {
    const promotionTagId = getPromotionTagFromFragment(promotionFragment);
    if (!promotionTagId) return [];

    const attachedPaths = Array.from(new Set(promotionFragment?.getFieldValues?.('fragments') || []));
    if (!attachedPaths.length) return [];

    const results = await processConcurrently(
        attachedPaths,
        async (parentPath) => {
            const variationPath = buildPromoVariationPathForTag(parentPath, promotionTagId);
            if (!variationPath) return null;
            const variation = await getFragmentByPathOrNull(aem.sites.cf.fragments, variationPath);
            if (!variation) return null;
            if (onlyUnpublished && variation.status === STATUS_PUBLISHED) return null;
            return {
                id: variation.id,
                path: variationPath,
                status: variation.status,
                title: variation.title,
                model: variation.model,
                parentPath,
            };
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    return results.filter(Boolean);
}

/**
 * Returns unpublished promo variations for fragments attached to a promotion project.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
export async function getUnpublishedAttachedPromoVariations(aem, promotionFragment) {
    return collectAttachedPromoVariations(aem, promotionFragment, { onlyUnpublished: true });
}

/**
 * Returns all promo variations (any status) for fragments attached to a promotion project.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
export async function getAllAttachedPromoVariations(aem, promotionFragment) {
    return collectAttachedPromoVariations(aem, promotionFragment);
}
