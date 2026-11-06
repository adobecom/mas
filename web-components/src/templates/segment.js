import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-segment-width: 378px;
    }

    merch-card[variant='segment'] {
        max-width: var(--consonant-merch-card-segment-width);
    }

    /* grid style for segment */
    .one-merch-card.segment,
    .two-merch-cards.segment,
    .three-merch-cards.segment,
    .four-merch-cards.segment,
    .one-merch-card:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        ),
    .two-merch-cards:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        ),
    .three-merch-cards:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        ),
    .four-merch-cards:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        ) {
        grid-template-columns: minmax(
            276px,
            var(--consonant-merch-card-segment-width)
        );
    }

    /* Sections inside tabs/fragments that don't receive the .segment class.
   Make .content wrapper transparent so the section grid applies directly to cards.
   Only when every card in the section is a segment card - otherwise a mixed
   section (e.g. segment cards with one product card) would have its layout
   hijacked by this fallback despite already having an explicit variant class. */
    .one-merch-card:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        )
        .content,
    .two-merch-cards:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        )
        .content,
    .three-merch-cards:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        )
        .content,
    .four-merch-cards:has(merch-card[variant='segment']):not(
            :has(merch-card:not([variant='segment']))
        )
        .content {
        display: contents;
    }

    .one-merch-card.section merch-card[variant='segment'],
    .one-merch-card:has(merch-card[variant='segment'])
        merch-card[variant='segment'] {
        margin: 0 auto;
    }

    .three-merch-cards.section merch-card[variant='segment'],
    .four-merch-cards.section merch-card[variant='segment'],
    .three-merch-cards:has(merch-card[variant='segment'])
        merch-card[variant='segment'],
    .four-merch-cards:has(merch-card[variant='segment'])
        merch-card[variant='segment'] {
        max-width: 302px;
    }

    /* A non-segment card (e.g. variant="product") mixed into an explicitly
   segment-classed section should still size like its segment siblings
   instead of using its own variant's fixed width. */
    .one-merch-card.segment merch-card:not([variant='segment']),
    .two-merch-cards.segment merch-card:not([variant='segment']),
    .three-merch-cards.segment merch-card:not([variant='segment']),
    .four-merch-cards.segment merch-card:not([variant='segment']) {
        width: auto;
        max-width: var(--consonant-merch-card-segment-width);
    }

    /* Mobile */
    @media screen and (--mobile-landscape) {
        :root {
            --consonant-merch-card-segment-width: 276px;
        }
    }

    @media screen and (--tablet-up) {
        :root {
            --consonant-merch-card-segment-width: 276px;
        }

        .two-merch-cards.segment,
        .three-merch-cards.segment,
        .four-merch-cards.segment,
        .two-merch-cards:has(merch-card[variant='segment']):not(
                :has(merch-card:not([variant='segment']))
            ),
        .three-merch-cards:has(merch-card[variant='segment']):not(
                :has(merch-card:not([variant='segment']))
            ),
        .four-merch-cards:has(merch-card[variant='segment']):not(
                :has(merch-card:not([variant='segment']))
            ) {
            grid-template-columns: repeat(
                2,
                minmax(302px, var(--consonant-merch-card-segment-width))
            );
        }
    }

    /* desktop */
    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-segment-width: 276px;
        }

        .three-merch-cards.segment,
        .three-merch-cards:has(merch-card[variant='segment']):not(
                :has(merch-card:not([variant='segment']))
            ) {
            grid-template-columns: repeat(
                3,
                minmax(276px, var(--consonant-merch-card-segment-width))
            );
        }

        .four-merch-cards.segment,
        .four-merch-cards:has(merch-card[variant='segment']):not(
                :has(merch-card:not([variant='segment']))
            ) {
            grid-template-columns: repeat(
                4,
                minmax(276px, var(--consonant-merch-card-segment-width))
            );
        }
    }

    merch-card[variant='segment'] [slot='callout-content'] > div > div,
    merch-card[variant='segment'] [slot='callout-content'] > p {
        position: relative;
        padding: 2px 10px 3px;
        background: #d9d9d9;
        color: var(--text-color);
    }

    merch-card[variant='segment']
        [slot='callout-content']
        > p:has(> .icon-button) {
        padding-inline-end: 36px;
    }

    merch-card[variant='segment'] a.spectrum-Link--secondary {
        color: inherit;
    }

    merch-card[variant='segment'][id] span[data-template='legal'] {
        display: block;
        color: var(----merch-color-grey-80);
        font-size: 14px;
        font-style: italic;
        font-weight: 400;
        line-height: 21px;
    }

    merch-card[variant='segment'][id]
        .price.price-legal
        .price-unit-type:not(.disabled)::before,
    merch-card[variant='segment'][id]
        .price.price-legal
        .disabled
        + span:not(.disabled)::before {
        content: initial;
    }

    merch-card[variant='segment'] [slot='footer'] a.con-button.primary {
        border: 2px solid var(--text-color);
        color: var(--text-color);
    }

    merch-card[variant='segment'] [slot='footer'] a.con-button.primary:hover {
        background-color: var(--color-black);
        border-color: var(--color-black);
        color: var(--color-white);
    }

    merch-card-collection.segment merch-card {
        width: auto;
        height: 100%;
    }
