import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './mas-placeholders.css.js';
import Store from './store.js';
import Events from './events.js';
import { MasRepository } from './mas-repository.js';
import './mas-folder-picker.js';
import './filters/locale-picker.js';
import { ROOT_PATH, DICTIONARY_MODEL_ID, PAGE_NAMES, OPERATIONS } from './constants.js';
import { normalizeKey } from './utils.js';

export function getDictionaryPath(folderPath, locale) {
    if (!folderPath || !locale) return null;
    return `${ROOT_PATH}/${folderPath}/${locale}/dictionary`;
}

class MasPlaceholders extends LitElement {
    static styles = styles;

    constructor() {
        super();

        this.searchQuery = '';
        this.selectedPlaceholders = [];
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

    get loading() {
        return this.placeholdersLoading;
    }

    /**
     * Helper method to show toast messages with consistent formatting
     * @param {string} message - The message to display
     * @param {string} variant - The toast variant (positive, negative, info)
     */
    showToast(message, variant = 'info') {
        Events.toast.emit({
            variant,
            content: message,
        });
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
                    this.requestUpdate();
                },
            );
            this.subscriptions.push(placeholdersDataSub);
        }

        if (Store.placeholders?.list?.loading) {
            const placeholdersLoadingSub =
                Store.placeholders.list.loading.subscribe((value) => {
                    this.placeholdersLoading = value;
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
                this.searchPlaceholders();
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
            if (this.repository) {
                this.searchPlaceholders();
            } else {
                this.error = 'Repository component not found';
            }
        }
    }

    async createPlaceholder() {
        if (!this.newPlaceholder.key || !this.newPlaceholder.value) {
            this.showToast('Key and Value are required', 'negative');
            return;
        }

        try {
            Store.placeholders.list.loading.set(true);
            const folderPath = this.selectedFolder?.path;
            const locale = this.newPlaceholder.locale || this.selectedLocale || 'en_US';

            if (!folderPath) {
                this.showToast('No folder selected. Please select a folder first.', 'negative');
                return;
            }

            if (!this.repository) {
                throw new Error('Repository element not found');
            }

            const dictionaryPath = getDictionaryPath(folderPath, locale);
            if (!dictionaryPath) {
                throw new Error('Failed to construct dictionary path');
            }

            if (!DICTIONARY_MODEL_ID) {
                throw new Error('Dictionary model ID is not defined');
            }

            const fragmentData = {
                name: this.newPlaceholder.key,
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

            await this.createPlaceholderWithIndex(fragmentData);
            this.newPlaceholder = { key: '', value: '' };
            this.showCreateModal = false;
            this.selectedPlaceholders = [];
            this.requestUpdate();
        } catch (error) {
            this.showToast(`Failed to create placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
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
                this.showToast('No changes to save', 'info');
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
                await this.repository.saveFragment(updatedFragment, { isInEditStore: false });

            const updatedPlaceholders = [...this.placeholdersData];
            updatedPlaceholders[placeholderIndex] = {
                ...placeholder,
                key: this.editedKey,
                value: this.editedValue,
                fragment: savedFragment,
            };

            Store.placeholders.list.data.set(updatedPlaceholders);
            this.resetEditState();

            this.showToast('Placeholder successfully saved', 'positive');
        } catch (error) {
            this.showToast(`Failed to save placeholder: ${error.message}`, 'negative');
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
        if (!confirm(`Are you sure you want to delete the placeholder with key: ${key}?`)) {
            return;
        }

        try {
            Store.placeholders.list.loading.set(true);
            const placeholder = this.placeholdersData.find(p => p.key === key);
            
            if (!placeholder?.fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }
            
            const fragmentData = placeholder.fragment;
            const fragmentPath = fragmentData.path;
            
            // Handle index removal if needed
            if (!fragmentPath.endsWith('/index')) {
                const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));
                try {
                    await this.removeFromIndexFragment(dictionaryPath, fragmentData);
                } catch (error) {
                    console.debug('Failed to remove from index, proceeding with deletion:', error);
                }
            }

            this.activeDropdown = null;

            // Delete the fragment
            await this.repository.deleteFragment(fragmentData, { 
                isInEditStore: false,
                refreshPlaceholders: false
            });

            // Update UI directly
            Store.placeholders.list.data.set(
                this.placeholdersData.filter(p => p.key !== key)
            );
        } catch (error) {
            this.showToast(`Failed to delete placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    /**
     * Removes a placeholder fragment from the index fragment
     * @param {string} dictionaryPath - Path to the dictionary folder
     * @param {Object} placeholderFragment - The placeholder fragment to remove from index
     * @returns {Promise<boolean>} - Success status
     */
    async removeFromIndexFragment(dictionaryPath, placeholderFragment) {
        try {
            const indexPath = `${dictionaryPath}/index`;
            const repository = this.repository;
            
            const indexFragment = await repository.aem.sites.cf.fragments.getByPath(indexPath);
            if (!indexFragment?.id) return true;

            const response = await fetch(`${repository.aem.cfFragmentsUrl}/${indexFragment.id}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...repository.aem.headers
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get index fragment: ${response.status}`);
            }

            const freshIndex = await response.json();
            const currentETag = response.headers.get('ETag');
            const entriesField = freshIndex.fields.find(f => f.name === 'entries');
            const existingEntries = entriesField?.values || [];
            const updatedEntries = existingEntries.filter(path => path !== placeholderFragment.path);
            
            // No change needed if path wasn't in the index
            if (existingEntries.length === updatedEntries.length) return true;
            
            const updatedFields = repository.updateFieldInFragment(
                freshIndex.fields, 
                'entries', 
                updatedEntries, 
                'content-fragment', 
                true
            );
            
            const saveResponse = await fetch(`${repository.aem.cfFragmentsUrl}/${indexFragment.id}`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'If-Match': currentETag,
                    ...repository.aem.headers
                },
                body: JSON.stringify({
                    title: freshIndex.title,
                    description: freshIndex.description || '',
                    fields: updatedFields
                })
            });

            if (!saveResponse.ok) {
                throw new Error(`Failed to save index: ${saveResponse.status}`);
            }

            const savedIndex = await saveResponse.json();
            await repository.aem.sites.cf.fragments.publish(savedIndex);
            
            return true;
        } catch (error) {
            console.debug('Index cleanup failed:', error);
            return true;
        }
    }

    /**
     * Search for placeholder fragments in the dictionary
     */
    async searchPlaceholders() {
        try {
            const folderPath = this.selectedFolder?.path;
            if (!folderPath) {
                return;
            }

            Store.placeholders.list.loading.set(true);
            const locale = this.selectedLocale || 'en_US';
            const dictionaryPath = `/content/dam/mas/${folderPath}/${locale}/dictionary`;
            const repository = this.repository;

            const query = {
                filter: {
                    path: dictionaryPath,
                },
                sort: [{ on: 'created', order: 'ASC' }],
            };

            const searchUrl = `${repository.aem.cfFragmentsUrl}/search?query=${encodeURIComponent(JSON.stringify(query))}&limit=50`;

            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...repository.aem.headers,
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    Store.placeholders.list.data.set([]);
                    return;
                }
                throw new Error(
                    `Network response was not ok: ${response.status} ${response.statusText}`,
                );
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                Store.placeholders.list.data.set([]);
                return;
            }

            const placeholders = data.items
                .filter((item) => !item.path.endsWith('/index'))
                .map((fragment) => {
                    if (!fragment || !fragment.fields) return null;

                    const keyField = fragment.fields.find(
                        (field) => field.name === 'key',
                    );
                    const valueField = fragment.fields.find(
                        (field) => field.name === 'value',
                    );
                    const richTextValueField = fragment.fields.find(
                        (field) => field.name === 'richTextValue',
                    );
                    const locReadyField = fragment.fields.find(
                        (field) => field.name === 'locReady',
                    );

                    const key =
                        keyField &&
                        keyField.values &&
                        keyField.values.length > 0
                            ? keyField.values[0]
                            : '';

                    let value = '';
                    if (
                        richTextValueField &&
                        richTextValueField.values &&
                        richTextValueField.values.length > 0
                    ) {
                        value = richTextValueField.values[0].replace(
                            /<[^>]*>/g,
                            '',
                        );
                    } else if (
                        valueField &&
                        valueField.values &&
                        valueField.values.length > 0
                    ) {
                        value = valueField.values[0];
                    }

                    const locReady =
                        locReadyField &&
                        locReadyField.values &&
                        locReadyField.values.length > 0
                            ? locReadyField.values[0]
                            : false;

                    return {
                        id: fragment.id,
                        key: key,
                        value: value,
                        locale: locale,
                        state: locReady ? 'Ready' : 'Not Ready',
                        updatedBy: fragment.modified?.by || 'Unknown',
                        updatedAt: fragment.modified?.at
                            ? new Date(fragment.modified.at).toLocaleString()
                            : 'Unknown',
                        path: fragment.path,
                        fragment: fragment,
                    };
                })
                .filter(Boolean);

            Store.placeholders.list.data.set(placeholders);
        } catch (error) {
            this.showToast(`Failed to search for placeholders: ${error.message}`, 'negative');
            Store.placeholders.list.data.set([]);
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    /**
     * Force a refresh of the placeholders table
     */
    async forceRefreshPlaceholders() {
        try {
            Store.placeholders.list.loading.set(true);
            await this.searchPlaceholders();
        } catch (error) {
            console.warn('Error refreshing placeholders:', error);
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    /**
     * Creates a new index fragment with initial entries
     * @param {string} parentPath - Parent path for the index
     * @param {string} fragmentPath - Initial fragment path to include
     * @returns {Promise<boolean>} - Success status
     */
    async createIndexFragment(parentPath, fragmentPath) {
        const repository = this.repository;
        const indexFragment = await repository.aem.sites.cf.fragments.create({
            parentPath,
            modelId: DICTIONARY_MODEL_ID,
            name: 'index',
            title: 'index',
            description: '',
            fields: [
                {
                    name: 'entries',
                    type: 'content-fragment',
                    multiple: true,
                    values: [fragmentPath]
                },
                {
                    name: 'locReady',
                    type: 'boolean',
                    multiple: false,
                    values: [true]
                }
            ]
        });
        
        await repository.aem.sites.cf.fragments.publish(indexFragment);
        return true;
    }

    /**
     * Updates index fragment with a new placeholder entry
     * @param {string} parentPath - Path to the directory containing the index
     * @param {string} fragmentPath - Path to the fragment to add to the index
     * @returns {Promise<boolean>} - Success status
     */
    async updateIndexFragment(parentPath, fragmentPath) {
        const indexPath = `${parentPath}/index`;
        const repository = this.repository;
        
        try {
            let indexFragment;
            try {
                indexFragment = await repository.aem.sites.cf.fragments.getByPath(indexPath);
            } catch (error) {
                console.log(`Index not found at ${indexPath}, creating new one`);
                return await this.createIndexFragment(parentPath, fragmentPath);
            }
            
            if (!indexFragment?.id) {
                throw new Error("Index fragment has no ID");
            }

            const response = await fetch(`${repository.aem.cfFragmentsUrl}/${indexFragment.id}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...repository.aem.headers
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get index fragment: ${response.status}`);
            }

            const freshIndex = await response.json();
            const entriesField = freshIndex.fields.find(f => f.name === 'entries');
            const currentEntries = entriesField?.values || [];
            
            if (currentEntries.includes(fragmentPath)) {
                return true;
            }

            const currentETag = response.headers.get('ETag');
            const updatedEntries = [...currentEntries, fragmentPath];
            const updatedFields = repository.updateFieldInFragment(freshIndex.fields, 'entries', updatedEntries, 'content-fragment', true);
            
            const saveResponse = await fetch(`${repository.aem.cfFragmentsUrl}/${indexFragment.id}`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'If-Match': currentETag,
                    ...repository.aem.headers
                },
                body: JSON.stringify({
                    title: freshIndex.title,
                    description: freshIndex.description || '',
                    fields: updatedFields
                })
            });

            if (!saveResponse.ok) {
                throw new Error(`Failed to save index: ${saveResponse.status}`);
            }

            const savedIndex = await saveResponse.json();
            await repository.aem.sites.cf.fragments.publish(savedIndex);
            return true;
        } catch (error) {
            console.error('Failed to update index:', error);
            throw error;
        }
    }

    /**
     * Create a placeholder with index operations
     * @param {Object} fragmentData - The fragment data to create
     * @returns {Promise<Object>} - The created fragment
     */
    async createPlaceholderWithIndex(fragmentData) {
        const repository = this.repository;
        try {
            repository.operation.set(OPERATIONS.CREATE);

            if (!fragmentData.parentPath || !fragmentData.modelId || !fragmentData.title) {
                throw new Error('Missing required data for placeholder creation');
            }
            
            // Use the repository's createFragment method for actual fragment creation
            const newFragment = await repository.createFragment(fragmentData);            
            const dictionaryPath = fragmentData.parentPath;
            const fragmentPath = newFragment.get().path;
            
            // Update the index to include the new placeholder
            try {
                await this.updateIndexFragment(dictionaryPath, fragmentPath);
            } catch (indexError) {
                console.error('Failed to update/create index:', indexError);
            }
            
            // Refresh UI and show success message
            await this.forceRefreshPlaceholders();
            this.showToast('Placeholder successfully created and published.', 'positive');
            repository.operation.set();
            return newFragment.get();
        } catch (error) {
            repository.operation.set();
            if (error.message?.includes('409')) {
                this.showToast('Failed to create placeholder: a placeholder with that key already exists', 'negative');
            } else {
                this.showToast(`Failed to create placeholder: ${error.message}`, 'negative');
            }
            throw error;
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
        this.editedKey = normalizeKey(e.target.value);
        this.draftStatus = true;
        this.requestUpdate();
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;
        this.draftStatus = true;
        this.requestUpdate();
    }

    getFilteredPlaceholders() {
        let filtered = this.placeholdersData || [];

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

    /**
     * Helper to create a table cell with optional styling
     * @param {string} content - Cell content
     * @param {string} align - Text alignment (left, right, center)
     * @returns {TemplateResult} The rendered table cell
     */
    renderTableCell(content, align = 'left') {
        return html`
            <sp-table-cell style=${align !== 'left' ? `text-align: ${align};` : ''}>
                ${content}
            </sp-table-cell>
        `;
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
        return this.renderTableCell(placeholder.key);
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
        return this.renderTableCell(placeholder.value);
    }

    renderTableHeader(columns) {
        return html`
            <sp-table-head>
                ${columns.map(({key, label, sortable, align}) => html`
                    <sp-table-head-cell
                        ?sortable=${sortable}
                        @click=${sortable ? () => this.handleSort(key) : undefined}
                        style="${align === 'right' ? 'text-align: right;' : ''}"
                    >
                        ${label}
                    </sp-table-head-cell>
                `)}
            </sp-table-head>
        `;
    }

    renderPlaceholdersTable() {
        const filteredPlaceholders = this.getFilteredPlaceholders();
        const columns = [
            { key: 'key', label: 'Key', sortable: true },
            { key: 'value', label: 'Value', sortable: true },
            { key: 'locale', label: 'Locale', sortable: true, align: 'right' },
            { key: 'updatedBy', label: 'Updated by', sortable: true, align: 'right' },
            { key: 'updatedAt', label: 'Date & Time', sortable: true, align: 'right' },
            { key: 'action', label: 'Action', align: 'right' }
        ];

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
                ${this.renderTableHeader(columns)}
                <sp-table-body>
                    ${repeat(
                        filteredPlaceholders,
                        (placeholder) => placeholder.key,
                        (placeholder) => html`
                            <sp-table-row value=${placeholder.key}>
                                ${this.renderKeyCell(placeholder)}
                                ${this.renderValueCell(placeholder)}
                                ${this.renderTableCell(placeholder.locale, 'right')}
                                ${this.renderTableCell(placeholder.updatedBy, 'right')}
                                ${this.renderTableCell(placeholder.updatedAt, 'right')}
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
        this.newPlaceholder.key = normalizeKey(e.target.value);
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

    renderFormGroup(id, label, isRequired, component) {
        return html`
            <div class="form-group">
                <label for=${id}>
                    ${label}
                    ${isRequired ? html`<span class="required">*</span>` : nothing}
                </label>
                ${component}
            </div>
        `;
    }

    renderCreateModal() {
        if (!this.showCreateModal) return nothing;

        const keyField = html`
            <sp-textfield
                id="placeholder-key"
                placeholder="Key"
                .value=${this.newPlaceholder.key}
                @input=${this.handleNewPlaceholderKeyChange}
            ></sp-textfield>
        `;

        const localeField = html`
            <mas-locale-picker
                id="placeholder-locale"
                @locale-changed=${this.handleNewPlaceholderLocaleChange}
            ></mas-locale-picker>
        `;

        const valueField = html`
            <sp-textfield
                id="placeholder-value"
                placeholder="Value"
                .value=${this.newPlaceholder.value}
                @input=${this.handleNewPlaceholderValueChange}
            ></sp-textfield>
        `;

        return html`
            <div
                class="create-modal-overlay"
                @click=${(e) => e.stopPropagation()}
            >
                <div class="create-modal" @click=${(e) => e.stopPropagation()}>
                    <div class="create-modal-content">
                        <h2 class="create-modal-title">Create Placeholder</h2>

                        <div class="create-modal-form">
                            ${this.renderFormGroup("placeholder-key", "Enter Key", true, keyField)}
                            ${this.renderFormGroup("placeholder-locale", "Choose Locale", true, localeField)}
                            ${this.renderFormGroup("placeholder-value", "Enter Value", true, valueField)}
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
            this.searchPlaceholders();
        }
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

        const dropdownMenu = this.activeDropdown === placeholder.key 
            ? html`
                <div class="dropdown-menu">
                    <div
                        class="dropdown-item"
                        @click=${() => this.handleDelete(placeholder.key)}
                    >
                        <sp-icon-delete></sp-icon-delete>
                        <span>Delete</span>
                    </div>
                </div>
            ` 
            : nothing;

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
                ${dropdownMenu}
            </sp-table-cell>
        `;
    }

    renderPlaceholdersContent() {
        if (!(this.foldersLoaded ?? false)) {
            return html`<div class="loading-message">Loading...</div>`;
        }
        
        if (!this.selectedFolder?.path) {
            return html`<div class="no-folder-message">
                Please select a folder to view placeholders
            </div>`;
        }
        
        if (this.loading) {
            return this.loadingIndicator;
        }
        
        return this.renderPlaceholdersTable();
    }

    render() {
        const modalContent = this.showCreateModal ? this.renderCreateModal() : nothing;
        
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

                ${modalContent}
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
