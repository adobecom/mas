import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-productc2-width: 370px;
        --s2a-font-letter-spacing-4xl: -0.48px;
        --gray: var(--color-gray-100, #f8f8f8);
        --legal-gray: #ffffffa3;
        --transparent: transparent;
    }

    merch-card[variant='product-c2'] {
        max-width: var(--consonant-merch-card-productc2-width);
    }

    merch-card[variant='product-c2'] [slot='subtitle'] {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
    }

    merch-card[variant='product-c2'] {
        width: 100%;
    }

    merch-card[variant='product-c2']
        [slot='heading-m']
        span[is='inline-price'] {
        font-weight: 900;
    }

    merch-card[variant='product-c2'] [slot='heading-m'],
    merch-card[variant='product-c2'] [slot='heading-m'] .price-strikethrough {
        margin: 0;
        font-weight: 900;
        font-size: var(--consonant-merch-card-body-xxl-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
    }

    merch-card[variant='product-c2'] [slot='heading-m'] .price-legal {
        font-size: inherit;
        line-height: inherit;
        font-weight: 400;
        color: #000000a3;
    }

    merch-card[variant='product-c2']
        [slot='heading-m']
        [data-template='price'] {
        letter-spacing: var(--s2a-font-letter-spacing-4xl);
        font-family: 'Adobe Clean Display Black', adobe-clean-display,
            'Arial Bold Adjusted', sans-serif;
    }

    merch-card[variant='product-c2']
        [slot='heading-m']
        [data-template='legal'] {
        display: block;
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
    }

    merch-card[variant='product-c2'] [slot='body-xs'],
    merch-card[variant='product-c2'] [slot='short-description'] {
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-heading-xxs-line-height);
    }

    merch-card[variant='product-c2'] [slot='footer'] {
        display: flex;
        gap: 8px;
        width: 100%;
    }

    merch-card[variant='product-c2'] [slot='footer'] a {
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

    merch-card[variant='product-c2'] [slot='short-description'] .icon-button {
        background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18"><path d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"/></svg>');
    }

    merch-card[variant='product-c2'] [slot='badge'] merch-badge {
        --merch-badge-border-radius: 4px !important;
    }

    @media screen and (--mobile-landscape) {
        merch-card[variant='product-c2'] {
            background-color: var(--color-white);
            padding: 0;
        }

        merch-card[variant='product-c2'][background-color='black'] merch-badge {
            background-color: var(--color-black);
            --merch-badge-color: var(--color-white);
        }
    }

    merch-card[variant='product-c2'] [slot='footer'] a.primary-outline {
        border-color: var(--color-black);
        color: var(--color-black);
    }

    merch-card[variant='product-c2'] [slot='footer'] a.primary-outline:hover {
        background-color: #00000014;
    }

    merch-card[variant='product-c2'] [slot='heading-m'],
    merch-card[variant='product-c2'] [slot='body-xs'] {
        color: var(--color-black);
    }

    @media screen and (--tablet-up) {
        merch-card[variant='product-c2'][background-color='black'] {
            background-color: var(--color-black);
            color: var(--color-white);
        }

        merch-card[variant='product-c2'][background-color='black']
            [slot='body-xs'],
        merch-card[variant='product-c2'][background-color='black']
            [slot='heading-m'] {
            color: var(--color-white);
        }

        merch-card[variant='product-c2'][background-color='black']
            [slot='heading-m']
            .price-strikethrough {
            color: #c6c6c6;
        }

        merch-card[variant='product-c2'][background-color='black']
            [slot='heading-m']
            .price-legal {
            color: var(--legal-gray);
        }

        merch-card[variant='product-c2'][background-color='black']
            [slot='footer']
            a.primary-outline {
            border-color: var(--color-white);
            color: var(--color-white);
        }

        merch-card[variant='product-c2'][background-color='black']
            [slot='footer']
            a.primary-outline:hover {
            background-color: var(--legal-gray);
            color: var(--color-black);
        }

        merch-card[variant='product-c2'][background-color='black']
            [slot='short-description']
            .icon-button {
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18"><path fill="%23aaaaaa" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"/></svg>');
        }

        merch-card[variant='product-c2'][background-color='gray'] {
            background-color: var(--gray);
        }

        merch-card[variant='product-c2']
            [slot='short-description']
            .icon-button::before {
            top: unset;
            left: 50%;
            transform: translateX(-50%);
            margin-left: 0;
            bottom: 100%;
            margin-bottom: 8px;
        }

        merch-card[variant='product-c2']
            [slot='short-description']
            .icon-button::after {
            top: unset;
            left: 50%;
            margin-left: -8px;
            transform: none;
            bottom: calc(100% - 8px);
            border-color: #0469e3 transparent transparent transparent;
        }
    }

    @media screen and (max-width: 900px) {
        merch-card[variant='product-c2'] {
            max-width: unset;
        }
    }
`;

export const PRODUCT_C2_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    description: { tag: 'div', slot: 'body-xs' },
    prices: { tag: 'p', slot: 'heading-m' },
    shortDescription: { tag: 'div', slot: 'short-description' },
    ctas: { slot: 'footer', size: 'm' },
    planType: true,
    backgroundColor: { attribute: 'background-color' },
    allowedColors: { gray: '--spectrum-gray-100', black: '--spectrum-black' },
    badge: { tag: 'div', slot: 'badge', default: 'color-yellow-300-variation' },
    allowedBadgeColors: [
        'color-white',
        'color-yellow-300-variation',
        'color-gray-300-variation',
        'color-gray-700-variation',
        'color-green-900-variation',
        'color-red-700-variation',
    ],
    style: 'consonant',
};

export function define({
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
}) {
    class ProductC2 extends TemplateLayout {
        getGlobalCSS() {
            return CSS;
        }

        get mainPrice() {
            return this.card.querySelector(
                `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
        }

        async postCardUpdateHook() {
            if (!this.legalAdjusted) {
                await this.adjustLegal();
            }
            await super.postCardUpdateHook();
        }

        async adjustLegal() {
            if (this.legalAdjusted || !this.card.id) return;

            try {
                this.legalAdjusted = true;
                await this.card.updateComplete;
                await customElements.whenDefined('inline-price');

                const headingPrice = this.mainPrice;
                if (!headingPrice) return;

                const legal = headingPrice.cloneNode(true);
                await headingPrice.onceSettled();

                if (!headingPrice?.options) return;

                if (headingPrice.options.displayPlanType)
                    headingPrice.dataset.displayPlanType = 'false';

                legal.setAttribute('data-template', 'legal');
                legal.dataset.displayPerUnit = 'false';
                headingPrice.parentNode.insertBefore(
                    legal,
                    headingPrice.nextSibling,
                );
                await legal.onceSettled();
            } catch {
                // Proceed with other adjustments
            }
        }

        priceOptionsProvider(element, options) {
            if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? true;
        }

        renderLayout() {
            return `
            ${this.badge}
            <div class="body">
                <div class="heading">
                    <slot name="subtitle"></slot>
                    <slot name="badge"></slot>
                </div>
                <slot name="heading-m"></slot>
                <slot name="body-xs"></slot>
                <slot name="short-description"></slot>
            </div>
            <footer><slot name="footer"></slot></footer>
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='product-c2']) {
                display: flex;
                flex-direction: column;
                gap: 24px;
                padding: 24px;
                box-sizing: border-box;
                border-radius: 12px;
                color: #000;
                border: none;
            }

            :host([variant='product-c2']) .body {
                padding: 0;
            }

            :host([variant='product-c2']) .heading {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
            }

            :host([variant='product-c2']) footer {
                gap: 8px;
                padding: 0;
                justify-content: flex-start;
            }

            .body .catalog-badge {
                display: flex;
                height: fit-content;
                flex-direction: column;
                width: fit-content;
                max-width: 140px;
                border-radius: 5px;
                position: relative;
                top: 0;
                margin-left: var(--consonant-merch-spacing-xxs);
                box-sizing: border-box;
            }
        `;
    }
    return {
        'product-c2': {
            class: ProductC2,
            fragmentMapping: PRODUCT_C2_AEM_FRAGMENT_MAPPING,
            style: ProductC2.templateStyle,
        },
    };
}
