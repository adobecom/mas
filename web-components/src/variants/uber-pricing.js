import { VariantLayout } from './variant-layout';
import { html, css } from 'lit';
import {
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
    #resizeFrame = null;
    #syncObserver = null;

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
        // One card per collection drives the pass; syncRowHeights groups the
        // rest by row. Desktop only: stacked mobile cards are each their own row.
        if (
            window.matchMedia(SYNC_MIN_WIDTH).matches &&
            this.card === this.card.parentElement?.firstElementChild
        ) {
            requestAnimationFrame(() => this.syncHeights());
        }
    }

    // Reserve each variable slot's row-max height so price + CTA line up across
    // a row. Same base helper plans/product use; no height:100% or margin-top
    // hacks (those feed back inside the collection grid and stretch cards).
    syncHeights() {
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
        this.syncRowHeights(
            SYNCED_SLOTS.map((slot) => ({
                name: slot,
                getElement: (card) => card.querySelector(`[slot="${slot}"]`),
            })),
        );
    }

    resizeHandler = () => {
        if (this.#resizeFrame) cancelAnimationFrame(this.#resizeFrame);
        this.#resizeFrame = requestAnimationFrame(() => {
            this.#resizeFrame = null;
            if (window.matchMedia(SYNC_MIN_WIDTH).matches) this.syncHeights();
        });
    };

    connectedCallbackHook() {
        window.addEventListener('resize', this.resizeHandler);
    }

    disconnectedCallbackHook() {
        window.removeEventListener('resize', this.resizeHandler);
        this.#syncObserver?.disconnect();
        this.#syncObserver = null;
        if (this.#resizeFrame) {
            cancelAnimationFrame(this.#resizeFrame);
            this.#resizeFrame = null;
        }
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
        }

        :host([variant='uber-pricing']) .body {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 24px;
            box-sizing: border-box;
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

        :host([variant='uber-pricing']) .spacer {
            flex: 0 0 24px;
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
