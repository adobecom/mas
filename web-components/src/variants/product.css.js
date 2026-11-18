import { infoIconUrl } from '../info-icon.js';
import { TABLET_UP, DESKTOP_UP, TABLET_DOWN } from '../constants.js';
export const CSS = `
merch-card[variant='product'] [slot='badge'] {
    position: absolute;
    top: 16px;
    inset-inline-end: 0;
    line-height: 16px;
}

merch-card[variant="product"][annualized] [slot="heading-xs"] [is="inline-price"] .price-annual-prefix:before {
    white-space: pre;
    content: "\\A";
}

merch-card[variant="product"][annualized] [slot="heading-xs"] [is="inline-price"] .price-annual-prefix,
merch-card[variant="product"][annualized] [slot="heading-xs"] [is="inline-price"] .price-annual,
merch-card[variant="product"][annualized] [slot="heading-xs"] [is="inline-price"] .price-annual-suffix {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    font-weight: 400;
}

:root {
  --consonant-merch-card-product-width: 300px;
}

merch-card[variant="product"] {
    --consonant-merch-card-callout-icon-size: 18px;
    width: var(--consonant-merch-card-product-width);
}

merch-card[variant="product"][id] [slot='callout-content'] > div > div,
merch-card[variant="product"][id] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
    color: var(--text-color);
}

merch-card[variant="product"] [slot="callout-content"] > p:has(> .icon-button) {
  padding-inline-end: 36px;
}

merch-card[variant="product"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="product"] a.secondary-link {
  color: #000;
  text-decoration: underline;
}

merch-card[variant="product"][id] span[data-template="legal"] {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="product"][id] .price.price-legal .price-unit-type:not(.disabled)::before,
merch-card[variant="product"][id] .price.price-legal .disabled + span:not(.disabled)::before {
    content: initial;
}

merch-card[variant="product"] [slot="footer"] a.con-button.primary {
    border: 2px solid var(--text-color);
    color: var(--text-color);
}

merch-card[variant="product"] [slot="footer"] a.con-button.primary:hover {
    background-color: var(--color-black);
    border-color: var(--color-black);
    color: var(--color-white);
}

merch-card-collection.product merch-card {
    width: auto;
    height: 100%;
}

  merch-card[variant="product"] merch-addon {
    padding-left: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 8px;
    border-radius: .5rem;
    background: var(--merch-addon-background);
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="product"] [slot="body-xs"] [is="inline-price"] {
    font-weight: inherit;
  }

  merch-card[variant="product"] merch-addon [is="inline-price"] {
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="product"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="product"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

/* Sections inside tabs/fragments that don't receive the .product class.
   Make .content wrapper transparent so the section grid applies directly to cards.
   Only when every card in the section is a product card - otherwise a mixed
   section (e.g. segment cards with one product card) would have its layout
   hijacked by this fallback despite already having an explicit variant class. */
.one-merch-card:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content,
.two-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content,
.three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content,
.four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content {
  display: contents;
}

.one-merch-card.section merch-card[variant="product"],
.one-merch-card:has(merch-card[variant="product"]) merch-card[variant="product"] {
    width: auto;
    max-width: var(--consonant-merch-card-product-width);
    margin: 0 auto;
}

/* grid style for product */
.one-merch-card.product,
.two-merch-cards.product,
.three-merch-cards.product,
.four-merch-cards.product,
.one-merch-card:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
.two-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
.three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
.four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
    grid-template-columns: var(--consonant-merch-card-product-width);
}

/* Tablet */
@media screen and ${TABLET_UP} {
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product,
    .two-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
    .three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
    .four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
        grid-template-columns: repeat(2, var(--consonant-merch-card-product-width));
    }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-product-width: 378px;
  }

  .three-merch-cards.product,
  .three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
      grid-template-columns: repeat(3, var(--consonant-merch-card-product-width));
  }

  .four-merch-cards.product,
  .four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
      grid-template-columns: repeat(auto-fit, var(--consonant-merch-card-product-width));
  }
}

merch-card[variant="product"] {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
}

merch-card[variant="product"] .merch-short-description {
    display: inline-block;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="product"] .merch-short-description .icon-button {
    position: relative;
    display: inline-flex;
    text-decoration: none;
    border-bottom: none;
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    background-image: ${infoIconUrl(14)};
    background-size: 18px;
    background-repeat: no-repeat;
    background-position: center;
}

merch-card[variant="product"] .merch-short-description .icon-button::before {
    content: attr(data-tooltip);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 100%;
    margin-left: 8px;
    max-width: 140px;
    width: max-content;
    padding: 10px;
    border-radius: 5px;
    background: #0469E3;
    color: #fff;
    text-align: left;
    display: none;
    z-index: 10;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
}

merch-card[variant="product"] .merch-short-description .icon-button::after {
    content: "";
    position: absolute;
    left: 102%;
    margin-left: -8px;
    top: 50%;
    transform: translateY(-50%);
    border: 8px solid transparent;
    border-right-color: #0469E3;
    display: none;
    z-index: 10;
}

merch-card[variant="product"] .merch-short-description .icon-button.tooltip-visible::before,
merch-card[variant="product"] .merch-short-description .icon-button.tooltip-visible::after {
    display: block;
}

@media screen and ${TABLET_DOWN} {
    merch-card[variant="product"] .merch-short-description {
        display: inline-block;
    }

    merch-card[variant="product"] .merch-short-description .icon-button {
        vertical-align: middle;
    }

    merch-card[variant="product"] .merch-short-description .icon-button::before {
        top: unset;
        left: calc(50% - 120px);
        transform: none;
        margin-left: 0;
        bottom: 100%;
        margin-bottom: 8px;
    }

    merch-card[variant="product"] .merch-short-description .icon-button::after {
        top: unset;
        left: 50%;
        margin-left: -8px;
        transform: none;
        bottom: calc(100% - 8px);
        border-color: #0469E3 transparent transparent transparent;
        border-right-color: transparent;
    }
}

`;

export const SHADOW_CSS = `
    :host([variant='product']) {
        background:
            linear-gradient(white, white) padding-box,
            var(--consonant-merch-card-border-color, #dadada) border-box;
        border: 1px solid transparent;
    }

    :host([variant='product']) > slot:not([name='icons']) {
        display: block;
    }
    :host([variant='product']) slot[name='body-xs'] {
        min-height: var(--consonant-merch-card-product-body-xs-height);
        display: block;
    }
    :host([variant='product']) slot[name='heading-xs'] {
        min-height: var(--consonant-merch-card-product-heading-xs-height);
        display: block;
    }
    :host([variant='product']) slot[name='body-xxs'] {
        min-height: var(--consonant-merch-card-product-body-xxs-height);
        display: block;
    }
    :host([variant='product']) slot[name='promo-text'] {
        min-height: var(--consonant-merch-card-product-promo-text-height);
        display: block;
    }
    :host([variant='product']) slot[name='callout-content'] {
        min-height: var(
            --consonant-merch-card-product-callout-content-height
        );
        display: block;
    }
    :host([variant='product']) slot[name='short-description'] {
        display: block;
    }
    :host([variant='product']) slot[name='addon'] {
        min-height: var(--consonant-merch-card-product-addon-height);
    }

    :host([variant='product']:not([id])) hr {
        display: none;
    }

    :host([variant='product']) ::slotted(h3[slot='heading-xs']) {
        max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
    }

    :host([variant='product']) .secure-transaction-label {
        color: rgb(80, 80, 80);
        line-height: var(--consonant-merch-card-detail-xs-line-height);
    }
`;
