import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store, { editFragment } from './store.js';
import { AEM } from './aem/aem.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { debounce, looseEquals, UserFriendlyError } from './utils.js';
import {
    OPERATIONS,
    STATUS_PUBLISHED,
    TAG_STATUS_PUBLISHED,
    ROOT_PATH,
    PAGE_NAMES,
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
    EDITABLE_FRAGMENT_MODEL_IDS,
} from './constants.js';

let fragmentCache;

export function getDamPath(path) {
    if (!path) return ROOT_PATH;
    if (path.startsWith(ROOT_PATH)) return path;
    return ROOT_PATH + '/' + path;
}

export async function initFragmentCache() {
    if (fragmentCache) return;
    await customElements.whenDefined('aem-fragment').then(() => {
        fragmentCache = document.createElement('aem-fragment').cache;
    });
}

export async function getFromFragmentCache(fragmentId) {
    await initFragmentCache();
    return fragmentCache.get(fragmentId);
}

function isUUID(str) {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

export class MasRepository extends LitElement {
    static properties = {
        bucket: { type: String },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    inEdit = Store.fragments.inEdit;
    operation = Store.operation;

    getFromFragmentCache = getFromFragmentCache;

    constructor() {
        super();
        this.#abortControllers = { search: null, recentlyUpdated: null };
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.search = new StoreController(this, Store.search);
        this.filters = new StoreController(this, Store.filters);
        this.page = new StoreController(this, Store.page);
        this.foldersLoaded = new StoreController(this, Store.folders.loaded);
        this.recentlyUpdatedLimit = new StoreController(
            this,
            Store.fragments.recentlyUpdated.limit,
        );
        this.handleSearch = debounce(this.handleSearch.bind(this), 50);
    }

    /** @type {{ search: AbortController | null, recentlyUpdated: AbortController | null }} */
    #abortControllers;
    /** @type {AEM} */
    aem;

    connectedCallback() {
        super.connectedCallback();
        if (!(this.bucket || this.baseUrl))
            throw new Error(
                'Either the bucket or baseUrl attribute is required.',
            );
        this.aem = new AEM(this.bucket, this.baseUrl);
        this.loadFolders();
        this.style.display = 'none';
    }

    /**
     * @param {Error} error
     * @param {string} defaultMessage - Generic toast message (can be overriden by the error's message)
     */
    processError(error, defaultMessage) {
        if (error.name === 'AbortError') return;
        let message = defaultMessage;
        if (error instanceof UserFriendlyError) message = error.message;
        console.error(
            `${defaultMessage ? `${defaultMessage}: ` : ''}${error.message}`,
            error.stack,
        );
        Events.toast.emit({
            variant: 'negative',
            content: message,
        });
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

    update(changedProperties) {
        super.update(changedProperties);
        if (!this.foldersLoaded.value) return;
        this.handleSearch();
    }

    handleSearch() {
        switch (this.page.value) {
            case 'content':
                this.searchFragments();
                break;
            case 'welcome':
                this.loadRecentlyUpdatedFragments();
                break;
        }
    }

    async loadFolders() {
        try {
            const { children } = await this.aem.folders.list(ROOT_PATH);
            const ignore = window.localStorage.getItem('ignore_folders') || [
                'images',
            ];
            const folders = children
                .map((folder) => folder.name)
                .filter((child) => !ignore.includes(child));

            Store.folders.loaded.set(true);
            Store.folders.data.set(folders);

            if (
                !folders.includes(this.search.value.path) &&
                !this.search.value.query
            )
                Store.search.set((prev) => ({
                    ...prev,
                    path: folders.at(0),
                }));
            Store.fragments.list.data.set([]);
        } catch (error) {
            Store.fragments.list.loading.set(false);
            Store.fragments.recentlyUpdated.loading.set(false);
            this.processError(error, 'Could not load folders.');
        }
    }

    get parentPath() {
        return `${getDamPath(this.search.value.path)}/${
            this.filters.value.locale
        }`;
    }

    get fragmentStoreInEdit() {
        return this.inEdit.get();
    }

    get fragmentInEdit() {
        return this.fragmentStoreInEdit?.get();
    }

    async searchFragments() {
        if (this.page.value !== PAGE_NAMES.CONTENT) return;

        Store.fragments.list.loading.set(true);

        const path = this.search.value.path;
        const dataStore = Store.fragments.list.data;
        const query = this.search.value.query;

        let tags = [];
        if (this.filters.value.tags) {
            if (typeof this.filters.value.tags === 'string') {
                tags = this.filters.value.tags.split(',').filter(Boolean);
            } else if (Array.isArray(this.filters.value.tags)) {
                tags = this.filters.value.tags.filter(Boolean);
            } else {
                console.warn(
                    'Unexpected tags format:',
                    this.filters.value.tags,
                );
            }
        }

        let modelIds = tags
            .filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE))
            .map((tag) => TAG_MODEL_ID_MAPPING[tag]);

        if (modelIds.length === 0) modelIds = EDITABLE_FRAGMENT_MODEL_IDS;

        tags = tags.filter((tag) => !tag.startsWith(TAG_STUDIO_CONTENT_TYPE));

        const damPath = getDamPath(path);
        const localSearch = {
            ...this.search.value,
            modelIds,
            path: `${damPath}/${this.filters.value.locale}`,
            tags,
        };

        const publishedTagIndex = tags.indexOf(TAG_STATUS_PUBLISHED);
        if (publishedTagIndex > -1) {
            tags.splice(publishedTagIndex, 1);
            localSearch.status = STATUS_PUBLISHED;
        }

        try {
            if (this.#abortControllers.search)
                this.#abortControllers.search.abort();
            this.#abortControllers.search = new AbortController();

            if (isUUID(this.search.value.query)) {
                // Check if the fragment with this UUID is already the only one in the store
                const [currentFragment] = dataStore.get() ?? [];
                if (currentFragment?.value.id === this.search.value.query) {
                    // Skip search if we already have exactly this fragment)
                    Store.fragments.list.loading.set(false);
                    return;
                }
                dataStore.set([]);
                const fragmentData = await this.aem.sites.cf.fragments.getById(
                    localSearch.query,
                    this.#abortControllers.search,
                );
                if (fragmentData && fragmentData.path.indexOf(damPath) == 0) {
                    const fragment = await this.#addToCache(fragmentData);
                    dataStore.set([new FragmentStore(fragment)]);

                    const folderPath = fragmentData.path.substring(
                        fragmentData.path.indexOf(damPath) + damPath.length + 1,
                    );
                    const folderName = folderPath.substring(
                        0,
                        folderPath.indexOf('/'),
                    );
                    if (Store.folders.data.get().includes(folderName)) {
                        Store.search.set((prev) => ({
                            ...prev,
                            path: folderName,
                        }));
                    }
                }
            } else {
                dataStore.set([]);
                const cursor = await this.aem.sites.cf.fragments.search(
                    localSearch,
                    null,
                    this.#abortControllers.search,
                );
                const fragmentStores = [];
                for await (const result of cursor) {
                    for await (const item of result) {
                        const fragment = await this.#addToCache(item);
                        fragmentStores.push(new FragmentStore(fragment));
                    }
                }
                dataStore.set(fragmentStores);
            }

            dataStore.setMeta('path', path);
            dataStore.setMeta('query', query);
            dataStore.setMeta('tags', tags);

            this.#abortControllers.search = null;
        } catch (error) {
            this.processError(error, 'Could not load fragments.');
        }

        Store.fragments.list.loading.set(false);
    }

    async loadRecentlyUpdatedFragments() {
        if (this.page.value !== PAGE_NAMES.WELCOME) return;
        if (this.#abortControllers.recentlyUpdated)
            this.#abortControllers.recentlyUpdated.abort();
        this.#abortControllers.recentlyUpdated = new AbortController();

        Store.fragments.recentlyUpdated.loading.set(true);

        const dataStore = Store.fragments.recentlyUpdated.data;
        const path = `${this.search.value.path}/${this.filters.value.locale}`;

        if (!looseEquals(dataStore.getMeta('path'), path)) {
            dataStore.set([]);
            dataStore.removeMeta('path');
        }

        try {
            const cursor = await this.aem.sites.cf.fragments.search(
                {
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                    path: `/content/dam/mas/${path}`,
                },
                this.recentlyUpdatedLimit.value,
                this.#abortControllers.recentlyUpdated,
            );

            const result = await cursor.next();
            const fragmentStores = [];
            for await (const item of result.value) {
                const fragment = await this.#addToCache(item);
                fragmentStores.push(new FragmentStore(fragment));
            }
            dataStore.set(fragmentStores);

            dataStore.setMeta('path', path);

            this.#abortControllers.recentlyUpdated = null;
        } catch (error) {
            this.processError(
                error,
                'Could not load recently updated fragments.',
            );
        }

        Store.fragments.recentlyUpdated.loading.set(false);
    }

    /**
     * Helper method to create fragment fields from data object
     * @param {Object} data - The data object containing field values
     * @param {Array} existingFields - Any existing fields to include
     * @returns {Array} The complete fields array
     */
    createFieldsFromData(data, existingFields = []) {
        if (!data) return existingFields;

        return Object.entries(data)
            .filter(([key, value]) => value !== undefined)
            .reduce(
                (fields, [key, value]) => {
                    const type = key === 'locReady' ? 'boolean' : 'text';
                    fields.push({ name: key, type, values: [value] });
                    return fields;
                },
                [...existingFields],
            );
    }

    async createFragment(fragmentData) {
        try {
            const isPlaceholder =
                fragmentData.data &&
                (fragmentData.data.key !== undefined ||
                    fragmentData.parentPath?.includes('/dictionary/'));
            this.showToast('Creating fragment...');

            this.operation.set(OPERATIONS.CREATE);

            const fields = this.createFieldsFromData(
                fragmentData.data,
                fragmentData.fields || [],
            );

            const result = await this.aem.sites.cf.fragments.create({
                ...fragmentData,
                description: fragmentData.description || '',
                fields,
                parentPath: fragmentData.parentPath || this.parentPath,
            });
            const latest = await this.aem.sites.cf.fragments.getById(result.id);
            const fragment = await this.#addToCache(latest);

            if (!isPlaceholder) {
                this.showToast('Fragment successfully created.', 'positive');
            }

            this.operation.set();
            return new FragmentStore(fragment);
        } catch (error) {
            this.processError(error, 'Failed to create fragment.');
        }
    }

    async #addToCache(fragmentData) {
        await initFragmentCache();
        for (const reference of fragmentData.references || []) {
            if (fragmentCache.has(reference.id)) continue;
            await this.#addToCache(reference);
        }
        let fragment = fragmentCache.get(fragmentData.id);
        if (!fragment) {
            fragment = new Fragment(fragmentData);
            fragmentCache.add(fragment);
        }
        return fragment;
    }

    /**
     * Unified method to save a fragment (regular or dictionary)
     * @param {Object} fragment - The fragment to save
     * @param {Object} options - Additional options
     * @param {boolean} options.isInEditStore - Whether the fragment is from the inEdit store
     * @returns {Promise<Object>} The saved fragment
     */
    async saveFragment(fragment, options = {}) {
        const { isInEditStore = true } = options;
        const fragmentToSave = isInEditStore ? this.fragmentInEdit : fragment;

        if (!fragmentToSave) {
            throw new Error('No fragment provided for saving');
        }

        const isDictionaryFragment =
            fragmentToSave.path?.includes('/dictionary/');
        this.showToast('Saving fragment...');
        this.operation.set(OPERATIONS.SAVE);

        try {
            const savedFragment =
                await this.aem.sites.cf.fragments.save(fragmentToSave);

            if (!savedFragment) {
                throw new Error('Invalid fragment.');
            }

            if (isInEditStore) {
                this.fragmentStoreInEdit.refreshFrom(savedFragment);
            }

            this.showToast('Fragment successfully saved.', 'positive');
            this.operation.set();
            return savedFragment;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to save fragment.');
            if (isDictionaryFragment) {
                throw error;
            }
            return false;
        }
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async copyFragment() {
        try {
            this.operation.set(OPERATIONS.CLONE);
            const result = await this.aem.sites.cf.fragments.copy(
                this.fragmentInEdit,
            );
            const newFragment = await this.#addToCache(result);

            const newFragmentStore = new FragmentStore(newFragment);
            Store.fragments.list.data.set((prev) => [
                ...prev,
                newFragmentStore,
            ]);
            editFragment(newFragmentStore);

            this.operation.set();
            Events.fragmentAdded.emit(newFragment.id);
            this.showToast('Fragment successfully copied.', 'positive');
            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to copy fragment.');
        }
        return false;
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async publishFragment() {
        try {
            this.operation.set(OPERATIONS.PUBLISH);
            await this.aem.sites.cf.fragments.publish(this.fragmentInEdit);
            this.operation.set();
            this.showToast('Fragment successfully published.', 'positive');

            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to publish fragment.');
        }
        return false;
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async deleteFragment(fragment, options = {}) {
        const { isInEditStore = true, refreshPlaceholders = false } = options;
        const fragmentToDelete = isInEditStore ? this.fragmentInEdit : fragment;

        if (!fragmentToDelete) {
            throw new Error('No fragment provided for deletion');
        }

        try {
            this.operation.set(OPERATIONS.DELETE);
            this.showToast('Deleting fragment...');

            try {
                const fragmentWithEtag =
                    await this.aem.sites.cf.fragments.getWithEtag(
                        fragmentToDelete.id,
                    );

                if (fragmentWithEtag) {
                    await this.aem.sites.cf.fragments.delete(fragmentWithEtag);
                }
            } catch (error) {
                if (!error.message.includes('404')) {
                    throw error;
                }
                console.debug('Fragment already deleted or not found');
            }

            if (isInEditStore) {
                Store.fragments.list.data.set((prev) => {
                    const result = [...prev];
                    const index = result.findIndex(
                        (fragmentStore) =>
                            fragmentStore.value.id === fragmentToDelete.id,
                    );
                    if (index !== -1) {
                        result.splice(index, 1);
                    }
                    return result;
                });
                this.inEdit.set();
            }

            this.operation.set();
            this.showToast('Fragment successfully deleted.', 'positive');
            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to delete fragment');
            if (fragment.path?.includes('/dictionary/')) {
                throw error;
            }
            return false;
        }
    }

    /**
     * Updates a given fragment store with the latest data
     * @param {FragmentStore} store
     */
    async refreshFragment(store) {
        store.setLoading(true);
        const id = store.get().id;
        const latest = await this.aem.sites.cf.fragments.getById(id);
        store.refreshFrom(latest);
        this.#addToCache(store.get());
        store.setLoading(false);
    }

    /**
     * Helper to update a specific field in a fragment fields array
     * @param {Array} fields - The fields array
     * @param {string} fieldName - Name of the field to update
     * @param {Array} values - New values for the field
     * @param {string} type - Field type
     * @param {boolean} multiple - Whether field supports multiple values
     * @returns {Array} - Updated fields array
     */
    updateFieldInFragment(fields, fieldName, values, type, multiple = false) {
        return fields.map((field) => {
            if (field.name === fieldName) {
                return {
                    name: fieldName,
                    type: type || field.type || 'content-fragment',
                    multiple: multiple || field.multiple || false,
                    values,
                };
            }
            return {
                name: field.name,
                type: field.type || 'text',
                multiple: field.multiple || false,
                values: field.values,
            };
        });
    }

    /**
     * Populates the store with addon placeholders by filtering fragments that start with 'addon-'
     */
    async loadAddonPlaceholders() {
        Store.placeholders.addons.loading.set(true);
        if (Store.placeholders.addons.data.get().length > 1) return;
        try {
            const cursor = await this.aem.sites.cf.fragments.search(
                {
                    path: `${this.parentPath}/dictionary`,
                },
                null,
                this.#abortControllers.search,
            );

            const result = await cursor.next();
            const addonFragments = [];
            for await (const item of result.value) {
                const key = item.fields.find((field) => field.name === 'key')
                    ?.values[0];
                if (/^addon-/.test(key)) {
                    addonFragments.push({ value: key, itemText: key });
                }
            }
            Store.placeholders.addons.data.set((prev) => [
                ...prev,
                ...addonFragments,
            ]);
        } catch (error) {
            this.processError(error, 'Could not load addon placeholders.');
        } finally {
            Store.placeholders.addons.loading.set(false);
        }
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-repository', MasRepository);
