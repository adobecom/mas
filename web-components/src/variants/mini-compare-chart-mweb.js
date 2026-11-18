import { html, nothing } from 'lit';
import { createTag } from '../commerce.js';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './mini-compare-chart-mweb.css.js';
import Media from '../media.js';
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

// Card-scoped min-height props set by syncHeights (via syncRowHeights). The sync
// only grows heights and never runs on mobile, so these must be cleared when the
// layout collapses to one mobile column — else cards keep the taller desktop
// heights and the collapsed "what's included" leaves dead space.
const SYNCED_HEIGHT_NAMES = [
    'heading-xs',
    'subtitle',
    'heading-m-price',
    'callout-content',
    'quantity-select',
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
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'Legal Disclaimer',
    },
    promoText: { tag: 'div', slot: 'promo-text' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
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
            'callout-content',
            'quantity-select',
            'promo-text',
            'body-m',
            'body-xs',
        ];
        this.syncRowHeights(
            slots.map((slot) => ({
                name: slot,
                getElement: (card) =>
                    slot === 'callout-content'
                        ? card.shadowRoot.querySelector('.legal-disclaimer')
                        : card.querySelector(`[slot="${slot}"]`),
            })),
        );
        this.adjustMiniCompareFooterRows();
    }

    priceOptionsProvider(element, options) {
        const mainPriceSlot =
            MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING.prices.slot;
        if (
            !element.closest(`[slot="${mainPriceSlot}"]`) &&
            element.slot !== 'price-legal'
        )
            return;

        if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
            options.displayPerUnit = false;
            options.displayTax = false;
            options.displayPlanType = this.hasLegalDisclaimer
                ? false
                : (this.card?.settings?.displayPlanType ?? false);
            return;
        }
        if (element.dataset.template === 'strikethrough') {
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

    get hasLegalDisclaimer() {
        return !!this.card
            .querySelector('[slot="callout-content"]')
            ?.textContent.trim();
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

            if (headingPrice.options.displayPlanType)
                headingPrice.dataset.displayPlanType = 'false';

            legal.dataset.displayTax = 'false';
            legal.dataset.displayPerUnit = 'false';
            legal.setAttribute('data-template', 'legal');
            legal.slot = 'price-legal';
            this.card.append(legal);
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
                        <div class="legal-disclaimer">
                            <slot name="price-legal"></slot>
                            <slot
                                name="callout-content"
                                ?hidden=${!this.hasLegalDisclaimer}
                                @slotchange=${() => this.card.requestUpdate()}
                            ></slot>
                        </div>
                    </div>
                    <slot name="promo-text"></slot>
                    <slot name="body-m"></slot>
                    <slot name="quantity-select"></slot>
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

    static variantStyle = SHADOW_CSS;
}
