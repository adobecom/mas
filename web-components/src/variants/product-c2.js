import { VariantLayout } from './variant-layout';
import { html, css } from 'lit';
import { TEMPLATE_PRICE_LEGAL } from '../constants.js';
import { CSS } from './product-c2.css.js';

export const PRODUCT_C2_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    mnemonics: { size: 'l' },
    badge: { tag: 'div', slot: 'badge' },
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    prices: { tag: 'p', slot: 'heading-m' },
    promoText: { tag: 'p', slot: 'promo-text' },
    shortDescription: { tag: 'div', slot: 'body-xxs' },
    ctas: { slot: 'footer', size: 'm' },
    planType: true,
    backgroundColor: {
        attribute: 'background-color',
        editorLabel: 'Theme',
        specialValues: { Light: 'light', Dark: 'dark' },
    },
    style: 'consonant',
};

export class ProductC2 extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        options.displayPlanType = this.card?.settings?.displayPlanType ?? true;
    }

    renderLayout() {
        return html` <div class="header">
                <slot name="icons"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="copy">
                <slot name="heading-xs"></slot>
                <slot name="body-xs"></slot>
            </div>
            <div class="price">
                <slot name="heading-m"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xxs"></slot>
            </div>
            <footer><slot name="footer"></slot></footer>
            <slot></slot>`;
    }

    static variantStyle = css`
        :host([variant='product-c2']) {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 24px;
            box-sizing: border-box;
            border-radius: 16px;
            background: #f8f8f8;
            color: #000;
            border: none;
        }

        :host([variant='product-c2'][background-color='dark']) {
            background: #000;
            color: #fff;
        }

        :host([variant='product-c2']) .header {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        :host([variant='product-c2']) .copy {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        :host([variant='product-c2']) .price {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        :host([variant='product-c2']) footer {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 0;
        }
    `;
}
