import { VariantLayout } from './variant-layout.js';
import { CSS } from './headless.css.js';
import { HEADLESS_FAMILY_STYLE } from './headless.js';
import { escapeHTML } from '../utils.js';
import {
    makeRefreshBackgroundsDetail,
    makeToggleBackgroundsDetail,
    renderBackgroundsDetailRow,
    renderBackgroundsToggleButton,
    bindBackgroundsPreview,
} from './backgrounds-preview.js';

/** AEM fragment field → slot mapping so hydrate() can populate all Marquee slots. */
export const MARQUEE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    image: { tag: 'picture', slot: 'image' },
    backgrounds: { tag: 'picture', slot: 'backgrounds' },
    title: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    shortDescription: { tag: 'p', slot: 'short-description' },
    prices: { tag: 'p', slot: 'prices' },
    ctas: { slot: 'footer', size: 'm' },
};

/**
 * Slot name to display label for Marquee variant (label + value only, no card).
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const MARQUEE_FIELDS = [
    { slot: 'image', label: 'Image' },
    { slot: 'backgrounds', label: 'Background' },
    { slot: 'heading-xs', label: 'Title' },
    { slot: 'body-xs', label: 'Product description' },
    { slot: 'short-description', label: 'Short Description' },
    { slot: 'prices', label: 'Product price' },
    { slot: 'footer', label: 'CTAs' },
];

export class Marquee extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    toggleBackgroundsDetail = makeToggleBackgroundsDetail(() => this.card);

    refreshBackgroundsDetail = makeRefreshBackgroundsDetail(() => this.card);

    renderLayout() {
        const rows = MARQUEE_FIELDS.map(({ slot, label }) => {
            const isBackgrounds = slot === 'backgrounds';
            return `<div class="headless-row"><span class="headless-label">${escapeHTML(label)}</span><span class="headless-value" data-slot="${escapeHTML(slot)}"><slot name="${escapeHTML(slot)}"></slot>${isBackgrounds ? ` ${renderBackgroundsToggleButton()}` : ''}</span></div>${isBackgrounds ? renderBackgroundsDetailRow() : ''}`;
        }).join('');
        const secureLabel = this.card.secureLabel
            ? `<div class="headless-row"><span class="headless-label">Secure label</span><span class="headless-value">${this.secureLabel}</span></div>`
            : '';
        return `<div class="headless">${rows}${secureLabel}</div>`;
    }

    bindEvents(root) {
        bindBackgroundsPreview(root, {
            toggle: this.toggleBackgroundsDetail,
            refresh: this.refreshBackgroundsDetail,
        });
    }

    static variantStyle = HEADLESS_FAMILY_STYLE;
}
