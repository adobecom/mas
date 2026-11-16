/**
 * Maps resolved offers and normalized checkout options to serializer input.
 * Browser/service option collection is the caller's responsibility.
 */
export function resolveCheckoutData(offers, options, { env, landscape, is3in1 = false, context = is3in1 ? 'if' : 'fp' } = {}) {
    const {
        checkoutClientId: clientId,
        checkoutMarketSegment,
        checkoutWorkflowStep: workflowStep,
        country,
        promotionCode: checkoutPromoCode,
        quantity: optionsQuantity,
        preselectPlan,
        ms,
        cs,
        ...rest
    } = options;
    const [
        {
            productArrangementCode,
            marketSegments: [offerMarketSegment],
            customerSegment: offerCustomerSegment,
            offerType,
        },
    ] = offers;
    let marketSegment = ms ?? offerMarketSegment ?? checkoutMarketSegment;
    let customerSegment = cs ?? offerCustomerSegment;
    if (preselectPlan?.toLowerCase() === 'edu') {
        marketSegment = 'EDU';
    } else if (preselectPlan?.toLowerCase() === 'team') {
        customerSegment = 'TEAM';
    }
    const data = {
        is3in1,
        checkoutPromoCode,
        clientId,
        context,
        country,
        env,
        items: [],
        marketSegment,
        customerSegment,
        offerType,
        productArrangementCode,
        workflowStep,
        landscape,
        ...rest,
    };
    // The primary quantity applies to every item, including addons.
    const quantity = optionsQuantity[0] > 1 ? optionsQuantity[0] : undefined;
    if (offers.length === 1) {
        const { offerId } = offers[0];
        data.items.push({ id: offerId, quantity });
    } else {
        data.items.push(
            ...offers.map(({ offerId, productArrangementCode }) => ({
                id: offerId,
                quantity,
                ...(is3in1 ? { productArrangementCode } : {}),
            })),
        );
    }
    return data;
}

export function resolveCheckoutIntent(offer) {
    return offer.offerType === 'TRIAL' ? 'try' : 'buy';
}
