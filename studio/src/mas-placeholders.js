import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import Events from './events.js';
import './filters/mas-placeholders-filters.js';

// Mock data for placeholders
const MOCK_PLACEHOLDERS = [
    {
        key: '30-days-free',
        value: 'Essai gratuit pendant 30 jours',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat',
        value: 'Acrobat',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-export-pdf',
        value: 'Acrobat Document PDF',
        locale: 'Canada_French',
        state: 'Customized',
        status: 'Yet to Publish',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-pdf-pack',
        value: 'Acrobat PDF Ensemble',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-pro',
        value: 'Acrobat Pro',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-pro-2020',
        value: 'Acrobat Pro 2020',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-reader',
        value: 'Acrobat Reader',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-sign',
        value: 'Acrobat Sign',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-standard',
        value: 'Acrobat Standard',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'acrobat-standard-2020',
        value: 'Acrobat Standard 2020',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'add',
        value: 'Ajouter',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'add-to-cart',
        value: 'Ajouter au panier',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
    },
    {
        key: 'adobe-acrobat',
        value: 'Adobe Acrobat',
        locale: 'Canada_French',
        state: 'Default',
        status: 'Published',
        updatedBy: 'Nicholas',
        updatedAt: '23 Feb, 2024 at 13:00',
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
        this.sortField = 'key';
        this.sortDirection = 'asc';
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.draftStatus = false;
        this.activeDropdown = null;
        this.showCreateModal = false;
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: 'USA_English',
            localeConfig: 'region-specific',
        };
        this.appliedFilters = {
            locale: [],
            key: [],
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
        this.handleFiltersApplied = this.handleFiltersApplied.bind(this);
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

        // Listen for filters applied event
        this.addEventListener('filters-applied', this.handleFiltersApplied);
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

        // Remove filters applied listener
        this.removeEventListener('filters-applied', this.handleFiltersApplied);
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
            !event.target.closest('.create-modal-content') &&
            !event.target.closest('.create-button')
        ) {
            // Don't close if clicking on the modal overlay itself
            if (event.target.closest('.create-modal-overlay')) {
                return;
            }
            this.closeCreateModal();
        }
    }

    closeCreateModal() {
        this.showCreateModal = false;
        this.requestUpdate();
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
        this.draftStatus = false;
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
                status: this.draftStatus ? 'Draft' : this.placeholders[index].status,
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
            this.draftStatus = false;
            this.requestUpdate();
        }
    }

    cancelEdit() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.draftStatus = false;
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
        this.draftStatus = true;
        this.requestUpdate();
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;
        this.draftStatus = true;
        this.requestUpdate();
    }

    handleFiltersApplied(event) {
        this.appliedFilters = event.detail.filters;
        this.requestUpdate();
    }

    openFiltersModal() {
        const filtersModal = this.querySelector('mas-placeholders-filters');
        if (filtersModal) {
            filtersModal.open();
        }
    }

    getFilteredPlaceholders() {
        let filtered = this.placeholders;

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(
                (placeholder) =>
                    placeholder.key
                        .toLowerCase()
                        .includes(this.searchQuery.toLowerCase()) ||
                    placeholder.value
                        .toLowerCase()
                        .includes(this.searchQuery.toLowerCase()),
            );
        }

        // Apply locale filters
        if (this.appliedFilters.locale.length > 0) {
            filtered = filtered.filter((placeholder) =>
                this.appliedFilters.locale.includes(placeholder.locale),
            );
        }

        // Apply key filters
        if (this.appliedFilters.key.length > 0) {
            filtered = filtered.filter((placeholder) =>
                this.appliedFilters.key.some((key) =>
                    placeholder.key.includes(key),
                ),
            );
        }

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
        } else if (status === 'Draft') {
            return html`<sp-badge quiet style="background-color: var(--spectrum-blue-800); color: white;"
                >Draft</sp-badge
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

    renderStatusCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key && this.draftStatus) {
            return html`
                <sp-table-cell style="text-align: right; width: ${this.columnWidths.status};">
                    ${this.getStatusBadge('Draft')}
                </sp-table-cell>
            `;
        }
        
        return html`
            <sp-table-cell style="text-align: right; width: ${this.columnWidths.status};">
                ${this.getStatusBadge(placeholder.status)}
            </sp-table-cell>
        `;
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
                                ${this.renderStatusCell(placeholder)}
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

    handleLocaleConfigChange(config) {
        this.newPlaceholder.localeConfig = config;
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

        // Create a new placeholder
        const newPlaceholder = {
            key: this.newPlaceholder.key,
            value: this.newPlaceholder.value,
            locale: this.newPlaceholder.locale,
            state: 'Default',
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

        // Close the modal
        this.closeCreateModal();
    }

    renderCreateModal() {
        if (!this.showCreateModal) return nothing;

        return html`
            <div class="create-modal-overlay">
                <div class="create-modal">
                    <div class="create-modal-content">
                        <h2 class="create-modal-title">Create Placeholder</h2>

                        <div class="create-modal-form">
                            <div class="form-group">
                                <label for="placeholder-key"
                                    >Enter Key
                                    <span class="required">*</span></label
                                >
                                <sp-textfield
                                    id="placeholder-key"
                                    placeholder="Key"
                                    value=${this.newPlaceholder.key}
                                    @input=${this.handleNewPlaceholderKeyChange}
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
                                    @change=${this
                                        .handleNewPlaceholderLocaleChange}
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
                                    placeholder="Value"
                                    value=${this.newPlaceholder.value}
                                    @input=${this
                                        .handleNewPlaceholderValueChange}
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
                                        <sp-radio
                                            checked=${this.newPlaceholder
                                                .localeConfig ===
                                            'region-specific'}
                                            @change=${() =>
                                                this.handleLocaleConfigChange(
                                                    'region-specific',
                                                )}
                                        ></sp-radio>
                                        <div class="locale-config-content">
                                            <h3>Create Region Specific</h3>
                                            <p>
                                                Placeholder created only for
                                                chosen locale
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        class="locale-config-option ${this
                                            .newPlaceholder.localeConfig ===
                                        'across-globe'
                                            ? 'selected'
                                            : ''}"
                                    >
                                        <sp-radio
                                            checked=${this.newPlaceholder
                                                .localeConfig ===
                                            'across-globe'}
                                            @change=${() =>
                                                this.handleLocaleConfigChange(
                                                    'across-globe',
                                                )}
                                        ></sp-radio>
                                        <div class="locale-config-content">
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
                                        <sp-radio
                                            checked=${this.newPlaceholder
                                                .localeConfig === 'custom'}
                                            @change=${() =>
                                                this.handleLocaleConfigChange(
                                                    'custom',
                                                )}
                                        ></sp-radio>
                                        <div class="locale-config-content">
                                            <h3>Create Custom</h3>
                                            <p>Placeholder created all the</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="create-modal-actions">
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
                            class="filter-button"
                            @click=${this.openFiltersModal}
                        >
                            <sp-icon-filter slot="icon"></sp-icon-filter>
                            Filter
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

                ${this.renderCreateModal()}
                <mas-placeholders-filters></mas-placeholders-filters>
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);

