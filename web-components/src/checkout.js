import {
    buildCheckoutUrl,
    isOpen3in1Modal,
    preselectSegments,
} from './buildCheckoutUrl.js';
import { CheckoutLink } from './checkout-link.js';
import { CheckoutWorkflowStep } from './constants.js';
import { Defaults } from './defaults.js';
import {
    omitProperties,
    toBoolean,
    toEffectivePromoCode,
    toEnumeration,
    toQuantity,
    toWcsOsiAndPromotionCodes,
} from './utilities.js';

/**
 * Checkout API of the commerce service.
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
        const options = {
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
        } = Object.assign(options, placeholder?.dataset, overrides);
        const { wcsOsi: alignedWcsOsi, promotionCodes: alignedPromotionCodes } =
            toWcsOsiAndPromotionCodes(wcsOsi, promotionCode);
        const promotionCodes = alignedPromotionCodes.map(toEffectivePromoCode);
        return omitProperties({
            ...rest,
            extraOptions,
            checkoutClientId,
            checkoutMarketSegment,
            country,
            quantity: toQuantity(quantity, Defaults.quantity),
            checkoutWorkflowStep: toEnumeration(
                checkoutWorkflowStep,
                CheckoutWorkflowStep,
                Defaults.checkoutWorkflowStep,
            ),
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
    }

    /**
     * @returns the checkout URL of the offers, '' without offers
     */
    function buildCheckoutURL(offers, options) {
        if (!offers?.length || !options) return '';
        const { env, landscape } = settings;
        const {
            checkoutClientId: clientId,
            checkoutMarketSegment,
            checkoutWorkflowStep: workflowStep,
            country,
            promotionCode: checkoutPromoCode,
            quantity: [quantity],
            preselectPlan,
            ms,
            cs,
            ...rest
        } = collectCheckoutOptions(options);
        const is3in1 = isOpen3in1Modal(options.modal);
        // the offers of a CTA share their segments and offer type
        const [
            {
                productArrangementCode,
                marketSegments: [offerMarketSegment],
                customerSegment: offerCustomerSegment,
                offerType,
            },
        ] = offers;
        const [marketSegment, customerSegment] = preselectSegments(
            preselectPlan,
            ms ?? offerMarketSegment ?? checkoutMarketSegment,
            cs ?? offerCustomerSegment,
        );
        const withPa = is3in1 && offers.length > 1;
        return buildCheckoutUrl({
            is3in1,
            checkoutPromoCode,
            clientId,
            context: window.frameElement || is3in1 ? 'if' : 'fp',
            country,
            env,
            // the quantity of the main offer applies to all items
            items: offers.map(({ offerId, productArrangementCode: pa }) => ({
                id: offerId,
                quantity: quantity > 1 ? quantity : undefined,
                ...(withPa && { productArrangementCode: pa }),
            })),
            marketSegment,
            customerSegment,
            offerType,
            productArrangementCode,
            workflowStep,
            landscape,
            ...rest,
        });
    }

    return {
        CheckoutLink,
        CheckoutWorkflowStep,
        buildCheckoutURL,
        collectCheckoutOptions,
        createCheckoutLink: CheckoutLink.createCheckoutLink,
    };
}
