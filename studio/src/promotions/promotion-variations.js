import { STATUS_PUBLISHED, STATUS_DRAFT, TAG_PROMOTION_PREFIX } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { UserFriendlyError } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { processConcurrently, VARIATIONS_CONCURRENCY_LIMIT } from '../common/utils/item-loading.js';
import {
    buildCandidateCollisionPath,
    buildPromoVariationPath,
    buildPromoVariationPathForTag,
    getFragmentByPathOrNull,
    getPromoNameFromTag,
    getPromotionTagFromFragment,
    isPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from './promotion-model.js';

// Max variations allowed per fragment to prevent runaway loops.
export const MAX_PROMO_VARIATIONS_PER_FRAGMENT = 50;

/**
 * Extracts 'pznTags' values from a raw fragment payload.
 * @param {{ fields?: Array<{ name?: string, values?: unknown[] }> }} fragment
 * @returns {string[]}
 */
function readPznTags(fragment) {
    return fragment?.fields?.find((field) => field.name === 'pznTags')?.values || [];
}

/**
 * Sequentially probes and returns all existing promo variations for a given fragment.
 * Stops at the first missing index.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {string} promoTagId
 * @returns {Promise<Array<{ path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array }>>}
 */
export async function probePromoVariationsForFragment(aem, defaultPath, promoTagId) {
    if (!aem || !defaultPath || !promoTagId) return [];
    const found = [];
    for (let index = 1; index <= MAX_PROMO_VARIATIONS_PER_FRAGMENT; index += 1) {
        const suffixIndex = index === 1 ? undefined : index;
        const targetPath = buildPromoVariationPathForTag(defaultPath, promoTagId, suffixIndex);
        if (!targetPath) break;
        const variation = await getFragmentByPathOrNull(aem.sites.cf.fragments, targetPath);
        if (!variation?.id) break;
        found.push({
            path: targetPath,
            index,
            id: variation.id,
            pznTags: readPznTags(variation),
            status: variation.status,
            title: variation.title,
            model: variation.model,
            fields: variation.fields,
            tags: variation.tags,
        });
    }
    return found;
}

/**
 * Collects the geo tags already claimed by sibling promo variations. A sibling with no
 * pznTags of its own predates per-variation geo scoping and is a geo-less fallback
 * variation — it does not claim any geo, so it never blocks a new geo-specific sibling.
 * @param {Array<{ pznTags: string[] }>} existingVariations
 * @returns {string[]}
 */
export function getUsedGeoTags(existingVariations) {
    return existingVariations.flatMap((variation) => variation.pznTags || []);
}

/**
 * @param {Array<{ pznTags: string[] }>} existingVariations
 * @param {string[]} newGeoTags
 * @returns {string[]}
 */
export function findOverlappingGeoTags(existingVariations, newGeoTags) {
    const used = new Set(getUsedGeoTags(existingVariations));
    return (newGeoTags || []).filter((tag) => used.has(tag));
}

/**
 * Finds the next available variation index, ensuring it doesn't conflict with
 * other fragments attached to the same promotion project.
 * @param {number} existingCount
 * @param {string} defaultPath
 * @param {string[]} attachedFragmentPaths
 * @returns {number}
 */
export function getNextAvailablePromoVariationIndex(existingCount, defaultPath, attachedFragmentPaths = []) {
    const attachedSet = new Set(attachedFragmentPaths);
    for (let index = existingCount + 1; index <= MAX_PROMO_VARIATIONS_PER_FRAGMENT; index += 1) {
        if (index === 1) return index;
        const collisionPath = buildCandidateCollisionPath(defaultPath, index);
        if (!collisionPath || !attachedSet.has(collisionPath)) return index;
    }
    throw new UserFriendlyError('Too many promo variations for this fragment');
}

/**
 * Creates a promo variation for a fragment inside promotions/{promoName}/.
 * Supports multiple variations per fragment using unique geo/locale tags (`pznTags`).
 * Adds a numeric suffix ("-<index>") to the path for any subsequent variations to avoid collisions.
 * Cannot create variations from existing promo or grouped variations.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} sourceFragmentId
 * @param {string} promoTagId
 * @param {string[]} [geoTags]
 * @param {string[]} [attachedFragmentPaths]
 * @returns {Promise<Object>}
 */
export async function createPromoVariation(aem, sourceFragmentId, promoTagId, geoTags = [], attachedFragmentPaths = []) {
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
    if (Fragment.isGroupedVariationPath(sourceFragment.path)) {
        throw new UserFriendlyError('Cannot create a promo variation from a grouped variation');
    }

    const existingVariations = await probePromoVariationsForFragment(aem, sourceFragment.path, promoTagId);
    if (!geoTags.length && existingVariations.some((variation) => !variation.pznTags?.length)) {
        throw new UserFriendlyError('A variation with no geos already exists for this project.');
    }
    const overlapping = findOverlappingGeoTags(existingVariations, geoTags);
    if (overlapping.length) {
        throw new UserFriendlyError(
            `These geos are already used by another variation of this fragment: ${overlapping.join(', ')}`,
        );
    }

    const nextIndex = getNextAvailablePromoVariationIndex(
        existingVariations.length,
        sourceFragment.path,
        attachedFragmentPaths,
    );
    const suffixIndex = nextIndex === 1 ? undefined : nextIndex;
    const targetPath = buildPromoVariationPathForTag(sourceFragment.path, promoTagId, suffixIndex);
    if (!targetPath) {
        throw new UserFriendlyError('Could not determine promo variation path from fragment path');
    }

    const parentFolder = targetPath.split('/').slice(0, -1).join('/');
    const fragmentName = targetPath.split('/').pop();
    await aem.sites.cf.fragments.ensureFolderExists(parentFolder);

    const fieldsWithGeoTags = (sourceFragment.fields || []).filter((field) => field.name !== 'pznTags');
    if (geoTags.length) {
        fieldsWithGeoTags.push({ name: 'pznTags', type: 'tag', multiple: true, values: geoTags });
    }
    const fragmentForCopy = { ...sourceFragment, fields: fieldsWithGeoTags };

    const csrfToken = await aem.getCsrfToken();
    const createdDraft = await aem.createFragmentCopy(fragmentForCopy, parentFolder, fragmentName, csrfToken);
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
 * Probes every promo variation path for known promotion projects (tag + path; not parent variations field).
 * A single project can have more than one geo-specific variation, so each project is probed for all indices.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {Array<Object>} promotionProjects
 * @returns {Promise<Array<{ id: string, path: string, tags?: unknown[] }>>}
 */
export async function probePromoVariationReferences(aem, defaultPath, promotionProjects = []) {
    if (!aem || !defaultPath || isPromoVariationPath(defaultPath) || !promotionProjects.length) return [];

    const refsPerProject = await processConcurrently(
        promotionProjects,
        async (project) => {
            const tagId = getPromotionTagFromFragment(project);
            if (!tagId) return [];
            return probePromoVariationsForFragment(aem, defaultPath, tagId);
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );
    return refsPerProject.flat();
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
 * Resolves the source default fragment for a given promo variation path.
 * Uses `attachedFragmentPaths` to prioritize the correct candidate path if the leaf has a numeric suffix,
 * falling back to the first candidate that exists in AEM.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} promoVariationPath
 * @param {string} [promoVariationId]
 * @param {string[]} [attachedFragmentPaths]
 * @returns {Promise<Object|null>}
 */
export async function resolveDefaultFragmentForPromoVariation(
    aem,
    promoVariationPath,
    promoVariationId,
    attachedFragmentPaths = [],
) {
    let promoTag = null;
    if (promoVariationId) {
        const variation = await aem.sites.cf.fragments.getById(promoVariationId);
        promoTag = getPromotionTagFromFragment(variation);
    }
    const promoName = promoTag ? getPromoNameFromTag(promoTag) : null;
    if (!promoName) return null;

    const candidates = resolveDefaultPathFromPromoVariation(promoVariationPath, promoName);
    if (!candidates.length) return null;

    const attachedSet = new Set(attachedFragmentPaths);
    const orderedCandidates = [...candidates].sort((a, b) => Number(attachedSet.has(b)) - Number(attachedSet.has(a)));

    for (const candidate of orderedCandidates) {
        const fragment = await getFragmentByPathOrNull(aem.sites.cf.fragments, candidate);
        if (fragment) return fragment;
    }
    return null;
}

/**
 * Resolves promo variations for fragments attached to a promotion project.
 * Discovered via project promo tag + buildPromoVariationPathForTag (not parent variations field).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @param {{ onlyUnpublished?: boolean, onlyPublished?: boolean }} [options]
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string, fields: Array, tags: Array }>>}
 */
async function collectAttachedPromoVariations(aem, promotionFragment, { onlyUnpublished = false, onlyPublished = false } = {}) {
    const promotionTagId = getPromotionTagFromFragment(promotionFragment);
    if (!promotionTagId) return [];

    const attachedPaths = Array.from(new Set(promotionFragment.getFieldValues?.('fragments') || []));
    if (!attachedPaths.length) return [];

    const resultsPerPath = await processConcurrently(
        attachedPaths,
        async (parentPath) => {
            const variations = await probePromoVariationsForFragment(aem, parentPath, promotionTagId);
            return variations
                .filter((variation) => {
                    if (onlyUnpublished) return variation.status !== STATUS_PUBLISHED;
                    if (onlyPublished) return variation.status !== STATUS_DRAFT;
                    return true;
                })
                .map((variation) => ({ ...variation, parentPath }));
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    return resultsPerPath.flat();
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
 * Returns published promo variations for fragments attached to a promotion project.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
export async function getPublishedAttachedPromoVariations(aem, promotionFragment) {
    return collectAttachedPromoVariations(aem, promotionFragment, { onlyPublished: true });
}

/**
 * Deletes every promo variation attached to a promotion project's fragments, regardless of status.
 * Live variations (PUBLISHED or MODIFIED) are unpublished first.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<void>}
 */
export async function deleteAttachedPromoVariations(aem, promotionFragment) {
    const variations = await collectAttachedPromoVariations(aem, promotionFragment);
    for (const variation of variations) {
        try {
            if (variation.status !== STATUS_DRAFT) {
                const variationWithEtag = await aem.sites.cf.fragments.getWithEtag(variation.id);
                if (variationWithEtag) await aem.sites.cf.fragments.unpublish(variationWithEtag);
            }
            await aem.sites.cf.fragments.forceDelete({ path: variation.path });
        } catch (error) {
            console.error(`Failed to delete promo variation ${variation.path}:`, error);
        }
    }
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
