import { MOBILE_LANDSCAPE, TABLET_UP, C2_DESKTOP_UP } from '../media.js';

export const CSS = `
:root {
    --consonant-merch-card-plans-redesign-max-width: 394px;
    --consonant-merch-card-plans-redesign-min-width: 261px;
    --consonant-merch-card-plans-redesign-frame-bg-default: var(--s2a-color-background-subtle, #f8f8f8);
    --consonant-merch-card-plans-redesign-frame-bg-black: var(--s2a-color-background-knockout, #000);
}

/* Width is driven by the grid track, not a fixed value — cards fluidly fit
   261px (1280 viewport) → 394px (1920 viewport) per Figma. */
merch-card[variant="plans-redesign"] {
    width: 100%;
    max-width: var(--consonant-merch-card-plans-redesign-max-width);
    overflow: visible;
    position: relative;
}

/* Callout banner link — inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
merch-card[variant="plans-redesign"] [slot="callout-content"] a {
    display: inline;
    color: inherit;
    font-weight: inherit;
    text-decoration: underline;
    white-space: normal;
}

/* The callout sits flat on the license-zone (Figma 1098:30779) — drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
merch-card[variant="plans-redesign"] [slot="callout-content"] > p,
merch-card[variant="plans-redesign"] [slot="callout-content"] > div > div {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: auto;
    font-size: 12px;
    line-height: 16px;
}

merch-card[variant="plans-redesign"] [slot="callout-content"] > div {
    margin: 0;
}

/* Terms link — "See terms | See what's included" inline anchors */
merch-card[variant="plans-redesign"] [slot="terms-link"] a {
    color: inherit;
    text-decoration: underline;
}

/* AI Assistant add-on row — Figma 1098:33812 / 1098:33951:
   white bg, #8d88f2 border, 8px radius, checkbox + label + trailing sparkle */
merch-card[variant="plans-redesign"] [slot="add-on"] .ai-addon {
    display: flex;
    align-items: center;
    gap: var(--s2a-spacing-xs, 8px);
    padding: var(--s2a-spacing-md, 16px) var(--s2a-spacing-sm, 12px);
    background: var(--s2a-color-background-default, #fff);
    border: var(--s2a-border-width-sm, 1px) solid #8d88f2;
    border-radius: var(--s2a-border-radius-sm, 8px);
    box-sizing: border-box;
}
/* Spectrum-2 style checkbox: 20×20, 2px border, 2px radius.
   Filled accent + white checkmark when checked. */
merch-card[variant="plans-redesign"] [slot="add-on"] .ai-addon-checkbox {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    border: 2px solid #8d88f2;
    border-radius: 2px;
    box-sizing: border-box;
    background: #fff;
    position: relative;
    cursor: pointer;
}
merch-card[variant="plans-redesign"] [slot="add-on"] .ai-addon-checkbox[data-checked="true"] {
    background: #8d88f2;
    border-color: #8d88f2;
}
merch-card[variant="plans-redesign"] [slot="add-on"] .ai-addon-checkbox[data-checked="true"]::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: #fff;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M6.5 12.2 2.5 8.3 3.9 6.9 6.5 9.4 12.1 3.8 13.5 5.2Z'/%3E%3C/svg%3E") center / 12px no-repeat;
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M6.5 12.2 2.5 8.3 3.9 6.9 6.5 9.4 12.1 3.8 13.5 5.2Z'/%3E%3C/svg%3E") center / 12px no-repeat;
}
merch-card[variant="plans-redesign"] [slot="add-on"] .ai-addon-label {
    flex: 1 0 0;
    min-width: 0;
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: var(--s2a-color-content-default, #000);
    margin: 0;
}
/* Trailing sparkle — same purple→red AI gradient as the AI Assistant section
   header icon (see studio/src/constants/plans-redesign-icons.js ai-sparkle). */
merch-card[variant="plans-redesign"] [slot="add-on"] .ai-addon-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    background: linear-gradient(135deg, #8d88f2 0%, #eb1000 100%);
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E") center / contain no-repeat;
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

/* Light-DOM color overrides — beat global promo/legal styling */
merch-card[variant="plans-redesign"] [slot="promo-text"] {
    color: var(--s2a-color-content-subtle, #000000a3);
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    margin: 0;
}

/* Light-DOM typography for heading-xs / body-xs — must live here (not in
   shadow ::slotted) so it beats the global merch-card [slot="heading-xs"]
   rule. Per CSS Scoping, light-DOM rules outrank shadow ::slotted regardless
   of specificity, so the variant's slotted rules cannot win on their own. */
merch-card[variant="plans-redesign"] [slot="heading-xs"] {
    margin: 0;
    font-family: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    font-weight: 900;
    font-size: var(--s2a-typography-font-size-title-4, 24px);
    line-height: var(--s2a-typography-line-height-title-4, 24px);
    letter-spacing: var(--s2a-font-letter-spacing-4xl, -0.48px);
    color: var(--s2a-color-content-default, #000);
}

merch-card[variant="plans-redesign"] [slot="body-xs"] {
    margin: 0;
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
    font-weight: 400;
    font-size: var(--s2a-typography-font-size-body-sm, 14px);
    line-height: var(--s2a-typography-line-height-body-sm, 18px);
    letter-spacing: var(--s2a-typography-letter-spacing-body-sm, 0.14px);
    color: var(--s2a-color-content-default, #000);
}

/* Title / description fields are RTE — authors may save <h3>Title</h3> or
   <div><p>desc</p></div>, which the AEM mapping then wraps again. Make any
   inner block descendant inherit the outer slot styles so the visible text
   uses the variant typography instead of UA defaults. */
merch-card[variant="plans-redesign"] [slot="heading-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span),
merch-card[variant="plans-redesign"] [slot="body-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span) {
    margin: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
}

/* Rich whats-included styling: section title + bullet items + dividers */
merch-card[variant="plans-redesign"] [slot="whats-included"] {
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
}

merch-card[variant="plans-redesign"] [slot="whats-included"] .section,
merch-card[variant="plans-redesign"] [slot="whats-included"] h4,
merch-card[variant="plans-redesign"] [slot="whats-included"] h5 {
    margin: 0;
}

/* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
merch-card[variant="plans-redesign"] [slot="whats-included"] .section {
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

merch-card[variant="plans-redesign"] [slot="whats-included"] h4 {
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: inherit;
    display: flex;
    align-items: center;
    gap: var(--s2a-spacing-2xs, 4px);
}

merch-card[variant="plans-redesign"] [slot="whats-included"] ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s2a-spacing-sm, 12px);
}

merch-card[variant="plans-redesign"] [slot="whats-included"] ul li {
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--s2a-color-content-subtle, #000000a3);
    padding: 0 20px;
}

merch-card[variant="plans-redesign"][border-color="black"] [slot="whats-included"] ul li {
    color: var(--s2a-color-content-knockout, #ffffff);
}

merch-card[variant="plans-redesign"] [slot="whats-included"] .section + .section {
    border-top: 1px solid var(--consonant-merch-card-plans-redesign-divider-color, var(--s2a-color-transparent-black-12, #0000001f));
    padding-top: 16px;
}

/* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px. */
merch-card[variant="plans-redesign"] [slot="whats-included"] .section:not(:only-child):last-child ul {
    margin-top: 8px;
}

/* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker). */
merch-card[variant="plans-redesign"] [slot="whats-included"] .section h4 > svg,
merch-card[variant="plans-redesign"] [slot="whats-included"] .section h4 > .sp-icon,
merch-card[variant="plans-redesign"] [slot="whats-included"] .section h4 > merch-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    color: inherit;
}
merch-card[variant="plans-redesign"] [slot="whats-included"] .section:first-child h4 > svg,
merch-card[variant="plans-redesign"] [slot="whats-included"] .section:first-child h4 > .sp-icon,
merch-card[variant="plans-redesign"] [slot="whats-included"] .section:first-child h4 > merch-icon {
    width: 20px;
    height: 20px;
}

/* CTA styling — pill-shaped buttons, accent solid + outlined */
merch-card[variant="plans-redesign"] [slot="footer"] a,
merch-card[variant="plans-redesign"] [slot="footer"] button {
    flex: 1 0 0;
    min-width: 0;
    height: 40px;
    padding: 14px var(--s2a-spacing-lg, 24px);
    border-radius: var(--s2a-border-radius-999, 999px);
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    text-align: center;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    white-space: nowrap;
}

merch-card[variant="plans-redesign"] [slot="footer"] .con-button.blue,
merch-card[variant="plans-redesign"] [slot="footer"] a.accent,
merch-card[variant="plans-redesign"] [slot="footer"] [data-button-type="accent"] {
    background: var(--s2a-color-button-background-primary-solid-default, #3b63fb);
    color: var(--s2a-color-button-content-primary-solid-default, #fff);
    border: none;
}

merch-card[variant="plans-redesign"] [slot="footer"] .con-button.outline,
merch-card[variant="plans-redesign"] [slot="footer"] a.outline,
merch-card[variant="plans-redesign"] [slot="footer"] [data-button-type="primary"] {
    background: var(--s2a-color-button-background-primary-outlined-default, transparent);
    color: var(--s2a-color-button-content-primary-outlined-default, #000);
    border: var(--s2a-border-width-md, 2px) solid var(--s2a-color-button-border-primary-outlined-default, #000);
}

/* Price spans — individually styled per Figma */
merch-card[variant="plans-redesign"] [slot="heading-m"] .price,
merch-card[variant="plans-redesign"] [slot="heading-m"] .price-currency-symbol,
merch-card[variant="plans-redesign"] [slot="heading-m"] .price-integer,
merch-card[variant="plans-redesign"] [slot="heading-m"] .price-decimals-delimiter,
merch-card[variant="plans-redesign"] [slot="heading-m"] .price-decimals,
merch-card[variant="plans-redesign"] [slot="heading-m"] .price-recurrence {
    font-family: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--s2a-color-content-default, #000);
}

/* WCS recurrence dictionary returns abbreviations uppercased ("/MO");
   Figma's pricing typography presents it lowercase ("/mo"). */
merch-card[variant="plans-redesign"] [slot="heading-m"] .price-recurrence {
    text-transform: lowercase;
}

/* Collection grid — C2 breakpoints only (768, 1280).
   - Mobile: single column, full width.
   - Tablet (≥768): 2-column grid for 2/3/4 cards.
   - Desktop (≥1280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. Container max-width caps growth so
   cards don't exceed the Figma xl (394px) width. */
merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-redesign"]) {
    display: grid;
    gap: var(--s2a-grid-gutter, 8px);
    grid-template-columns: minmax(0, var(--consonant-merch-card-plans-redesign-max-width));
    justify-content: center;
    align-items: stretch;
    margin-inline: auto;
}

@media screen and ${TABLET_UP} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-redesign"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${C2_DESKTOP_UP} {
    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="plans-redesign"]) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="plans-redesign"]) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        max-width: 1600px;
    }
}

@media screen and ${MOBILE_LANDSCAPE} {
    merch-card[variant="plans-redesign"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-redesign-max-width);
    }
}

/* ETF / legal text inline link styling — underlined inline anchors */
merch-card[variant="plans-redesign"] [slot="legal-text"] a {
    color: inherit;
    text-decoration: underline;
}
`;
