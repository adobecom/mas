import { html } from '../base-element.js';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './compare-chart-column.css.js';

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

/**
 * Sync keys and shadow DOM selectors for {@link VariantLayout#updateCardElementMinHeight}.
 * Wrappers (not inner <slot>) are measured so bordered chips match row mates.
 */
const HEIGHT_SYNC_TARGETS = [
    { key: 'header', selector: '.seg-header' },
    { key: 'price', selector: '.seg-price' },
    { key: 'detail', selector: '.seg-detail' },
    { key: 'cta', selector: '.seg-cta' },
];

export class CompareChartColumn extends VariantLayout {
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
            this.card.closest('mas-compare-chart') ?? this.card.parentElement
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
            this.updateCardElementMinHeight(root.querySelector(selector), key),
        );
    }

    renderLayout() {
        return html`
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

    static variantStyle = SHADOW_CSS;
}
