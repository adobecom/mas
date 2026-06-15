import { html, css, unsafeCSS, nothing } from 'lit';
import { createTag } from '../utils.js';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './mini-compare-chart-mweb.css.js';
import Media, { DESKTOP_UP, TABLET_DOWN } from '../media.js';
import {
    SELECTOR_MAS_INLINE_PRICE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';

const FOOTER_ROW_MIN_HEIGHT = 32;
// Fallback list id for cards without a heading id; the counter keeps siblings
// unique so aria-controls / DOM ids never collide.
let listIdCounter = 0;
const nextListId = () => `mweb-list-${(listIdCounter += 1)}`;

const BODY_SLOT_NAMES = [
    'heading-xs',
    'subtitle',
    'heading-m-price',
    'promo-text',
    'body-m',
    'body-xs',
    'footer-rows',
];
// The height sync is grow-only, so these must be cleared when the layout
// collapses to a single mobile column — otherwise cards keep the taller desktop
// heights and the collapsed "what's included" leaves dead space.
const SYNCED_HEIGHT_NAMES = [...BODY_SLOT_NAMES, 'footer'];
const MAX_FOOTER_ROWS = 8; // matches the .footer-row-cell nth-child rules in CSS

export const MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    prices: { tag: 'p', slot: 'heading-m-price' },
    promoText: { tag: 'div', slot: 'promo-text' },
    shortDescription: { tag: 'div', slot: 'body-m' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
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
    ctas: { slot: 'footer', size: 'l' },
    style: 'consonant',
};

export class MiniCompareChartMweb extends VariantLayout {
    constructor(card) {
        super(card);
        this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
        this.reconcileBreakpoint = this.reconcileBreakpoint.bind(this);
    }

    connectedCallbackHook() {
        this.card.addEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        Media.matchMobile.addEventListener('change', this.reconcileBreakpoint);
        // A DOM move reuses this instance and setupToggle won't re-run, so resync
        // to the current viewport — else the list can be stranded collapsed.
        if (this._toggleEls) this.applyToggleMode();
    }

    disconnectedCallbackHook() {
        this.card.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        Media.matchMobile.removeEventListener(
            'change',
            this.reconcileBreakpoint,
        );
        this._syncObserver?.disconnect();
        this._syncObserver = null;
    }

    reconcileBreakpoint() {
        this.applyToggleMode();
        if (Media.isMobile) {
            this.resetSyncedHeights();
            this.removeEmptyRows();
        } else {
            this.syncSiblingHeights();
        }
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
        return html` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`;
    };

    getMiniCompareFooterRows = () => {
        return html` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`;
    };

    adjustMiniCompareBodySlots() {
        if (this.card.getBoundingClientRect().width <= 2) {
            // Card not yet laid out (e.g. Milo section grid applied after card renders).
            // Observe for first non-zero width then retry.
            if (!this._syncObserver) {
                this._syncObserver = new ResizeObserver(() => {
                    if (this.card.getBoundingClientRect().width > 2) {
                        this._syncObserver?.disconnect();
                        this._syncObserver = null;
                        this.adjustMiniCompareBodySlots();
                        this.adjustMiniCompareFooterRows();
                    }
                });
                this._syncObserver.observe(this.card);
            }
            return;
        }

        BODY_SLOT_NAMES.forEach((slot) => {
            const lightEl = this.card.querySelector(`[slot="${slot}"]`);
            const el =
                lightEl ??
                this.card.shadowRoot.querySelector(`slot[name="${slot}"]`);
            this.updateCardElementMinHeight(el, slot);
        });
        // Re-measure promo-text from shadow DOM slot (includes slotted content padding)
        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('slot[name="promo-text"]'),
            'promo-text',
        );
        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('footer'),
            'footer',
        );
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

    setupToggle() {
        const bodyXs = this.card.querySelector('[slot="body-xs"]');
        const titleEl = bodyXs?.querySelector('p');
        const listEl = bodyXs?.querySelector('ul');
        if (!titleEl || !listEl) return;
        // Skip if the Milo block already built this structure.
        if (bodyXs.querySelector('.footer-rows-title')) return;

        const titleText = titleEl.textContent.trim();
        const heading = this.card.querySelector('h3')?.id;
        const listId = heading ? `${heading}-list` : nextListId();
        listEl.id = listId;
        listEl.classList.add('checkmark-copy-container');

        const titleDiv = createTag(
            'div',
            { class: 'footer-rows-title' },
            titleText,
        );
        const toggleBtn = createTag('button', {
            class: 'toggle-icon',
            'aria-label': titleText,
            'aria-expanded': 'false',
            'aria-controls': listId,
        });
        this._toggleEls = { titleDiv, toggleBtn, listEl };

        // Mobile-only: on desktop the list stays open and the button is detached,
        // so clicks there must not collapse it.
        titleDiv.addEventListener('click', () => {
            if (Media.isMobile) this.setListOpen(!this.isListOpen);
        });
        titleEl.replaceWith(titleDiv);
    }

    get isListOpen() {
        return this._toggleEls?.listEl.classList.contains('open') ?? false;
    }

    // One definition of "open", shared by the click handler and applyToggleMode.
    setListOpen(isOpen) {
        const { toggleBtn, listEl } = this._toggleEls;
        listEl.classList.toggle('open', isOpen);
        toggleBtn.classList.toggle('expanded', isOpen);
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
    }

    applyToggleMode() {
        if (!this._toggleEls) return;
        const { titleDiv, toggleBtn, listEl } = this._toggleEls;
        if (Media.isMobile) {
            titleDiv.append(toggleBtn);
            this.setListOpen(false);
        } else {
            toggleBtn.remove();
            listEl.classList.add('open');
        }
    }

    get legalDisplayDot() {
        return false;
    }

    get mainPrice() {
        return this.card.querySelector(
            `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
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

    get icons() {
        if (
            !this.card.querySelector('[slot="icons"]') &&
            !this.card.getAttribute('id')
        )
            return nothing;
        return html`<slot name="icons"></slot>`;
    }

    renderLayout() {
        return html`
            ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="badge"></slot>
                <slot name="heading-xs"></slot>
                <slot name="subtitle"></slot>
                <slot name="heading-m-price"></slot>
                <slot name="body-m"></slot>
                <slot name="promo-text"></slot>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `;
    }

    async postCardUpdateHook() {
        await super.postCardUpdateHook();
        if (!this.legalAdjusted) {
            await this.adjustLegal();
        }
        this.setupToggle();
        this.reconcileBreakpoint();
    }

    resetSyncedHeights() {
        const container = this.getContainer();
        if (!container) return;
        SYNCED_HEIGHT_NAMES.forEach((name) => {
            container.style.removeProperty(
                `--consonant-merch-card-${this.card.variant}-${name}-height`,
            );
        });
        for (let index = 1; index <= MAX_FOOTER_ROWS; index += 1) {
            container.style.removeProperty(
                this.getRowMinHeightPropertyName(index),
            );
        }
    }

    syncSiblingHeights() {
        this.adjustMiniCompareFooterRows();

        const container = this.getContainer();
        if (!container) return;

        requestAnimationFrame(() => {
            const cards = container.querySelectorAll(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            cards.forEach((card) => {
                card.variantLayout?.adjustMiniCompareBodySlots?.();
                card.variantLayout?.adjustMiniCompareFooterRows?.();
            });
        });
    }

    static variantStyle = css`
        :host([variant='mini-compare-chart-mweb']) .body > slot {
            display: block;
        }

        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart-mweb'])
            .mini-compare-chart-mweb-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart-mweb']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-footer-height
            );
            padding: 0;
            align-items: start;
            flex-flow: column nowrap;
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart-mweb']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-mweb-top-section-height
            );
        }

        :host([variant='mini-compare-chart-mweb'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        @media screen and ${unsafeCSS(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS(DESKTOP_UP)} {
            :host([variant='mini-compare-chart-mweb']) footer {
                padding: 0;
            }
        }

        :host([variant='mini-compare-chart-mweb']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        /* Use ::slotted() to target light DOM elements — shadow slots have display:contents so min-height is ignored on them */
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-m']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='body-m']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-m-price']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='body-xxs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='price-commitment']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='offers']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-offers-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='promo-text']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='callout-content']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-callout-content-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-xs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='subtitle']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='body-xs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='addon']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-addon-height
            );
        }
        /* Shadow DOM slot min-heights — ensures empty slots reserve space for cross-card alignment */
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-xs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) .body > slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }

        :host([variant='mini-compare-chart-mweb']) slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-yellow-300-plans']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-gray-300-plans']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-green-900-plans']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-red-700-plans']
        ) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb']) .footer-rows-container {
            background-color: #f8f8f8;
            border-radius: 0 0 var(--consonant-merch-spacing-xxs)
                var(--consonant-merch-spacing-xxs);
        }

        :host([variant='mini-compare-chart-mweb']) .action-area {
            display: flex;
            justify-content: start;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
        }
    `;
}
