import { PARAM_ENV, PARAM_LANDSCAPE } from './constants.js';
import { Defaults } from './defaults.js';
import {
    CheckoutWorkflow,
    CheckoutWorkflowStep,
    Env,
    WcsEnv,
    Landscape,
    getParameter,
    toBoolean,
    toEnumeration,
    toPositiveFiniteInteger,
} from './external.js';
import { toQuantity } from './utilities.js';

const DEFAULT_LOCALE = 'en_US';

const GeoMap = {
    ar: 'AR_es',
    br: 'BR_pt',
    ca: 'CA_en',
    cl: 'CL_es',
    co: 'CO_es',
    la: 'DO_es',
    mx: 'MX_es',
    pe: 'PE_es',
    africa: 'ZA_en',
    dk: 'DK_da',
    de: 'DE_de',
    ee: 'EE_et',
    es: 'ES_es',
    fr: 'FR_fr',
    ie: 'IE_en',
    il_he: 'IL_iw',
    it: 'IT_it',
    lv: 'LV_lv',
    lt: 'LT_lt',
    hu: 'HU_hu',
    mt: 'MT_en',
    mena_en: 'DZ_en',
    mena_ar: 'DZ_ar',
    nl: 'NL_nl',
    no: 'NO_nb',
    pl: 'PL_pl',
    pt: 'PT_pt',
    ro: 'RO_ro',
    si: 'SI_sl',
    sk: 'SK_sk',
    fi: 'FI_fi',
    se: 'SE_sv',
    tr: 'TR_tr',
    uk: 'GB_en',
    at: 'AT_de',
    cz: 'CZ_cs',
    bg: 'BG_bg',
    ru: 'RU_ru',
    ua: 'UA_uk',
    au: 'AU_en',
    in: 'IN_en',
    id_id: 'ID_in',
    nz: 'NZ_en',
    sg: 'SG_en',
    cn: 'CN_zh-Hans',
    tw: 'TW_zh-Hant',
    hk_zh: 'HK_zh-hant',
    jp: 'JP_ja',
    kr: 'KR_ko',
    za: 'ZA_en',
    ng: 'NG_en',
    cr: 'CR_es',
    ec: 'EC_es',
    pr: 'US_es', // not a typo, should be US
    gt: 'GT_es',
    cis_en: 'AZ_en',
    cis_ru: 'AZ_ru',
    sea: 'SG_en',
    th: 'TH_en',
};

const HostEnv = Object.freeze({
    LOCAL: 'local',
    PROD: 'prod',
    STAGE: 'stage',
});

/** @type {Commerce.getLocaleSettings} */
function getLocaleSettings({ locale = {} } = {}) {
    if (!locale.prefix) {
        return {
            country: Defaults.country,
            language: Defaults.language,
            locale: DEFAULT_LOCALE,
        };
    }
    const geo = locale.prefix.replace('/', '') ?? '';
    let [country = Defaults.country, language = Defaults.language] = (
        GeoMap[geo] ?? geo
    ).split('_', 2);

    country = country.toUpperCase();
    language = language.toLowerCase();

    return {
        country,
        language,
        locale: `${language}_${country}`,
    };
}

/** @type {Commerce.getSettings} */
function getSettings(config = {}) {
    // Always use `prod` env by default, regardless Milo env
    // but allow overriding it in metadata, location.search or storage
    // See https://github.com/adobecom/milo/pull/923
    // TODO: add alias names for meta, search and storage
    // See https://git.corp.adobe.com/wcms/tacocat.js/pull/348#discussion_r6557570
    const { commerce = {}, locale = undefined } = config;
    const hostEnv =
        config.env?.name === HostEnv.PROD
            ? HostEnv.PROD
            : toEnumeration(
                  getParameter(PARAM_ENV, commerce, { metadata: false }),
                  HostEnv,
                  HostEnv.PROD
              );
    const env = hostEnv === HostEnv.STAGE ? Env.STAGE : Env.PRODUCTION;
    const checkoutClientId =
        getParameter('checkoutClientId', commerce) ?? Defaults.checkoutClientId;
    const checkoutWorkflow = toEnumeration(
        getParameter('checkoutWorkflow', commerce),
        CheckoutWorkflow,
        Defaults.checkoutWorkflow
    );
    let checkoutWorkflowStep = CheckoutWorkflowStep.CHECKOUT;
    if (checkoutWorkflow === CheckoutWorkflow.V3) {
        checkoutWorkflowStep = toEnumeration(
            getParameter('checkoutWorkflowStep', commerce),
            CheckoutWorkflowStep,
            Defaults.checkoutWorkflowStep
        );
    }
    const displayOldPrice = toBoolean(
        getParameter('displayOldPrice', commerce),
        Defaults.displayOldPrice
    );
    const displayPerUnit = toBoolean(
        getParameter('displayPerUnit', commerce),
        Defaults.displayPerUnit
    );
    const displayRecurrence = toBoolean(
        getParameter('displayRecurrence', commerce),
        Defaults.displayRecurrence
    );
    const displayTax = toBoolean(
        getParameter('displayTax', commerce),
        Defaults.displayTax
    );
    const entitlement = toBoolean(
        getParameter('entitlement', commerce),
        Defaults.entitlement
    );
    const modal = toBoolean(getParameter('modal', commerce), Defaults.modal);
    const forceTaxExclusive = toBoolean(
        getParameter('forceTaxExclusive', commerce),
        Defaults.forceTaxExclusive
    );
    const promotionCode =
        getParameter('promotionCode', commerce) ?? Defaults.promotionCode;
    const quantity = toQuantity(getParameter('quantity', commerce));
    const wcsApiKey = getParameter('wcsApiKey', commerce) ?? Defaults.wcsApiKey;
    const landscape =
        config.env?.name === HostEnv.PROD
            ? Landscape.PUBLISHED
            : toEnumeration(
                  getParameter(PARAM_LANDSCAPE, commerce),
                  Landscape,
                  Defaults.landscape
              );
    let wcsBufferDelay = toPositiveFiniteInteger(
        getParameter('wcsBufferDelay', commerce),
        Defaults.wcsBufferDelay
    );
    let wcsBufferLimit = toPositiveFiniteInteger(
        getParameter('wcsBufferLimit', commerce),
        Defaults.wcsBufferLimit
    );

    return {
        ...getLocaleSettings({ locale }),
        displayOldPrice,
        checkoutClientId,
        checkoutWorkflow,
        checkoutWorkflowStep,
        displayPerUnit,
        displayRecurrence,
        displayTax,
        entitlement,
        extraOptions: Defaults.extraOptions,
        modal,
        env,
        forceTaxExclusive,
        priceLiteralsURL: commerce.priceLiteralsURL,
        priceLiteralsPromise: commerce.priceLiteralsPromise,
        promotionCode,
        quantity,
        wcsApiKey,
        wcsBufferDelay,
        wcsBufferLimit,
        wcsEnv: env === Env.STAGE ? WcsEnv.STAGE : WcsEnv.PRODUCTION,
        landscape,
    };
}

export { HostEnv as MiloEnv, getLocaleSettings, getSettings };
