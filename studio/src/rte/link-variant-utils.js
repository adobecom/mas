// The 3 CTA styles allowed for headless-template CTAs. Milo's own block decoration maps bold/italic
// link text to the context-appropriate button style, so MAS never sets a button-style class here —
// it only applies a real <strong>/<em> wrapper (see rte-field.js's #marksForHeadlessVariant) and lets
// Milo do the rest.
export const HEADLESS_LINK_VARIANTS = [
    { value: 'primary', label: 'Primary button' },
    { value: 'secondary', label: 'Secondary button' },
    { value: 'secondary-link', label: 'Link' },
];

const HEADLESS_VARIANT_MARKS = { primary: 'strong', secondary: 'em' };

/** ProseMirror mark type name ('strong'/'em') to wrap a headless CTA in for a given variant, or
 *  null for 'secondary-link' (Link/plain - no wrapper). */
export function getMarkNameForHeadlessVariant(variant) {
    return HEADLESS_VARIANT_MARKS[variant] ?? null;
}

/** Reverse of getMarkNameForHeadlessVariant, used to derive the picker's current selection (and
 *  the atom's visual emphasis) from a link node's own marks. */
export function getHeadlessVariantForMarkName(markName) {
    if (markName === 'strong') return 'primary';
    if (markName === 'em') return 'secondary';
    return 'secondary-link';
}

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
    if (className.includes('primary') && !className.includes('-link')) return 'bold';
    if (className.includes('secondary') && !className.includes('-link')) return 'italic';
    return null;
}
