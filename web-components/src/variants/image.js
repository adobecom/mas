import { VariantLayout } from './variant-layout.js';
import { html, css } from 'lit';
import { CSS } from './image.css.js';

export const IMAGE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-yellow-300-plans',
    },
    borderColor: { attribute: 'border-color' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-green-900-plans',
        'gradient-purple-blue-plans',
    ],
    ctas: { slot: 'footer', size: 'm' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    prices: { tag: 'h3', slot: 'heading-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    size: ['wide', 'super-wide'],
    title: { tag: 'h3', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'body-xxs' },
    backgroundImage: { tag: 'div', slot: 'bg-image' },
};

export class Image extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return html`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom
                    ? html`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`
                    : html`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen
                ? html`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card['detailBg']}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `
                : html`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`;
    }

    static variantStyle = css`
        :host([variant='image']) {
            min-height: 330px;
            width: var(--consonant-merch-card-image-width);
        }

        :host([variant='image']) ::slotted([slot='badge']) {
            position: absolute;
            top: 16px;
            right: 0px;
        }

        :host-context([dir='rtl'])
            :host([variant='image'])
            ::slotted([slot='badge']) {
            left: 0px;
            right: initial;
        }
    `;
}
