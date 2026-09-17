import { applyPageLocaleToCheckoutUrl } from './buildCheckoutUrl.js';
import { AUP_CHECKOUT_CLIENT_IDS, MODAL_TYPE_3_IN_1 } from './constants.js';
import { Log } from './log.js';

// A hung context lookup would otherwise leave aupCheckoutPending stuck true and
// silently no-op every checkout CTA on the page for the rest of its life.
const HOST_TIMEOUT_MS = 20000;

function withTimeout(promise, stage, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(
            () => reject(new Error(`AUP host timed out: ${stage}`)),
            ms,
        );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function isAupCheckoutSupported(offers, options) {
    return (
        AUP_CHECKOUT_CLIENT_IDS.has(options.checkoutClientId) &&
        offers.length > 0 &&
        !options.upgrade &&
        !options.perpetual &&
        !offers.some((offer) => offer.commitment === 'PERPETUAL')
    );
}

function getRequest(offers, options) {
    if (!isAupCheckoutSupported(offers, options)) return;
    const [offer] = offers;
    const context = {
        clientId: options.checkoutClientId,
        clientType: 'web',
        co: options.country,
        pa: offer.productArrangementCode,
        cs: options.cs,
        ms: options.ms,
    };
    if (
        context.clientId !== 'doc_cloud' &&
        Object.values(MODAL_TYPE_3_IN_1).includes(options.modal)
    ) {
        context.clientId =
            options.modal === MODAL_TYPE_3_IN_1.CRM ? 'creative' : 'mini_plans';
    }
    const preselectPlan = options.preselectPlan?.toLowerCase();
    if (preselectPlan === 'edu') context.ms = 'EDU';
    if (preselectPlan === 'team') context.cs = 'TEAM';
    const pc = offer.productArrangement?.productCode;
    if (pc) context.pc = pc;
    for (const key of ['svar', 'customerIntent', 'sid']) {
        if (options[key]) context[key] = options[key];
    }
    const localeUrl = new URL('https://commerce.adobe.com');
    localeUrl.searchParams.set('lang', options.language);
    const params = {
        lang: new URL(applyPageLocaleToCheckoutUrl(localeUrl)).searchParams.get(
            'lang',
        ),
        nr: 'stable',
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
    for (const [key, value] of Object.entries({
        step: options.checkoutWorkflowStep,
        apc: options.promotionCode,
        ao: options.addonProductArrangementCode,
        code: options.authCode,
        soSu: options['so.su'],
        soCa: options['so.ca'],
        soVa: options['so.va'],
        soTr: options['so.tr'],
        contextGuid: options['context.guid'],
        dcwatc: options.DCWATC,
    })) {
        if (value != null) params[key] = value;
    }
    for (const key of [
        'step',
        'apc',
        'ao',
        'ctx',
        'ijt',
        'otac',
        'nglwfdata',
        'appctxid',
        'soSu',
        'soCa',
        'soVa',
        'soTr',
        'promoid',
        'sdid',
        'trackingid',
        'mv',
        'mv2',
        'contextGuid',
        'ai',
        'sc',
        'th',
        'lo',
        'gsp',
        'spint',
        'mal',
        'csm',
        'af',
        'rf',
        'usid',
        'dcwatc',
        'cf',
        'rtc',
        'ccli',
        'csc',
        'referrer',
        'code',
        'ew',
        'pp',
        'token',
        'mat',
        'pcid',
    ]) {
        if (options[key] != null) params[key] = options[key];
    }
    return {
        intent: offer.offerType === 'TRIAL' ? 'try' : 'buy',
        context,
        params,
        enableRenderIn: 'iframe',
    };
}

export async function launchAupCheckout(
    sdk,
    offers,
    options,
    onClose,
    timeout = HOST_TIMEOUT_MS,
) {
    const request = getRequest(offers, options);
    if (!request) return false;
    const orchestrator = await withTimeout(
        sdk.getOrchestratorContext(),
        'getOrchestratorContext',
        timeout,
    );
    if (typeof orchestrator?.launchWorkflowInModal !== 'function') return false;
    let items;
    let messageHandler;
    if (onClose) {
        // A per-launch handler replaces the host handler in the SDK.
        const hostHandler = orchestrator.clientMessageHandler;
        messageHandler = (name, payload, parentHandler) => {
            const actions = payload?.data?.actions;
            if (
                name === 'System' &&
                payload?.subType === 'AppClosed' &&
                Array.isArray(actions)
            ) {
                items = actions.find(
                    (action) =>
                        action?.required &&
                        action.actionMessage?.type === 'System' &&
                        action.actionMessage?.subType === 'ReportState',
                )?.actionMessage.data?.commerce?.cart;
            }
            if (typeof hostHandler === 'function') {
                return hostHandler(name, payload, parentHandler);
            }
            return parentHandler(name, payload);
        };
    }
    Log.module('aup-select').debug('Launching workflow:', request);
    // This promise settles when the user exits, not when the dialog opens.
    const result = await (messageHandler
        ? orchestrator.launchWorkflowInModal(request, messageHandler)
        : orchestrator.launchWorkflowInModal(request));
    if (result?.status === 'cancel') {
        if (
            Array.isArray(items) &&
            items.every(
                (item) => typeof item?.productArrangementCode === 'string',
            ) &&
            items.some(
                (item) => item?.productArrangementCode === request.context.pa,
            )
        ) {
            onClose?.(items);
        }
    }
    return result?.status !== 'no-workflow-found';
}
