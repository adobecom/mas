import { odinReferences, odinUrl } from '../utils/paths.js';
import { fetch, getFragmentId, getRequestInfos } from '../utils/common.js';
import { log, logDebug } from '../utils/log.js';
import { getDefaultLocaleCode } from '../locales.js';

const PZN_FOLDER = '/pzn/';

function skimFragmentFromReferences(fragment) {
    const skimmedFragment = structuredClone(fragment);
    delete skimmedFragment.references;
    delete skimmedFragment.modelReferences;
    delete skimmedFragment.referencesTree;
    return skimmedFragment;
}

/**
 * get fragment associated to default language, just returning the body
 * @param {*} context
 *  - 'locale' comes from request parameter, so can be optional
 *  - 'parsedLocale' is the actual location of the fetched fragment
 * @returns null if something wrong, [] if not found, body if found
 */
async function getDefaultLanguageVariation(context) {
    let { body } = context;
    const { surface, locale, fragmentPath, preview, parsedLocale } = context;
    // if no 'locale' request parameter, serve fragment as is
    if (!locale) {
        context.defaultLocale = parsedLocale;
        return { body, parsedLocale, status: 200 };
    }
    const defaultLocale = getDefaultLocaleCode(surface, locale);
    if (!defaultLocale) {
        return { status: 400, message: `Default locale not found for requested locale '${locale}'` };
    }
    if (defaultLocale !== parsedLocale) {
        logDebug(() => `Looking for fragment id for ${surface}/${defaultLocale}/${fragmentPath}`, context);
        const defaultLocaleIdUrl = odinUrl(surface, { locale: defaultLocale, fragmentPath, preview });
        const { id: defaultLocaleId, status, message } = await getFragmentId(context, defaultLocaleIdUrl, 'default-locale-id');
        if (status != 200) {
            return { status, message };
        }
        const defaultLocaleUrl = odinReferences(defaultLocaleId, true, preview);
        const response = await fetch(defaultLocaleUrl, context, 'default-locale-fragment');
        if (response.status != 200 || !response.body) {
            /* c8 ignore next */
            const message = response.message || 'Error fetching default locale fragment';
            /* c8 ignore next */
            return { status: response.status || 503, message };
        }
        ({ body } = response);
    }
    context.defaultLocale = defaultLocale;
    return { body, defaultLocale, status: 200 };
}

async function init(context) {
    const { body, surface, fragmentPath, parsedLocale } = await getRequestInfos(context);
    context = { ...context, surface, fragmentPath, parsedLocale, body };
    if (!surface || !fragmentPath) {
        return { status: 400, message: 'Missing surface or fragmentPath' };
    }
    return await getDefaultLanguageVariation(context);
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
            return deepMerge(root, regionalVariation);
        }
    }
    const personalizationVariation = findPersonalizationVariation(variations, customizeContext);
    if (personalizationVariation) {
        logDebug(
            () => `Merging personalization variation ${personalizationVariation.id} for fragment ${root.id}`,
            customizeContext,
        );
        return deepMerge(root, personalizationVariation);
    }
    return root;
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

    //now we look into referenced fragments to customize them as well
    for (const reference of referencesTree) {
        //customize each card/collection
        if (reference.fieldName === 'cards' || reference.fieldName === 'collections') {
            const child = customizeContext.references[reference.identifier]?.value;
            if (child) {
                //start customization of the child fragment
                const { fragment: customizedChild, references: customizedReferences } = customizeTree(
                    child,
                    reference.referencesTree,
                    customizeContext,
                );
                if (customizedChild.id !== child.id) {
                    //reference has been customized
                    //we update reference tree
                    reference.identifier = customizedChild.id;
                    const updatedReference = customizedRoot?.fields[reference.fieldName];
                    //we update the corresponding field, adding new reference, and removing old one
                    const oldReferenceIndex = updatedReference?.indexOf(child.id);
                    if (oldReferenceIndex > -1) {
                        customizedRoot.fields[reference.fieldName] = [
                            ...updatedReference.slice(0, oldReferenceIndex),
                            customizedChild.id,
                            ...updatedReference.slice(oldReferenceIndex + 1),
                        ];
                    }
                }
                //we collect update references and merge in current references
                customizeContext.references = { ...customizeContext.references, ...customizedReferences };
            }
        }
    }
    //finally we return updated root and references
    if (customizedRoot.id !== root.id) {
        //there has been a customization: we update references
        customizeContext.references = {
            ...customizeContext.references,
            [customizedRoot.id]: { type: 'content-fragment', value: skimFragmentFromReferences(customizedRoot) },
        };
    }
    return { fragment: customizedRoot, references: customizeContext.references, referencesTree };
}

async function customize(context) {
    const { locale, country, pzn } = context;
    const { surface } = await getRequestInfos(context);
    const { body, defaultLocale, status, message } = await context.promises?.customize;
    const promos = await context.promises?.promotions;

    if (status != 200) {
        return { ...context, status, message };
    }
    const baseFragment = skimFragmentFromReferences(body);
    const isRegionLocale = country ? defaultLocale.indexOf(`_${country}`) == -1 : defaultLocale !== locale;
    logDebug(() => `isRegionLocale: ${isRegionLocale}`, context);
    const regionLocale = country ? `${defaultLocale.split('_')[0]}_${country.toUpperCase()}` : locale;
    const { references, referencesTree } = body;
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
    };
}

export const transformer = {
    name: 'customize',
    process: customize,
    init,
};
export { deepMerge };
