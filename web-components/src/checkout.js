import { CheckoutLink } from './checkout-link.js';
import {
    omitProperties,
    toBoolean,
    toEnumeration,
    computePromoStatus,
} from '@dexter/tacocat-core';
import { CheckoutWorkflowStep } from './constants.js';

import { buildCheckoutUrl } from './buildCheckoutUrl.js';
import { Defaults } from './defaults.js';
import { toWcsOsiAndPromotionCodes, toQuantity } from './utilities.js';
import { MODAL_TYPE_3_IN_1 } from './constants.js';
import { resolveCheckoutData } from '../../checkout/src/checkout.js';

/**
 * generate Checkout configuration
 */
export function Checkout({ settings, providers }) {
    function collectCheckoutOptions(overrides, placeholder) {
        const {
            checkoutClientId,
            checkoutWorkflowStep: defaultWorkflowStep,
            country: defaultCountry,
            language: defaultLanguage,
            promotionCode: defaultPromotionCode,
            quantity: defaultQuantity,
            preselectPlan,
            env,
        } = settings;

        let options = {
            checkoutClientId,
            checkoutWorkflowStep: defaultWorkflowStep,
            country: defaultCountry,
            language: defaultLanguage,
            promotionCode: defaultPromotionCode,
            quantity: defaultQuantity,
            preselectPlan,
            env,
        };

        if (placeholder) {
            for (const provider of providers.checkout) {
                provider(placeholder, options);
            }
        }
        const {
            checkoutMarketSegment,
            checkoutWorkflowStep = defaultWorkflowStep,
            imsCountry,
            country = imsCountry ?? defaultCountry,
            language = defaultLanguage,
            quantity = defaultQuantity,
            entitlement,
            upgrade,
            modal,
            perpetual,
            promotionCode = defaultPromotionCode,
            wcsOsi,
            extraOptions,
            ...rest
        } = Object.assign(options, placeholder?.dataset ?? {}, overrides ?? {});
        const workflowStep = toEnumeration(
            checkoutWorkflowStep,
            CheckoutWorkflowStep,
            Defaults.checkoutWorkflowStep,
        );

        const { wcsOsi: alignedWcsOsi, promotionCodes: alignedPromotionCodes } =
            toWcsOsiAndPromotionCodes(wcsOsi, promotionCode);
        const promotionCodes = alignedPromotionCodes.map(
            (code) => computePromoStatus(code).effectivePromoCode,
        );

        options = omitProperties({
            ...rest,
            extraOptions,
            checkoutClientId,
            checkoutMarketSegment,
            country,
            quantity: toQuantity(quantity, Defaults.quantity),
            checkoutWorkflowStep: workflowStep,
            language,
            entitlement: toBoolean(entitlement),
            upgrade: toBoolean(upgrade),
            modal,
            perpetual: toBoolean(perpetual),
            promotionCode: promotionCodes[0],
            promotionCodes,
            wcsOsi: alignedWcsOsi,
            preselectPlan,
        });
        return options;
    }

    /**
     * @param {*} offers
     * @param {*} options
     * @returns a checkout URL
     */
    function buildCheckoutURL(offers, options) {
        /* c8 ignore next 3 */
        if (!Array.isArray(offers) || !offers.length || !options) {
            return '';
        }
        const { env, landscape } = settings;
        const resolvedOptions = collectCheckoutOptions(options);
        const masFF3in1 = document.querySelector('meta[name=mas-ff-3in1]');
        const is3in1 =
            Object.values(MODAL_TYPE_3_IN_1).includes(options.modal) &&
            (!masFF3in1 || masFF3in1.content !== 'off');
        const context = window.frameElement || is3in1 ? 'if' : 'fp';
        const data = resolveCheckoutData(offers, resolvedOptions, {
            env,
            landscape,
            is3in1,
            context,
        });
        return buildCheckoutUrl(data);
    }

    const { createCheckoutLink } = CheckoutLink;
    return {
        CheckoutLink,
        CheckoutWorkflowStep,
        buildCheckoutURL,
        collectCheckoutOptions,
        createCheckoutLink,
    };
}
