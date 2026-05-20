/**
 * Pattern for 32-character uppercase hex offer IDs.
 * @type {RegExp}
 */
const OFFER_ID_PATTERN = /^[0-9A-F]{32}$/;

/**
 * Pattern for 43-character base64-like offer selector IDs.
 * @type {RegExp}
 */
const OFFER_SELECTOR_ID_PATTERN = /^[a-zA-Z0-9_-]{43}$/;

/**
 * Tests whether a string is a valid offer ID.
 * @param {*} str
 * @returns {boolean}
 */
function isOfferId(str) {
    return typeof str === 'string' && OFFER_ID_PATTERN.test(str);
}

/**
 * Tests whether a string is a valid offer selector ID.
 * @param {*} str
 * @returns {boolean}
 */
function isOfferSelectorId(str) {
    return typeof str === 'string' && OFFER_SELECTOR_ID_PATTERN.test(str);
}

export { OFFER_ID_PATTERN, OFFER_SELECTOR_ID_PATTERN, isOfferId, isOfferSelectorId };
