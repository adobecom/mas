import { html, LitElement, nothing } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import Store from './store.js';
import { VARIANT_NAMES } from './editors/variant-picker.js';

const WHITE_PREVIEW_VARIANTS = new Set([
    VARIANT_NAMES.HEADLESS,
    VARIANT_NAMES.MARQUEE,
    VARIANT_NAMES.FAQ,
    VARIANT_NAMES.BANNER_BLADE,
]);

/**
 * Headless-style templates draw no card background, so their preview needs a white popover to stay readable.
 * @param {string} [variant] fragment variant
 * @returns {boolean}
 */
function isWhitePreviewVariant(variant) {
    return WHITE_PREVIEW_VARIANTS.has(variant);
}

class MasCardPreview extends LitElement {
    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [Store.preview]);
    }

    get id() {
        return Store.preview.value.id;
    }

    get variant() {
        return Store.preview.value.variant;
    }

    get positionStyle() {
        let styleString = '';
        for (const [key, value] of Object.entries(Store.preview.value.position)) {
            if (value === undefined) continue;
            styleString += `${key}:${value};`;
        }
        return styleString;
    }

    createRenderRoot() {
        return this;
    }

    async updated() {
        if (!this.id) return;
        const aemFragment = this.querySelector('aem-fragment');
        const merchCard = this.querySelector('merch-card');
        if (aemFragment) await aemFragment.updateComplete;
        if (merchCard?.checkReady) await merchCard.checkReady();
        this.querySelector('sp-progress-circle')?.remove();
    }

    render() {
        if (!this.id) return nothing;
        return html`<div class="preview-container">
            <div class="preview-backdrop"></div>
            <div
                class="preview-popover${isWhitePreviewVariant(this.variant) ? ' white-background' : ''}"
                style=${this.positionStyle}
            >
                <div class="preview-content">
                    <merch-card>
                        <aem-fragment author ims fragment="${this.id}"></aem-fragment>
                    </merch-card>
                    <sp-progress-circle class="preview" indeterminate size="l"></sp-progress-circle>
                </div>
            </div>
        </div>`;
    }
}

customElements.define('mas-card-preview', MasCardPreview);

function openPreview(id, position, variant) {
    Store.preview.set({ id, position, variant });
}

function closePreview() {
    Store.preview.set(null);
}

export { openPreview, closePreview, isWhitePreviewVariant };
