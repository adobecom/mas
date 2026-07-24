import { PATH_TOKENS } from '../utils/paths.js';
import {
    CARD_MODEL_ID,
    getRequestInfos,
    matchesGeo,
    skimFragmentFromReferences,
    VALID_PARAMETER_VALUE_REGEX,
} from '../utils/common.js';
import { logDebug, logError } from '../utils/log.js';

const PZN_FOLDER = '/pzn/';

// Per-variant fields whose array values must be concatenated (parent + child) rather than overwritten.
const MERGE_CONFIG = {
    DO_NOT_MERGE_KEYS: ['id', 'path'],
    'compare-chart-column': { arraysToMerge: ['features'] },
};

/**
 * Resolves the same fragment-init payload as the `defaultLanguage` transformer (`body`, `defaultLocale`, `regionLocale`, etc.)
 * by awaiting `context.promises.defaultLanguage`. Validates `surface` and `fragmentPath` from `requestInfos` first.
 *
 * @param {*} context - Request context; must include `promises.defaultLanguage` when run inside the fragment pipeline.
 * @param {{ surface?: string, fragmentPath?: string }} requestInfos - Parsed request/fragment location (same object returned by `getRequestInfos`).
 * @returns {Promise<{ status: number, body?: *, defaultLocale?: string, locale?: string, regionLocale?: string, message?: string, [key: string]: * }>}
 */
async function resolveFragmentInit(context, requestInfos) {
    const { surface, fragmentPath } = requestInfos;
    if (!surface || !fragmentPath) {
        return { status: 400, message: 'Missing surface or fragmentPath' };
    }
    return await context.promises.defaultLanguage;
}

function deepMerge(...objects) {
    return _deepMerge(true, ...objects);
}

function _deepMerge(topLevel, ...objects) {
    const result = {};
    if (topLevel) {
        MERGE_CONFIG.DO_NOT_MERGE_KEYS.map((key) => {
            if (objects[0]?.[key] !== undefined) {
                result[key] = objects[0][key];
            }
        });
    }
    for (const obj of objects) {
        for (const key in obj) {
            if (topLevel && MERGE_CONFIG.DO_NOT_MERGE_KEYS.includes(key)) {
                continue;
            }
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                result[key] = _deepMerge(false, result[key] || {}, obj[key]);
            } else {
                if (!Array.isArray(obj[key]) || obj[key].length > 0) {
                    // Preserve left value when right is undefined; only overwrite for '' (explicit clear) or other defined values
                    if (obj[key] !== undefined || result[key] === undefined) {
                        result[key] = obj[key];
                    }
                }
            }
        }
    }
    // Some variants carry partial array fields across variations (e.g. compare-chart `features`);
    // concatenate parent + child into the freshly-built result instead of mutating `child`
    // (a shared reference reused by sibling merges).
    const arraysToMerge = MERGE_CONFIG[objects?.[0]?.fields?.variant]?.arraysToMerge;
    arraysToMerge?.forEach((field) => {
        const parentValues = objects[0]?.fields?.[field]?.value || [];
        const childValues = objects[1]?.fields?.[field]?.value || [];
        if (result.fields?.[field] && (parentValues.length || childValues.length)) {
            result.fields[field].value = [...parentValues, ...childValues];
        }
    });
    return result;
}

function extractVariationBasedOnPath(variations, references, pattern) {
    return variations
        .filter((variationId) => pattern.test(references[variationId]?.value?.path))
        .map((variationId) => references[variationId].value);
}

function findRegionalVariation(variations, customizeContext) {
    const { surface, regionLocale, references } = customizeContext;
    const pattern = new RegExp(`/content/dam/mas/${surface}/${regionLocale}/.+`);
    const regionalVariations = extractVariationBasedOnPath(variations, references, pattern);
    return regionalVariations.length > 0 ? regionalVariations[0] : null;
}

function parsePznTokens(pzn) {
    if (pzn == null || pzn === '') {
        return [];
    }
    const s = typeof pzn === 'string' ? pzn : String(pzn);
    return s
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}

const PZN_TAG_RE = /(?:^|[/:])pzn\/(.+)$/i;

