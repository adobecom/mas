import { VariantLayout } from './variant-layout';
import { html, css } from 'lit';
import {
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';
import { CSS } from './product-pricing.css.js';
import { TABLET_UP } from '../media.js';

const SYNC_MIN_WIDTH = TABLET_UP;
const SYNCED_SLOTS = ['heading-s', 'body-xs', 'heading-xs'];

export const PRODUCT_PRICING_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    mnemonics: { size: 's' },
    // Plain text badge; merch-badge pill styling is stripped in product-pricing.css.js.
    badge: { tag: 'div', slot: 'badge' },
    title: { tag: 'h3', slot: 'heading-s' },
    prices: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'm' },
    planType: true,
    style: 'consonant',
};

export class ProductPricing extends VariantLayout {
    #sizeObserver = null;
    #onPriceResolved = () => this.resyncOnReflow();
    lastSyncKey = null;

    getGlobalCSS() {
        return CSS;
    }

    // Product name is in heading-s; the base heading-xs slot holds the price.
    // merch-card.title reads this, so search must target the name.
    get headingSelector() {
        return '[slot="heading-s"]';
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        // Author-controlled via "Show Plan type"; shown unless explicitly off.
        options.displayPlanType = this.card?.settings?.displayPlanType ?? true;
    }

    async adjustLegal() {
        if (this.legalAdjusted) return;
        try {
            this.legalAdjusted = true;
            await this.card.updateComplete;
            await customElements.whenDefined('inline-price');
            const price = this.card.querySelector(
                `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}:not([data-template="legal"])`,
            );
            if (!price) return;
            const legal = price.cloneNode(true);
            await price.onceSettled();
            if (!price.options) return;
            // Strip fine print off the bold price; the legal line renders it.
            if (price.options.displayPerUnit)
                price.dataset.displayPerUnit = 'false';
            if (price.options.displayTax) price.dataset.displayTax = 'false';
            if (price.options.displayPlanType)
                price.dataset.displayPlanType = 'false';
            legal.setAttribute('data-template', 'legal');
            price.parentNode.insertBefore(legal, price.nextSibling);
            await legal.onceSettled();
        } catch {
            // Proceed with the other post-update adjustments
        }
    }

    async postCardUpdateHook() {
        if (!this.card.isConnected) return;
        if (!this.legalAdjusted) await this.adjustLegal();
        await super.postCardUpdateHook();
        this.flagPriceRow();
        if (window.matchMedia(SYNC_MIN_WIDTH).matches) {
            requestAnimationFrame(() => this.syncHeights());
        }
    }

    syncHeights() {
        if (this.card.getBoundingClientRect().width <= 2) return;
        if (!window.matchMedia(SYNC_MIN_WIDTH).matches) return;
        this.syncRowHeights(
            SYNCED_SLOTS.map((slot) => ({
                name: slot,
                getElement: (card) => card.querySelector(`[slot="${slot}"]`),
            })),
        );
    }

    // Cards with no authored price must not reserve the synced price row.
    flagPriceRow() {
        this.card.toggleAttribute(
            'no-price',
            !this.card.querySelector('[slot="heading-xs"]'),
        );
    }

    // Re-sync on a real reflow, keyed so our own writes can't loop the observer.
    resyncOnReflow() {
        const width = this.card.getBoundingClientRect().width;
        if (width <= 2) return;
        const height = (selector) =>
            Math.round(
                this.card.querySelector(selector)?.getBoundingClientRect()
                    .height || 0,
            );
        const key = [
            Math.round(width),
            ...SYNCED_SLOTS.map((slot) => height(`[slot="${slot}"]`)),
        ].join(':');
        if (key === this.lastSyncKey) return;
        this.lastSyncKey = key;
        this.syncHeights();
    }

    connectedCallbackHook() {
        this.card.addEventListener(EVENT_TYPE_RESOLVED, this.#onPriceResolved);
        if (typeof ResizeObserver === 'undefined') return;
        this.#sizeObserver = new ResizeObserver(() => this.resyncOnReflow());
        this.#sizeObserver.observe(this.card);
        const desc = this.card.querySelector('[slot="body-xs"]');
        if (desc) this.#sizeObserver.observe(desc);
    }

    disconnectedCallbackHook() {
        this.card.removeEventListener(
            EVENT_TYPE_RESOLVED,
            this.#onPriceResolved,
        );
        this.#sizeObserver?.disconnect();
        this.#sizeObserver = null;
    }

    renderLayout() {
        return html` <div class="header">
                <slot name="icons"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="panel">
                <div class="copy">
                    <slot name="heading-s"></slot>
                    <slot name="body-xs"></slot>
                </div>
                <div class="spacer"></div>
                <div class="price-buttons">
                    <slot name="heading-xs"></slot>
                    <footer><slot name="footer"></slot></footer>
                </div>
            </div>
            <slot></slot>`;
    }

    static variantStyle = css`
        :host([variant='product-pricing']) {
            font-weight: 400;
            display: flex;
            flex-direction: column;
            background: var(--product-frame-bg, #fff);
            border: 1px solid var(--product-frame-border, #dadada);
            border-radius: 16px;
            overflow: hidden;
            /* 4px frame = 1px border + 3px padding; host bg shows through. */
            padding: 3px;
            /* Fill the grid row so .spacer has slack to absorb. */
            height: 100%;
            box-sizing: border-box;
        }

        /* Mnemonic + badge share one centered row on the header strip. Strip
           background is white by default, black when framed (badge authored or a
           CTA hovered); triggers live in product-pricing.css.js. */
        :host([variant='product-pricing']) .header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 24px 24px 32px;
        }

        :host([variant='product-pricing']) .header slot[name='icons'] {
            display: inline-flex;
            align-items: center;
        }

        /* White content panel; the host's 4px padding exposes the frame around
           it (and the header strip) in the framed state. */
        :host([variant='product-pricing']) .panel {
            flex: 1 0 auto;
            display: flex;
            flex-direction: column;
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            box-sizing: border-box;
        }

        :host([variant='product-pricing']) .copy {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        :host([variant='product-pricing']) slot[name='heading-s'] {
            display: block;
            min-height: var(
                --consonant-merch-card-product-pricing-heading-s-height
            );
        }
        :host([variant='product-pricing']) slot[name='body-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-product-pricing-body-xs-height
            );
        }
        /* Bottom-align so a strikethrough on one card and a single price on
           another share the same price baseline across the synced row. */
        :host([variant='product-pricing']) slot[name='heading-xs'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            min-height: var(
                --consonant-merch-card-product-pricing-heading-xs-height
            );
        }

        /* No price authored: reserve nothing for the price row, else the row's
           synced min-height leaves a blank band above the CTAs. Chrome rejects
           :has() inside :host(), so the flag is an attribute (see syncHeights). */
        :host([variant='product-pricing'][no-price]) slot[name='heading-xs'] {
            display: none;
        }

        :host([variant='product-pricing'][no-price]) .price-buttons {
            gap: 0;
        }

        /* Grows so a shorter card's slack lands here, in one block, instead of
           spread through the copy, keeping CTAs on the row's shared baseline. */
        :host([variant='product-pricing']) .spacer {
            flex: 1 0 24px;
        }

        :host([variant='product-pricing']) .price-buttons {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        :host([variant='product-pricing']) footer {
            display: flex;
            padding: 0;
            gap: 4px;
            justify-content: stretch;
            align-items: stretch;
            flex-wrap: nowrap;
        }
    `;
}
