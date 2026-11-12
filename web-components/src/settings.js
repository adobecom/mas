import {
    CheckoutWorkflowStep,
    Env,
    Landscape,
    PARAM_ENV,
    PARAM_LANDSCAPE,
    PARAM_MAS_PREVIEW,
    WCS_PROD_URL,
    WCS_STAGE_URL,
} from './constants.js';
import { Defaults } from './defaults.js';
import {
    createParameterReader,
    toBoolean,
    toEnumeration,
    toQuantity,
} from './utilities.js';
import { resolveMasIOUrl } from './utils.js';

// A switch is on when set to anything but "off" or "false", even empty.
const isEnabled = (value) =>
    value != null && value !== 'off' && value !== 'false';

/**
 * AUP Select switch: query string, then metadata, then the service attribute.
 * @param {HTMLElement} service
 * @param {ReturnType<typeof createParameterReader>} [read]
 */
export const getAupSelect = (service, read = createParameterReader()) =>
    isEnabled(
        read(
            'aup-select',
            { 'aup-select': service.getAttribute('aup-select') },
            { storage: false },
        ),
    );

function getLocaleSettings({ locale, country, language } = {}) {
    const [localeLanguage, localeCountry] = locale?.split('_') ?? [];
    language ??= localeLanguage || Defaults.language;
    const hasExplicitCountry = Boolean(country || localeCountry);
    country ??= localeCountry || Defaults.country;
    // Commerce has no PR pricing: price Puerto Rico as US, keep es_PR locale for language/legal. MWPW-203596
    if (country === 'PR') country = 'US';
    locale ??= `${language}_${country}`;
    return { locale, country, language, hasExplicitCountry };
}

/**
 * Resolves the service settings. A commerce setting is read from the query
 * string, storage, metadata, then the service attribute, then `Defaults`.
 * The env is always `prod` unless the service allows overrides
 * (see https://github.com/adobecom/milo/pull/923).
 */
function getSettings(config = {}, service) {
    const { commerce = {} } = config;
    const read = createParameterReader();
    const get = (key) => read(key, commerce);
    const flag = (key) => toBoolean(get(key), Defaults[key]);

    let isStage = commerce.env === 'stage';
    let landscape = Landscape.PUBLISHED;
    if (['true', ''].includes(commerce.allowOverride)) {
        isStage =
            (read(PARAM_ENV, commerce, { metadata: false })?.toLowerCase() ??
                commerce.env) === 'stage';
        landscape = toEnumeration(get(PARAM_LANDSCAPE), Landscape, landscape);
    }
    const preselectPlan = read('preselect-plan');
    const instant = read('instant') ?? config.instant;
    return {
        ...getLocaleSettings(config),
        ...(isEnabled(read(PARAM_MAS_PREVIEW) ?? config.preview) && {
            preview: true,
        }),
        aupSelect: getAupSelect(service, read),
        displayOldPrice: flag('displayOldPrice'),
        checkoutClientId: get('checkoutClientId') ?? Defaults.checkoutClientId,
        checkoutWorkflowStep: toEnumeration(
            get('checkoutWorkflowStep'),
            CheckoutWorkflowStep,
            Defaults.checkoutWorkflowStep,
        ),
        displayPerUnit: Defaults.displayPerUnit,
        displayRecurrence: flag('displayRecurrence'),
        displayTax: flag('displayTax'),
        displayPlanType: flag('displayPlanType'),
        entitlement: flag('entitlement'),
        extraOptions: Defaults.extraOptions,
        modal: flag('modal'),
        env: isStage ? Env.STAGE : Env.PRODUCTION,
        forceTaxExclusive: flag('forceTaxExclusive'),
        promotionCode: get('promotionCode') ?? Defaults.promotionCode,
        quantity: toQuantity(get('quantity')),
        alternativePrice: Defaults.alternativePrice,
        wcsApiKey: get('wcsApiKey') ?? Defaults.wcsApiKey,
        wcsURL: isStage ? WCS_STAGE_URL : WCS_PROD_URL,
        landscape,
        masIOUrl:
            resolveMasIOUrl(read('mas-io-url') ?? config.masIOUrl) ??
            `https://www${isStage ? '.stage' : ''}.adobe.com/mas/io`,
        ...(preselectPlan && { preselectPlan }),
        ...(instant && { instant }),
    };
}

export { getLocaleSettings, getSettings };
