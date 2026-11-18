import { TABLET_UP, C2_DESKTOP_UP, XL_DESKTOP_UP } from '../constants.js';

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
    --merch-card-collection-card-min-height: 286px;
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
    --product-frame-border: #ebebeb;
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
    letter-spacing: -0.2px;
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

/* The global leading nbsp would indent the legal line, so drop it. */
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

/* CTAs share a row while both labels fit on one line, else they stack. */
merch-card[variant="product-pricing"] [slot="footer"] {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 4px;
    width: 100%;
}

merch-card[variant="product-pricing"] [slot="footer"] a {
    flex: 1 1 calc(50% - 2px);
    /* One-line label width, capped at the footer: past half the row the CTAs
       stack, past the whole row the label wraps. */
    min-width: fit-content;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 999px;
    min-height: 40px;
    padding: 8px 24px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    overflow-wrap: anywhere;
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

merch-card[variant="product-pricing"][stacked] [slot="footer"] a {
    flex-basis: 100%;
}
`;

export const SHADOW_CSS = `
    :host([variant='product-pricing']) {
        font-weight: 400;
        display: flex;
        flex-direction: column;
        background: var(--product-frame-bg, #fff);
        border: 1px solid var(--product-frame-border, #dadada);
        border-radius: 16px;
        overflow: hidden;
        /* 4px frame = 1px border + 3px padding; host bg shows through. */
        padding: 3px;
        /* Fill the grid row so .spacer has slack to absorb. */
        height: 100%;
        box-sizing: border-box;
    }

    /* Mnemonic + badge share one centered row on the header strip. Strip
       background is white by default, black when framed (badge authored, see
       product-pricing.css.js). */
    :host([variant='product-pricing']) .header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 24px 32px;
    }

    :host([variant='product-pricing']) .header slot[name='icons'] {
        display: inline-flex;
        align-items: center;
    }

    /* White content panel; the host's 4px padding exposes the frame around
       it (and the header strip) in the framed state. */
    :host([variant='product-pricing']) .panel {
        flex: 1 0 auto;
        display: flex;
        flex-direction: column;
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-sizing: border-box;
    }

    :host([variant='product-pricing']) .copy {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    :host([variant='product-pricing']) slot[name='heading-s'] {
        display: block;
        min-height: var(
            --consonant-merch-card-product-pricing-heading-s-height
        );
    }
    :host([variant='product-pricing']) slot[name='body-xs'] {
        display: block;
        min-height: var(
            --consonant-merch-card-product-pricing-body-xs-height
        );
    }
    :host([variant='product-pricing']) slot[name='heading-xs'] {
        display: flex;
        flex-direction: column;
        /* Bottom-align so a plain price shares a baseline with a stacked
           strikethrough price. */
        justify-content: flex-end;
        min-height: var(
            --consonant-merch-card-product-pricing-price-height
        );
    }

    /* No price authored: hide the price slot and drop the reserved row
       height, else it leaves a blank band above the CTAs. Chrome rejects
       :has() inside :host(), so the flag is an attribute (see flagPriceRow). */
    :host([variant='product-pricing'][no-price]) slot[name='heading-xs'] {
        display: none;
    }

    :host([variant='product-pricing'][no-price]) .fine {
        min-height: 0;
    }

    :host([variant='product-pricing'][no-price]) .price-buttons {
        gap: 0;
    }

    /* Grows so a shorter card's slack lands here, in one block, instead of
       spread through the copy, keeping CTAs on the row's shared baseline. */
    :host([variant='product-pricing']) .spacer {
        flex: 1 0 24px;
    }

    :host([variant='product-pricing']) .price-buttons {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    /* Legal + short-description share this row; a card shows one. */
    :host([variant='product-pricing']) .fine {
        display: flex;
        flex-direction: column;
        min-height: var(--consonant-merch-card-product-pricing-fine-height);
    }

    :host([variant='product-pricing']) slot[name='short-description'] {
        display: block;
    }

    :host([variant='product-pricing']) footer {
        display: flex;
        padding: 0;
        gap: 4px;
        justify-content: stretch;
        align-items: stretch;
        flex-wrap: nowrap;
        /* Row-max height keeps a wrapped CTA from shifting siblings' rows. */
        min-height: var(
            --consonant-merch-card-product-pricing-footer-height
        );
    }
`;
