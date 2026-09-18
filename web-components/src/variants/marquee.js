import { html, nothing } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS, headlessRowStyle } from './headless.css.js';
import {
    makeToggleBackgroundsDetail,
    renderBackgroundsDetailRow,
    renderBackgroundsToggleButton,
} from './backgrounds-preview.js';

/** AEM fragment field → slot mapping so hydrate() can populate all Marquee slots. */
export const MARQUEE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    image: { tag: 'picture', slot: 'image' },
    backgrounds: { tag: 'picture', slot: 'backgrounds' },
    title: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    shortDescription: { tag: 'p', slot: 'short-description' },
    prices: { tag: 'p', slot: 'prices' },
    ctas: { slot: 'footer', size: 'm' },
};

/**
 * Slot name to display label for Marquee variant (label + value only, no card).
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const MARQUEE_FIELDS = [
    { slot: 'image', label: 'Image' },
    { slot: 'backgrounds', label: 'Backgrounds' },
    { slot: 'heading-xs', label: 'Title' },
    { slot: 'body-xs', label: 'Product description' },
    { slot: 'short-description', label: 'Short Description' },
    { slot: 'prices', label: 'Product price' },
    { slot: 'footer', label: 'CTAs' },
];

export class Marquee extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    toggleBackgroundsDetail = makeToggleBackgroundsDetail(() => this.card);

    renderLayout() {
        return html`
            <div class="headless">
                ${MARQUEE_FIELDS.map(
                    ({ slot, label }) => html`
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value" data-slot="${slot}">
                                <slot name="${slot}"></slot>
                                ${slot === 'backgrounds'
                                    ? renderBackgroundsToggleButton(
                                          this.toggleBackgroundsDetail,
                                      )
                                    : nothing}
                            </span>
                        </div>
                        ${slot === 'backgrounds'
                            ? renderBackgroundsDetailRow()
                            : nothing}
                    `,
                )}
                ${this.card.secureLabel
                    ? html`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `
                    : nothing}
            </div>
        `;
    }

    static variantStyle = headlessRowStyle('marquee');
}
