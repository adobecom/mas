import './mas-commerce-service.js';
import './checkout-link.js';
import './checkout-button.js';
import './upt-link.js';
import './inline-price.js';
import './aem-fragment.js';
import './mas-field.js';

import { CheckoutWorkflow, CheckoutWorkflowStep } from './constants.js';
import { Defaults } from './defaults.js';
import { Log } from './log.js';
import { resolvePriceTaxFlags } from './inline-price.js';

import { applyPlanType } from './wcs.js';

/**
 * Adds the schema.org Product script for a card. The code is a satellite loaded
 * on first use: only Milo's merch-card-autoblock calls it, for `jsonld=on` links.
 * @returns {Promise<HTMLScriptElement|null|undefined>}
 */
const injectJsonLd = (...args) =>
    import('./json-ld.js')
        .then(({ injectJsonLd: inject }) => inject(...args))
        .catch((error) =>
            Log.module('json-ld').error('Failed to inject JSON-LD', error),
        );

export {
    CheckoutWorkflow,
    CheckoutWorkflowStep,
    Defaults,
    Log,
    applyPlanType,
    injectJsonLd,
    resolvePriceTaxFlags,
};

// merch-card.js imports these from ./commerce.js instead of bundling its own
// copies (see build.mjs). Add a name here when merch-card.js starts using it.
export {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_MAS_ERROR,
    EVENT_MAS_READY,
    EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE,
    EVENT_MERCH_CARD_ACTION_MENU_TOGGLE,
    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_OFFER_SELECT_READY,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
    FF_DEFAULTS,
    HEADLESS_STYLE_CTA_VARIANTS,
    MARK_DURATION_SUFFIX,
    MARK_START_SUFFIX,
    MERCH_CARD_LOAD_TIMEOUT,
    SELECTOR_MAS_CHECKOUT_LINK,
    SELECTOR_MAS_ELEMENT,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_LOAD_TIMEOUT,
    TEMPLATE_PRICE_LEGAL,
    TRIAL_ANALYTICS_IDS,
} from './constants.js';
export {
    clearForegroundTimeout,
    escapeHTML,
    createTag,
    debounce,
    getHeadlessCtaVariant,
    getOuterHeight,
    getService,
    hydrateHeadlessCta,
    isMobileOrTablet,
    keepInHeadingPriceForAnnual,
    printMeasure,
    setForegroundTimeout,
    setShadowMarkup,
    toRelativeAssetUrl,
} from './utils.js';
export { createMasElement } from './mas-element.js';
export { toPromotionCodes } from './utilities.js';
export { UptLink } from './upt-link.js';
export {
    extractBackgroundUrl,
    rewriteImageUrlsForProd,
    sanitizePictureMarkup,
} from './image-markup.js';
export { hostOsi } from './plan-type-text.js';

// The aup-checkout.js satellite imports these from ./commerce.js.
export { STATE_RESOLVED } from './constants.js';
export {
    CHECKOUT_PARAMS,
    getAddonProductArrangementCode,
    preselectSegments,
    toCheckoutLanguage,
} from './buildCheckoutUrl.js';
export { getAupClientId, isAupCheckoutSupported } from './checkout-mixin.js';
export {
    applyContextPromotionCode,
    applyDisplayAnnualDefault,
    applyHideStPriceLabels,
    mergePriceLiterals,
    registerContextOptionsProviders,
} from './mas-context.js';
