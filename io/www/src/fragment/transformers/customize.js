import { odinPath, odinReferences, odinUrl } from '../utils/paths.js';
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
    'pt_PT',
    'ru_CIS',
    'sk_SK',
    'sl_SI',
    'sv_SE',
    'th_TH',
    'tr_TR',
    'uk_UA',
    'vi_VN',
    'pt_BR',
];

function getCorrespondingLocale(locale) {
    const [language] = locale.split('_');
    for (const defaultLocale of LOCALE_DEFAULTS) {
        if (defaultLocale.startsWith(language)) {
            return defaultLocale;
        }
    }
    return locale;
}

function extractVariation(body) {
    const { id, fields, path } = body;
    return { id, fields, path };
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
        let defaultLocaleId = context.fragmentsIds?.['default-locale-id'];
        if (!defaultLocaleId) {
            logDebug(() => `Looking for fragment id for ${surface}/${defaultLocale}/${fragmentPath}`, context);
            const defaultLocaleIdUrl = odinUrl(surface, defaultLocale, fragmentPath, preview);
            const { id, status, message } = await getFragmentId(context, defaultLocaleIdUrl, 'default-locale-id');
            if (status != 200) {
                return { status, message };
            }
            defaultLocaleId = id;
        }
        const defaultLocaleUrl = odinReferences(defaultLocaleId, true, preview);
        const response = await fetch(defaultLocaleUrl, context, 'default-locale-fragment');
        if (response.status != 200 || !response.body) {
            return { status: response.status, message: response.message || 'Error fetching default locale fragment' };
        }
        ({ body } = response);
    }
    context.defaultLocale = defaultLocale;
    return { body, defaultLocale, status: 200 };
}

/**
 * Get default language and regional variation if any
 * @param {*} context
 * @returns
 */
async function getRegionalVariations(context) {
    const { country, locale, fragmentPath, surface } = context;
    if (!surface || !fragmentPath) {
        return { status: 400, message: 'Missing surface or fragmentPath' };
    }
    const { body, defaultLocale, status, message } = await getDefaultLanguageVariation(context);
    if (status != 200) {
        return { status, message };
    }
    const variations = [body];
    const isRegionLocale = country ? defaultLocale.indexOf(`_${country}`) == -1 : defaultLocale !== locale;
    if (isRegionLocale && body?.referencesTree) {
        const regionLocale = country ? `${defaultLocale.split('_')[0]}_${country.toUpperCase()}` : locale;
        logDebug(() => `Looking for regional variation for ${surface}/${regionLocale}/${fragmentPath}`, context);
        const regionCustomizationPath = odinPath(surface, regionLocale, fragmentPath);
        const [regionalRef] = Object.values(body.referencesTree)
            .filter((ref) => ref.fieldName === 'variations')
            .filter((variation) => body.references[variation.identifier]?.value?.path === regionCustomizationPath);
        if (regionalRef) {
            const custom = body.references[regionalRef.identifier]?.value;
            variations.push(extractVariation(custom));
        }
    }
    return { variations, status: 200 };
}

async function getPromoVariation(context) {
    return await context.promises?.promotions;
}

/**
 * get all needed variations to compute a customized fragment
 * @param {*} context
 */
async function getVariations(context) {
    const { body, surface, fragmentPath, parsedLocale } = await getRequestInfos(context);
    context = { ...context, surface, fragmentPath, parsedLocale, body };
    const [regionsResponse, promoResponse] = await Promise.all([getRegionalVariations(context), getPromoVariation(context)]);

    if (regionsResponse.status != 200) {
        return regionsResponse;
    }
    const { variations } = regionsResponse;
    if (promoResponse && promoResponse.status == 200) {
        const { variations: promos } = promoResponse;
        variations.push(...promos);
    }
    return { variations, status: 200 };
}

async function init(context) {
    return await getVariations(context);
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

async function customize(context) {
    const { variations, status, message } = await context.promises?.customize;
    if (status != 200) {
        return { status, message };
    }
    const customizedBody = deepMerge(...variations);

    return {
        ...context,
        status: 200,
        body: customizedBody,
    };
}

export const transformer = {
    name: 'customize',
    process: customize,
    init,
};
export { getCorrespondingLocale, getRegionalVariations, getVariations, getPromoVariation };
