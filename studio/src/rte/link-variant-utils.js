/** Persisted CTA variants available for headless-family templates. */
export const HEADLESS_LINK_VARIANTS = [
    { value: 'primary', label: 'Primary button' },
    { value: 'secondary', label: 'Secondary button' },
    { value: 'secondary-link', label: 'Link' },
];

/**
 * Resolves the picker's selection without rewriting variants authored with the full picker.
 */
export function resolveHeadlessDisplayVariant(storedVariant) {
    const variant = storedVariant?.split(/\s+/).find((value) => /^(accent|primary|secondary)(-(outline|link))?$/.test(value));
    switch (variant) {
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

/** Variant-derived emphasis for copying an individual CTA into a Milo document. */
export function getCtaEmphasis(className) {
    const variant = resolveHeadlessDisplayVariant(className);
    if (variant === 'primary') return 'bold';
    if (variant === 'secondary') return 'italic';
    return null;
}
