import { odinReferences, odinUrl } from '../utils/paths.js';
import { fetch, getFragmentId, getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';
import { getDefaultLocaleCode } from '../locales.js';

const PZN_FOLDER = '/pzn/';
const PZN_FIELD = 'pznTags';

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
        const defaultLocaleIdUrl = odinUrl(surface, defaultLocale, fragmentPath, preview);
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
                    result[key] = obj[key];
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

function findPersonalizationVariation(variations, { references, regionLocale }) {
    const personalizationVariations = extractVariationBasedOnPath(variations, references, PZN_FOLDER);
    if (personalizationVariations.length === 0) return null;
    return personalizationVariations.find((variation) => {
        const { pznTags } = variation.fields;
        const match = pznTags?.find((tag) => tag?.includes(regionLocale));
        return !!match;
    });
}

function mergeVariations(root, customizeContext) {
    const { references, prefix, isRegionLocale } = customizeContext;
    const variations = root?.fields?.variations;
    if (!isRegionLocale || !variations || variations.length === 0) {
        return root;
    }
    const regionalVariation = findRegionalVariation(variations, references, prefix);
    if (regionalVariation) return deepMerge(root, regionalVariation);
    const personalizationVariation = findPersonalizationVariation(variations, customizeContext);
    if (personalizationVariation) return deepMerge(root, personalizationVariation);
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
    const { locale, country } = context;
    const { surface } = await getRequestInfos(context);
    const { body, defaultLocale, status, message } = await context.promises?.customize;
    const promos = await context.promises?.promotions;

    if (status != 200) {
        return { status, message };
    }
    const baseFragment = skimFragmentFromReferences(body);
    //todo check
    const isRegionLocale = country ? defaultLocale.indexOf(`_${country}`) == -1 : defaultLocale !== locale;
    const regionLocale = country ? `${defaultLocale.split('_')[0]}_${country.toUpperCase()}` : locale;
    const { references, referencesTree } = body;
    const customizeContext = {
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
