import { html, css, unsafeCSS, nothing } from 'lit';
import { createTag } from '../utils.js';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './mini-compare-chart-mweb.css.js';
import Media, { DESKTOP_UP, TABLET_DOWN, TABLET_UP } from '../media.js';
import { getService } from '../utilities.js';
import {
    SELECTOR_MAS_INLINE_PRICE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    TEMPLATE_PRICE_LEGAL,
    FF_ANNUAL_PRICE,
} from '../constants.js';

const FOOTER_ROW_MIN_HEIGHT = 32;
// Fallback list id for cards without a heading id; the counter keeps siblings
// unique so aria-controls / DOM ids never collide.
let listIdCounter = 0;
const nextListId = () => `mweb-list-${(listIdCounter += 1)}`;

// Card-scoped min-height props set by syncHeights (via syncRowHeights). The sync
// only grows heights and never runs on mobile, so these must be cleared when the
// layout collapses to one mobile column — else cards keep the taller desktop
// heights and the collapsed "what's included" leaves dead space.
const SYNCED_HEIGHT_NAMES = [
    'heading-xs',
    'subtitle',
    'heading-m-price',
    'promo-text',
    'body-m',
    'body-xs',
];
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
    #syncObserver;
    #resizeObserver;
    #resizeTimer;
    #lastWidth = 0;
    #toggleEls;

    constructor(card) {
        super(card);
        this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
    }

    connectedCallbackHook() {
        this.card.addEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        // Re-sync on any width change, not just the mobile boundary: a narrower
        // column re-wraps text, so row heights must be recomputed to stay aligned.
        // Guard on width — a list toggle changes height only and must not retrigger.
        this.#lastWidth = this.card.getBoundingClientRect().width;
        this.#resizeObserver = new ResizeObserver(() => {
            const width = this.card.getBoundingClientRect().width;
            if (width === this.#lastWidth) return;
            this.#lastWidth = width;
            clearTimeout(this.#resizeTimer);
            this.#resizeTimer = setTimeout(
                () => this.reconcileBreakpoint(),
                150,
            );
        });
        this.#resizeObserver.observe(this.card);
    }

    disconnectedCallbackHook() {
        this.card.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        clearTimeout(this.#resizeTimer);
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;
        this.#syncObserver?.disconnect();
        this.#syncObserver = null;
    }

    reconcileBreakpoint() {
        if (Media.isMobile) {
            this.resetSyncedHeights();
            this.removeEmptyRows();
        } else {
            this.#syncSiblingsWhenSettled();
        }
    }

    updatePriceQuantity({ detail }) {
        if (!this.mainPrice || !detail?.option) return;
        this.mainPrice.dataset.quantity = detail.option;
    }

    syncHeights() {
        // A desktop sync started before a resize can resolve after the switch to
        // mobile; never apply cross-card heights to the single mobile column.
        if (Media.isMobile) return;
        if (this.card.getBoundingClientRect().width <= 2) {
            if (!this.#syncObserver) {
                this.#syncObserver = new ResizeObserver(() => {
                    if (this.card.getBoundingClientRect().width > 2) {
                        this.#syncObserver?.disconnect();
                        this.#syncObserver = null;
                        this.syncHeights();
                    }
                });
                this.#syncObserver.observe(this.card);
            }
            return;
        }
        const slots = [
            'heading-xs',
            'subtitle',
            'heading-m-price',
            'promo-text',
            'body-m',
            'body-xs',
        ];
        this.syncRowHeights(
            slots.map((slot) => ({
                name: slot,
                getElement: (card) => card.querySelector(`[slot="${slot}"]`),
            })),
        );
        this.adjustMiniCompareFooterRows();
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;
            return;
        }
        const service = getService();
        // For main price display (strikethrough and regular price)
        // Disable perUnit display - it will be shown in legal price only
        if (
            element.dataset.template === 'strikethrough' ||
            (element.dataset.template === 'price' &&
                !service.featureFlags[FF_ANNUAL_PRICE])
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
            'h4',
            { class: 'footer-rows-title' },
            titleText,
        );
        const toggleBtn = createTag('button', {
            class: 'toggle-icon',
            'aria-label': titleText,
            'aria-expanded': 'false',
            'aria-controls': listId,
        });
        this.#toggleEls = { toggleBtn, listEl };
        titleDiv.append(toggleBtn);

        // Collapsing is mobile-only; CSS hides the button and forces the list
        // open on desktop, so a click there must never collapse it.
        titleDiv.addEventListener('click', () => {
            if (Media.isMobile) this.setListOpen(!this.isListOpen);
        });
        titleEl.replaceWith(titleDiv);
    }

    get isListOpen() {
        return this.#toggleEls?.listEl.classList.contains('open') ?? false;
    }

    // One definition of "open" for the mobile click handler.
    setListOpen(isOpen) {
        const { toggleBtn, listEl } = this.#toggleEls;
        listEl.classList.toggle('open', isOpen);
        toggleBtn.classList.toggle('expanded', isOpen);
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
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
            const service = getService();
            this.legalAdjusted = true;
            await this.card.updateComplete;
            await customElements.whenDefined('inline-price');

            const headingPrice = this.mainPrice;
            if (!headingPrice) return;

            const legal = headingPrice.cloneNode(true);
            await headingPrice.onceSettled();

            if (!headingPrice?.options) return;

            if (headingPrice.options.displayPlanType)
                headingPrice.dataset.displayPlanType = 'false';

            if (
                service.featureFlags[FF_ANNUAL_PRICE] &&
                headingPrice.options.displayTax
            ) {
                legal.dataset.displayTax = 'false';
            } else if (headingPrice.options.displayTax) {
                headingPrice.dataset.displayTax = 'false';
            }
            if (
                service.featureFlags[FF_ANNUAL_PRICE] &&
                headingPrice.options.displayPerUnit
            ) {
                legal.dataset.displayPerUnit = 'false';
            } else if (headingPrice.options.displayPerUnit) {
                headingPrice.dataset.displayPerUnit = 'false';
            }

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
                <div class="body-main">
                    ${this.icons}
                    <slot name="badge"></slot>
                    <slot name="heading-xs"></slot>
                    <div class="price-wrapping">
                        <slot name="subtitle"></slot>
                        <slot name="heading-m-price"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                    <slot name="body-m"></slot>
                </div>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `;
    }

    async postCardUpdateHook() {
        if (!this.legalAdjusted) {
            await this.adjustLegal();
        }
        this.setupToggle();
        if (Media.isMobile) {
            this.removeEmptyRows();
        }
        await super.postCardUpdateHook();
        if (!Media.isMobile) {
            await this.#syncSiblingsWhenSettled();
        }
    }

    // All sibling cards of this variant inside the given container.
    #siblingCards(container) {
        return container.querySelectorAll(
            `merch-card[variant="${this.card.variant}"]`,
        );
    }

    // Sync only after every sibling card has finished updating and the layout
    // has settled, driven once from the first card. Running per-card mid-reflow
    // (e.g. straight off a breakpoint change) groups cards by a transient top
    // and strands siblings at mismatched heights.
    async #syncSiblingsWhenSettled() {
        const container = this.getContainer();
        if (!container) return;
        const cards = Array.from(this.#siblingCards(container));
        // Elect the first card of the sibling set as leader; querySelectorAll
        // matches at any depth, so firstElementChild would miss nested layouts.
        if (this.card !== cards[0]) return;
        await Promise.all(cards.map((card) => card.updateComplete));
        await new Promise((resolve) => setTimeout(resolve, 100));
        requestAnimationFrame(() => {
            this.resetSyncedHeights();
            this.syncHeights();
        });
    }

    resetSyncedHeights() {
        const container = this.getContainer();
        if (!container) return;
        const variant = this.card.variant;
        const cards = this.#siblingCards(container);
        for (const name of SYNCED_HEIGHT_NAMES) {
            const prop = `--consonant-merch-card-${variant}-${name}-height`;
            container.style.removeProperty(prop);
            cards.forEach((card) => card.style.removeProperty(prop));
        }
        for (let index = 1; index <= MAX_FOOTER_ROWS; index += 1) {
            container.style.removeProperty(
                this.getRowMinHeightPropertyName(index),
            );
        }
    }

    static variantStyle = css`
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > .price-wrapping {
            display: flex;
            flex-direction: column;
        }

        :host([variant='mini-compare-chart-mweb']) .body {
            padding: 0;
        }

        :host([variant='mini-compare-chart-mweb']) .body-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            height: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            padding: var(--consonant-merch-spacing-xs);
            padding-bottom: 0;
        }

        :host([variant='mini-compare-chart-mweb']) footer {
            margin: var(--consonant-merch-spacing-xs);
            margin-top: 0;
            width: auto;
        }

        :host([variant='mini-compare-chart-mweb'])
            .price-wrapping
            > slot[name='subtitle'] {
            display: block;
        }

        :host([variant='mini-compare-chart-mweb'])
            .price-wrapping
            > slot[name='heading-m-price'] {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: flex-end;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
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

        @media screen and ${unsafeCSS(TABLET_UP)} {
            :host([variant='mini-compare-chart-mweb'])
                .price-wrapping
                > slot[name='subtitle'] {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-subtitle-height,
                    0px
                );
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
            .body-main
            > slot[name='heading-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > slot[name='promo-text'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > slot[name='body-m'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .footer-rows-container
            > slot[name='body-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
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

        :host([variant='mini-compare-chart-mweb'])
            ::slotted(h3[slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
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
