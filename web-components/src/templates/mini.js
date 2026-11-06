import { css } from '../css.js';

const CSS = css`
    merch-card[variant='mini'] {
        color: var(--spectrum-body-color);
        width: 400px;
        height: 250px;
    }

    merch-card[variant='mini'] .price-tax-inclusivity::before {
        content: initial;
    }

    merch-card[variant='mini'] [slot='title'] {
        font-size: 16px;
        font-weight: 700;
        line-height: 24px;
    }

    merch-card[variant='mini'] [slot='legal'] {
        min-height: 17px;
    }

    merch-card[variant='mini'] [slot='ctas'] {
        display: flex;
        flex: 1;
        gap: 16px;
        align-items: end;
        justify-content: end;
    }

    merch-card[variant='mini'] span.promo-duration-text,
    merch-card[variant='mini'] span.renewal-text {
        display: block;
    }
`;

export const MINI_AEM_FRAGMENT_MAPPING = {
    title: { tag: 'p', slot: 'title' },
    prices: { tag: 'p', slot: 'prices' },
    description: {
        tag: 'p',
        slot: 'description',
    },
    planType: true,
    ctas: { slot: 'ctas', size: 'S' },
};

export function define({ SELECTOR_MAS_INLINE_PRICE, TemplateLayout }) {
    /**
     * This variant is a headless data source for rendering by consumers using their own stack such as React...
     */
    class Mini extends TemplateLayout {
        legal = undefined;

        async postCardUpdateHook() {
            await super.postCardUpdateHook();
            this.adjustLegal();
        }

        getGlobalCSS() {
            return CSS;
        }

        get headingSelector() {
            return '[slot="title"]';
        }

        priceOptionsProvider(element, options) {
            // accessibility texts are not needed as part of price text
            options.literals = {
                ...options.literals,
                strikethroughAriaLabel: '',
                alternativePriceAriaLabel: '',
            };
            options.space = true;
            options.displayAnnual = this.card.settings?.displayAnnual ?? false;
        }

        adjustLegal() {
            if (this.legal !== undefined) return;
            const price = this.card.querySelector(
                `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
            if (!price) return;
            const legal = price.cloneNode(true);
            this.legal = legal;
            price.dataset.displayTax = 'false';
            price.dataset.displayPerUnit = 'false';
            legal.dataset.template = 'legal';
            legal.dataset.displayPlanType =
                this.card?.settings?.displayPlanType ?? true;
            legal.setAttribute('slot', 'legal');
            this.card.appendChild(legal);
        }

        renderLayout() {
            return `
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `;
        }

        static templateStyle = css`
            :host([variant='mini']) {
                min-width: 209px;
                min-height: 103px;
                background-color: var(--spectrum-background-base-color);
                border: 1px solid
                    var(--consonant-merch-card-border-color, #dadada);
            }
        `;
    }
    return {
        mini: {
            class: Mini,
            fragmentMapping: MINI_AEM_FRAGMENT_MAPPING,
            style: Mini.templateStyle,
        },
    };
}
