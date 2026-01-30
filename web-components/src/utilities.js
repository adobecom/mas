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
 * Sums prices from multiple offers into a single combined offer.
 * Used for soft bundles where multiple OSIs need to be summed.
 * @param {Offer[]} offers - Array of offers to sum (one per OSI)
 * @returns {Offer} Combined offer with summed prices
 */
export function sumOffers(offers) {
    if (!offers || offers.length === 0) {
        return null;
    }
    if (offers.length === 1) {
        return offers[0];
    }

    const [firstOffer, ...restOffers] = offers;

    // Validate that all offers have compatible properties
    for (const offer of restOffers) {
        if (offer.commitment !== firstOffer.commitment) {
            log.warn(
                'Offers have different commitment types, summing may produce unexpected results',
                { expected: firstOffer.commitment, actual: offer.commitment },
            );
        }
        if (offer.term !== firstOffer.term) {
            log.warn(
                'Offers have different terms, summing may produce unexpected results',
                { expected: firstOffer.term, actual: offer.term },
            );
        }
        if (
            offer.priceDetails?.formatString !==
            firstOffer.priceDetails?.formatString
        ) {
            log.warn(
                'Offers have different currency formats, summing may produce unexpected results',
                {
                    expected: firstOffer.priceDetails?.formatString,
                    actual: offer.priceDetails?.formatString,
                },
            );
        }
    }

    // Sum the prices
    const summedPrice = offers.reduce(
        (sum, offer) => sum + (offer.priceDetails?.price || 0),
        0,
    );
    const summedPriceWithoutDiscount = offers.reduce(
        (sum, offer) => sum + (offer.priceDetails?.priceWithoutDiscount || 0),
        0,
    );
    const summedPriceWithoutTax = offers.reduce(
        (sum, offer) => sum + (offer.priceDetails?.priceWithoutTax || 0),
        0,
    );
    const summedPriceWithoutDiscountAndTax = offers.reduce(
        (sum, offer) =>
            sum + (offer.priceDetails?.priceWithoutDiscountAndTax || 0),
        0,
    );

    // Combine offerSelectorIds from all offers
    const combinedOfferSelectorIds = offers.flatMap(
        (offer) => offer.offerSelectorIds || [],
    );

    // Create combined offer using first offer as base
    return {
        ...firstOffer,
        offerSelectorIds: combinedOfferSelectorIds,
        priceDetails: {
            ...firstOffer.priceDetails,
            price: Math.round(summedPrice * 100) / 100,
            ...(summedPriceWithoutDiscount > 0 && {
                priceWithoutDiscount:
                    Math.round(summedPriceWithoutDiscount * 100) / 100,
            }),
            ...(summedPriceWithoutTax > 0 && {
                priceWithoutTax: Math.round(summedPriceWithoutTax * 100) / 100,
            }),
            ...(summedPriceWithoutDiscountAndTax > 0 && {
                priceWithoutDiscountAndTax:
                    Math.round(summedPriceWithoutDiscountAndTax * 100) / 100,
            }),
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
