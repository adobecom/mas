import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import Events from './events.js';
import { MOCK_PLACEHOLDERS } from './data/mock-placeholders.js';
import { styles } from './styles/mas-placeholders.css.js';

class MasPlaceholders extends LitElement {
    static get styles() {
        return styles;
    }

    constructor() {
        super();
        this.placeholders = MOCK_PLACEHOLDERS;
        this.selectedLocale = 'Canada_French';
        this.searchQuery = '';
        this.selectedPlaceholders = [];
        this.loading = false;
        this.sortField = 'key';
        this.sortDirection = 'asc';
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.activeDropdown = null;
        this.showCreateModal = false;
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: 'USA_English',
            localeConfig: 'region-specific',
        };

        // Define default column widths
        this.columnWidths = {
            key: '25%',
            value: '25%',
            locale: '10%',
            state: '10%',
            status: '10%',
            updatedBy: '10%',
            updatedAt: '10%',
            action: '10%',
        };

        // Bind methods
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleCreateModalClickOutside =
            this.handleCreateModalClickOutside.bind(this);
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

        // Add click outside listener for dropdown menus
        document.addEventListener('click', this.handleClickOutside);
        document.addEventListener('click', this.handleCreateModalClickOutside);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Events.placeholderAdded.unsubscribe(this.handlePlaceholderAdded);

