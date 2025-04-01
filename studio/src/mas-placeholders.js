import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './mas-placeholders.css.js';
import Store from './store.js';
import Events from './events.js';
import { MasRepository } from './mas-repository.js';
import './mas-folder-picker.js';
import './filters/locale-picker.js';
import './rte/rte-field.js';
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
        this.editedRichText = false;
        this.activeDropdown = null;
        this.showCreateModal = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: 'en_US',
            isRichText: false
        };
        this.error = null;
        this.selectedFolder = {};
        this.selectedLocale = localStorage.getItem('selectedLocale') || 'en_US';
        this.folderData = [];
        this.foldersLoaded = false;
        this.placeholdersData = [];
        this.placeholdersLoading = false;
        this.isBulkDeleteInProgress = false;
        this.subscriptions = [];
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleCreateModalClickOutside =
            this.handleCreateModalClickOutside.bind(this);
        this.handleFolderChange = this.handleFolderChange.bind(this);
        this.handleLocaleChange = this.handleLocaleChange.bind(this);
        this.handleRteValueChange = this.handleRteValueChange.bind(this);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get loading() {
        return this.placeholdersLoading;
    }

    /**
     * Search and filter placeholders based on current search text
     * @param {boolean} forceCacheBust - Whether to bypass cache
     */
    async searchPlaceholders(forceCacheBust = false) {
        if (!this.placeholdersData || !this.placeholdersData.length) return;
        
        // Ensure filtered data structure exists
        if (!Store.placeholders.filtered || !Store.placeholders.filtered.data) {
            console.log('Initializing filtered placeholders store');
            if (!Store.placeholders.filtered) {
                Store.placeholders.filtered = {};
            }
            if (!Store.placeholders.filtered.data) {
                Store.placeholders.filtered.data = {
                    set: (data) => {
                        Store.placeholders.filtered._data = data;
                        this.requestUpdate();
                    },
                    get: () => Store.placeholders.filtered._data || []
                };
                Store.placeholders.filtered._data = [];
            }
        }
        
        const searchText = this.searchQuery?.toLowerCase().trim() || '';
        if (!searchText) {
            Store.placeholders.filtered.data.set(this.placeholdersData);
            this.updateTableSelection();
            return;
        }
        
        const filteredPlaceholders = this.placeholdersData.filter(placeholder => {
            const key = placeholder.key?.toLowerCase() || '';
            const value = placeholder.displayValue?.toLowerCase() || '';
            return key.includes(searchText) || value.includes(searchText);
        });
        
        Store.placeholders.filtered.data.set(filteredPlaceholders);
        this.updateTableSelection();
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
                this.loadPlaceholders();
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

            const createdFragment = await this.createPlaceholderWithIndex(fragmentData);
            if (!createdFragment) {
                throw new Error('Failed to create placeholder fragment');
            }
            
            this.newPlaceholder = { key: '', value: '', locale: this.selectedLocale, isRichText: false };
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
            if (!fragmentData || !fragmentData.id) {
                throw new Error('Fragment data is missing or invalid');
            }

            Store.placeholders.list.loading.set(true);

            const repository = this.repository;
            const fragmentId = fragmentData.id;
            const fragmentEndpoint = `${repository.aem.cfFragmentsUrl}/${fragmentId}`;

            const getResponse = await fetch(fragmentEndpoint, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...repository.aem.headers
                }
            });

            if (!getResponse.ok) {
                throw new Error(`Failed to get latest fragment: ${getResponse.status}`);
            }

            const latestFragment = await getResponse.json();
            const currentETag = getResponse.headers.get('ETag');

            if (!currentETag) {
                throw new Error('Failed to get ETag for fragment');
            }

            const savePayload = {
                title: fragmentData.title || this.editedKey,
                description: fragmentData.description || '',
                fields: []
            };

            const fieldsToUpdate = [
                { name: 'key', value: this.editedKey },
                { name: 'value', value: this.editedValue },
                { name: 'locReady', value: true }
            ];

            const currentFields = latestFragment.fields || [];

            fieldsToUpdate.forEach((field) => {
                const existingFieldIndex = currentFields.findIndex(f => f.name === field.name);
                
                if (existingFieldIndex !== -1) {
                    const existingField = {...currentFields[existingFieldIndex]};
                    existingField.values = [field.value];
                    savePayload.fields.push(existingField);
                } else {
                    savePayload.fields.push({
                        name: field.name,
                        type: field.name === 'locReady' ? 'boolean' : 'text',
                        values: [field.value]
                    });
                }
            });

            currentFields.forEach(field => {
                if (!fieldsToUpdate.some(f => f.name === field.name)) {
                    savePayload.fields.push({...field});
                }
            });

            const saveResponse = await fetch(fragmentEndpoint, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'If-Match': currentETag,
                    ...repository.aem.headers
                },
                body: JSON.stringify(savePayload)
            });

            if (!saveResponse.ok) {
                throw new Error(`Failed to save fragment: ${saveResponse.status} ${saveResponse.statusText}`);
            }

            const savedFragment = await saveResponse.json();

            try {
                await repository.aem.sites.cf.fragments.publish(savedFragment);
            } catch (publishError) {
                this.showToast(`Fragment saved but failed to publish: ${publishError.message}`, 'warning');
            }

            const containsHtml = /<\/?[a-z][\s\S]*>/i.test(this.editedValue);
            const displayValue = containsHtml ? 
                this.editedValue.replace(/<[^>]*>/g, '') : this.editedValue;
            
            const updatedPlaceholders = [...this.placeholdersData];
            updatedPlaceholders[placeholderIndex] = {
                ...placeholder,
                key: this.editedKey,
                value: this.editedValue,
                displayValue: displayValue,
                isRichText: containsHtml,
                fragment: savedFragment,
                updatedAt: new Date().toLocaleString()
            };
            
            Store.placeholders.list.data.set(updatedPlaceholders);

            this.resetEditState();
            this.showToast('Placeholder successfully saved and published', 'positive');
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
        this.editedRichText = false;
    }

    async handleDelete(key) {
        if (this.isDialogOpen) {
            return;
        }
        
        this.selectedPlaceholders = this.selectedPlaceholders.filter(k => k !== key);
        
        const confirmed = await this.showDialog(
            'Delete Placeholder',
            `Are you sure you want to delete the placeholder "${key}"? This action cannot be undone.`,
            { confirmText: 'Delete', cancelText: 'Cancel', variant: 'negative' }
        );
        
        if (!confirmed) return;
        
        try {
            Store.placeholders.list.loading.set(true);
            const placeholder = this.placeholdersData.find(p => p.key === key);
            
            if (!placeholder?.fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }
            
            const fragmentData = placeholder.fragment;
            const fragmentId = fragmentData.id;
            const fragmentPath = fragmentData.path;
            
            if (!fragmentPath.endsWith('/index')) {
                const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));
                await this.removeFromIndexFragment(dictionaryPath, fragmentData);
            }

            this.activeDropdown = null;

            await this.repository.deleteFragment(fragmentData, { 
                isInEditStore: false,
                refreshPlaceholders: false 
            });

            const updatedPlaceholders = this.placeholdersData.filter(p => p.id !== fragmentId);
            Store.placeholders.list.data.set(updatedPlaceholders);
            
            this.showToast('Placeholder successfully deleted', 'positive');
        } catch (error) {
            this.showToast(`Failed to delete placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    async removeFromIndexFragment(dictionaryPath, placeholderFragment) {
        if (!dictionaryPath || !placeholderFragment?.path) {
            return false;
        }
        
        try {
            const indexPath = `${dictionaryPath}/index`;
            const repository = this.repository;
            
            if (!repository) {
                return false;
            }
            
            let indexFragment;
            try {
                indexFragment = await repository.aem.sites.cf.fragments.getByPath(indexPath);
            } catch (error) {
                return true;
            }
            
            if (!indexFragment?.id) {
                return false;
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
                return false;
            }

            const freshIndex = await response.json();
            const currentETag = response.headers.get('ETag');
            if (!currentETag) {
                return false;
            }
            
            const entriesField = freshIndex.fields.find(f => f.name === 'entries');
            const existingEntries = entriesField?.values || [];
            const updatedEntries = existingEntries.filter(path => path !== placeholderFragment.path);
            
            if (existingEntries.length === updatedEntries.length) {
                return true;
            }
            
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
                if (saveResponse.status === 412) {
                    return await this.removeFromIndexFragment(dictionaryPath, placeholderFragment);
                }
                return false;
            }

            const savedIndex = await saveResponse.json();
            try {
                await repository.aem.sites.cf.fragments.publish(savedIndex);
            } catch (publishError) {
                // Failed to publish but update was successful
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Load placeholders with selective update
     * Fetches data and updates Store without triggering a full reload
     * @param {boolean} forceCacheBust - Whether to bypass cache
     */
    async loadPlaceholders(forceCacheBust = false) {
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

            let searchUrl = `${repository.aem.cfFragmentsUrl}/search?query=${encodeURIComponent(JSON.stringify(query))}&limit=50`;
            if (forceCacheBust) {
                searchUrl += `&timestamp=${Date.now()}`;
            }

            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...repository.aem.headers,
                },
                cache: forceCacheBust ? 'no-store' : 'default'
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
                    if (valueField?.values?.length > 0) {
                        value = valueField.values[0];
                    }

                    const locReady =
                        locReadyField &&
                        locReadyField.values &&
                        locReadyField.values.length > 0
                            ? locReadyField.values[0]
                            : false;

                    const containsHtml = /<\/?[a-z][\s\S]*>/i.test(value);
                    
                    const displayValue = containsHtml ? 
                        value.replace(/<[^>]*>/g, '') : value;

                    return {
                        id: fragment.id,
                        key: key,
                        value: value,
                        displayValue: displayValue,
                        isRichText: containsHtml,
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
            
            const createPayload = {
                name: fragmentData.name,
                parentPath: fragmentData.parentPath,
                modelId: fragmentData.modelId,
                title: fragmentData.title,
                description: fragmentData.description || '',
                fields: []
            };

            if (fragmentData.data) {
                Object.entries(fragmentData.data).forEach(([key, value]) => {
                    if (value !== undefined) {
                        createPayload.fields.push({
                            name: key,
                            type: key === 'locReady' ? 'boolean' : 'text',
                            values: [value]
                        });
                    }
                });
            }
            
            const newFragment = await repository.createFragment(createPayload);            
            if (!newFragment) {
                throw new Error('Fragment creation failed - no response received');
            }
            
            const createdFragmentData = newFragment.get();
            if (!createdFragmentData || !createdFragmentData.path) {
                throw new Error('Fragment creation returned invalid data');
            }
            
            const fragmentPath = createdFragmentData.path;
            const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));
            
            if (!dictionaryPath) {
                throw new Error('Failed to determine dictionary path from fragment path: ' + fragmentPath);
            }
            
            const indexUpdateResult = await this.updateIndexFragment(dictionaryPath, fragmentPath);
            if (!indexUpdateResult) {
                throw new Error('Failed to update index fragment with new placeholder reference');
            }
            
            const locale = this.selectedLocale || 'en_US';
            const key = fragmentData.data.key;
            const value = fragmentData.data.value;
            const containsHtml = /<\/?[a-z][\s\S]*>/i.test(value);
            const displayValue = containsHtml ? 
                value.replace(/<[^>]*>/g, '') : value;
                
            const newPlaceholder = {
                id: createdFragmentData.id,
                key: key,
                value: value,
                displayValue: displayValue,
                isRichText: containsHtml,
                locale: locale,
                state: 'Ready',
                updatedBy: 'You',
                updatedAt: new Date().toLocaleString(),
                path: fragmentPath,
                fragment: createdFragmentData
            };
            
            const updatedPlaceholders = [...this.placeholdersData, newPlaceholder];
            Store.placeholders.list.data.set(updatedPlaceholders);
            
            this.showToast('Placeholder successfully created and published.', 'positive');
            repository.operation.set();
            return createdFragmentData;
        } catch (error) {
            repository.operation.set();
            if (error.message?.includes('409')) {
                this.showToast('Failed to create placeholder: a placeholder with that key already exists', 'negative');
            } else {
                this.showToast(`Failed to create placeholder: ${error.message}`, 'negative');
            }
            return null;
        }
    }

    /**
     * Updates index fragment with a new placeholder entry
     * @param {string} parentPath - Path to the directory containing the index
     * @param {string} fragmentPath - Path to the fragment to add to the index
     * @returns {Promise<boolean>} - Success status
     */
    async updateIndexFragment(parentPath, fragmentPath) {
        if (!parentPath || !fragmentPath) {
            return false;
        }
        
        const indexPath = `${parentPath}/index`;
        const repository = this.repository;
        
        if (!repository) {
            return false;
        }
        
        try {
            let indexFragment;
            try {
                indexFragment = await repository.aem.sites.cf.fragments.getByPath(indexPath);
            } catch (error) {
                return await this.createIndexFragment(parentPath, fragmentPath);
            }
            
            if (!indexFragment?.id) {
                return await this.createIndexFragment(parentPath, fragmentPath);
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
                return await this.createIndexFragment(parentPath, fragmentPath);
            }

            const freshIndex = await response.json();
            
            const entriesField = freshIndex.fields.find(f => f.name === 'entries');
            const currentEntries = entriesField?.values || [];
            
            if (currentEntries.includes(fragmentPath)) {
                return true;
            }

            const currentETag = response.headers.get('ETag');
            if (!currentETag) {
                return await this.createIndexFragment(parentPath, fragmentPath);
            }
            
            const updatedEntries = [...currentEntries, fragmentPath];
            
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
                    title: freshIndex.title || 'Dictionary Index',
                    description: freshIndex.description || 'Index of dictionary placeholders',
                    fields: updatedFields
                })
            });

            if (!saveResponse.ok) {
                if (saveResponse.status === 412) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return await this.updateIndexFragment(parentPath, fragmentPath);
                }
                
                return false;
            }

            const savedIndex = await saveResponse.json();
            
            try {
                await repository.aem.sites.cf.fragments.publish(savedIndex);
            } catch (publishError) {
                // Publication failed, but index update was successful
            }
            
            return true;
        } catch (error) {
            return false;
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
        this.clearRteInitializedFlags();
        this.requestUpdate();
    }

    clearRteInitializedFlags() {
        const rteFields = this.shadowRoot?.querySelectorAll('rte-field');
        if (rteFields) {
            rteFields.forEach(field => {
                field.initDone = false;
            });
        }
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
            isRichText: false
        };

        setTimeout(() => {
            if (!this.showCreateModal) {
                this.showCreateModal = true;
                this.requestUpdate();
            }
        }, 100);
    }

    updateTableSelection(event) {
        if (event && event.target) {
            this.selectedPlaceholders = Array.from(event.target.selectedSet);
            this.requestUpdate();
        }
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

    /**
     * Start editing a placeholder
     * @param {Object} placeholder - The placeholder to edit
     */
    startEdit(placeholder) {
        if (this.editingPlaceholder) {
            this.cancelEdit();
        }

        this.editingPlaceholder = placeholder.key;
        this.editedKey = placeholder.key;
        this.editedValue = placeholder.value;
        this.editedRichText = placeholder.isRichText;
        this.requestUpdate();
    }

    cancelEdit() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.editedRichText = false;
        this.clearRteInitializedFlags();
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
        this.requestUpdate();
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;
        this.requestUpdate();
    }

    handleRteValueChange(e) {
        if (e && e.target) {
            this.editedValue = e.target.value || '';
            this.requestUpdate();
        }
    }

    handleNewPlaceholderKeyChange(e) {
        this.newPlaceholder.key = normalizeKey(e.target.value);
        this.requestUpdate();
    }

    handleNewPlaceholderLocaleChange(e) {
        this.newPlaceholder.locale = e.detail.locale;
        this.requestUpdate();
    }

    handleNewPlaceholderRteChange(e) {
        if (e && e.target) {
            this.newPlaceholder.value = e.target.value || '';
            this.requestUpdate();
        }
    }

    handleRichTextToggle(e) {
        const existingField = this.shadowRoot.querySelector('#placeholder-rich-value');
        if (existingField) {
            existingField.initDone = false;
        }
        
        this.newPlaceholder.isRichText = e.target.checked;
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
                    placeholder.displayValue
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
     * Renders a table cell with optional tooltip
     * @param {string} content - Cell content
     * @returns {TemplateResult} - HTML template
     */
    renderTableCell(content) {
        const value = content || '';
        const needsTooltip = value.length > 50;
        
        if (needsTooltip) {
            return html`
                <sp-table-cell>
                    <sp-tooltip placement="right">
                        ${value}
                        <div slot="trigger" class="cell-content">${value.substring(0, 50)}...</div>
                    </sp-tooltip>
                </sp-table-cell>
            `;
        }
        
        return html`
            <sp-table-cell>
                <div class="cell-content">${value}</div>
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
                        ${this.editedRichText ? 
                            html`
                                <div class="rte-container">
                                    <rte-field
                                        inline
                                        link
                                        .maxLength=${500}
                                        @change=${this.handleRteValueChange}
                                    ></rte-field>
                                </div>
                            ` : 
                            html`<sp-textfield
                                placeholder="Value"
                                .value=${this.editedValue}
                                @input=${this.handleValueChange}
                            ></sp-textfield>`
                        }
                    </div>
                </sp-table-cell>
            `;
        }
        
        if (placeholder.isRichText) {
            return html`
                <sp-table-cell>
                    <div class="rich-text-cell" .innerHTML=${placeholder.value}></div>
                </sp-table-cell>
            `;
        }
        
        return this.renderTableCell(placeholder.displayValue);
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

    handleNewPlaceholderValueChange(e) {
        this.newPlaceholder.value = e.target.value;
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

        const richTextToggle = html`
            <div class="rich-text-toggle">
                <sp-switch
                    id="rich-text-toggle"
                    @change=${this.handleRichTextToggle}
                    .checked=${this.newPlaceholder.isRichText}
                >
                    Rich Text
                </sp-switch>
            </div>
        `;

        const valueField = this.newPlaceholder.isRichText ? 
            html`
                <div class="rte-container">
                    <rte-field
                        id="placeholder-rich-value"
                        inline
                        link
                        .maxLength=${500}
                        @change=${this.handleNewPlaceholderRteChange}
                    ></rte-field>
                </div>
            ` : 
            html`
                <sp-textfield
                    id="placeholder-value"
                    placeholder="Value"
                    .value=${this.newPlaceholder.value}
                    @input=${this.handleNewPlaceholderValueChange}
                ></sp-textfield>
            `;

        setTimeout(() => {
            if (this.newPlaceholder.isRichText) {
                const rteField = this.shadowRoot.querySelector('#placeholder-rich-value');
                if (rteField) {
                    rteField.innerHTML = this.newPlaceholder.value || '';
                }
            }
        }, 0);

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
                            ${richTextToggle}
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
            this.loadPlaceholders();
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
                        @click=${(e) => {
                            e.stopPropagation();
                            this.handleDelete(placeholder.key);
                        }}
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
                        @click=${(e) => {
                            e.stopPropagation();
                            this.startEdit(placeholder);
                        }}
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

    /**
     * Check if the bulk action button should be visible
     * @returns {boolean} - True if the button should be visible
     */
    shouldShowBulkAction() {
        return this.selectedPlaceholders.length > 0 && !this.isDialogOpen && !this.loading;
    }

    render() {
        const modalContent = this.showCreateModal ? this.renderCreateModal() : nothing;
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

                ${modalContent}
                ${confirmDialog}
                
                <div class="bulk-action-container ${showBulkAction ? 'visible' : ''}">
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

    updated(changedProperties) {
        super.updated(changedProperties);
        
        if (this.editingPlaceholder && this.editedRichText) {
            const rteField = this.shadowRoot.querySelector('rte-field');
            if (rteField && !rteField.initDone) {
                rteField.innerHTML = this.editedValue;
                rteField.initDone = true;
            }
        }
        
        if (this.showCreateModal && this.newPlaceholder.isRichText) {
            const rteField = this.shadowRoot.querySelector('#placeholder-rich-value');
            if (rteField && !rteField.initDone) {
                rteField.innerHTML = this.newPlaceholder.value || '';
                rteField.initDone = true;
            }
        }
    }

    /**
     * Creates a new index fragment with initial entries
     * @param {string} parentPath - Parent path for the index
     * @param {string} fragmentPath - Initial fragment path to include
     * @returns {Promise<boolean>} - Success status
     */
    async createIndexFragment(parentPath, fragmentPath) {
        if (!parentPath || !fragmentPath) {
            return false;
        }
        
        try {
            const repository = this.repository;
            if (!repository) {
                return false;
            }
            
            const indexFragment = await repository.aem.sites.cf.fragments.create({
                parentPath,
                modelId: DICTIONARY_MODEL_ID,
                name: 'index',
                title: 'Dictionary Index',
                description: 'Index of dictionary placeholders',
                fields: [
                    {
                        name: 'entries',
                        type: 'content-fragment',
                        multiple: true,
                        values: [fragmentPath]
                    },
                    {
                        name: 'key',
                        type: 'text',
                        multiple: false,
                        values: ['index']
                    },
                    {
                        name: 'value',
                        type: 'text',
                        multiple: false,
                        values: ['Dictionary index']
                    },
                    {
                        name: 'locReady',
                        type: 'boolean',
                        multiple: false,
                        values: [true]
                    }
                ]
            });
            
            if (!indexFragment || !indexFragment.id) {
                return false;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
                await repository.aem.sites.cf.fragments.publish(indexFragment);
            } catch (publishError) {
                this.showToast('Created index fragment but failed to publish it', 'warning');
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            console.warn('A dialog is already open');
            return false;
        }
        
        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;
        
        return new Promise(resolve => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                }
            };
            
            this.requestUpdate();
        });
    }

    /**
     * Handle bulk delete of selected placeholders
     */
    async handleBulkDelete() {
        if (this.isBulkDeleteInProgress || this.isDialogOpen) {
            return;
        }
        
        const placeholdersToDelete = [...this.selectedPlaceholders];
        this.selectedPlaceholders = [];
        
        if (!placeholdersToDelete.length) return;
        
        const confirmed = await this.showDialog(
            'Delete Placeholders',
            `Are you sure you want to delete ${placeholdersToDelete.length} placeholders? This action cannot be undone.`,
            { confirmText: 'Delete', cancelText: 'Cancel', variant: 'negative' }
        );
        
        if (!confirmed) return;
        
        this.isBulkDeleteInProgress = true;
        Store.placeholders.list.loading.set(true);
        this.showToast(`Deleting ${placeholdersToDelete.length} placeholders...`, 'info');
        
        const successfulDeletes = [];
        const failedDeletes = [];
        
        try {
            const placeholderObjects = this.placeholdersData.filter(p => 
                placeholdersToDelete.includes(p.key));
                
            for (const placeholder of placeholderObjects) {
                try {
                    if (placeholder.fragment) {
                        const fragmentData = placeholder.fragment;
                        const fragmentPath = fragmentData.path;
                        
                        if (!fragmentPath.endsWith('/index')) {
                            const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));
                            try {
                                await this.removeFromIndexFragment(dictionaryPath, fragmentData);
                            } catch (error) {
                                // Continue with deletion even if index removal fails
                            }
                        }
                        
                        await this.repository.deleteFragment(fragmentData, { 
                            isInEditStore: false,
                            refreshPlaceholders: false 
                        });
                        
                        successfulDeletes.push(placeholder.key);
                    } else {
                        failedDeletes.push(placeholder.key);
                    }
                } catch (error) {
                    failedDeletes.push(placeholder.key);
                }
            }
            
            const updatedPlaceholders = this.placeholdersData.filter(p => 
                !successfulDeletes.includes(p.key));
                
            Store.placeholders.list.data.set(updatedPlaceholders);
            
            if (successfulDeletes.length > 0) {
                this.loadPlaceholders(true);
                
                if (failedDeletes.length > 0) {
                    this.showToast(`Deleted ${successfulDeletes.length} placeholders, but ${failedDeletes.length} failed`, 'warning');
                } else {
                    this.showToast(`Successfully deleted ${successfulDeletes.length} placeholders`, 'positive');
                }
            } else if (failedDeletes.length > 0) {
                this.showToast(`Failed to delete any placeholders`, 'negative');
            }
        } catch (error) {
            this.showToast(`Failed to delete placeholders: ${error.message}`, 'negative');
        } finally {
            this.isBulkDeleteInProgress = false;
            Store.placeholders.list.loading.set(false);
        }
    }

    /**
     * Renders a confirmation dialog
     * @returns {TemplateResult} - HTML template
     */
    renderConfirmDialog() {
        if (!this.confirmDialogConfig) return nothing;
        
        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;
        
        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="bulk-delete-confirm-dialog"
                    .heading=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        this.requestUpdate();
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        this.requestUpdate();
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
