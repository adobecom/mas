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

/* SM: 2 columns. */
@media screen and (min-width: 480px) {
    merch-card-collection.uber-pricing {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

/* MD: 3 columns. */
@media screen and (min-width: 768px) {
    merch-card-collection.uber-pricing {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

/* LG/XL: 4 columns. */
@media screen and (min-width: 1280px) {
    merch-card-collection.uber-pricing {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

merch-card[variant="uber-pricing"] {
    width: 100%;
    max-width: 474px;
    min-width: 261px;
}

merch-card[variant="uber-pricing"]:has([slot="footer"] a:hover) {
    --consonant-merch-card-border-color: #000;
    box-shadow: inset 0 0 0 3px #000;
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

merch-card[variant="uber-pricing"] span[data-template="legal"] {
    display: block;
    font-style: italic;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #000;
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
