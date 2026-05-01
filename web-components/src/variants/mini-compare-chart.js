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
    subtitle: { tag: 'p', slot: 'subtitle' },
    prices: { tag: 'p', slot: 'heading-m-price' },
    promoText: { tag: 'div', slot: 'promo-text' },
    shortDescription: { tag: 'div', slot: 'body-xxs' },
    description: { tag: 'div', slot: 'body-m' },
    mnemonics: { size: 'l' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    callout: { tag: 'div', slot: 'callout-content' },
    addon: true,
    secureLabel: true,
    planType: true,
    badgeIcon: true,
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
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
    whatsIncluded: { tag: 'div', slot: 'footer-rows' },
    ctas: { slot: 'footer', size: 'l' },
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

        this.visibilityObserver = new IntersectionObserver(([entry]) => {
            if (entry.boundingClientRect.height === 0) return;
            if (!entry.isIntersecting) return;
            if (!Media.isMobile) {
                requestAnimationFrame(() => {
                    const container = this.getContainer();
                    if (!container) return;
                    const cards = container.querySelectorAll(
                        'merch-card[variant="mini-compare-chart"]',
                    );
                    cards.forEach((card) =>
                        card.variantLayout?.syncHeights?.(),
                    );
                });
            }
            this.visibilityObserver.disconnect();
        });
        this.visibilityObserver.observe(this.card);
    }

    disconnectedCallbackHook() {
        this.card.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        this.visibilityObserver?.disconnect();
        if (this.calloutListenersAdded) {
            document.removeEventListener('touchstart', this.handleCalloutTouch);
            document.removeEventListener('mouseover', this.handleCalloutMouse);
            const tooltipIcon = this.card.querySelector(
                '[slot="callout-content"] .icon-button',
            );
            tooltipIcon?.removeEventListener(
                'focusin',
                this.handleCalloutFocusin,
            );
            tooltipIcon?.removeEventListener(
                'focusout',
                this.handleCalloutFocusout,
            );
            tooltipIcon?.removeEventListener(
                'keydown',
                this.handleCalloutKeydown,
            );
            this.calloutListenersAdded = false;
        }
    }

    updatePriceQuantity({ detail }) {
        if (!this.mainPrice || !detail?.option) return;
        this.mainPrice.dataset.quantity = detail.option;
    }

    priceOptionsProvider(element, options) {
        if (!this.isNewVariant) return;
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
        const secureLabel = this.card.secureLabel
            ? html`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`
            : html`<slot name="secure-transaction-label"></slot>`;
        if (this.isNewVariant) {
            return html`<footer>
                ${secureLabel}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`;
        }
        return html`<footer>${secureLabel}<slot name="footer"></slot></footer>`;
    };

    adjustMiniCompareBodySlots() {
        if (this.card.getBoundingClientRect().width <= 2) return;

        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('.top-section'),
            'top-section',
        );

        const slots = [
            'heading-m',
            'subtitle',
            'body-m',
            'heading-m-price',
            'body-xxs',
            'price-commitment',
            'quantity-select',
            'offers',
            'promo-text',
            'callout-content',
            'addon',
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
        let rows;
        if (this.isNewVariant) {
            const whatsIncluded = this.card.querySelector(
                'merch-whats-included',
            );
            if (!whatsIncluded) return;
            rows = [
                ...whatsIncluded.querySelectorAll(
                    '[slot="content"] merch-mnemonic-list',
                ),
            ];
        } else {
            const footerRows = this.card.querySelector(
                '[slot="footer-rows"] ul',
            );
            if (!footerRows || !footerRows.children) return;
            rows = [...footerRows.children];
        }
        if (!rows.length) return;

        rows.forEach((el, index) => {
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
        if (this.isNewVariant) {
            const rows = this.card.querySelectorAll(
                'merch-whats-included merch-mnemonic-list',
            );
            rows.forEach((row) => {
                const description = row.querySelector('[slot="description"]');
                if (description) {
                    const isEmpty = !description.textContent.trim();
                    if (isEmpty) {
                        row.remove();
                    }
                }
            });
        } else {
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
    }

    padFooterRows() {
        const container = this.getContainer();
        if (!container) return;

        const allCards = container.querySelectorAll(
            'merch-card[variant="mini-compare-chart"]',
        );

        if (this.isNewVariant) {
            let maxRows = 0;
            allCards.forEach((card) => {
                const whatsIncluded = card.querySelector(
                    'merch-whats-included',
                );
                if (!whatsIncluded) return;
                const realRows = whatsIncluded.querySelectorAll(
                    '[slot="content"] merch-mnemonic-list:not([data-placeholder])',
                );
                maxRows = Math.max(maxRows, realRows.length);
            });

            if (maxRows === 0) return;

            const whatsIncluded = this.card.querySelector(
                'merch-whats-included',
            );
            if (!whatsIncluded) return;
            const contentSlot = whatsIncluded.querySelector('[slot="content"]');
            if (!contentSlot) return;

            contentSlot
                .querySelectorAll('merch-mnemonic-list[data-placeholder]')
                .forEach((el) => el.remove());

            const currentRows = contentSlot.querySelectorAll(
                'merch-mnemonic-list',
            ).length;
            const needed = maxRows - currentRows;

            for (let i = 0; i < needed; i++) {
                const empty = document.createElement('merch-mnemonic-list');
                empty.setAttribute('data-placeholder', '');
                const desc = document.createElement('div');
                desc.setAttribute('slot', 'description');
                empty.appendChild(desc);
                contentSlot.appendChild(empty);
            }
        } else {
            let maxRows = 0;
            allCards.forEach((card) => {
                const ul = card.querySelector('[slot="footer-rows"] ul');
                if (!ul) return;
                const realRows = ul.querySelectorAll(
                    'li.footer-row-cell:not([data-placeholder])',
                );
                maxRows = Math.max(maxRows, realRows.length);
            });

            if (maxRows === 0) return;

            const ul = this.card.querySelector('[slot="footer-rows"] ul');
            if (!ul) return;

            ul.querySelectorAll('li.footer-row-cell[data-placeholder]').forEach(
                (el) => el.remove(),
            );

            const currentRows =
                ul.querySelectorAll('li.footer-row-cell').length;
            const needed = maxRows - currentRows;

            for (let i = 0; i < needed; i++) {
                const empty = document.createElement('li');
                empty.className = 'footer-row-cell';
                empty.setAttribute('data-placeholder', '');
                ul.appendChild(empty);
            }
        }
    }

    get mainPrice() {
        const price = this.card.querySelector(
            `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
        );
        return price;
    }

    get headingMPriceSlot() {
        return this.card.shadowRoot
            .querySelector('slot[name="heading-m-price"]')
            ?.assignedElements()[0];
    }

    get isNewVariant() {
        return !!this.card.querySelector('merch-whats-included');
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

    showTooltip(tooltipIcon) {
        tooltipIcon.classList.remove('hide-tooltip');
        tooltipIcon.setAttribute('aria-expanded', 'true');
    }

    hideTooltip(tooltipIcon) {
        tooltipIcon.classList.add('hide-tooltip');
        tooltipIcon.setAttribute('aria-expanded', 'false');
    }

    adjustCallout() {
        const tooltipIcon = this.card.querySelector(
            '[slot="callout-content"] .icon-button',
        );
        if (!tooltipIcon) return;
        if (this.calloutListenersAdded) return;
        const tooltipText = tooltipIcon.title || tooltipIcon.dataset.tooltip;
        if (!tooltipText) return;
        if (tooltipIcon.title) {
            tooltipIcon.dataset.tooltip = tooltipIcon.title;
            tooltipIcon.removeAttribute('title');
        }

        const pElement = tooltipIcon.parentElement;
        if (pElement && pElement.tagName === 'P') {
            const outerDiv = document.createElement('div');
            const calloutRow = document.createElement('div');
            calloutRow.className = 'callout-row';
            const textWrapper = document.createElement('div');
            textWrapper.className = 'callout-text';
            while (pElement.firstChild && pElement.firstChild !== tooltipIcon) {
                textWrapper.appendChild(pElement.firstChild);
            }
            calloutRow.appendChild(textWrapper);
            calloutRow.appendChild(tooltipIcon);
            outerDiv.appendChild(calloutRow);
            pElement.replaceWith(outerDiv);
        }

        // Accessibility attributes
        tooltipIcon.setAttribute('role', 'button');
        tooltipIcon.setAttribute('tabindex', '0');
        tooltipIcon.setAttribute('aria-label', tooltipText);
        tooltipIcon.setAttribute('aria-expanded', 'false');

        this.hideTooltip(tooltipIcon);

        this.handleCalloutTouch = (event) => {
            if (event.target !== tooltipIcon) {
                this.hideTooltip(tooltipIcon);
            } else {
                const isHidden = tooltipIcon.classList.contains('hide-tooltip');
                if (isHidden) {
                    this.showTooltip(tooltipIcon);
                } else {
                    this.hideTooltip(tooltipIcon);
                }
            }
        };
        this.handleCalloutMouse = (event) => {
            if (event.target !== tooltipIcon) {
                this.hideTooltip(tooltipIcon);
            } else {
                this.showTooltip(tooltipIcon);
            }
        };
        this.handleCalloutFocusin = () => {
            this.showTooltip(tooltipIcon);
        };
        this.handleCalloutFocusout = () => {
            this.hideTooltip(tooltipIcon);
        };
        this.handleCalloutKeydown = (event) => {
            if (event.key === 'Escape') {
                this.hideTooltip(tooltipIcon);
                tooltipIcon.blur();
            }
        };
        document.addEventListener('touchstart', this.handleCalloutTouch);
        document.addEventListener('mouseover', this.handleCalloutMouse);
        tooltipIcon.addEventListener('focusin', this.handleCalloutFocusin);
        tooltipIcon.addEventListener('focusout', this.handleCalloutFocusout);
        tooltipIcon.addEventListener('keydown', this.handleCalloutKeydown);
        this.calloutListenersAdded = true;
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

    adjustShortDescription() {
        const bodyXxs = this.card.querySelector('[slot="body-xxs"]');
        const text = bodyXxs?.textContent?.trim();
        if (!text) return;
        const legalPrice = this.card.querySelector(
            '[slot="heading-m-price"] [data-template="legal"]',
        );
        const planType = legalPrice?.querySelector('.price-plan-type');
        if (!planType) return;
        const em = document.createElement('em');
        em.setAttribute('slot', 'body-xxs');
        em.textContent = ` ${text}`;
        planType.appendChild(em);
        bodyXxs.remove();
    }

    renderLayout() {
        if (!this.isNewVariant) {
            return html` <div class="top-section${this.badge ? ' badge' : ''}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains('bullet-list')
                    ? html`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`
                    : html`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`;
        }
        return html` <div class="top-section${this.badge ? ' badge' : ''}">
                <slot name="icons"></slot> ${this.badge}
                <slot name="badge"></slot>
            </div>
            <slot name="heading-m"></slot>
            <slot name="heading-xs"></slot>
            <slot name="body-m"></slot>
            <slot name="subtitle"></slot>
            <slot name="heading-m-price"></slot>
            <slot name="body-xxs"></slot>
            <slot name="price-commitment"></slot>
            <slot name="offers"></slot>
            <slot name="quantity-select"></slot>
            <slot name="promo-text"></slot>
            <slot name="callout-content"></slot>
            <slot name="addon"></slot>
            ${this.getMiniCompareFooter()}
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`;
    }

    syncHeights() {
        if (this.card.getBoundingClientRect().width <= 2) return;
        this.adjustMiniCompareBodySlots();
        this.adjustMiniCompareFooterRows();
    }

    async postCardUpdateHook() {
        await Promise.all(this.card.prices.map((price) => price.onceSettled()));
        if (this.isNewVariant) {
            if (!this.legalAdjusted) {
                await this.adjustLegal();
            }
            this.adjustShortDescription();
            this.adjustCallout();
        }
        await this.adjustAddon();
        if (Media.isMobile) {
            this.removeEmptyRows();
        } else {
            this.padFooterRows();

            const container = this.getContainer();
            if (!container) return;

            const hasExistingVars = container.style.getPropertyValue(
                '--consonant-merch-card-footer-row-1-min-height',
            );

            if (!hasExistingVars) {
                requestAnimationFrame(() => {
                    const cards = container.querySelectorAll(
                        'merch-card[variant="mini-compare-chart"]',
                    );
                    cards.forEach((card) =>
                        card.variantLayout?.syncHeights?.(),
                    );
                });
            } else {
                requestAnimationFrame(() => {
                    this.syncHeights();
                });
            }
        }
    }

    static variantStyle = css`
        :host([variant='mini-compare-chart']) {
            max-width: var(
                --consonant-merch-card-mini-compare-chart-wide-width,
                484px
            );
        }

        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart']) .mini-compare-chart-badge {
            font-size: 14px;
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

        :host([variant='mini-compare-chart']) footer:has(.action-area) {
            align-items: start;
            flex-flow: column nowrap;
        }

        :host([variant='mini-compare-chart'])
            footer:has(.action-area)
            .secure-transaction-label {
            align-self: flex-end;
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart']) .action-area {
            display: flex;
            justify-content: end;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
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
        :host([variant='mini-compare-chart']) slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-subtitle-height
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
            line-height: 30px;
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
        :host([variant='mini-compare-chart']) slot[name='quantity-select'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-quantity-select-height
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
        :host(
            [variant='mini-compare-chart'][border-color='spectrum-yellow-300-plans']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-gray-300-plans']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-green-900-plans']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-red-700-plans']
        ) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
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
