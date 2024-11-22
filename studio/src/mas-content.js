import { LitElement, html, nothing, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactiveStore/storeController.js';
import Store from './store.js';
import './mas-fragment-render.js';
import './mas-fragment-table.js';
import { reactiveStore } from './reactiveStore/reactiveStore.js';
import { MerchCardEditor } from './editors/merch-card-editor.js';

const tooltipTimeout = reactiveStore(null);

class MasContent extends LitElement {
    createRenderRoot() {
        return this;
    }

    loading = new StoreController(this, Store.fragments.loading);
    fragments = new StoreController(this, Store.fragments.data);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);

    handleClick(event) {
        if (this.selecting.value) return;
        clearTimeout(tooltipTimeout.get());
        const currentTarget = event.currentTarget;
        tooltipTimeout.set(
            setTimeout(() => {
                currentTarget.classList.add('has-tooltip');
            }, 500),
        );
    }

    handleMouseLeave(event) {
        if (this.selecting.value) return;
        clearTimeout(tooltipTimeout.get());
        event.currentTarget.classList.remove('has-tooltip');
    }

    edit(id) {
        return function (event) {
            clearTimeout(tooltipTimeout.get());
            event.currentTarget.classList.remove('has-tooltip');
            const isNew = id !== Store.fragments.inEdit.get();
            if (MerchCardEditor.setPosition(event.clientX) || isNew)
                Store.fragments.inEdit.set(id);
        };
    }

    get renderView() {
        return html`
            <div id="render">
                ${repeat(
                    this.fragments.value,
                    (fragmentStore) => fragmentStore.get().path,
                    (fragmentStore) =>
                        html`<overlay-trigger placement="top"
                            ><mas-fragment-render
                                slot="trigger"
                                .store=${fragmentStore}
                                @click=${this.handleClick}
                                @mouseleave=${this.handleMouseLeave}
                                @dblclick=${this.edit(fragmentStore.get().id)}
                            ></mas-fragment-render
                            ><sp-tooltip slot="hover-content" placement="top"
                                >Double click the card to start
                                editing.</sp-tooltip
                            >
                        </overlay-trigger>`,
                )}
            </div>
        `;
    }

    get tableView() {
        return html`<sp-table
            emphasized
            scroller
            selects=${this.selecting.value ? 'multiple' : undefined}
            @change=${this.handleTableSelectionChange}
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
                        html`<overlay-trigger placement="top"
                            ><mas-fragment-table
                                slot="trigger"
                                .store=${fragmentStore}
                                @dblclick=${this.edit(fragmentStore.get().id)}
                            ></mas-fragment-table
                            ><sp-tooltip slot="hover-content" placement="top"
                                >Double click the card to start
                                editing.</sp-tooltip
                            >
                        </overlay-trigger>`,
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
        console.log('RERENDER content');
        let view = nothing;
        if (!this.loading.value) {
            switch (this.renderMode.value) {
                case 'render':
                    view = this.renderView;
                    break;
                case 'table':
                    view = this.tableView;
                    break;
            }
        }
        return html`<div id="content">${view} ${this.loadingIndicator}</div>`;
    }
}

customElements.define('mas-content', MasContent);
