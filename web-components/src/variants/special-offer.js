import { html, css } from 'lit';
import { VariantLayout } from './variant-layout';
import { CSS } from './special-offer.css.js';

export const SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    backgroundImage: { tag: 'div', slot: 'bg-image' },
    subtitle: { tag: 'p', slot: 'detail-m' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-xs-price' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'l' },
};

export class SpecialOffer extends VariantLayout {
    constructor(card) {
        super(card);
    }

    get headingSelector() {
        return '[slot="detail-m"]';
    }

    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return html`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="body-xs"></slot>
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
                  `}
            <slot></slot>`;
    }

    static variantStyle = css`
        :host([variant='special-offers']) {
            min-height: 439px;
        }

        :host([variant='special-offers']) {
            width: var(--consonant-merch-card-special-offers-width);
        }

        :host([variant='special-offers'].center) {
            text-align: center;
        }
    `;
}
