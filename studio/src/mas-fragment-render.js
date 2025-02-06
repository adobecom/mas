import { LitElement, html, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { toggleSelection } from './store.js';
import './mas-fragment-status.js';

class MasFragmentRender extends LitElement {
    static properties = {
        selected: { type: Boolean, attribute: true },
        store: { type: Object, attribute: false },
        unkown: { type: Boolean, attribute: true, reflect: true },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.selected = false;
        this.unkown = null;
    }

    selecting = new StoreController(this, Store.selecting);

    connectedCallback() {
        super.connectedCallback();
        this.fragment = new StoreController(this, this.store);
    }

    select() {
        toggleSelection(this.fragment.value.id);
    }

    get selectionOverlay() {
        if (!this.selecting.value) return nothing;
        return html`<div class="overlay" @click="${this.select}">
            ${this.selected
                ? html`<sp-icon-remove
                      slot="icon"
                      label="Remove from selection"
                  ></sp-icon-remove>`
                : html`<sp-icon-add
                      slot="icon"
                      label="Add to selection"
                  ></sp-icon-add>`}
        </div>`;
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        this.checkUnkown();
    }

    async checkUnkown() {
        if (this.unkown !== null) return;
        const element = this.querySelector('aem-fragment').parentElement;
        await element.checkReady?.(); // elements in MAS Studio should provide an checkReady method for Studio to know when they finish rendering.
        this.unkown = !element.querySelector('div');
    }

    get coverageIcon() {
        if (!this.unkown) return nothing;
        return html`<sp-icon-cover-image
            label="Fragment could not be rendered"
            size="xxl"
        ></sp-icon-cover-image>`;
    }

    render() {
        return html`<div class="render-card">
            <div class="render-card-header">
                <mas-fragment-status
                    variant=${this.fragment.value.statusVariant}
                ></mas-fragment-status>
            </div>
            <overlay-trigger placement="top">
                <div slot="trigger">
                    <merch-card>
                        <aem-fragment
                            fragment="${this.fragment.value.id}"
                            ims
                            author
                        ></aem-fragment>
                        ${this.selectionOverlay} 
                    </merch-card>
                    ${this.coverageIcon}
                <div>
                <sp-tooltip slot="hover-content" placement="top">Double click the card to start editing.</sp-tooltip>
            </overlay-trigger>
        </div>`;
    }
}

customElements.define('mas-fragment-render', MasFragmentRender);
