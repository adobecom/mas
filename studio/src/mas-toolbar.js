import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/storeController.js';
import Store from './store.js';
import { extractValue, preventDefault } from './utils.js';
import { updateStore } from './store.js';
import './mas-folder-picker.js';
import './aem/mas-filter-panel.js';
import './mas-selection-panel.js';

const renderModes = [
    {
        value: 'render',
        label: 'Render view',
        icon: html`<sp-icon-view-card slot="icon"></sp-icon-view-card>`,
    },
    {
        value: 'table',
        label: 'Table view',
        icon: html`<sp-icon-table slot="icon"></sp-icon-table>`,
    },
];

class MasToolbar extends LitElement {
    static properties = {
        _filtersShown: { state: true },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            margin-top: 24px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }

        #toolbar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        #actions {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }

        #read,
        #write {
            display: flex;
            gap: 10px;
        }

        #read {
            flex-grow: 1;
        }

        #write {
            margin-left: auto;
        }

        sp-button {
            white-space: nowrap;
        }

        .filters-button {
            border: none;
            font-weight: bold;
        }

        .filters-button:not(.shown) {
            color: var(--spectrum-gray-700);
        }

        .filters-button.shown {
            background-color: var(--spectrum-blue-100);
            color: var(--spectrum-accent-color-1000);
        }

        .filters-button.shown:hover {
            background-color: var(--spectrum-blue-200);
        }

        .filters-badge {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--spectrum-accent-color-1000);
            color: var(--spectrum-white);
            border-radius: 2px;
        }

        sp-search {
            --spectrum-search-border-radius: 16px;
            flex-grow: 1;
            max-width: 400px;
        }
    `;

    constructor() {
        super();
        this._filtersShown = false;
    }

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);

    handleRenderModeChange(ev) {
        localStorage.setItem('mas-render-mode', ev.target.value);
        Store.renderMode.set(ev.target.value);
    }

    get readActions() {
        return html`<div id="read">
            <sp-action-button
                toggles
                label="Filter"
                @click=${() => (this._filtersShown = !this._filtersShown)}
                ?quiet=${!this._filtersShown}
                class="filters-button ${this._filtersShown ? 'shown' : ''}"
            >
                ${!this._filtersShown
                    ? html`<sp-icon-filter-add
                          slot="icon"
                      ></sp-icon-filter-add>`
                    : html`<div slot="icon" class="filters-badge">0</div>`}
                Filter</sp-action-button
            >
            <sp-search
                placeholder="Search"
                @change="${extractValue(updateStore('search.query'))}"
                @submit="${preventDefault(
                    extractValue(updateStore('search.query')),
                )}"
                value=${this.search.value.query}
                size="m"
            ></sp-search>
        </div>`;
    }

    get writeActions() {
        if (this.selecting.value) return nothing;
        return html`<div id="write">
            <sp-button variant="accent" disabled>
                <sp-icon-add slot="icon"></sp-icon-add>
                Create New Card
            </sp-button>
            <sp-button @click=${() => Store.selecting.set(true)}>
                <sp-icon-selection-checked
                    slot="icon"
                ></sp-icon-selection-checked>
                Select
            </sp-button>
            <sp-action-menu
                selects="single"
                value="${this.renderMode.value}"
                placement="bottom"
                @change=${this.handleRenderModeChange}
            >
                ${renderModes.map(
                    ({ value, label, icon }) =>
                        html`<sp-menu-item value="${value}"
                            >${icon} ${label}</sp-menu-item
                        >`,
                )}
            </sp-action-menu>
        </div>`;
    }

    get filtersPanel() {
        if (!this._filtersShown) return nothing;
        return html`<mas-filter-panel></mas-filter-panel>`;
    }

    render() {
        return html`<div id="toolbar">
                <div id="actions">
                    ${this.readActions} ${this.writeActions}
                    ${this.selectionPanel}
                </div>
                ${this.filtersPanel}
            </div>
            <mas-selection-panel></mas-selection-panel>`;
    }
}

customElements.define('mas-toolbar', MasToolbar);
