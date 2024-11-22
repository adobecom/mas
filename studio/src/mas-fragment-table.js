import { LitElement, html } from 'lit';
import StoreController from './reactiveStore/storeController.js';
import { toggleSelection } from './storeUtils.js';
import Store from './store.js';

class MasFragmentTable extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
    };

    constructor() {
        super();
        this.selected = false;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fragment = new StoreController(this, this.store);
        this.selected = Store.selection.get().includes(this.fragment.value.id);
    }

    select(event) {
        this.selected = !this.selected;
        toggleSelection(this.fragment.value.id);
    }

    render() {
        console.log('RERENDER fragment card (table)');
        const data = this.fragment.value;
        return html`<sp-table-row
            value="${data.id}"
            @change=${this.select}
            ?selected=${this.selected}
            ><sp-table-cell>${data.title}</sp-table-cell>
            <sp-table-cell>${data.name}</sp-table-cell>
            ${this.customRender?.(data)}
            <sp-table-cell>${data.status}</sp-table-cell>
            <sp-table-cell>${data.modified.at}</sp-table-cell>
            <sp-table-cell>${data.modified.by}</sp-table-cell></sp-table-row
        >`;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
