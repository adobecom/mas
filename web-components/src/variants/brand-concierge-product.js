import { VariantLayout } from './variant-layout';
import { html, css } from 'lit';
import {
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';
import { CSS } from './brand-concierge-product.css.js';

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

export class BrandConciergeProduct extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
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
            if (price.options.displayTax) price.dataset.displayTax = 'false';
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
        return html` ${this.badge}
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

    static variantStyle = css`
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
