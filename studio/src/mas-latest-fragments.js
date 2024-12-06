import { html } from 'lit';

import { Fragment } from './aem/fragment.js';
import { AemFragments } from './aem/aem-fragments.js';

/** aem-fragment cache */
let aemFragmentCache;

class MasLatestFragments extends AemFragments {
    static get properties() {
        return {
            loading: { type: Boolean, reflect: true },
            fragments: { type: Array, state: true },
        };
    }

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.fragments = [];
        this.loading = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadLatestFragments();
    }

    async loadLatestFragments() {
        this.loading = true;
        this.fragments = [];
        const cursor = await this.aem.sites.cf.fragments.search(
            {
                sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                path: '/content/dam/mas',
                // tags: ['mas:status/DEMO']
            },
            6,
        );
        const result = await cursor.next();
        this.fragments = result.value.map((item) => new Fragment(item, this));
        this.addToCache(this.fragments);
        this.loading = false;
    }

    renderItem(fragment) {
        return html`<merch-card>
            <aem-fragment fragment="${fragment.id}" ims author></aem-fragment>
            <sp-status-light
                size="l"
                variant="${fragment.statusVariant}"
            ></sp-status-light>
        </merch-card>`;
    }

    render() {
        return html`<h3>Latest Updates</h3>
            <div class="container">
                ${this.fragments.map(this.renderItem)}
            </div>`;
    }
}

customElements.define('mas-latest-fragments', MasLatestFragments);
