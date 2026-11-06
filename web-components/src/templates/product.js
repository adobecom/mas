import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-product-width: 300px;
    }

    merch-card[variant='product'] {
        --consonant-merch-card-callout-icon-size: 18px;
        width: var(--consonant-merch-card-product-width);
    }

    merch-card[variant='product'][id] [slot='callout-content'] > div > div,
    merch-card[variant='product'][id] [slot='callout-content'] > p {
        position: relative;
        padding: 2px 10px 3px;
        background: #d9d9d9;
        color: var(--text-color);
    }

    merch-card[variant='product']
        [slot='callout-content']
        > p:has(> .icon-button) {
        padding-inline-end: 36px;
    }

    merch-card[variant='product'] a.spectrum-Link--secondary {
        color: inherit;
    }

    merch-card[variant='product'] a.secondary-link {
        color: #000;
        text-decoration: underline;
    }

    merch-card[variant='product'][id] span[data-template='legal'] {
        display: flex;
        flex-direction: column;
        margin-top: 8px;
        color: var(----merch-color-grey-80);
        font-size: 14px;
        font-style: italic;
        font-weight: 400;
        line-height: 21px;
    }

    merch-card[variant='product'][id]
        .price.price-legal
        .price-unit-type:not(.disabled)::before,
    merch-card[variant='product'][id]
        .price.price-legal
        .disabled
        + span:not(.disabled)::before {
        content: initial;
    }

    merch-card[variant='product'] [slot='footer'] a.con-button.primary {
        border: 2px solid var(--text-color);
        color: var(--text-color);
    }

    merch-card[variant='product'] [slot='footer'] a.con-button.primary:hover {
        background-color: var(--color-black);
        border-color: var(--color-black);
        color: var(--color-white);
    }

    merch-card-collection.product merch-card {
        width: auto;
        height: 100%;
    }

    merch-card[variant='product'] merch-addon {
        padding-left: 4px;
        padding-top: 8px;
        padding-bottom: 8px;
        padding-right: 8px;
        border-radius: 0.5rem;
        background: var(--merch-addon-background);
        font-family: var(--merch-body-font-family, 'Adobe Clean');
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
    }

    merch-card[variant='product'] [slot='body-xs'] [is='inline-price'] {
        font-weight: inherit;
    }

    merch-card[variant='product'] merch-addon [is='inline-price'] {
        font-weight: bold;
        pointer-events: none;
    }

    merch-card[variant='product'] merch-addon::part(checkbox) {
        height: 18px;
        width: 18px;
        margin: 14px 12px 0 8px;
    }

    merch-card[variant='product'] merch-addon::part(label) {
        display: flex;
        flex-direction: column;
        padding: 8px 4px 8px 0;
        width: 100%;
    }

    /* Sections inside tabs/fragments that don't receive the .product class.
   Make .content wrapper transparent so the section grid applies directly to cards.
   Only when every card in the section is a product card - otherwise a mixed
   section (e.g. segment cards with one product card) would have its layout
   hijacked by this fallback despite already having an explicit variant class. */
    .one-merch-card:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        )
        .content,
    .two-merch-cards:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        )
        .content,
    .three-merch-cards:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        )
        .content,
    .four-merch-cards:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        )
        .content {
        display: contents;
    }

    .one-merch-card.section merch-card[variant='product'],
    .one-merch-card:has(merch-card[variant='product'])
        merch-card[variant='product'] {
        width: auto;
        max-width: var(--consonant-merch-card-product-width);
        margin: 0 auto;
    }

    /* grid style for product */
    .one-merch-card.product,
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product,
    .one-merch-card:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        ),
    .two-merch-cards:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        ),
    .three-merch-cards:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        ),
    .four-merch-cards:has(merch-card[variant='product']):not(
            :has(merch-card:not([variant='product']))
        ) {
        grid-template-columns: var(--consonant-merch-card-product-width);
    }

    /* Tablet */
    @media screen and (--tablet-up) {
        .two-merch-cards.product,
        .three-merch-cards.product,
        .four-merch-cards.product,
        .two-merch-cards:has(merch-card[variant='product']):not(
                :has(merch-card:not([variant='product']))
            ),
        .three-merch-cards:has(merch-card[variant='product']):not(
                :has(merch-card:not([variant='product']))
            ),
        .four-merch-cards:has(merch-card[variant='product']):not(
                :has(merch-card:not([variant='product']))
            ) {
            grid-template-columns: repeat(
                2,
                var(--consonant-merch-card-product-width)
            );
        }
    }

    /* desktop */
    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-product-width: 378px;
        }

        .three-merch-cards.product,
        .three-merch-cards:has(merch-card[variant='product']):not(
                :has(merch-card:not([variant='product']))
            ) {
            grid-template-columns: repeat(
                3,
                var(--consonant-merch-card-product-width)
            );
        }

        .four-merch-cards.product,
        .four-merch-cards:has(merch-card[variant='product']):not(
                :has(merch-card:not([variant='product']))
            ) {
            grid-template-columns: repeat(
                auto-fit,
                var(--consonant-merch-card-product-width)
            );
        }
    }

    merch-card[variant='product'] {
        merch-whats-included merch-mnemonic-list,
        merch-whats-included [slot='heading'] {
            width: 100%;
        }
    }

    merch-card[variant='product'] .merch-short-description {
        display: inline-block;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-style: italic;
        font-weight: 400;
        line-height: 21px;
    }

    merch-card[variant='product'] .merch-short-description .icon-button {
        position: relative;
        display: inline-flex;
        text-decoration: none;
        border-bottom: none;
        width: 18px;
        height: 18px;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
        background-size: 18px;
        background-repeat: no-repeat;
        background-position: center;
    }

    merch-card[variant='product']
        .merch-short-description
        .icon-button::before {
        content: attr(data-tooltip);
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: 100%;
        margin-left: 8px;
        max-width: 140px;
        width: max-content;
        padding: 10px;
        border-radius: 5px;
        background: #0469e3;
        color: #fff;
        text-align: left;
        display: none;
        z-index: 10;
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px;
    }

    merch-card[variant='product'] .merch-short-description .icon-button::after {
        content: '';
        position: absolute;
        left: 102%;
        margin-left: -8px;
        top: 50%;
        transform: translateY(-50%);
        border: 8px solid transparent;
        border-right-color: #0469e3;
        display: none;
        z-index: 10;
    }

    merch-card[variant='product']
        .merch-short-description
        .icon-button.tooltip-visible::before,
    merch-card[variant='product']
        .merch-short-description
        .icon-button.tooltip-visible::after {
        display: block;
    }

    @media screen and (--tablet-down) {
        merch-card[variant='product'] .merch-short-description {
            display: inline-block;
        }

        merch-card[variant='product'] .merch-short-description .icon-button {
            vertical-align: middle;
        }

        merch-card[variant='product']
            .merch-short-description
            .icon-button::before {
            top: unset;
            left: calc(50% - 120px);
            transform: none;
            margin-left: 0;
            bottom: 100%;
            margin-bottom: 8px;
        }

        merch-card[variant='product']
            .merch-short-description
            .icon-button::after {
            top: unset;
            left: 50%;
            margin-left: -8px;
            transform: none;
            bottom: calc(100% - 8px);
            border-color: #0469e3 transparent transparent transparent;
            border-right-color: transparent;
        }
    }
