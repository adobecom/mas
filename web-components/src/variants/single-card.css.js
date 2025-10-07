export const CSS = `
:root {
    --consonant-merch-card-single-card-width: 1280px;
}

merch-card[variant="single-card"] {
    min-width: var(--consonant-merch-card-single-card-width);
    background-color: var(--consonant-merch-card-background-color);
    border: 1px solid var(--consonant-merch-card-border-color);
}

merch-card[variant="single-card"] [slot='image'] img {
    object-fit: cover;
    height: 100%;
    width: 650px;

}

merch-card[variant="single-card"] [slot='body-s'] {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

merch-card[variant="single-card"] [slot='body-s'] a.spectrum-Link {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.4;
    color: var(--spectrum-blue-600);
    text-decoration: underline;
}

.spectrum--darkest merch-card[variant="single-card"] {
    --consonant-merch-card-background-color: rgb(29, 29, 29);
    --consonant-merch-card-body-s-color: rgb(235, 235, 235);
    --consonant-merch-card-border-color: rgb(48, 48, 48);
    --consonant-merch-card-detail-s-color: rgb(235, 235, 235);
}


merch-card[variant="single-card"][size="wide"] .content {
    padding: 24px;
}

merch-card[variant="single-card"] [slot='body-s'] ul {
   list-style-type: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
merch-card[variant="single-card"] [slot='body-s'] ul li p mas-mnemonic {
   display: inline-block;
    padding-right: 20px;
}

merch-card[variant="single-card"] [slot='body-s'] ul li p {
    display: flex;
    align-items: center;
}
merch-card[variant="single-card"] [slot='body-s'] ul li p .mnemonic-text {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--spectrum-gray-700);
}
merch-card[variant="single-card"] span[is='inline-price'] .price .price-currency-symbol {
    vertical-align: super;
    font-size: 14px;
    color: #464646;
    font-weight: 600;
}
merch-card[variant="single-card"] span[is='inline-price'] .price .price-integer,
merch-card[variant="single-card"] span[is='inline-price'] .price .price-decimals {
    font-size: 25px;

}
merch-card[variant="single-card"] span[is='inline-price'] .price .price-unit-type,
merch-card[variant="single-card"] span[is='inline-price'] .price .price-recurrence {
   font-size: 14px;
   font-weight: normal;
}
merch-card[variant="single-card"] button[is='checkout-button'] {
  width: 110px;
}
                    
`;
