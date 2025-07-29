import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import './mas-folder-picker.js';
import './aem/mas-filter-panel.js';
import './mas-selection-panel.js';
import './mas-create-dialog.js';
import './mas-copy-dialog.js';

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

const contentTypes = [
    {
        value: 'merch-card',
        label: 'Merch Card',
    },
    {
        value: 'merch-card-collection',
        label: 'Merch Card Collection',
    },
];

class MasToolbar extends LitElement {
    static properties = {
        createDialogOpen: { state: true },
        selectedContentType: { state: true },
        filterCount: { state: true },
        copyDialogOpen: { state: true },
        fragmentToCopy: { state: true },
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
            cursor: default;
        }

        .filters-button:not(.shown) {
            background-color: #fff;
            color: var(--spectrum-gray-700);
        }

        .filters-button.shown {
            background-color: var(--spectrum-blue-100);
            color: var(--spectrum-accent-color-1000);
        }

        .filters-button.shown:hover {
            background-color: var(--spectrum-blue-200);
        }

        .filters-button:not(.shown):hover {
            background-color: var(--spectrum-actionbutton-background-color-hover);
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

        #search-results-label {
            color: var(--spectrum-gray-700);
        }
    `;

    constructor() {
        super();
        this.createDialogOpen = false;
        this.selectedContentType = 'merch-card';
        this.filterCount = 0;
        this.copyDialogOpen = false;
        this.fragmentToCopy = null;

        this.handleCopyToFolder = this.handleCopyToFolder.bind(this);
    }

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    loading = new StoreController(this, Store.fragments.list.loading);

    connectedCallback() {
        super.connectedCallback();

        this.updateFilterCount();

        this.filtersSubscription = Store.filters.subscribe(() => {
            this.updateFilterCount();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.filtersSubscription) {
            this.filtersSubscription.unsubscribe();
        }
    }

    updateFilterCount() {
        const filters = Store.filters.get();
        if (!filters || !filters.tags) {
            this.filterCount = 0;
            return;
        }

        if (typeof filters.tags === 'string') {
            this.filterCount = filters.tags.split(',').filter(Boolean).length;
        } else if (Array.isArray(filters.tags)) {
            this.filterCount = filters.tags.filter(Boolean).length;
        } else {
            this.filterCount = 0;
        }
    }

    handleRenderModeChange(ev) {
        localStorage.setItem('mas-render-mode', ev.target.value);
        Store.renderMode.set(ev.target.value);
    }

    updateQuery(value) {
        Store.search.set((prev) => ({ ...prev, query: value }));
    }

    get popover() {
        return this.shadowRoot.querySelector('sp-popover');
    }

    selectContentType(type) {
        this.selectedContentType = type;
        this.popover.open = false;
        this.openCreateDialog();
    }

    openCreateDialog() {
        this.createDialogOpen = true;
    }

    handleSearchSubmit(ev) {
        ev.preventDefault();
        this.updateQuery(ev.target.value);
    }

    handleChange(ev) {
        if (ev.target.value === '') {
            this.updateQuery('');
        }
    }

    get searchAndFilterControls() {
        return html`<div id="read">
            <sp-action-button
                toggles
                label="Filter"
                @click="${this.onShowFilter}"
                class="filters-button ${this.filterCount > 0 ? 'shown' : ''}"
            >
                ${!this.filterCount > 0
                    ? html`<sp-icon-filter-add slot="icon"></sp-icon-filter-add>`
                    : html`<div slot="icon" class="filters-badge">${this.filterCount}</div>`}
                Filter</sp-action-button
            >
            <sp-search
                placeholder="Search"
                @submit="${this.handleSearchSubmit}"
                @change=${this.handleChange}
                value=${this.search.value.query}
                size="m"
            ></sp-search>
        </div>`;
    }

    get createButton() {
        return html`<overlay-trigger id="trigger" placement="bottom" offset="6">
            <sp-button variant="accent" slot="trigger">
                <sp-icon-add slot="icon"></sp-icon-add>
                Create
            </sp-button>
            <sp-popover slot="click-content" direction="bottom" tip>
                <sp-menu>
                    ${contentTypes.map(
                        ({ value, label }) => html`
                            <sp-menu-item @click=${() => this.selectContentType(value)}>
                                ${label}
                                <sp-icon-add slot="icon"></sp-icon-add>
                            </sp-menu-item>
                        `,
                    )}
                </sp-menu>
            </sp-popover>
        </overlay-trigger> `;
    }

    get contentManagementControls() {
        if (this.selecting.value) return nothing;
        return html`<div id="write">
            ${this.createButton}
            <sp-button @click=${() => Store.selecting.set(true)}>
                <sp-icon-selection-checked slot="icon"></sp-icon-selection-checked>
                Select
            </sp-button>
            <sp-action-menu
                selects="single"
                value="${this.renderMode.value}"
                placement="bottom"
                @change=${this.handleRenderModeChange}
            >
                ${renderModes.map(
                    ({ value, label, icon }) => html`<sp-menu-item value="${value}">${icon} ${label}</sp-menu-item>`,
                )}
            </sp-action-menu>
        </div>`;
    }

    get filtersPanel() {
        return html`<mas-filter-panel></mas-filter-panel>`;
    }

    get searchResultsLabel() {
        if (this.loading.value || !this.search.value.query) return nothing;
        return html`<span id="search-results-label">Search results for "${this.search.value.query}"</span>`;
    }

    handleSelectionPanelClose() {
        Store.selecting.set(false);
    }

    handleCopyToFolder(fragmentOrSelection) {
        let fragment = fragmentOrSelection;
        
        // Handle case where entire selection array is passed
        if (Array.isArray(fragmentOrSelection) && fragmentOrSelection.length > 0) {
            const firstId = fragmentOrSelection[0];
            if (typeof firstId === 'string') {
                // Find the fragment by ID
                const fragmentStores = Store.fragments.list.data.get();
                const fragmentStore = fragmentStores.find(store => store.get().id === firstId);
                if (fragmentStore) {
                    fragment = fragmentStore.get();
                } else {
                    console.error('Could not find fragment with ID:', firstId);
                    return;
                }
            }
        }
        
        if (fragment && !Array.isArray(fragment)) {
            this.fragmentToCopy = fragment;
            this.copyDialogOpen = true;
        }
    }

    handleFragmentCopied() {
        this.copyDialogOpen = false;
        this.fragmentToCopy = null;
        Store.selection.set([]);
        Store.selecting.set(false);
    }

    render() {
        return html`<div id="toolbar">
                <div id="actions">${this.searchAndFilterControls} ${this.contentManagementControls} ${this.selectionPanel}</div>
                ${this.filtersPanel}${this.searchResultsLabel}
            </div>
            <mas-selection-panel
                ?open=${this.selecting.value}
                .selectionStore=${Store.selection}
                .onCopyToFolder=${this.handleCopyToFolder}
                @close=${this.handleSelectionPanelClose}
            ></mas-selection-panel>
            ${this.createDialogOpen
                ? html`<mas-create-dialog
                      type=${this.selectedContentType}
                      @close=${() => (this.createDialogOpen = false)}
                  ></mas-create-dialog>`
                : nothing}
            ${this.copyDialogOpen && this.fragmentToCopy
                ? html`<mas-copy-dialog
                      .fragment=${this.fragmentToCopy}
                      @fragment-copied=${this.handleFragmentCopied}
                      @dialog-closed=${() => {
                          this.copyDialogOpen = false;
                          this.fragmentToCopy = null;
                      }}
                  ></mas-copy-dialog>`
                : nothing} `;
    }
}

customElements.define('mas-toolbar', MasToolbar);
