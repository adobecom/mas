import { LitElement, html } from 'lit';
import StoreController from './reactiveStore/storeController.js';
import { toggleSelection } from './storeUtils.js';
import Store from './store.js';

class MasFragmentTable extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
    };

    createRenderRoot() {
        return this;
    }

    selection = new StoreController(this, Store.selection);

    connectedCallback() {
        super.connectedCallback();
        this.fragment = new StoreController(this, this.store);
    }

    select() {
        toggleSelection(this.fragment.value.id);
    }

    render() {
        console.log('RERENDER fragment card (table)');
        const data = this.fragment.value;
        return html`<sp-table-row
            value="${data.id}"
            @change=${this.select}
            ?selected=${this.selection.value.includes(this.fragment.value.id)}
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
