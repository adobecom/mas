import { html } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './ah-try-buy-widget.css.js';

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

export class AHTryBuyWidget extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    /* c8 ignore next 3 */
    get aemFragmentMapping() {
        return AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING;
    }

    renderLayout() {
        return html`
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

    static variantStyle = SHADOW_CSS;
}
