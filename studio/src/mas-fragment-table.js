import { LitElement, html } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';

class MasFragmentTable extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        customRender: { type: Function, attribute: false },
    };

    #reactiveControllers = new ReactiveController(this);

    createRenderRoot() {
        return this;
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#reactiveControllers.updateStores([this.fragmentStore]);
        }
        super.update(changedProperties);
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
