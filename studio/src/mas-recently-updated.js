import { html, LitElement, nothing } from 'lit';

import { Fragment } from './aem/fragment.js';
import { AEM } from './aem/aem.js';

class MasRecentlyUpdated extends LitElement {
    static get properties() {
        return {
            baseUrl: { type: String, attribute: 'base-url' },
            bucket: { type: String },
            fragments: { type: Array, state: true },
            loading: { type: Boolean, reflect: true },
            path: { type: String },
            source: { type: String },
        };
    }

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.fragments = [];
        this.loading = true;
        this.renderItem = this.renderItem.bind(this);
    }

    updated(changedProperties) {
        if (changedProperties.has('path')) this.loadFragments();
    }

    connectedCallback() {
        super.connectedCallback();
        this.aem = new AEM(this.bucket, this.baseUrl);
        this.source = document.getElementById(this.source);
        this.loadFragments();
    }

    handleClick(e) {
        clearTimeout(this.tooltipTimeout);
        const currentTarget = e.currentTarget;
        this.tooltipTimeout = setTimeout(() => {
            currentTarget.classList.add('has-tooltip');
        }, 500);
    }

    handleMouseLeave(e) {
        clearTimeout(this.tooltipTimeout);
        e.currentTarget.classList.remove('has-tooltip');
    }

    handleDoubleClick(e, fragment) {
        clearTimeout(this.tooltipTimeout);
        e.currentTarget.classList.remove('has-tooltip');
        this.source.selectFragment(e.clientX, e.clientY, fragment);
    }

    async loadFragments() {
        this.loading = true;
        this.fragments = [];
        const cursor = await this.aem.sites.cf.fragments.search(
            {
                sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                path: `/content/dam/mas/${this.path}`,
                // tags: ['mas:status/DEMO']
            },
            6,
        );
        const result = await cursor.next();
        this.fragments = result.value.map((item) => new Fragment(item, this));
        this.source.addToCache(this.fragments);
        this.loading = false;
    }

    renderItem(fragment) {
        return html`<merch-card
            @click="${this.handleClick}"
            @mouseleave="${this.handleMouseLeave}"
            @dblclick="${(e) => this.handleDoubleClick(e, fragment)}"
        >
            <aem-fragment fragment="${fragment.id}" ims author></aem-fragment>
            <sp-status-light
                size="l"
                variant="${fragment.statusVariant}"
            ></sp-status-light>
        </merch-card>`;
    }

    render() {
        if (!this.path) return nothing;
        return html` <h2>Recently Updated</h2>
            <div class="container">
                ${this.fragments.map(this.renderItem)}
            </div>`;
    }
}

customElements.define('mas-recently-updated', MasRecentlyUpdated);
