import { css } from '../css.js';

const CSS = css`
    .collection-container:has(merch-card[variant='product-pricing']) {
        display: block;
    }

    merch-card-collection.product-pricing {
        display: grid;
        grid-template-columns: minmax(261px, 474px);
        justify-content: center;
        max-width: 1920px;
        margin-inline: auto;
        gap: 8px;
        --merch-card-collection-card-min-height: 286px;
    }

    /* Studio uses <merch-card-collection>; milo/preview wraps cards in
   .N-merch-cards grid containers, so both selector families are covered. */
    @media screen and (--tablet-up) {
        merch-card-collection.product-pricing,
        .two-merch-cards:has(merch-card[variant='product-pricing']),
        .three-merch-cards:has(merch-card[variant='product-pricing']),
        .four-merch-cards:has(merch-card[variant='product-pricing']) {
            grid-template-columns: repeat(2, minmax(261px, 474px));
        }
    }

    @media screen and (--c2-desktop-up) {
        merch-card-collection.product-pricing,
        .three-merch-cards:has(merch-card[variant='product-pricing']),
        .four-merch-cards:has(merch-card[variant='product-pricing']) {
            grid-template-columns: repeat(3, minmax(261px, 474px));
        }
    }

    @media screen and (--xl-desktop-up) {
        merch-card-collection.product-pricing,
        .four-merch-cards:has(merch-card[variant='product-pricing']) {
            grid-template-columns: repeat(4, minmax(261px, 474px));
        }
    }

    merch-card[variant='product-pricing'] {
        width: 100%;
        max-width: 474px;
        min-width: 261px;
        --product-frame-bg: #fff;
        --product-frame-border: #ebebeb;
    }

    merch-card[variant='product-pricing']:has([slot='badge']) {
        --product-frame-bg: #000;
        --product-frame-border: #000;
    }

    /* Strip the merch-badge pill: plain white text on the header strip. The
   --merch-badge-* props are set inline by merch-badge, so !important is needed. */
    merch-card[variant='product-pricing'] merch-badge {
        --merch-badge-background-color: transparent !important;
        --merch-badge-border: none !important;
        --merch-badge-color: #fff !important;
        --merch-badge-padding: 0 !important;
        inset-inline-start: 0;
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
    }

    merch-card[variant='product-pricing'] [slot='heading-s'] {
        margin: 0;
        font-size: 18px;
        font-weight: 900;
        line-height: 18px;
        letter-spacing: -0.2px;
        color: #000;
    }

    merch-card[variant='product-pricing'] [slot='body-xs'] {
        margin: 0;
        font-size: 14px;
        font-weight: 400;
        line-height: 18px;
        color: #5c5c5c;
    }

    /* Inline links (e.g. "See terms") match the gray body copy, underlined. */
    merch-card[variant='product-pricing'] [slot='body-xs'] a {
        color: inherit;
        text-decoration: underline;
    }

    merch-card[variant='product-pricing'] [slot='heading-xs'] {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        line-height: 20px;
        color: #000;
        text-align: left;
    }

    merch-card[variant='product-pricing'] [slot='heading-xs'] p {
        margin: 0;
    }

    /* Figma stacks the prices: current price drops below the strikethrough.
   Blocking the alternative (not the strikethrough) keeps the joining nbsp as a
   harmless trailing space instead of indenting the second line. */
    merch-card[variant='product-pricing']
        [slot='heading-xs']
        .price-alternative {
        display: block;
    }

    merch-card[variant='product-pricing']
        [slot='heading-xs']
        .price-strikethrough {
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        text-decoration: line-through;
        color: #5c5c5c;
    }

    merch-card[variant='product-pricing'] [slot='legal'] {
        margin: 0;
    }

    merch-card[variant='product-pricing'] span[data-template='legal'] {
        display: block;
        font-size: 12px;
        font-weight: 400;
        line-height: 18px;
        color: #5c5c5c;
    }

    /* The global leading nbsp would indent the legal line, so drop it. */
    merch-card[variant='product-pricing']
        span[data-template='legal']
        .price-tax-inclusivity:not(.disabled)::before {
        content: none;
    }

    merch-card[variant='product-pricing'] [slot='short-description'] {
        margin: 0;
        font-size: 12px;
        font-weight: 400;
        line-height: 18px;
        color: #000;
    }

    merch-card[variant='product-pricing'] [slot='short-description'] p {
        margin: 0;
    }

    merch-card[variant='product-pricing']
        [slot='short-description']
        a.spectrum-Link--secondary {
        color: inherit;
    }

    /* CTAs share a row while both labels fit on one line, else they stack. */
    merch-card[variant='product-pricing'] [slot='footer'] {
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 4px;
        width: 100%;
    }

    merch-card[variant='product-pricing'] [slot='footer'] a {
        flex: 1 1 calc(50% - 2px);
        /* One-line label width, capped at the footer: past half the row the CTAs
       stack, past the whole row the label wraps. */
        min-width: fit-content;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        border-radius: 999px;
        min-height: 40px;
        padding: 8px 24px;
        font-size: 14px;
        font-weight: 700;
        text-align: center;
        text-decoration: none;
        overflow-wrap: anywhere;
        background: #3b63fb;
        color: #fff;
        border: none;
    }

    merch-card[variant='product-pricing'] [slot='footer'] a.con-button.outline,
    merch-card[variant='product-pricing'] [slot='footer'] a.con-button.primary,
    merch-card[variant='product-pricing'] [slot='footer'] a.outline {
        background: transparent;
        color: #000;
        border: 2px solid #000;
    }

    merch-card[variant='product-pricing'][stacked] [slot='footer'] a {
        flex-basis: 100%;
    }
`;

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
    title: { tag: 'h3', slot: 'heading-s' },
    prices: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    shortDescription: { tag: 'div', slot: 'short-description' },
    ctas: { slot: 'footer', size: 'm' },
    planType: true,
    style: 'consonant',
};

