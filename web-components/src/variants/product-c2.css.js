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
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" height="18" width="18"><path d="M20 37.5C10.3496 37.5 2.5 29.6504 2.5 20C2.5 10.3496 10.3496 2.5 20 2.5C29.6504 2.5 37.5 10.3496 37.5 20C37.5 29.6504 29.6504 37.5 20 37.5ZM20 5.5C12.0039 5.5 5.5 12.0039 5.5 20C5.5 27.9961 12.0039 34.5 20 34.5C27.9961 34.5 34.5 27.9961 34.5 20C34.5 12.0039 27.9961 5.5 20 5.5Z"/><path d="M20.0013 10.5207C20.4626 10.5044 20.912 10.6684 21.2545 10.9779C21.9152 11.708 21.9152 12.8199 21.2545 13.55C20.9158 13.8671 20.4648 14.0362 20.0012 14.0201C19.5285 14.0391 19.0694 13.8594 18.7352 13.5246C18.411 13.1888 18.2369 12.736 18.2524 12.2695C18.2277 11.7996 18.3916 11.3392 18.7078 10.9907C19.055 10.6612 19.5236 10.491 20.0013 10.5207Z"/><path d="M20 30.125C19.1719 30.125 18.5 29.4531 18.5 28.625V18.9551C18.5 18.127 19.1719 17.4551 20 17.4551C20.8281 17.4551 21.5 18.127 21.5 18.9551V28.625C21.5 29.4531 20.8281 30.125 20 30.125Z"/></svg>');
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
      background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" height="18" width="18"><path fill="%23aaaaaa" d="M20 37.5C10.3496 37.5 2.5 29.6504 2.5 20C2.5 10.3496 10.3496 2.5 20 2.5C29.6504 2.5 37.5 10.3496 37.5 20C37.5 29.6504 29.6504 37.5 20 37.5ZM20 5.5C12.0039 5.5 5.5 12.0039 5.5 20C5.5 27.9961 12.0039 34.5 20 34.5C27.9961 34.5 34.5 27.9961 34.5 20C34.5 12.0039 27.9961 5.5 20 5.5Z"/><path fill="%23aaaaaa" d="M20.0013 10.5207C20.4626 10.5044 20.912 10.6684 21.2545 10.9779C21.9152 11.708 21.9152 12.8199 21.2545 13.55C20.9158 13.8671 20.4648 14.0362 20.0012 14.0201C19.5285 14.0391 19.0694 13.8594 18.7352 13.5246C18.411 13.1888 18.2369 12.736 18.2524 12.2695C18.2277 11.7996 18.3916 11.3392 18.7078 10.9907C19.055 10.6612 19.5236 10.491 20.0013 10.5207Z"/><path fill="%23aaaaaa" d="M20 30.125C19.1719 30.125 18.5 29.4531 18.5 28.625V18.9551C18.5 18.127 19.1719 17.4551 20 17.4551C20.8281 17.4551 21.5 18.127 21.5 18.9551V28.625C21.5 29.4531 20.8281 30.125 20 30.125Z"/></svg>');
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
