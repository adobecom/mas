import { LitElement, html, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { toggleSelection } from './store.js';
import './mas-fragment-status.js';

class MasFragmentRender extends LitElement {
    static properties = {
        selected: { type: Boolean, attribute: true },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
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
                ? html`<sp-icon-remove slot="icon"></sp-icon-remove>`
                : html`<sp-icon-add slot="icon"></sp-icon-add>`}
        </div>`;
    }

    render() {
        return html`<div class="render-card">
            <div class="render-card-header">
                <div class="render-card-actions"></div>
                <mas-fragment-status
                    variant=${this.fragment.value.statusVariant}
                ></mas-fragment-status>
            </div>
            <overlay-trigger placement="top">
                <merch-card slot="trigger">
                    <aem-fragment
                        fragment="${this.fragment.value.id}"
                        ims
                        author
                    ></aem-fragment>
                    ${this.selectionOverlay} </merch-card
                ><sp-tooltip slot="hover-content" placement="top"
                    >Double click the card to start editing.</sp-tooltip
                >
            </overlay-trigger>
        </div>`;
    }
}

customElements.define('mas-fragment-render', MasFragmentRender);
