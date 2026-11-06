import { css } from '../css.js';

const CSS = css`
    merch-card[variant='brand-concierge-product'] {
        width: 100%;
        min-width: 248px;
        max-width: 378px;
    }

    merch-card[variant='brand-concierge-product'] [slot='badge'] {
        position: absolute;
        top: 16px;
        inset-inline-end: 16px;
    }

    merch-card[variant='brand-concierge-product'] merch-badge {
        --merch-badge-border-radius: 7px;
        padding: 7px 10px;
        border: none;
        font-family: 'Adobe Clean Spectrum VF', 'Adobe Clean', sans-serif;
        font-weight: 500;
        line-height: 18px;
        inset-inline-start: 0;
    }

    merch-card[variant='brand-concierge-product'] [slot='heading-s'] {
        font-weight: 700;
        color: var(--merch-color-grey-80);
    }

    merch-card[variant='brand-concierge-product'] [slot='heading-xs'] {
        display: block;
    }

    merch-card[variant='brand-concierge-product']
        [slot='heading-xs']
        span.price-strikethrough {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 400;
        color: var(--ah-gray-500);
    }

    merch-card[variant='brand-concierge-product']
        [slot='heading-xs']
        span.price:not(.price-strikethrough):not(.price-legal),
    merch-card[variant='brand-concierge-product']
        [slot='heading-xs']
        .price-legal
        .price-unit-type:not(.disabled) {
        font-size: var(--consonant-merch-card-heading-xs-font-size);
        line-height: var(--consonant-merch-card-heading-xs-line-height);
        font-weight: 700;
        color: var(--consonant-merch-card-heading-xxxs-color);
    }

    merch-card[variant='brand-concierge-product']
        [slot='heading-xs']
        span[is='inline-price'][data-template='legal'] {
        display: inline;
        width: auto;
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        font-weight: 400;
    }

    merch-card[variant='brand-concierge-product']
        [slot='heading-xs']
        .price-legal {
        color: var(--merch-color-grey-80);
    }

    merch-card[variant='brand-concierge-product'] [slot='body-xs'],
    merch-card[variant='brand-concierge-product'] [slot='promo-text'] {
        color: var(--merch-color-grey-80);
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 400;
        min-height: 0;
    }

    merch-card[variant='brand-concierge-product'] [slot='body-xs'] a,
    merch-card[variant='brand-concierge-product'] [slot='promo-text'] a {
        color: #3b63fb;
    }

    merch-card[variant='brand-concierge-product']
        [slot='body-xs']
        a.spectrum-Link--secondary,
    merch-card[variant='brand-concierge-product']
        [slot='promo-text']
        a.spectrum-Link--secondary {
        color: inherit;
    }

    merch-card[variant='brand-concierge-product']
        [slot='heading-xs']
        .price-plan-type:not(.disabled) {
        display: block;
        margin-inline-start: 0;
    }
`;

export const BRAND_CONCIERGE_PRODUCT_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    mnemonics: { size: 'l' },
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'gradient-purple-blue',
    ],
    title: { tag: 'h3', slot: 'heading-s' },
    prices: { tag: 'p', slot: 'heading-xs' },
    planType: true,
    promoText: { tag: 'p', slot: 'promo-text' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
};

export function define({
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
}) {
    class BrandConciergeProduct extends TemplateLayout {
        getGlobalCSS() {
            return CSS;
        }

        priceOptionsProvider(element, options) {
            if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;
        }

        async adjustLegal() {
            if (this.legalAdjusted || !this.card.id) return;
            try {
                this.legalAdjusted = true;
                await this.card.updateComplete;
                await customElements.whenDefined('inline-price');
                const price = this.card.querySelector(
                    `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
                );
                if (!price) return;
                const legal = price.cloneNode(true);
                await price.onceSettled();
                if (!price.options) return;
                if (price.options.displayPerUnit)
                    price.dataset.displayPerUnit = 'false';
                if (price.options.displayTax)
                    price.dataset.displayTax = 'false';
                if (price.options.displayPlanType)
                    price.dataset.displayPlanType = 'false';
                legal.setAttribute('data-template', 'legal');
                price.parentNode.insertBefore(legal, price.nextSibling);
                await legal.onceSettled();
            } catch {
                // Proceed with the other post-update adjustments
            }
        }

        async postCardUpdateHook() {
            if (!this.card.isConnected) return;
            if (!this.legalAdjusted) await this.adjustLegal();
            await super.postCardUpdateHook();
        }

        renderLayout() {
            return ` ${this.badge}
            <div class="body">
                <slot name="icons"></slot>
                <slot name="badge"></slot>
                <slot name="heading-s"></slot>
                <slot name="heading-xs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
            </div>
            <footer><slot name="footer"></slot></footer>
            <slot></slot>`;
        }

        static templateStyle = css`
            :host([variant='brand-concierge-product']) {
                font-weight: 400;
                background:
                    linear-gradient(white, white) padding-box,
                    var(--consonant-merch-card-border-color, #dadada) border-box;
                border: 1px solid transparent;
            }

            :host([variant='brand-concierge-product']) .body {
                padding: 16px;
                gap: 8px;
            }

            :host([variant='brand-concierge-product']) footer {
                padding: 0px 16px 16px;
                gap: 8px;
            }
        `;
    }
    return {
        'brand-concierge-product': {
            class: BrandConciergeProduct,
            fragmentMapping: BRAND_CONCIERGE_PRODUCT_AEM_FRAGMENT_MAPPING,
            style: BrandConciergeProduct.templateStyle,
        },
    };
}
