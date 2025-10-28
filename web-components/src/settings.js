import {
    PARAM_ENV,
    PARAM_LANDSCAPE,
    PARAM_MAS_PREVIEW,
    Landscape,
    WCS_PROD_URL,
    WCS_STAGE_URL,
    FF_DEFAULTS,
} from './constants.js';
import { Defaults } from './defaults.js';
import { Env, CheckoutWorkflow, CheckoutWorkflowStep } from './constants.js';

import { getParameter, toBoolean, toEnumeration } from '@dexter/tacocat-core';

import { toQuantity } from './utilities.js';

const PREVIEW_REGISTERED_SURFACE = {
    'wcms-commerce-ims-ro.+': 'acom',
    'CreativeCloud_.+': 'ccd',
    'CCHome.+': 'adobe-home',
};

const SUPPORTED_LOCALES = [
    'en_US',
    'ar_DZ',
    'ar_EG',
    'ar_SA',
    'bg_BG',
    'cs_CZ',
    'da_DK',
    'de_AT',
    'de_CH',
    'de_DE',
    'de_LU',
    'el_GR',
    'en_AU',
    'en_AZ',
    'en_BE',
    'en_CA',
    'en_DZ',
    'en_EG',
    'en_GB',
    'en_GR',
    'en_ID',
    'en_IE',
    'en_IN',
    'en_LU',
    'en_MT',
    'en_MU',
    'en_MY',
    'en_NG',
    'en_NZ',
    'en_SA',
    'en_SG',
    'en_TH',
    'en_ZA',
    'es_AR',
    'es_CL',
    'es_CO',
    'es_CR',
    'es_DO',
    'es_EC',
    'es_ES',
    'es_GT',
    'es_MX',
    'es_PE',
    'es_US',
    'et_EE',
    'fi_FI',
    'fr_BE',
    'fr_CH',
    'fr_FR',
    'fr_LU',
    'hi_IN',
    'hu_HU',
    'in_ID',
    'it_CH',
    'it_IT',
    'iw_IL',
    'ja_JP',
    'ko_KR',
    'lt_LT',
    'lv_LV',
    'ms_MY',
    'nb_NO',
    'nl_BE',
    'nl_NL',
    'pl_PL',
    'pt_BR',
    'pt_PT',
    'ro_RO',
    'ru_AZ',
    'ru_RU',
    'sk_SK',
    'sl_SI',
    'sv_SE',
    'th_TH',
    'tr_TR',
    'uk_UA',
    'zh-Hans_CN',
    'zh-Hant_HK',
    'zh-Hant_TW',
];

function getLocaleSettings({
    locale = undefined,
    country = undefined,
    language = undefined,
} = {}) {
    language ??= locale?.split('_')?.[0] || Defaults.language;
    country ??= locale?.split('_')?.[1] || Defaults.country;
    locale ??= SUPPORTED_LOCALES.includes(`${language}_${country}`)
        ? `${language}_${country}`
        : `${Defaults.language}_${Defaults.country}`;
    return { locale, country, language };
}

function getPreviewSurface(wcsApiKey, previewParam) {
    for (const [key, value] of Object.entries(PREVIEW_REGISTERED_SURFACE)) {
        const pattern = new RegExp(key);
        if (pattern.test(wcsApiKey)) {
            return value;
        }
    }
    return previewParam ?? wcsApiKey;
}

function getSettings(config = {}, service) {
    const ffDefaults = service.featureFlags[FF_DEFAULTS];
    // Always use `prod` env by default, regardless Milo env
    // but allow overriding it in metadata, location.search or storage
    // See https://github.com/adobecom/milo/pull/923
    // TODO: add alias names for meta, search and storage
    // See https://git.corp.adobe.com/wcms/tacocat.js/pull/348#discussion_r6557570
    const { commerce = {} } = config;

    let env = Env.PRODUCTION;
    let wcsURL = WCS_PROD_URL;

    const checkoutClientId =
        getParameter('checkoutClientId', commerce) ?? Defaults.checkoutClientId;
    const checkoutWorkflowStep = toEnumeration(
        getParameter('checkoutWorkflowStep', commerce),
        CheckoutWorkflowStep,
        Defaults.checkoutWorkflowStep,
    );
    const displayOldPrice = Defaults.displayOldPrice;

    const displayPerUnit = Defaults.displayPerUnit;

    const displayRecurrence = toBoolean(
        getParameter('displayRecurrence', commerce),
        Defaults.displayRecurrence,
    );
    const displayTax = toBoolean(
        getParameter('displayTax', commerce),
        Defaults.displayTax,
    );
    const displayPlanType = toBoolean(
        getParameter('displayPlanType', commerce),
        Defaults.displayPlanType,
    );
    const entitlement = toBoolean(
        getParameter('entitlement', commerce),
        Defaults.entitlement,
    );
    const modal = toBoolean(getParameter('modal', commerce), Defaults.modal);
    const forceTaxExclusive = toBoolean(
        getParameter('forceTaxExclusive', commerce),
        Defaults.forceTaxExclusive,
    );
    const promotionCode =
        getParameter('promotionCode', commerce) ?? Defaults.promotionCode;
    const quantity = toQuantity(getParameter('quantity', commerce));
    const wcsApiKey = getParameter('wcsApiKey', commerce) ?? Defaults.wcsApiKey;

    let isStage = commerce?.env === 'stage';
    let landscape = Landscape.PUBLISHED;
    const allowOverride = ['true', ''].includes(commerce.allowOverride);
    if (allowOverride) {
        isStage =
            (getParameter(PARAM_ENV, commerce, {
                metadata: false,
            })?.toLowerCase() ?? commerce?.env) === 'stage';
        landscape = toEnumeration(
            getParameter(PARAM_LANDSCAPE, commerce),
            Landscape,
            landscape,
        );
    }

    if (isStage) {
        env = Env.STAGE;
        wcsURL = WCS_STAGE_URL;
    }

    const previewParam = getParameter(PARAM_MAS_PREVIEW) ?? config.preview;
    const preview =
        typeof previewParam != 'undefined' &&
        previewParam !== 'off' &&
        previewParam !== 'false';
    let previewSettings = {};
    if (preview) previewSettings = { preview };
    const masIOUrl =
        getParameter('mas-io-url') ??
        config.masIOUrl ??
        `https://www${env === Env.STAGE ? '.stage' : ''}.adobe.com/mas/io`;
    const preselectPlan = getParameter('preselect-plan') ?? undefined;
    return {
        ...getLocaleSettings(config),
        ...previewSettings,
        displayOldPrice,
        checkoutClientId,
        checkoutWorkflowStep,
        displayPerUnit,
        displayRecurrence,
        displayTax,
        displayPlanType,
        entitlement,
        extraOptions: Defaults.extraOptions,
        modal,
        env,
        forceTaxExclusive,
        promotionCode,
        quantity,
        alternativePrice: Defaults.alternativePrice,
        wcsApiKey,
        wcsURL,
        landscape,
        masIOUrl,
        ...(preselectPlan && { preselectPlan }), // only add if defined
    };
}

export { getLocaleSettings, getSettings, getPreviewSurface };
