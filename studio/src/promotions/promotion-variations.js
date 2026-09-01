import { PATH_TOKENS, STATUS_PUBLISHED, STATUS_DRAFT, TAG_PROMOTION_PREFIX, PZN_FOLDER } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { UserFriendlyError, resolveHydratedParentFragment } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { createPreviewDataWithParent } from '../reactivity/source-fragment-store.js';
import { processConcurrently, VARIATIONS_CONCURRENCY_LIMIT } from '../common/utils/item-loading.js';
import {
    buildCandidateCollisionPath,
    buildPromoVariationPath,
    buildPromoVariationPathForTag,
    buildPromotionsRootPath,
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
 * Matches a variation search result to its owning default path by full-path identity.
 * The exact variation base path is index 1; a trailing "-N" is a suffixed sibling variation.
 * Exact-base match takes precedence, so a card literally named "…-N" claims its own path
 * rather than being mis-attributed as a suffixed variation of "…".
 * @param {Object} variation
 * @param {Map<string, string>} baseToDefaultPath - variation base path -> owning default path
 * @returns {{ defaultPath: string, variation: { path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array } }|null}
 */
function matchVariationByBasePath(variation, baseToDefaultPath) {
    const path = variation?.path;
    if (!path || !variation?.id) return null;
    let defaultPath = baseToDefaultPath.get(path);
    let index = 1;
    if (!defaultPath) {
        const suffixMatch = /^(.*)-(\d+)$/.exec(path);
        if (!suffixMatch) return null;
        defaultPath = baseToDefaultPath.get(suffixMatch[1]);
        if (!defaultPath) return null;
        index = Number(suffixMatch[2]);
    }
    if (index < 1 || index > MAX_PROMO_VARIATIONS_PER_FRAGMENT) return null;
    return {
        defaultPath,
        variation: {
            path,
            index,
            id: variation.id,
            pznTags: readPznTags(variation),
            status: variation.status,
            title: variation.title,
            model: variation.model,
            fields: variation.fields,
            tags: variation.tags,
        },
    };
}

/**
 * Probes promo variations for fragments with the same promo tag.
 * Every variation for a project lives under one promotions/{promoName} subtree, so a single
 * recursive folder search covers all fragments regardless of how deeply their paths nest —
 * one request (plus pagination) per surface/locale root instead of one per parent folder.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string[]} defaultPaths
 * @param {string} promoTagId
 * @returns {Promise<Map<string, Array<{ path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array }>>>}
 */
export async function probePromoVariationsForFragments(aem, defaultPaths, promoTagId) {
    const resultsByPath = new Map((defaultPaths || []).map((defaultPath) => [defaultPath, []]));
    if (!aem || !promoTagId || !defaultPaths?.length) return resultsByPath;
    const promoName = getPromoNameFromTag(promoTagId);
    if (!promoName) return resultsByPath;

    const baseToDefaultPath = new Map();
    const pathsByRoot = new Map();
    for (const defaultPath of defaultPaths) {
        const basePath = buildPromoVariationPath(defaultPath, promoName);
        const promotionsRoot = buildPromotionsRootPath(defaultPath);
        if (!basePath || !promotionsRoot) continue;
        baseToDefaultPath.set(basePath, defaultPath);
        const promoRoot = `${promotionsRoot}/${promoName}`;
        if (!pathsByRoot.has(promoRoot)) pathsByRoot.set(promoRoot, true);
    }

    await processConcurrently(
        [...pathsByRoot.keys()],
        async (promoRoot) => {
            for await (const batch of aem.sites.cf.fragments.search({ path: promoRoot }, VARIATION_SEARCH_PAGE_SIZE)) {
                for (const variation of batch) {
                    const matched = matchVariationByBasePath(variation, baseToDefaultPath);
                    if (matched) resultsByPath.get(matched.defaultPath).push(matched.variation);
                }
            }
        },
        VARIATIONS_CONCURRENCY_LIMIT,
    );

    for (const variations of resultsByPath.values()) {
        variations.sort((a, b) => a.index - b.index);
    }
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
 * Creates a promo variation for a fragment (default or grouped variation) inside promotions/{promoName}/.
 * Supports multiple variations per fragment using unique geo/locale tags (`pznTags`).
 * Adds a numeric suffix ("-<index>") to the path for any subsequent variations to avoid collisions.
 * Cannot create variations from an existing promo variation.
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

    const isGroupedVariationSource = Fragment.isGroupedVariationPath(sourceFragment.path);

    // Grouped-variation source: pznTags already has its own personalization tag.
    // Preserve it on the clone instead of overwriting with the geo selection.
    const preservedPznTags = isGroupedVariationSource
        ? (sourceFragment.fields || []).find((field) => field.name === 'pznTags')?.values || []
        : [];

    // A grouped variation only stores its own overrides, everything else is inherited from the default fragment.
    // Resolve the effective content first, so the clone matches what's rendered.
    let effectiveFields = sourceFragment.fields || [];
    if (isGroupedVariationSource) {
        const parentFragment = await resolveHydratedParentFragment(aem, sourceFragment.path);
        if (parentFragment) {
            effectiveFields = createPreviewDataWithParent(sourceFragment, parentFragment).fields || [];
        }
    }

    const existingVariations = await probePromoVariationsForFragment(aem, sourceFragment.path, promoTagId);
    const existingGeoTagsByVariation = existingVariations.map((variation) => ({
        ...variation,
        pznTags: (variation.pznTags || []).filter((tag) => !preservedPznTags.includes(tag)),
    }));
    if (!geoTags.length && existingGeoTagsByVariation.some((variation) => !variation.pznTags?.length)) {
        throw new UserFriendlyError(
            isGroupedVariationSource
                ? 'A promo variation for this grouped variation fragment already exists.'
                : 'A variation with no geos already exists for this project.',
        );
    }
    const overlapping = findOverlappingGeoTags(existingGeoTagsByVariation, geoTags);
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

    const fieldsWithGeoTags = effectiveFields.filter((field) => field.name !== 'pznTags');
    const mergedPznTags = [...new Set([...preservedPznTags, ...geoTags])];
    if (mergedPznTags.length) {
        fieldsWithGeoTags.push({ name: 'pznTags', type: 'tag', multiple: true, values: mergedPznTags });
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
 * Finds promo variations left behind after their source project is deleted.
 * This method scans the entire promotions/ tree using the fragment's suffix, working regardless of intermediate folder levels.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @returns {Promise<Array<{ id: string, path: string, tags?: unknown[] }>>}
 */
export async function probeOrphanedPromoVariationsForFragment(aem, defaultPath) {
    if (!aem || !defaultPath || isPromoVariationPath(defaultPath)) return [];
    const match = PATH_TOKENS.exec(defaultPath);
    const promotionsRoot = buildPromotionsRootPath(defaultPath);
    if (!match?.groups?.fragmentPath || !promotionsRoot) return [];

    const segments = match.groups.fragmentPath.split('/');
    const leafName = segments.pop();
    const dirPart = segments.join('/');
    const suffix = dirPart ? `${escapeRegExp(dirPart)}/${escapeRegExp(leafName)}` : escapeRegExp(leafName);
    const suffixPattern = new RegExp(`^${escapeRegExp(promotionsRoot)}/.+/${suffix}(?:-(\\d+))?$`);

    const rawResults = [];
    try {
        for await (const batch of aem.sites.cf.fragments.search({ path: promotionsRoot }, VARIATION_SEARCH_PAGE_SIZE)) {
            rawResults.push(...batch);
        }
    } catch (error) {
        console.error('Failed to search promotions folder for orphan probe:', error);
        return [];
    }

    return rawResults
        .map((variation) => {
            const pathMatch = variation?.path && suffixPattern.exec(variation.path);
            if (!pathMatch || !variation?.id) return null;
            const index = pathMatch[1] ? Number(pathMatch[1]) : 1;
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
        })
        .filter(Boolean)
        .sort((a, b) => a.index - b.index);
}

/**
 * Only probes projects with defaultPath in their 'fragments' field.
 * Unattached projects can't have a variation, so they're skipped without a network call.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {Array<Object>} promotionProjects
 * @returns {Promise<Array<{ id: string, path: string, tags?: unknown[] }>>}
 */
export async function probePromoVariationReferences(aem, defaultPath, promotionProjects = []) {
    if (!aem || !defaultPath || isPromoVariationPath(defaultPath)) return [];

    const attachedProjects = promotionProjects.filter((project) =>
        (project.getFieldValues?.('fragments') || []).includes(defaultPath),
    );
    if (!attachedProjects.length) return [];

    const refsPerProject = await processConcurrently(
        attachedProjects,
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
 * Searches promo variations for grouped paths by project tag.
 * Skips the attachment check because grouped paths never appear
 * in a project's 'fragments' field — only the parent card does.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string[]} groupedVariationPaths
 * @param {Array<Object>} promotionProjects
 * @returns {Promise<Array<{ id: string, path: string, tags?: unknown[] }>>}
 */
async function probeGroupedVariationPromoReferences(aem, groupedVariationPaths, promotionProjects = []) {
    if (!aem || !groupedVariationPaths.length) return [];

    const refsPerProject = await processConcurrently(
        promotionProjects,
        async (project) => {
            const tagId = getPromotionTagFromFragment(project);
            if (!tagId) return [];
            const refsPerPath = await processConcurrently(
                groupedVariationPaths,
                (path) => probePromoVariationsForFragment(aem, path, tagId),
                VARIATIONS_CONCURRENCY_LIMIT,
            );
            return refsPerPath.flat();
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
    const groupedVariationPaths = new Fragment(fragmentData).getVariations().filter(Fragment.isGroupedVariationPath);

    const [defaultRefs, groupedRefs] = await Promise.all([
        probePromoVariationReferences(aem, fragmentData.path, promotionProjects),
        probeGroupedVariationPromoReferences(aem, groupedVariationPaths, promotionProjects),
    ]);

    return mergePromoVariationReferences(fragmentData, [...defaultRefs, ...groupedRefs]);
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
/**
 * Probes the `pzn` subfolder under a fragment's promo-variation path for promo variations
 * created from that fragment's own grouped variations.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} defaultPath
 * @param {string} promoName
 * @returns {Promise<Array<{ path: string, index: number, id: string, pznTags: string[], status: string, title: string, model: string, fields: Array, tags: Array }>>}
 */
async function probeGroupedVariationPromoVariations(aem, defaultPath, promoName) {
    const basePath = buildPromoVariationPath(defaultPath, promoName);
    if (!basePath) return [];
    const groupedFolder = `${basePath}/${PZN_FOLDER}`;

    const rawResults = [];
    for await (const batch of aem.sites.cf.fragments.search({ path: groupedFolder }, VARIATION_SEARCH_PAGE_SIZE)) {
        rawResults.push(...batch);
    }
    return rawResults
        .filter((item) => item?.id && item?.path)
        .map((item) => {
            const leaf = item.path.split('/').pop();
            const suffixMatch = leaf.match(/-(\d+)$/);
            return {
                path: item.path,
                index: suffixMatch ? Number(suffixMatch[1]) : 1,
                id: item.id,
                pznTags: readPznTags(item),
                status: item.status,
                title: item.title,
                model: item.model,
                fields: item.fields,
                tags: item.tags,
            };
        });
}

async function collectAttachedPromoVariations(aem, promotionFragment, { onlyUnpublished = false, onlyPublished = false } = {}) {
    const promotionTagId = getPromotionTagFromFragment(promotionFragment);
    if (!promotionTagId) return [];

    const attachedPaths = Array.from(new Set(promotionFragment.getFieldValues?.('fragments') || []));
    if (!attachedPaths.length) return [];

    const promoName = getPromoNameFromTag(promotionTagId);
    const variationsByPath = await probePromoVariationsForFragments(aem, attachedPaths, promotionTagId);
    const groupedVariationsByPath = new Map(
        await processConcurrently(
            attachedPaths,
            async (parentPath) => [
                parentPath,
                promoName ? await probeGroupedVariationPromoVariations(aem, parentPath, promoName) : [],
            ],
            VARIATIONS_CONCURRENCY_LIMIT,
        ),
    );

    return attachedPaths.flatMap((parentPath) => {
        const combined = [...(variationsByPath.get(parentPath) || []), ...(groupedVariationsByPath.get(parentPath) || [])];
        return combined
            .filter((variation) => {
                if (onlyUnpublished) return variation.status !== STATUS_PUBLISHED;
                if (onlyPublished) return variation.status !== STATUS_DRAFT;
                return true;
            })
            .map((variation) => ({ ...variation, parentPath }));
    });
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
