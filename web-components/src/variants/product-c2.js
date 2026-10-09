import { VariantLayout } from './variant-layout';
import { html, css } from 'lit';
import {
    TEMPLATE_PRICE_LEGAL,
    SELECTOR_MAS_INLINE_PRICE,
} from '../constants.js';
import { CSS } from './product-c2.css.js';

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

export class ProductC2 extends VariantLayout {
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
        options.displayPlanType = this.card?.settings?.displayPlanType ?? true;
    }

    renderLayout() {
        return html`
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

    static variantStyle = css`
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
