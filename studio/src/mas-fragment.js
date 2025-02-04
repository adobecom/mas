import { LitElement, html, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store, { editFragment } from './store.js';
import './mas-fragment-render.js';
import './mas-fragment-table.js';
import { reactiveStore } from './reactivity/reactive-store.js';

const tooltipTimeout = reactiveStore(null);

class MasFragment extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        view: { type: String, attribute: true }, // 'render' | 'table'
    };

    createRenderRoot() {
        return this;
    }

    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);

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

    edit(event) {
        if (Store.selecting.get()) return;
        // Remove tooltip
        clearTimeout(tooltipTimeout.get());
        event.currentTarget.classList.remove('has-tooltip');
        // Handle edit
        editFragment(this.store, event.clientX);
    }

    get renderView() {
        if (this.view !== 'render') return nothing;
        const fragment = this.store.get();
        const selected = this.selection.value.includes(fragment.id);
        return html`<mas-fragment-render
            class="mas-fragment"
            data-id=${fragment.id}
            .store=${this.store}
            ?selected=${selected}
            @click=${this.handleClick}
            @mouseleave=${this.handleMouseLeave}
            @dblclick=${this.edit}
        ></mas-fragment-render>`;
    }

    get tableView() {
        if (this.view !== 'table') return nothing;
        const fragment = this.store.get();
        return html`<overlay-trigger placement="top"
            ><mas-fragment-table
                class="mas-fragment"
                data-id=${fragment.id}
                slot="trigger"
                .store=${this.store}
                @click=${this.handleClick}
                @mouseleave=${this.handleMouseLeave}
                @dblclick=${this.edit}
            ></mas-fragment-table
            ><sp-tooltip slot="hover-content" placement="top"
                >Double click the card to start editing.</sp-tooltip
            >
        </overlay-trigger>`;
    }

    render() {
        return html`${this.renderView} ${this.tableView}`;
    }
}

customElements.define('mas-fragment', MasFragment);