function countMatchedPznTokens(tags, tokens) {
    let n = 0;
    for (const token of tokens) {
        if (
            tags.some((tag) => {
                const match = tag && PZN_TAG_RE.exec(tag);
                return match && match[1].toLowerCase() === token.toLowerCase();
            })
        ) {
            n += 1;
        }
    }
    return n;
}

/**
 * Non-zero score means this variation applies. Higher is better: each matched request pzn token
 * dominates; region and country matches add smaller tie-break weight.
 * @param {string[]|undefined} pznTags
 * @param {{ regionLocale: string, country?: string, pzn?: string }} ctx
 */
function personalizationMatchScore(pznTags, { regionLocale, country, pzn }) {
    if (!Array.isArray(pznTags) || pznTags.length === 0) {
        return 0;
    }
    const tags = pznTags.filter(Boolean);
    if (tags.length === 0) {
        return 0;
    }
    const tokens = parsePznTokens(pzn);
    const matchedTokens = countMatchedPznTokens(tags, tokens);
    const geo = matchesGeo(tags, { regionLocale, country });
    if (matchedTokens === 0 && !geo) {
        return 0;
    }
    return matchedTokens * 100 + (geo?.region ? 20 : 0) + (geo?.country ? 10 : 0);
}

function findPersonalizationVariation(variations, customizeContext) {
    const { country, pzn, references, regionLocale, surface, defaultLocale } = customizeContext;
    const pattern = new RegExp(`/content/dam/mas/${surface}/${defaultLocale}/([^/]+)${PZN_FOLDER}.+`);
    const personalizationVariations = extractVariationBasedOnPath(variations, references, pattern);
    if (personalizationVariations.length === 0) {
        logDebug(() => `No personalization variation found for region locale ${regionLocale}`, customizeContext);
        return null;
    }
    logDebug(
        () =>
            `Found personalization variations ${personalizationVariations.map((v) => v.id).join(', ')} for region locale ${regionLocale}`,
        customizeContext,
    );
    let best = null;
    let bestScore = 0;
    for (const variation of personalizationVariations) {
        const score = personalizationMatchScore(variation.fields?.pznTags, { regionLocale, country, pzn });
        logDebug(() => `variation ${variation.id} scored ${score}`, customizeContext);
        if (score > bestScore) {
            bestScore = score;
            best = variation;
        }
    }
    if (bestScore > 0) {
        logDebug(() => `picking ${best.id} scored ${bestScore}`, customizeContext);
        return best;
    }
    return null;
}

// Human-readable provenance for a promo project that touched a fragment: campaign title when
// available, otherwise the project id. Variation-merge and promoCode-application provenance are
// tracked separately (a fragment may be touched by two different projects), and exposed downstream
// as data-promotion-variation-project and data-promotion-project respectively.
function promoProjectLabel(project) {
    return project.title ?? project.id;
}

// Upper bound for probing suffixed promo variation paths (`-2`, `-3`, ...) per fragment.
const MAX_PROMO_VARIATIONS_PER_FRAGMENT = 50;

// Collects same fragment geo promos to select the best match.
function collectPromoVariationCandidates(variationsByPath, fragmentPath) {
    const candidates = [];
    if (variationsByPath[fragmentPath]) candidates.push(variationsByPath[fragmentPath]);
    for (let index = 2; index <= MAX_PROMO_VARIATIONS_PER_FRAGMENT; index += 1) {
        const candidate = variationsByPath[`${fragmentPath}-${index}`];
        if (candidate) candidates.push(candidate);
    }
    return candidates;
}

/**
 * Picks the best geo match for a fragment.
 * Candidates without pznTags act as fallbacks for legacy, non geo scoped promos.
 */
function selectBestPromoVariation(candidates, { regionLocale, country }) {
    let fallback = null;
    let best = null;
    let bestScore = 0;
    for (const candidate of candidates) {
        const pznTags = candidate.fields?.pznTags;
        if (!Array.isArray(pznTags) || pznTags.length === 0) {
            fallback ??= candidate;
            continue;
        }
        const geo = matchesGeo(pznTags, { regionLocale, country });
        if (!geo) continue;
        const score = (geo.region ? 2 : 0) + (geo.country ? 1 : 0);
        if (score > bestScore) {
            bestScore = score;
            best = candidate;
        }
    }
    return best || fallback;
}

