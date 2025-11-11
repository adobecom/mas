import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './placeholders/mas-placeholders.css.js';
import Store from './store.js';
import Events from './events.js';
import { MasRepository } from './mas-repository.js';
import './mas-folder-picker.js';
import './filters/locale-picker.js';
import './rte/rte-field.js';
import './mas-fragment-status.js';
import {
    ROOT_PATH,
    DICTIONARY_ENTRY_MODEL_ID,
    PAGE_NAMES,
    OPERATIONS,
    STATUS_DRAFT,
    STATUS_PUBLISHED,
    TAG_STATUS_PUBLISHED,
    TAG_STATUS_DRAFT,
} from './constants.js';
import { normalizeKey } from './utils.js';
import ReactiveController from './reactivity/reactive-controller.js';

const typeMap = {
    richTextValue: 'long-text',
    locReady: 'boolean',
};

function withLoadingState(fn) {
    return async function (...args) {
        try {
            Store.placeholders.list.loading.set(true);
            return await fn.apply(this, args);
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    };
}

function getFragmentFieldValue(fragment, fieldName, defaultValue = '') {
    if (!fragment?.fields) return defaultValue;
    const field = fragment.fields.find((field) => field.name === fieldName);
    if (!field?.values?.length) return defaultValue;
    return field.values[0];
}

export function getDictionaryPath(folderPath, locale) {
    if (!folderPath || !locale) return null;
    return `${ROOT_PATH}/${folderPath}/${locale}/dictionary`;
}

class MasPlaceholders extends LitElement {
    static styles = styles;

    static properties = {
        searchQuery: { type: String, state: true },
        selectedPlaceholders: { type: Array, state: true },
        sortField: { type: String, state: true },
        sortDirection: { type: String, state: true },
        editingPlaceholder: { type: String, state: true },
        editedKey: { type: String, state: true },
        editedValue: { type: String, state: true },
        editedRichText: { type: Boolean, state: true },
        activeDropdown: { type: String, state: true },
        showCreateModal: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        newPlaceholder: { type: Object, state: true },
        error: { type: String, state: true },
        selectedFolder: { type: Object, state: true },
        selectedLocale: { type: String, state: true },
        folderData: { type: Array, state: true },
        foldersLoaded: { type: Boolean, state: true },
        placeholdersData: { type: Array, state: true },
        placeholdersLoading: { type: Boolean, state: true },
        isBulkDeleteInProgress: { type: Boolean, state: true },
        modifiedPlaceholders: { type: Object, state: true },
    };

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
            isRichText: false,
        };
        this.error = null;
        this.selectedFolder = {};
        this.selectedLocale = 'en_US';
        this.folderData = [];
        this.foldersLoaded = false;
        this.placeholdersData = [];
        this.placeholdersLoading = false;
        this.isBulkDeleteInProgress = false;
        this.modifiedPlaceholders = {};

        this.reactiveController = new ReactiveController(this, [
            Store.search,
            Store.filters,
            Store.folders.data,
            Store.folders.loaded,
            Store.placeholders?.list?.data,
            Store.placeholders?.list?.loading,
        ]);

        if (Store.placeholders?.list?.data) {
            this.placeholdersData = Store.placeholders.list.data.get() || [];
        }
        if (Store.placeholders?.list?.loading) {
            this.placeholdersLoading = Store.placeholders.list.loading.get() || false;
        }
        if (Store.search) {
            this.selectedFolder = Store.search.get() || {};
        }
        if (Store.filters) {
            this.selectedLocale = Store.filters.get().locale || 'en_US';
        }

        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleFolderChange = this.handleFolderChange.bind(this);
        this.handleLocaleChange = this.handleLocaleChange.bind(this);
        this.handleRteValueChange = this.handleRteValueChange.bind(this);
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

        const filteredPlaceholders = this.placeholdersData.filter((placeholder) => {
            const key = placeholder.key?.toLowerCase() || '';
            const value = placeholder.displayValue?.toLowerCase() || '';
            return key.includes(searchText) || value.includes(searchText);
        });

        Store.placeholders.filtered.data.set(filteredPlaceholders);
        this.updateTableSelection();
        this.ensureTableCheckboxes();
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
    }

    handleFolderChange() {
        Store.placeholders.list.loading.set(true);
        if (this.repository) {
            this.loadPlaceholders();
        } else {
            this.error = 'Repository component not found';
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        const currentFolder = Store.search.get();
        const currentLocale = Store.filters.get().locale || 'en_US';
        const currentFolderData = Store.folders?.data?.get() || [];
        const currentFoldersLoaded = Store.folders?.loaded?.get() || false;
        const currentPlaceholdersData = Store.placeholders?.list?.data?.get() || [];
        const currentPlaceholdersLoading = Store.placeholders?.list?.loading?.get() || false;

        if (currentLocale !== this.selectedLocale && currentFolder?.path && !currentPlaceholdersLoading) {
            this.selectedLocale = currentLocale;
            Store.placeholders.list.loading.set(true);
            if (this.repository) {
                this.loadPlaceholders(true);
            }
        }

        if (currentFolder?.path !== this.selectedFolder?.path && !currentPlaceholdersLoading) {
            this.selectedFolder = currentFolder;
            this.handleFolderChange();
        }

        this.selectedFolder = currentFolder;
        this.selectedLocale = currentLocale;
        this.folderData = currentFolderData;
        this.foldersLoaded = currentFoldersLoaded;
        this.placeholdersData = currentPlaceholdersData;
        this.placeholdersLoading = currentPlaceholdersLoading;

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

    async createPlaceholder() {
        if (!this.newPlaceholder.key || !this.newPlaceholder.value) {
            this.showToast('Key and Value are required', 'negative');
            return;
        }

        try {
            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;

            const folderPath = this.selectedFolder.path;
            const locale = this.newPlaceholder.locale || this.selectedLocale || 'en_US';

            const dictionaryPath = getDictionaryPath(folderPath, locale);
            if (!dictionaryPath) {
                throw new Error('Failed to construct dictionary path');
            }

            const fragmentData = {
                name: this.newPlaceholder.key,
                parentPath: dictionaryPath,
                modelId: DICTIONARY_ENTRY_MODEL_ID,
                title: this.newPlaceholder.key,
                description: `Placeholder for ${this.newPlaceholder.key}`,
                data: {
                    key: this.newPlaceholder.key,
                    value: this.newPlaceholder.isRichText ? '' : this.newPlaceholder.value,
                    richTextValue: this.newPlaceholder.isRichText ? this.newPlaceholder.value : '',
                    locReady: true,
                },
            };

            const createdFragment = await this.createPlaceholderWithIndex(fragmentData);
            if (!createdFragment) {
                throw new Error('Failed to create placeholder fragment');
            }

            this.newPlaceholder = {
                key: '',
                value: '',
                locale: this.selectedLocale,
                isRichText: false,
            };
            this.showCreateModal = false;
            this.selectedPlaceholders = [];
        } catch (error) {
            this.showToast(`Failed to create placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    }

    async saveEdit() {
        try {
            if (!this.editingPlaceholder) {
                throw new Error('No placeholder is being edited');
            }

            const placeholderIndex = this.placeholdersData.findIndex((p) => p.key === this.editingPlaceholder);

            if (placeholderIndex === -1) {
                throw new Error(`Placeholder "${this.editingPlaceholder}" not found`);
            }

            const placeholder = this.placeholdersData[placeholderIndex];

            if (placeholder.key === this.editedKey && placeholder.value === this.editedValue) {
                this.showToast('No changes to save', 'info');
                this.resetEditState();
                return;
            }

            const fragmentData = placeholder.fragment;
            if (!fragmentData?.id) {
                throw new Error('Fragment data is missing or invalid');
            }

            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
            }

            const latestFragment = await repository.aem.sites.cf.fragments.getById(fragmentData.id);
            if (!latestFragment) {
                throw new Error('Failed to get latest fragment');
            }

            const updatedFragment = { ...latestFragment };
            updatedFragment.title = this.editedKey || fragmentData.title || '';
            updatedFragment.description = fragmentData.description || '';
            const newStatus = STATUS_DRAFT;
            updatedFragment.status = newStatus;
            updatedFragment.newTags = [TAG_STATUS_DRAFT];

            const fieldUpdates = [
                ['key', [this.editedKey]],
                ['value', [this.editedRichText ? '' : this.editedValue]],
                ['richTextValue', [this.editedRichText ? this.editedValue : '']],
                ['locReady', [true]],
            ];

            fieldUpdates.forEach(([name, values]) => {
                updatedFragment.fields.find((field) => field.name === name).values = values;
            });

            const savedFragment = await repository.saveFragment(updatedFragment, {
                isInEditStore: false,
            });

            if (!savedFragment) {
                throw new Error('Failed to save fragment');
            }

            await repository.aem.saveTags(updatedFragment);

            const displayValue = this.editedRichText ? this.editedValue.replace(/<[^>]*>/g, '') : this.editedValue;

            if (placeholder.id && this.modifiedPlaceholders[placeholder.id]) {
                delete this.modifiedPlaceholders[placeholder.id];
            }

            const updatedPlaceholders = [...this.placeholdersData];
            updatedPlaceholders[placeholderIndex] = {
                ...placeholder,
                key: this.editedKey,
                value: this.editedValue,
                displayValue,
                isRichText: this.editedRichText,
                fragment: savedFragment,
                updatedAt: new Date().toLocaleString(),
                status: newStatus,
                published: false,
                isInPublishedIndex: false,
                publishedTime: 0,
                modified: false,
            };

            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholdersData = updatedPlaceholders;

            this.resetEditState();
            this.showToast('Placeholder successfully saved', 'positive');
        } catch (error) {
            this.showToast(`Failed to save placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    }

    resetEditState() {
        if (this.editingPlaceholder) {
            const placeholderIndex = this.placeholdersData.findIndex((p) => p.key === this.editingPlaceholder);

            if (placeholderIndex !== -1) {
                const placeholder = this.placeholdersData[placeholderIndex];

                if (placeholder.id && this.modifiedPlaceholders[placeholder.id]) {
                    delete this.modifiedPlaceholders[placeholder.id];
                    const updatedPlaceholders = [...this.placeholdersData];
                    updatedPlaceholders[placeholderIndex] = {
                        ...placeholder,
                        modified: false,
                    };

                    this.placeholdersData = updatedPlaceholders;
                    Store.placeholders.list.data.set(updatedPlaceholders);
                }
            }
        }

        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.editedRichText = false;
    }

    async handleDelete(key) {
        if (this.isDialogOpen) {
            return;
        }

        this.selectedPlaceholders = this.selectedPlaceholders.filter((k) => k !== key);

        const confirmed = await this.showDialog(
            'Delete Placeholder',
            `Are you sure you want to delete the placeholder "${key}"? This action cannot be undone.`,
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'negative',
            },
        );

        if (!confirmed) return;

        try {
            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;

            const placeholder = this.placeholdersData.find((p) => p.key === key);

            if (!placeholder?.fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }

            const fragmentData = placeholder.fragment;
            const fragmentPath = fragmentData.path;

            if (!fragmentPath.endsWith('/index')) {
                const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));
                await this.removeFromIndexFragment(dictionaryPath, fragmentData);
            }

            this.activeDropdown = null;

            await this.repository.deleteFragment(fragmentData, {
                isInEditStore: false,
                refreshPlaceholders: false,
            });

            const updatedPlaceholders = this.placeholdersData.filter((p) => p.id !== fragmentData.id);
            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholdersData = updatedPlaceholders;

            this.showToast('Placeholder successfully deleted', 'positive');
        } catch (error) {
            this.showToast(`Failed to delete placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    }

    async removeFromIndexFragment(dictionaryPath, placeholderFragment) {
        if (!dictionaryPath || !placeholderFragment?.path) {
            return false;
        }

        try {
            if (!this.repository) {
                return false;
            }

            const indexPath = `${dictionaryPath}/index`;

            let indexFragment;
            try {
                indexFragment = await this.repository.aem.sites.cf.fragments.getByPath(indexPath);
            } catch (error) {
                return true;
            }

            if (!indexFragment?.id) {
                return false;
            }

            const freshIndex = await this.repository.aem.sites.cf.fragments.getById(indexFragment.id);

            if (!freshIndex) {
                return false;
            }

            const entriesField = freshIndex.fields.find((f) => f.name === 'entries');
            const currentEntries = entriesField?.values || [];
            const updatedEntries = currentEntries.filter((path) => path !== placeholderFragment.path);

            if (currentEntries.length === updatedEntries.length) {
                return true;
            }

            const updatedFields = this.repository.updateFieldInFragment(
                freshIndex.fields,
                'entries',
                updatedEntries,
                'content-fragment',
                true,
            );

            const updatedFragment = {
                ...freshIndex,
                fields: updatedFields,
            };

            try {
                const savedIndex = await this.repository.aem.sites.cf.fragments.save(updatedFragment);
                if (savedIndex) {
                    try {
                        await this.repository.aem.sites.cf.fragments.publish(savedIndex);
                    } catch (publishError) {
                        console.debug('Failed to publish index, but removal was successful');
                    }
                    return true;
                }
                return false;
            } catch (error) {
                if (error.message?.includes('412')) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    // Retry once after 412 (Precondition Failed) error
                    try {
                        const retryIndex = await this.repository.aem.sites.cf.fragments.getById(indexFragment.id);
                        if (!retryIndex) return false;

                        const retryEntriesField = retryIndex.fields.find((f) => f.name === 'entries');
                        const retryEntries = retryEntriesField?.values || [];
                        const filteredEntries = retryEntries.filter((path) => path !== placeholderFragment.path);

                        if (retryEntries.length === filteredEntries.length) return true;

                        const retryFields = this.repository.updateFieldInFragment(
                            retryIndex.fields,
                            'entries',
                            filteredEntries,
                            'content-fragment',
                            true,
                        );

                        const retrySave = await this.repository.aem.sites.cf.fragments.save({
                            ...retryIndex,
                            fields: retryFields,
                        });

                        return !!retrySave;
                    } catch (retryError) {
                        console.error('Failed on retry removing from index:', retryError);
                        return false;
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error('Failed to remove from index fragment:', error);
            return false;
        }
    }

    /**
     * Load placeholders with selective update
     * Fetches data and updates Store without triggering a full reload
     * @param {boolean} forceCacheBust - Whether to bypass cache
     */
    async loadPlaceholders(forceCacheBust = false) {
        return withLoadingState(async () => {
            try {
                this.ensureRepository();
                const folderPath = this.selectedFolder.path;
                const locale = this.selectedLocale || 'en_US';
                const dictionaryPath = `/content/dam/mas/${folderPath}/${locale}/dictionary`;

                const searchOptions = {
                    path: dictionaryPath,
                    sort: [{ on: 'created', order: 'ASC' }],
                };

                const abortController = new AbortController();

                const cursor = await this.repository.aem.sites.cf.fragments.search(searchOptions, 50, abortController);

                const result = await cursor.next();
                if (!result.value || result.value.length === 0) {
                    this.placeholdersData = [];
                    Store.placeholders.list.data.set([]);
                    return;
                }

                const existingPlaceholders = {};
                this.placeholdersData.forEach((placeholder) => {
                    existingPlaceholders[placeholder.id] = placeholder;
                });

                let indexFragment = null;
                try {
                    const indexPath = `${dictionaryPath}/index`;
                    indexFragment = await this.repository.aem.sites.cf.fragments.getByPath(indexPath, {
                        references: 'direct-hydrated',
                    });
                } catch (error) {
                    console.error('No index fragment found:', error);
                }

                const publishedInIndex = {};

                if (indexFragment && indexFragment.publishedRef) {
                    const entriesField = indexFragment.fields.find((f) => f.name === 'entries');

                    if (entriesField && entriesField.values) {
                        entriesField.values.forEach((path) => {
                            publishedInIndex[path] = true;
                        });
                    }
                }

                const placeholders = result.value
                    .filter((item) => !item.path.endsWith('/index'))
                    .map((fragment) =>
                        this.createPlaceholderData(fragment, locale, existingPlaceholders, publishedInIndex, indexFragment),
                    )
                    .filter(Boolean);

                this.placeholdersData = placeholders;
                Store.placeholders.list.data.set(placeholders);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    if (error.message?.includes('404')) {
                        this.placeholdersData = [];
                        Store.placeholders.list.data.set([]);
                        return;
                    }
                    throw error;
                }
            }
        }).call(this, forceCacheBust);
    }

    createPlaceholderData(fragment, locale, existingPlaceholders, publishedInIndex, indexFragment) {
        if (!fragment || !fragment.fields) return null;

        const key = getFragmentFieldValue(fragment, 'key');
        const value = getFragmentFieldValue(fragment, 'value');
        const richTextValue = getFragmentFieldValue(fragment, 'richTextValue');
        const locReady = getFragmentFieldValue(fragment, 'locReady', false);

        const isInPublishedIndex = indexFragment?.publishedRef && publishedInIndex[fragment.path];

        let statusInfo;
        if (isInPublishedIndex) {
            statusInfo = {
                status: STATUS_PUBLISHED,
                isPublished: true,
                hasPublishedRef: true,
                modifiedAfterPublished: false,
            };
        } else {
            statusInfo = this.detectFragmentStatus(fragment);
        }

        const isRichText = !!richTextValue;
        const displayValue = isRichText ? richTextValue.replace(/<[^>]*>/g, '') : value;
        const existingPlaceholder = existingPlaceholders[fragment.id];

        const updatedPlaceholder = {
            id: fragment.id,
            key,
            value: isRichText ? richTextValue : value,
            displayValue,
            isRichText,
            locale,
            state: locReady ? 'Ready' : 'Not Ready',
            status: statusInfo.status,
            published: statusInfo.isPublished,
            hasPublishedRef: statusInfo.hasPublishedRef,
            modifiedAfterPublished: statusInfo.modifiedAfterPublished,
            publishedTime: fragment.published
                ? new Date(fragment.published.at).getTime()
                : isInPublishedIndex && indexFragment.published
                  ? new Date(indexFragment.published.at).getTime()
                  : 0,
            modifiedTime: fragment.modified ? new Date(fragment.modified.at).getTime() : 0,
            updatedBy: fragment.modified?.by || 'Unknown',
            updatedAt: fragment.modified?.at ? new Date(fragment.modified.at).toLocaleString() : 'Unknown',
            path: fragment.path,
            fragment,
            isInPublishedIndex,
            modified: existingPlaceholder ? existingPlaceholder.modified : false,
        };

        if (existingPlaceholder && this.editingPlaceholder === existingPlaceholder.key) {
            return existingPlaceholder;
        }

        if (existingPlaceholder && this.modifiedPlaceholders[fragment.id]) {
            updatedPlaceholder.modified = true;
        }

        return updatedPlaceholder;
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
                fields: [],
            };

            if (fragmentData.data) {
                Object.entries(fragmentData.data).forEach(([key, value]) => {
                    if (value !== undefined) {
                        createPayload.fields.push({
                            name: key,
                            type: typeMap[key] ?? 'text',
                            values: [value],
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

            const updatedFragment = { ...createdFragmentData };
            updatedFragment.status = STATUS_DRAFT;
            updatedFragment.newTags = [TAG_STATUS_DRAFT];
            await repository.aem.saveTags(updatedFragment);

            const fragmentPath = createdFragmentData.path;
            const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));

            if (!dictionaryPath) {
                throw new Error('Failed to determine dictionary path from fragment path: ' + fragmentPath);
            }

            const indexUpdateResult = await this.updateIndexFragment(dictionaryPath, fragmentPath, false);
            if (!indexUpdateResult) {
                throw new Error('Failed to update index fragment with new placeholder reference');
            }

            const locale = this.selectedLocale || 'en_US';
            const key = fragmentData.data.key;
            const value = fragmentData.data.value;
            const richTextValue = fragmentData.data.richTextValue;
            const isRichText = !!richTextValue;
            const displayValue = isRichText ? richTextValue.replace(/<[^>]*>/g, '') : value;

            const newPlaceholder = {
                id: createdFragmentData.id,
                key: key,
                value: value,
                displayValue: displayValue,
                isRichText: isRichText,
                locale: locale,
                state: 'Ready',
                status: STATUS_DRAFT,
                published: false,
                modifiedAfterPublished: false,
                publishedTime: 0,
                modifiedTime: new Date().getTime(),
                updatedBy: 'You',
                updatedAt: new Date().toLocaleString(),
                path: fragmentPath,
                fragment: createdFragmentData,
            };

            const updatedPlaceholders = [...this.placeholdersData, newPlaceholder];
            Store.placeholders.list.data.set(updatedPlaceholders);

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
     * @param {boolean} shouldPublish - Whether to publish the index after updating (defaults to false)
     * @returns {Promise<Object>} - Success status and index info
     */
    async updateIndexFragment(parentPath, fragmentPath, shouldPublish = false) {
        if (!parentPath || !fragmentPath) {
            console.error('Missing parentPath or fragmentPath for updateIndexFragment');
            return false;
        }

        try {
            const repository = this.ensureRepository();
            const indexPath = `${parentPath}/index`;

            let fragmentToAdd;
            try {
                fragmentToAdd = await repository.aem.sites.cf.fragments.getByPath(fragmentPath);
                if (!fragmentToAdd || !fragmentToAdd.id) {
                    console.error('Failed to get fragment to add - missing ID');
                    return false;
                }
            } catch (error) {
                console.error('Failed to get fragment by path:', error);
                return false;
            }

            let indexFragment;
            try {
                indexFragment = await repository.aem.sites.cf.fragments.getByPath(indexPath);
            } catch (error) {
                indexFragment = null;
            }

            if (!indexFragment || !indexFragment.id) {
                console.error('Index fragment does not exist. It should be created before updating.');
                return { success: false };
            }

            const freshIndex = await repository.aem.sites.cf.fragments.getById(indexFragment.id);
            if (!freshIndex) {
                console.error('Failed to get fresh index by ID');
                return false;
            }

            const entriesField = freshIndex.fields.find((f) => f.name === 'entries');
            const currentEntries = entriesField?.values || [];

            let publishedIndex = null;
            const wasUpdated = !currentEntries.includes(fragmentToAdd.path);

            if (wasUpdated) {
                const updatedEntries = [...currentEntries, fragmentToAdd.path];

                const updatedFields = repository.updateFieldInFragment(
                    freshIndex.fields,
                    'entries',
                    updatedEntries,
                    'content-fragment',
                    true,
                );

                const updatedFragment = {
                    ...freshIndex,
                    fields: updatedFields,
                };

                const savedIndex = await repository.aem.sites.cf.fragments.save(updatedFragment);

                if (!savedIndex) {
                    console.error('Failed to save index fragment');
                    return false;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));

                if (shouldPublish) {
                    try {
                        const latestIndex = await repository.aem.sites.cf.fragments.getById(savedIndex.id);

                        if (latestIndex) {
                            await repository.aem.sites.cf.fragments.publish(latestIndex);
                            publishedIndex = latestIndex;
                        }
                    } catch (publishError) {
                        console.error('Failed to publish index with references:', publishError);
                    }
                }
            } else if (shouldPublish) {
                try {
                    await repository.aem.sites.cf.fragments.publish(freshIndex);
                    publishedIndex = freshIndex;
                } catch (publishError) {
                    console.error('Failed to publish existing index with references:', publishError);
                }
            } else {
                console.error(`Fragment ${fragmentToAdd.path} already in entries, no publish needed`);
            }

            return {
                success: true,
                wasUpdated,
                publishedIndex,
                indexPath,
            };
        } catch (error) {
            console.error('Failed to update index fragment:', error);
            return { success: false };
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
            !event.target.closest('.action-menu-button') &&
            !event.target.closest('.dropdown-item')
        ) {
            this.activeDropdown = null;
        }
    }

    closeCreateModal() {
        this.showCreateModal = false;
        this.clearRteInitializedFlags();
    }

    clearRteInitializedFlags() {
        const rteFields = this.shadowRoot?.querySelectorAll('rte-field');
        if (rteFields) {
            rteFields.forEach((field) => {
                field.initDone = false;
            });
        }
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.searchPlaceholders();
    }

    handleAddPlaceholder() {
        this.showCreateModal = true;
        const currentLocale = this.selectedLocale || 'en_US';
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: currentLocale,
            isRichText: false,
        };
        this.requestUpdate();
    }

    updateTableSelection(event) {
        if (event && event.target) {
            this.selectedPlaceholders = Array.from(event.target.selectedSet);
        }
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
    }

    /**
     * Start editing a placeholder
     * @param {Object} placeholder - The placeholder to edit
     */
    startEdit(placeholder) {
        if (this.editingPlaceholder) {
            const currentIndex = this.placeholdersData.findIndex((p) => p.key === this.editingPlaceholder);

            if (currentIndex !== -1) {
                const currentPlaceholder = this.placeholdersData[currentIndex];
                if (currentPlaceholder.modified) {
                    this.modifiedPlaceholders[currentPlaceholder.id] = true;
                }
            }

            this.cancelEdit();
        }

        this.editingPlaceholder = placeholder.key;
        this.editedKey = placeholder.key;
        this.editedValue = placeholder.value;
        this.editedRichText = placeholder.isRichText;
    }

    cancelEdit() {
        this.resetEditState();
        this.clearRteInitializedFlags();
    }

    toggleDropdown(key, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (this.activeDropdown === key) {
            this.activeDropdown = null;
        } else {
            this.activeDropdown = key;
        }

        this.requestUpdate();
    }

    handleKeyChange(e) {
        this.editedKey = normalizeKey(e.target.value);

        if (this.editingPlaceholder) {
            this.markPlaceholderAsModified();
        }
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;

        if (this.editingPlaceholder) {
            this.markPlaceholderAsModified();
        }
    }

    handleRteValueChange(e) {
        if (e && e.target) {
            this.editedValue = e.target.value || '';

            if (this.editingPlaceholder) {
                this.markPlaceholderAsModified();
            }
        }
    }

    /**
     * Helper method to mark a placeholder as modified during editing
     */
    markPlaceholderAsModified() {
        if (!this.editingPlaceholder) return;

        const placeholderIndex = this.placeholdersData.findIndex((p) => p.key === this.editingPlaceholder);

        if (placeholderIndex !== -1) {
            const placeholder = this.placeholdersData[placeholderIndex];

            if (!placeholder.modified) {
                this.modifiedPlaceholders[placeholder.id] = true;

                const updatedPlaceholders = [...this.placeholdersData];
                updatedPlaceholders[placeholderIndex] = {
                    ...placeholder,
                    modified: true,
                };

                this.placeholdersData = updatedPlaceholders;
                Store.placeholders.list.data.set(updatedPlaceholders);
            }
        }
    }

    /**
     * Get status variant for a placeholder
     * @param {Object} placeholder - The placeholder to get status for
     * @returns {string} The status variant (draft, modified, published)
     */
    getStatusVariant(placeholder) {
        if (placeholder.modified) {
            return 'modified';
        }

        const status = placeholder.status || 'draft';
        return status.toLowerCase();
    }

    renderStatusCell(placeholder) {
        return html`
            <sp-table-cell>
                <div class="status-cell">
                    <mas-fragment-status variant="${this.getStatusVariant(placeholder)}"></mas-fragment-status>
                </div>
            </sp-table-cell>
        `;
    }

    renderPlaceholdersTable() {
        const filteredPlaceholders = this.getFilteredPlaceholders();

        const columns = [
            { key: 'key', label: 'Key', sortable: true },
            {
                key: 'value',
                label: 'Value',
                sortable: true,
                style: 'min-width: 300px;',
            },
            { key: 'status', label: 'Status', sortable: true, priority: true },
            { key: 'locale', label: 'Locale', sortable: true, align: 'right' },
            {
                key: 'updatedBy',
                label: 'Updated by',
                sortable: true,
                align: 'right',
            },
            {
                key: 'updatedAt',
                label: 'Date & Time',
                sortable: true,
                align: 'right',
            },
            { key: 'action', label: 'Action', align: 'right' },
        ];

        if (!filteredPlaceholders || filteredPlaceholders.length === 0) {
            return html`
                <div class="no-placeholders-message">
                    <p>No placeholders found.</p>
                </div>
            `;
        }

        this.ensureTableCheckboxes();

        return html`
            <sp-table
                emphasized
                scroller
                selects="multiple"
                selectable-with="cell"
                .selected=${this.selectedPlaceholders}
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
                                ${this.renderKeyCell(placeholder)} ${this.renderValueCell(placeholder)}
                                ${this.renderStatusCell(placeholder)} ${this.renderTableCell(placeholder.locale, 'right')}
                                ${this.renderTableCell(placeholder.updatedBy, 'right')}
                                ${this.renderTableCell(placeholder.updatedAt, 'right')} ${this.renderActionCell(placeholder)}
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    handleNewPlaceholderValueChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            value: e.target.value,
        };
    }

    renderCreateModal() {
        if (!this.showCreateModal) return nothing;

        return html`
            <sp-dialog-wrapper
                type="modal"
                headline="Create New Placeholder"
                underlay
                confirm-label="Create"
                cancel-label="Cancel"
                open
                @close=${this.closeCreateModal}
                @confirm=${this.createPlaceholder}
                @cancel=${this.closeCreateModal}
            >
                <div class="dialog-content">
                    <form
                        @submit=${(e) => {
                            e.preventDefault();
                            this.createPlaceholder();
                        }}
                    >
                        <div class="form-field">
                            <sp-field-label for="placeholder-key" required> Key </sp-field-label>
                            <sp-textfield
                                id="placeholder-key"
                                placeholder="Enter key"
                                .value=${this.newPlaceholder.key}
                                @input=${this.handleNewPlaceholderKeyChange}
                                required
                            ></sp-textfield>
                        </div>

                        <div class="form-field">
                            <sp-field-label for="placeholder-locale" required> Locale </sp-field-label>
                            <mas-locale-picker
                                id="placeholder-locale"
                                @locale-changed=${this.handleNewPlaceholderLocaleChange}
                            ></mas-locale-picker>
                        </div>

                        <div class="form-field">
                            <sp-field-label for="rich-text-toggle"> Rich Text </sp-field-label>
                            <sp-switch
                                id="rich-text-toggle"
                                @change=${this.handleRichTextToggle}
                                .checked=${this.newPlaceholder.isRichText}
                            >
                                Enable Rich Text
                            </sp-switch>
                        </div>

                        <div class="form-field">
                            <sp-field-label for="placeholder-value" required> Value </sp-field-label>
                            ${this.newPlaceholder.isRichText
                                ? html`
                                      <div class="rte-container">
                                          <rte-field
                                              id="placeholder-rich-value"
                                              link
                                              .maxLength=${500}
                                              @change=${this.handleNewPlaceholderRteChange}
                                          ></rte-field>
                                      </div>
                                  `
                                : html`
                                      <sp-textfield
                                          id="placeholder-value"
                                          placeholder="Enter value"
                                          .value=${this.newPlaceholder.value}
                                          @input=${this.handleNewPlaceholderValueChange}
                                          required
                                      ></sp-textfield>
                                  `}
                        </div>
                    </form>
                </div>
            </sp-dialog-wrapper>
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
        this.placeholdersLoading = true;

        if (this.repository) {
            this.loadPlaceholders();
        }
    }

    renderActionCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="action-cell">
                    <div class="action-buttons">
                        <button class="action-button approve-button" @click=${this.saveEdit} aria-label="Save changes">
                            <sp-icon-checkmark></sp-icon-checkmark>
                        </button>
                        <button class="action-button reject-button" @click=${this.cancelEdit} aria-label="Cancel editing">
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
                        @click=${(e) => {
                            e.stopPropagation();
                            this.startEdit(placeholder);
                        }}
                        aria-label="Edit placeholder"
                    >
                        <sp-icon-edit></sp-icon-edit>
                    </button>
                    <div class="dropdown-menu-container">
                        <button
                            class="action-button action-menu-button"
                            @click=${(e) => this.toggleDropdown(placeholder.key, e)}
                            @mousedown=${(e) => e.stopPropagation()}
                            aria-label="More options"
                        >
                            <sp-icon-more></sp-icon-more>
                        </button>
                        ${this.activeDropdown === placeholder.key
                            ? html`
                                  <div class="dropdown-menu">
                                      <div
                                          class="dropdown-item ${placeholder.status === STATUS_PUBLISHED ? 'disabled' : ''}"
                                          @click=${(e) => {
                                              if (placeholder.status !== STATUS_PUBLISHED) {
                                                  e.stopPropagation();
                                                  this.handlePublish(placeholder.key);
                                              }
                                          }}
                                      >
                                          <sp-icon-publish-check></sp-icon-publish-check>
                                          <span>Publish</span>
                                      </div>
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
                            : nothing}
                    </div>
                </div>
            </sp-table-cell>
        `;
    }

    renderPlaceholdersContent() {
        if (!(this.foldersLoaded ?? false)) {
            return html`<div class="loading-container">${this.loadingIndicator}</div>`;
        }

        if (this.placeholdersLoading) {
            return html`<div class="loading-container">${this.loadingIndicator}</div>`;
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
                    <sp-button variant="primary" @click=${() => this.handleAddPlaceholder()} class="create-button">
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create New Placeholder
                    </sp-button>
                </div>

                ${this.renderError()}

                <div class="search-filters-container">
                    <div class="placeholders-title">
                        <h2>Total Placeholders: ${(this.placeholdersData || []).length}</h2>
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

                <div class="placeholders-content">${this.renderPlaceholdersContent()}</div>

                ${modalContent} ${confirmDialog}

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

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            return false;
        }

        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;

        return new Promise((resolve) => {
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
                },
            };
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
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'negative',
            },
        );

        if (!confirmed) return;

        this.isBulkDeleteInProgress = true;
        Store.placeholders.list.loading.set(true);
        this.placeholdersLoading = true;
        this.showToast(`Deleting ${placeholdersToDelete.length} placeholders...`, 'info');

        const successfulDeletes = [];
        const failedDeletes = [];

        try {
            const placeholderObjects = this.placeholdersData.filter((p) => placeholdersToDelete.includes(p.key));

            for (const placeholder of placeholderObjects) {
                try {
                    if (placeholder.fragment) {
                        const fragmentData = placeholder.fragment;
                        const fragmentPath = fragmentData.path;

                        if (!fragmentPath.endsWith('/index')) {
                            const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));
                            try {
                                await this.removeFromIndexFragment(dictionaryPath, fragmentData);
                            } catch (error) {}
                        }

                        await this.repository.deleteFragment(fragmentData, {
                            isInEditStore: false,
                            refreshPlaceholders: false,
                        });

                        successfulDeletes.push(placeholder.key);
                    } else {
                        failedDeletes.push(placeholder.key);
                    }
                } catch (error) {
                    failedDeletes.push(placeholder.key);
                }
            }

            const updatedPlaceholders = this.placeholdersData.filter((p) => !successfulDeletes.includes(p.key));

            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholdersData = updatedPlaceholders;

            if (successfulDeletes.length > 0) {
                if (failedDeletes.length > 0) {
                    this.showToast(
                        `Deleted ${successfulDeletes.length} placeholders, but ${failedDeletes.length} failed`,
                        'warning',
                    );
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
            this.placeholdersLoading = false;
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
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    /**
     * Ensures that all table rows have checkbox cells
     * This is needed after filtering or when the table is re-rendered
     */
    ensureTableCheckboxes() {
        const table = this.shadowRoot?.querySelector('sp-table');
        if (!table) return;

        const currentSelection = this.selectedPlaceholders;
        this.selectedPlaceholders = [...currentSelection];
        table.selected = this.selectedPlaceholders;

        setTimeout(() => {
            const rows = table.querySelectorAll('sp-table-row');
            rows.forEach((row) => {
                const hasCheckbox = row.querySelector('sp-table-checkbox-cell');
                if (!hasCheckbox) {
                    const checkboxCell = document.createElement('sp-table-checkbox-cell');
                    checkboxCell.emphasized = true;
                    checkboxCell.checked = this.selectedPlaceholders.includes(row.value);

                    row.insertAdjacentElement('afterbegin', checkboxCell);
                }
            });

            const tableHead = table.querySelector('sp-table-head');
            if (tableHead) {
                const headHasCheckbox = tableHead.querySelector('sp-table-checkbox-cell');
                if (!headHasCheckbox) {
                    const headCheckbox = document.createElement('sp-table-checkbox-cell');
                    headCheckbox.headCell = true;
                    headCheckbox.emphasized = true;

                    const allRowValues = Array.from(rows).map((row) => row.value);
                    const allSelected =
                        allRowValues.length > 0 && allRowValues.every((value) => this.selectedPlaceholders.includes(value));
                    headCheckbox.checked = allSelected;

                    tableHead.insertAdjacentElement('afterbegin', headCheckbox);
                }
            }
        }, 0);
    }

    /**
     * Publish a placeholder
     * @param {string} key - Placeholder key to publish
     */
    async handlePublish(key) {
        if (this.isDialogOpen) {
            return;
        }

        try {
            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;

            const placeholder = this.placeholdersData.find((p) => p.key === key);

            if (!placeholder?.fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }

            if (placeholder.status === STATUS_PUBLISHED) {
                this.showToast('Placeholder is already published', 'info');
                return;
            }

            const fragmentData = placeholder.fragment;
            const fragmentPath = fragmentData.path;

            const latestFragment = await this.repository.aem.sites.cf.fragments.getById(fragmentData.id);
            if (!latestFragment) {
                throw new Error('Failed to get latest fragment for publishing');
            }

            const updatedFragment = { ...latestFragment };
            updatedFragment.status = STATUS_PUBLISHED;
            updatedFragment.newTags = [TAG_STATUS_PUBLISHED];

            const savedFragment = await this.repository.aem.sites.cf.fragments.save(updatedFragment);
            if (!savedFragment) {
                throw new Error('Failed to save fragment with published status');
            }

            await this.repository.aem.sites.cf.fragments.publish(savedFragment);

            const dictionaryPath = fragmentPath.substring(0, fragmentPath.lastIndexOf('/'));

            const result = await this.updateIndexFragment(dictionaryPath, fragmentPath, true);

            if (!result || !result.success) {
                throw new Error('Failed to update index fragment with placeholder reference');
            }

            const updatedStatus = {
                status: STATUS_PUBLISHED,
                isPublished: true,
                hasPublishedRef: true,
                modifiedAfterPublished: false,
                isInPublishedIndex: true,
                publishedTime: new Date().getTime(),
            };

            const updatedPlaceholders = [...this.placeholdersData];
            const placeholderIndex = updatedPlaceholders.findIndex((p) => p.id === fragmentData.id);

            if (placeholderIndex !== -1) {
                updatedPlaceholders[placeholderIndex] = {
                    ...updatedPlaceholders[placeholderIndex],
                    ...updatedStatus,
                    fragment: savedFragment,
                };

                this.placeholdersData = updatedPlaceholders;
                Store.placeholders.list.data.set(updatedPlaceholders);
            }

            this.showToast(`Placeholder "${key}" published successfully`, 'positive');
        } catch (error) {
            console.error('Publish error:', error);
            this.showToast(`Failed to publish: ${error.message}`, 'negative');
        } finally {
            this.placeholdersLoading = false;
            Store.placeholders.list.loading.set(false);
        }
    }

    detectFragmentStatus(fragment) {
        let status = STATUS_DRAFT;
        let modifiedAfterPublished = false;
        const hasPublishedRef = !!fragment.publishedRef;
        const isPublished = !!fragment.published || hasPublishedRef;

        if (fragment.status) {
            status = fragment.status === STATUS_PUBLISHED ? STATUS_PUBLISHED : STATUS_DRAFT;
            modifiedAfterPublished = false;
            return {
                status,
                modifiedAfterPublished,
                isPublished: status === STATUS_PUBLISHED || isPublished,
                hasPublishedRef,
            };
        }

        if (fragment.tags && Array.isArray(fragment.tags)) {
            const tagIds = fragment.tags.map((tag) => tag.id || tag);

            if (tagIds.includes(TAG_STATUS_PUBLISHED)) {
                status = STATUS_PUBLISHED;
            } else {
                status = STATUS_DRAFT;
            }
        }

        if (status === STATUS_DRAFT && isPublished) {
            status = STATUS_PUBLISHED;
        }

        return {
            status,
            modifiedAfterPublished: false,
            isPublished,
            hasPublishedRef,
        };
    }

    handleNewPlaceholderKeyChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            key: normalizeKey(e.target.value),
        };
    }

    handleNewPlaceholderLocaleChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            locale: e.detail.locale,
        };
    }

    handleNewPlaceholderRteChange(e) {
        if (e && e.target) {
            this.newPlaceholder = {
                ...this.newPlaceholder,
                value: e.target.value || '',
            };
        }
    }

    handleRichTextToggle(e) {
        const existingField = this.shadowRoot.querySelector('#placeholder-rich-value');
        if (existingField) {
            existingField.initDone = false;
        }

        this.newPlaceholder = {
            ...this.newPlaceholder,
            isRichText: e.target.checked,
        };
    }

    getFilteredPlaceholders() {
        const filtered = this.searchQuery
            ? (this.placeholdersData || []).filter(
                  (placeholder) =>
                      placeholder.key.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                      placeholder.displayValue.toLowerCase().includes(this.searchQuery.toLowerCase()),
              )
            : this.placeholdersData || [];

        return this.getSortedPlaceholders(filtered);
    }

    getSortedPlaceholders(placeholders) {
        return [...placeholders].sort((a, b) => {
            const aValue = a[this.sortField] || '';
            const bValue = b[this.sortField] || '';
            const comparison = aValue.localeCompare(bValue);
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Renders a table cell with optional tooltip
     * @param {string} content - Cell content
     * @returns {TemplateResult} - HTML template
     */
    renderTableCell(content, align = '', className = '') {
        const value = content || '';
        const needsTooltip = value.length > 50;

        return html`
            <sp-table-cell class=${className} style="${align === 'right' ? 'text-align: right;' : ''}">
                ${needsTooltip
                    ? html`
                          <sp-tooltip placement="right">
                              ${value}
                              <div slot="trigger" class="cell-content">${value.substring(0, 50)}...</div>
                          </sp-tooltip>
                      `
                    : html`<div class="cell-content">${value}</div>`}
            </sp-table-cell>
        `;
    }

    renderKeyCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="editing-cell key">
                    <div class="edit-field-container">
                        <sp-textfield placeholder="Key" .value=${this.editedKey} @input=${this.handleKeyChange}></sp-textfield>
                    </div>
                </sp-table-cell>
            `;
        }
        return this.renderTableCell(placeholder.key, '', 'key');
    }

    renderValueCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="editing-cell value">
                    <div class="edit-field-container">
                        ${this.editedRichText
                            ? html`
                                  <div class="rte-container">
                                      <rte-field
                                          link
                                          .maxLength=${500}
                                          @change=${this.handleRteValueChange}
                                          @click=${(e) => e.stopPropagation()}
                                      ></rte-field>
                                  </div>
                              `
                            : html`<sp-textfield
                                  placeholder="Value"
                                  .value=${this.editedValue}
                                  @input=${this.handleValueChange}
                              ></sp-textfield>`}
                    </div>
                </sp-table-cell>
            `;
        }

        if (placeholder.isRichText) {
            return html`
                <sp-table-cell class="value">
                    <div class="rich-text-cell" .innerHTML=${placeholder.value}></div>
                </sp-table-cell>
            `;
        }

        return this.renderTableCell(placeholder.displayValue, '', 'value');
    }

    renderTableHeader(columns) {
        return html`
            <sp-table-head>
                ${columns.map(
                    ({ key, label, sortable, align }) => html`
                        <sp-table-head-cell
                            class=${key}
                            ?sortable=${sortable}
                            @click=${sortable ? () => this.handleSort(key) : undefined}
                            style="${align === 'right' ? 'text-align: right;' : ''}"
                        >
                            ${label}
                        </sp-table-head-cell>
                    `,
                )}
            </sp-table-head>
        `;
    }
}

customElements.define('mas-placeholders', MasPlaceholders);
