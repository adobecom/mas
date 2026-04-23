/**
 * Pure helper functions for mas-chat.js. Kept side-effect-free (no Store,
 * router, or customElements imports) so they can be unit-tested without
 * booting the full Studio context.
 *
 * Imports ONLY:
 *   - extractSurfaceFromPath from ../utils.js (itself pure — path-slicing)
 *
 * Extracted in MWPW-183572 Wave 5 to give the chat refactors (Wave 3)
 * direct unit-test coverage.
 */

import { extractSurfaceFromPath as extractSurface } from '../utils.js';
import { SURFACES } from '../constants.js';

const KNOWN_SURFACES = new Set(Object.values(SURFACES).map(({ name }) => name));

export const PRODUCT_SELECTION_MESSAGE_REGEX =
    /(which product|select(?:ing)? the product|pick one below|type any product name)/i;
export const SEGMENT_SELECTION_MESSAGE_REGEX = /who is this card targeting/i;

/**
 * Return the best display name for an MCS product, preferring MCS copy.name,
 * then raw name, then the UI label.
 */
export function getProductName(product) {
    return product?.copy?.name || product?.name || product?.label || '';
}

/**
 * Extract plain text from an HTML title string. Uses DOMParser (inert
 * document) so that <img> tags and other resource-loading elements do not
 * trigger network requests. Returns the fallback for empty / missing input.
 */
export function extractCardTitle(cardConfig, fallback = 'AI Generated Card') {
    if (!cardConfig?.title) return fallback;
    const doc = new DOMParser().parseFromString(cardConfig.title, 'text/html');
    return doc.body.textContent || fallback;
}

/**
 * Uppercase only the first character of a string.
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Flatten an MCS product object into the chat-card shape consumed by the UI.
 * Pure — no component state needed.
 */
export function mapProductToChatCard(product) {
    const customerSegments = Object.entries(product?.customerSegments || {})
        .filter(([, enabled]) => enabled)
        .map(([segment]) => segment);
    const segments = customerSegments.length ? customerSegments : [product?.customer_segment].filter(Boolean);

    return {
        label: product?.copy?.name || product?.name || product?.arrangement_code,
        value: product?.arrangement_code,
        arrangement_code: product?.arrangement_code,
        product_code: product?.product_code,
        product_family: product?.product_family,
        segments,
        icon: product?.assets?.icons?.svg || product?.icon,
        description: getPreferredProductDescription(product, product?.copy),
    };
}

/**
 * From any number of source objects (product, offer, merchandising payload),
 * pick the description candidate with the longest rendered-text length.
 * Short-circuits on plain-text strings to avoid DOMParser allocations.
 */
export function getPreferredProductDescription(...sources) {
    const candidates = [];

    for (const source of sources) {
        const values = [
            source?.copy?.description,
            source?.copy?.short_description,
            source?.copy?.shortDescription,
            source?.description,
            source?.short_description,
            source?.shortDescription,
        ];

        for (const value of values) {
            const normalized = typeof value === 'string' ? value.trim() : '';
            if (normalized) candidates.push(normalized);
        }
    }

    if (candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0];

    const textLength = (html) => {
        if (!html.includes('<')) return html.length;
        if (typeof DOMParser === 'undefined') return html.length;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return (doc.body.textContent || '').trim().length;
    };

    const measured = candidates.map((html) => ({ html, length: textLength(html) }));
    measured.sort((a, b) => b.length - a.length);
    return measured[0].html;
}

export function isProductSelectionStep(response) {
    if (response?.type !== 'guided_step') return false;
    if (response.buttonGroup?.label === 'Product') return true;
    return PRODUCT_SELECTION_MESSAGE_REGEX.test(response.message || '');
}

export function isSegmentSelectionStep(response) {
    if (response?.type !== 'guided_step') return false;
    if (response.buttonGroup?.label === 'Customer Segment') return true;
    return SEGMENT_SELECTION_MESSAGE_REGEX.test(response.message || '');
}

/**
 * Pick the buttonGroup option that matches the offer's customer+market segment.
 * Options may be simple (customerSegment) or composite (customerSegment|marketSegment).
 */
export function getAutoSelectedSegmentOption(response, offer) {
    if (!isSegmentSelectionStep(response) || !offer || !response.buttonGroup?.options?.length) {
        return null;
    }

    const customerSegment = String(offer.customer_segment || '').toUpperCase();
    const marketSegment = String(
        Array.isArray(offer.market_segments) ? offer.market_segments[0] : offer.market_segment || '',
    ).toUpperCase();

    if (!customerSegment) return null;

    return (
        response.buttonGroup.options.find((option) => {
            const value = String(option.value || '').toUpperCase();
            const [optionCustomerSegment, optionMarketSegment] = value.split('|');
            if (optionCustomerSegment !== customerSegment) return false;
            return !optionMarketSegment || !marketSegment || optionMarketSegment === marketSegment;
        }) || null
    );
}

/**
 * Extract + validate a known MAS surface from a filesystem-style path.
 */
export function extractKnownSurfaceFromPath(path) {
    if (!path || typeof path !== 'string') return null;
    const surface = path.includes('/') ? extractSurface(path) : path;
    return KNOWN_SURFACES.has(surface) ? surface : null;
}
