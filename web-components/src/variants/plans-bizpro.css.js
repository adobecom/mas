import { MOBILE_LANDSCAPE, TABLET_UP, C2_DESKTOP_UP } from '../media.js';

export const CSS = `
:root {
    --consonant-merch-card-plans-bizpro-max-width: 394px;
    --consonant-merch-card-plans-bizpro-min-width: 261px;
    --consonant-merch-card-plans-bizpro-frame-bg-default: var(--s2a-color-background-subtle, #f8f8f8);
    --consonant-merch-card-plans-bizpro-frame-bg-black: var(--s2a-color-background-knockout, #000);
}

/* Width is driven by the grid track, not a fixed value — cards fluidly fit
   261px (1280 viewport) → 394px (1920 viewport) per Figma. */
merch-card[variant="plans-bizpro"] {
    width: 100%;
    max-width: var(--consonant-merch-card-plans-bizpro-max-width);
    overflow: visible;
    position: relative;
}

/* Callout banner link — inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
merch-card[variant="plans-bizpro"] [slot="callout-content"] a {
    display: inline;
    color: inherit;
    font-weight: inherit;
    text-decoration: underline;
    white-space: normal;
}

/* The callout sits flat on the license-zone (Figma 1098:30779) — drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
merch-card[variant="plans-bizpro"] [slot="callout-content"] > p,
merch-card[variant="plans-bizpro"] [slot="callout-content"] > div > div {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: auto;
    font-size: 12px;
    line-height: 16px;
}

merch-card[variant="plans-bizpro"] [slot="callout-content"] > div {
    margin: 0;
}

/* Terms link — "See terms | See what's included" inline anchors */
merch-card[variant="plans-bizpro"] [slot="terms-link"] a {
    color: inherit;
    text-decoration: underline;
}

/* AI Assistant add-on row — Figma 1098:33812 / 1098:33951.
   Themes the real <merch-addon> injected at slot="addon". The purple frame
   and trailing sparkle live on the variant's .add-on wrapper (see variantStyle);
   here we size/colour the merch-addon checkbox + label via its custom props. */
merch-card[variant="plans-bizpro"] merch-addon[slot="addon"] {
    flex: 1 0 0;
    min-width: 0;
    --merch-addon-gap: var(--s2a-spacing-xs, 8px);
    --merch-addon-align: center;
    /* AI-gradient checkbox per Figma 1098:33812 — the rounded gradient border,
       and (when checked) checkmark use the exact Spectrum 2 S2_Icon_CheckBox_20_N
       paths, filled with the real AI gradient (#8D88F2 @ 48.8% → #EB1000 @ 100%,
       bottom-left→top-right). The CSS border is dropped; the ring lives in the SVG. */
    --merch-addon-checkbox-size: 20px;
    --merch-addon-checkbox-border: none;
    --merch-addon-checkbox-radius: 0;
    --merch-addon-checkbox-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='url(%23b)'/%3E%3Cdefs%3E%3ClinearGradient id='b' x1='2' y1='18' x2='17.1314' y2='1.2169' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0.488' stop-color='%238D88F2'/%3E%3Cstop offset='1' stop-color='%23EB1000'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") center / contain no-repeat;
    --merch-addon-checkbox-checked-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M14.4502 5.64453C14.1143 5.39844 13.6465 5.47363 13.4014 5.80664L8.86231 12.0042L7.19922 9.86328C6.94531 9.53711 6.47656 9.47754 6.14649 9.73047C5.81934 9.98535 5.75977 10.4561 6.01368 10.7832L8.28712 13.71C8.3047 13.7327 8.33131 13.7414 8.35108 13.7615C8.38062 13.7922 8.40088 13.8293 8.43653 13.8555C8.4629 13.8746 8.49268 13.8829 8.52051 13.8982C8.54444 13.9116 8.5669 13.9242 8.59229 13.9347C8.68531 13.9736 8.78125 14 8.87891 14C8.87915 14 8.87964 13.9998 8.87989 13.9998C8.88038 13.9998 8.88038 14 8.88087 14C8.98146 14 9.08058 13.9719 9.17579 13.9306C9.20265 13.919 9.22559 13.905 9.25099 13.8904C9.28029 13.8734 9.31227 13.864 9.33986 13.8428C9.37526 13.8152 9.39504 13.7771 9.42409 13.7449C9.44264 13.7246 9.46877 13.7159 9.48537 13.6933L14.6123 6.69335C14.8565 6.35937 14.7842 5.88965 14.4502 5.64453Z' fill='url(%23c)'/%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='url(%23b)'/%3E%3Cdefs%3E%3ClinearGradient id='c' x1='5.85624' y1='14' x2='13.849' y2='4.71759' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0.488' stop-color='%238D88F2'/%3E%3Cstop offset='1' stop-color='%23EB1000'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='2' y1='18' x2='17.1314' y2='1.2169' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0.488' stop-color='%238D88F2'/%3E%3Cstop offset='1' stop-color='%23EB1000'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") center / contain;
    --merch-addon-checkbox-checked-bg-color: transparent;
    --merch-addon-checkbox-checked-color: transparent;
    --merch-addon-label-size: 14px;
    --merch-addon-label-line-height: 18px;
    --merch-addon-label-weight: 700;
    --merch-addon-label-color: var(--s2a-color-content-default, #000);
}

/* Light-DOM color overrides — beat global promo/legal styling */
merch-card[variant="plans-bizpro"] [slot="promo-text"] {
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
merch-card[variant="plans-bizpro"] [slot="heading-xs"] {
    margin: 0;
    font-family: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    font-weight: 900;
    font-size: var(--s2a-typography-font-size-title-4, 24px);
    line-height: var(--s2a-typography-line-height-title-4, 24px);
    letter-spacing: var(--s2a-font-letter-spacing-4xl, -0.48px);
    color: var(--s2a-color-content-default, #000);
}

merch-card[variant="plans-bizpro"] [slot="body-xs"] {
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
merch-card[variant="plans-bizpro"] [slot="heading-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span),
merch-card[variant="plans-bizpro"] [slot="body-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span) {
    margin: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
}

/* Rich whats-included styling: section title + bullet items + dividers */
merch-card[variant="plans-bizpro"] [slot="whats-included"] {
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] .section,
merch-card[variant="plans-bizpro"] [slot="whats-included"] h4,
merch-card[variant="plans-bizpro"] [slot="whats-included"] h5 {
    margin: 0;
}

/* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section {
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] h4 {
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: inherit;
    display: flex;
    align-items: center;
    gap: var(--s2a-spacing-2xs, 4px);
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s2a-spacing-sm, 12px);
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] ul li {
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--s2a-color-content-subtle, #000000a3);
    padding: 0 20px;
}

merch-card[variant="plans-bizpro"][border-color="black"] [slot="whats-included"] ul li {
    color: var(--s2a-color-content-knockout, #ffffff);
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] .section + .section {
    border-top: 1px solid var(--consonant-merch-card-plans-bizpro-divider-color, var(--s2a-color-transparent-black-12, #0000001f));
    padding-top: 16px;
}

/* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px. */
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:not(:only-child):last-child ul {
    margin-top: 8px;
}

/* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker). */
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section h4 > svg,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section h4 > .sp-icon,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section h4 > merch-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    color: inherit;
}
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:first-child h4 > svg,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:first-child h4 > .sp-icon,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:first-child h4 > merch-icon {
    width: 20px;
    height: 20px;
}

/* CTA styling — pill-shaped buttons, accent solid + outlined */
merch-card[variant="plans-bizpro"] [slot="footer"] a,
merch-card[variant="plans-bizpro"] [slot="footer"] button {
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

merch-card[variant="plans-bizpro"] [slot="footer"] .con-button.blue,
merch-card[variant="plans-bizpro"] [slot="footer"] a.accent,
merch-card[variant="plans-bizpro"] [slot="footer"] [data-button-type="accent"] {
    background: var(--s2a-color-button-background-primary-solid-default, #3b63fb);
    color: var(--s2a-color-button-content-primary-solid-default, #fff);
    border: none;
}

merch-card[variant="plans-bizpro"] [slot="footer"] .con-button.outline,
merch-card[variant="plans-bizpro"] [slot="footer"] a.outline,
merch-card[variant="plans-bizpro"] [slot="footer"] [data-button-type="primary"] {
    background: var(--s2a-color-button-background-primary-outlined-default, transparent);
    color: var(--s2a-color-button-content-primary-outlined-default, #000);
    border: var(--s2a-border-width-md, 2px) solid var(--s2a-color-button-border-primary-outlined-default, #000);
}

/* Price spans — individually styled per Figma */
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-currency-symbol,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-integer,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-decimals-delimiter,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-decimals,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-recurrence {
    font-family: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--s2a-color-content-default, #000);
}

/* WCS recurrence dictionary returns abbreviations uppercased ("/MO");
   Figma's pricing typography presents it lowercase ("/mo"). */
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-recurrence {
    text-transform: lowercase;
}

/* Collection grid — C2 breakpoints only (768, 1280).
   - Mobile: single column, full width.
   - Tablet (≥768): 2-column grid for 2/3/4 cards.
   - Desktop (≥1280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. Container max-width caps growth so
   cards don't exceed the Figma xl (394px) width. */
merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-bizpro"]) {
    display: grid;
    gap: var(--s2a-grid-gutter, 8px);
    grid-template-columns: minmax(0, var(--consonant-merch-card-plans-bizpro-max-width));
    justify-content: center;
    align-items: stretch;
    margin-inline: auto;
}

@media screen and ${TABLET_UP} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-bizpro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${C2_DESKTOP_UP} {
    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="plans-bizpro"]) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="plans-bizpro"]) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        max-width: 1600px;
    }
}

@media screen and ${MOBILE_LANDSCAPE} {
    merch-card[variant="plans-bizpro"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-bizpro-max-width);
    }
}

/* ETF / legal text inline link styling — underlined inline anchors */
merch-card[variant="plans-bizpro"] [slot="legal-text"] a {
    color: inherit;
    text-decoration: underline;
}
`;
