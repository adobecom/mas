import { html } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS, headlessRowStyle } from './headless.css.js';

/**
 * AEM fragment field → slot mapping so hydrate() can populate all FAQ slots.
 * Reuses generic fields available on the shared card model (prices, description,
 * shortDescription, callout), relabeled for FAQ authoring via `editorLabel` (see
 * merch-card-editor.js) instead of introducing new content-model fields. `title` and
 * `promoText` are deliberately excluded: their underlying AEM model fields cap the
 * *serialized HTML* (not visible text) at 500 characters, which formatted FAQ answers
 * can exceed even at modest visible length.
 */
export const FAQ_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    prices: { tag: 'p', slot: 'prices' },
    description: {
        tag: 'div',
        slot: 'body-xs',
        editorLabel: 'FAQ answer 1',
    },
    shortDescription: {
        tag: 'p',
        slot: 'short-description',
        editorLabel: 'FAQ answer 2',
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'FAQ answer 3',
    },
};

/**
 * Slot name to display label for FAQ variant (label + value only, no card).
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const FAQ_FIELDS = [
    { slot: 'prices', label: 'Product price' },
    { slot: 'body-xs', label: 'FAQ answer 1' },
    { slot: 'short-description', label: 'FAQ answer 2' },
    { slot: 'callout-content', label: 'FAQ answer 3' },
];

export class Faq extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return html`
            <div class="headless">
                ${FAQ_FIELDS.map(
                    ({ slot, label }) => html`
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    static variantStyle = headlessRowStyle('faq');
}
