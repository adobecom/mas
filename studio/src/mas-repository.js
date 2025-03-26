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
        this.unpublishFragment = this.unpublishFragment.bind(this);
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

    disconnectedCallback() {
        super.disconnectedCallback();
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
            case 'placeholders':
                this.searchPlaceholders();
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
        console.log('searchFragments starting');
        if (this.page.value !== PAGE_NAMES.CONTENT) return;

        Store.fragments.list.loading.set(true);

        const dataStore = Store.fragments.list.data;
        const path = this.search.value.path;
        const query = this.search.value.query;
        let tags = this.filters.value.tags?.split(',').filter(Boolean) ?? [];

        // Extract content type tags from the tags array
        let modelIds = tags
            .filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE))
            .map((tag) => TAG_MODEL_ID_MAPPING[tag]);

        if (modelIds.length === 0) modelIds = EDITABLE_FRAGMENT_MODEL_IDS;

        // Remove content type tags from the original tags array
        tags = tags.filter((tag) => !tag.startsWith(TAG_STUDIO_CONTENT_TYPE));

        if (
            !looseEquals(dataStore.getMeta('path'), path) ||
            !looseEquals(dataStore.getMeta('query'), query)
        ) {
            dataStore.set([]);
            dataStore.removeMeta('path');
            dataStore.removeMeta('query');
        }

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

    async createFragment(fragmentData) {
        try {
            Events.toast.emit({
                variant: 'info',
                content: 'Creating fragment...',
            });
            this.operation.set(OPERATIONS.CREATE);

            const result = await this.aem.sites.cf.fragments.create({
                ...fragmentData,
                description: '',
                fields: [],
                parentPath: this.parentPath,
            });
            const latest = await this.aem.sites.cf.fragments.getById(result.id);
            const fragment = await this.#addToCache(latest);
            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully created.',
            });
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

    /** Write */

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async saveFragment() {
        Events.toast.emit({
            variant: 'info',
            content: 'Saving fragment...',
        });
        this.operation.set(OPERATIONS.SAVE);
        try {
            let updatedFragment = await this.aem.sites.cf.fragments.save(
                this.fragmentInEdit,
            );
            if (!updatedFragment) throw new Error('Invalid fragment.');
            this.fragmentStoreInEdit.refreshFrom(updatedFragment);

            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully saved.',
            });
            this.operation.set();
            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to save fragment.');
        }
        return false;
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
            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully copied.',
            });
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
            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully published.',
            });

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
    async unpublishFragment() {
        // TODO
        return Promise.resolve(true);
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async deleteFragment() {
        try {
            this.operation.set(OPERATIONS.DELETE);
            const fragment = this.fragmentInEdit;
            await this.aem.sites.cf.fragments.delete(fragment);

            Store.fragments.list.data.set((prev) => {
                var result = [...prev];
                const index = result.findIndex(
                    (fragmentStore) => fragmentStore.value.id === fragment.id,
                );
                result.splice(index, 1);
                return result;
            });
            this.inEdit.set();
            this.operation.set();
            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully deleted.',
            });
            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to delete fragment.');
        }
        return false;
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
     * Search for placeholder fragments in the dictionary
     */
    async searchPlaceholders() {
        try {
            const folderPath = this.search.value.path;
            if (!folderPath) {
                return;
            }

            Store.placeholders.list.loading.set(true);
            const locale = this.filters.value.locale || 'en_US';
            const fullPath = `/content/dam/mas/${folderPath}/${locale}/dictionary`;
            const query = {
                filter: {
                    path: fullPath,
                },
                sort: [{ on: 'created', order: 'ASC' }],
            };

            const searchUrl = `${this.aem.cfFragmentsUrl}/search?query=${encodeURIComponent(JSON.stringify(query))}&limit=50`;

            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...this.aem.headers,
                },
            });

            if (!response.ok) {
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
                        status: fragment.status || 'Draft',
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
            this.processError(error, 'Failed to search for placeholders');
            Store.placeholders.list.data.set([]);
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    /**
     * Unpublish a dictionary/placeholder fragment using the AEM SDK
     * @param {Object} fragment - The fragment to unpublish
     * @returns {Promise<boolean>} Whether the operation was successful
     */
    async unpublishDictionaryFragment(fragment) {
        try {
            // Add info toast
            Events.toast.emit({
                variant: 'info',
                content: 'Unpublishing placeholder...',
            });

            this.operation.set(OPERATIONS.UNPUBLISH);

            try {
                if (
                    typeof this.aem.sites.cf.fragments.unpublish === 'function'
                ) {
                    await this.aem.sites.cf.fragments.unpublish(fragment);
                } else {
                    const endpoint = `${this.aem.cfFragmentsUrl}/${fragment.id}/unpublish`;

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: this.aem.headers,
                    });

                    if (!response.ok) {
                        throw new Error(
                            `Unpublish failed: ${response.status} ${response.statusText}`,
                        );
                    }
                }
            } catch (error) {
                console.debug(
                    'First unpublish attempt failed, trying alternative approach',
                );

                const endpoint = `${this.aem.cfFragmentsUrl}/${fragment.id}/unpublish`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: this.aem.headers,
                });

                if (!response.ok) {
                    throw error;
                }
            }

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully unpublished.',
            });

            this.operation.set();

            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to unpublish placeholder.');
            throw error;
        }
    }

    /**
     * Save a dictionary/placeholder fragment using the AEM SDK
     * @param {Object} fragment - The fragment data
     * @returns {Promise<Object>} The updated fragment
     */
    async saveDictionaryFragment(fragment) {
        try {
            // Add info toast
            Events.toast.emit({
                variant: 'info',
                content: 'Saving placeholder...',
            });

            this.operation.set(OPERATIONS.SAVE);

            const updatedFragment =
                await this.aem.sites.cf.fragments.save(fragment);

            if (!updatedFragment) {
                throw new Error('Invalid fragment data returned.');
            }

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully saved.',
            });

            this.operation.set();

            return updatedFragment;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to save placeholder.');
            throw error;
        }
    }

    /**
     * Publish a dictionary/placeholder fragment using the AEM SDK
     * @param {Object} fragment - The fragment to publish
     * @returns {Promise<boolean>} Whether the operation was successful
     */
    async publishDictionaryFragment(fragment) {
        try {
            Events.toast.emit({
                variant: 'info',
                content: 'Publishing placeholder...',
            });

            this.operation.set(OPERATIONS.PUBLISH);

            await this.aem.sites.cf.fragments.publish(fragment);

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully published.',
            });

            this.operation.set();

            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to publish placeholder.');
            throw error;
        }
    }

    /**
     * Delete a dictionary/placeholder fragment using the AEM SDK
     * @param {Object} fragment - The fragment to delete
     * @returns {Promise<boolean>} Whether the operation was successful
     */
    async deleteDictionaryFragment(fragment) {
        try {
            Events.toast.emit({
                variant: 'info',
                content: 'Deleting placeholder...',
            });

            this.operation.set(OPERATIONS.DELETE);

            try {
                const fragmentPath = fragment.path;
                const pathParts = fragmentPath.split('/');
                const fragmentName = pathParts.pop();
                const dictionaryPath = pathParts.join('/');

                if (fragmentName !== 'index') {
                    try {
                        await this.removeFromIndexFragment(
                            dictionaryPath,
                            fragment,
                        );
                    } catch (err) {}
                }
            } catch (indexError) {}

            await this.aem.sites.cf.fragments.delete(fragment);

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully deleted.',
            });

            this.operation.set();

            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to delete placeholder.');
            throw error;
        }
    }

    /**
     * Fetches a fragment by its path to get the latest version
     * @param {string} path - Path to the fragment
     * @returns {Promise<Object>} - The latest fragment data
     */
    async getFragmentByPath(path) {
        try {
            if (!path) {
                throw new Error('Fragment path is required');
            }

            if (!this.aem) {
                await this.initializeAem();
            }

            const encodedPath = encodeURIComponent(path);
            const response = await fetch(
                `${this.aem.cfFragmentsUrl}/api/assets/${encodedPath}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.aem?.headers || {}),
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Fragment not found at path: ${path}`);
            }

            const fragment = await response.json();
            return fragment;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new dictionary/placeholder fragment
     * @param {Object} fragmentData - The fragment data to create
     * @returns {Promise<Object>} - The created fragment
     */
    async createDictionaryFragment(fragmentData) {
        try {
            this.operation.set(OPERATIONS.CREATE);

            const { parentPath, name, modelId, title, data } = fragmentData;

            if (!parentPath) {
                throw new Error(
                    'Parent path is required for placeholder creation',
                );
            }

            if (!modelId) {
                throw new Error(
                    `Missing required model ID for fragment creation`,
                );
            }

            const fields = data
                ? Object.entries(data).map(([fieldName, value]) => {
                      let type = 'text';
                      if (typeof value === 'boolean') type = 'boolean';
                      if (typeof value === 'number') type = 'number';

                      return {
                          name: fieldName,
                          type: type,
                          values: Array.isArray(value) ? value : [value],
                      };
                  })
                : [];

            const fragmentObject = {
                title: title || name,
                model: { id: modelId },
                fields: fields,
            };

            const result = await this.aem.sites.cf.fragments.create(
                fragmentObject,
                parentPath,
            );

            const newFragment = new Fragment(result);

            return newFragment;
        } catch (error) {
            this.operation.set();
            throw error;
        }
    }

    /**
     * Add a placeholder to the surface/locale index fragment
     * @param {string} dictionaryPath - Path to the dictionary folder
     * @param {Object} newFragment - The newly created placeholder fragment
     * @returns {Promise<boolean>} Success indicator
     */
    async addToIndexFragment() {
        return true;
    }

    /**
     * Remove a placeholder from the index fragment
     * @param {string} dictionaryPath - Path to the dictionary folder
     * @param {Object} placeholderFragment - The placeholder fragment to remove
     */
    async removeFromIndexFragment() {
        return;
    }

    /**
     * Force a refresh of the placeholders table
     */
    async forceRefreshPlaceholders() {
        try {
            Store.placeholders.list.loading.set(true);
            await this.searchPlaceholders();
            const currentData = Store.placeholders.list.data.get();
            if (currentData && currentData.length) {
                Store.placeholders.list.data.set([...currentData]);
            }
        } catch (error) {
            console.debug('Error refreshing placeholders:', error);
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    /**
     * Create a placeholder without index operations
     * @param {Object} fragmentData - The fragment data to create
     * @returns {Promise<Object>} - The created fragment
     */
    async createPlaceholderWithIndex(fragmentData) {
        try {
            Events.toast.emit({
                variant: 'info',
                content: 'Creating placeholder...',
            });

            this.operation.set(OPERATIONS.CREATE);

            const newFragment =
                await this.createDictionaryFragment(fragmentData);

            await this.forceRefreshPlaceholders();

            Events.toast.emit({
                variant: 'positive',
                content: 'Placeholder successfully created.',
            });

            this.operation.set();

            return newFragment;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to create placeholder.');
            throw error;
        }
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-repository', MasRepository);
