import { html, LitElement, nothing } from 'lit';
import { MasFetcher } from './mas-fetcher.js';
import Store from './store.js';
import StoreController from './reactivity/storeController.js';
import { Fragment } from './aem/fragment.js';

class MasRecentlyUpdated extends LitElement {
    static get properties() {
        return {
            baseUrl: { type: String, attribute: 'base-url' },
            bucket: { type: String },
            loading: { type: Boolean, reflect: true },
        };
    }

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.path = null;
        this.loading = true;
        this.updatePath = this.updatePath.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        Store.search.subscribe(this.updatePath);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.search.unsubscribe(this.updatePath);
    }

    updatePath(value) {
        if (this.path === value.path) return;
        this.path = value.path;
        this.loadFragments();
    }

    fragments = new StoreController(this, Store.fragments.data);

    /** @type {MasFetcher} */
    get fetcher() {
        return document.querySelector('mas-fetcher');
    }

    async loadFragments() {
        this.loading = true;
        await this.fetcher.loadRecentlyUpdatedFragments(this.path, 6);
        this.loading = false;
    }

    render() {
        if (!this.path || this.loading) return nothing;
        return html`<h2>Recently Updated</h2>
            <div id="recently-updated-container">
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
