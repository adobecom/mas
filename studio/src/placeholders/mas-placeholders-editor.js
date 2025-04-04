import Store from '../store.js';
import {
    DICTIONARY_MODEL_ID,
    STATUS_PUBLISHED,
    STATUS_MODIFIED,
    STATUS_DRAFT,
    OPERATIONS
} from '../constants.js';
import { normalizeKey } from '../utils.js';
import { 
    getDictionaryPath,
    MasPlaceholders 
} from './mas-placeholders.js';

export class MasPlaceholdersEditor extends MasPlaceholders {
    constructor() {
        // Don't actually call the parent constructor since we're just using this class for its methods
        // We'll instantiate it from the parent and then bind its methods
        if (new.target === MasPlaceholdersEditor) {
            throw new Error('This class should not be instantiated directly');
        }
        // Don't call super() here since we don't want a full LitElement instance
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
            const locale =
                this.newPlaceholder.locale || this.selectedLocale || 'en_US';

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
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

            const createdFragment =
                await this.createPlaceholderWithIndex(fragmentData);
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
            this.showToast(
                `Failed to create placeholder: ${error.message}`,
                'negative',
            );
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    }

    async createPlaceholderWithIndex(fragmentData) {
        try {
            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
            }

            const createdFragment = await repository.aem.sites.cf.fragments.create(
                fragmentData,
            );

            if (!createdFragment || !createdFragment.id) {
                throw new Error('Failed to create fragment');
            }

            // Wait for the fragment to be created before adding to index
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Handle folder changing after creation started
            const currentLocale = Store.filters.get().locale || 'en_US';
            if (
                fragmentData.locale &&
                fragmentData.locale !== currentLocale
            ) {
                Store.filters.set((currentValue) => ({
                    ...currentValue,
                    locale: fragmentData.locale,
                }));
            }

            // Ensure the fragment is in the index and publish it if needed
            await this.updateIndexFragment(
                fragmentData.parentPath,
                createdFragment.path,
                true,
            );

            this.showToast(
                `Placeholder "${fragmentData.data.key}" created successfully`,
                'positive',
            );

            // Reload the placeholders
            await this.loadPlaceholders(true);

            return createdFragment;
        } catch (error) {
            this.showToast(
                `Failed to create placeholder: ${error.message}`,
                'negative',
            );
            return null;
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
                    `Placeholder "${this.editingPlaceholder}" not found`,
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
            if (!fragmentData?.id) {
                throw new Error('Fragment data is missing or invalid');
            }

            Store.placeholders.list.loading.set(true);
            this.placeholdersLoading = true;

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
            }

            const latestFragment =
                await repository.aem.sites.cf.fragments.getById(
                    fragmentData.id,
                );
            if (!latestFragment) {
                throw new Error('Failed to get latest fragment');
            }

            const updatedFragment = { ...latestFragment };
            updatedFragment.title = this.editedKey || fragmentData.title || '';
            updatedFragment.description = fragmentData.description || '';

            const newStatus =
                placeholder.status === STATUS_PUBLISHED
                    ? STATUS_MODIFIED
                    : STATUS_DRAFT;

            const fieldUpdates = [
                ['key', [this.editedKey], 'text'],
                ['value', [this.editedValue], 'text'],
                ['locReady', [true], 'boolean'],
            ];

            fieldUpdates.reduce(
                (fields, [name, values, type]) =>
                    repository.updateFieldInFragment(
                        fields,
                        name,
                        values,
                        type,
                    ),
                updatedFragment.fields,
            );

            const savedFragment = await repository.saveFragment(
                updatedFragment,
                {
                    isInEditStore: false,
                },
            );

            if (!savedFragment) {
                throw new Error('Failed to save fragment');
            }

            const containsHtml = /<\/?[a-z][\s\S]*>/i.test(this.editedValue);
            const displayValue = containsHtml
                ? this.editedValue.replace(/<[^>]*>/g, '')
                : this.editedValue;

            const updatedPlaceholders = [...this.placeholdersData];
            updatedPlaceholders[placeholderIndex] = {
                ...placeholder,
                key: this.editedKey,
                value: this.editedValue,
                displayValue,
                isRichText: containsHtml,
                fragment: savedFragment,
                updatedAt: new Date().toLocaleString(),
                status: newStatus,
            };

            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholdersData = updatedPlaceholders;

