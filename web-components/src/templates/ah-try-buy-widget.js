import { css } from '../css.js';

const CSS = css`
    merch-card[variant='ah-try-buy-widget'] [slot='body-xxs'] {
        letter-spacing: normal;
        margin-bottom: 16px;
        box-sizing: border-box;
        color: var(--consonant-merch-card-body-xxs-color);
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='badge'] {
        position: absolute;
        top: 18px;
        right: 12px;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='badge'] merch-badge {
        border-radius: 7px;
        font-size: 12px;
        font-weight: normal;
        line-height: normal;
        padding: 4px 9px 5px 9px;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='body-xxs'] a {
        color: var(--consonant-merch-card-body-xxs-color);
    }

    merch-card[variant='ah-try-buy-widget'] [slot='body-xxs'] a:hover {
        color: var(--consonant-merch-card-body-xxs-color);
    }

    merch-card[variant='ah-try-buy-widget'] [slot='heading-xxxs'] {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        display: -moz-box;
        -webkit-box-orient: vertical;
        -moz-box-orient: vertical;
        line-clamp: 3;
        -webkit-line-clamp: 3;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='price'] .price {
        display: inline-block;
        height: var(--consonant-merch-card-detail-xl-line-height);
        line-height: var(--consonant-merch-card-detail-xl-line-height);
        font-style: normal;
        margin-top: 4px;
    }

    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price.price-strikethrough {
        height: var(--consonant-merch-card-detail-l-line-height);
        line-height: var(--consonant-merch-card-detail-l-line-height);
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        text-decoration-thickness: 0.5px;
        color: var(--ah-gray-500);
    }

    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price:not(.price-strikethrough)
        .price-currency-symbol,
    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price:not(.price-strikethrough)
        .price-integer,
    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price:not(.price-strikethrough)
        .price-decimals-delimiter,
    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price:not(.price-strikethrough)
        .price-decimals {
        color: var(--consonant-merch-card-heading-xxxs-color);
        font-size: var(--consonant-merch-card-heading-xs-font-size);
        font-weight: 700;
    }

    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price:not(.price-strikethrough)
        .price-recurrence {
        width: 21px;
        text-align: end;
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        color: var(--consonant-merch-card-body-xxs-color);
        font-weight: 400;
    }

    merch-card[variant='ah-try-buy-widget']
        [slot='price']
        .price:not(.price-strikethrough)
        .price-tax-inclusivity {
        font-weight: 400;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='price'] a {
        color: var(--consonant-merch-card-body-xxs-color);
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        font-style: normal;
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        text-decoration: underline;
        text-decoration-thickness: 0.75px;
        text-underline-offset: 1px;
        width: fit-content;
        margin-top: 4px;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='price'] a:hover {
        color: var(--consonant-merch-card-body-xxs-color);
        font-weight: 700;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='cta'] {
        align-self: end;
        gap: 8px;
        display: flex;
        padding-top: 24px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    merch-card[variant='ah-try-buy-widget'] [slot='image'] {
        display: none;
    }

    merch-card[variant='ah-try-buy-widget'][size='single'] [slot='image'] {
        display: flex;
        width: 199px;
        overflow: hidden;
        height: 100%;
        border-radius: 16px;
        order: 1;
    }

    merch-card[variant='ah-try-buy-widget'][size='single'] [slot='image'] img {
        width: 100%;
        object-fit: cover;
        border-radius: 16px;
        overflow: hidden;
    }

    .spectrum--dark
        merch-card[variant='ah-try-buy-widget'][background-color='gray'],
    .spectrum--darkest
        merch-card[variant='ah-try-buy-widget'][background-color='gray'] {
        --merch-card-ah-try-buy-widget-gray-background: rgb(34, 34, 34);
    }

    .spectrum--dark merch-card[variant='ah-try-buy-widget'],
    .spectrum--darkest merch-card[variant='ah-try-buy-widget'] {
        --consonant-merch-card-background-color: rgb(34, 34, 34);
        --consonant-merch-card-heading-xxxs-color: rgb(242, 242, 242);
        --consonant-merch-card-body-xxs-color: rgb(219, 219, 219);
    }

    .spectrum--dark merch-card[variant='ah-try-buy-widget']:hover,
    .spectrum--darkest merch-card[variant='ah-try-buy-widget']:hover {
        --consonant-merch-card-border-color: rgb(73, 73, 73);
    }
`;

