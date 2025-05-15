import { LitElement, html } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from './editor-panel.js';
import Store from './store.js';

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

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const fragmentParts = getFragmentPartsToUse(Store, data).fragmentParts;
        return `${webComponentName}: ${fragmentParts}`;
    }

    render() {
        const data = this.fragmentStore.value;
        return html`<sp-table-row value="${data.id}"
            ><sp-table-cell>${data.title}</sp-table-cell>
            <sp-table-cell>${this.getFragmentName(data)}</sp-table-cell>
            ${this.customRender?.(data)}
            <sp-table-cell>${data.status}</sp-table-cell>
            <sp-table-cell>${data.modified.at}</sp-table-cell>
            <sp-table-cell>${data.modified.by}</sp-table-cell></sp-table-row
        >`;
    }
}

customElements.define('mas-fragment-table', MasFragmentTable);
