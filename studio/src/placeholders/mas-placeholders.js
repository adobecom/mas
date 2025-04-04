import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import Events from '../events.js';
import { MasRepository } from '../mas-repository.js';
import {
    ROOT_PATH,
    DICTIONARY_MODEL_ID,
    PAGE_NAMES,
    OPERATIONS,
    STATUS_DRAFT,
    STATUS_MODIFIED,
    STATUS_PUBLISHED,
} from '../constants.js';
import { MasPlaceholdersIndexManager } from './mas-placeholders-index-manager.js';
import { MasPlaceholdersLoader } from './mas-placeholders-loader.js';
import { MasPlaceholdersEditor } from './mas-placeholders-editor.js';
import { MasPlaceholdersUIRenderer } from './mas-placeholders-ui-renderer.js';
import styles from '../mas-placeholders.css.js';

export function withLoadingState(fn) {
    return async function (...args) {
        try {
            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;
            return await fn.apply(this, args);
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    };
}

export function getFragmentFieldValue(fragment, fieldName, defaultValue = '') {
    if (!fragment?.fields) return defaultValue;
    const field = fragment.fields.find((field) => field.name === fieldName);
    if (!field?.values?.length) return defaultValue;
    return field.values[0];
}

export function getDictionaryPath(folderPath, locale) {
    if (!folderPath || !locale) return null;
    return `${ROOT_PATH}/${folderPath}/${locale}/dictionary`;
}

export class MasPlaceholders extends LitElement {
    static styles = styles;

    static properties = {
        searchQuery: { type: String, state: true },
        selectedPlaceholders: { type: Array, state: true },
        sortField: { type: String, state: true },
        sortDirection: { type: String, state: true },
        error: { type: String, state: true },
        selectedFolder: { type: Object, state: true },
        selectedLocale: { type: String, state: true },
        folderData: { type: Array, state: true },
        foldersLoaded: { type: Boolean, state: true },
        placeholdersData: { type: Array, state: true },
        placeholdersLoading: { type: Boolean, state: true },
        editingPlaceholder: { type: String, state: true },
        editedKey: { type: String, state: true },
        editedValue: { type: String, state: true },
        editedRichText: { type: Boolean, state: true },
        activeDropdown: { type: String, state: true },
        showCreateModal: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        newPlaceholder: { type: Object, state: true },
        isBulkDeleteInProgress: { type: Boolean, state: true },
        indexUpdateRetries: { type: Number, state: true },
    };

    constructor() {
        super();
        this.searchQuery = '';
        this.selectedPlaceholders = [];
        this.sortField = 'key';
        this.sortDirection = 'asc';
        this.error = null;
        this.selectedFolder = {};
        this.selectedLocale = 'en_US';
        this.folderData = [];
        this.foldersLoaded = false;
        this.placeholdersData = [];
        this.placeholdersLoading = false;
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.editedRichText = false;
        this.activeDropdown = null;
        this.showCreateModal = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: 'en_US',
            isRichText: false,
        };
        this.isBulkDeleteInProgress = false;
        this.indexUpdateRetries = 0;

        // Set up internal instances for composition
        this.indexManager = new MasPlaceholdersIndexManager();
        Object.setPrototypeOf(this.indexManager, MasPlaceholders.prototype);
        Object.setPrototypeOf(this.indexManager.constructor, MasPlaceholders);
        this.indexManager.repository = this.repository;
        
        this.loader = new MasPlaceholdersLoader();
        Object.setPrototypeOf(this.loader, MasPlaceholders.prototype);
        Object.setPrototypeOf(this.loader.constructor, MasPlaceholders);
        this.loader.repository = this.repository;
        
        this.editor = new MasPlaceholdersEditor();
        Object.setPrototypeOf(this.editor, MasPlaceholders.prototype);
        Object.setPrototypeOf(this.editor.constructor, MasPlaceholders);
        this.editor.repository = this.repository;
        
        this.uiRenderer = new MasPlaceholdersUIRenderer();
        Object.setPrototypeOf(this.uiRenderer, MasPlaceholders.prototype);
        Object.setPrototypeOf(this.uiRenderer.constructor, MasPlaceholders);
        this.uiRenderer.repository = this.repository;

        // Bind methods from component classes
        this.bindComponentMethods();

        // Bind event handlers
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleCreateModalClickOutside = this.handleCreateModalClickOutside.bind(this);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /**
     * Ensures the repository is available
     * @param {string} [errorMessage='Repository component not found'] - Custom error message
     * @throws {Error} If repository is not available
     * @returns {MasRepository} The repository instance
     */
    ensureRepository(errorMessage = 'Repository component not found') {
        const repository = this.repository;
        if (!repository) {
            this.error = errorMessage;
            throw new Error(errorMessage);
        }
        return repository;
    }

    get loading() {
        return this.placeholdersLoading;
    }

    /**
     * Shows a toast notification
     * @param {string} message - Message to display
     * @param {string} variant - Variant type (positive, negative, info, warning)
     */
    showToast(message, variant = 'info') {
        Events.toast.emit({
            variant,
            content: message,
        });
    }

    /**
     * Search and filter placeholders based on current search text
     */
    async searchPlaceholders() {
        if (!this.placeholdersData || !this.placeholdersData.length) return;

        if (!Store.placeholders.filtered || !Store.placeholders.filtered.data) {
            if (!Store.placeholders.filtered) {
                Store.placeholders.filtered = {};
            }
            if (!Store.placeholders.filtered.data) {
                Store.placeholders.filtered.data = {
                    set: (data) => {
                        Store.placeholders.filtered._data = data;
                    },
                    get: () => Store.placeholders.filtered._data || [],
                };
                Store.placeholders.filtered._data = [];
            }
        }

        const searchText = this.searchQuery?.toLowerCase().trim() || '';
        if (!searchText) {
            Store.placeholders.filtered.data.set(this.placeholdersData);
            this.updateTableSelection();
            this.ensureTableCheckboxes();
            return;
        }

        const filteredPlaceholders = this.placeholdersData.filter(
            (placeholder) => {
                const key = placeholder.key?.toLowerCase() || '';
                const value = placeholder.displayValue?.toLowerCase() || '';
                return key.includes(searchText) || value.includes(searchText);
            },
        );

        Store.placeholders.filtered.data.set(filteredPlaceholders);
        this.updateTableSelection();
        this.ensureTableCheckboxes();
    }

    /**
     * Detect the status of a fragment
     * @param {Object} fragment - Fragment to check
     * @returns {Object} Status information
     */
    detectFragmentStatus(fragment) {
        let status = STATUS_DRAFT;
        let modifiedAfterPublished = false;
        const hasPublishedRef = !!fragment.publishedRef;
        const isPublished = !!fragment.published || hasPublishedRef;

        if (isPublished) {
            status = STATUS_PUBLISHED;

            if (
                fragment.modified &&
                fragment.modified.at &&
                fragment.published &&
                fragment.published.at
            ) {
                const publishedTime = new Date(fragment.published.at).getTime();
                const modifiedTime = new Date(fragment.modified.at).getTime();

                if (modifiedTime > publishedTime) {
                    status = STATUS_MODIFIED;
                    modifiedAfterPublished = true;
                }
            }
        }

        return {
            status,
            modifiedAfterPublished,
            isPublished,
            hasPublishedRef,
        };
    }

    // Bind methods from component classes
    bindComponentMethods() {
        // Add index manager methods
        this.updateIndexFragment = this.indexManager.updateIndexFragment.bind(this);
        this.createIndexFragment = this.indexManager.createIndexFragment.bind(this);
        this.removeFromIndexFragment = this.indexManager.removeFromIndexFragment.bind(this);

        // Add loader methods
        this.loadPlaceholders = this.loader.loadPlaceholders.bind(this);
        this.handleFolderChange = this.loader.handleFolderChange.bind(this);
        // No longer binding loader's handleLocaleChange as we have our own implementation

        // Add editor methods
        this.createPlaceholder = this.editor.createPlaceholder.bind(this);
        this.saveEdit = this.editor.saveEdit.bind(this);
        this.createPlaceholderWithIndex =
            this.editor.createPlaceholderWithIndex.bind(this);
        this.handleDelete = this.editor.handleDelete.bind(this);
        this.handlePublish = this.editor.handlePublish.bind(this);
        this.startEdit = this.editor.startEdit.bind(this);
        this.cancelEdit = this.editor.cancelEdit.bind(this);
        this.resetEditState = this.editor.resetEditState.bind(this);
        this.clearRteInitializedFlags =
            this.editor.clearRteInitializedFlags.bind(this);
        this.handleAddPlaceholder = this.editor.handleAddPlaceholder.bind(this);
        this.closeCreateModal = this.editor.closeCreateModal.bind(this);
        this.handleKeyChange = this.editor.handleKeyChange.bind(this);
        this.handleValueChange = this.editor.handleValueChange.bind(this);
        this.handleRteValueChange = this.editor.handleRteValueChange.bind(this);
        this.handleNewPlaceholderKeyChange =
            this.editor.handleNewPlaceholderKeyChange.bind(this);
        this.handleNewPlaceholderValueChange =
            this.editor.handleNewPlaceholderValueChange.bind(this);
        this.handleNewPlaceholderLocaleChange =
            this.editor.handleNewPlaceholderLocaleChange.bind(this);
        this.handleNewPlaceholderRteChange =
            this.editor.handleNewPlaceholderRteChange.bind(this);
        this.handleRichTextToggle = this.editor.handleRichTextToggle.bind(this);

        // Add UI renderer methods
        this.renderError = this.uiRenderer.renderError.bind(this);
        this.renderConfirmDialog =
            this.uiRenderer.renderConfirmDialog.bind(this);
        this.renderTableCell = this.uiRenderer.renderTableCell.bind(this);
        this.renderKeyCell = this.uiRenderer.renderKeyCell.bind(this);
        this.renderValueCell = this.uiRenderer.renderValueCell.bind(this);
        this.renderStatusCell = this.uiRenderer.renderStatusCell.bind(this);
        this.renderActionCell = this.uiRenderer.renderActionCell.bind(this);
        this.renderTableHeader = this.uiRenderer.renderTableHeader.bind(this);
        this.getFilteredPlaceholders =
            this.uiRenderer.getFilteredPlaceholders.bind(this);
        this.getSortedPlaceholders =
            this.uiRenderer.getSortedPlaceholders.bind(this);
        this.handleSort = this.uiRenderer.handleSort.bind(this);
        this.renderFormGroup = this.uiRenderer.renderFormGroup.bind(this);
        this.renderCreateModal = this.uiRenderer.renderCreateModal.bind(this);
        this.renderPlaceholdersTable =
            this.uiRenderer.renderPlaceholdersTable.bind(this);
        this.renderPlaceholdersContent =
            this.uiRenderer.renderPlaceholdersContent.bind(this);
        this.shouldShowBulkAction =
            this.uiRenderer.shouldShowBulkAction.bind(this);
        this.updateTableSelection =
            this.uiRenderer.updateTableSelection.bind(this);
        this.ensureTableCheckboxes =
            this.uiRenderer.ensureTableCheckboxes.bind(this);
        this.handleBulkDelete = this.uiRenderer.handleBulkDelete.bind(this);
        this.handleSearch = this.uiRenderer.handleSearch.bind(this);
        this.toggleDropdown = this.uiRenderer.toggleDropdown.bind(this);
        this.handleClickOutside = this.uiRenderer.handleClickOutside;
        this.handleCreateModalClickOutside =
            this.uiRenderer.handleCreateModalClickOutside;
        this.showDialog = this.uiRenderer.showDialog.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside);
        document.addEventListener('click', this.handleCreateModalClickOutside);

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.PLACEHOLDERS) {
            Store.page.set(PAGE_NAMES.PLACEHOLDERS);
        }

        const masRepository = this.repository;
        if (!masRepository) {
            this.error = 'Repository component not found';
            return;
        }

        this.selectedFolder = Store.search.get();
        this.selectedLocale = Store.filters.get().locale || 'en_US';
        this.placeholdersData = Store.placeholders?.list?.data?.get() || [];

        Store.placeholders.list.loading.set(true);
        this.loadPlaceholders(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener(
            'click',
            this.handleCreateModalClickOutside,
        );
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        const currentFolder = Store.search.get();
        const currentLocale = Store.filters.get().locale || 'en_US';
        const currentFolderData = Store.folders?.data?.get() || [];
        const currentFoldersLoaded = Store.folders?.loaded?.get() || false;
        const currentPlaceholdersData =
            Store.placeholders?.list?.data?.get() || [];
        const currentPlaceholdersLoading =
            Store.placeholders?.list?.loading?.get() || false;

        if (
            currentLocale !== this.selectedLocale &&
            currentFolder?.path &&
            !currentPlaceholdersLoading
        ) {
            this.selectedLocale = currentLocale;
            Store.placeholders.list.loading.set(true);
            if (this.repository) {
                this.loadPlaceholders(true);
            }
        }

        if (
            currentFolder?.path !== this.selectedFolder?.path &&
            !currentPlaceholdersLoading
        ) {
            this.selectedFolder = currentFolder;
            this.handleFolderChange();
        }

        this.selectedFolder = currentFolder;
        this.selectedLocale = currentLocale;
        this.folderData = currentFolderData;
        this.foldersLoaded = currentFoldersLoaded;
        this.placeholdersData = currentPlaceholdersData;
        this.placeholdersLoading = currentPlaceholdersLoading;
    }

    render() {
        const modalContent = this.showCreateModal
            ? this.renderCreateModal()
            : nothing;
        const confirmDialog = this.renderConfirmDialog();
        const showBulkAction = this.shouldShowBulkAction();

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
                            ${(this.placeholdersData || []).length}
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
                    ${this.renderPlaceholdersContent()}
                </div>

                ${modalContent} ${confirmDialog}

                <div
                    class="bulk-action-container ${showBulkAction
                        ? 'visible'
                        : ''}"
                >
                    <sp-action-button
                        variant="negative"
                        @click=${this.handleBulkDelete}
                        ?disabled=${this.isBulkDeleteInProgress}
                        size="l"
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Delete (${this.selectedPlaceholders.length})
                    </sp-action-button>
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
        
        // Force reload of placeholders with new locale
        if (this.repository) {
            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;
            
            // Give the store time to update
            setTimeout(() => {
                this.loadPlaceholders(true);
            }, 100);
        }
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
