import { VariantLayout } from './variant-layout';
import { html, css } from 'lit';
import {
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';
import { CSS } from './uber-pricing.css.js';

const SYNC_MIN_WIDTH = '(min-width: 768px)';
const SYNCED_SLOTS = ['heading-s', 'body-xs', 'heading-xs'];

export const UBER_PRICING_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    mnemonics: { size: 'l' },
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'gradient-purple-blue',
    ],
    title: { tag: 'h3', slot: 'heading-s' },
    prices: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
};

export class UberPricing extends VariantLayout {
    #sizeObserver = null;
    #onPriceResolved = () => this.resyncOnReflow();
    lastSyncKey = null;

    getGlobalCSS() {
        return CSS;
    }

    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        options.displayPlanType = true;
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
            legal.setAttribute('data-template', 'legal');
            legal.dataset.displayPerUnit = 'false';
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
        return html` ${this.badge}
            <div class="body">
                <div class="top">
                    <slot name="icons"></slot>
                    <slot name="badge"></slot>
                    <div class="copy">
                        <slot name="heading-s"></slot>
                        <slot name="body-xs"></slot>
                    </div>
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
        :host([variant='uber-pricing']) {
            font-weight: 400;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
            border-radius: 16px;
            /* Fill the grid row so .spacer has slack to absorb. */
            height: 100%;
            box-sizing: border-box;
        }

        :host([variant='uber-pricing']) .body {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 24px;
            box-sizing: border-box;
            height: 100%;
        }

        :host([variant='uber-pricing']) .top {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        :host([variant='uber-pricing']) .copy {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        :host([variant='uber-pricing']) slot[name='heading-s'] {
            display: block;
            min-height: var(
                --consonant-merch-card-uber-pricing-heading-s-height
            );
        }
        :host([variant='uber-pricing']) slot[name='body-xs'] {
            display: block;
            min-height: var(--consonant-merch-card-uber-pricing-body-xs-height);
        }
        :host([variant='uber-pricing']) slot[name='heading-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-uber-pricing-heading-xs-height
            );
        }

        /* No price authored: reserve nothing for the price row, else the row's
           synced min-height leaves a blank band above the CTAs. Chrome rejects
           :has() inside :host(), so the flag is an attribute (see syncHeights). */
        :host([variant='uber-pricing'][no-price]) slot[name='heading-xs'] {
            display: none;
        }

        :host([variant='uber-pricing'][no-price]) .price-buttons {
            gap: 0;
        }

        /* Grows so a shorter card's slack lands here, in one block, instead of
           spread through the copy — keeps CTAs on the row's shared baseline. */
        :host([variant='uber-pricing']) .spacer {
            flex: 1 0 24px;
        }

        /* price -> buttons gap */
        :host([variant='uber-pricing']) .price-buttons {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        :host([variant='uber-pricing']) footer {
            display: flex;
            padding: 0;
            gap: 4px;
            justify-content: stretch;
            align-items: stretch;
            flex-wrap: nowrap;
        }

        :host([variant='uber-pricing']) #badge {
            border-radius: 4px 0 0 4px;
            font-weight: 400;
            line-height: 21px;
            padding: 2px 10px 3px;
        }
    `;
}
