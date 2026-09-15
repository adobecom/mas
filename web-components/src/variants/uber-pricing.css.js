import { TABLET_UP, XL_DESKTOP_UP } from '../media.js';

export const CSS = `
.collection-container:has(merch-card[variant='uber-pricing']) {
    display: block;
}

merch-card-collection.uber-pricing {
    display: grid;
    /* XS: 1 column. */
    grid-template-columns: 1fr;
    max-width: 1920px;
    margin-inline: auto;
    gap: 8px;
}

/* MD: 2 columns. Studio uses <merch-card-collection>; milo/preview wraps cards
   in .N-merch-cards grid containers, so both selector families are covered. */
@media screen and ${TABLET_UP} {
    merch-card-collection.uber-pricing,
    .two-merch-cards:has(merch-card[variant='uber-pricing']),
    .three-merch-cards:has(merch-card[variant='uber-pricing']),
    .four-merch-cards:has(merch-card[variant='uber-pricing']) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

/* XL: 4 columns. */
@media screen and ${XL_DESKTOP_UP} {
    merch-card-collection.uber-pricing,
    .four-merch-cards:has(merch-card[variant='uber-pricing']) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

merch-card[variant="uber-pricing"] {
    width: 100%;
    max-width: 474px;
    min-width: 261px;
    --uber-frame-bg: #fff;
    --uber-frame-border: #dadada;
}

/* Framed look: black header strip + black border around the white panel.
   Persistent when a badge is authored; mirrored on CTA hover so an unbadged
   card takes on the same look while a footer link is hovered. */
merch-card[variant="uber-pricing"]:has([slot="badge"]),
merch-card[variant="uber-pricing"]:has([slot="footer"] a:hover) {
    --uber-frame-bg: #000;
    --uber-frame-border: #000;
}

/* Strip the merch-badge pill: plain white text on the header strip. The
   --merch-badge-* props are set inline by merch-badge, so !important is needed. */
merch-card[variant="uber-pricing"] merch-badge {
    --merch-badge-background-color: transparent !important;
    --merch-badge-border: none !important;
    --merch-badge-color: #fff !important;
    --merch-badge-padding: 0 !important;
    inset-inline-start: 0;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant="uber-pricing"] [slot="heading-s"] {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    line-height: 18px;
    color: #000;
}

merch-card[variant="uber-pricing"] [slot="body-xs"] {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: #5c5c5c;
}

merch-card[variant="uber-pricing"] [slot="heading-xs"] {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    color: #000;
    text-align: left;
}

merch-card[variant="uber-pricing"] [slot="heading-xs"] p {
    margin: 0;
}

/* Figma stacks the prices: current price drops below the strikethrough.
   Blocking the alternative (not the strikethrough) keeps the joining nbsp as a
   harmless trailing space instead of indenting the second line. */
merch-card[variant="uber-pricing"] [slot="heading-xs"] .price-alternative {
    display: block;
}

merch-card[variant="uber-pricing"] [slot="heading-xs"] .price-strikethrough {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    text-decoration: line-through;
    color: #5c5c5c;
}

merch-card[variant="uber-pricing"] span[data-template="legal"] {
    display: block;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #5c5c5c;
}

merch-card[variant="uber-pricing"] [slot="footer"] {
    display: flex;
    gap: 4px;
    width: 100%;
}

merch-card[variant="uber-pricing"] [slot="footer"] a {
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

merch-card[variant="uber-pricing"] [slot="footer"] a.con-button.outline,
merch-card[variant="uber-pricing"] [slot="footer"] a.con-button.primary,
merch-card[variant="uber-pricing"] [slot="footer"] a.outline {
    background: transparent;
    color: #000;
    border: 2px solid #000;
}
`;