// Add styles
const style = document.createElement('style');
style.textContent = `
    #placeholders-container {
        height: 100%;
        border-radius: 8px;
        padding: 24px;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
    }
    
    .breadcrumbs-container {
        margin-bottom: 16px;
    }
    
    .breadcrumbs {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--spectrum-global-color-gray-700);
    }
    
    .breadcrumb-link {
        color: var(--spectrum-global-color-gray-700);
        text-decoration: none;
    }
    
    .breadcrumb-link:hover {
        text-decoration: underline;
    }
    
    .breadcrumb-chevron {
        margin: 0 8px;
        width: 16px;
        height: 16px;
        color: var(--spectrum-global-color-gray-500);
    }
    
    .breadcrumb-current {
        font-weight: 400;
        color: var(--spectrum-global-color-gray-900);
    }
    
    .placeholders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .placeholders-title h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .search-filters-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .filters-container {
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
    
    .placeholders-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .placeholders-table sp-table-head {
        background-color: var(--spectrum-global-color-gray-100);
    }
    
    .placeholders-table sp-table-head-cell {
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
    }
    
    .placeholders-table sp-table-head-cell sp-icon-chevron-down,
    .placeholders-table sp-table-head-cell sp-icon-chevron-up {
        margin-left: 4px;
    }
    
    /* Remove default sort arrows */
    .placeholders-table sp-table-head-cell[sortable]::after {
        display: none !important;
    }
    
    sp-search {
        width: 300px;
    }
    
    .create-button {
        margin-left: auto;
    }
    
    /* Action column styles */
    .action-cell {
        position: relative;
        box-sizing: border-box;
        width: var(--action-column-width, auto);
    }
    
    .action-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        width: 100%;
    }
    
    .action-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        flex: 0 0 auto;
    }
    
    /* Ensure consistent button sizes */
    .action-button sp-icon-edit,
    .action-button sp-icon-more,
    .action-button sp-icon-checkmark,
    .action-button sp-icon-close {
        width: 18px;
        height: 18px;
    }
    
    .action-button:hover {
        background-color: var(--spectrum-global-color-gray-200);
    }
    
    .save-button {
        color: var(--spectrum-semantic-positive-color-default);
    }
    
    .cancel-button {
        color: var(--spectrum-semantic-negative-color-default);
    }
    
    /* Dropdown menu styles */
    .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 100;
        min-width: 200px;
        padding: 8px 0;
    }
    
    .dropdown-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        gap: 8px;
    }
    
    .dropdown-item:hover {
        background-color: var(--spectrum-global-color-gray-100);
    }
    
    .dropdown-item span {
        flex: 1;
    }
    
    /* Edit mode styles */
    .editing-cell {
        padding: 0 !important;
        box-sizing: border-box;
        vertical-align: middle;
    }
    
    .edit-field-container {
        padding: 8px;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
    }
    
    .edit-field-container sp-textfield {
        width: 100%;
        --spectrum-textfield-height: 32px;
        --spectrum-textfield-padding-top: 0;
        --spectrum-textfield-padding-bottom: 0;
        margin: 0;
    }
    
    /* Make sure table cells have consistent padding */
    .placeholders-table sp-table-cell {
        padding: 8px;
        box-sizing: border-box;
        vertical-align: middle;
        height: 48px; /* Fixed height for all cells */
    }
    
    /* Ensure table rows have consistent height */
    .placeholders-table sp-table-row {
        height: 48px;
        min-height: 48px;
        box-sizing: border-box;
    }
    
    /* Ensure the validation error doesn't break alignment */
    .validation-error {
        position: absolute;
        bottom: -16px;
        left: 8px;
        color: var(--spectrum-semantic-negative-color-default);
        font-size: 12px;
        background-color: white;
        z-index: 1;
    }
    
    /* Table column alignment */
    .placeholders-table sp-table-head-cell[style*="text-align: right"] {
        justify-content: flex-end;
    }
    
    .placeholders-table sp-table-cell[style*="text-align: right"] {
        text-align: right;
    }
    
    /* Status badge alignment in right-aligned cells */
    sp-table-cell[style*="text-align: right"] sp-badge {
        float: right;
    }
    
    /* Action buttons alignment */
    sp-table-cell.action-cell[style*="text-align: right"] .action-buttons {
        justify-content: flex-end;
    }
    
    /* Create Modal Styles */
    .create-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .create-modal {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        width: 600px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
    }
    
    .create-modal-content {
        padding: 24px;
    }
    
    .create-modal-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 24px 0;
    }
    
    .create-modal-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .form-group label {
        font-size: 14px;
        font-weight: 500;
    }
    
    .required {
        color: var(--spectrum-semantic-negative-color-default);
    }
    
    .locale-config-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .locale-config-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--spectrum-global-color-gray-200);
        border-radius: 4px;
        cursor: pointer;
    }
    
    .locale-config-option.selected {
        border-color: var(--spectrum-global-color-blue-500);
        background-color: var(--spectrum-global-color-blue-50);
    }
    
    .locale-config-content {
        flex: 1;
    }
    
    .locale-config-content h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px 0;
    }
    
    .locale-config-content p {
        font-size: 12px;
        color: var(--spectrum-global-color-gray-700);
        margin: 0;
    }
    
    .create-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
    }
    
    /* Ensure form elements take full width */
    .form-group sp-textfield,
    .form-group sp-picker {
        width: 100%;
    }
`;
document.head.appendChild(style);
