// The 3 CTA styles allowed for headless-template CTAs. The variant is persisted with the link
// (see rte-field.js's #handleLinkSave) through the same class-based mechanism as every other
// link variant, and CTA styling is applied at hydration time (web-components/src/hydrate.js).
// <strong>/<em> are plain text formatting here, same as everywhere else in the RTE.
export const HEADLESS_LINK_VARIANTS = [
    { value: 'primary', label: 'Primary button' },
    { value: 'secondary', label: 'Secondary button' },
    { value: 'secondary-link', label: 'Link' },
];

/**
 * Legacy fallback: approximates one of the 3 headless variants from a CTA's stored class, for
 * CTAs authored under the older class-driven button-style system (before real <strong>/<em>
 * wrapping existed) or carrying one of the 7 non-headless variant classes. Never used to rewrite
 * a stored variant - highlight/preview only.
 */
export function resolveHeadlessDisplayVariant(storedVariant) {
    switch (storedVariant) {
        case 'accent':
        case 'primary':
        case 'primary-outline':
            return 'primary';
        case 'secondary':
        case 'secondary-outline':
            return 'secondary';
        default:
            return 'secondary-link';
    }
}

/** Bold/italic-equivalent emphasis derived from a CTA's stored variant class - legacy fallback for
 *  CTAs with no real <strong>/<em> wrapper (see variation-utils.js#parseCtas). */
export function getCtaEmphasis(className) {
    if (!className) return null;
    if (className.includes('accent')) return 'bold';
    if (className.includes('primary') && !className.includes('-link')) return 'bold';
    if (className.includes('secondary') && !className.includes('-link')) return 'italic';
    return null;
}
