import { VariantLayout } from './variant-layout.js';
import { escapeHTML } from '../utils.js';
import { CSS } from './headless.css.js';
import { css } from '../css.js';

export const HEADLESS_FAMILY_STYLE = css`
    /* Shared shadow styles for the headless family (headless, marquee, faq,
       banner-blade): label + value rows, no card chrome. To add a variant to the
       family, add it to every selector list here and in headless.css.js. */
    :host([variant='headless']),
    :host([variant='marquee']),
    :host([variant='faq']),
    :host([variant='banner-blade']) {
        border: none;
        background: transparent;
        box-shadow: none;
    }
    :host([variant='headless']) .headless,
    :host([variant='marquee']) .headless,
    :host([variant='faq']) .headless,
    :host([variant='banner-blade']) .headless {
        display: flex;
        flex-direction: column;
        padding: var(--consonant-merch-spacing-xs, 8px);
    }
    :host([variant='headless']) .headless-row,
    :host([variant='marquee']) .headless-row,
    :host([variant='faq']) .headless-row,
    :host([variant='banner-blade']) .headless-row {
        display: flex;
        gap: var(--consonant-merch-spacing-xs, 8px);
        padding: var(--consonant-merch-spacing-xxs, 4px) 0;
    }
    :host([variant='headless']) .headless-label,
    :host([variant='marquee']) .headless-label,
    :host([variant='faq']) .headless-label,
    :host([variant='banner-blade']) .headless-label {
        flex-shrink: 0;
        font-weight: 600;
        min-width: 8em;
    }
    :host([variant='headless']) .headless-value,
    :host([variant='marquee']) .headless-value,
    :host([variant='faq']) .headless-value,
    :host([variant='banner-blade']) .headless-value {
        flex: 1;
    }
    :host([variant='headless']) .headless-value::slotted(*),
    :host([variant='marquee']) .headless-value::slotted(*),
    :host([variant='faq']) .headless-value::slotted(*),
    :host([variant='banner-blade']) .headless-value::slotted(*) {
        display: inline;
    }
    :host([variant='headless'])
        .headless-value[data-slot='footer']::slotted(div),
    :host([variant='marquee'])
        .headless-value[data-slot='footer']::slotted(div),
    :host([variant='faq']) .headless-value[data-slot='footer']::slotted(div),
    :host([variant='banner-blade'])
        .headless-value[data-slot='footer']::slotted(div) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--consonant-merch-spacing-xs, 8px);
    }
    :host([variant='headless']) .headless-section,
    :host([variant='marquee']) .headless-section,
    :host([variant='faq']) .headless-section,
    :host([variant='banner-blade']) .headless-section {
        font-size: 0.75em;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--spectrum-gray-600);
        padding-top: 4px;
    }
    :host([variant='headless']) .headless-backgrounds-toggle,
    :host([variant='marquee']) .headless-backgrounds-toggle,
    :host([variant='faq']) .headless-backgrounds-toggle,
    :host([variant='banner-blade']) .headless-backgrounds-toggle {
        margin-left: var(--consonant-merch-spacing-xs, 8px);
        font-size: 0.75em;
        color: var(--spectrum-blue-700);
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        text-decoration: underline;
    }
    :host([variant='headless']) .headless-backgrounds-detail,
    :host([variant='marquee']) .headless-backgrounds-detail,
    :host([variant='faq']) .headless-backgrounds-detail,
    :host([variant='banner-blade']) .headless-backgrounds-detail {
        flex-direction: column;
        padding-left: var(--consonant-merch-spacing-l, 24px);
    }
    :host([variant='headless']) .headless-backgrounds-detail.hidden,
    :host([variant='marquee']) .headless-backgrounds-detail.hidden,
    :host([variant='faq']) .headless-backgrounds-detail.hidden,
    :host([variant='banner-blade']) .headless-backgrounds-detail.hidden {
        display: none;
    }
    :host([variant='headless']) .headless-backgrounds-detail-row,
    :host([variant='marquee']) .headless-backgrounds-detail-row,
    :host([variant='faq']) .headless-backgrounds-detail-row,
    :host([variant='banner-blade']) .headless-backgrounds-detail-row {
        display: flex;
        gap: var(--consonant-merch-spacing-xs, 8px);
        padding: var(--consonant-merch-spacing-xxs, 4px) 0;
    }
    :host([variant='headless'])
        .headless-backgrounds-detail-row
        .headless-value
        img,
    :host([variant='marquee'])
        .headless-backgrounds-detail-row
        .headless-value
        img,
    :host([variant='faq']) .headless-backgrounds-detail-row .headless-value img,
    :host([variant='banner-blade'])
        .headless-backgrounds-detail-row
        .headless-value
        img {
        width: 100%;
        max-height: var(--consonant-merch-card-bg-img-height);
        object-fit: contain;
    }
`;

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
    customFields: { tag: 'div', slot: 'custom-fields' },
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
        const customFieldEls = [
            ...this.card.querySelectorAll('[slot^="custom-field-"]'),
        ];
        return `
            <div class="headless">
                ${HEADLESS_FIELDS.map(
                    ({ slot, label }) => `
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value" data-slot="${slot}">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
                    `,
                ).join('')}
                ${
                    customFieldEls.length
                        ? `
                          <div class="headless-row">
                              <span class="headless-label headless-section">
                                  Custom fields
                              </span>
                          </div>
                          ${customFieldEls
                              .map(
                                  (el, i) => `
                                  <div class="headless-row">
                                      <span class="headless-label">
                                          ${escapeHTML(
                                              el.dataset.label ||
                                                  `Custom field ${i + 1}`,
                                          )}
                                      </span>
                                      <span class="headless-value">
                                          <slot
                                              name="${escapeHTML(el.getAttribute('slot'))}"
                                          ></slot>
                                      </span>
                                  </div>
                              `,
                              )
                              .join('')}
                      `
                        : ''
                }
                ${
                    this.card.secureLabel
                        ? `
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `
                        : ''
                }
            </div>
        `;
    }

    static variantStyle = HEADLESS_FAMILY_STYLE;
}
