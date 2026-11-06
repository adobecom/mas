import { css } from '../css.js';

const CSS = css`
    merch-card[variant='fries'] {
        background-color: var(
            --merch-card-custom-background-color,
            var(--consonant-merch-card-background-color)
        );
    }

    merch-card[variant='fries'] merch-icon[size='s'] img {
        width: 26px;
        height: 25px;
    }

    merch-card[variant='fries'] [slot='heading-xxs'] {
        color: var(--consonant-merch-card-heading-xxs-color);
    }

    merch-card[variant='fries'] [slot='badge'] {
        position: absolute;
        top: 0;
        right: 24px;
        font-weight: 700;
    }

    merch-card[variant='fries'] [slot='badge'] merch-badge {
        border-radius: 0 0 5px 5px;
    }

    merch-card[variant='fries'] [slot='trial-badge'] {
        min-width: fit-content;
    }

    merch-card[variant='fries'] [slot='trial-badge'] merch-badge {
        display: inline-flex;
        padding: 4px 9px;
        background-color: transparent;
        border-radius: 4px;
        color: var(
            --merch-badge-background-color,
            var(--spectrum-global-color-green-700)
        );
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        max-width: fit-content;
    }

    merch-card[variant='fries'] [slot='body-s'] {
        letter-spacing: normal;
        color: var(--consonant-merch-card-body-s-color);
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
    }

    merch-card[variant='fries'] [slot='body-s'] p:has(mas-mnemonic) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        margin: 0;
    }

    merch-card[variant='fries'] [slot='body-s'] merch-icon {
        display: inline-flex;
        width: 20px;
        height: 20px;
        padding-inline-end: 6px;
        margin-top: 15px;
    }

    merch-card[variant='fries'] [slot='body-s'] .spectrum-Link--primary {
        text-decoration: none;
    }

    merch-card[variant='fries'] [slot='body-s'] .mnemonic-text {
        color: var(--spectrum-gray-900);
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        font-weight: 400;
        letter-spacing: normal;
        display: inline-flex;
        vertical-align: super;
    }

    merch-card[variant='fries'] [slot='price'] {
        display: flex;
        flex-direction: column;
        align-items: end;
        color: var(--spectrum-gray-900);
    }

    merch-card[variant='fries']
        [slot='price']
        span.placeholder-resolved[data-template='strikethrough'] {
        text-decoration: none;
    }

    merch-card[variant='fries'] [slot='price'] .price-strikethrough {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        vertical-align: middle;
        text-decoration: line-through;
        text-decoration-color: var(--merch-color-red-promo);
    }

    merch-card[variant='fries']
        [slot='price']
        .price-strikethrough
        .price-currency-symbol,
    merch-card[variant='fries']
        [slot='price']
        .price-strikethrough
        .price-integer,
    merch-card[variant='fries']
        [slot='price']
        .price-strikethrough
        .price-decimals-delimiter,
    merch-card[variant='fries']
        [slot='price']
        .price-strikethrough
        .price-decimals,
    merch-card[variant='fries']
        [slot='price']
        .price-strikethrough
        .price-recurrence {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 700;
        vertical-align: middle;
    }

    merch-card[variant='fries'] [slot='price'] .price-currency-symbol {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 400;
        vertical-align: super;
    }

    merch-card[variant='fries'] [slot='price'] .price-integer,
    merch-card[variant='fries'] [slot='price'] .price-decimals-delimiter,
    merch-card[variant='fries'] [slot='price'] .price-decimals {
        font-size: var(--consonant-merch-card-heading-m-font-size);
        line-height: var(--consonant-merch-card-heading-m-line-height);
        font-weight: 700;
    }

    merch-card[variant='fries'] [slot='price'] .price-recurrence {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 400;
    }

    merch-card[variant='fries'] [slot='addon-confirmation'] {
        color: var(--spectrum-green-800);
        font-size: 15px;
        font-weight: bold;
        margin-left: 8px;
    }

    merch-card[variant='fries'] [slot='whats-included'] {
        display: block;
        margin-top: 8px;
    }

    merch-card[variant='fries'] merch-whats-included {
        row-gap: 6px;
        flex-wrap: nowrap;
    }

    merch-card[variant='fries'] merch-whats-included > [slot='heading']:empty {
        display: none;
    }

    merch-card[variant='fries'] merch-whats-included merch-mnemonic-list {
        width: auto;
        flex: 0 0 auto;
        margin-right: 0;
    }

    merch-card[variant='fries'] merch-whats-included merch-icon {
        --img-width: 20px;
        --img-height: 20px;
    }

    .spectrum--dark merch-card[variant='fries'],
    .spectrum--darkest merch-card[variant='fries'] {
        --spectrum-yellow-300: rgb(248, 217, 4);
        --consonant-merch-card-background-color: rgb(19, 19, 19);
        --consonant-merch-card-heading-xxs-color: rgb(253, 253, 253);
        --consonant-merch-card-body-s-color: rgb(128, 128, 128);
        --merch-card-fries-badge-color: rgb(0, 122, 77);
        --consonant-merch-card-body-xxs-color: rgb(219, 219, 219);
        --merch-card-ah-promoted-plans-strikethrough-color: rgb(138, 138, 138);
    }

    .spectrum--dark merch-card[variant='fries'] [slot='body-s'],
    .spectrum--darkest merch-card[variant='fries'] [slot='body-s'] {
        color: rgb(142, 142, 147);
    }
`;

