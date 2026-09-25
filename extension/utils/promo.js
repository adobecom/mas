const CANCEL_CONTEXT_CODE = 'cancel-context';

const PROMO_CHILD_SELECTOR = '[data-promotion-code]';

function resolvePromotion({ contextCode, childCodes } = {}) {
    const rawChildCodes = Array.isArray(childCodes) ? childCodes : [];
    const hasCancelContext = contextCode === CANCEL_CONTEXT_CODE || rawChildCodes.includes(CANCEL_CONTEXT_CODE);
    const realChildCodes = [...new Set(rawChildCodes.filter((code) => code && code !== CANCEL_CONTEXT_CODE))];
    const realContextCode = contextCode && contextCode !== CANCEL_CONTEXT_CODE ? contextCode : null;

    return {
        effectiveCode: realChildCodes[0] || realContextCode || null,
        contextCode: realContextCode,
        childCodes: realChildCodes,
        hasCancelContext,
        hasConflict: realChildCodes.length > 1,
    };
}

function readElementPromotion(element) {
    if (!element || typeof element.getAttribute !== 'function') return null;

    const contextCode = element.getAttribute('data-promotion-code');
    const childCodes = Array.from(element.querySelectorAll(PROMO_CHILD_SELECTOR)).map((child) =>
        child.getAttribute('data-promotion-code'),
    );

    const promotion = resolvePromotion({ contextCode, childCodes });
    if (!promotion.effectiveCode && !promotion.hasCancelContext) return null;
    return promotion;
}

const MASPromo = { CANCEL_CONTEXT_CODE, resolvePromotion, readElementPromotion };

if (typeof self !== 'undefined') {
    self.MASPromo = MASPromo;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MASPromo;
}