        // Remove click outside listener
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener(
            'click',
            this.handleCreateModalClickOutside,
        );
    }

    handleClickOutside(event) {
        if (
            this.activeDropdown &&
            !event.target.closest('.dropdown-menu') &&
            !event.target.closest('.action-menu-button')
        ) {
            this.activeDropdown = null;
            this.requestUpdate();
        }
    }

    handleCreateModalClickOutside(event) {
        if (
            this.showCreateModal &&
            !event.target.closest('.create-placeholder-modal') &&
            !event.target.closest('.create-button')
        ) {
            this.closeCreateModal();
        }
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
        // Show the create placeholder modal
        this.showCreateModal = true;
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: 'USA_English',
            localeConfig: 'region-specific', // Default to region specific
        };
        this.requestUpdate();
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

    handleSort(field) {
        if (this.sortField === field) {
            // Toggle direction if clicking the same field
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Default to ascending for a new sort field
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.requestUpdate();
    }

    startEditing(placeholder) {
        // Cancel any existing edit
        if (this.editingPlaceholder) {
            this.cancelEdit();
        }

        // Start editing the selected placeholder
        this.editingPlaceholder = placeholder.key;
        this.editedKey = placeholder.key;
        this.editedValue = placeholder.value;
        this.requestUpdate();
    }

    saveEdit() {
        if (!this.editingPlaceholder) return;

        // Validate the value is not empty
        if (!this.editedValue.trim()) {
            // Show error message or handle validation
            console.error('Value cannot be empty');
            return;
        }

        // Find and update the placeholder
        const index = this.placeholders.findIndex(
            (p) => p.key === this.editingPlaceholder,
        );
        if (index !== -1) {
            // Create a new object to trigger reactivity
            const updatedPlaceholder = {
                ...this.placeholders[index],
                key: this.editedKey,
                value: this.editedValue,
                updatedAt: new Date().toLocaleString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            };

            // Update the array
            this.placeholders = [
                ...this.placeholders.slice(0, index),
                updatedPlaceholder,
                ...this.placeholders.slice(index + 1),
            ];

            // Reset editing state
            this.editingPlaceholder = null;
            this.editedKey = '';
            this.editedValue = '';
            this.requestUpdate();
        }
    }

    cancelEdit() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.requestUpdate();
    }

    toggleDropdown(key, event) {
        // Prevent the event from bubbling up
        event.stopPropagation();

        if (this.activeDropdown === key) {
            this.activeDropdown = null;
        } else {
            this.activeDropdown = key;
        }
        this.requestUpdate();
    }

    handleLocaleConfig(key) {
        console.log(`Configure locale for: ${key}`);
        this.activeDropdown = null;
        this.requestUpdate();
    }

    handleDelete(key) {
        console.log(`Delete placeholder: ${key}`);
        // In a real implementation, show confirmation dialog and delete
        this.placeholders = this.placeholders.filter((p) => p.key !== key);
        this.activeDropdown = null;
        this.requestUpdate();
    }

    handleKeyChange(e) {
        this.editedKey = e.target.value;
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;
    }

    getFilteredPlaceholders() {
        if (!this.searchQuery) {
            return this.getSortedPlaceholders(this.placeholders);
        }

        const filtered = this.placeholders.filter(
            (placeholder) =>
                placeholder.key
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()) ||
                placeholder.value
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()),
        );

        return this.getSortedPlaceholders(filtered);
    }

    getSortedPlaceholders(placeholders) {
        return [...placeholders].sort((a, b) => {
            const aValue = a[this.sortField];
            const bValue = b[this.sortField];

            const comparison = aValue.localeCompare(bValue);
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
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

    renderBreadcrumbs() {
        return html`
            <div class="breadcrumbs">
                <a href="?page=welcome" class="breadcrumb-link">Home</a>
                <sp-icon-chevron-right
                    class="breadcrumb-chevron"
                ></sp-icon-chevron-right>
                <span class="breadcrumb-current">Placeholder</span>
            </div>
        `;
    }

    renderDropdownMenu(key) {
        if (this.activeDropdown !== key) return nothing;

        return html`
            <div class="dropdown-menu">
                <div
                    class="dropdown-item"
                    @click=${() => this.handleLocaleConfig(key)}
                >
                    <sp-icon-settings></sp-icon-settings>
                    <span>Locale Configure</span>
                </div>
                <div
                    class="dropdown-item"
                    @click=${() => this.handleDelete(key)}
                >
                    <sp-icon-delete></sp-icon-delete>
                    <span>Delete</span>
                </div>
            </div>
        `;
    }

    renderActionCell(placeholder) {
        const key = placeholder.key;

        if (this.editingPlaceholder === key) {
            return html`
                <sp-table-cell
                    class="action-cell"
                    style="text-align: right; width: ${this.columnWidths
                        .action};"
                >
                    <div class="action-buttons">
                        <button
                            class="action-button save-button"
                            @click=${this.saveEdit}
                            title="Save"
                        >
                            <sp-icon-checkmark></sp-icon-checkmark>
                        </button>
                        <button
                            class="action-button cancel-button"
                            @click=${this.cancelEdit}
                            title="Cancel"
                        >
                            <sp-icon-close></sp-icon-close>
                        </button>
                    </div>
                </sp-table-cell>
            `;
        }

        return html`
            <sp-table-cell
                class="action-cell"
                style="text-align: right; width: ${this.columnWidths.action};"
            >
                <div class="action-buttons">
                    <button
                        class="action-button edit-button"
                        @click=${() => this.startEditing(placeholder)}
                        title="Edit"
                    >
                        <sp-icon-edit></sp-icon-edit>
                    </button>
                    <button
                        class="action-button action-menu-button"
                        @click=${(e) => this.toggleDropdown(key, e)}
                        title="More actions"
                    >
                        <sp-icon-more></sp-icon-more>
                    </button>
                    ${this.renderDropdownMenu(key)}
                </div>
            </sp-table-cell>
        `;
    }

    renderKeyCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell
                    class="editing-cell"
                    style="width: ${this.columnWidths.key};"
                >
                    <div class="edit-field-container">
                        <sp-textfield
                            value=${this.editedKey}
                            @input=${this.handleKeyChange}
                        ></sp-textfield>
                    </div>
                </sp-table-cell>
            `;
        }

        return html`<sp-table-cell style="width: ${this.columnWidths.key};"
            >${placeholder.key}</sp-table-cell
        >`;
    }

    renderValueCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell
                    class="editing-cell"
                    style="width: ${this.columnWidths.value};"
                >
                    <div class="edit-field-container">
                        <sp-textfield
                            value=${this.editedValue}
                            @input=${this.handleValueChange}
                        ></sp-textfield>
                        ${!this.editedValue.trim()
                            ? html`<div class="validation-error">
                                  Values cannot be empty
                              </div>`
                            : nothing}
                    </div>
                </sp-table-cell>
            `;
        }

        return html`<sp-table-cell style="width: ${this.columnWidths.value};"
            >${placeholder.value}</sp-table-cell
        >`;
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
                class="placeholders-table"
            >
                <sp-table-head>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('key')}
                        style="width: ${this.columnWidths.key};"
                    >
                        Key
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('value')}
                        style="width: ${this.columnWidths.value};"
                    >
                        Value
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('locale')}
                        style="width: ${this.columnWidths
                            .locale}; text-align: right;"
                    >
                        Locale
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('state')}
                        style="width: ${this.columnWidths
                            .state}; text-align: right;"
                    >
                        State
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('status')}
                        style="width: ${this.columnWidths
                            .status}; text-align: right;"
                    >
                        Status
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('updatedBy')}
                        style="width: ${this.columnWidths
                            .updatedBy}; text-align: right;"
                    >
                        Updated by
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        @click=${() => this.handleSort('updatedAt')}
                        style="width: ${this.columnWidths
                            .updatedAt}; text-align: right;"
                    >
                        Date & Time
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        style="width: ${this.columnWidths
                            .action}; text-align: right;"
                    >
                        Action
                    </sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        filteredPlaceholders,
                        (placeholder) => placeholder.key,
                        (placeholder) => html`
                            <sp-table-row value=${placeholder.key}>
                                ${this.renderKeyCell(placeholder)}
                                ${this.renderValueCell(placeholder)}
                                <sp-table-cell style="text-align: right;"
                                    >${placeholder.locale}</sp-table-cell
                                >
                                <sp-table-cell style="text-align: right;"
                                    >${placeholder.state}</sp-table-cell
                                >
                                <sp-table-cell style="text-align: right;"
                                    >${this.getStatusBadge(
                                        placeholder.status,
                                    )}</sp-table-cell
                                >
                                <sp-table-cell style="text-align: right;"
                                    >${placeholder.updatedBy}</sp-table-cell
                                >
                                <sp-table-cell style="text-align: right;"
                                    >${placeholder.updatedAt}</sp-table-cell
                                >
                                ${this.renderActionCell(placeholder)}
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

    closeCreateModal() {
        this.showCreateModal = false;
        this.requestUpdate();
    }

    handleNewPlaceholderKeyChange(e) {
        this.newPlaceholder.key = e.target.value;
        this.requestUpdate();
    }

    handleNewPlaceholderValueChange(e) {
        this.newPlaceholder.value = e.target.value;
        this.requestUpdate();
    }

    handleNewPlaceholderLocaleChange(e) {
        this.newPlaceholder.locale = e.target.value;
        this.requestUpdate();
    }

    handleNewPlaceholderLocaleConfigChange(value) {
        this.newPlaceholder.localeConfig = value;
        this.requestUpdate();
    }

    createPlaceholder() {
        // Validate inputs
        if (!this.newPlaceholder.key.trim()) {
            console.error('Key cannot be empty');
            return;
        }
        if (!this.newPlaceholder.value.trim()) {
            console.error('Value cannot be empty');
            return;
        }

        // Create new placeholder
        const newPlaceholder = {
            key: this.newPlaceholder.key,
            value: this.newPlaceholder.value,
            locale: this.newPlaceholder.locale,
            state:
                this.newPlaceholder.localeConfig === 'region-specific'
                    ? 'Default'
                    : 'Customized',
            status: 'Yet to Publish',
            updatedBy: 'Current User',
            updatedAt: new Date().toLocaleString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        };

        // Add to placeholders array
        this.placeholders = [newPlaceholder, ...this.placeholders];

        // Close modal
        this.closeCreateModal();
    }

    renderCreatePlaceholderModal() {
        if (!this.showCreateModal) return nothing;

        return html`
            <div class="modal-overlay">
                <div class="create-placeholder-modal">
                    <h2>Create Placeholder</h2>

                    <div class="modal-form">
                        <div class="form-group">
                            <label for="placeholder-key"
                                >Enter Key
                                <span class="required">*</span></label
                            >
                            <sp-textfield
                                id="placeholder-key"
                                value=${this.newPlaceholder.key}
                                @input=${this.handleNewPlaceholderKeyChange}
                                placeholder="Key"
                            ></sp-textfield>
                        </div>

                        <div class="form-group">
                            <label for="placeholder-locale"
                                >Choose Locale
                                <span class="required">*</span></label
                            >
                            <sp-picker
                                id="placeholder-locale"
                                value=${this.newPlaceholder.locale}
                                @change=${this.handleNewPlaceholderLocaleChange}
                            >
                                <sp-menu-item value="USA_English"
                                    >USA_English</sp-menu-item
                                >
                                <sp-menu-item value="Canada_French"
                                    >Canada_French</sp-menu-item
                                >
                                <sp-menu-item value="UK_English"
                                    >UK_English</sp-menu-item
                                >
                            </sp-picker>
                        </div>

                        <div class="form-group">
                            <label for="placeholder-value"
                                >Enter Value
                                <span class="required">*</span></label
                            >
                            <sp-textfield
                                id="placeholder-value"
                                value=${this.newPlaceholder.value}
                                @input=${this.handleNewPlaceholderValueChange}
                                placeholder="Value"
                            ></sp-textfield>
                        </div>

                        <div class="form-group">
                            <label>Locale Configuration</label>
                            <div class="locale-config-options">
                                <div
                                    class="locale-config-option ${this
                                        .newPlaceholder.localeConfig ===
                                    'region-specific'
                                        ? 'selected'
                                        : ''}"
                                >
                                    <div
                                        class="radio-container"
                                        @click=${() =>
                                            this.handleNewPlaceholderLocaleConfigChange(
                                                'region-specific',
                                            )}
                                    >
                                        <div
                                            class="radio-button ${this
                                                .newPlaceholder.localeConfig ===
                                            'region-specific'
                                                ? 'selected'
                                                : ''}"
                                        >
                                            <div class="radio-inner"></div>
                                        </div>
                                    </div>
                                    <div class="option-content">
                                        <h3>Create Region Specific</h3>
                                        <p>
                                            Placeholder created only for chosen
                                            locale
                                        </p>
                                    </div>
                                </div>

                                <div
                                    class="locale-config-option ${this
                                        .newPlaceholder.localeConfig ===
                                    'global'
                                        ? 'selected'
                                        : ''}"
                                >
                                    <div
                                        class="radio-container"
                                        @click=${() =>
                                            this.handleNewPlaceholderLocaleConfigChange(
                                                'global',
                                            )}
                                    >
                                        <div
                                            class="radio-button ${this
                                                .newPlaceholder.localeConfig ===
                                            'global'
                                                ? 'selected'
                                                : ''}"
                                        >
                                            <div class="radio-inner"></div>
                                        </div>
                                    </div>
                                    <div class="option-content">
                                        <h3>Create Across Globe</h3>
                                        <p>
                                            Placeholder created for all the
                                            available list of locale
                                        </p>
                                    </div>
                                </div>

                                <div
                                    class="locale-config-option ${this
                                        .newPlaceholder.localeConfig ===
                                    'custom'
                                        ? 'selected'
                                        : ''}"
                                >
                                    <div
                                        class="radio-container"
                                        @click=${() =>
                                            this.handleNewPlaceholderLocaleConfigChange(
                                                'custom',
                                            )}
                                    >
                                        <div
                                            class="radio-button ${this
                                                .newPlaceholder.localeConfig ===
                                            'custom'
                                                ? 'selected'
                                                : ''}"
                                        >
                                            <div class="radio-inner"></div>
                                        </div>
                                    </div>
                                    <div class="option-content">
                                        <h3>Create Custom</h3>
                                        <p>Placeholder created all the</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <sp-button
                            variant="secondary"
                            @click=${this.closeCreateModal}
                        >
                            Cancel
                        </sp-button>
                        <sp-button
                            variant="accent"
                            @click=${this.createPlaceholder}
                        >
                            Create
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div id="placeholders-container">
                <div class="breadcrumbs-container">
                    ${this.renderBreadcrumbs()}
                </div>

                <div class="placeholders-header">
                    <div class="placeholders-title">
                        <h2>Total Placeholders ${this.placeholders.length}</h2>
                    </div>
                    <div class="placeholders-actions">
                        <sp-button
                            variant="accent"
                            @click=${this.handleAddPlaceholder}
                            class="create-button"
                        >
                            <sp-icon-add slot="icon"></sp-icon-add>
                            Create New Placeholder
                        </sp-button>
                    </div>
                </div>

                <div class="search-filters-container">
                    <sp-search
                        placeholder="Search by name, offer ID, locale"
                        @input=${this.handleSearch}
                        value=${this.searchQuery}
                    ></sp-search>

                    <div class="filters-container">
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

                ${this.renderCreatePlaceholderModal()}
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
