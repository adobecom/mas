import { LitElement, html, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import './mas-fragment-render.js';
import './mas-fragment-table.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import Store, { editFragment } from './store.js';
import { styles } from './mas-fragment.css.js';

const tooltipTimeout = new ReactiveStore(null);

class MasFragment extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        view: { type: String, attribute: true }, // 'render' | 'table'
    };

    static styles = [styles];

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
        editFragment(this.fragmentStore, event.clientX);
    }

    get renderView() {
        if (this.view !== 'render') return nothing;
        const selected = this.selection.value.includes(this.fragmentStore.id);
        return html`<mas-fragment-render
            class="mas-fragment"
            data-id=${this.fragmentStore.id}
            .fragmentStore=${this.fragmentStore}
            ?selected=${selected}
            @click=${this.handleClick}
            @mouseleave=${this.handleMouseLeave}
            @dblclick=${this.edit}
        ></mas-fragment-render>`;
    }

    get tableView() {
        if (this.view !== 'table') return nothing;
        const fragment = this.fragmentStore.get();
        return html`<overlay-trigger placement="top"
            ><mas-fragment-table
                class="mas-fragment"
                data-id=${fragment.id}
                slot="trigger"
                .fragmentStore=${this.fragmentStore}
                @click=${this.handleClick}
                @mouseleave=${this.handleMouseLeave}
                @dblclick=${this.edit}
            ></mas-fragment-table
            ><sp-tooltip slot="hover-content" placement="top">Double click the card to start editing.</sp-tooltip>
        </overlay-trigger>`;
    }

    render() {
        return html`${this.renderView} ${this.tableView}`;
    }
}

customElements.define('mas-fragment', MasFragment);
