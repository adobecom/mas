import { html } from '../base-element.js';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './fries.css.js';

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

export class FriesCard extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    get aemFragmentMapping() {
        return FRIES_AEM_FRAGMENT_MAPPING;
    }

    renderLayout() {
        return html`
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

    static variantStyle = SHADOW_CSS;
}
