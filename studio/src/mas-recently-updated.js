import { html, LitElement, nothing } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import { RECOGNIZED_VARIANT_NAMES } from './editors/variant-picker.js';
import { cardSkeleton } from './mas-content.js';

class MasRecentlyUpdated extends LitElement {
    static get properties() {
        return {
            baseUrl: { type: String, attribute: 'base-url' },
            bucket: { type: String },
        };
    }

    createRenderRoot() {
        return this;
    }

    fragments = new StoreController(this, Store.fragments.recentlyUpdated.data);
    loading = new StoreController(this, Store.fragments.recentlyUpdated.loading);

    get loadingIndicator() {
        if (!this.loading.value) return nothing;
        return html`${Array.from({ length: 3 }, cardSkeleton)}`;
    }

    render() {
        return html`<h2>Recently Updated</h2>
            <div id="recently-updated-container" ?loading=${this.loading.value}>
                ${this.loadingIndicator}
                ${this.fragments.value.map((fragmentStore) => {
                    // Hide the card if the variant isn't recognized by Studio.
                    if (!RECOGNIZED_VARIANT_NAMES.has(fragmentStore.value.variant)) return html``;
                    return html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`;
                })}
            </div>`;
    }
}

customElements.define('mas-recently-updated', MasRecentlyUpdated);
