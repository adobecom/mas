import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactiveStore/storeController.js';
import Store from './store.js';
import { extractValue, preventDefault } from './utils.js';
import { updateStore } from './storeUtils.js';
import './aem/mas-filter-panel.js';

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
        _showFilters: { state: true },
    };
    static styles = css`
        :host {
            display: block;
            width: 100%;
            padding-inline: 30px;
            margin-block: 20px;
            box-sizing: border-box;
        }

        #toolbar {
            display: flex;
            flex-direction: column;
            gap: 10px;

            & #actions {
                display: grid;
                grid-template-columns: min-content auto min-content;
                gap: 10px;

                & #read,
                #write {
                    display: flex;
                    flex-wrap: nowrap;
                    gap: 10px;
                }

                & #read {
                    flex-grow: 1;
                    justify-content: end;
                }
            }
        }

        #folder-select {
            flex-shrink: 0;
        }

        @media only screen and (max-width: 1350px) {
            #toolbar #actions {
                grid-template-columns: min-content auto;

                & #read {
                    flex-wrap: wrap;
                }

                & #write {
                    grid-column: 1 / -1;
                    justify-content: end;
                }
            }
        }
    `;

    constructor() {
        super();
        this._showFilters = false;
    }

    folders = new StoreController(this, Store.folders);
    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);

    toggleSelectionMode() {}

    handleRenderModeChange(ev) {
        localStorage.setItem('mas-render-mode', ev.target.value);
        Store.renderMode.set(ev.target.value);
    }

    get filtersPanel() {
        if (!this._showFilters) return nothing;
        return html`<mas-filter-panel></mas-filter-panel>`;
    }

    render() {
        console.log('RERENDER toolbar');
        return html`<div id="toolbar">
            <div id="actions">
                <sp-picker
                    @change=${(ev) =>
                        Store.search.update((prev) => ({
                            ...prev,
                            path: ev.target.value,
                        }))}
                    label="Top folder"
                    size="m"
                    value=${this.search.value.path}
                    ?disabled=${this.selecting.value}
                    id="folder-select"
                >
                    ${this.folders.value.map(
                        (folder) =>
                            html`<sp-menu-item value=${folder}>
                                ${folder.toUpperCase()}
                            </sp-menu-item>`,
                    )}
                </sp-picker>
                <div id="read">
                    <sp-button
                        label="Filter"
                        variant="secondary"
                        @click=${() => (this._showFilters = !this._showFilters)}
                        >Filter</sp-button
                    >
                    <sp-picker label="Sort" disabled>
                        <sp-menu-item>Ascending</sp-menu-item>
                        <sp-menu-item>Descending</sp-menu-item>
                    </sp-picker>
                    <sp-search
                        placeholder="Search"
                        @change="${extractValue(updateStore('search.query'))}"
                        @submit="${preventDefault(
                            extractValue(updateStore('search.query')),
                        )}"
                        value=${this.search.value.query}
                        size="m"
                    ></sp-search>
                    <variant-picker
                        id="vpick"
                        show-all="true"
                        default-value="${this.variant}"
                        disabled
                        @change="${this.handleVariantChange}"
                    ></variant-picker>
                    <sp-button @click=${this.doSearch}>Search</sp-button>
                </div>
                <div id="write">
                    <sp-action-button emphasized disabled>
                        <sp-icon-new-item slot="icon"></sp-icon-new-item>
                        Create New Card
                    </sp-action-button>
                    <sp-action-button
                        @click=${() => Store.selecting.update((prev) => !prev)}
                    >
                        <sp-icon-selection-checked
                            slot="icon"
                        ></sp-icon-selection-checked>
                        Select
                    </sp-action-button>
                    <sp-action-menu
                        selects="single"
                        value="${this.renderMode.value}"
                        placement="left-end"
                        @change=${this.handleRenderModeChange}
                    >
                        ${renderModes.map(
                            ({ value, label, icon }) =>
                                html`<sp-menu-item value="${value}"
                                    >${icon} ${label}</sp-menu-item
                                >`,
                        )}
                    </sp-action-menu>
                </div>
            </div>
            ${this.filtersPanel}
        </div>`;
    }
}

customElements.define('mas-toolbar', MasToolbar);
