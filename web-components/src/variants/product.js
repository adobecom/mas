import { VariantLayout } from './variant-layout';
import { createTag } from '../utils.js';
import { html, css } from 'lit';
import { CSS } from './product.css.js';
import Media from '../media.js';
import {
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
} from '../constants.js';

export const PRODUCT_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    secureLabel: true,
    planType: true,
    badgeIcon: true,
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-yellow-300-variation',
    },
    allowedBadgeColors: [
        'spectrum-yellow-300-variation',
        'spectrum-gray-300-variation',
        'spectrum-gray-700-variation',
        'spectrum-green-900-variation',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-variation',
        'spectrum-gray-300-variation',
        'spectrum-green-900-variation',
        'gradient-purple-blue',
    ],
    borderColor: { attribute: 'border-color' },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
};

export class Product extends VariantLayout {
    constructor(card) {
        super(card);
        this.postCardUpdateHook = this.postCardUpdateHook.bind(this);
        this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
    }

    getGlobalCSS() {
        return CSS;
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        options.displayPlanType = this.card?.settings?.displayPlanType ?? false;

        if (
            element.dataset.template === 'strikethrough' ||
            element.dataset.template === 'price'
        ) {
            options.displayPerUnit = false;
        }
    }

    adjustProductBodySlots() {
        if (this.card.getBoundingClientRect().width === 0) return;

        const slots = [
            'heading-xs',
            'body-xxs',
            'body-xs',
            'promo-text',
            'callout-content',
            'addon',
            'body-lower',
        ];

        slots.forEach((slot) =>
            this.updateCardElementMinHeight(
                this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
                slot,
            ),
        );
    }

    renderLayout() {
        return html` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom
                    ? html`<slot name="promo-text"></slot>`
                    : ''}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html`<slot name="promo-text"></slot>` : ''}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="addon"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`;
    }

    connectedCallbackHook() {
        window.addEventListener('resize', this.postCardUpdateHook);
        this.card.addEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
    }

    disconnectedCallbackHook() {
        window.removeEventListener('resize', this.postCardUpdateHook);
        this.card.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
    }

    async postCardUpdateHook() {
        if (!this.card.isConnected) return;
        this.adjustAddon();
        if (!Media.isMobile) {
            this.adjustProductBodySlots();
        }
        if (!this.legalAdjusted) {
            await this.adjustLegal();
        }
        this.adjustTitleWidth();
    }

    async adjustLegal() {
        if (this.legalAdjusted) return;

        try {
            this.legalAdjusted = true;
            await this.card.updateComplete;
            await customElements.whenDefined('inline-price');

            const headingPrice = this.mainPrice;
            if (!headingPrice) return;

            const legal = headingPrice.cloneNode(true);
            await headingPrice.onceSettled();

            if (!headingPrice?.options) return;

            if (headingPrice.options.displayPerUnit)
                headingPrice.dataset.displayPerUnit = 'false';
            if (headingPrice.options.displayTax)
                headingPrice.dataset.displayTax = 'false';
            if (headingPrice.options.displayPlanType)
                headingPrice.dataset.displayPlanType = 'false';

            legal.setAttribute('data-template', 'legal');
            headingPrice.parentNode.insertBefore(
                legal,
                headingPrice.nextSibling,
            );
            await legal.onceSettled();
        } catch {
            // Proceed with other adjustments
        }
    }

    get headingXSSlot() {
        return this.card.shadowRoot
            .querySelector('slot[name="heading-xs"]')
            .assignedElements()[0];
    }

    get mainPrice() {
        const price = this.card.querySelector(
            `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
        );
        return price;
    }

    updatePriceQuantity({ detail }) {
        if (!this.mainPrice || !detail?.option) return;
        this.mainPrice.dataset.quantity = detail.option;
    }

    toggleAddon(merchAddon) {
        const mainPrice = this.mainPrice;
        const headingXSSlot = this.headingXSSlot;
        if (!mainPrice && headingXSSlot) {
            const planType = merchAddon?.getAttribute('plan-type');
            let visibleSpan = null;
            if (merchAddon && planType) {
                const matchingP = merchAddon.querySelector(
                    `p[data-plan-type="${planType}"]`,
                );
                visibleSpan = matchingP?.querySelector(
                    'span[is="inline-price"]',
                );
            }
            this.card
                .querySelectorAll('p[slot="heading-xs"]')
                .forEach((p) => p.remove());
            if (merchAddon.checked) {
                if (visibleSpan) {
                    const replacementP = createTag(
                        'p',
                        {
                            class: 'addon-heading-xs-price-addon',
                            slot: 'heading-xs',
                        },
                        visibleSpan.innerHTML,
                    );
                    this.card.appendChild(replacementP);
                }
            } else {
                const freeP = createTag(
                    'p',
                    { class: 'card-heading', id: 'free', slot: 'heading-xs' },
                    'Free',
                );
                this.card.appendChild(freeP);
            }
        }
    }

    async adjustAddon() {
        await this.card.updateComplete;
        const addon = this.card.addon;
        if (!addon) return;
        const price = this.mainPrice;
        let planType = this.card.planType;
        if (price) {
            await price.onceSettled();
            planType = price.value?.[0]?.planType;
        }
        if (!planType) return;
        addon.planType = planType;
    }

    static variantStyle = css`
        :host([variant='product']) {
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant='product']) > slot:not([name='icons']) {
            display: block;
        }
        :host([variant='product']) slot[name='body-xs'] {
            min-height: var(--consonant-merch-card-product-body-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='heading-xs'] {
            min-height: var(--consonant-merch-card-product-heading-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='body-xxs'] {
            min-height: var(--consonant-merch-card-product-body-xxs-height);
            display: block;
        }
        :host([variant='product']) slot[name='promo-text'] {
            min-height: var(--consonant-merch-card-product-promo-text-height);
            display: block;
        }
        :host([variant='product']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-product-callout-content-height
            );
            display: block;
        }
        :host([variant='product']) slot[name='addon'] {
            min-height: var(--consonant-merch-card-product-addon-height);
        }

        :host([variant='product']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='product']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }
    `;
}