function findPromoVariation(root, customizeContext, selectedPromoProject) {
    // Only the single project selected for this fragment may contribute a promo variation
    if (!selectedPromoProject) return null;
    const { fragmentPath } = PATH_TOKENS.exec(root.path).groups;
    const { regionLocale, country } = customizeContext;
    const { project } = selectedPromoProject;
    const defaultVar = selectBestPromoVariation(collectPromoVariationCandidates(project.defaultVariations, fragmentPath), {
        regionLocale,
        country,
    });
    const regionVar = selectBestPromoVariation(collectPromoVariationCandidates(project.regionVariations, fragmentPath), {
        regionLocale,
        country,
    });
    logDebug(() => `findPromoVariation defaultVar: ${JSON.stringify(defaultVar)}`, customizeContext);
    logDebug(() => `findPromoVariation regionVar: ${JSON.stringify(regionVar)}`, customizeContext);
    if (!defaultVar && !regionVar) return null;
    if (!defaultVar) return { variation: regionVar, project };
    if (!regionVar) return { variation: defaultVar, project };
    return { variation: deepMerge(defaultVar, regionVar), project };
}

function findPromoMapsForFragment(root, customizeContext) {
    const promoProjects = customizeContext.promoProjects;
    if (!promoProjects?.length) return [];
    const match = PATH_TOKENS.exec(root.path);
    if (!match?.groups) return [];
    const { fragmentPath } = match.groups;
    return promoProjects.filter(({ fragmentPaths }) => fragmentPaths.has(fragmentPath));
}

/**
 * Selects a single promo project for a fragment.
 * explicit mapping (osi replace or promo code) wins over wild card promo only
 * wildcard promo wins over no promo and no mapping
 *
 * @returns the selected `{ project, promoMap, substituteMap, fragmentPaths }` entry, or null
 *          when no promo project targets the fragment.
 */
function selectPromoProjectForFragment(root, customizeContext) {
    const promoEntries = findPromoMapsForFragment(root, customizeContext);
    if (!promoEntries.length) return null;
    const fragOsi = root.fields?.osi;
    const osis = fragOsi ? (Array.isArray(fragOsi) ? fragOsi : [fragOsi]) : [];
    const hasExplicitMapping = ({ promoMap, substituteMap }) =>
        osis.some((osi) => promoMap[osi] !== undefined || substituteMap?.[osi] !== undefined);
    const hasWildcardPromo = ({ promoMap }) => Boolean(promoMap['*']);
    const selected = promoEntries.find(hasExplicitMapping) ?? promoEntries.find(hasWildcardPromo) ?? promoEntries[0];
    logDebug(
        () =>
            `Selected promo project ${selected.project.id} for fragment ${root.id} out of ${promoEntries.length} targeting project(s)`,
        customizeContext,
    );
    return selected;
}

function mergeVariations(root, customizeContext, selectedPromoProject) {
    const { isRegionLocale } = customizeContext;
    // Promo variation takes priority, independent of fields.variations
    const promoVariation = findPromoVariation(root, customizeContext, selectedPromoProject);
    if (promoVariation) {
        const { variation, project } = promoVariation;
        logDebug(() => `Merging promo variation ${variation.id} for fragment ${root.id}`, customizeContext);
        const merged = deepMerge(root, variation);
        merged.variationId = variation.id;
        merged.promoVariationProject = promoProjectLabel(project);
        return merged;
    }
    const variations = root?.fields?.variations;
    if (!variations?.length) {
        logDebug(() => `No variations to merge for fragment ${root.id}`, customizeContext);
        return root;
    }
    logDebug(() => `found variations ${JSON.stringify(variations)} in ${root.id}`, customizeContext);
    if (isRegionLocale) {
        const regionalVariation = findRegionalVariation(variations, customizeContext);
        if (regionalVariation) {
            logDebug(() => `Merging regional variation ${regionalVariation.id} for fragment ${root.id}`, customizeContext);
            const merged = deepMerge(root, regionalVariation);
            merged.variationId = regionalVariation.id;
            return merged;
        }
    }
    const personalizationVariation = findPersonalizationVariation(variations, customizeContext);
    if (personalizationVariation) {
        logDebug(
            () => `Merging personalization variation ${personalizationVariation.id} for fragment ${root.id}`,
            customizeContext,
        );
        const merged = deepMerge(root, personalizationVariation);
        merged.variationId = personalizationVariation.id;
        return merged;
    }
    return root;
}

