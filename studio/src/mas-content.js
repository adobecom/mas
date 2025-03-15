import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from './editors/variant-picker.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import './mas-fragment.js';
import Events from './events.js';

class MasContent extends LitElement {
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.goToFragment = this.goToFragment.bind(this);
    }

    loading = new StoreController(this, Store.fragments.list.loading);
    fragments = new StoreController(this, Store.fragments.list.data);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);

    connectedCallback() {
        super.connectedCallback();
        Events.fragmentAdded.subscribe(this.goToFragment);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.fragmentAdded.unsubscribe(this.goToFragment);
    }

    async goToFragment(id, skipUpdate = false) {
        if (!skipUpdate) await this.updateComplete;

        const fragmentElement = document.querySelector(
            `.mas-fragment[data-id="${id}"]`,
        );
        if (!fragmentElement) return;

        fragmentElement.scrollIntoView({ behavior: 'smooth' });
    }

    get renderView() {
        const variantValues = VARIANTS.map((v) => v.value);
        return html`
            <div id="render">
                ${repeat(
                    this.fragments.value,
                    (fragmentStore) => fragmentStore.get().path,
                    (fragmentStore) => {
                        // Hide the card if the variant isn't one of VARIANTS that is pre-defined.
                        if (
                            !variantValues.includes(fragmentStore.value.variant)
                        )
                            return html``;
                        return html`<mas-fragment
                            .store=${fragmentStore}
                            view="render"
                        ></mas-fragment>`;
                    },
                )}
            </div>
        `;
    }

    updateTableSelection(event) {
        Store.selection.set(Array.from(event.target.selectedSet));
    }

    get tableView() {
        return html`<sp-table
            emphasized
            scroller
            selects=${this.selecting.value ? 'multiple' : undefined}
            selected=${JSON.stringify(this.selection.value)}
            @change=${this.updateTableSelection}
        >
            <sp-table-head>
                <sp-table-head-cell sortable>Title</sp-table-head-cell>
                <sp-table-head-cell sortable>Name</sp-table-head-cell>
                <slot name="headers"></slot>
                <sp-table-head-cell sortable>Status</sp-table-head-cell>
                <sp-table-head-cell sortable>Modified at</sp-table-head-cell>
                <sp-table-head-cell sortable>Modified by</sp-table-head-cell>
            </sp-table-head>
            <sp-table-body>
                ${repeat(
                    this.fragments.value,
                    (fragmentStore) => fragmentStore.get().path,
                    (fragmentStore) =>
                        html`<mas-fragment
                            .store=${fragmentStore}
                            view="table"
                        ></mas-fragment>`,
                )}
            </sp-table-body>
        </sp-table>`;
    }

    get loadingIndicator() {
        if (!this.loading.value) return nothing;
        return html`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
    }

    render() {
        let view = nothing;
        switch (this.renderMode.value) {
            case 'render':
                view = this.renderView;
                break;
            case 'table':
                view = this.tableView;
                break;
            default:
                view = this.renderView;
        }
        return html`<div id="content">${view} ${this.loadingIndicator}</div>`;
    }
}

customElements.define('mas-content', MasContent);
