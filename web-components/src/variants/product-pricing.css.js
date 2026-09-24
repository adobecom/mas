import { TABLET_UP, C2_DESKTOP_UP, XL_DESKTOP_UP } from '../media.js';

export const CSS = `
.collection-container:has(merch-card[variant='product-pricing']) {
    display: block;
}

merch-card-collection.product-pricing {
    display: grid;
    grid-template-columns: minmax(261px, 474px);
    justify-content: center;
    max-width: 1920px;
    margin-inline: auto;
    gap: 8px;
}

/* Studio uses <merch-card-collection>; milo/preview wraps cards in
   .N-merch-cards grid containers, so both selector families are covered. */
@media screen and ${TABLET_UP} {
    merch-card-collection.product-pricing,
    .two-merch-cards:has(merch-card[variant='product-pricing']),
    .three-merch-cards:has(merch-card[variant='product-pricing']),
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(2, minmax(261px, 474px));
    }
}

@media screen and ${C2_DESKTOP_UP} {
    merch-card-collection.product-pricing,
    .three-merch-cards:has(merch-card[variant='product-pricing']),
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(3, minmax(261px, 474px));
    }
}

@media screen and ${XL_DESKTOP_UP} {
    merch-card-collection.product-pricing,
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(4, minmax(261px, 474px));
    }
}

merch-card[variant="product-pricing"] {
    width: 100%;
    max-width: 474px;
    min-width: 261px;
    --product-frame-bg: #fff;
    --product-frame-border: #dadada;
}

merch-card[variant="product-pricing"]:has([slot="badge"]) {
    --product-frame-bg: #000;
    --product-frame-border: #000;
}

/* Strip the merch-badge pill: plain white text on the header strip. The
   --merch-badge-* props are set inline by merch-badge, so !important is needed. */
merch-card[variant="product-pricing"] merch-badge {
    --merch-badge-background-color: transparent !important;
    --merch-badge-border: none !important;
    --merch-badge-color: #fff !important;
    --merch-badge-padding: 0 !important;
    inset-inline-start: 0;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant="product-pricing"] [slot="heading-s"] {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    line-height: 18px;
    color: #000;
}

merch-card[variant="product-pricing"] [slot="body-xs"] {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: #5c5c5c;
}

/* Inline links (e.g. "See terms") match the gray body copy, underlined. */
merch-card[variant="product-pricing"] [slot="body-xs"] a {
    color: inherit;
    text-decoration: underline;
}

merch-card[variant="product-pricing"] [slot="heading-xs"] {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    color: #000;
    text-align: left;
}

merch-card[variant="product-pricing"] [slot="heading-xs"] p {
    margin: 0;
}

/* Figma stacks the prices: current price drops below the strikethrough.
   Blocking the alternative (not the strikethrough) keeps the joining nbsp as a
   harmless trailing space instead of indenting the second line. */
merch-card[variant="product-pricing"] [slot="heading-xs"] .price-alternative {
    display: block;
}

merch-card[variant="product-pricing"] [slot="heading-xs"] .price-strikethrough {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    text-decoration: line-through;
    color: #5c5c5c;
}

merch-card[variant="product-pricing"] [slot="legal"] {
    margin: 0;
}

merch-card[variant="product-pricing"] span[data-template="legal"] {
    display: block;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #5c5c5c;
}

/* Figma stacks the legal block: per-unit on its own line, tax and plan type
   below. The global leading nbsp would indent the line, so drop it. */
merch-card[variant="product-pricing"] span[data-template="legal"] .price-unit-type:not(.disabled) {
    display: block;
}

merch-card[variant="product-pricing"] span[data-template="legal"] .price-unit-type:not(.disabled)::before,
merch-card[variant="product-pricing"] span[data-template="legal"] .price-tax-inclusivity:not(.disabled)::before {
    content: none;
}

merch-card[variant="product-pricing"] [slot="short-description"] {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #000;
}

merch-card[variant="product-pricing"] [slot="short-description"] p {
    margin: 0;
}

merch-card[variant="product-pricing"] [slot="short-description"] a.spectrum-Link--secondary {
    color: inherit;
}

merch-card[variant="product-pricing"] [slot="footer"] {
    display: flex;
    gap: 4px;
    width: 100%;
}

merch-card[variant="product-pricing"] [slot="footer"] a {
    flex: 1 0 0;
    min-width: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 999px;
    min-height: 40px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    white-space: nowrap;
    background: #3B63FB;
    color: #fff;
    border: none;
}

merch-card[variant="product-pricing"] [slot="footer"] a.con-button.outline,
merch-card[variant="product-pricing"] [slot="footer"] a.con-button.primary,
merch-card[variant="product-pricing"] [slot="footer"] a.outline {
    background: transparent;
    color: #000;
    border: 2px solid #000;
}
`;
