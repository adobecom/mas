import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import Events from './events.js';

// Mock data for placeholders
const MOCK_PLACEHOLDERS = [
    {
        key: '30-days-free',
        value: 'Essai gratuit pendant 30 jours',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat',
        value: 'Acrobat',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-export-pdf',
        value: 'Acrobat Document PDF',
        locale: 'Canada_French',
        state: 'Customized',
        status: 'Yet to Publish',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-pdf-pack',
        value: 'Acrobat PDF Ensemble',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-pro',
        value: 'Acrobat Pro',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-pro-2020',
        value: 'Acrobat Pro 2020',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-reader',
        value: 'Acrobat Reader',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-sign',
        value: 'Acrobat Sign',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-standard',
        value: 'Acrobat Standard',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'acrobat-standard-2020',
        value: 'Acrobat Standard 2020',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'add',
        value: 'Ajouter',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'add-to-cart',
        value: 'Ajouter au panier',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
    {
        key: 'adobe-acrobat',
        value: 'Adobe Acrobat',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
    },
];

class MasPlaceholders extends LitElement {
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.placeholders = MOCK_PLACEHOLDERS;
        this.selectedLocale = 'Canada_French';
        this.searchQuery = '';
        this.selectedPlaceholders = [];
        this.loading = false;
    }

    // In a real implementation, these would be connected to the Store
    // placeholders = new StoreController(this, Store.placeholders.list.data);
    // loading = new StoreController(this, Store.placeholders.list.loading);
    // selectedLocale = new StoreController(this, Store.placeholders.selectedLocale);
    // selection = new StoreController(this, Store.placeholders.selection);

    connectedCallback() {
        super.connectedCallback();
        // In a real implementation, we would fetch placeholders here
        // Events.placeholderAdded.subscribe(this.handlePlaceholderAdded);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Events.placeholderAdded.unsubscribe(this.handlePlaceholderAdded);
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.requestUpdate();
    }

    handleLocaleChange(e) {
        this.selectedLocale = e.target.value;
        this.requestUpdate();
    }

    handleAddPlaceholder() {
        // In a real implementation, this would open a dialog or navigate to a form
        console.log('Add placeholder clicked');
    }

    handleExport() {
        // In a real implementation, this would trigger an export process
        console.log('Export clicked');
    }

    updateTableSelection(event) {
        this.selectedPlaceholders = Array.from(event.target.selectedSet);
        this.requestUpdate();
        // In a real implementation:
        // Store.placeholders.selection.set(Array.from(event.target.selectedSet));
    }

    getFilteredPlaceholders() {
        if (!this.searchQuery) return this.placeholders;

        return this.placeholders.filter(
            (placeholder) =>
                placeholder.key
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()) ||
                placeholder.value
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()),
        );
    }

    getStatusBadge(status) {
        if (status === 'Published') {
            return html`<sp-badge quiet variant="positive"
                >Published</sp-badge
            >`;
        } else if (status === 'Yet to Publish') {
            return html`<sp-badge quiet variant="neutral"
                >Yet to Publish</sp-badge
            >`;
        }
        return html`<sp-badge quiet>${status}</sp-badge>`;
    }

    renderPlaceholdersTable() {
        const filteredPlaceholders = this.getFilteredPlaceholders();

        return html`
            <sp-table
                emphasized
                scroller
                selects="multiple"
                selected=${JSON.stringify(this.selectedPlaceholders)}
                @change=${this.updateTableSelection}
            >
                <sp-table-head>
                    <sp-table-head-cell sortable>Key</sp-table-head-cell>
                    <sp-table-head-cell sortable>Value</sp-table-head-cell>
                    <sp-table-head-cell sortable>Locale</sp-table-head-cell>
                    <sp-table-head-cell sortable>State</sp-table-head-cell>
                    <sp-table-head-cell sortable>Status</sp-table-head-cell>
                    <sp-table-head-cell sortable>Updated by</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        filteredPlaceholders,
                        (placeholder) => placeholder.key,
                        (placeholder) => html`
                            <sp-table-row value=${placeholder.key}>
                                <sp-table-cell
                                    >${placeholder.key}</sp-table-cell
                                >
                                <sp-table-cell
                                    >${placeholder.value}</sp-table-cell
                                >
                                <sp-table-cell
                                    >${placeholder.locale.replace(
                                        '_',
                                        '_',
                                    )}</sp-table-cell
                                >
                                <sp-table-cell
                                    >${placeholder.state}</sp-table-cell
                                >
                                <sp-table-cell
                                    >${this.getStatusBadge(
                                        placeholder.status,
                                    )}</sp-table-cell
                                >
                                <sp-table-cell
                                    >${placeholder.updatedBy}</sp-table-cell
                                >
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
    }

    render() {
        return html`
            <div id="placeholders-container">
                <div class="placeholders-header">
                    <div class="placeholders-title">
                        <h2>Total Placeholders ${this.placeholders.length}</h2>
                    </div>
                    <div class="placeholders-actions">
                        <sp-search-field
                            placeholder="Search by name, offer ID, locale"
                            @input=${this.handleSearch}
                            value=${this.searchQuery}
                        ></sp-search-field>

                        <sp-picker
                            label="Locale"
                            value=${this.selectedLocale}
                            @change=${this.handleLocaleChange}
                        >
                            <sp-menu-item value="Canada_French"
                                >Canada_French</sp-menu-item
                            >
                            <sp-menu-item value="US_English"
                                >US_English</sp-menu-item
                            >
                            <sp-menu-item value="UK_English"
                                >UK_English</sp-menu-item
                            >
                        </sp-picker>

                        <sp-button
                            variant="primary"
                            @click=${this.handleAddPlaceholder}
                        >
                            <sp-icon-add slot="icon"></sp-icon-add>
                            Add Placeholder
                        </sp-button>

                        <sp-button
                            variant="secondary"
                            @click=${this.handleExport}
                        >
                            <sp-icon-export slot="icon"></sp-icon-export>
                            Export
                        </sp-button>
                    </div>
                </div>

                <div class="placeholders-content">
                    ${this.renderPlaceholdersTable()} ${this.loadingIndicator}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);

// Add some basic styles
const style = document.createElement('style');
style.textContent = `
    #placeholders-container {
        padding: 16px;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    
    .placeholders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .placeholders-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    
    .placeholders-content {
        flex: 1;
        position: relative;
        overflow: auto;
    }
    
    sp-progress-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
`;
document.head.appendChild(style);