`;

export const SEGMENT_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    description: { tag: 'div', slot: 'body-xs' },
    callout: { tag: 'div', slot: 'callout-content' },
    planType: true,
    secureLabel: true,
    badgeIcon: true,
    badge: { tag: 'div', slot: 'badge', default: 'color-red-700-variation' },
    allowedBadgeColors: [
        'color-yellow-300-variation',
        'color-gray-300-variation',
        'color-gray-700-variation',
        'color-green-900-variation',
        'color-red-700-variation',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'color-yellow-300-variation',
        'color-gray-300-variation',
        'color-green-900-variation',
        'color-red-700-variation',
        'gradient-purple-blue',
    ],
    borderColor: { attribute: 'border-color' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
};

export function define({
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
}) {
    class Segment extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        priceOptionsProvider(element, options) {
            if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;

            if (
                element.dataset.template === 'strikethrough' ||
                element.dataset.template === 'price'
            ) {
                options.displayPerUnit = false;
            }
        }

        getGlobalCSS() {
            return CSS;
        }

        get badgeElement() {
            return this.card.querySelector('[slot="badge"]');
        }

        get mainPrice() {
            return this.card.querySelector(
                `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
        }

        async postCardUpdateHook() {
            if (!this.legalAdjusted) {
                await this.adjustLegal();
            }
            await super.postCardUpdateHook();
        }

        async adjustLegal() {
            if (this.legalAdjusted || !this.card.id) return;

            try {
                this.legalAdjusted = true;
                await this.card.updateComplete;
                await customElements.whenDefined('inline-price');

                const headingPrice = this.mainPrice;
                if (!headingPrice) return;

                const legal = headingPrice.cloneNode(true);
                await headingPrice.onceSettled();

                if (!headingPrice?.options) return;

                if (headingPrice.options.displayTax)
                    headingPrice.dataset.displayTax = 'false';
                if (headingPrice.options.displayPlanType)
                    headingPrice.dataset.displayPlanType = 'false';

                legal.setAttribute('data-template', 'legal');
                legal.dataset.displayPerUnit = 'false';
                headingPrice.parentNode.insertBefore(
                    legal,
                    headingPrice.nextSibling,
                );
                await legal.onceSettled();
            } catch {
                // Proceed with other adjustments
            }
        }

        renderLayout() {
            return `
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${
                    !this.promoBottom
                        ? `<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`
                        : ''
                }
                <slot name="body-xs"></slot>
                ${
                    this.promoBottom
                        ? `<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`
                        : ''
                }
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `;
        }

        static templateStyle = css`
            :host([variant='segment']) {
                min-height: 214px;
                background:
                    linear-gradient(white, white) padding-box,
                    var(--consonant-merch-card-border-color, #dadada) border-box;
                border: 1px solid transparent;
            }
            :host([variant='segment']) ::slotted(h3[slot='heading-xs']) {
                max-width: var(
                    --consonant-merch-card-heading-xs-max-width,
                    100%
                );
            }
        `;
    }
    return {
        segment: {
            class: Segment,
            fragmentMapping: SEGMENT_AEM_FRAGMENT_MAPPING,
            style: Segment.templateStyle,
        },
    };
}
