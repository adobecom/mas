import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactiveStore/storeController.js';
import Store from './store.js';
import './mas-fragment-render.js';
import './mas-fragment-table.js';
import { reactiveStore } from './reactiveStore/reactiveStore.js';
import { isInSelection } from './storeUtils.js';
import Events from './events.js';
import { editFragment } from './editors/merch-card-editor.js';

const tooltipTimeout = reactiveStore(null);

class MasContent extends LitElement {
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.goToFragment = this.goToFragment.bind(this);
    }

    loading = new StoreController(this, Store.fragments.loading);
    fragments = new StoreController(this, Store.fragments.data);
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
            if (Store.selecting.get()) return;
            // Remove tooltip
            clearTimeout(tooltipTimeout.get());
            event.currentTarget.classList.remove('has-tooltip');
            // Handle edit
            editFragment(id, event.clientX);
        };
    }

    get renderView() {
        return html`
            <div id="render">
                ${repeat(
                    this.fragments.value,
                    (fragmentStore) => fragmentStore.get().path,
                    (fragmentStore) => {
                        const fragment = fragmentStore.get();
                        const selected = isInSelection(fragment.id);
                        return html`<overlay-trigger placement="top"
                            ><mas-fragment-render
                                class="mas-fragment"
                                data-id=${fragment.id}
                                slot="trigger"
                                .store=${fragmentStore}
                                ?selected=${selected}
                                @click=${this.handleClick}
                                @mouseleave=${this.handleMouseLeave}
                                @dblclick=${this.edit(fragment.id)}
                            ></mas-fragment-render
                            ><sp-tooltip slot="hover-content" placement="top"
                                >Double click the card to start
                                editing.</sp-tooltip
                            >
                        </overlay-trigger>`;
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
                    (fragmentStore) => {
                        const fragment = fragmentStore.get();
                        return html`<overlay-trigger placement="top"
                            ><mas-fragment-table
                                class="mas-fragment"
                                data-id=${fragment.id}
                                slot="trigger"
                                .store=${fragmentStore}
                                @click=${this.handleClick}
                                @mouseleave=${this.handleMouseLeave}
                                @dblclick=${this.edit(fragment.id)}
                            ></mas-fragment-table
                            ><sp-tooltip slot="hover-content" placement="top"
                                >Double click the card to start
                                editing.</sp-tooltip
                            >
                        </overlay-trigger>`;
                    },
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
