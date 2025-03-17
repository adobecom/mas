import { LitElement, html, nothing, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import StoreController from './reactivity/store-controller.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import Store from './store.js';
import Events from './events.js';
import { MasRepository } from './mas-repository.js';
import './mas-folder-picker.js';
import './filters/locale-picker.js';
import { ROOT_PATH, DICTIONARY_MODEL_ID } from './constants.js';

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
    static styles = css`
        .placeholders-container {
            height: 100%;
            border-radius: 8px;
            padding: 24px;
            background-color: var(--spectrum-white);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
            position: relative;
        }

        .placeholders-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .header-left {
            display: flex;
            align-items: center;
        }

        .search-filters-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            gap: 14px;
        }

        .placeholders-title {
            display: flex;
            justify-content: flex-start;
            align-items: center;
        }

        .placeholders-title h2 {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
        }

        .filters-container {
            display: flex;
            gap: 14px;
            align-items: center;
        }

        .placeholders-content {
            flex: 1;
            position: relative;
        }

        .no-folder-message,
        .loading-message {
            padding: 24px;
            text-align: center;
            color: var(--spectrum-global-color-gray-700);
            font-size: 16px;
            background-color: var(--spectrum-global-color-gray-100);
            border-radius: 4px;
            margin-top: 16px;
        }

        .error-message {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background-color: var(
                --spectrum-semantic-negative-color-background
            );
            color: var(--spectrum-semantic-negative-color-text);
            border-radius: 4px;
            margin-bottom: 16px;
        }

        .error-message sp-icon-alert {
            color: var(--spectrum-semantic-negative-color-icon);
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
            border: 1px solid var(--spectrum-gray-200);
        }

        .placeholders-table sp-table-head {
            background-color: var(--spectrum-global-color-gray-100);
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .placeholders-table sp-table-head-cell:nth-child(2),
        .placeholders-table sp-table-cell:nth-child(2) {
            width: 200px;
        }

        .placeholders-table sp-table-head-cell:nth-child(3),
        .placeholders-table sp-table-cell:nth-child(3) {
            width: 400px;
        }

        .placeholders-table sp-table-head-cell:nth-child(4),
        .placeholders-table sp-table-cell:nth-child(4) {
            width: 120px;
        }

        .placeholders-table sp-table-head-cell:nth-child(5),
        .placeholders-table sp-table-cell:nth-child(5) {
            width: 150px;
        }

        .placeholders-table sp-table-head-cell:nth-child(6),
        .placeholders-table sp-table-cell:nth-child(6) {
            width: 200px;
        }

        .placeholders-table sp-table-head-cell:nth-child(7),
        .placeholders-table sp-table-cell:nth-child(7) {
            width: 200px;
        }

        .placeholders-table sp-table-head-cell {
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            color: var(--spectrum-gray-700);
            font-size: 12px;
            font-weight: 700;
        }

        .placeholders-table sp-table-head-cell:last-child,
        .placeholders-table sp-table-cell:last-child {
            max-width: 100px;
            justify-content: flex-end;
        }

        .placeholders-table sp-table-cell {
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        .placeholders-table sp-table-body {
            overflow: visible;
        }

        /* Action column styles */
        .action-cell {
            position: relative;
            box-sizing: border-box;
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

        .action-button:hover {
            background-color: var(--spectrum-global-color-gray-200);
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
            width: 160px;
            padding: 8px 0;
            display: flex;
            flex-direction: column;
        }

        .dropdown-item {
            flex: 1;
            align-items: center;
            padding: 8px 16px;
            cursor: pointer;
            gap: 8px;
            justify-self: flex-start;
            display: flex;
        }

        .dropdown-item:hover {
            background-color: var(--spectrum-global-color-gray-100);
        }

        .dropdown-item span {
            flex: 1;
            display: inline-flex;
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

        .create-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 24px;
        }

        /* Column widths for the table */
        .columnWidths {
            --key-width: 20%;
            --value-width: 35%;
            --locale-width: 10%;
            --status-width: 10%;
            --updatedBy-width: 10%;
            --updatedAt-width: 10%;
            --action-width: 5%;
        }

        /* Editing styles */
        .editing-cell {
            padding: 0 !important;
        }

        .edit-field-container {
            padding: 4px;
        }

        .edit-field-container sp-textfield {
            width: 100%;
        }

        /* Breadcrumbs styles */
        .breadcrumbs {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .breadcrumb-link {
            color: var(--spectrum-global-color-blue-600);
            text-decoration: none;
        }

        .breadcrumb-current {
            color: var(--spectrum-global-color-gray-700);
        }

        .approve-button sp-icon-checkmark {
            color: var(--spectrum-semantic-positive-color-default, green);
        }

        .reject-button sp-icon-close {
            color: var(--spectrum-semantic-negative-color-default, red);
        }
    `;

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
        this.appliedFilters = {
            locale: [],
            key: [],
        };

        this.columnWidths = {
            key: '20%',
            value: '35%',
            locale: '10%',
            status: '10%',
            updatedBy: '10%',
            updatedAt: '10%',
            action: '5%',
        };

        this.selectedFolder = new StoreController(
            this,
            Store.search || new ReactiveStore({}),
        );
        this.selectedLocale = new StoreController(
            this,
            Store.filters?.locale || new ReactiveStore('en_US'),
        );
        this.folderData = new StoreController(
            this,
            Store.folders?.data || new ReactiveStore([]),
        );
        this.foldersLoaded = new StoreController(
            this,
            Store.folders?.loaded || new ReactiveStore(false),
        );

        this.placeholdersData = new StoreController(
            this,
            Store.placeholders.list.data || new ReactiveStore([]),
        );
        this.placeholdersLoading = new StoreController(
            this,
            Store.placeholders.list.loading || new ReactiveStore(false),
        );

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

        this.placeholdersData.store.subscribe((data) => {
            this.placeholders = data;
            this.requestUpdate();
        });

        this.placeholdersLoading.store.subscribe((loading) => {
            this.loading = loading;
            this.requestUpdate();
        });

        this.selectedFolder.store.subscribe(this.handleFolderChange);
        const currentPage = Store.page.get();
        if (currentPage !== 'placeholders') {
            Store.page.set('placeholders');
        }

        const masRepository = this.repository;
        if (masRepository) {
            if (this.selectedFolder.value?.path) {
                Store.placeholders.list.loading.set(true);
                setTimeout(() => {
                    masRepository.searchPlaceholders();
                }, 500);
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

        this.selectedFolder.store.unsubscribe(this.handleFolderChange);
        this.placeholdersData.store.unsubscribe();
        this.placeholdersLoading.store.unsubscribe();
    }

    handleFolderChange(folderData) {
        if (folderData?.path) {
            Store.placeholders.list.loading.set(true);
            const masRepository = this.repository;
            if (masRepository) {
                setTimeout(() => {
                    masRepository.searchPlaceholders();
                }, 100);
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

            const folderPath = this.selectedFolder.value?.path;
            const locale =
                this.newPlaceholder.locale ||
                this.selectedLocale.value ||
                'en_US';

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

            const fragmentData = {
                name: name,
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

            if (!fragmentData.parentPath) {
                console.error(
                    'Dictionary path is invalid:',
                    fragmentData.parentPath,
                );
                throw new Error(
                    'Invalid dictionary path for placeholder creation',
                );
            }

            await repository.createDictionaryFragment(fragmentData);

            this.newPlaceholder = {
                key: '',
                value: '',
            };

            this.showCreateModal = false;

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully created.',
            });

            setTimeout(() => {
                if (repository) {
                    repository.searchPlaceholders();
                }
            }, 500);
        } catch (error) {
            console.error('Failed to create placeholder:', error);
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

            const placeholderIndex = this.placeholdersData.value.findIndex(
                (p) => p.key === this.editingPlaceholder,
            );

            if (placeholderIndex === -1) {
                throw new Error(
                    `Placeholder with key "${this.editingPlaceholder}" not found`,
                );
            }

            const placeholder = this.placeholdersData.value[placeholderIndex];

            if (
                placeholder.key === this.editedKey &&
                placeholder.value === this.editedValue
            ) {
                console.log('No changes detected, skipping save operation');
                Events.toast.emit({
                    variant: 'info',
                    content: 'No changes to save',
                });

                this.editingPlaceholder = null;
                this.editedKey = '';
                this.editedValue = '';
                this.draftStatus = false;

                return;
            }

            const fragmentPath = placeholder._fragment?.path;
            if (!fragmentPath) {
                throw new Error('Fragment path is missing');
            }

            let fragmentData = null;
            try {
                fragmentData =
                    await this.repository.getFragmentByPath(fragmentPath);
            } catch (fetchError) {
                fragmentData = placeholder._fragment;
            }

            if (!fragmentData) {
                throw new Error('Fragment data is missing');
            }

            const updatedFragment = { ...fragmentData };

            const keyFieldIndex = updatedFragment.fields.findIndex(
                (field) => field.name === 'key',
            );
            if (keyFieldIndex !== -1) {
                updatedFragment.fields[keyFieldIndex].values = [this.editedKey];
            } else {
                updatedFragment.fields.push({
                    name: 'key',
                    values: [this.editedKey],
                });
            }

            const valueFieldIndex = updatedFragment.fields.findIndex(
                (field) => field.name === 'value',
            );
            if (valueFieldIndex !== -1) {
                updatedFragment.fields[valueFieldIndex].values = [
                    this.editedValue,
                ];
            } else {
                updatedFragment.fields.push({
                    name: 'value',
                    values: [this.editedValue],
                });
            }

            const locReadyFieldIndex = updatedFragment.fields.findIndex(
                (field) => field.name === 'locReady',
            );
            if (locReadyFieldIndex !== -1) {
                updatedFragment.fields[locReadyFieldIndex].values = [true];
            } else {
                updatedFragment.fields.push({
                    name: 'locReady',
                    values: [true],
                });
            }

            const savedFragment =
                await this.repository.saveDictionaryFragment(updatedFragment);

            const updatedPlaceholder = {
                ...placeholder,
                key: this.editedKey,
                value: this.editedValue,
                status: savedFragment.status || 'Draft',
                _fragment: savedFragment,
            };

            const updatedPlaceholders = [...this.placeholdersData.value];
            updatedPlaceholders[placeholderIndex] = updatedPlaceholder;
            Store.placeholders.list.data.set(updatedPlaceholders);
            // Force UI update with the new data
            this.placeholders = updatedPlaceholders;
            this.requestUpdate();

            this.editingPlaceholder = null;
            this.editedKey = '';
            this.editedValue = '';
            this.draftStatus = false;

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

    async handlePublish(key) {
        try {
            Store.placeholders.list.loading.set(true);
            const placeholderIndex = this.placeholdersData.value.findIndex(
                (p) => p.key === key,
            );

            if (placeholderIndex === -1) {
                throw new Error(`Placeholder with key "${key}" not found`);
            }

            const placeholder = this.placeholdersData.value[placeholderIndex];

            if (!placeholder?._fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }
            const fragmentData = placeholder._fragment;

            this.activeDropdown = null;

            // Call repository to publish
            await this.repository.publishDictionaryFragment(fragmentData);

            // Create a deep copy with updated status
            const updatedPlaceholder = {
                ...placeholder,
                status: 'Published', // Explicitly set to Published
                _fragment: {
                    ...placeholder._fragment,
                    status: 'Published', // Update fragment status too
                },
            };

            // Update local store
            const updatedPlaceholders = [...this.placeholdersData.value];
            updatedPlaceholders[placeholderIndex] = updatedPlaceholder;

            // Set both the store and local property
            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholders = updatedPlaceholders;

            // Force UI update
            this.requestUpdate();

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully published.',
            });
        } catch (error) {
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to publish placeholder: ${error.message}`,
            });
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    async handleUnpublish(key) {
        try {
            Store.placeholders.list.loading.set(true);

            const placeholderIndex = this.placeholdersData.value.findIndex(
                (p) => p.key === key,
            );

            if (placeholderIndex === -1) {
                throw new Error(`Placeholder with key "${key}" not found`);
            }

            const placeholder = this.placeholdersData.value[placeholderIndex];

            if (!placeholder?._fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }
            const fragmentData = placeholder._fragment;

            this.activeDropdown = null;

            await this.repository.unpublishDictionaryFragment(fragmentData);

            const updatedPlaceholder = {
                ...placeholder,
                status: 'Draft',
            };

            const updatedPlaceholders = [...this.placeholdersData.value];
            updatedPlaceholders[placeholderIndex] = updatedPlaceholder;
            Store.placeholders.list.data.set(updatedPlaceholders);

            setTimeout(() => {
                if (this.repository.searchPlaceholders) {
                    this.repository.searchPlaceholders();
                }
            }, 500);
        } catch (error) {
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to unpublish placeholder: ${error.message}`,
            });
        } finally {
            Store.placeholders.list.loading.set(false);
        }
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

            const placeholderIndex = this.placeholdersData.value.findIndex(
                (p) => p.key === key,
            );

            if (placeholderIndex === -1) {
                throw new Error(`Placeholder with key "${key}" not found`);
            }

            const placeholder = this.placeholdersData.value[placeholderIndex];

            if (!placeholder?._fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }
            const fragmentData = placeholder._fragment;

            this.activeDropdown = null;

            await this.repository.deleteDictionaryFragment(fragmentData);

            const updatedPlaceholders = this.placeholdersData.value.filter(
                (p) => p.key !== key,
            );
            Store.placeholders.list.data.set(updatedPlaceholders);

            setTimeout(() => {
                if (this.repository.searchPlaceholders) {
                    this.repository.searchPlaceholders();
                }
            }, 500);
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

        const currentLocale = this.selectedLocale.value || 'en_US';

        this.newPlaceholder = {
            key: '',
            value: '',
            locale: currentLocale,
        };

        this.requestUpdate();

        setTimeout(() => {
            if (!this.showCreateModal) {
                this.showCreateModal = true;
                this.requestUpdate();
            }
        }, 100);
    }

    handleExport() {
        // ToDo: Implement export functionality
    }

    updateTableSelection(event) {
        this.selectedPlaceholders = Array.from(event.target.selectedSet);
        this.requestUpdate();
        // In a real implementation:
        // Store.placeholders.selection.set(Array.from(event.target.selectedSet));
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
        this.editedKey = e.target.value;
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

        if (this.appliedFilters?.locale?.length > 0) {
            filtered = filtered.filter((placeholder) =>
                this.appliedFilters.locale.includes(
                    placeholder.locale || 'en_US',
                ),
            );
        }

        // Apply key filters - with null check
        if (this.appliedFilters?.key?.length > 0) {
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
        if (status === 'Published' || status === 'PUBLISHED') {
            return html`<sp-badge size="s" quiet variant="positive"
                >PUBLISHED</sp-badge
            >`;
        } else if (status === 'Yet to Publish') {
            return html`<sp-badge size="s" quiet variant="neutral"
                >YET TO PUBLISH</sp-badge
            >`;
        } else if (status === 'Draft' || status === 'DRAFT') {
            return html`<sp-badge
                size="s"
                quiet
                style="background-color: var(--spectrum-blue-800); color: white;"
                >DRAFT</sp-badge
            >`;
        }
        return html`<sp-badge size="s" quiet
            >${status.toUpperCase()}</sp-badge
        >`;
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
        this.newPlaceholder.key = e.target.value;
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
        Store.filters.value.locale = newLocale;
        this.selectedLocale.value = newLocale;
        Store.placeholders.list.loading.set(true);

        if (this.repository) {
            this.repository.searchPlaceholders();
        }

        this.requestUpdate();
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
                ${this.getStatusBadge(placeholder.status)}
            </sp-table-cell>
        `;
    }

    renderActionCell(placeholder) {
        // If currently editing this placeholder
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
                              ${placeholder.status !== 'Published'
                                  ? html`
                                        <div
                                            class="dropdown-item"
                                            @click=${() =>
                                                this.handlePublish(
                                                    placeholder.key,
                                                )}
                                        >
                                            <sp-icon-publish-check></sp-icon-publish-check>
                                            <span>Publish</span>
                                        </div>
                                    `
                                  : html`
                                        <div
                                            class="dropdown-item"
                                            @click=${() =>
                                                this.handleUnpublish(
                                                    placeholder.key,
                                                )}
                                        >
                                            <sp-icon-publish-remove></sp-icon-publish-remove>
                                            <span>Unpublish</span>
                                        </div>
                                    `}
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
                            .value=${this.selectedLocale.value}
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
                    ${!(this.foldersLoaded.value ?? false)
                        ? html`<div class="loading-message">
                              Loading folders...
                          </div>`
                        : !this.selectedFolder.value?.path
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