export function define({
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TABLET_UP,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
}) {
    const SYNC_MIN_WIDTH = TABLET_UP;

    class ProductPricing extends TemplateLayout {
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
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? true;
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
                if (price.options.displayTax)
                    price.dataset.displayTax = 'false';
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
            const stackedRows = new Set(
                rows.filter((_, i) => ctasWrap(cards[i])),
            );
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
            this.card.addEventListener(
                EVENT_TYPE_RESOLVED,
                this.#onPriceResolved,
            );
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
            return ` <div class="header">
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

        static templateStyle = css`
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
           background is white by default, black when framed (badge authored, see
           product-pricing.css.js). */
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
            :host([variant='product-pricing']) slot[name='heading-xs'] {
                display: flex;
                flex-direction: column;
                /* Bottom-align so a plain price shares a baseline with a stacked
               strikethrough price. */
                justify-content: flex-end;
                min-height: var(
                    --consonant-merch-card-product-pricing-price-height
                );
            }

            /* No price authored: hide the price slot and drop the reserved row
           height, else it leaves a blank band above the CTAs. Chrome rejects
           :has() inside :host(), so the flag is an attribute (see flagPriceRow). */
            :host([variant='product-pricing'][no-price])
                slot[name='heading-xs'] {
                display: none;
            }

            :host([variant='product-pricing'][no-price]) .fine {
                min-height: 0;
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

            /* Legal + short-description share this row; a card shows one. */
            :host([variant='product-pricing']) .fine {
                display: flex;
                flex-direction: column;
                min-height: var(
                    --consonant-merch-card-product-pricing-fine-height
                );
            }

            :host([variant='product-pricing']) slot[name='short-description'] {
                display: block;
            }

            :host([variant='product-pricing']) footer {
                display: flex;
                padding: 0;
                gap: 4px;
                justify-content: stretch;
                align-items: stretch;
                flex-wrap: nowrap;
                /* Row-max height keeps a wrapped CTA from shifting siblings' rows. */
                min-height: var(
                    --consonant-merch-card-product-pricing-footer-height
                );
            }
        `;
    }
    return {
        'product-pricing': {
            class: ProductPricing,
            fragmentMapping: PRODUCT_PRICING_AEM_FRAGMENT_MAPPING,
            style: ProductPricing.templateStyle,
        },
    };
}