function applyPromoCode(fragment, promoEntries, context) {
    const fragOsi = fragment.fields?.osi;
    if (!fragOsi) return;
    const osis = Array.isArray(fragOsi) ? fragOsi : [fragOsi];
    // Several active projects can target the same fragment. An explicit osi (or substituted-osi)
    // entry from any of them wins, promoProjects order (earliest startDate first, seasonal
    // projects floated to the top) only breaking ties, so projects with disjoint
    // per-country entries coexist (one applies for BR, another for MY). A project-level wildcard
    // ('*') is a last resort, applied only where no project has an explicit entry.
    let explicitPromoCode;
    let explicitProject;
    let wildcardPromoCode;
    let wildcardProject;
    for (const { project, promoMap, substituteMap } of promoEntries) {
        if (promoMap['*'] && wildcardPromoCode === undefined) {
            wildcardPromoCode = promoMap['*'];
            wildcardProject = project;
        }
        for (const osi of osis) {
            if (promoMap[osi]) {
                explicitPromoCode = promoMap[osi];
                explicitProject = project;
                break;
            }
            const substituted = substituteMap?.[osi];
            if (substituted && promoMap[substituted]) {
                explicitPromoCode = promoMap[substituted];
                explicitProject = project;
                logDebug(() => `osi ${osi} substituted by ${substituted} matched promoCode ${explicitPromoCode}`, context);
                break;
            }
        }
        if (explicitPromoCode) break;
    }
    if (explicitPromoCode) {
        logDebug(
            () =>
                `Setting explicit promoCode ${explicitPromoCode} from project ${explicitProject.id} on fragment ${fragment.id} (${promoEntries.length} project(s) target it)`,
            context,
        );
        fragment.fields.promoCode = explicitPromoCode;
    } else if (wildcardPromoCode) {
        logDebug(
            () =>
                `No explicit osi entry across ${promoEntries.length} project(s) for fragment ${fragment.id}; falling back to wildcard promoCode ${wildcardPromoCode} from project ${wildcardProject.id}`,
            context,
        );
        fragment.fields.promoCode = wildcardPromoCode;
    }
}

/**
 * Rebuilds the referencesTree to match the cards/collections order and membership
 * of the customized root fragment. Non-cards/collections entries (tags, variations)
 * are preserved. New IDs not present in the original tree get a stub entry.
 * @param {Array} referencesTree
 * @param {Object} customizedRoot
 * @returns {Array}
 */
function adaptReferencesTree(referencesTree, customizedRoot) {
    const customizedCards = customizedRoot.fields?.cards;
    const customizedCollections = customizedRoot.fields?.collections;
    if (!Array.isArray(customizedCards) && !Array.isArray(customizedCollections)) {
        return referencesTree;
    }
    const cardTreeMap = new Map();
    const collectionTreeMap = new Map();
    const otherEntries = [];
    for (const entry of referencesTree) {
        if (entry.fieldName === 'cards') {
            cardTreeMap.set(entry.identifier, entry);
        } else if (entry.fieldName === 'collections') {
            collectionTreeMap.set(entry.identifier, entry);
        } else {
            otherEntries.push(entry);
        }
    }
    const newTree = [...otherEntries];
    if (Array.isArray(customizedCards)) {
        for (const id of customizedCards) {
            newTree.push(cardTreeMap.get(id) ?? { fieldName: 'cards', identifier: id, referencesTree: [] });
        }
    }
    if (Array.isArray(customizedCollections)) {
        for (const id of customizedCollections) {
            newTree.push(collectionTreeMap.get(id) ?? { fieldName: 'collections', identifier: id, referencesTree: [] });
        }
    }
    return newTree;
}

/**
 * will return customized fragment, and sub fragments (recursive)
 * @param {*} root
 * @param {*} referencesTree
 * @param {*} customizeContext
 * @returns
 */
