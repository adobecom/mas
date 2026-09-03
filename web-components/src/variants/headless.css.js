import { css, unsafeCSS } from 'lit';

/**
 * Variant names sharing the "headless" label + value row styling (no card chrome).
 * Add new headless-family variants here so the global overrides below reach them.
 */
const HEADLESS_FAMILY_VARIANTS = ['headless', 'marquee', 'faq', 'banner-blade'];

const familySelector = (slot, suffix = '') =>
    HEADLESS_FAMILY_VARIANTS.map(
        (variant) =>
            `merch-card[variant='${variant}'] [slot='${slot}']${suffix}`,
    ).join(',\n');

const familyClassSelector = (className) =>
    HEADLESS_FAMILY_VARIANTS.map(
        (variant) => `merch-card[variant='${variant}'] ${className}`,
    ).join(',\n');

/**
 * Global CSS for Headless variant (label + value only, no card chrome).
 * Layout is primarily defined in headlessRowStyle().
 */
export const CSS = `
/* Headless variant: minimal container for label/value rows */
.headless {
    display: flex;
    flex-direction: column;
    padding: var(--consonant-merch-spacing-xs, 8px);
}

/* Neutralize non-headless slot treatments (heading weight/color, promo-text green,
   callout background box) from global.css.js so every row renders as plain text,
   matching the untouched body-xs/short-description rows. Applies to every variant
   in HEADLESS_FAMILY_VARIANTS above. */
${familySelector('heading-xs')},
${familySelector('promo-text')} {
    color: var(--consonant-merch-card-body-xs-color);
    font-weight: 400;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
}
${familySelector('callout-content')} {
    display: block;
    margin: 0;
    gap: 0;
}
${familySelector('callout-content', ' > p')},
${familySelector('callout-content', ' > div')},
${familySelector('callout-content', ' > div > div')} {
    background: transparent;
    padding: 0;
    border-radius: 0;
    width: auto;
}
/* Subtle gray annotation next to each headless CTA showing its authored variant
   (Primary/Secondary/Link), set alongside the button in hydrate.js's transformLinkToButton(). */
${familyClassSelector('.headless-cta-item')} {
    display: inline-flex;
    align-items: center;
}
${familyClassSelector('.headless-cta-variant-label')} {
    font-size: 0.75em;
    color: var(--spectrum-gray-600);
    background: var(--spectrum-gray-100);
    border-radius: 4px;
    padding: 2px 6px;
    line-height: 1.4;
    margin-left: var(--consonant-merch-spacing-xxs, 4px);
}
${familyClassSelector('.headless-cta-item:not(:last-child)::after')} {
    content: ', ';
}
`;

/**
 * Shared scoped preview styling for every "headless" family variant (label + value
 * rows, no card chrome). Centralized so all headless-style templates (Headless,
 * Marquee Headless, FAQ Headless, Sticky Banner/Blade Headless, ...) render with identical
 * styling by construction instead of relying on copy-pasted CSS staying in sync.
 */
export function headlessRowStyle(variantName) {
    const variant = unsafeCSS(variantName);
    return css`
        :host([variant='${variant}']) {
            border: none;
            background: transparent;
            box-shadow: none;
        }
        :host([variant='${variant}']) .headless {
            display: flex;
            flex-direction: column;
            padding: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='${variant}']) .headless-row {
            display: flex;
            gap: var(--consonant-merch-spacing-xs, 8px);
            padding: var(--consonant-merch-spacing-xxs, 4px) 0;
        }
        :host([variant='${variant}']) .headless-label {
            flex-shrink: 0;
            font-weight: 600;
            min-width: 8em;
        }
        :host([variant='${variant}']) .headless-value {
            flex: 1;
        }
        :host([variant='${variant}']) .headless-value::slotted(*) {
            display: inline;
        }
        :host([variant='${variant}'])
            .headless-value[data-slot='footer']::slotted(div) {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='${variant}']) .headless-section {
            font-size: 0.75em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--spectrum-gray-600);
            padding-top: 4px;
        }
    `;
}
