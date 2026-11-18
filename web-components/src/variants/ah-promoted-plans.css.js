export const CSS = `
    merch-card[variant="ah-promoted-plans"] [slot="body-xxs"] {
        letter-spacing: normal;
        box-sizing: border-box;
        color: var(--consonant-merch-card-body-xxs-color);
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    merch-card[variant="ah-promoted-plans"] [slot="body-xxs"] a {
        color: var(--consonant-merch-card-body-xxs-color);
    }

    merch-card[variant="ah-promoted-plans"] [slot="body-xxs"] a:hover {
        color: var(--consonant-merch-card-body-xxs-color);
    }

    merch-card[variant="ah-promoted-plans"] [slot="price"] .price {
        display: inline-block;
        height: var(--consonant-merch-card-detail-xl-line-height);
        line-height: var(--consonant-merch-card-detail-xl-line-height);
        font-style: normal;
    }

    merch-card[variant="ah-promoted-plans"] [slot="price"] .price.price-strikethrough {
        height: var(--consonant-merch-card-detail-l-line-height);
        line-height: var(--consonant-merch-card-detail-l-line-height);
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        text-decoration-thickness: .5px;
        color: var(--merch-card-ah-promoted-plans-strikethrough-color);
    }

    merch-card[variant="ah-promoted-plans"] [slot="price"] .price:not(.price-strikethrough) .price-currency-symbol,
    merch-card[variant="ah-promoted-plans"] [slot="price"] .price:not(.price-strikethrough) .price-integer,
    merch-card[variant="ah-promoted-plans"] [slot="price"] .price:not(.price-strikethrough) .price-decimals-delimiter,
    merch-card[variant="ah-promoted-plans"] [slot="price"] .price:not(.price-strikethrough) .price-decimals {
        color: var(--consonant-merch-card-heading-xxxs-color);
        font-size: var(--consonant-merch-card-heading-xs-font-size);
        font-weight: 700;
    }

    merch-card[variant="ah-promoted-plans"] [slot="price"] .price:not(.price-strikethrough) .price-recurrence {
        display: inline-block;
        width: 21px;
        text-align: end;
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        color: var(--consonant-merch-card-body-xxs-color);
        font-weight: 400;
    }

    merch-card[variant="ah-promoted-plans"] [slot="cta"] {
        gap: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    
    merch-card[variant="ah-promoted-plans"] [slot="cta"] .spectrum-Link {
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        color: var(--consonant-merch-card-body-xxs-color);
    }

    merch-card[variant="ah-promoted-plans"] [slot="cta"] button[is="checkout-button"] {
        margin-inline-start: auto;
    }
    
    merch-card[variant="ah-promoted-plans"] [slot="cta"] button[is="checkout-button"]:last-child {
        margin-inline-start: 0;
    }

    merch-card[variant="ah-promoted-plans"] [slot="price"] em {
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        color: var(--merch-card-ah-promoted-plans-abm-color);
    }

    .spectrum--dark merch-card[variant="ah-promoted-plans"],
    .spectrum--darkest merch-card[variant="ah-promoted-plans"] {
      --consonant-merch-card-background-color:rgb(34, 34, 34);
      --consonant-merch-card-heading-xxxs-color:rgb(242, 242, 242);
      --merch-card-ah-promoted-plans-abm-color:rgb(175, 175, 175);
      --consonant-merch-card-body-xxs-color:rgb(219, 219, 219);
      --merch-card-ah-promoted-plans-strikethrough-color:rgb(138, 138, 138);
    }
`;

export const SHADOW_CSS = `
    /* Default styles for the component */
    :host([variant='ah-promoted-plans']) {
        --merch-card-ah-promoted-plans-min-width: 211px;
        --merch-card-ah-promoted-plans-max-width: 384px;
        --merch-card-ah-promoted-plans-header-min-height: 36px;
        --merch-card-ah-promoted-plans-gray-background: rgba(248, 248, 248);
        --merch-card-ah-promoted-plans-text-color: rgba(19, 19, 19);
        --merch-card-ah-promoted-plans-abm-color: rgba(80, 80, 80);
        --merch-card-ah-promoted-plans-strikethrough-color: rgba(
            113,
            113,
            113
        );
        --merch-card-ah-promoted-plans-price-line-height: 17px;
        --merch-card-ah-promoted-plans-outline: transparent;
        --consonant-merch-card-border-width: 1px;
        height: 100%;
        min-width: var(--merch-card-ah-promoted-plans-min-width);
        max-width: var(--merch-card-ah-promoted-plans-max-width);
        background-color: var(
            --merch-card-custom-background-color,
            var(--consonant-merch-card-background-color)
        );
        color: var(--consonant-merch-card-heading-xxxs-color);
        border-radius: 10px;
        border: 1px solid
            var(--consonant-merch-card-border-color, transparent);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 16px !important;
        gap: 16px;
        justify-content: space-between;
        box-sizing: border-box !important;
        position: relative;
    }

    :host([variant='ah-promoted-plans'][gradient-border='true']) {
        border: none;
        padding: 15px !important;
        background-origin: padding-box, border-box;
        background-clip: padding-box, border-box;
        background-image: linear-gradient(
                to bottom,
                var(
                    --merch-card-custom-background-color,
                    var(--consonant-merch-card-background-color)
                ),
                var(
                    --merch-card-custom-background-color,
                    var(--consonant-merch-card-background-color)
                )
            ),
            linear-gradient(135deg, #ff4885 0%, #b272eb 50%, #5d89ff 100%);
        border: 1px solid transparent;
    }

    :host([variant='ah-promoted-plans']) .content {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: var(--consonant-merch-spacing-xxs);
        flex-grow: 1;
    }

    :host([variant='ah-promoted-plans']) .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--consonant-merch-spacing-xxs);
    }

    :host([variant='ah-promoted-plans']) ::slotted([slot='price']) {
        margin-left: var(--spacing-xs);
        display: flex;
        flex-direction: column;
        justify-content: end;
        font-size: var(--consonant-merch-card-body-m-font-size);
        font-style: italic;
        line-height: var(--consonant-merch-card-body-m-line-height);
        color: var(--consonant-merch-card-heading-xxxs-color);
    }

    :host([variant='ah-promoted-plans']) .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
`;
