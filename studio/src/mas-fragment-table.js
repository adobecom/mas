import { LitElement, html } from 'lit';
import StoreController from './reactivity/storeController.js';

class MasFragmentTable extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
    };

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fragment = new StoreController(this, this.store);
    }

    render() {
        const data = this.fragment.value;
        return html`<sp-table-row value="${data.id}"
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
