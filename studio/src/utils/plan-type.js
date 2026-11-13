/**
 * Maps an offer's commitment/term to the plan type used in `mas:plan_type/<type>` tags.
 * Mirrors the switch of `getPlanType` in io/studio/src/ost-products/write.js (not importable
 * from Studio), with deliberate differences: no NOT_IN_OFFER sentinel (null instead),
 * TERM_LICENSE+P3Y is not an allowed type (null), and the result is lowercase to match the tag form.
 *
 * @param {{commitment?: string, term?: string}|null} [offer] - selected base offer
 * @returns {'abm'|'puf'|'m2m'|'perpetual'|null} plan type, or null when the offer maps to none
 */
export function getPlanType(offer) {
    switch (offer?.commitment) {
        case 'YEAR':
            return offer.term === 'MONTHLY' ? 'abm' : offer.term === 'ANNUAL' ? 'puf' : null;
        case 'MONTH':
            return offer.term === 'MONTHLY' ? 'm2m' : null;
        case 'PERPETUAL':
            return 'perpetual';
        default:
            return null;
    }
}
