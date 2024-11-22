import { LitElement, html, nothing } from 'lit';
import StoreController from './reactiveStore/storeController.js';
import Store from './store.js';
import { toggleSelection } from './storeUtils.js';

class MasFragmentRender extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        selected: { state: true },
    };

    constructor() {
        super();
        this.selected = false;
    }

    createRenderRoot() {
        return this;
    }

    selecting = new StoreController(this, Store.selecting);

    connectedCallback() {
        super.connectedCallback();
        this.fragment = new StoreController(this, this.store);
        this.selected = Store.selection.get().includes(this.fragment.value.id);
    }

    select() {
        this.selected = !this.selected;
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
        console.log('RERENDER fragment card (render)');
        return html`<merch-card>
            <aem-fragment
                fragment="${this.fragment.value.id}"
                ims
            ></aem-fragment>
            <sp-status-light
                size="l"
                variant="${this.fragment.value.statusVariant}"
            ></sp-status-light>
            ${this.selectionOverlay}
        </merch-card>`;
    }
}

customElements.define('mas-fragment-render', MasFragmentRender);
