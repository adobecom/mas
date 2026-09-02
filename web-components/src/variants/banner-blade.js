import { html } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS, headlessRowStyle } from './headless.css.js';

/**
 * AEM fragment field → slot mapping so hydrate() can populate all Banner/Blade
 * slots. Covers both the Sticky Banner and Blade blocks, which share the same
 * content shape (description + CTAs) and are authored once under this single variant.
 */
export const BANNER_BLADE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'm' },
};

/**
 * Slot name to display label for Banner/Blade variant (label + value
 * only, no card). Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const BANNER_BLADE_FIELDS = [
    { slot: 'body-xs', label: 'Description' },
    { slot: 'footer', label: 'CTAs' },
];

export class BannerBlade extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return html`
            <div class="headless">
                ${BANNER_BLADE_FIELDS.map(
                    ({ slot, label }) => html`
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value" data-slot="${slot}">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static variantStyle = headlessRowStyle('banner-blade');
}
