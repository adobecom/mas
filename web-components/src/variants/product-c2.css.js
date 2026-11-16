import { infoIconUrl } from '../info-icon.js';
import { MOBILE_LANDSCAPE, TABLET_UP } from '../media.js';
export const CSS = `
:root {
  --consonant-merch-card-productc2-width: 370px;
  --s2a-font-letter-spacing-4xl: -.48px;
  --gray: var(--color-gray-100, #f8f8f8);
  --legal-gray: #ffffffa3;;
  --transparent: transparent;
}

merch-card[variant="product-c2"] {
  max-width: var(--consonant-merch-card-productc2-width);
}

merch-card[variant="product-c2"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
}

merch-card[variant="product-c2"] {
    width: 100%;
}

merch-card[variant="product-c2"] [slot="heading-m"] span[is="inline-price"] {
    font-weight: 900;
}

merch-card[variant="product-c2"] [slot="heading-m"],
merch-card[variant="product-c2"] [slot="heading-m"] .price-strikethrough {
    margin: 0;
    font-weight: 900;
    font-size: var(--consonant-merch-card-body-xxl-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
}

merch-card[variant="product-c2"] [slot="heading-m"] .price-legal {
    font-size: inherit;
    line-height: inherit;
    font-weight: 400;
    color: #000000a3;
}

merch-card[variant="product-c2"] [slot="heading-m"] [data-template="price"] {
    letter-spacing: var(--s2a-font-letter-spacing-4xl);
    font-family: "Adobe Clean Display Black", adobe-clean-display, "Arial Bold Adjusted", sans-serif;
}

merch-card[variant="product-c2"] [slot="heading-m"] [data-template="legal"] {
    display: block;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
}

merch-card[variant="product-c2"] [slot="body-xs"],
merch-card[variant="product-c2"] [slot="short-description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="product-c2"] [slot="footer"] {
    display: flex;
    gap: 8px;
    width: 100%;
}

merch-card[variant="product-c2"] [slot="footer"] a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 20px;
    min-height: 40px;
    padding: 0 24px;
    width: stretch;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
}

merch-card[variant="product-c2"] [slot="short-description"] .icon-button {
    background-image: ${infoIconUrl(18)};
}

merch-card[variant='product-c2'] [slot='badge'] merch-badge {
    --merch-badge-border-radius: 4px !important;
}

@media screen and ${MOBILE_LANDSCAPE} {
    merch-card[variant="product-c2"] {
        background-color: var(--color-white);
        padding: 0;
    }

    merch-card[variant="product-c2"][background-color="black"] merch-badge {
        background-color: var(--color-black);
        --merch-badge-color: var(--color-white);
    }
}

merch-card[variant="product-c2"] [slot="footer"] a.primary-outline {
    border-color: var(--color-black);
    color: var(--color-black);
}

merch-card[variant="product-c2"] [slot="footer"] a.primary-outline:hover {
    background-color: #00000014;
}

merch-card[variant="product-c2"] [slot="heading-m"],
merch-card[variant="product-c2"] [slot="body-xs"] {
    color: var(--color-black);
}

@media screen and ${TABLET_UP} {
    merch-card[variant="product-c2"][background-color="black"] {
        background-color: var(--color-black);
        color: var(--color-white);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="body-xs"],
    merch-card[variant="product-c2"][background-color="black"] [slot="heading-m"] {
        color: var(--color-white);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="heading-m"] .price-strikethrough {
        color: #c6c6c6;
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="heading-m"] .price-legal {
        color: var(--legal-gray);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="footer"] a.primary-outline {
        border-color: var(--color-white);
        color: var(--color-white);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="footer"] a.primary-outline:hover {
        background-color: var(--legal-gray);
        color: var(--color-black);
    }    

    merch-card[variant="product-c2"][background-color="black"] [slot="short-description"] .icon-button {
      background-image: ${infoIconUrl(18, '%23aaaaaa')};
    }

    merch-card[variant="product-c2"][background-color="gray"] {
        background-color: var(--gray);
    }

    merch-card[variant="product-c2"] [slot="short-description"] .icon-button::before {
        top: unset;
        left: 50%;
        transform: translateX(-50%);
        margin-left: 0;
        bottom: 100%;
        margin-bottom: 8px;
    }

    merch-card[variant="product-c2"] [slot="short-description"] .icon-button::after {
        top: unset;
        left: 50%;
        margin-left: -8px;
        transform: none;
        bottom: calc(100% - 8px);
        border-color: #0469E3 transparent transparent transparent;
    }
}

@media screen and (max-width: 900px) {
    merch-card[variant="product-c2"] {
        max-width: unset;
    }
}

`;
