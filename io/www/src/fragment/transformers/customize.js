import { odinReferences, odinUrl } from '../utils/paths.js';
import { fetch, getFragmentId, getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';

/** we consider following locales as default for a given language
 * 'zh_HK',
 * 'zh_TW',
 * 'zh_CN', */
const LOCALE_DEFAULTS = [
    'ar_MENA',
    'bg_BG',
    'cs_CZ',
    'da_DK',
    'de_DE',
    'el_GR',
    'en_US',
    'es_ES',
    'et_EE',
    'fi_FI',
    'fil_PH',
    'fr_FR',
    'he_IL',
    'hi_IN',
    'hu_HU',
    'id_ID',
    'it_IT',
    'ja_JP',
    'ko_KR',
    'lt_LT',
    'lv_LV',
    'ms_MY',
    'nl_NL',
    'nb_NO',
    'pt_BR',
    'ru_RU',
    'sk_SK',
    'sl_SI',
    'sv_SE',
    'th_TH',
    'tr_TR',
    'uk_UA',
    'vi_VN',
];

function skimFragmentFromReferences(fragment) {
    const skimmedFragment = structuredClone(fragment);
    delete skimmedFragment.references;
    delete skimmedFragment.modelReferences;
    delete skimmedFragment.referencesTree;
    return skimmedFragment;
}

function getCorrespondingLocale(locale) {
    const [language] = locale.split('_');
    for (const defaultLocale of LOCALE_DEFAULTS) {
        if (defaultLocale.startsWith(language)) {
            return defaultLocale;
        }
    }
    return locale;
}

/**
 * get fragment associated to default language, just returning the body
 * @param {*} context
 * @returns null if something wrong, [] if not found, body if found
 */
async function getDefaultLanguageVariation(context) {
    let { body } = context;
    const { surface, locale, fragmentPath, preview, parsedLocale } = context;
    const defaultLocale = locale ? getCorrespondingLocale(locale) : parsedLocale;
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

function mergeVariations(root, customizeContext) {
    const { references, prefix, isRegionLocale } = customizeContext;
    const variations = root?.fields?.variations;
    if (!isRegionLocale || !variations || variations.length === 0) {
        return root;
    }
    let regionalVariation = null;
    for (const variationId of variations) {
        const variationCandidate = references[variationId]?.value;
        if (variationCandidate?.path.includes(prefix)) {
            regionalVariation = variationCandidate;
            break;
        }
    }
    if (!regionalVariation) {
        return root;
    }
    return deepMerge(root, regionalVariation);
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
    const isRegionLocale = country ? defaultLocale.indexOf(`_${country}`) == -1 : defaultLocale !== locale;
    const regionLocale = country ? `${defaultLocale.split('_')[0]}_${country.toUpperCase()}` : locale;
    const { references, referencesTree } = body;
    const customizeContext = {
        isRegionLocale,
        promos,
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
export { getCorrespondingLocale, deepMerge, LOCALE_DEFAULTS };