            this.resetEditState();
            this.showToast('Placeholder successfully saved', 'positive');
        } catch (error) {
            this.showToast(
                `Failed to save placeholder: ${error.message}`,
                'negative',
            );
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    }

    resetEditState() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.editedRichText = false;
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
    }

    cancelEdit() {
        this.editingPlaceholder = null;
        this.editedKey = '';
        this.editedValue = '';
        this.editedRichText = false;
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

    /**
     * Delete a placeholder
     * @param {string} key - Placeholder key to delete
     */
    async handleDelete(key) {
        if (this.isDialogOpen) {
            return;
        }

        this.selectedPlaceholders = this.selectedPlaceholders.filter(
            (k) => k !== key,
        );

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

            const placeholder = this.placeholdersData.find(
                (p) => p.key === key,
            );

            if (!placeholder?.fragment) {
                throw new Error('Fragment data is missing or incomplete');
            }

            const fragmentData = placeholder.fragment;
            const fragmentPath = fragmentData.path;

            if (!fragmentPath.endsWith('/index')) {
                const dictionaryPath = fragmentPath.substring(
                    0,
                    fragmentPath.lastIndexOf('/'),
                );
                await this.removeFromIndexFragment(
                    dictionaryPath,
                    fragmentData,
                );
            }

            this.activeDropdown = null;

            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
            }

            await repository.deleteFragment(fragmentData, {
                isInEditStore: false,
                refreshPlaceholders: false,
            });

            const updatedPlaceholders = this.placeholdersData.filter(
                (p) => p.key !== key,
            );
            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholdersData = updatedPlaceholders;

            this.showToast(
                `Placeholder "${key}" deleted successfully`,
                'positive',
            );
        } catch (error) {
            this.showToast(`Failed to delete placeholder: ${error.message}`, 'negative');
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
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

            const placeholder = this.placeholdersData.find(
                (p) => p.key === key,
            );
            if (!placeholder) {
                throw new Error(`Placeholder "${key}" not found`);
            }

            if (
                placeholder.status === STATUS_PUBLISHED &&
                !placeholder.modifiedAfterPublished
            ) {
                this.showToast('Placeholder is already published', 'info');
                return;
            }

            const fragmentData = placeholder.fragment;
            const fragmentPath = fragmentData.path;

            if (!fragmentPath) {
                throw new Error('Fragment path is missing');
            }

            const dictionaryPath = fragmentPath.substring(
                0,
                fragmentPath.lastIndexOf('/'),
            );

            // Update index fragment and publish it
            const result = await this.updateIndexFragment(
                dictionaryPath,
                fragmentPath,
                true,
            );

            if (!result || !result.success) {
                throw new Error(
                    'Failed to update index fragment with placeholder',
                );
            }

            // Wait for AEM to update references
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Refresh data to reflect new status
            await this.loadPlaceholders(true);

            this.showToast(
                `Placeholder "${key}" published successfully`,
                'positive',
            );
        } catch (error) {
            this.showToast(
                `Failed to publish placeholder: ${error.message}`,
                'negative',
            );
        } finally {
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
            this.activeDropdown = null;
        }
    }

    handleAddPlaceholder() {
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: this.selectedLocale || 'en_US',
            isRichText: false,
        };
        this.showCreateModal = true;
    }

    closeCreateModal() {
        this.showCreateModal = false;
        this.newPlaceholder = {
            key: '',
            value: '',
            locale: this.selectedLocale || 'en_US',
            isRichText: false,
        };
    }

    handleKeyChange(e) {
        this.editedKey = e.target.value;
    }

    handleValueChange(e) {
        this.editedValue = e.target.value;
    }

    handleRteValueChange(e) {
        this.editedValue = e.detail.content || '';
    }

    handleNewPlaceholderKeyChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            key: normalizeKey(e.target.value),
        };
    }

    handleNewPlaceholderValueChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            value: e.target.value,
        };
    }

    handleNewPlaceholderLocaleChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            locale: e.detail.locale,
        };
    }

    handleNewPlaceholderRteChange(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            value: e.detail.content || '',
        };
    }

    handleRichTextToggle(e) {
        this.newPlaceholder = {
            ...this.newPlaceholder,
            isRichText: e.target.checked,
        };
    }
} 