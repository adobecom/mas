export const CSS = `
merch-card[variant="product-c2"] {
    width: 100%;
}

merch-card[variant="product-c2"] [slot="heading-xs"] {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    line-height: 30px;
}

merch-card[variant="product-c2"] [slot="body-xs"] {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
}

merch-card[variant="product-c2"] [slot="heading-m"] {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    line-height: 30px;
}

merch-card[variant="product-c2"] [slot="heading-m"] p {
    margin: 0;
}

merch-card[variant="product-c2"] [slot="promo-text"] {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant="product-c2"] [slot="body-xxs"] {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
}

merch-card[variant="product-c2"] [slot="footer"] {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

merch-card[variant="product-c2"] [slot="footer"] a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 999px;
    min-height: 40px;
    padding: 0 24px;
    font-size: 16px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    background: #3b63fb;
    color: #fff;
    border: 2px solid #3b63fb;
}

merch-card[variant="product-c2"] [slot="footer"] a.con-button.outline,
merch-card[variant="product-c2"] [slot="footer"] a.outline {
    background: transparent;
    color: inherit;
    border-color: currentColor;
}
`;