`;

export const PRODUCT_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    description: { tag: 'div', slot: 'body-xs' },
    shortDescription: { tag: 'div', slot: 'short-description' },
    mnemonics: { size: 'l' },
    callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    secureLabel: true,
    planType: true,
    addon: true,
    addonBackground: true,
    badgeIcon: true,
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'color-yellow-300-variation',
    },
    allowedBadgeColors: [
        'color-yellow-300-variation',
        'color-gray-300-variation',
        'color-gray-700-variation',
        'color-green-900-variation',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'color-yellow-300-variation',
        'color-gray-300-variation',
        'color-green-900-variation',
        'gradient-purple-blue',
    ],
    borderColor: { attribute: 'border-color' },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
};

export function define({
    EVENT_MAS_READY,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    Media,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
    createTag,
}) {
    class Product extends TemplateLayout {
        #resizeFrame;

        constructor(card) {
            super(card);
            this.postCardUpdateHook = this.postCardUpdateHook.bind(this);
            this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
        }

        getGlobalCSS() {
            return CSS;
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

        adjustProductBodySlots() {
            if (this.card.getBoundingClientRect().width === 0) return;

            const slots = [
                'heading-xs',
                'body-xxs',
                'body-xs',
                'promo-text',
                'callout-content',
                'addon',
                'body-lower',
            ];

            slots.forEach((slot) =>
                this.updateCardElementMinHeight(
                    this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
                    slot,
                ),
            );
        }

        renderLayout() {
            return ` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                ${!this.promoBottom ? `<slot name="promo-text"></slot>` : ''}
                <slot name="body-xs"></slot>
                <slot name="short-description"></slot>
                <slot name="addon"></slot>
                ${this.promoBottom ? `<slot name="promo-text"></slot>` : ''}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`;
        }

        connectedCallbackHook() {
            this.handleResize = () => {
                if (this.#resizeFrame) cancelAnimationFrame(this.#resizeFrame);
                this.#resizeFrame = requestAnimationFrame(() => {
                    this.#resizeFrame = null;
                    this.postCardUpdateHook();
                });
            };
            this.adjustShortDescriptionBound =
                this.adjustShortDescription.bind(this);
            window.addEventListener('resize', this.handleResize);
            this.card.addEventListener(
                EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
                this.updatePriceQuantity,
            );
            this.card.addEventListener(
                EVENT_MAS_READY,
                this.adjustShortDescriptionBound,
            );
        }

        disconnectedCallbackHook() {
            if (this.handleResize) {
                window.removeEventListener('resize', this.handleResize);
                this.handleResize = null;
            }
            if (this.#resizeFrame) {
                cancelAnimationFrame(this.#resizeFrame);
                this.#resizeFrame = null;
            }
            this.card.removeEventListener(
                EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
                this.updatePriceQuantity,
            );
            this.card.removeEventListener(
                EVENT_MAS_READY,
                this.adjustShortDescriptionBound,
            );
        }

        adjustShortDescription() {
            const shortDescEl = this.card.querySelector(
                '[slot="short-description"]',
            );
            if (!shortDescEl?.textContent?.trim()) return;
            const legalPrice = this.card.querySelector(
                'span[data-template="legal"]',
            );
            if (!legalPrice) return;
            this.card.querySelector('.merch-short-description')?.remove();
            const span = document.createElement('span');
            span.className = 'merch-short-description';
            span.innerHTML = shortDescEl.innerHTML;
            span.querySelectorAll('p').forEach((p) =>
                p.replaceWith(...p.childNodes),
            );
            span.querySelectorAll('.icon-button').forEach((btn) => {
                if (btn.dataset.eventsWired) return;
                btn.dataset.eventsWired = '1';
                ['mouseenter', 'focus'].forEach((evt) =>
                    btn.addEventListener(evt, () =>
                        btn.classList.add('tooltip-visible'),
                    ),
                );
                ['mouseleave', 'blur'].forEach((evt) =>
                    btn.addEventListener(evt, () =>
                        btn.classList.remove('tooltip-visible'),
                    ),
                );
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape')
                        btn.classList.remove('tooltip-visible');
                });
            });
            legalPrice.after(span);
            shortDescEl.hidden = true;
        }

        async postCardUpdateHook() {
            if (!this.card.isConnected) return;
            this.adjustAddon();
            if (!Media.isMobile) {
                this.adjustProductBodySlots();
            }
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
                // Optical cards state billing terms in the short description;
                // suppress the legal plan type to avoid duplicating it.
                if (headingPrice.dataset.template === 'optical') {
                    legal.dataset.displayPlanType = 'false';
                }
                headingPrice.closest('[slot="heading-xs"]').appendChild(legal);
                await legal.onceSettled();
            } catch {
                // Proceed with other adjustments
            }
        }

        get headingXSSlot() {
            return this.card.shadowRoot
                .querySelector('slot[name="heading-xs"]')
                .assignedElements()[0];
        }

        get mainPrice() {
            const slot = `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}`;
            return this.card.querySelector(
                `${slot}[data-template="price"], ${slot}[data-template="optical"]`,
            );
        }

        updatePriceQuantity({ detail }) {
            if (!this.mainPrice || !detail?.option) return;
            this.mainPrice.dataset.quantity = detail.option;
        }

        toggleAddon(merchAddon) {
            const mainPrice = this.mainPrice;
            const headingXSSlot = this.headingXSSlot;
            if (!mainPrice && headingXSSlot) {
                const planType = merchAddon?.getAttribute('plan-type');
                let visibleSpan = null;
                if (merchAddon && planType) {
                    const matchingP = merchAddon.querySelector(
                        `p[data-plan-type="${planType}"]`,
                    );
                    visibleSpan = matchingP?.querySelector(
                        'span[is="inline-price"]',
                    );
                }
                this.card
                    .querySelectorAll('p[slot="heading-xs"]')
                    .forEach((p) => p.remove());
                if (merchAddon.checked) {
                    if (visibleSpan) {
                        const replacementP = createTag(
                            'p',
                            {
                                class: 'addon-heading-xs-price-addon',
                                slot: 'heading-xs',
                            },
                            visibleSpan.innerHTML,
                        );
                        this.card.appendChild(replacementP);
                    }
                } else {
                    const freeP = createTag(
                        'p',
                        {
                            class: 'card-heading',
                            id: 'free',
                            slot: 'heading-xs',
                        },
                        'Free',
                    );
                    this.card.appendChild(freeP);
                }
            }
        }

        async adjustAddon() {
            await this.card.updateComplete;
            const addon = this.card.addon;
            if (!addon) return;
            const price = this.mainPrice;
            let planType = this.card.planType;
            if (price) {
                await price.onceSettled?.();
                planType = price.value?.[0]?.planType;
            }
            if (!planType) return;
            addon.planType = planType;
        }

        static templateStyle = css`
            :host([variant='product']) {
                background:
                    linear-gradient(white, white) padding-box,
                    var(--consonant-merch-card-border-color, #dadada) border-box;
                border: 1px solid transparent;
            }

            :host([variant='product']) > slot:not([name='icons']) {
                display: block;
            }
            :host([variant='product']) slot[name='body-xs'] {
                min-height: var(--consonant-merch-card-product-body-xs-height);
                display: block;
            }
            :host([variant='product']) slot[name='heading-xs'] {
                min-height: var(
                    --consonant-merch-card-product-heading-xs-height
                );
                display: block;
            }
            :host([variant='product']) slot[name='body-xxs'] {
                min-height: var(--consonant-merch-card-product-body-xxs-height);
                display: block;
            }
            :host([variant='product']) slot[name='promo-text'] {
                min-height: var(
                    --consonant-merch-card-product-promo-text-height
                );
                display: block;
            }
            :host([variant='product']) slot[name='callout-content'] {
                min-height: var(
                    --consonant-merch-card-product-callout-content-height
                );
                display: block;
            }
            :host([variant='product']) slot[name='short-description'] {
                display: block;
            }
            :host([variant='product']) slot[name='addon'] {
                min-height: var(--consonant-merch-card-product-addon-height);
            }

            :host([variant='product']:not([id])) hr {
                display: none;
            }

            :host([variant='product']) ::slotted(h3[slot='heading-xs']) {
                max-width: var(
                    --consonant-merch-card-heading-xs-max-width,
                    100%
                );
            }

            :host([variant='product']) .secure-transaction-label {
                color: rgb(80, 80, 80);
                line-height: var(--consonant-merch-card-detail-xs-line-height);
            }
        `;
    }
    return {
        product: {
            class: Product,
            fragmentMapping: PRODUCT_AEM_FRAGMENT_MAPPING,
            style: Product.templateStyle,
        },
    };
}
