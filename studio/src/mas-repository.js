import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import Store, { editFragment } from './store.js';
import { AEM } from './aem/aem.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import { debounce, looseEquals, showToast, UserFriendlyError } from './utils.js';
import {
    OPERATIONS,
    STATUS_PUBLISHED,
    TAG_STATUS_PUBLISHED,
    ROOT_PATH,
    PAGE_NAMES,
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
    EDITABLE_FRAGMENT_MODEL_IDS,
    DICTIONARY_MODEL_ID,
    TAG_STATUS_DRAFT,
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    LOCALE_DEFAULT,
} from './constants.js';
import { Placeholder } from './aem/placeholder.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';
import { getDictionary } from '../libs/fragment-client.js';

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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
        this.#abortControllers = {
            search: null,
            recentlyUpdated: null,
            placeholders: null,
        };
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.search = new StoreController(this, Store.search);
        this.filters = new StoreController(this, Store.filters);
        this.page = new StoreController(this, Store.page);
        this.foldersLoaded = new StoreController(this, Store.folders.loaded);
        this.reactiveController = new ReactiveController(this, [Store.profile, Store.createdByUsers]);
        this.recentlyUpdatedLimit = new StoreController(this, Store.fragments.recentlyUpdated.limit);
        this.handleSearch = debounce(this.handleSearch.bind(this), 50);
    }

    /** @type {{ search: AbortController | null, recentlyUpdated: AbortController | null }} */
    #abortControllers;
    /** @type {AEM} */
    aem;

    connectedCallback() {
        super.connectedCallback();
        if (!(this.bucket || this.baseUrl)) throw new Error('Either the bucket or baseUrl attribute is required.');
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
        console.error(`${defaultMessage ? `${defaultMessage}: ` : ''}${error.message}`, error.stack);
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
        if (!Store.profile.value) return;
        switch (this.page.value) {
            case PAGE_NAMES.CONTENT:
                this.searchFragments();
                this.loadPreviewPlaceholders();
                break;
            case PAGE_NAMES.WELCOME:
                this.loadRecentlyUpdatedFragments();
                break;
            case PAGE_NAMES.PLACEHOLDERS:
                this.loadPlaceholders();
                break;
        }
    }

    async loadFolders() {
        try {
            const { children } = await this.aem.folders.list(ROOT_PATH);
            const ignore = window.localStorage.getItem('ignore_folders') || ['images'];
            const folders = children.map((folder) => folder.name).filter((child) => !ignore.includes(child));

            Store.folders.loaded.set(true);
            Store.folders.data.set(folders);

            if (!folders.includes(this.search.value.path) && !this.search.value.query)
                Store.search.set((prev) => ({
                    ...prev,
                    path: folders.at(0),
                }));
            Store.fragments.list.data.set([]);
        } catch (error) {
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(false);
            Store.fragments.recentlyUpdated.loading.set(false);
            this.processError(error, 'Could not load folders.');
        }
    }

    get parentPath() {
        return `${getDamPath(this.search.value.path)}/${this.filters.value.locale}`;
    }

    get fragmentStoreInEdit() {
        return this.inEdit.get();
    }

    get fragmentInEdit() {
        return this.fragmentStoreInEdit?.get();
    }

    async searchFragmentList(options, limit, abortController) {
        const cursor = await this.aem.sites.cf.fragments.search(options, limit, abortController);
        const fragments = [];
        for await (const result of cursor) {
            for await (const item of result) {
                const fragment = await this.#addToCache(item);
                fragments.push(fragment);
            }
        }
        return fragments;
    }

    skipVariant(variants, item) {
        const variant = item.fields.find((field) => field.name === 'variant')?.values?.[0];
        return variants.length && !variants.includes(variant);
    }

    async searchFragments() {
        if (this.page.value !== PAGE_NAMES.CONTENT) return;
        if (!Store.profile.value) return;

        Store.fragments.list.loading.set(true);
        Store.fragments.list.firstPageLoaded.set(false);

        const path = this.search.value.path;
        const dataStore = Store.fragments.list.data;
        const query = this.search.value.query;
        const TAG_VARIANT_PREFIX = 'mas:variant/';

        let tags = [];
        if (this.filters.value.tags) {
            if (typeof this.filters.value.tags === 'string') {
                tags = this.filters.value.tags.split(',').filter(Boolean);
            } else if (Array.isArray(this.filters.value.tags)) {
                tags = this.filters.value.tags.filter(Boolean);
            } else {
                console.warn('Unexpected tags format:', this.filters.value.tags);
            }
        }

        const createdBy = Store.createdByUsers.get().map((user) => user.userPrincipalName);

        let modelIds = tags.filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE)).map((tag) => TAG_MODEL_ID_MAPPING[tag]);

        if (modelIds.length === 0) modelIds = EDITABLE_FRAGMENT_MODEL_IDS;

        const variants = tags
            .filter((tag) => tag.startsWith(TAG_VARIANT_PREFIX))
            .map((tag) => tag.replace(TAG_VARIANT_PREFIX, ''));
        tags = tags.filter((tag) => !tag.startsWith(TAG_STUDIO_CONTENT_TYPE) && !tag.startsWith(TAG_VARIANT_PREFIX));

        const damPath = getDamPath(path);
        const localSearch = {
            ...this.search.value,
            modelIds,
            path: `${damPath}/${this.filters.value.locale}`,
            tags,
            createdBy,
            sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
        };

        const publishedTagIndex = tags.indexOf(TAG_STATUS_PUBLISHED);
        if (publishedTagIndex > -1) {
            tags.splice(publishedTagIndex, 1);
            localSearch.status = STATUS_PUBLISHED;
        }

        try {
            if (this.#abortControllers.search) this.#abortControllers.search.abort();
            this.#abortControllers.search = new AbortController();

            if (isUUID(this.search.value.query)) {
                // Check if the fragment with this UUID is already the only one in the store
                const [currentFragment] = dataStore.get() ?? [];
                if (currentFragment?.value.id === this.search.value.query) {
                    // Skip search if we already have exactly this fragment)
                    Store.fragments.list.loading.set(false);
                    Store.fragments.list.firstPageLoaded.set(true);
                    return;
                }
                dataStore.set([]);
                const fragmentData = await this.aem.sites.cf.fragments.getById(
                    localSearch.query,
                    this.#abortControllers.search,
                );
                if (fragmentData && fragmentData.path.indexOf(damPath) == 0) {
                    const fragment = await this.#addToCache(fragmentData);
                    const sourceStore = generateFragmentStore(fragment);
                    dataStore.set([sourceStore]);

                    const folderPath = fragmentData.path.substring(fragmentData.path.indexOf(damPath) + damPath.length + 1);
                    const folderName = folderPath.substring(0, folderPath.indexOf('/'));
                    if (Store.folders.data.get().includes(folderName)) {
                        Store.search.set((prev) => ({
                            ...prev,
                            path: folderName,
                        }));
                    }
                }
            } else {
                Store.fragments.list.loading.set(true);
                Store.fragments.list.firstPageLoaded.set(false);
                dataStore.set([]);
                const cursor = await this.aem.sites.cf.fragments.search(localSearch, null, this.#abortControllers.search);
                const fragmentStores = [];
                for await (const result of cursor) {
                    for await (const item of result) {
                        if (this.skipVariant(variants, item)) continue;
                        const fragment = await this.#addToCache(item);
                        const sourceStore = generateFragmentStore(fragment);
                        fragmentStores.push(sourceStore);
                    }
                    dataStore.set([...fragmentStores]);
                    Store.fragments.list.firstPageLoaded.set(true);
                }
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
        if (this.#abortControllers.recentlyUpdated) this.#abortControllers.recentlyUpdated.abort();
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
                const sourceStore = generateFragmentStore(fragment);
                fragmentStores.push(sourceStore);
            }
            dataStore.set(fragmentStores);

            dataStore.setMeta('path', path);

            this.#abortControllers.recentlyUpdated = null;
        } catch (error) {
            this.processError(error, 'Could not load recently updated fragments.');
        }

        Store.fragments.recentlyUpdated.loading.set(false);
    }

    async loadPlaceholders() {
        try {
            /* If surface is not set yet, skip loading placeholders */
            if (!this.search.value.path) return;

            const dictionaryPath = this.getDictionaryPath();

            const searchOptions = {
                path: dictionaryPath,
                sort: [{ on: 'created', order: 'ASC' }],
            };

            if (this.#abortControllers.placeholders) this.#abortControllers.placeholders.abort();
            this.#abortControllers.placeholders = new AbortController();

            Store.placeholders.list.loading.set(true);

            const fragments = await this.searchFragmentList(searchOptions, 50, this.#abortControllers.placeholders);

            const indexFragment = fragments.find((fragment) => fragment.path.endsWith('/index'));
            if (indexFragment) Store.placeholders.index.set(indexFragment);
            else console.error('No index fragment found:', error);

            const placeholders = fragments
                .filter((fragment) => !fragment.path.endsWith('/index'))
                .map((fragment) => new FragmentStore(new Placeholder(fragment)));

            Store.placeholders.list.data.set(placeholders);
        } catch (error) {
            this.processError(error, 'Could not load placeholders.');
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    async loadPreviewPlaceholders() {
        try {
            const context = {
                preview: {
                    url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
                },
                locale: this.filters.value.locale,
                surface: this.search.value.path,
            };
            const result = await getDictionary(context);
            Store.placeholders.preview.set(result);
        } catch (error) {
            this.processError(error, 'Could not load preview placeholders.');
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    getDictionaryPath() {
        return `${ROOT_PATH}/${this.search.value.path}/${this.filters.value.locale}/dictionary`;
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
                    if (key === 'tags') {
                        fields.push({ name: key, type: 'tag', values: value });
                    } else {
                        const type = key === 'locReady' ? 'boolean' : 'text';
                        fields.push({ name: key, type, values: [value] });
                    }
                    return fields;
                },
                [...existingFields],
            );
    }

    /**
     * @param {object} fragmentData
     * @param {boolean} withToast
     * @returns {Promise<Fragment>}
     */
    async createFragment(fragmentData, withToast = true) {
        try {
            if (withToast) showToast('Creating fragment...');

            this.operation.set(OPERATIONS.CREATE);

            const fields = this.createFieldsFromData(fragmentData.data, fragmentData.fields || []);

            const result = await this.aem.sites.cf.fragments.create({
                ...fragmentData,
                description: fragmentData.description || '',
                fields,
                parentPath: fragmentData.parentPath || this.parentPath,
            });
            let latest = await this.aem.sites.cf.fragments.getById(result.id);
            if (fragmentData.data?.tags?.length) {
                latest.newTags = fragmentData.data.tags;
                await this.aem.saveTags(latest);
                latest = await this.aem.sites.cf.fragments.getById(result.id);
            }
            const fragment = await this.#addToCache(latest);

            if (withToast) showToast('Fragment successfully created.', 'positive');

            return fragment;
        } catch (error) {
            if (error.message.includes(': 409')) {
                throw error;
            } else {
                this.processError(error, 'Failed to create fragment.');
            }
        } finally {
            this.operation.set(null);
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
     * @param {FragmentStore} fragmentStore - The fragment to save
     * @returns {Promise<Object>} The saved fragment
     */
    async saveFragment(fragmentStore) {
        showToast('Saving fragment...');
        const fragmentToSave = fragmentStore.get();
        if (fragmentToSave.model?.path === CARD_MODEL_PATH && !fragmentToSave.getFieldValue('osi')) {
            showToast('Please select offer', 'negative');
            return false;
        }
        this.operation.set(OPERATIONS.SAVE);
        try {
            const savedFragment = await this.aem.sites.cf.fragments.save(fragmentToSave);
            if (!savedFragment) throw new Error('Invalid fragment.');
            fragmentStore.refreshFrom(savedFragment);
            showToast('Fragment successfully saved.', 'positive');
            return savedFragment;
        } catch (error) {
            this.processError(error, 'Failed to save fragment.');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async copyFragment(updatedTitle, osi, tags = []) {
        try {
            this.operation.set(OPERATIONS.CLONE);
            const result = await this.aem.sites.cf.fragments.copy(this.fragmentInEdit);
            let savedResult = result;
            if ((updatedTitle && updatedTitle !== result.title) || tags.length) {
                if (updatedTitle) result.title = updatedTitle;
                if (tags.length) {
                    result.fields.forEach((field) => {
                        if (field.name === 'tags') {
                            field.values = tags;
                        }
                        if (field.name === 'originalId') {
                            field.values = [result.id];
                        }
                        if (osi && field.name === 'osi') {
                            field.values = [osi];
                        }
                    });
                }
                savedResult = await this.aem.sites.cf.fragments.save(result);
            }
            if (tags.length) {
                savedResult.newTags = tags;
                await this.aem.saveTags(savedResult);
                savedResult = await this.aem.sites.cf.fragments.getById(savedResult.id);
            }
            const newFragment = await this.#addToCache(savedResult);

            const sourceStore = generateFragmentStore(newFragment);
            Store.fragments.list.data.set((prev) => [sourceStore, ...prev]);
            editFragment(sourceStore);

            this.operation.set();
            Events.fragmentAdded.emit(newFragment.id);
            showToast('Fragment successfully copied.', 'positive');
            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to copy fragment.');
        }
        return false;
    }

    /**
     * @param {Fragment} fragment Fragment to publish
     * @param {boolean} withToast Whether or not to display toasts
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async publishFragment(fragment, publishReferencesWithStatus = ['DRAFT', 'UNPUBLISHED'], withToast = true) {
        try {
            this.operation.set(OPERATIONS.PUBLISH);
            await this.aem.sites.cf.fragments.publish(fragment, publishReferencesWithStatus);
            if (withToast) showToast('Fragment successfully published.', 'positive');

            return true;
        } catch (error) {
            this.processError(error, 'Failed to publish fragment.');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * @param {Fragment} fragment Fragment to delete
     * @param {object} options
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async deleteFragment(fragment, { startToast = true, endToast = true } = {}) {
        try {
            this.operation.set(OPERATIONS.DELETE);
            if (startToast) showToast('Deleting fragment...');

            const fragmentWithEtag = await this.aem.sites.cf.fragments.getWithEtag(fragment.id);

            if (fragmentWithEtag) await this.aem.sites.cf.fragments.delete(fragmentWithEtag);

            if (endToast) showToast('Fragment successfully deleted.', 'positive');

            Events.fragmentDeleted.emit(fragment);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to delete fragment');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * Deletes multiple fragments in parallel, using the 'deleteFragment' method
     * @param {Fragment[]} fragments Fragments to delete
     * @param {object} options
     */
    async bulkDeleteFragments(fragments, options) {
        const promises = fragments.map((fragment) => this.deleteFragment(fragment, options));
        return Promise.all(promises);
    }

    async createPlaceholder(placeholder) {
        try {
            const folderPath = this.search.value.path;
            const locale = this.filters.value.locale;
            if (!folderPath || !locale) return false;

            const dictionaryPath = this.getDictionaryPath();

            const typeMap = {
                richTextValue: 'long-text',
                locReady: 'boolean',
            };

            const fields = {
                key: placeholder.key,
                value: placeholder.isRichText ? '' : placeholder.value,
                richTextValue: placeholder.isRichText ? placeholder.value : '',
                locReady: true,
            };

            const payload = {
                name: placeholder.key,
                parentPath: dictionaryPath,
                modelId: DICTIONARY_MODEL_ID,
                title: placeholder.key,
                description: `Placeholder for ${placeholder.key}`,
                fields: Object.keys(fields).map((key) => ({
                    name: key,
                    type: typeMap[key] || 'text',
                    values: [fields[key]],
                })),
            };

            const fragment = await this.createFragment(payload, false);
            const newPlaceholder = new Placeholder(fragment);
            newPlaceholder.updateField('tags', [TAG_STATUS_DRAFT]);
            await this.aem.saveTags(newPlaceholder);

            const addedToIndex = await this.addToIndexFragment(newPlaceholder);
            if (!addedToIndex) throw new Error('Failed to update index fragment with new placeholder reference');

            Store.placeholders.list.data.set((prev) => [...prev, new FragmentStore(newPlaceholder)]);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to create');
            return false;
        }
    }

    /**
     * @param {Fragment} fragment
     * @returns {{ parentPath: string, fragmentPath: string }}
     */
    getParentPath(fragment) {
        const parentPath = fragment.path.substring(0, fragment.path.lastIndexOf('/'));
        if (!parentPath) throw new Error(`Failed to determine dictionary path from fragment path: ${fragment.path}`);
        return parentPath;
    }

    /**
     * @param {string} path
     * @returns {Promise<Fragment | null>}
     */
    async getIndexFragment(path) {
        try {
            const indexFragment = await this.aem.sites.cf.fragments.getByPath(path);
            return new Fragment(indexFragment);
        } catch (error) {
            return null;
        }
    }

    async addToIndexFragment(fragment) {
        const parentPath = this.getParentPath(fragment);

        const indexPath = `${parentPath}/index`;

        const indexFragment = await this.getIndexFragment(indexPath);

        try {
            if (!indexFragment) {
                return this.createIndexFragment(parentPath, fragment.path);
            }

            const entries = indexFragment.getField('entries');
            const shouldUpdate = !entries.values.includes(fragment.path);

            let updatedIndexFragment = indexFragment;
            if (shouldUpdate) {
                indexFragment.updateField('entries', [...entries.values, fragment.path]);
                updatedIndexFragment = await this.aem.sites.cf.fragments.save(indexFragment);
            } else {
                console.info(`Fragment already added to index: ${fragment.path}`);
            }

            await this.publishFragment(updatedIndexFragment, [], false);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to add fragment to index.');
            return false;
        }
    }

    async removeFromIndexFragment(fragments) {
        const fragmentsToRemove = !Array.isArray(fragments) ? [fragments] : fragments;

        const parentPath = this.getParentPath(fragmentsToRemove[0]);

        const indexPath = `${parentPath}/index`;

        const indexFragment = await this.getIndexFragment(indexPath);

        try {
            if (!indexFragment) return false;

            const entries = indexFragment.getField('entries');
            let shouldUpdate = false;
            for (const fragment of fragmentsToRemove) {
                if (entries.values.includes(fragment.path)) {
                    shouldUpdate = true;
                    break;
                }
            }

            let updatedIndexFragment = indexFragment;
            if (shouldUpdate) {
                const fragmentPaths = fragmentsToRemove.map((fragment) => fragment.path);
                indexFragment.updateField(
                    'entries',
                    entries.values.filter((entry) => !fragmentPaths.includes(entry)),
                );
                updatedIndexFragment = await this.aem.sites.cf.fragments.save(indexFragment);
            } else {
                console.info(`Fragment(s) already added to index.`);
            }

            await this.publishFragment(updatedIndexFragment, [], false);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to add fragment(s) to index.');
            return false;
        }
    }

    /**
     * Creates a new index fragment with initial entries
     * @param {string} parentPath - Parent path for the index
     * @param {string} fragmentPath - Initial fragment path to include
     * @returns {Promise<boolean>} - Success status
     */
    async createIndexFragment(parentPath, fragmentPath) {
        try {
            const indexFragment = await this.aem.sites.cf.fragments.create({
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
                        values: [fragmentPath],
                    },
                    {
                        name: 'key',
                        type: 'text',
                        multiple: false,
                        values: ['index'],
                    },
                    {
                        name: 'value',
                        type: 'text',
                        multiple: false,
                        values: ['Dictionary index'],
                    },
                    {
                        name: 'locReady',
                        type: 'boolean',
                        multiple: false,
                        values: [true],
                    },
                ],
            });

            if (!indexFragment?.id) {
                console.error('Failed to create index fragment');
                return false;
            }

            await this.publishFragment(indexFragment, [], false);

            return true;
        } catch (error) {
            console.error('Failed to create index fragment:', error);
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
        if ([CARD_MODEL_PATH, COLLECTION_MODEL_PATH].includes(latest.model.path)) {
            // originalId allows to keep track of the relation between en_US fragment and the current one if in different locales
            const originalId = store.get().getOriginalIdField();
            if (this.filters.value.locale === LOCALE_DEFAULT) {
                originalId.values = [latest.id];
            } else {
                const enUsPath = latest.path.replace(this.filters.value.locale, LOCALE_DEFAULT);
                try {
                    const sourceFragment = await this.aem.sites.cf.fragments.getByPath(enUsPath);
                    if (sourceFragment) {
                        originalId.values = [sourceFragment.id];
                    }
                } catch (error) {
                    //not all fragments have en_US version, so we can ignore this error
                }
            }
        }
        this.#addToCache(store.get());
        store.setLoading(false);
    }

    /**
     * Fetches a fragment by its path to get the latest version
     * @param {string} path - Path to the fragment
     * @returns {Promise<Object>} - The latest fragment data
     */
    async getFragmentByPath(path) {
        if (!path) {
            throw new Error('Fragment path is required');
        }

        if (path.includes('/dictionary/')) {
            return {
                path,
                id: 'stub-fragment-id',
                etag: 'stub-etag',
                fields: [],
                status: 'PUBLISHED',
            };
        }

        if (!this.aem) {
            throw new Error('AEM client not initialized');
        }

        const encodedPath = encodeURIComponent(path);
        const url = `${this.aem.cfFragmentsUrl}/api/assets/${encodedPath}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.aem?.headers || {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Fragment not found at path: ${path}`);
        }

        return await response.json();
    }

    /**
     * Populates the store with addon placeholders by filtering fragments that start with 'addon-'
     */
    async loadAddonPlaceholders() {
        if (Store.placeholders.addons.data.get().length > 1) return;
        Store.placeholders.addons.loading.set(true);
        try {
            const options = {
                path: `${this.parentPath}/dictionary`,
            };
            const fragments = await this.searchFragmentList(options);
            const addonFragments = [];
            for await (const item of fragments) {
                const key = item.fields.find((field) => field.name === 'key')?.values[0];
                if (/^addon-/.test(key)) {
                    addonFragments.push({ value: key, itemText: key });
                }
            }
            Store.placeholders.addons.data.set((prev) => [...prev, ...addonFragments]);
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
