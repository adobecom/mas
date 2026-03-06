import {
    forceTaxExclusivePrice,
    isNotEmptyString,
    isPositiveFiniteNumber,
    toPositiveFiniteInteger,
} from '@dexter/tacocat-core';
import { HEADER_X_REQUEST_ID } from './constants';
import { Log } from './log.js';

const MAS_COMMERCE_SERVICE = 'mas-commerce-service';
const log = Log.module('utilities');

export const FETCH_INFO_HEADERS = {
    requestId: HEADER_X_REQUEST_ID,
    etag: 'Etag',
    lastModified: 'Last-Modified',
    serverTiming: 'server-timing',
};

/**
 * @param {Offer[]} offers
 * @param {Commerce.Options} options
 * @returns {Offer[]}
 */
export function selectOffers(offers, { country, forceTaxExclusive }) {
    let selected;
    if (offers.length < 2) selected = offers;
    else {
        const language = country === 'GB' ? 'EN' : 'MULT';
        // sort offers by language, so that preferred language is selected first
        offers.sort((a, b) =>
            a.language === language ? -1 : b.language === language ? 1 : 0,
        );
        // sort offers, first should be offers that don't have 'term' field
        offers.sort((a, b) => {
            if (!a.term && b.term) return -1;
            if (a.term && !b.term) return 1;
            return 0;
        });
        selected = [offers[0]];
    }
    if (forceTaxExclusive) {
        selected = selected.map(forceTaxExclusivePrice);
    }
    return selected;
}

/**
 * Sums a numeric field from offers, rounding to 2 decimal places.
 * @param {Offer[]} offers
 * @param {function} getter - Function to extract value from offer
 * @returns {number|undefined} Rounded sum, or undefined if sum is 0
 */
const sumField = (offers, getter) => {
    const sum = offers.reduce((acc, offer) => acc + (getter(offer) || 0), 0);
    return sum > 0 ? Math.round(sum * 100) / 100 : undefined;
};

/**
 * Sums prices from multiple offers into a single combined offer.
 * Used for soft bundles where multiple OSIs need to be summed.
 * @param {Offer[]} offers - Array of offers to sum (one per OSI)
 * @returns {Offer} Combined offer with summed prices
 */
export function sumOffers(offers) {
    if (!offers || offers.length === 0) return null;
    if (offers.length === 1) return offers[0];

    const [firstOffer, ...restOffers] = offers;

    // Validate compatibility
    for (const offer of restOffers) {
        const checks = [
            ['commitment', 'commitment types'],
            ['term', 'terms'],
            ['priceDetails.formatString', 'currency formats'],
        ];
        for (const [path, label] of checks) {
            const expected = path.includes('.')
                ? firstOffer.priceDetails?.formatString
                : firstOffer[path];
            const actual = path.includes('.')
                ? offer.priceDetails?.formatString
                : offer[path];
            if (actual !== expected) {
                log.warn(
                    `Offers have different ${label}, summing may produce unexpected results`,
                    { expected, actual },
                );
            }
        }
    }

    // Sum priceDetails fields
    const priceFields = [
        ['price', (o) => o.priceDetails?.price],
        ['priceWithoutDiscount', (o) => o.priceDetails?.priceWithoutDiscount],
        ['priceWithoutTax', (o) => o.priceDetails?.priceWithoutTax],
        [
            'priceWithoutDiscountAndTax',
            (o) => o.priceDetails?.priceWithoutDiscountAndTax,
        ],
    ];

    const summedPrices = {};
    for (const [key, getter] of priceFields) {
        const sum = sumField(offers, getter);
        if (sum !== undefined) summedPrices[key] = sum;
    }

    // Sum annualized prices if present
    const hasAnnualized = offers.some((o) => o.priceDetails?.annualized);
    let annualized;
    if (hasAnnualized) {
        const annualizedFields = [
            [
                'annualizedPrice',
                (o) => o.priceDetails?.annualized?.annualizedPrice,
            ],
            [
                'annualizedPriceWithoutTax',
                (o) => o.priceDetails?.annualized?.annualizedPriceWithoutTax,
            ],
            [
                'annualizedPriceWithoutDiscount',
                (o) =>
                    o.priceDetails?.annualized?.annualizedPriceWithoutDiscount,
            ],
            [
                'annualizedPriceWithoutDiscountAndTax',
                (o) =>
                    o.priceDetails?.annualized
                        ?.annualizedPriceWithoutDiscountAndTax,
            ],
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
        priceDetails: {
            ...firstOffer.priceDetails,
            ...summedPrices,
            ...(annualized && { annualized }),
        },
    };
}

export const setImmediate = (getConfig) => window.setTimeout(getConfig);

/**
 * @param {any} value
 * @param {number} defaultValue
 * @returns {number[]}
 */
export function toQuantity(value, defaultValue = 1) {
    if (value == null) return [defaultValue];
    let quantity = (Array.isArray(value) ? value : String(value).split(','))
        .map(toPositiveFiniteInteger)
        .filter(isPositiveFiniteNumber);
    if (!quantity.length) quantity = [defaultValue];
    return quantity;
}

/**
 * @param {any} value
 * @returns {string[]}
 */
export function toOfferSelectorIds(value) {
    if (value == null) return [];
    const ids = Array.isArray(value) ? value : String(value).split(',');
    return ids.filter(isNotEmptyString);
}

/**
 * For internal use only.
 * This function expects an active instance of commerce service
 * to exist in the current DOM.
 * If commerce service has not been yet activated or was resetted, `null`.
 * @returns
 */
export function getService() {
    return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
}

/**
 * Returns headers to be logged
 * @param {Response} response - fetch response
 * @returns {Object}
 */
export function getLogHeaders(response) {
    const logHeaders = {};
    if (!response?.headers) return logHeaders;
    const headers = response.headers;
    for (const [key, value] of Object.entries(FETCH_INFO_HEADERS)) {
        let headerValue = headers.get(value);
        if (headerValue) {
            headerValue = headerValue.replace(/[,;]/g, '|');
            headerValue = headerValue.replace(/[| ]+/g, '|');
            logHeaders[key] = headerValue;
        }
    }
    return logHeaders;
}