function customizeTree(root, referencesTree = [], customizeContext) {
    const selectedPromoProject = selectPromoProjectForFragment(root, customizeContext);
    //apply regional or promo variation, if any.
    const customizedRoot = mergeVariations(root, customizeContext, selectedPromoProject);
    if (selectedPromoProject) {
        // set data-promotion-project attribute, even when the project
        // only substitutes the OSI (no promo code and no variation).
        customizedRoot.promoProject = promoProjectLabel(selectedPromoProject.project);
        applyPromoCode(customizedRoot, [selectedPromoProject], customizeContext);
    }

    //adapt referencesTree to match the customized root's cards/collections
    const adaptedTree = adaptReferencesTree(referencesTree, customizedRoot);

    //now we look into referenced fragments to customize them as well
    for (let i = 0; i < adaptedTree.length; i++) {
        const reference = adaptedTree[i];
        //customize each card/collection
        if (reference.fieldName === 'cards' || reference.fieldName === 'collections') {
            const child = customizeContext.references[reference.identifier]?.value;
            if (child) {
                //start customization of the child fragment
                const { references: customizedReferences, referencesTree: childAdaptedTree } = customizeTree(
                    child,
                    reference.referencesTree,
                    customizeContext,
                );
                //we collect update references and merge in current references
                customizeContext.references = { ...customizeContext.references, ...customizedReferences };
                //propagate adapted child tree up so the parent's tree stays in sync with the customized child fields
                if (childAdaptedTree !== reference.referencesTree) {
                    adaptedTree[i] = { ...reference, referencesTree: childAdaptedTree };
                }
            }
        }
    }
    //finally we return updated root and references (stable id: default fragment key in references map)
    const refs = customizeContext.references;
    if (refs && root.id != null) {
        const existingRef = refs[root.id];
        if (existingRef) {
            customizeContext.references = {
                ...refs,
                [root.id]: {
                    ...existingRef,
                    type: 'content-fragment',
                    value: skimFragmentFromReferences(customizedRoot),
                },
            };
        }
    }
    return { fragment: customizedRoot, references: customizeContext.references, referencesTree: adaptedTree };
}

async function customize(context) {
    const requestInfos = await getRequestInfos(context);
    const { surface } = requestInfos;
    const fragmentInit = await resolveFragmentInit(context, requestInfos);
    const { body, defaultLocale, status, message, regionLocale: regionLocaleFromInit } = fragmentInit;
    const promoProjects = context.promoProjects ?? [];
    const { maskFragment, pzn } = context;

    if (status != 200) {
        return { ...context, status, message };
    }
    const baseFragment = skimFragmentFromReferences(body);
    const { references, referencesTree } = body;
    const regionLocale = context.regionLocale ?? regionLocaleFromInit;
    const isRegionLocale = regionLocale !== defaultLocale;
    const customizeContext = {
        ...context,
        defaultLocale,
        isRegionLocale,
        promoProjects,
        regionLocale,
        references,
        surface,
    };
    if (
        pzn &&
        String(pzn)
            .split(',')
            .some((token) => !VALID_PARAMETER_VALUE_REGEX.test(token.trim()))
    ) {
        logError(`Invalid pzn value '${pzn}', ignoring...`, context);
        customizeContext.pzn = undefined;
    }

    const customizedTree = customizeTree(baseFragment, referencesTree, customizeContext);
    let { fragment: customizedFragment } = customizedTree;
    const { references: customizedReferences, referencesTree: customizedReferenceTree } = customizedTree;

    if (maskFragment && customizedFragment.model?.id === CARD_MODEL_ID) {
        logDebug(() => `Applying mask ${maskFragment.id} on fragment ${customizedFragment.id}`, context);
        customizedFragment = deepMerge(customizedFragment, maskFragment);
        customizedFragment.maskId = maskFragment.id;
    }
    customizedFragment.references = customizedReferences;
    customizedFragment.referencesTree = customizedReferenceTree;
    return {
        ...context,
        status: 200,
        body: customizedFragment,
        defaultLocale,
    };
}

export const transformer = {
    name: 'customize',
    process: customize,
};
export { deepMerge };
