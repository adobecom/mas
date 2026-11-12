import {
    CheckoutWorkflowStep,
    Landscape,
    MODAL_TYPE_3_IN_1,
    PROVIDER_ENVIRONMENT,
} from './constants.js';

const AF_DRAFT_LANDSCAPE = 'p_draft_landscape';
// Checkout names of the option names that differ.
const PARAMETERS = new Map([
    ['countrySpecific', 'cs'],
    ['customerSegment', 'cs'],
    ['quantity', 'q'],
    ['checkoutPromoCode', 'apc'],
    ['ctxrturl', 'ctxRtUrl'],
    ['country', 'co'],
    ['language', 'lang'],
    ['clientId', 'cli'],
    ['context', 'ctx'],
    ['productArrangementCode', 'pa'],
    ['addonProductArrangementCode', 'ao'],
    ['offerType', 'ot'],
    ['marketSegment', 'ms'],
]);

/**
 * Checkout parameters a CTA can set in its extra options, forwarded to the
 * checkout URL and to AUP checkout.
 */
export const CHECKOUT_PARAMS = [
    'af',
    'ai',
    'ao',
    'apc',
    'appctxid',
    'context.guid',
    'csm',
    'ctx',
    'DCWATC',
    'gsp',
    'ijt',
    'lo',
    'mal',
    'mv',
    'mv2',
    'nglwfdata',
    'otac',
    'pcid', // Unified Paywall configuration ID for analytics
    'promoid',
    'rf',
    'sc',
    'sdid',
    'so.ca',
    'so.su',
    'so.tr',
    'so.va',
    'spint',
    'th',
    'trackingid',
    'usid',
];

/**
 * Parameters of a checkout URL. Consumers without types can pass any object
 * as checkout data, the unknown keys are ignored.
 */
const ALLOWED_KEYS = new Set([
    ...CHECKOUT_PARAMS,
    'cli',
    'co',
    'cs',
    'ctxRtUrl',
    'dp', // Enable digital payments for iframe context
    'fr', // represents the commerce app redirecting to UC
    'lang',
    'ms',
    'ot',
    'pa',
    'q',
    'scl',
    'sid', // x-adobe-clientsession
    'svar',
    'thm',
    'workflowid',
]);

// Parameters of the page URL forwarded to the checkout URL.
const ALLOWED_URL_PARAMS = [
    'gid',
    'gtoken',
    'notifauditid',
    'cohortid',
    'productname',
    'sdid',
    'attimer',
    'gcsrc',
    'gcprog',
    'gcprogcat',
    'gcpagetype',
    'mv',
    'mv2',
];

/** Paths under Taiwan or HK traditional-Chinese locales → checkout `lang=zh-Hant`. */
const ZH_HANT_PATHS = ['/tw/', '/hk_zh/'];

const MODALS_3_IN_1 = Object.values(MODAL_TYPE_3_IN_1);

export const pathnameRequiresZhHantLang = (pathname) =>
    ZH_HANT_PATHS.some((prefix) => pathname?.startsWith(prefix));

function isZhHantPage() {
    if (pathnameRequiresZhHantLang(window.location.pathname)) return true;
    try {
        return (
            window.parent !== window &&
            pathnameRequiresZhHantLang(window.parent.location.pathname)
        );
    } catch {
        return false; // cross-origin parent
    }
}

/** The checkout language of the page: `zh-Hant` on traditional-Chinese pages. */
export const toCheckoutLanguage = (language) =>
    isZhHantPage() ? 'zh-Hant' : language;

/**
 * Adjusts checkout URL query params (e.g. `lang`, per-item `lang`) from the current page context.
 * Add more locale rules here as needed.
 * @param {URL|string} url
 * @returns {string}
 */
export function applyPageLocaleToCheckoutUrl(url) {
    if (!isZhHantPage()) return String(url);
    let checkoutUrl;
    try {
        checkoutUrl = new URL(url);
    } catch {
        return String(url);
    }
    const { searchParams } = checkoutUrl;
    searchParams.set('lang', 'zh-Hant');
    for (const name of [...searchParams.keys()]) {
        if (/^items\[\d+]\[lang]$/.test(name)) {
            searchParams.set(name, 'zh-Hant');
        }
    }
    return checkoutUrl.toString();
}

export const is3in1Modal = (modal) => MODALS_3_IN_1.includes(modal);

/** A 3-in-1 modal, unless `<meta name="mas-ff-3in1" content="off">` disables them. */
export const isOpen3in1Modal = (modal) =>
    is3in1Modal(modal) &&
    document.querySelector('meta[name=mas-ff-3in1]')?.content !== 'off';

