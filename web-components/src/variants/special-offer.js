import { html, css } from 'lit';
import { VariantLayout } from './variant-layout';
import { CSS } from './special-offer.css.js';
import { SELECTOR_MAS_INLINE_PRICE } from '../constants.js';

export const SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    backgroundImage: { tag: 'div', slot: 'bg-image' },
    subtitle: { tag: 'p', slot: 'detail-m' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-xs-price' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'l' },
    planType: true,
    badgeIcon: true,
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-yellow-300-special-offers',
    },
    allowedBadgeColors: [
        'spectrum-yellow-300-special-offers',
        'spectrum-gray-300-special-offers',
        'spectrum-green-900-special-offers',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-special-offers',
        'spectrum-gray-300-special-offers',
        'spectrum-green-900-special-offers',
    ],
    borderColor: { attribute: 'border-color' },
};

export class SpecialOffer extends VariantLayout {
    legal = undefined;

    constructor(card) {
        super(card);
    }

    get headingSelector() {
        return '[slot="detail-m"]';
    }

    getGlobalCSS() {
        return CSS;
    }

    priceOptionsProvider(element, options) {
        options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
    }

    async postCardUpdateHook() {
        await super.postCardUpdateHook();
        this.adjustLegal();
    }

    adjustLegal() {
        if (this.legal !== undefined) return;
        const price = this.card.querySelector(
            `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
        );
        if (!price) return;
        const legal = price.cloneNode(true);
        this.legal = legal;
        price.dataset.displayPlanType = 'false';
        legal.dataset.template = 'legal';
        legal.setAttribute('slot', 'legal');
        this.card.appendChild(legal);
    }

    renderLayout() {
        return html`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="legal"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
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
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #eaeaea) border-box;
            border: 1px solid transparent;
        }

        :host([variant='special-offers']) {
            width: var(--consonant-merch-card-special-offers-width);
        }

        :host([variant='special-offers'].center) {
            text-align: center;
        }

        :host(
            [variant='special-offers'][border-color='spectrum-yellow-300-special-offers']
        ) {
            border-color: var(--spectrum-yellow-300-special-offers);
        }

        :host(
            [variant='special-offers'][border-color='spectrum-gray-300-special-offers']
        ) {
            border-color: var(--spectrum-gray-300-special-offers);
        }

        :host(
            [variant='special-offers'][border-color='spectrum-green-900-special-offers']
        ) {
            border-color: var(--spectrum-green-900-special-offers);
        }
    `;
}
