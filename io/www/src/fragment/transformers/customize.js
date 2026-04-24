import { getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';

const PZN_FOLDER = '/pzn/';

function skimFragmentFromReferences(fragment) {
    const skimmedFragment = structuredClone(fragment);
    delete skimmedFragment.references;
    delete skimmedFragment.modelReferences;
    delete skimmedFragment.referencesTree;
    return skimmedFragment;
}

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
    const result = {};
    for (const obj of objects) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                result[key] = deepMerge(result[key] || {}, obj[key]);
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
    return result;
}

function extractVariationBasedOnPath(variations, references, pathSegment) {
    return variations
        .filter((variationId) => references[variationId]?.value?.path?.includes(pathSegment))
        .map((variationId) => references[variationId].value);
}

function findRegionalVariation(variations, references, prefix) {
    const regionalVariations = extractVariationBasedOnPath(variations, references, prefix);
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

function countMatchedPznTokens(tags, tokens) {
    let n = 0;
    for (const token of tokens) {
        if (tags.some((tag) => Boolean(tag && token && tag.endsWith(`${PZN_FOLDER}${token}`)))) {
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
    const regionMatch = Boolean(regionLocale && tags.some((tag) => tag.includes(regionLocale)));
    const countryMatch = Boolean(
        country && tags.some((tag) => tag.toLowerCase().endsWith(`pzn/country/${String(country).toLowerCase()}`)),
    );
    if (matchedTokens === 0 && !regionMatch && !countryMatch) {
        return 0;
    }
    return matchedTokens * 100 + (regionMatch ? 20 : 0) + (countryMatch ? 10 : 0);
}

function findPersonalizationVariation(variations, customizeContext) {
    const { country, pzn, references, regionLocale } = customizeContext;
    const personalizationVariations = extractVariationBasedOnPath(variations, references, PZN_FOLDER);
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

function mergeVariations(root, customizeContext) {
    const { isRegionLocale, prefix, references } = customizeContext;
    const variations = root?.fields?.variations;
    if (!variations?.length) {
        logDebug(() => `No variations to merge for fragment ${root.id}`, customizeContext);
        return root;
    }
    logDebug(() => `found variations ${JSON.stringify(variations)} in ${root.id}`, customizeContext);
    if (isRegionLocale) {
        const regionalVariation = findRegionalVariation(variations, references, prefix);
        if (regionalVariation) {
            logDebug(() => `Merging regional variation ${regionalVariation.id} for fragment ${root.id}`, customizeContext);
            const merged = deepMerge(root, regionalVariation);
            merged.id = root.id;
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
        merged.id = root.id;
        merged.variationId = personalizationVariation.id;
        return merged;
    }
    return root;
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
    //start by merging current fragment with its regional variation, and promos if any
    const customizedRoot = mergeVariations(root, customizeContext);

    //adapt referencesTree to match the customized root's cards/collections
    const adaptedTree = adaptReferencesTree(referencesTree, customizedRoot);

    //now we look into referenced fragments to customize them as well
    for (const reference of adaptedTree) {
        //customize each card/collection
        if (reference.fieldName === 'cards' || reference.fieldName === 'collections') {
            const child = customizeContext.references[reference.identifier]?.value;
            if (child) {
                //start customization of the child fragment
                const { references: customizedReferences } = customizeTree(child, reference.referencesTree, customizeContext);
                //we collect update references and merge in current references
                customizeContext.references = { ...customizeContext.references, ...customizedReferences };
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
    const promos = await context.promises?.promotions;

    if (status != 200) {
        return { ...context, status, message };
    }
    const baseFragment = skimFragmentFromReferences(body);
    const { references, referencesTree } = body;
    const regionLocale = context.regionLocale ?? regionLocaleFromInit;
    const isRegionLocale = regionLocale !== defaultLocale;
    const customizeContext = {
        ...context,
        isRegionLocale,
        promos,
        regionLocale,
        prefix: `${surface}/${regionLocale}`,
        references,
    };
    const {
        fragment: customizedFragment,
        references: customizedReferences,
        referencesTree: customizedReferenceTree,
    } = customizeTree(baseFragment, referencesTree, customizeContext);
    customizedFragment.references = customizedReferences;
    customizedFragment.referencesTree = customizedReferenceTree;
    return {
        ...context,
        status: 200,
        body: customizedFragment,
        locale: regionLocale,
        defaultLocale,
    };
}

export const transformer = {
    name: 'customize',
    process: customize,
};
export { deepMerge };
