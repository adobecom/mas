import { VariantLayout } from './variant-layout';
import { html } from 'lit';
import {
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';
import { CSS, SHADOW_CSS } from './product-pricing.css.js';
import { TABLET_UP } from '../media.js';

const SYNC_MIN_WIDTH = TABLET_UP;
// Synced per collection row so siblings share baselines.
const SYNCED_ROWS = [
    {
        name: 'heading-s',
        getElement: (card) => card.querySelector('[slot="heading-s"]'),
    },
    {
        name: 'body-xs',
        getElement: (card) => card.querySelector('[slot="body-xs"]'),
    },
    {
        name: 'price',
        getElement: (card) => card.querySelector('[slot="heading-xs"]'),
    },
    {
        name: 'fine',
        getElement: (card) => card.shadowRoot?.querySelector('.fine'),
    },
    {
        name: 'footer',
        getElement: (card) => card.shadowRoot?.querySelector('footer'),
    },
];

const clearSynced = (card) => {
    card.removeAttribute('stacked');
    SYNCED_ROWS.forEach(({ name }) =>
        card.style.removeProperty(
            `--consonant-merch-card-product-pricing-${name}-height`,
        ),
    );
};

// Two CTAs wrap when the second sits below the first. A lone CTA never does,
// so a long single label can't stack its row.
const ctasWrap = (card) => {
    const [first, second] = [
        ...card.querySelectorAll('[slot="footer"] a'),
    ].filter((a) => a.getClientRects().length);
    return Boolean(
        second &&
            second.getBoundingClientRect().top >=
                first.getBoundingClientRect().bottom,
    );
};

const rowOf = (card) => Math.round(card.getBoundingClientRect().top);

export const PRODUCT_PRICING_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    mnemonics: { size: 's' },
    // Plain text badge; merch-badge pill styling is stripped in product-pricing.css.js.
    badge: { tag: 'div', slot: 'badge' },
    title: { tag: 'h2', slot: 'heading-s' },
    prices: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    shortDescription: { tag: 'div', slot: 'short-description' },
    ctas: { slot: 'footer', size: 'm' },
    planType: true,
    style: 'consonant',
};

export class ProductPricing extends VariantLayout {
    #onPriceResolved = () => this.requestReflowCheck();
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
            legal.dataset.displayPerUnit = 'false';
            if (price.options.displayTax) price.dataset.displayTax = 'false';
            if (price.options.displayPlanType)
                price.dataset.displayPlanType = 'false';
            legal.setAttribute('data-template', 'legal');
            this.legalHost().appendChild(legal);
            await legal.onceSettled();
        } catch {
            // Proceed with the other post-update adjustments
        }
    }

    // Legal renders in its own slot, sharing the sub-row with short-description,
    // so the price line (not price+legal) is what aligns across cards.
    legalHost() {
        let host = this.card.querySelector('p[slot="legal"]');
        if (!host) {
            host = document.createElement('p');
            host.setAttribute('slot', 'legal');
            this.card.appendChild(host);
        }
        return host;
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
        if (this.card.heightSync === false) return;
        if (this.card.getBoundingClientRect().width <= 2) return;
        const cards = [
            ...(this.getContainer()?.querySelectorAll(
                'merch-card[variant="product-pricing"]',
            ) ?? []),
        ];
        // Narrow cards are each their own row: drop what a wider layout set.
        cards.forEach(clearSynced);
        if (!window.matchMedia(SYNC_MIN_WIDTH).matches) return;
        this.syncRowHeights(SYNCED_ROWS);
        // One card whose CTAs wrap stacks every card in its row.
        const rows = cards.map(rowOf);
        const stackedRows = new Set(rows.filter((_, i) => ctasWrap(cards[i])));
        cards.forEach((card, i) =>
            card.toggleAttribute('stacked', stackedRows.has(rows[i])),
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
        const width = this.boxOf(this.card).width;
        if (width <= 2) return;
        const key = [
            Math.round(width),
            ...SYNCED_ROWS.map(({ getElement }) =>
                this.heightOf(getElement(this.card)),
            ),
        ].join(':');
        if (key === this.lastSyncKey) return;
        this.lastSyncKey = key;
        this.syncHeights();
    }

    connectedCallbackHook() {
        this.card.addEventListener(EVENT_TYPE_RESOLVED, this.#onPriceResolved);
        this.observeReflow(
            this.card,
            this.card.querySelector('[slot="body-xs"]'),
            this.card.querySelector('[slot="short-description"]'),
        );
    }

    disconnectedCallbackHook() {
        this.card.removeEventListener(
            EVENT_TYPE_RESOLVED,
            this.#onPriceResolved,
        );
        this.disconnectReflow();
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
                    <div>
                        <slot name="heading-xs"></slot>
                        <div class="fine">
                            <slot name="legal"></slot>
                            <slot name="short-description"></slot>
                        </div>
                    </div>
                    <footer><slot name="footer"></slot></footer>
                </div>
            </div>
            <slot></slot>`;
    }

    static variantStyle = SHADOW_CSS;
}
