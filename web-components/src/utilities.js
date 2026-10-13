import {
    isNotEmptyString,
    isPositiveFiniteNumber,
    toPositiveFiniteInteger,
} from '@dexter/tacocat-core';
import { sumOffers as combineOffers } from '@adobecom/mas-price';
export { selectOffers } from '@adobecom/mas-price';
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

export const sumOffers = (offers) => combineOffers(offers, { logger: log });

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
 * Splits comma-separated promo codes into an array,
 * keeping empty entries for OSI positions without a promo.
 * @param {any} value
 * @returns {string[]}
 */
export function toPromotionCodes(value) {
    if (value == null) return [];
    return Array.isArray(value)
        ? value
        : String(value)
              .split(',')
              .map((code) => code.trim());
}

/**
 * Zips OSI and promo-code lists by position for a soft bundle:
 * osi="A,B,C" promo="P1,,P3" -> A=P1, B=none, C=P3.
 * A single code (no comma) broadcasts to all OSIs.
 * A blank OSI also drops its paired code, so later OSIs keep their own.
 * @param {any} osiValue
 * @param {any} promotionCodeValue
 * @returns {{ wcsOsi: string[], promotionCodes: string[] }}
 */
export function toWcsOsiAndPromotionCodes(osiValue, promotionCodeValue) {
    const codes = toPromotionCodes(promotionCodeValue);
    if (osiValue == null) return { wcsOsi: [], promotionCodes: codes };
    const ids = Array.isArray(osiValue)
        ? osiValue
        : String(osiValue).split(',');
    if (codes.length <= 1) {
        return { wcsOsi: ids.filter(isNotEmptyString), promotionCodes: codes };
    }
    const wcsOsi = [];
    const promotionCodes = [];
    ids.forEach((id, index) => {
        if (!isNotEmptyString(id)) return;
        wcsOsi.push(id);
        promotionCodes.push(codes[index] ?? '');
    });
    return { wcsOsi, promotionCodes };
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
