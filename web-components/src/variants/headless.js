import { html, css, nothing } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './headless.css.js';

/** AEM fragment field → slot mapping so hydrate() can populate all Headless slots. */
export const HEADLESS_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'p', slot: 'heading-xs' },
    cardTitle: { tag: 'p', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'body-xxs' },
    description: { tag: 'div', slot: 'body-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    shortDescription: { tag: 'p', slot: 'short-description' },
    callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    addonConfirmation: { tag: 'div', slot: 'addon-confirmation' },
    badge: { tag: 'div', slot: 'badge' },
    trialBadge: { tag: 'div', slot: 'trial-badge' },
    prices: { tag: 'p', slot: 'prices' },
    backgroundImage: { tag: 'div', slot: 'bg-image' },
    ctas: { slot: 'footer', size: 'm' },
    addon: true,
    secureLabel: true,
    borderColor: { attribute: 'border-color' },
    backgroundColor: { attribute: 'background-color' },
    size: [],
    mnemonics: { size: 'm' },
};

/**
 * Slot name to display label for Headless variant (label + value only, no card).
 * Only includes fields that are authorable in the merch-card editor to avoid confusion.
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const HEADLESS_FIELDS = [
    { slot: 'bg-image', label: 'Background Image' },
    { slot: 'badge', label: 'Badge' },
    { slot: 'icons', label: 'Mnemonic icon' },
    { slot: 'heading-xs', label: 'Title' },
    { slot: 'body-xxs', label: 'Subtitle' },
    { slot: 'body-xs', label: 'Product description' },
    { slot: 'promo-text', label: 'Promo Text' },
    { slot: 'callout-content', label: 'Callout text' },
    { slot: 'short-description', label: 'Short Description' },
    { slot: 'trial-badge', label: 'Trial Badge' },
    { slot: 'prices', label: 'Product price' },
    { slot: 'quantity-select', label: 'Quantity select' },
    { slot: 'addon', label: 'Addon' },
    { slot: 'whats-included', label: "What's included" },
    { slot: 'addon-confirmation', label: 'Addon confirmation' },
    { slot: 'footer', label: 'CTAs' },
];

export class Headless extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return html`
            <div class="headless">
                ${HEADLESS_FIELDS.map(
                    ({ slot, label }) => html`
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
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

    static variantStyle = css`
        :host([variant='headless']) {
            border: none;
            background: transparent;
            box-shadow: none;
        }
        :host([variant='headless']) .headless {
            display: flex;
            flex-direction: column;
            padding: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='headless']) .headless-row {
            display: flex;
            gap: var(--consonant-merch-spacing-xs, 8px);
            padding: var(--consonant-merch-spacing-xxs, 4px) 0;
        }
        :host([variant='headless']) .headless-label {
            flex-shrink: 0;
            font-weight: 600;
            min-width: 8em;
        }
        :host([variant='headless']) .headless-value {
            flex: 1;
        }
        :host([variant='headless']) .headless-value::slotted(*) {
            display: inline;
        }
    `;
}
