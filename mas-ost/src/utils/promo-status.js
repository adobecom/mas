const NO_PROMO_TEXT = 'no promo';
const CLASS = 'promo-tag';
const PROMO_VARIANT = 'yellow';
const NOPROMO_VARIANT = 'neutral';
const PROMO_CONTEXT_CANCEL_VALUE = 'cancel-context';

function fullPromoText(promo, old, isOverriden) {
    const promoText = (p) => p || NO_PROMO_TEXT;
    const suffix = isOverriden ? ` (was "${promoText(old)}")` : '';
    return `${promoText(promo)}${suffix}`;
}

/**
 * Computes the full promo status from overridden and configured promo codes.
 * @param {string|undefined} overriden - overridden promotion code
 * @param {string|undefined} configured - configured promotion code
 * @returns {{ effectivePromoCode: string|undefined, overridenPromoCode: string|undefined, className: string, text: string, variant: string, isOverriden: boolean }}
 */
function computePromoStatus(overriden, configured) {
    const localPromoUnset = overriden === PROMO_CONTEXT_CANCEL_VALUE;
    const localPromoSet = !localPromoUnset && overriden?.length > 0;
    const isOverriden =
        (localPromoSet || localPromoUnset) &&
        ((configured && configured != overriden) ||
            (!configured && !localPromoUnset));
    const isPromo =
        (isOverriden && localPromoSet) || (!isOverriden && !!configured);
    const effectivePromoCode = isPromo ? overriden || configured : undefined;
    return {
        effectivePromoCode,
        overridenPromoCode: overriden,
        className: isPromo ? CLASS : `${CLASS} no-promo`,
        text: fullPromoText(effectivePromoCode, configured, isOverriden),
        variant: isPromo ? PROMO_VARIANT : NOPROMO_VARIANT,
        isOverriden,
    };
}

export { computePromoStatus, PROMO_CONTEXT_CANCEL_VALUE };
