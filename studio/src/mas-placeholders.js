import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './mas-placeholders.css.js';
import Store from './store.js';
import Events from './events.js';
import { MasRepository } from './mas-repository.js';
import './mas-folder-picker.js';
import './filters/locale-picker.js';
import { ROOT_PATH, DICTIONARY_MODEL_ID, PAGE_NAMES } from './constants.js';

export function getDictionaryPath(folderPath, locale) {
    if (!folderPath) {
        return null;
    }
    if (!locale) {
        return null;
    }

    const surface = folderPath;
    const dictionaryPath = `${ROOT_PATH}/${surface}/${locale}/dictionary`;
    return dictionaryPath;
}

class MasPlaceholders extends LitElement {
    static styles = styles;

    constructor() {
        super();

        this.placeholders = [];
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
        };
        this.error = null;
        this.columnWidths = {
            key: '20%',
            value: '35%',
            locale: '10%',
            status: '10%',
            updatedBy: '10%',
            updatedAt: '10%',
            action: '5%',
        };
        this.selectedFolder = {};
        this.selectedLocale = 'en_US';
        this.folderData = [];
        this.foldersLoaded = false;
        this.placeholdersData = [];
        this.placeholdersLoading = false;
        this.subscriptions = [];
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleCreateModalClickOutside =
            this.handleCreateModalClickOutside.bind(this);
        this.handleFolderChange = this.handleFolderChange.bind(this);
        this.handleLocaleChange = this.handleLocaleChange.bind(this);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    async connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside);
        document.addEventListener('click', this.handleCreateModalClickOutside);

        if (Store.search) {
            const searchSub = Store.search.subscribe((value) => {
                this.selectedFolder = value;
                this.requestUpdate();
            });
            this.subscriptions.push(searchSub);
        }

        if (Store.filters) {
            const localeSub = Store.filters.subscribe((value) => {
                this.selectedLocale = value.locale || 'en_US';
                this.requestUpdate();
            });
            this.subscriptions.push(localeSub);
        }

        if (Store.folders?.data) {
            const folderDataSub = Store.folders.data.subscribe((value) => {
                this.folderData = value;
                this.requestUpdate();
            });
            this.subscriptions.push(folderDataSub);
        }

        if (Store.folders?.loaded) {
            const foldersLoadedSub = Store.folders.loaded.subscribe((value) => {
                this.foldersLoaded = value;
                this.requestUpdate();
            });
            this.subscriptions.push(foldersLoadedSub);
        }

        if (Store.placeholders?.list?.data) {
            const placeholdersDataSub = Store.placeholders.list.data.subscribe(
                (value) => {
                    this.placeholdersData = value;
                    this.placeholders = value;
                    this.requestUpdate();
                },
            );
            this.subscriptions.push(placeholdersDataSub);
        }

        if (Store.placeholders?.list?.loading) {
            const placeholdersLoadingSub =
                Store.placeholders.list.loading.subscribe((value) => {
                    this.placeholdersLoading = value;
                    this.loading = value;
                    this.requestUpdate();
                });
            this.subscriptions.push(placeholdersLoadingSub);
        }

        if (Store.search) {
            const folderChangeSub = Store.search.subscribe(
                this.handleFolderChange,
            );
            this.subscriptions.push(folderChangeSub);
        }

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.PLACEHOLDERS) {
            Store.page.set(PAGE_NAMES.PLACEHOLDERS);
        }

        const masRepository = this.repository;
        if (masRepository) {
            if (this.selectedFolder?.path) {
                Store.placeholders.list.loading.set(true);
                masRepository.searchPlaceholders();
            } else {
                this.error = 'Please select a folder to view placeholders';
            }
        } else {
            this.error = 'Repository component not found';
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener(
            'click',
            this.handleCreateModalClickOutside,
        );

        this.subscriptions.forEach((sub) => {
            if (sub && typeof sub.unsubscribe === 'function') {
                sub.unsubscribe();
            }
        });
        this.subscriptions = [];
    }

    handleFolderChange(folderData) {
        if (folderData?.path) {
            Store.placeholders.list.loading.set(true);
            const masRepository = this.repository;
            if (masRepository) {
                masRepository.searchPlaceholders();
            } else {
                this.error = 'Repository component not found';
            }
        }
    }

    async createPlaceholder() {
        if (!this.newPlaceholder.key || !this.newPlaceholder.value) {
            Events.toast.emit({
                variant: 'negative',
                content: 'Key and Value are required',
            });
            return;
        }

        try {
            Store.placeholders.list.loading.set(true);
            this.loading = true;

            const folderPath = this.selectedFolder?.path;

            const locale =
                this.newPlaceholder.locale || this.selectedLocale || 'en_US';

            if (!folderPath) {
                Events.toast.emit({
                    variant: 'negative',
                    content:
                        'No folder selected. Please select a folder first.',
                });
                return;
            }

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository element not found');
            }

            const dictionaryPath = getDictionaryPath(folderPath, locale);
            if (!dictionaryPath) {
                throw new Error('Failed to construct dictionary path');
            }

            const name = this.newPlaceholder.key
                .toLowerCase()
                .replace(/\s+/g, '-');

            if (!DICTIONARY_MODEL_ID) {
                throw new Error('DICTIONARY_MODEL_ID is not defined');
            }

            const fragmentData = {
                name,
                parentPath: dictionaryPath,
                modelId: DICTIONARY_MODEL_ID,
                title: this.newPlaceholder.key,
                description: `Placeholder for ${this.newPlaceholder.key}`,
                data: {
                    key: this.newPlaceholder.key,
                    value: this.newPlaceholder.value,
                    locReady: true,
                },
            };

            await repository.createPlaceholderWithIndex(fragmentData);

            this.newPlaceholder = { key: '', value: '' };
            this.showCreateModal = false;
            this.selectedPlaceholders = [];
            this.requestUpdate();
        } catch (error) {
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to create placeholder: ${error.message}`,
            });
        } finally {
            Store.placeholders.list.loading.set(false);
            this.loading = false;
        }
    }

    async saveEdit() {
        try {
            Store.placeholders.list.loading.set(true);

            if (!this.editingPlaceholder) {
                throw new Error('No placeholder is being edited');
            }

            const placeholderIndex = this.placeholdersData.findIndex(
                (p) => p.key === this.editingPlaceholder,
            );

            if (placeholderIndex === -1) {
                throw new Error(
                    `Placeholder with key "${this.editingPlaceholder}" not found`,
                );
            }

            const placeholder = this.placeholdersData[placeholderIndex];

            if (
                placeholder.key === this.editedKey &&
                placeholder.value === this.editedValue
            ) {
                Events.toast.emit({
                    variant: 'info',
                    content: 'No changes to save',
                });
                this.resetEditState();
                return;
            }

            const fragmentData = placeholder.fragment;
            if (!fragmentData) {
                throw new Error('Fragment data is missing');
            }

            const updatedFragment = { ...fragmentData };
            const fieldsToUpdate = [
                { name: 'key', value: this.editedKey },
                { name: 'value', value: this.editedValue },
                { name: 'locReady', value: true },
            ];

            fieldsToUpdate.forEach((field) => {
                const fieldIndex = updatedFragment.fields.findIndex(
                    (f) => f.name === field.name,
                );
                if (fieldIndex !== -1) {
                    updatedFragment.fields[fieldIndex].values = [field.value];
                } else {
                    updatedFragment.fields.push({
                        name: field.name,
                        values: [field.value],
                    });
                }
            });

            const savedFragment =
                await this.repository.saveDictionaryFragment(updatedFragment);

            const updatedPlaceholder = {
                ...placeholder,
                key: this.editedKey,
                value: this.editedValue,
                status: savedFragment.status || 'Draft',
                fragment: savedFragment,
            };

            const updatedPlaceholders = [...this.placeholdersData];
            updatedPlaceholders[placeholderIndex] = updatedPlaceholder;

            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholders = updatedPlaceholders;
            this.requestUpdate();
            this.resetEditState();

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully saved',
            });
        } catch (error) {
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to save placeholder: ${error.message}`,
            });
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    resetEditState() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.draftStatus = false;
    }

    async handleDelete(key) {
        if (
            !confirm(
                `Are you sure you want to delete the placeholder with key: ${key}?`,
            )
        ) {
            return;
        }

        try {
            Store.placeholders.list.loading.set(true);
            const placeholderIndex = this.placeholdersData.findIndex(
                (p) => p.key === key,
            );

            if (placeholderIndex === -1) {
                throw new Error(`Placeholder with key "${key}" not found`);
            }

            const placeholder = this.placeholdersData[placeholderIndex];

            if (!placeholder?.fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }
            const fragmentData = placeholder.fragment;

            this.activeDropdown = null;

            await this.repository.deleteDictionaryFragment(fragmentData);

            const updatedPlaceholders = this.placeholdersData.filter(
                (p) => p.key !== key,
            );
            Store.placeholders.list.data.set(updatedPlaceholders);

            if (this.repository.searchPlaceholders) {
                this.repository.searchPlaceholders();
            }
        } catch (error) {
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to delete placeholder: ${error.message}`,
            });
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    renderError() {
        if (!this.error) return nothing;

        return html`
            <div class="error-message">
                <sp-icon-alert></sp-icon-alert>
                <span>${this.error}</span>
            </div>
        `;
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
            if (event.target.closest('.create-modal-overlay')) {
                return;
            }
            this.closeCreateModal();
        }
        this.requestUpdate();
    }

    closeCreateModal() {
        this.showCreateModal = false;
        this.requestUpdate();
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.requestUpdate();
    }

    handleAddPlaceholder() {
        this.showCreateModal = true;
        const currentLocale = this.selectedLocale || 'en_US';
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: currentLocale,
        };

        setTimeout(() => {
            //needed for the modal to display
            if (!this.showCreateModal) {
                this.showCreateModal = true;
                this.requestUpdate();
            }
        }, 100);
    }

    updateTableSelection(event) {
        this.selectedPlaceholders = Array.from(event.target.selectedSet);
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.requestUpdate();
    }

    startEditing(placeholder) {
        if (this.editingPlaceholder) {
            this.cancelEdit();
        }

        this.editingPlaceholder = placeholder.key;
        this.editedKey = placeholder.key;
        this.editedValue = placeholder.value;
        this.draftStatus = false;
        this.requestUpdate();
    }

    cancelEdit() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.draftStatus = false;
        this.requestUpdate();
    }

    toggleDropdown(key, event) {
        event.stopPropagation();

        if (this.activeDropdown === key) {
            this.activeDropdown = null;
        } else {
            this.activeDropdown = key;
        }
        this.requestUpdate();
    }

    handleKeyChange(e) {
        const inputValue = e.target.value;
        const normalizedValue = inputValue
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        
        this.editedKey = normalizedValue;
        this.draftStatus = true;
        this.requestUpdate();
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;
        this.draftStatus = true;
        this.requestUpdate();
    }

    getFilteredPlaceholders() {
        let filtered = this.placeholders || [];

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
        return html`<sp-badge size="s" quiet variant="positive">PUBLISHED</sp-badge>`;
    }

    renderPlaceholdersTable() {
        const filteredPlaceholders = this.getFilteredPlaceholders();

        return html`
            <sp-table
                emphasized
                scroller
                selects="multiple"
                selectable-with="cell"
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
        const inputValue = e.target.value;
        const normalizedValue = inputValue
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        
        this.newPlaceholder.key = normalizedValue;
        this.requestUpdate();
    }

    handleNewPlaceholderValueChange(e) {
        this.newPlaceholder.value = e.target.value;
        this.requestUpdate();
    }

    handleNewPlaceholderLocaleChange(e) {
        this.newPlaceholder.locale = e.detail.locale;
        this.requestUpdate();
    }

    renderCreateModal() {
        if (!this.showCreateModal) return nothing;

        return html`
            <div
                class="create-modal-overlay"
                @click=${(e) => e.stopPropagation()}
            >
                <div class="create-modal" @click=${(e) => e.stopPropagation()}>
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
                                    .value=${this.newPlaceholder.key}
                                    @input=${this.handleNewPlaceholderKeyChange}
                                ></sp-textfield>
                            </div>

                            <div class="form-group">
                                <label for="placeholder-locale"
                                    >Choose Locale
                                    <span class="required">*</span></label
                                >
                                <mas-locale-picker
                                    id="placeholder-locale"
                                    @locale-changed=${this
                                        .handleNewPlaceholderLocaleChange}
                                ></mas-locale-picker>
                            </div>

                            <div class="form-group">
                                <label for="placeholder-value"
                                    >Enter Value
                                    <span class="required">*</span></label
                                >
                                <sp-textfield
                                    id="placeholder-value"
                                    placeholder="Value"
                                    .value=${this.newPlaceholder.value}
                                    @input=${this
                                        .handleNewPlaceholderValueChange}
                                ></sp-textfield>
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

    handleLocaleChange(event) {
        const newLocale = event.detail.locale;

        Store.filters.set((currentValue) => ({
            ...currentValue,
            locale: newLocale,
        }));

        this.selectedLocale = newLocale;
        Store.placeholders.list.loading.set(true);

        if (this.repository) {
            this.repository.searchPlaceholders();
        }
    }

    renderKeyCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="editing-cell">
                    <div class="edit-field-container">
                        <sp-textfield
                            placeholder="Key"
                            .value=${this.editedKey}
                            @input=${this.handleKeyChange}
                        ></sp-textfield>
                    </div>
                </sp-table-cell>
            `;
        }

        return html`<sp-table-cell>${placeholder.key}</sp-table-cell>`;
    }

    renderValueCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="editing-cell">
                    <div class="edit-field-container">
                        <sp-textfield
                            placeholder="Value"
                            .value=${this.editedValue}
                            @input=${this.handleValueChange}
                        ></sp-textfield>
                    </div>
                </sp-table-cell>
            `;
        }

        return html`<sp-table-cell>${placeholder.value}</sp-table-cell>`;
    }

    renderStatusCell(placeholder) {
        return html`
            <sp-table-cell style="text-align: right;">
                <sp-badge size="s" quiet variant="positive">PUBLISHED</sp-badge>
            </sp-table-cell>
        `;
    }

    renderActionCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="action-cell">
                    <div class="action-buttons">
                        <button
                            class="action-button approve-button"
                            @click=${this.saveEdit}
                            aria-label="Save changes"
                        >
                            <sp-icon-checkmark></sp-icon-checkmark>
                        </button>
                        <button
                            class="action-button reject-button"
                            @click=${this.cancelEdit}
                            aria-label="Cancel editing"
                        >
                            <sp-icon-close></sp-icon-close>
                        </button>
                    </div>
                </sp-table-cell>
            `;
        }

        return html`
            <sp-table-cell class="action-cell">
                <div class="action-buttons">
                    <button
                        class="action-button approve-button"
                        @click=${() => this.startEditing(placeholder)}
                        aria-label="Edit placeholder"
                    >
                        <sp-icon-edit></sp-icon-edit>
                    </button>
                    <button
                        class="action-button action-menu-button"
                        @click=${(e) => this.toggleDropdown(placeholder.key, e)}
                        aria-label="More options"
                    >
                        <sp-icon-more></sp-icon-more>
                    </button>
                </div>

                ${this.activeDropdown === placeholder.key
                    ? html`
                          <div class="dropdown-menu">
                              <div
                                  class="dropdown-item"
                                  @click=${() =>
                                      this.handleDelete(placeholder.key)}
                              >
                                  <sp-icon-delete></sp-icon-delete>
                                  <span>Delete</span>
                              </div>
                          </div>
                      `
                    : nothing}
            </sp-table-cell>
        `;
    }

    render() {
        return html`
            <div class="placeholders-container">
                <div class="placeholders-header">
                    <div class="header-left">
                        <mas-locale-picker
                            @locale-changed=${this.handleLocaleChange}
                            .value=${this.selectedLocale}
                        ></mas-locale-picker>
                    </div>
                    <sp-button
                        variant="primary"
                        @click=${() => this.handleAddPlaceholder()}
                        class="create-button"
                    >
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create New Placeholder
                    </sp-button>
                </div>

                ${this.renderError()}

                <div class="search-filters-container">
                    <div class="placeholders-title">
                        <h2>
                            Total Placeholders:
                            ${(this.placeholders || []).length}
                        </h2>
                    </div>
                    <div class="filters-container">
                        <sp-search
                            size="m"
                            placeholder="Search by key or value"
                            @input=${this.handleSearch}
                            value=${this.searchQuery}
                        ></sp-search>
                    </div>
                </div>

                <div class="placeholders-content">
                    ${!(this.foldersLoaded ?? false)
                        ? html`<div class="loading-message">
                              Loading folders...
                          </div>`
                        : !this.selectedFolder?.path
                          ? html`<div class="no-folder-message">
                                Please select a folder to view placeholders
                            </div>`
                          : this.loading
                            ? this.loadingIndicator
                            : this.renderPlaceholdersTable()}
                </div>

                ${this.showCreateModal ? this.renderCreateModal() : nothing}
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