export const AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING = {
    mnemonics: { size: 's' },
    title: { tag: 'h3', slot: 'heading-xxxs', maxCount: 40, withSuffix: true },
    badge: { tag: 'div', slot: 'badge', default: 'fuchsia' },
    allowedBadgeColors: ['fuchsia'],
    description: {
        tag: 'div',
        slot: 'body-xxs',
        maxCount: 200,
        withSuffix: false,
    },
    prices: { tag: 'p', slot: 'price' },
    ctas: { slot: 'cta', size: 'S' },
    backgroundImage: { tag: 'div', slot: 'image' },
    backgroundColor: { attribute: 'background-color' },
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gradient:
                'linear-gradient(135deg, #ff4885 0%, #b272eb 50%, #5d89ff 100%)',
        },
    },
    allowedColors: { gray: '--spectrum-gray-75' },
    size: ['single', 'double', 'triple'],
};

export function define({ TemplateLayout }) {
    class AHTryBuyWidget extends TemplateLayout {
        getGlobalCSS() {
            return CSS;
        }

        /* c8 ignore next 3 */
        get aemFragmentMapping() {
            return AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING;
        }

        renderLayout() {
            return `
            <div class="content">
                <div class="header">
                    <slot name="icons"></slot>
                    <slot name="heading-xxxs"></slot>
                </div>
                <slot name="body-xxs"></slot>
                <div class="price">
                    <slot name="price"></slot>
                </div>
                <div class="footer">
                    <slot name="cta"></slot>
                </div>
            </div>
            <slot name="image"></slot>
            <slot name="badge"></slot>
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='ah-try-buy-widget']) {
                --merch-card-ah-try-buy-widget-min-width: 156px;
                --merch-card-ah-try-buy-widget-content-min-width: 132px;
                --merch-card-ah-try-buy-widget-header-min-height: 36px;
                --merch-card-ah-try-buy-widget-gray-background: rgba(
                    248,
                    248,
                    248
                );
                --merch-card-ah-try-buy-widget-text-color: rgba(19, 19, 19);
                --merch-card-ah-try-buy-widget-price-line-height: 17px;
                --merch-card-ah-try-buy-widget-outline: transparent;
                --consonant-merch-card-border-width: 1px;
                height: 100%;
                min-width: var(--merch-card-ah-try-buy-widget-min-width);
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
                padding: 11px !important;
                gap: 16px;
                justify-content: space-between;
                box-sizing: border-box !important;
            }

            :host([variant='ah-try-buy-widget'][gradient-border='true']) {
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
                    linear-gradient(
                        135deg,
                        #ff4885 0%,
                        #b272eb 50%,
                        #5d89ff 100%
                    );
                border: 1px solid transparent;
            }

            :host([variant='ah-try-buy-widget'][size='single']) {
                flex-direction: row;
            }

            :host([variant='ah-try-buy-widget'][size='single'])
                ::slotted(div[slot='cta']) {
                display: flex;
                flex-grow: 0;
            }

            :host([variant='ah-try-buy-widget']) .content {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                min-width: var(
                    --merch-card-ah-try-buy-widget-content-min-width
                );
                flex-basis: var(
                    --merch-card-ah-try-buy-widget-content-min-width
                );
                flex-grow: 1;
            }

            :host([variant='ah-try-buy-widget']) .header {
                display: flex;
                min-height: var(
                    --merch-card-ah-try-buy-widget-header-min-height
                );
                flex-direction: row;
                align-items: center;
                gap: var(--consonant-merch-spacing-xxs);
                margin-bottom: 4px;
            }

            :host([variant='ah-try-buy-widget']) .price {
                display: flex;
                flex-grow: 1;
            }

            :host([variant='ah-try-buy-widget']) ::slotted([slot='price']) {
                margin-left: var(--spacing-xs);
                display: flex;
                flex-direction: column;
                justify-content: end;
                font-size: var(--consonant-merch-card-detail-s-font-size);
                font-style: italic;
                line-height: var(
                    --merch-card-ah-try-buy-widget-price-line-height
                );
                color: var(--consonant-merch-card-heading-xxxs-color);
            }

            :host([variant='ah-try-buy-widget']) .footer {
                display: flex;
                width: fit-content;
                flex-wrap: wrap;
                gap: 8px;
                flex-direction: row;
                align-self: flex-end;
            }
        `;
    }
    return {
        'ah-try-buy-widget': {
            class: AHTryBuyWidget,
            fragmentMapping: AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING,
            style: AHTryBuyWidget.templateStyle,
        },
    };
}