/** The checkout client of a 3-in-1 modal: doc_cloud stays, CRM opens creative, the others mini_plans. */
export const get3in1ClientId = (clientId, modal) => {
    if (clientId === 'doc_cloud') return clientId;
    return modal === MODAL_TYPE_3_IN_1.CRM ? 'creative' : 'mini_plans';
};

/**
 * Applies the plan that MEP preselects on catalog pages (`preselect-plan`).
 * @returns {[string, string]} market and customer segments
 */
export function preselectSegments(
    preselectPlan,
    marketSegment,
    customerSegment,
) {
    const plan = preselectPlan?.toLowerCase();
    return [
        plan === 'edu' ? 'EDU' : marketSegment,
        plan === 'team' ? 'TEAM' : customerSegment,
    ];
}

/**
 * The first item is the primary offer, the item with another product
 * arrangement is the addon (Stock).
 */
export const getAddonProductArrangementCode = (items, productArrangementCode) =>
    (productArrangementCode
        ? items?.find(
              (item) => item.productArrangementCode !== productArrangementCode,
          )
        : items?.[1]
    )?.productArrangementCode;

/** Maps an option name to its checkout parameter name. */
export const mapParameterName = (field) => PARAMETERS.get(field) ?? field;

/** Sets the allowed parameters of `inputParameters`, under their checkout names. */
export function addParameters(inputParameters, resultParameters, allowedKeys) {
    for (const [key, value] of Object.entries(inputParameters)) {
        const name = mapParameterName(key);
        if (value != null && allowedKeys.has(name)) {
            resultParameters.set(name, value);
        }
    }
}

export const getHostName = (env) =>
    env === PROVIDER_ENVIRONMENT.PRODUCTION
        ? 'https://commerce.adobe.com'
        : 'https://commerce-stg.adobe.com';

/** Sets the fields of each item as `items[index][name]` parameters. */
export function setItemsParameter(items, parameters) {
    for (const [index, item] of items.entries()) {
        for (const [key, value] of Object.entries(item)) {
            if (value != null) {
                parameters.set(
                    `items[${index}][${mapParameterName(key)}]`,
                    value,
                );
            }
        }
    }
}

/**
 * Forwards the allowed parameters of the page URL, cut at a stray `?`.
 * @param {URL} url
 */
export function addParamsFromPageUrl({ searchParams }) {
    const pageParams = new URLSearchParams(window.location.search);
    for (const param of ALLOWED_URL_PARAMS) {
        const value = pageParams.get(param);
        if (value !== null) searchParams.set(param, value.split('?')[0]);
    }
}

/**
 * Builds a UCv3 Checkout URL out of given parameters.
 */
export function buildCheckoutUrl({
    env,
    items,
    workflowStep,
    marketSegment,
    customerSegment,
    offerType,
    productArrangementCode,
    landscape,
    modal,
    is3in1,
    ...rest
}) {
    const url = new URL(getHostName(env));
    url.pathname = `/store/${workflowStep}`;
    const { searchParams } = url;
    const isSegmentation = workflowStep === CheckoutWorkflowStep.SEGMENTATION;
    if (
        !isSegmentation &&
        workflowStep !== CheckoutWorkflowStep.CHANGE_PLAN_TEAM_PLANS
    ) {
        setItemsParameter(items, searchParams);
    }
    addParameters(rest, searchParams, ALLOWED_KEYS);
    addParamsFromPageUrl(url);
    if (landscape === Landscape.DRAFT) {
        searchParams.set('af', AF_DRAFT_LANDSCAPE);
    }
    if (isSegmentation) {
        addParameters(
            {
                marketSegment,
                offerType,
                customerSegment,
                productArrangementCode,
                quantity: items?.[0]?.quantity,
                addonProductArrangementCode: getAddonProductArrangementCode(
                    items,
                    productArrangementCode,
                ),
            },
            searchParams,
            ALLOWED_KEYS,
        );
        if (searchParams.get('ot') === 'PROMOTION') searchParams.delete('ot');
        if (is3in1) {
            searchParams.set('rtc', 't');
            searchParams.set('lo', 'sl');
            searchParams.set(
                'af',
                [
                    searchParams.get('af'),
                    'uc_new_user_iframe',
                    'uc_new_system_close',
                ]
                    .filter(Boolean)
                    .join(','),
            );
            searchParams.set(
                'cli',
                get3in1ClientId(searchParams.get('cli'), modal),
            );
        }
    }
    return applyPageLocaleToCheckoutUrl(url);
}
