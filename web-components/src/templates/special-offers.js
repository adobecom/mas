import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-special-offers-width: 302px;
        --merch-card-collection-card-width: var(
            --consonant-merch-card-special-offers-width
        );
    }

    merch-card[variant='special-offers']
        span[is='inline-price'][data-template='promo-strikethrough'],
    merch-card[variant='special-offers']
        span[is='inline-price'][data-template='strikethrough'] {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        font-weight: 400;
    }

    merch-card[variant='special-offers']
        span[is='inline-price'][data-template='price'] {
        font-weight: 700;
    }

    merch-card[variant='special-offers'] [slot='legal'],
    merch-card[variant='special-offers']
        span[is='inline-price'][data-template='legal'] {
        display: block;
        font-size: var(--consonant-merch-card-body-xs-font-size);
        font-weight: 400;
        margin-bottom: calc(-1 * var(--consonant-merch-spacing-xxs));
    }

    merch-card[variant='special-offers']
        span[is='inline-price'][data-template='legal']
        .price-tax-inclusivity {
        display: none;
    }

    merch-card[variant='special-offers'] .price-plan-type {
        font-style: italic;
    }

    /* grid style for special-offers */
    .one-merch-card.special-offers,
    .two-merch-cards.special-offers,
    .three-merch-cards.special-offers,
    .four-merch-cards.special-offers,
    .one-merch-card:has(merch-card[variant='special-offers']),
    .two-merch-cards:has(merch-card[variant='special-offers']),
    .three-merch-cards:has(merch-card[variant='special-offers']),
    .four-merch-cards:has(merch-card[variant='special-offers']) {
        grid-template-columns: minmax(
            302px,
            var(--consonant-merch-card-special-offers-width)
        );
    }

    /* Sections inside tabs/fragments that don't receive the .special-offers class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
    .one-merch-card:has(merch-card[variant='special-offers']) .content,
    .two-merch-cards:has(merch-card[variant='special-offers']) .content,
    .three-merch-cards:has(merch-card[variant='special-offers']) .content,
    .four-merch-cards:has(merch-card[variant='special-offers']) .content {
        display: contents;
    }

    @media screen and (--mobile-landscape) {
        :root {
            --consonant-merch-card-special-offers-width: 302px;
        }
    }

    @media screen and (--tablet-up) {
        :root {
            --consonant-merch-card-special-offers-width: 302px;
        }

        .two-merch-cards.special-offers,
        .three-merch-cards.special-offers,
        .four-merch-cards.special-offers,
        .two-merch-cards:has(merch-card[variant='special-offers']),
        .three-merch-cards:has(merch-card[variant='special-offers']),
        .four-merch-cards:has(merch-card[variant='special-offers']) {
            grid-template-columns: repeat(
                2,
                minmax(302px, var(--consonant-merch-card-special-offers-width))
            );
        }
    }

    /* desktop */
    @media screen and (--desktop-up) {
        .three-merch-cards.special-offers,
        .four-merch-cards.special-offers,
        .three-merch-cards:has(merch-card[variant='special-offers']),
        .four-merch-cards:has(merch-card[variant='special-offers']) {
            grid-template-columns: repeat(
                3,
                minmax(302px, var(--consonant-merch-card-special-offers-width))
            );
        }
    }

    @media screen and (--large-desktop) {
        .four-merch-cards.special-offers,
        .four-merch-cards:has(merch-card[variant='special-offers']) {
            grid-template-columns: repeat(
                4,
                minmax(302px, var(--consonant-merch-card-special-offers-width))
            );
        }
    }
`;

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

export function define({
    SELECTOR_MAS_INLINE_PRICE,
    TemplateLayout,
    escapeHTML,
}) {
    class SpecialOffer extends TemplateLayout {
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
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;
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
            legal.dataset.displayPerUnit = 'false';
            legal.setAttribute('slot', 'legal');
            this.card.appendChild(legal);
        }

        renderLayout() {
            return `${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="legal"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${
                this.evergreen
                    ? `
                      <div
                          class="detail-bg-container"
                          style="background: ${escapeHTML(this.card['detailBg'])}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `
                    : `
                      <hr />
                      ${this.secureLabelFooter}
                  `
            }
            <slot></slot>`;
        }

        static templateStyle = css`
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
    return {
        'special-offers': {
            class: SpecialOffer,
            fragmentMapping: SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING,
            style: SpecialOffer.templateStyle,
        },
    };
}
