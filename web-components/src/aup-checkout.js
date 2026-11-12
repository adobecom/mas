// Lazy satellite of checkout-mixin.js, loaded when a CTA is about to open an AUP checkout.
import {
    CHECKOUT_PARAMS,
    getAddonProductArrangementCode,
    preselectSegments,
    toCheckoutLanguage,
} from './buildCheckoutUrl.js';
import { getAupClientId, isAupCheckoutSupported } from './checkout-mixin.js';
import {
    CheckoutWorkflowStep,
    EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE,
    STATE_RESOLVED,
} from './constants.js';
import { Log } from './log.js';

// A hung context lookup would otherwise leave aupCheckoutPending stuck true and
// silently no-op every checkout CTA on the page for the rest of its life.
const HOST_TIMEOUT_MS = 20000;

// AUP names of the checkout parameters named differently in AUP requests.
const AUP_PARAM_NAMES = {
    'context.guid': 'contextGuid',
    DCWATC: 'dcwatc',
    'so.ca': 'soCa',
    'so.su': 'soSu',
    'so.tr': 'soTr',
    'so.va': 'soVa',
};
// AUP parameters that checkout URLs do not take.
const AUP_PARAMS = [
    'ccli',
    'cf',
    'code',
    'csc',
    'ew',
    'mat',
    'pp',
    'referrer',
    'rtc',
    'step',
    'token',
];

function getRequest(offers, options, hasUpgradeAction) {
    if (!isAupCheckoutSupported(offers, options, hasUpgradeAction)) return;
    const [offer] = offers;
    const { productArrangementCode: pa } = offer;
    const [ms, cs] = preselectSegments(
        options.preselectPlan,
        options.ms,
        options.cs,
    );
    const context = {
        clientId: getAupClientId(options),
        clientType: 'web',
        co: options.country,
        pa,
        cs,
        ms,
    };
    const pc = offer.productArrangement?.productCode;
    if (pc) context.pc = pc;
    for (const key of ['svar', 'customerIntent', 'sid']) {
        if (options[key]) context[key] = options[key];
    }
    const params = {
        lang: toCheckoutLanguage(options.language),
        nr: 'adobe-com-stable',
        ctxrturl: options.ctxrturl ?? window.location.href,
        ot: offer.offerType,
        items: offers
            .map(({ offerId }, index) => {
                const quantity =
                    options.q ??
                    options.quantity?.[index] ??
                    options.quantity?.[0];
                return quantity == null ? offerId : `${offerId}|${quantity}`;
            })
            .join(','),
    };
    // values of the options under their checkout names, an option named as the parameter wins
    const derived = {
        step: options.checkoutWorkflowStep,
        apc: options.promotionCode,
        ao:
            options.addonProductArrangementCode ??
            (options.checkoutWorkflowStep === CheckoutWorkflowStep.SEGMENTATION
                ? getAddonProductArrangementCode(offers, pa)
                : undefined),
        code: options.authCode,
    };
    for (const name of [...CHECKOUT_PARAMS, ...AUP_PARAMS]) {
        const key = AUP_PARAM_NAMES[name] ?? name;
        const value = options[key] ?? options[name] ?? derived[key];
        if (value != null) params[key] = value;
    }
    return {
        intent: offer.offerType === 'TRIAL' ? 'try' : 'buy',
        context,
        params,
        enableRenderIn: 'iframe',
    };
}

/**
 * Opens the AUP checkout of the offers.
 * @param {(cart: object[]) => void} [onClose] receives the cart the user left on close
 * @returns {Promise<boolean>} false when the checkout should go the legacy way
 */
export async function launchAupCheckout(
    sdk,
    offers,
    options,
    onClose,
    timeout = HOST_TIMEOUT_MS,
    hasUpgradeAction = false,
) {
    const request = getRequest(offers, options, hasUpgradeAction);
    if (!request) return false;
    let timer;
    const orchestrator = await Promise.race([
        sdk.getOrchestratorContext(),
        new Promise((_, reject) => {
            timer = setTimeout(
                () =>
                    reject(
                        new Error('AUP host timed out: getOrchestratorContext'),
                    ),
                timeout,
            );
        }),
    ]).finally(() => clearTimeout(timer));
    if (!orchestrator?.launchWorkflowInModal) return false;
    Log.module('aup-select').debug('Launching workflow:', request);
    let result;
    // The workflow settles when the user exits, not when the dialog opens.
    if (onClose) {
        let cart;
        // A per-launch handler replaces the host handler in the SDK.
        const hostHandler = orchestrator.clientMessageHandler;
        result = await orchestrator.launchWorkflowInModal(
            request,
            (name, payload, parentHandler) => {
                const actions = payload?.data?.actions;
                if (
                    name === 'System' &&
                    payload?.subType === 'AppClosed' &&
                    Array.isArray(actions)
                ) {
                    cart = actions.find(
                        (action) =>
                            action?.required &&
                            action.actionMessage?.type === 'System' &&
                            action.actionMessage?.subType === 'ReportState',
                    )?.actionMessage.data?.commerce?.cart;
                }
                return hostHandler
                    ? hostHandler(name, payload, parentHandler)
                    : parentHandler(name, payload);
            },
        );
        if (
            result?.status === 'cancel' &&
            Array.isArray(cart) &&
            cart.every(
                (item) => typeof item?.productArrangementCode === 'string',
            ) &&
            cart.some(
                (item) => item.productArrangementCode === request.context.pa,
            )
        ) {
            onClose(cart);
        }
    } else {
        result = await orchestrator.launchWorkflowInModal(request);
    }
    return result?.status !== 'no-workflow-found';
}

/**
 * Applies the cart the user left in AUP to the addon and quantity of the card
 * of the CTA, if it still shows the offers of the checkout.
 */
export function syncAupCart(element, card, id, offers, cart) {
    try {
        const pa = offers[0].productArrangementCode;
        if (
            element.masElement.state !== STATE_RESOLVED ||
            element.value[0]?.productArrangementCode !== pa
        )
            return;
        const addonPrices = [
            ...card.querySelectorAll('merch-addon [is="inline-price"]'),
        ];
        if (
            card.addonCheckbox &&
            (!addonPrices.length ||
                addonPrices.some(
                    (price) =>
                        price.masElement.state !== STATE_RESOLVED ||
                        !price.value?.length,
                ))
        )
            return;
        const addonOffers = addonPrices.flatMap((price) => price.value);
        const items = cart.filter(
            ({ productArrangementCode }) =>
                productArrangementCode === pa ||
                addonOffers.some(
                    (offer) =>
                        offer.productArrangementCode === productArrangementCode,
                ),
        );
        card.dispatchEvent(
            new CustomEvent(EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE, {
                detail: { id, items, productArrangementCode: pa },
            }),
        );
    } catch (error) {
        element.masElement.log.warn(
            'AUP checkout cart synchronization failed',
            error,
        );
    }
}
