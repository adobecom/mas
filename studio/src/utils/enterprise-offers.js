/** Reply shown when the assistant is asked for, or only matches, ENTERPRISE offers. */
export const OFFER_NOT_AVAILABLE_MESSAGE =
    "That offer isn't available in the assistant. Try an individual or team offer instead.";

const ENTERPRISE = 'ENTERPRISE';

function getSegments(item) {
    if (item?.customer_segment) return [String(item.customer_segment).trim().toUpperCase()];
    return Object.entries(item?.customerSegments ?? {})
        .filter(([, enabled]) => enabled)
        .map(([segment]) => segment.trim().toUpperCase());
}

/**
 * True when every customer segment of the offer or product is ENTERPRISE.
 * Items that also serve INDIVIDUAL or TEAM, or declare no segment, are kept.
 */
export function isEnterpriseOffer(item) {
    const segments = getSegments(item);
    return segments.length > 0 && segments.every((segment) => segment === ENTERPRISE);
}

/** Returns a new list without ENTERPRISE items; the input and its objects are never mutated. */
export function excludeEnterprise(list) {
    return Array.isArray(list) ? list.filter((item) => !isEnterpriseOffer(item)) : [];
}