export const FRIES_AEM_FRAGMENT_MAPPING = {
    mnemonics: { size: 's' },
    title: { tag: 'h3', slot: 'heading-xxs', maxCount: 250, withSuffix: true },
    description: {
        tag: 'div',
        slot: 'body-s',
        maxCount: 2000,
        withSuffix: false,
    },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300' },
    trialBadge: {
        tag: 'div',
        slot: 'trial-badge',
        default: 'spectrum-green-800',
    },
    prices: { tag: 'p', slot: 'price' },
    ctas: { slot: 'cta', size: 'M' },
    addonConfirmation: { tag: 'div', slot: 'addon-confirmation' },
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gray: '--spectrum-gray-300',
            'gradient-purple-blue': 'var(--gradient-purple-blue)',
            'gradient-firefly-spectrum': 'var(--gradient-firefly-spectrum)',
        },
    },
};

export function define({ TemplateLayout }) {
    class FriesCard extends TemplateLayout {
        getGlobalCSS() {
            return CSS;
        }

        get aemFragmentMapping() {
            return FRIES_AEM_FRAGMENT_MAPPING;
        }

        renderLayout() {
            return `
            <div class="content">
                <div class="header">
                    <slot name="icons"></slot>
                    <slot name="heading-xxs"></slot>
                    <slot name="trial-badge"></slot>
                </div>
                <slot name="badge"></slot>
                <slot name="body-s"></slot>
                <slot name="whats-included"></slot>
                <div class="footer">
                    <div class="cta">
                        <slot name="cta"></slot>
                        <slot name="addon-confirmation"></slot>
                    </div>
                    <slot name="price"></slot>
                </div>
            </div>
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='fries']) {
                --merch-card-fries-max-width: 620px;
                --merch-card-fries-padding: 24px;
                --merch-card-fries-min-height: 204px;
                --merch-card-fries-header-min-height: 36px;
                --merch-card-fries-gray-background: rgba(248, 248, 248);
                --merch-card-fries-text-color: rgba(19, 19, 19);
                --merch-card-fries-price-line-height: 17px;
                --merch-card-fries-outline: transparent;
                --consonant-merch-card-border-width: 1px;
                max-width: var(--merch-card-fries-max-width);
                min-height: var(--merch-card-fries-min-height);
                background-color: var(
                    --merch-card-custom-background-color,
                    var(--spectrum-gray-300)
                );
                color: var(--consonant-merch-card-heading-xxxs-color);
                border-radius: 4px;
                border: 1px solid
                    var(--consonant-merch-card-border-color, transparent);
                display: flex;
                flex-direction: row;
                overflow: hidden;
                padding: var(--merch-card-fries-padding) !important;
                gap: 16px;
                justify-content: space-between;
                box-sizing: border-box !important;
            }

            :host([variant='fries']) .content {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                flex-grow: 1;
            }

            :host([variant='fries']) .header {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: var(--consonant-merch-spacing-xxs);
                padding-bottom: 15px;
                padding-top: 5px;
            }

            :host([variant='fries']) .footer {
                display: flex;
                width: fit-content;
                flex-wrap: nowrap;
                gap: 8px;
                flex-direction: row;
                margin-top: auto;
                align-items: end;
                width: 100%;
                justify-content: space-between;
            }

            :host([variant='fries']) .cta {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
            }

            :host([variant='fries'][gradient-border='true']) {
                border: 1px solid transparent;
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
                    var(--merch-card-fries-border-gradient);
                background-origin: padding-box, border-box;
                background-clip: padding-box, border-box;
            }

            :host([variant='fries'][border-color='gradient-purple-blue']) {
                --merch-card-fries-border-gradient: var(--gradient-purple-blue);
            }

            :host([variant='fries'][border-color='gradient-firefly-spectrum']) {
                --merch-card-fries-border-gradient: var(
                    --gradient-firefly-spectrum
                );
            }
        `;
    }
    return {
        fries: {
            class: FriesCard,
            fragmentMapping: FRIES_AEM_FRAGMENT_MAPPING,
            style: FriesCard.templateStyle,
        },
    };
}
