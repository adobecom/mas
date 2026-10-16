import { Commitment, Term } from './constants.js';

const getPlanType = (commitment, term) => {
    switch (commitment) {
        case undefined:
            return 'Value is not an offer';
        case '':
            return '';
        case Commitment.YEAR:
            return term === Term.MONTHLY ? 'ABM' : term === Term.ANNUAL ? 'PUF' : '';
        case Commitment.MONTH:
            return term === Term.MONTHLY ? 'M2M' : '';
        case Commitment.PERPETUAL:
            return 'PERPETUAL';
        case Commitment.TERM_LICENSE:
            return term === Term.P3Y ? 'P3Y' : '';
        default:
            return '';
    }
};

/**
 * Copies an offer with its derived plan type, preserving the legacy
 * tacocat 1.13.1 mapping and invalid-input behavior.
 */
export function applyPlanType(offer) {
    if (typeof offer !== 'object') return 'Value is not an offer';
    const { commitment, term } = offer;
    return { ...offer, planType: getPlanType(commitment, term) };
}

const forceTaxExclusivePrice = (offer) => {
    const { priceDetails } = offer;
    const { price, priceWithoutDiscount, priceWithoutTax, priceWithoutDiscountAndTax, taxDisplay } = priceDetails;
    if (taxDisplay !== 'TAX_INCLUSIVE_DETAILS') return offer;
    const amendedOffer = {
        ...offer,
        priceDetails: {
            ...priceDetails,
            price: priceWithoutTax ?? price,
            priceWithoutDiscount: priceWithoutDiscountAndTax ?? priceWithoutDiscount,
            taxDisplay: 'TAX_EXCLUSIVE',
        },
    };
    if (amendedOffer.offerType === 'TRIAL' && amendedOffer.priceDetails.price === 0) {
        amendedOffer.priceDetails.price = amendedOffer.priceDetails.priceWithoutDiscount;
    }
    return amendedOffer;
};

/**
 * Selects the preferred WCS offer. Sorting intentionally mutates the input array.
 */
export function selectOffers(offers, { country, forceTaxExclusive }) {
    let selected;
    if (offers.length < 2) selected = offers;
    else {
        const language = country === 'GB' ? 'EN' : 'MULT';
        offers.sort((a, b) => (a.language === language ? -1 : b.language === language ? 1 : 0));
        offers.sort((a, b) => {
            if (!a.term && b.term) return -1;
            if (a.term && !b.term) return 1;
            return 0;
        });
        selected = [offers[0]];
    }
    if (forceTaxExclusive) {
        selected = selected.map((offer) => {
            const amended = forceTaxExclusivePrice(offer);
            return amended === offer ? offer : { ...amended, priceInfo: undefined };
        });
    }
    return selected;
}

const sumField = (offers, getter) => {
    const sum = offers.reduce((acc, offer) => acc + (getter(offer) || 0), 0);
    return sum > 0 ? Math.round(sum * 100) / 100 : undefined;
};

/**
 * Combines soft-bundle prices, retaining first-offer metadata and warning on
 * incompatible inputs. A single offer is returned unchanged.
 */
export function sumOffers(offers, { logger = console } = {}) {
    if (!offers || offers.length === 0) return null;
    if (offers.length === 1) return offers[0];
    const [firstOffer, ...restOffers] = offers;
    for (const offer of restOffers) {
        const checks = [
            ['commitment', 'commitment types'],
            ['term', 'terms'],
            ['priceDetails.formatString', 'currency formats'],
        ];
        for (const [path, label] of checks) {
            const expected = path.includes('.') ? firstOffer.priceDetails?.formatString : firstOffer[path];
            const actual = path.includes('.') ? offer.priceDetails?.formatString : offer[path];
            if (actual !== expected) {
                logger.warn(`Offers have different ${label}, summing may produce unexpected results`, { expected, actual });
            }
        }
    }
    const priceFields = [
        ['price', (o) => o.priceDetails?.price],
        ['priceWithoutDiscount', (o) => o.priceDetails?.priceWithoutDiscount],
        ['priceWithoutTax', (o) => o.priceDetails?.priceWithoutTax],
        ['priceWithoutDiscountAndTax', (o) => o.priceDetails?.priceWithoutDiscountAndTax],
    ];
    const summedPrices = {};
    for (const [key, getter] of priceFields) {
        const sum = sumField(offers, getter);
        if (sum !== undefined) summedPrices[key] = sum;
    }
    const hasAnnualized = offers.some((o) => o.priceDetails?.annualized);
    let annualized;
    if (hasAnnualized) {
        const annualizedFields = [
            ['annualizedPrice', (o) => o.priceDetails?.annualized?.annualizedPrice],
            ['annualizedPriceWithoutTax', (o) => o.priceDetails?.annualized?.annualizedPriceWithoutTax],
            ['annualizedPriceWithoutDiscount', (o) => o.priceDetails?.annualized?.annualizedPriceWithoutDiscount],
            ['annualizedPriceWithoutDiscountAndTax', (o) => o.priceDetails?.annualized?.annualizedPriceWithoutDiscountAndTax],
        ];
        annualized = {};
        for (const [key, getter] of annualizedFields) {
            const sum = sumField(offers, getter);
            if (sum !== undefined) annualized[key] = sum;
        }
    }
    return {
        ...firstOffer,
        offerSelectorIds: offers.flatMap((o) => o.offerSelectorIds || []),
        priceInfo: undefined,
        priceDetails: {
            ...firstOffer.priceDetails,
            ...summedPrices,
            ...(annualized && { annualized }),
        },
    };
}
