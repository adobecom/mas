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
// Kept in sync by hand with the same constant + `-N` suffix convention in
// io/www/src/fragment/transformers/customize.js (separate runtime, no shared import).
export const MAX_PROMO_VARIATIONS_PER_FRAGMENT = 50;

// Page size for folder search cursor (generator still walks all pages).
const VARIATION_SEARCH_PAGE_SIZE = 50;

/**
 * Extracts 'pznTags' values from a raw fragment payload.
 * @param {{ fields?: Array<{ name?: string, values?: unknown[] }> }} fragment
 * @returns {string[]}
 */
function readPznTags(fragment) {
    return fragment?.fields?.find((field) => field.name === 'pznTags')?.values || [];
}

/**
 * Escapes regex metacharacters so a path segment can be used as a literal match inside a RegExp.
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Computes the folder to search and the leaf-matching pattern for a fragment's promo variations.
 * @param {string} defaultPath
 * @param {string} promoTagId
 * @returns {{ parentFolder: string, leafName: string, leafPattern: RegExp }|null}
 */
function computeProbeTarget(defaultPath, promoTagId) {
    const basePath = buildPromoVariationPathForTag(defaultPath, promoTagId);
    if (!basePath) return null;
    const parentFolder = basePath.split('/').slice(0, -1).join('/');
    const leafName = basePath.split('/').pop();
    const leafPattern = new RegExp(`^${escapeRegExp(leafName)}(?:-(\\d+))?$`);
    return { parentFolder, leafName, leafPattern };
}

/**
 * Matches a search item to a fragment's leaf pattern, returning a normalized variation or null.
 * Rejects sibling leaf names (e.g., "card-2" as a separate fragment, not a variation of "card").
 * @param {Object} variation
 * @param {RegExp} leafPattern
 * @param {string} ownLeafName
 * @param {Set<string>} siblingLeafNames
 * @returns {{ path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array }|null}
 */
function matchProbedVariation(variation, leafPattern, ownLeafName, siblingLeafNames) {
    const itemLeaf = variation?.path?.split('/').pop();
    const match = itemLeaf && leafPattern.exec(itemLeaf);
    if (!match || !variation?.id) return null;
    if (itemLeaf !== ownLeafName && siblingLeafNames.has(itemLeaf)) return null;
    const index = match[1] ? Number(match[1]) : 1;
    if (index < 1 || index > MAX_PROMO_VARIATIONS_PER_FRAGMENT) return null;
    return {
        path: variation.path,
        index,
        id: variation.id,
        pznTags: readPznTags(variation),
        status: variation.status,
        title: variation.title,
        model: variation.model,
        fields: variation.fields,
        tags: variation.tags,
    };
}

/**
 * Probes promo variations for fragments with the same promo tag.
 * Fragments sharing a parent folder are scanned in a single search (ordered by index ascending).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string[]} defaultPaths
 * @param {string} promoTagId
 * @returns {Promise<Map<string, Array<{ path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array }>>>}
 */
export async function probePromoVariationsForFragments(aem, defaultPaths, promoTagId) {
    const resultsByPath = new Map((defaultPaths || []).map((defaultPath) => [defaultPath, []]));
    if (!aem || !promoTagId || !defaultPaths?.length) return resultsByPath;

    const targetsByPath = new Map();
    const pathsByFolder = new Map();
    for (const defaultPath of defaultPaths) {
        const target = computeProbeTarget(defaultPath, promoTagId);
        if (!target) continue;
        targetsByPath.set(defaultPath, target);
        const pathsInFolder = pathsByFolder.get(target.parentFolder) ?? [];
        pathsInFolder.push(defaultPath);
        pathsByFolder.set(target.parentFolder, pathsInFolder);
    }

    await processConcurrently(
        [...pathsByFolder.entries()],
        async ([parentFolder, pathsInFolder]) => {
            const rawResults = [];
            for await (const batch of aem.sites.cf.fragments.search({ path: parentFolder }, VARIATION_SEARCH_PAGE_SIZE)) {
                rawResults.push(...batch);
            }
            const siblingLeafNames = new Set(pathsInFolder.map((path) => targetsByPath.get(path).leafName));
            for (const defaultPath of pathsInFolder) {
                const { leafName, leafPattern } = targetsByPath.get(defaultPath);
                const matched = rawResults
                    .map((variation) => matchProbedVariation(variation, leafPattern, leafName, siblingLeafNames))
                    .filter(Boolean)
                    .sort((a, b) => a.index - b.index);
                resultsByPath.set(defaultPath, matched);
            }
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    return resultsByPath;
}

/**
 * Probes all promo variations for a single fragment via paginated folder search (sorted by index).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {string} promoTagId
 * @returns {Promise<Array<{ path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array }>>}
 */
export async function probePromoVariationsForFragment(aem, defaultPath, promoTagId) {
    if (!aem || !defaultPath || !promoTagId) return [];
    const resultsByPath = await probePromoVariationsForFragments(aem, [defaultPath], promoTagId);
    return resultsByPath.get(defaultPath) || [];
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
 * Finds the next available index: skips indices already used by sibling variations (gaps
 * allowed) and any that would collide with another fragment in the same project.
 * @param {number[]} usedIndices
 * @param {string} defaultPath
 * @param {string[]} attachedFragmentPaths
 * @returns {number}
 */
export function getNextAvailablePromoVariationIndex(usedIndices, defaultPath, attachedFragmentPaths = []) {
    const usedSet = new Set(usedIndices);
    const attachedSet = new Set(attachedFragmentPaths);
    for (let index = 1; index <= MAX_PROMO_VARIATIONS_PER_FRAGMENT; index += 1) {
        if (usedSet.has(index)) continue;
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
        existingVariations.map((variation) => variation.index),
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

const NUMERIC_SUFFIX_LEAF = /-\d+$/;

/**
 * Ranks a candidate default path: an attached path wins outright; otherwise prefer a leaf
 * with no numeric suffix (a suffix is usually the variation's own leaf name, e.g.
 * "my-card-2", not a coincidentally-named default).
 * @param {string} candidate
 * @param {Set<string>} attachedSet
 * @returns {number}
 */
function rankDefaultCandidate(candidate, attachedSet) {
    if (attachedSet.has(candidate)) return 2;
    return NUMERIC_SUFFIX_LEAF.test(candidate) ? 0 : 1;
}

/**
 * Resolves the source default fragment for a promo variation path: prefers an attached
 * path, then the non-suffixed candidate, then the first candidate that exists in AEM.
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
    const orderedCandidates = [...candidates].sort(
        (a, b) => rankDefaultCandidate(b, attachedSet) - rankDefaultCandidate(a, attachedSet),
    );

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

    const variationsByPath = await probePromoVariationsForFragments(aem, attachedPaths, promotionTagId);

    return attachedPaths.flatMap((parentPath) =>
        (variationsByPath.get(parentPath) || [])
            .filter((variation) => {
                if (onlyUnpublished) return variation.status !== STATUS_PUBLISHED;
                if (onlyPublished) return variation.status !== STATUS_DRAFT;
                return true;
            })
            .map((variation) => ({ ...variation, parentPath })),
    );
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
 * Returns all promo variations (any status) for fragments attached to a promotion project.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} promotionFragment
 * @returns {Promise<Array<{ path: string, status: string, title: string, parentPath: string }>>}
 */
export async function getAllAttachedPromoVariations(aem, promotionFragment) {
    return collectAttachedPromoVariations(aem, promotionFragment);
}
