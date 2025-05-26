import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import { VARIANTS } from './editors/variant-picker.js';
import Store from './store.js';
import './mas-fragment.js';
import Events from './events.js';
import { CARD_MODEL_PATH } from './constants.js';

const variantValues = VARIANTS.map((v) => v.value);
class MasContent extends LitElement {
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.goToFragment = this.goToFragment.bind(this);
        this.subscriptions = [];
    }

    loading = new StoreController(this, Store.fragments.list.loading);
    fragments = new StoreController(this, Store.fragments.list.data);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);

    connectedCallback() {
        super.connectedCallback();
        Events.fragmentAdded.subscribe(this.goToFragment);

        this.subscriptions.push(
            Store.fragments.list.data.subscribe(() => {
                this.requestUpdate();
            }),
        );

        this.subscriptions.push(
            Store.filters.subscribe(() => {
                this.requestUpdate();
            }),
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.fragmentAdded.unsubscribe(this.goToFragment);

        if (this.subscriptions && this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => {
                if (subscription) {
                    subscription.unsubscribe();
                }
            });
        }
        this.subscriptions = [];
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
        return html`
            <div id="render">
                ${repeat(
                    this.fragments.value.filter((fragmentStore) => {
                        const value = fragmentStore.get();
                        if (!value) return false;
                        if (fragmentStore.new) return true;
                        if (
                            value.model?.path === CARD_MODEL_PATH &&
                            !variantValues.includes(fragmentStore.value.variant)
                        )
                            return false;
                        return true;
                    }),
                    (fragmentStore) =>
                        fragmentStore.get()?.path ||
                        fragmentStore.id ||
                        Math.random(),
                    (fragmentStore) =>
                        html`<mas-fragment
                            .fragmentStore=${fragmentStore}
                            view="render"
                        ></mas-fragment>`,
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
                <sp-table-head-cell sortable>Product name</sp-table-head-cell>
                <sp-table-head-cell sortable>Title</sp-table-head-cell>
                <sp-table-head-cell sortable>Name</sp-table-head-cell>
                <sp-table-head-cell sortable>Offer type</sp-table-head-cell>
                <sp-table-head-cell sortable>Price</sp-table-head-cell>
                <sp-table-head-cell sortable>Offer ID</sp-table-head-cell>
                <slot name="headers"></slot>
                <sp-table-head-cell sortable class="status"
                    >Status</sp-table-head-cell
                >
            </sp-table-head>
            <sp-table-body>
                ${repeat(
                    this.fragments.value.filter(
                        (fragmentStore) => fragmentStore.get() !== null,
                    ),
                    (fragmentStore) => fragmentStore.get().path,
                    (fragmentStore) =>
                        html`<mas-fragment
                            .fragmentStore=${fragmentStore}
                            view="table"
                        ></mas-fragment>`,
                )}
            </sp-table-body>
        </sp-table>`;
    }

    get loadingIndicator() {
        if (!this.loading.value) return nothing;
        return html`<sp-progress-circle
            class="fragments"
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
