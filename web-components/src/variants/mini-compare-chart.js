import { html, css, unsafeCSS } from 'lit';
import { createTag } from '../utils.js';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './mini-compare-chart.css.js';
import Media, { DESKTOP_UP, TABLET_DOWN } from '../media.js';
import {
    SELECTOR_MAS_INLINE_PRICE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';

const FOOTER_ROW_MIN_HEIGHT = 32; // as per the XD.


export const MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-m-price' },
    shortDescription: { tag: 'div', slot: 'body-m' },
    description: { tag: 'div', slot: 'body-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    mnemonics: { size: 'l' },
    // callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    addon: true,
    secureLabel: true,
    planType: true,
    badgeIcon: true,
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
    badgeColor: { attribute: 'badge-color' },
    badgeBackgroundColor: { attribute: 'badge-background-color' },
    badgeText: { attribute: 'badge-text' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    borderColor: { attribute: 'border-color' },
    size: ['wide', 'super-wide'],
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
};

export class MiniCompareChart extends VariantLayout {
    constructor(card) {
        super(card);
        this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
    }

    connectedCallbackHook() {
        this.card.addEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
    }

    disconnectedCallbackHook() {
        this.card.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
    }

    updatePriceQuantity({ detail }) {
        if (!this.mainPrice || !detail?.option) return;
        this.mainPrice.dataset.quantity = detail.option;
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;
            return;
        }
        // For main price display (strikethrough and regular price)
        // Disable perUnit display - it will be shown in legal price only
        if (
            element.dataset.template === 'strikethrough' ||
            element.dataset.template === 'price'
        ) {
            options.displayPerUnit = false;
        }
    }

    getRowMinHeightPropertyName = (index) =>
        `--consonant-merch-card-footer-row-${index}-min-height`;

    getGlobalCSS() {
        return CSS;
    }

    getMiniCompareFooter = () => {
        return html`<footer>
            <slot name="secure-transaction-label">${this.secureLabel}</slot>
            <slot name="footer"></slot>
        </footer>`;
    };

    adjustMiniCompareBodySlots() {
        if (this.card.getBoundingClientRect().width <= 2) return;

        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('.top-section'),
            'top-section',
        );

        let slots = [
            'heading-xs',
            'heading-m',
            'body-m',
            'heading-m-price',
            'body-xxs',
            'price-commitment',
            'offers',
            'body-xs',
            // 'callout-content',
        ];
        if (this.card.classList.contains('bullet-list')) {
            slots.push('footer-rows');
        }

        slots.forEach((slot) =>
            this.updateCardElementMinHeight(
                this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
                slot,
            ),
        );
        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('footer'),
            'footer',
        );

        const badge = this.card.shadowRoot.querySelector(
            '.mini-compare-chart-badge',
        );
        if (badge?.textContent !== '') {
            this.getContainer().style.setProperty(
                '--consonant-merch-card-mini-compare-chart-top-section-mobile-height',
                '32px',
            );
        }
    }

    adjustMiniCompareFooterRows() {
        if (this.card.getBoundingClientRect().width === 0) return;
        const footerRows = this.card.querySelector('[slot="footer-rows"] ul');

        if (!footerRows || !footerRows.children) return;

        [...footerRows.children].forEach((el, index) => {
            const height = Math.max(
                FOOTER_ROW_MIN_HEIGHT,
                parseFloat(window.getComputedStyle(el).height) || 0,
            );
            const maxMinHeight =
                parseFloat(
                    this.getContainer().style.getPropertyValue(
                        this.getRowMinHeightPropertyName(index + 1),
                    ),
                ) || 0;
            if (height > maxMinHeight) {
                this.getContainer().style.setProperty(
                    this.getRowMinHeightPropertyName(index + 1),
                    `${height}px`,
                );
            }
        });
    }

    removeEmptyRows() {
        const footerRows = this.card.querySelectorAll('.footer-row-cell');
        footerRows.forEach((row) => {
            const rowDescription = row.querySelector(
                '.footer-row-cell-description',
            );
            if (rowDescription) {
                const isEmpty = !rowDescription.textContent.trim();
                if (isEmpty) {
                    row.remove();
                }
            }
        });
    }

    get badgeElement() {
        return this.card.querySelector('[slot="badge"]');
    }

    get badge() {
        const parentBadge = super.badge;
        if (parentBadge) return parentBadge;

        return html`
            <div
                class="mini-compare-chart-badge"
                style="${this.badgeElement ? '' : 'visibility: hidden'}"
            >
                <slot name="badge"></slot>
            </div>
        `;
    }

    get mainPrice() {
        return (
            this.card.querySelector(
                `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            ) ??
            this.card.querySelector(
                `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            )
        );
    }

    async adjustLegal() {
        if (this.legalAdjusted) return;

        try {
            this.legalAdjusted = true;
            await this.card.updateComplete;
            await customElements.whenDefined('inline-price');

            const headingPrice = this.mainPrice;
            if (!headingPrice) return;

            const legal = headingPrice.cloneNode(true);
            await headingPrice.onceSettled();

            if (!headingPrice?.options) return;

            if (headingPrice.options.displayPerUnit)
                headingPrice.dataset.displayPerUnit = 'false';
            if (headingPrice.options.displayTax)
                headingPrice.dataset.displayTax = 'false';
            if (headingPrice.options.displayPlanType)
                headingPrice.dataset.displayPlanType = 'false';

            legal.setAttribute('data-template', 'legal');
            headingPrice.parentNode.insertBefore(
                legal,
                headingPrice.nextSibling,
            );
            await legal.onceSettled();
        } catch {
            // Proceed with other adjustments
        }
    }

    get headingMPriceSlot() {
        return this.card.shadowRoot
            .querySelector('slot[name="heading-m-price"]')
            ?.assignedElements()[0];
    }

    toggleAddon(merchAddon) {
        const mainPrice = this.mainPrice;
        const headingMPriceSlot = this.headingMPriceSlot;
        if (!mainPrice && headingMPriceSlot) {
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
                .querySelectorAll('p[slot="heading-m-price"]')
                .forEach((p) => p.remove());
            if (merchAddon.checked) {
                if (visibleSpan) {
                    const replacementP = createTag(
                        'p',
                        {
                            class: 'addon-heading-m-price-addon',
                            slot: 'heading-m-price',
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
                        slot: 'heading-m-price',
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
            await price.onceSettled();
            planType = price.value?.[0]?.planType;
        }
        if (!planType) return;
        addon.planType = planType;
        const addonWithPlanType = this.card.querySelector(
            'merch-addon[plan-type]',
        );
        addonWithPlanType?.updateComplete.then(() => {
            this.updateCardElementMinHeight(
                this.card.shadowRoot.querySelector(`slot[name="addon"]`),
                'addon',
            );
        });
    }

    renderLayout() {
        return html` <div class="top-section${this.badge ? ' badge' : ''}">
                <slot name="icons"></slot> ${this.badge}
            </div>
				<slot name="heading-xs"></slot>
				<slot name="heading-m-price"></slot>
				<slot name="body-m"></slot>
				<slot name="body-xxs"></slot>
				<slot name="offers"></slot>
				${this.getMiniCompareFooter()}
				<slot name="promo-text"></slot>
				<slot name="footer-rows"><slot name="body-s"></slot></slot>
				<slot name="body-xs"></slot>
				<slot name="badge"></slot>
				<slot name="addon"></slot>

            `;
    }

    async postCardUpdateHook() {
        await Promise.all(this.card.prices.map((price) => price.onceSettled()));
        if (!this.legalAdjusted) {
            await this.adjustLegal();
        }
        await this.adjustAddon();
        if (Media.isMobile) {
            this.removeEmptyRows();
        } else {
            this.adjustMiniCompareBodySlots();
            this.adjustMiniCompareFooterRows();
        }
    }

    static variantStyle = css`
        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .mini-compare-chart-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-s);
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-top-section-height
            );
        }

        :host([variant='mini-compare-chart'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .secure-transaction-label {
            align-self: flex-start;
            flex: none;
            font-size: var(--consonant-merch-card-body-xxs-font-size);
            font-weight: 400;
            color: #505050;
        }

        @media screen and ${unsafeCSS(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS(DESKTOP_UP)} {
            :host([variant='mini-compare-chart']) footer {
                padding: var(--consonant-merch-spacing-xs)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s);
            }
        }

        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        :host([variant='mini-compare-chart']) slot[name='heading-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-xxs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='price-commitment'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='offers'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-offers-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-promo-text-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-callout-content-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-xs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-xs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='addon'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-addon-height
            );
        }
        :host([variant='mini-compare-chart']:not(.bullet-list))
            slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host([variant='mini-compare-chart'][border-color='spectrum-yellow-300-plans']) {
            border-color: #ffd947;
        }

        :host([variant='mini-compare-chart'][border-color='spectrum-gray-300-plans']) {
            border-color: #dadada;
        }

        :host([variant='mini-compare-chart'][border-color='spectrum-green-900-plans']) {
            border-color: #05834e;
        }

        :host([variant='mini-compare-chart'][border-color='spectrum-red-700-plans']) {
            border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart'][border-color='gradient-purple-blue']) {
            border-image: linear-gradient(135deg, #9256DC, #1473E6) 1;
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }
    `;
}
