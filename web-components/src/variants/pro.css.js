import { MOBILE_LANDSCAPE, TABLET_UP, C2_DESKTOP_UP } from '../media.js';

export const CSS = `
:root {
    --consonant-merch-card-pro-font-family-regular: 'Adobe Clean', adobe-clean, sans-serif;
    --consonant-merch-card-pro-font-family-display: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    --consonant-merch-card-pro-max-width: 394px;
    --consonant-merch-card-pro-2up-max-width: 596px;
    /* Surface colors pinned to the Figma s2a tokens (background-default /
       background-subtle). Deliberately NOT var(--spectrum-gray-*): inside
       Studio an <sp-theme system="spectrum-two"> defines those, and S2's
       gray-100 (#e9e9e9) / gray-50 (#f8f8f8) are each one step grayer than
       the design, tinting every card surface. */
    --consonant-merch-card-pro-bg-default: #fff;
    --consonant-merch-card-pro-bg-subtle: #f8f8f8;
    --consonant-merch-card-pro-text-color: #000;
    --consonant-merch-card-pro-text-muted-color: #000000a3;
    --consonant-merch-card-pro-text-inverse-color: #fff;
    --consonant-merch-card-pro-cta-accent-color: #3b63fb;
    --consonant-merch-card-pro-cta-accent-hover-color: #274dea;
    --consonant-merch-card-pro-cta-outline-hover-color: #ebebeb;
    --consonant-merch-card-pro-divider-color: #0000001f;
}

/* The Milo .collection-container is itself a min-content grid; a pro
   collection's minmax(0, 1fr) tracks have zero min-content, so it would collapse
   to ~0 width inside it. Let the collection take the full container width — it
   caps and centres itself via the grid rules below. */
.collection-container.plans:has(merch-card[variant="pro"]) {
    display: block;
}

/* Width is driven by the grid track, not a fixed value — cards fluidly fit
   261px (1280 viewport) → 394px (1920 viewport) per Figma. */
merch-card[variant="pro"] {
    width: 100%;
    max-width: var(--consonant-merch-card-pro-max-width);
    overflow: visible;
    position: relative;
}

/* Callout banner link — inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
merch-card[variant="pro"] [slot="callout-content"] a {
    display: inline;
    color: inherit;
    font-weight: inherit;
    text-decoration: underline;
    white-space: normal;
}

/* The callout sits flat on the license-zone (Figma 1098:30779) — drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
merch-card[variant="pro"] [slot="callout-content"] > p,
merch-card[variant="pro"] [slot="callout-content"] > div > div {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: auto;
    font-size: 12px;
    line-height: 16px;
}

merch-card[variant="pro"] [slot="callout-content"] > div {
    margin: 0;
}

/* AI Assistant add-on row — Figma 1098:33812 / 1098:33951.
   Themes the real <merch-addon> injected at slot="addon". The purple frame
   and trailing sparkle live on the variant's .add-on wrapper (see variantStyle);
   here we size/colour the merch-addon checkbox + label via its custom props. */
merch-card[variant="pro"] merch-addon[slot="addon"] {
    flex: 1 0 0;
    min-width: 0;
    --merch-addon-gap: 8px;
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
    --merch-addon-label-color: var(--consonant-merch-card-pro-text-color);
}

/* Light-DOM color overrides — beat global promo/legal styling */
merch-card[variant="pro"] [slot="promo-text"] {
    color: var(--consonant-merch-card-pro-text-muted-color);
    font-family: var(--consonant-merch-card-pro-font-family-regular);
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
merch-card[variant="pro"] [slot="heading-xs"] {
    margin: 0;
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-weight: 900;
    font-size: 24px;
    line-height: 24px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-pro-text-color);
}

merch-card[variant="pro"] [slot="body-xs"] {
    margin: 0;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-pro-text-color);
}

/* Title / description fields are RTE — authors may save <h3>Title</h3> or
   <div><p>desc</p></div>, which the AEM mapping then wraps again. Make any
   inner block descendant inherit the outer slot styles so the visible text
   uses the variant typography instead of UA defaults. */
merch-card[variant="pro"] [slot="heading-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span),
merch-card[variant="pro"] [slot="body-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span) {
    margin: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
}

/* Rich whats-included styling: section title + bullet items + dividers */
merch-card[variant="pro"] [slot="whats-included"] {
    font-family: var(--consonant-merch-card-pro-font-family-regular);
}

/* The authored label only feeds the shadow-DOM toggle button text; never
   show it inside the features zone itself. */
merch-card[variant="pro"] [slot="whats-included"] .whats-included-label {
    display: none;
}

merch-card[variant="pro"] [slot="whats-included"] .section,
merch-card[variant="pro"] [slot="whats-included"] h4,
merch-card[variant="pro"] [slot="whats-included"] h5 {
    margin: 0;
}

/* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
merch-card[variant="pro"] [slot="whats-included"] .section {
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

merch-card[variant="pro"] [slot="whats-included"] h4 {
    /* Pin the body font explicitly: on consumer pages (Milo) a global \`h4\`
       rule sets Adobe Clean Display Black directly on the element, which beats
       the font-family inherited from the slot container above. Studio has no
       such rule, so the title only looked wrong off-Studio. */
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 4px;
}

merch-card[variant="pro"] [slot="whats-included"] ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

merch-card[variant="pro"] [slot="whats-included"] ul li {
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-pro-text-muted-color);
    padding: 0 20px;
}

merch-card[variant="pro"][border-color="black"] [slot="whats-included"] ul li {
    color: var(--consonant-merch-card-pro-text-inverse-color);
}

merch-card[variant="pro"] [slot="whats-included"] .section + .section {
    border-top: 1px solid var(--consonant-merch-card-pro-divider-color);
    padding-top: 16px;
}

/* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px. */
merch-card[variant="pro"] [slot="whats-included"] .section:not(:only-child):last-child ul {
    margin-top: 8px;
}

/* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker).
   merch-icon sizes its shadow-DOM <img> from --mod-img-width/height (falling back to the
   size="xs" default of 20px), so a host width/height alone leaves the inner image at 20px and
   overflowing the box. Set the --mod-img-* custom properties too — they inherit across the shadow
   boundary and size the image to match. (svg/.sp-icon are light DOM and just use width/height.) */
merch-card[variant="pro"] [slot="whats-included"] .section h4 > svg,
merch-card[variant="pro"] [slot="whats-included"] .section h4 > .sp-icon,
merch-card[variant="pro"] [slot="whats-included"] .section h4 > merch-icon {
    width: 16px;
    height: 16px;
    --mod-img-width: 16px;
    --mod-img-height: 16px;
    flex: 0 0 auto;
    color: inherit;
}
merch-card[variant="pro"] [slot="whats-included"] .section:first-child h4 > svg,
merch-card[variant="pro"] [slot="whats-included"] .section:first-child h4 > .sp-icon,
merch-card[variant="pro"] [slot="whats-included"] .section:first-child h4 > merch-icon {
    width: 20px;
    height: 20px;
    --mod-img-width: 20px;
    --mod-img-height: 20px;
}

/* CTA styling — pill-shaped buttons, accent solid + outlined */
merch-card[variant="pro"] [slot="footer"] a,
merch-card[variant="pro"] [slot="footer"] button {
    flex: 1 0 0;
    min-width: 0;
    height: 40px;
    padding: 14px 24px;
    border-radius: 999px;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
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

merch-card[variant="pro"] [slot="footer"] .con-button.blue,
merch-card[variant="pro"] [slot="footer"] a.accent,
merch-card[variant="pro"] [slot="footer"] [data-button-type="accent"] {
    background: var(--consonant-merch-card-pro-cta-accent-color);
    color: var(--consonant-merch-card-pro-text-inverse-color);
    border: none;
}

/* Hover (S2A): the accent button darkens; the outline button gets a subtle
   gray fill while its border and text stay unchanged. Selectors mirror the
   base rules above so hover applies to the same buttons. */
merch-card[variant="pro"] [slot="footer"] .con-button.blue:hover,
merch-card[variant="pro"] [slot="footer"] a.accent:hover,
merch-card[variant="pro"] [slot="footer"] [data-button-type="accent"]:hover {
    background-color: var(--consonant-merch-card-pro-cta-accent-hover-color);
}

merch-card[variant="pro"] [slot="footer"] .con-button.outline,
merch-card[variant="pro"] [slot="footer"] .con-button.primary,
merch-card[variant="pro"] [slot="footer"] a.outline,
merch-card[variant="pro"] [slot="footer"] [data-button-type="primary"] {
    background: transparent;
    color: var(--consonant-merch-card-pro-text-color);
    border: 2px solid var(--consonant-merch-card-pro-text-color);
}

merch-card[variant="pro"] [slot="footer"] .con-button.outline:hover,
merch-card[variant="pro"] [slot="footer"] .con-button.primary:hover,
merch-card[variant="pro"] [slot="footer"] a.outline:hover,
merch-card[variant="pro"] [slot="footer"] [data-button-type="primary"]:hover {
    background-color: var(--consonant-merch-card-pro-cta-outline-hover-color);
}

/* heading-m holds the price. inline-price cards are covered by the .price-span
   rules below; "free" cards author literal text ("Free") that has no .price spans,
   so style the slot itself to match the Figma price (18px/900, node 1114:39070)
   instead of falling through to the global heading-m default (24px/700/#2c2c2c). */
merch-card[variant="pro"] [slot="heading-m"],
merch-card[variant="pro"] [slot="heading-m"] > p {
    margin: 0;
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-pro-text-color);
}

/* Price spans — individually styled per Figma */
merch-card[variant="pro"] [slot="heading-m"] .price,
merch-card[variant="pro"] [slot="heading-m"] .price-currency-symbol,
merch-card[variant="pro"] [slot="heading-m"] .price-integer,
merch-card[variant="pro"] [slot="heading-m"] .price-decimals-delimiter,
merch-card[variant="pro"] [slot="heading-m"] .price-decimals,
merch-card[variant="pro"] [slot="heading-m"] .price-recurrence {
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-pro-text-color);
}

/* WCS recurrence dictionary returns abbreviations uppercased ("/MO");
   Figma's pricing typography presents it lowercase ("/mo"). */
merch-card[variant="pro"] [slot="heading-m"] .price-recurrence {
    text-transform: lowercase;
}

/* Strikethrough (regular) price — Figma 988:14784: 14px regular muted, struck,
   on its own line ABOVE the current price (988:14785). Out-specifies the
   18px/900 .price rules above. Covers both markup shapes:
   - promo: .price-strikethrough next to .price-alternative inside one
     price-template inline-price (the promo price keeps the 18px/900 look)
   - authored: a separate strikethrough-template inline-price before the main
     price. The line-through itself comes from the global stylesheet. */
merch-card[variant="pro"]
    [slot="heading-m"]
    .price:is(.price-strikethrough, .price-promo-strikethrough),
merch-card[variant="pro"]
    [slot="heading-m"]
    .price:is(.price-strikethrough, .price-promo-strikethrough)
    span {
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-pro-text-muted-color);
}

/* Stack the struck price onto its own line. The authored shape needs the
   inline-price wrapper itself to break (its inner .price going block would
   stay inside the inline-block wrapper); the promo shape needs the inner
   .price-strikethrough to break within the shared wrapper. */
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"]:is(
        [data-template="strikethrough"],
        [data-template="priceStrikethrough"]
    ),
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"][data-template="price"]
    .price:is(.price-strikethrough, .price-promo-strikethrough) {
    display: block;
}

/* The promo shape separates the two prices with an &nbsp; text node directly
   inside the wrapper; once the strikethrough goes block, that nbsp would
   indent the promo price's line. Zeroing the wrapper font collapses it — the
   .price spans carry their own explicit sizes (same trick as plans.css.js'
   ja_JP price-alternative block). */
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"][data-template="price"]:has(
        .price-strikethrough,
        .price-promo-strikethrough
    ) {
    font-size: 0;
}

/* Plan type line ("Annual, billed monthly") — the legal-template price span,
   rendered when the Show Plan type setting is on. Its container carries the
   shared .price class, so this later rule overrides the 18px/900 price
   styling above with the muted body style (same look as promo-text, Figma
   1114:39070). Both the custom-element wrapper AND the inner .price container
   need display:block — the wrapper is inline-block by default, which would
   shrink-wrap the block container and keep it on the price's line. */
merch-card[variant="pro"] [slot="heading-m"] span[is="inline-price"][data-template="legal"],
merch-card[variant="pro"] [slot="heading-m"] .price.price-legal {
    display: block;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-pro-text-muted-color);
}

/* The legal line opens with an empty unit-type, so the tax label's leading
   ::before nbsp turns into a spurious indent and the line no longer aligns with
   the price above it; drop it when nothing precedes the tax label (MWPW-198626). */
merch-card[variant="pro"]
    .price-legal
    .price-unit-type.disabled
    + .price-tax-inclusivity:not(.disabled)::before {
    content: none;
}

/* Collection grid — C2 breakpoints only (768, 1280).
   - Mobile: single column, full width.
   - Tablet (≥768): 2-column grid for 2/3/4 cards.
   - Desktop (≥1280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. Container max-width caps growth so
   cards don't exceed the Figma xl (394px) width. */
merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, var(--consonant-merch-card-pro-max-width));
    justify-content: center;
    /* Cards stretch to equal height; the white .top-card is pinned to its
       (uniform) content height and the gray .features-zone grows to fill the
       rest, so the white tops AND the card bottoms both line up across the row
       (matches Figma). See .top-card / .features-zone flex in the shadow styles. */
    align-items: stretch;
    margin-inline: auto;
}

@media screen and ${TABLET_UP} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${C2_DESKTOP_UP} {
    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        max-width: 1600px;
    }
    /* Detect exactly two cards structurally and render them as a centred 2-up.
       Matching the cards directly (instead of a column class) works regardless
       of whether the collection is tagged .two-merch-cards (since MWPW-196627)
       or falls into .four-merch-cards (e.g. when a card has a 'wide' size).
       Per Figma the 2-up cards are wider than the dense 4-up: they flex-fill the
       row up to 596px (≈522px at the 1280 breakpoint), so widen the track and the
       card's own cap for this case only. */
    merch-card-collection.plans:has(merch-card[variant="pro"]):has(> merch-card:nth-of-type(2):last-of-type) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        max-width: calc(2 * var(--consonant-merch-card-pro-2up-max-width) + 12px);
    }
    merch-card-collection.plans:has(merch-card[variant="pro"]):has(> merch-card:nth-of-type(2):last-of-type) merch-card[variant="pro"] {
        max-width: var(--consonant-merch-card-pro-2up-max-width);
    }
}

@media screen and ${MOBILE_LANDSCAPE} {
    /* Mobile (320–767px): the default track caps cards at 394px, leaving side
       margins wider than the 24px gutter. Collapse to a single 1fr track and
       drop the card cap so cards fill the available width. */
    merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: minmax(0, 1fr);
    }

    merch-card[variant="pro"] {
        width: 100%;
        max-width: none;
    }

    /* A collection inside a Milo .section.container inherits its 24px page
       gutter; one dropped straight into a plain section gets none, so the
       now-full-width cards bleed to the viewport edge. Restore the gutter on
       the collection itself for that case only. The > .content > chain pins
       this to the collection's own section, so it never doubles up where a
       .container already supplies the gutter. */
    .section:not(.container) > .content > .collection-container.plans:has(merch-card[variant="pro"]) {
        padding-inline: 24px;
    }
}

`;
