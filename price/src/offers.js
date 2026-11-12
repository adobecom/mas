import { Commitment, Term } from './constants.js';

const getPlanType = (commitment, term) => {
    switch (commitment) {
        case Commitment.YEAR:
            return term === Term.MONTHLY ? 'ABM' : term === Term.ANNUAL ? 'PUF' : '';
        case Commitment.MONTH:
            return term === Term.MONTHLY ? 'M2M' : '';
        case Commitment.PERPETUAL:
            return 'PERPETUAL';
        case Commitment.TERM_LICENSE:
            return term === Term.P3Y ? 'P3Y' : '';
    }
    return '';
};

/** Copies a WCS offer with its plan type derived from commitment and term. */
export const applyPlanType = (offer) => ({ ...offer, planType: getPlanType(offer.commitment, offer.term) });

/** Rewrites gross amounts with net ones; a zero-price trial shows its undiscounted net amount. */
const forceTaxExclusivePrice = (offer) => {
    const { priceDetails } = offer;
    if (priceDetails.taxDisplay !== 'TAX_INCLUSIVE_DETAILS') return offer;
    const price = priceDetails.priceWithoutTax ?? priceDetails.price;
    const priceWithoutDiscount = priceDetails.priceWithoutDiscountAndTax ?? priceDetails.priceWithoutDiscount;
    return {
        ...offer,
        priceDetails: {
            ...priceDetails,
            price: offer.offerType === 'TRIAL' && price === 0 ? priceWithoutDiscount : price,
            priceWithoutDiscount,
            taxDisplay: 'TAX_EXCLUSIVE',
        },
        // the WCS pre-split leaves carry the gross amounts
        priceInfo: undefined,
    };
};

/**
 * Selects the preferred WCS offer. Sorting intentionally mutates the input array.
 */
export function selectOffers(offers, { country, forceTaxExclusive }) {
    let selected = offers;
    if (offers.length > 1) {
        const language = country === 'GB' ? 'EN' : 'MULT';
        offers.sort((a, b) => (a.language === language ? -1 : b.language === language ? 1 : 0));
        offers.sort((a, b) => {
            if (!a.term && b.term) return -1;
            if (a.term && !b.term) return 1;
            return 0;
        });
        selected = [offers[0]];
    }
    return forceTaxExclusive ? selected.map(forceTaxExclusivePrice) : selected;
}

const PRICE_FIELDS = ['price', 'priceWithoutDiscount', 'priceWithoutTax', 'priceWithoutDiscountAndTax'];
const ANNUALIZED_FIELDS = [
    'annualizedPrice',
    'annualizedPriceWithoutTax',
    'annualizedPriceWithoutDiscount',
    'annualizedPriceWithoutDiscountAndTax',
];

/** Sums each field over `details`, keeping positive totals rounded to cents. */
const sumFields = (details, fields) => {
    const sums = {};
    for (const field of fields) {
        const sum = details.reduce((total, detail) => total + (detail?.[field] || 0), 0);
        if (sum > 0) sums[field] = Math.round(sum * 100) / 100;
    }
    return sums;
};

/**
 * Combines soft-bundle prices, retaining first-offer metadata and warning on
 * incompatible inputs. A single offer is returned unchanged.
 */
export function sumOffers(offers, { logger = console } = {}) {
    if (!offers?.length) return null;
    const [first] = offers;
    if (offers.length === 1) return first;
    for (const offer of offers.slice(1)) {
        for (const [expected, actual, label] of [
            [first.commitment, offer.commitment, 'commitment types'],
            [first.term, offer.term, 'terms'],
            [first.priceDetails?.formatString, offer.priceDetails?.formatString, 'currency formats'],
        ]) {
            if (actual !== expected) {
                logger.warn(`Offers have different ${label}, summing may produce unexpected results`, { expected, actual });
            }
        }
    }
    const details = offers.map((offer) => offer.priceDetails);
    const priceDetails = { ...first.priceDetails, ...sumFields(details, PRICE_FIELDS) };
    if (details.some((detail) => detail?.annualized)) {
        priceDetails.annualized = sumFields(
            details.map((detail) => detail?.annualized),
            ANNUALIZED_FIELDS,
        );
    }
    return {
        ...first,
        offerSelectorIds: offers.flatMap((offer) => offer.offerSelectorIds || []),
        priceInfo: undefined,
        priceDetails,
    };
}
