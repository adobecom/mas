import { css, html, LitElement, nothing } from 'lit';
import { EVENT_CHANGE, EVENT_LOAD } from '../events.js';

const MODE = 'table';

class TableView extends LitElement {
    static get styles() {
        return css`
            :host {
                display: contents;
            }

            sp-table {
                height: var(--table-height, 100%);
                margin: 20px 16px;
            }
        `;
    }

    static get properties() {
        return {
            rowCount: { type: Number, attribute: 'row-count' },
            customRenderItem: { type: Function },
        };
    }

    constructor() {
        super();
        this.forceUpdate = this.forceUpdate.bind(this);
        this.itemValue = this.itemValue.bind(this);
        this.renderItem = this.renderItem.bind(this);
    }

    get table() {
        return this.shadowRoot?.querySelector('sp-table');
    }

    get tableBody() {
        return this.table?.querySelector('sp-table-body');
    }

    canRender() {
        return this.parentElement?.mode === MODE && this.parentElement.source;
    }

    render() {
        // TODO check why table does not clear when fragments are empty
        if (!this.canRender()) return nothing;
        return html`
            <sp-table
                emphasized
                scroller
                .itemValue=${this.itemValue}
                .renderItem=${this.renderItem}
                selects=${this.parentElement.inSelection
                    ? 'multiple'
                    : undefined}
                @change=${this.handleTableSelectionChange}
                @dblclick="${this.handleDoubleClick}"
            >
                <sp-table-head>
                    <sp-table-head-cell sortable>Title</sp-table-head-cell>
                    <sp-table-head-cell sortable>Name</sp-table-head-cell>
                    <slot name="headers"></slot>
                    <sp-table-head-cell sortable>Status</sp-table-head-cell>
                    <sp-table-head-cell sortable
                        >Modified at</sp-table-head-cell
                    >
                    <sp-table-head-cell sortable
                        >Modified by</sp-table-head-cell
                    >
                </sp-table-head>
            </sp-table>
        `;
    }

    updated() {
        (async () => {
            if (this.table) {
                if (!this.parentElement.inSelection) {
                    this.table.deselectAllRows();
                }
                this.table.items = this.parentElement.source.fragments;
                this.table.renderVirtualizedItems(); /* hack: force to render when items.lenght = 0 */
            }
        })();
    }

    itemValue(item) {
        return item.id;
    }

    renderItem(item) {
        if (!item) return nothing;
        return html` <sp-table-cell>${item.title}</sp-table-cell>
            <sp-table-cell>${item.name}</sp-table-cell>
            ${this.customRenderItem?.(item)}
            <sp-table-cell>${item.status}</sp-table-cell>
            <sp-table-cell>${item.modified.at}</sp-table-cell>
            <sp-table-cell>${item.modified.by}</sp-table-cell>`;
    }

    handleDoubleClick(e) {
        if (this.parentElement.inSelection) return;
        const { value } = e.target.closest('sp-table-row');
        if (!value) return;
        const fragment = this.parentElement.source.fragments.find(
            (f) => f.id === value,
        );
        if (!fragment) return;
        this.parentElement.source.selectFragment(
            e.clientX,
            e.clientY,
            fragment,
        );
    }

    connectedCallback() {
        super.connectedCallback();

        // resize the table height based on the row count
        if (this.rowCount) {
            this.style.setProperty('--table-height', `${this.rowCount * 40}px`);
        }

        this.parentElement.addEventListener(EVENT_CHANGE, this.forceUpdate);
        this.parentElement.source.addEventListener(
            EVENT_LOAD,
            this.forceUpdate,
        );
        this.parentElement.source.addEventListener(
            EVENT_CHANGE,
            this.forceUpdate,
        );
    }

    async forceUpdate() {
        this.requestUpdate();
    }

    handleTableSelectionChange(e) {
        const { selected } = e.target;
        this.parentElement.source.fragments.forEach((fragment) => {
            fragment.toggleSelection(selected.includes(fragment.id));
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    get actionData() {
        return [
            'table',
            'Table view',
            html`<sp-icon-table slot="icon"></sp-icon-table>`,
        ];
    }
}

customElements.define('table-view', TableView);
