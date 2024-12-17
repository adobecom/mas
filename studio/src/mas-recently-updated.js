import { html, LitElement, nothing } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';

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
    loading = new StoreController(
        this,
        Store.fragments.recentlyUpdated.loading,
    );

    get loadingIndicator() {
        if (!this.loading.value) return nothing;
        return html`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
    }

    render() {
        return html`<h2>Recently Updated</h2>
            <div id="recently-updated-container" ?loading=${this.loading.value}>
                ${this.loadingIndicator}
                ${this.fragments.value.map(
                    (fragmentStore) =>
                        html`<mas-fragment
                            .store=${fragmentStore}
                            view="render"
                        ></mas-fragment>`,
                )}
            </div>`;
    }
}

customElements.define('mas-recently-updated', MasRecentlyUpdated);
