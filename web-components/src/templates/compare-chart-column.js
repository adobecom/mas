import { css } from '../css.js';

const CSS = css`
    merch-card[variant='compare-chart-column'] {
        --compare-chart-cell-border-color: var(
            --spectrum-gray-300,
            #d3d3d3
        ) !important;
        --compare-chart-cell-bg: #fff !important;
        --compare-chart-cell-bg-alt: var(--color-gray-100, #f8f8f8) !important;
        --consonant-merch-card-border-width: 1px !important;
        --consonant-merch-card-border-radius: 8px !important;
        background-color: var(--compare-chart-cell-bg) !important;
        display: block !important;
    }

    merch-card[variant='compare-chart-column'] p,
    merch-card[variant='compare-chart-column'] a,
    mas-compare-chart [data-compare-chart-slot] p,
    mas-compare-chart [data-compare-chart-slot] a {
        margin: 0 !important;
    }

    merch-card[variant='compare-chart-column'] [slot='badge'],
    mas-compare-chart [data-compare-chart-slot][slot$='-badge'] {
        display: flex !important;
        justify-content: center !important;
    }

    merch-card[variant='compare-chart-column'] [slot='badge'] merch-badge,
    mas-compare-chart [data-compare-chart-slot][slot$='-badge'] merch-badge {
        --merch-badge-border-radius: 4px !important;
        inset-inline-start: 0 !important;
        max-width: 100% !important;
        text-align: center !important;
    }

    mas-compare-chart [data-compare-chart-slot][slot$='-detail'],
    mas-compare-chart [data-compare-chart-slot][slot$='-detail'] p {
        color: var(--C1-Text-text, #2c2c2c) !important;
        font-family: var(--Font-adobe-clean, 'Adobe Clean'), sans-serif !important;
        font-size: 12px !important;
        font-style: italic !important;
        font-weight: 400 !important;
        line-height: 150% !important;
    }

    mas-compare-chart [data-compare-chart-slot][slot$='-detail'] {
        flex-grow: 0 !important;
        min-height: auto !important;
        padding-block: 0 !important;
    }
`;

export const COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING = {
    mnemonics: { size: 'l' },
    title: { tag: 'h3', slot: 'header', maxCount: 100 },
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    prices: { tag: 'p', slot: 'price' },
    description: { tag: 'div', slot: 'detail', maxCount: 1000 },
    callout: { tag: 'div', slot: 'callout-content' },
    ctas: { slot: 'cta', size: 'M' },
    features: { tag: 'div', slot: 'features', unwrap: true },
};

export function define({ TemplateLayout }) {
    /**
     * Sync keys and shadow DOM selectors for {@link TemplateLayout#updateCardElementMinHeight}.
     * Wrappers (not inner <slot>) are measured so bordered chips match row mates.
     */
    const HEIGHT_SYNC_TARGETS = [
        { key: 'header', selector: '.seg-header' },
        { key: 'price', selector: '.seg-price' },
        { key: 'detail', selector: '.seg-detail' },
        { key: 'cta', selector: '.seg-cta' },
    ];

    class CompareChartColumn extends TemplateLayout {
        constructor(card) {
            super(card);
            this.postCardUpdateHook = this.postCardUpdateHook.bind(this);
        }

        getGlobalCSS() {
            return CSS;
        }

        get aemFragmentMapping() {
            return COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING;
        }

        /** Comparison table host for stamping shared min-height custom properties
         * (override default container: merch-card-collection / *-merch-cards / parent). */
        getContainer() {
            return (
                this.card.closest('mas-compare-chart') ??
                this.card.parentElement
            );
        }

        connectedCallbackHook() {
            window.addEventListener('resize', this.postCardUpdateHook);
        }

        disconnectedCallbackHook() {
            window.removeEventListener('resize', this.postCardUpdateHook);
        }

        async postCardUpdateHook() {
            if (!this.card.isConnected) return;
            await this.card.updateComplete;
            this.#adjustSlotHeights();
        }

        #adjustSlotHeights() {
            if (this.card.getBoundingClientRect().width === 0) return;
            const root = this.card.shadowRoot;
            HEIGHT_SYNC_TARGETS.forEach(({ key, selector }) =>
                this.updateCardElementMinHeight(
                    root.querySelector(selector),
                    key,
                ),
            );
        }

        renderLayout() {
            return `
            <div class="card">
                <div class="seg seg-header">
                    <slot name="icons"></slot>
                    <slot name="header"></slot>
                    <slot name="badge"></slot>
                </div>
                <div class="seg seg-price">
                    <slot name="price"></slot>
                </div>
                <div class="seg seg-detail">
                    <slot name="detail"></slot>
                </div>
                <slot name="callout-content"></slot>
            </div>
            <div class="seg seg-cta">
                <slot name="cta"></slot>
            </div>
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='compare-chart-column']) {
                --compare-chart-card-padding: 12px;
                --compare-chart-seg-radius: 4px;
                --compare-chart-seg-border-color: var(
                    --spectrum-gray-300,
                    #d3d3d3
                );
                --compare-chart-card-min-width: 100px;
                --compare-chart-card-max-width: 280px;
                /* The merch-card host carries no border/background; segments do. */
                border: none;
                border-radius: 0;
                background: transparent;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: var(--compare-chart-card-min-width);
                max-width: var(--compare-chart-card-max-width);
                width: 100%;
                justify-self: center;
                box-sizing: border-box;
            }

            :host([variant='compare-chart-column']) .card {
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: transparent;
                box-sizing: border-box;
            }

            /* Bordered chips: header + price */
            :host([variant='compare-chart-column']) .seg-header,
            :host([variant='compare-chart-column']) .seg-price {
                border: 1px solid var(--compare-chart-seg-border-color);
                border-radius: var(--compare-chart-seg-radius);
                padding: var(--compare-chart-card-padding);
                background: var(--compare-chart-cell-bg, #fff);
                box-sizing: border-box;
            }
            /* Zebra (Figma: Cell color = default | grey). Driven by --col stamped
           on the host at hydration: even columns get the grey background. */
            :host([variant='compare-chart-column']) {
                --compare-chart-cell-bg: #fff;
            }
            :host([variant='compare-chart-column'][data-cell-color='grey']) {
                --compare-chart-cell-bg: var(--color-gray-100, #f8f8f8);
            }

            :host([variant='compare-chart-column']) .seg-detail {
                text-align: center;
                font: var(--type-body-xs, 14px/20px 'Adobe Clean', sans-serif);
                padding: 0 var(--compare-chart-card-padding);
            }
            :host([variant='compare-chart-column']) ::slotted(p),
            :host([variant='compare-chart-column']) ::slotted(a) {
                margin: 0 !important;
            }

            :host([variant='compare-chart-column']) .seg-cta {
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
                box-sizing: border-box;
            }
            :host([variant='compare-chart-column']) slot[name='cta'],
            :host([variant='compare-chart-column']) ::slotted([slot='cta']) {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }

            /* Inner stacking inside header */
            :host([variant='compare-chart-column']) .seg-header {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            /* display:block so slotted blocks participate in normal flow. */
            :host([variant='compare-chart-column']) slot[name='header'],
            :host([variant='compare-chart-column']) slot[name='price'],
            :host([variant='compare-chart-column']) slot[name='detail'],
            :host([variant='compare-chart-column']) slot[name='icons'],
            :host([variant='compare-chart-column']) slot[name='badge'] {
                display: block;
            }
            /* Equal chip / row heights — vars stamped on <mas-compare-chart>
           from measured .seg-* wrappers (see #adjustSlotHeights). */
            :host([variant='compare-chart-column']) .seg-header {
                min-height: var(
                    --consonant-merch-card-compare-chart-header-height
                );
            }
            :host([variant='compare-chart-column']) .seg-price {
                min-height: var(
                    --consonant-merch-card-compare-chart-price-height
                );
            }
            :host([variant='compare-chart-column']) .seg-detail {
                min-height: var(
                    --consonant-merch-card-compare-chart-detail-height
                );
            }
            :host([variant='compare-chart-column']) .seg-cta {
                min-height: var(
                    --consonant-merch-card-compare-chart-cta-height
                );
            }
        `;
    }
    return {
        'compare-chart-column': {
            class: CompareChartColumn,
            fragmentMapping: COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING,
            style: CompareChartColumn.templateStyle,
        },
    };
}
