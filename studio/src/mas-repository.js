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
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
    EDITABLE_FRAGMENT_MODEL_IDS,
} from './constants.js';

const ROOT = '/content/dam/mas';

let fragmentCache;

export function getDamPath(path) {
    if (!path) return ROOT;
    if (path.startsWith(ROOT)) return path;
    return ROOT + '/' + path;
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

    constructor() {
        super();
        this.#abortControllers = { search: null, recentlyUpdated: null };
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.unpublishFragment = this.unpublishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.handleSearch = debounce(this.handleSearch.bind(this), 50);
    }

    /** @type {{ search: AbortController | null, recentlyUpdated: AbortController | null }} */
    #abortControllers;
    /** @type {AEM} */
    aem;

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    page = new StoreController(this, Store.page);
    foldersLoaded = new StoreController(this, Store.folders.loaded);
    recentlyUpdatedLimit = new StoreController(
        this,
        Store.fragments.recentlyUpdated.limit,
    );

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

    update() {
        super.update();
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
        }
    }

    async loadFolders() {
        try {
            const { children } = await this.aem.folders.list(ROOT);
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
        if (this.page.value !== 'content') return;

        Store.fragments.list.loading.set(true);

        const dataStore = Store.fragments.list.data;
        const path = this.search.value.path;
        const query = this.search.value.query;
        let tags = [...(this.filters.value.tags ?? [])];

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

        // Remove published status from tags and set it as a status filter
        const publishedTagIndex = tags.indexOf(TAG_STATUS_PUBLISHED);
        if (publishedTagIndex > -1) {
            tags.splice(publishedTagIndex, 1);
            localSearch.status = STATUS_PUBLISHED;
        }

        const fragments = [];

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
                    const fragment = new Fragment(fragmentData);
                    fragments.push(fragment);
                    dataStore.set([new FragmentStore(fragment)]);

                    // Folder selection
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
                for await (const result of cursor) {
                    result.forEach((item) => {
                        const fragment = new Fragment(item);
                        fragments.push(fragment);
                    });
                }
                dataStore.set(
                    fragments.map((fragment) => new FragmentStore(fragment)),
                );
            }

            dataStore.setMeta('path', path);
            dataStore.setMeta('query', query);
            dataStore.setMeta('tags', tags);

            this.#abortControllers.search = null;

            await this.addToCache(fragments);
        } catch (error) {
            this.processError(error, 'Could not load fragments.');
        }

        Store.fragments.list.loading.set(false);
    }

    async loadRecentlyUpdatedFragments() {
        if (this.page.value !== 'welcome') return;
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
            const fragments = [];
            dataStore.set(
                result.value.map((item) => {
                    const fragment = new Fragment(item);
                    fragments.push(fragment);
                    return new FragmentStore(fragment);
                }),
            );

            dataStore.setMeta('path', path);

            this.#abortControllers.recentlyUpdated = null;

            await this.addToCache(fragments);
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

            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully created.',
            });
            this.operation.set();
            return latest;
        } catch (error) {
            this.processError(error, 'Failed to create fragment.');
        }
    }

    async addToCache(fragments) {
        if (!fragmentCache) {
            await customElements.whenDefined('aem-fragment').then(() => {
                fragmentCache = document.createElement('aem-fragment').cache;
            });
        }
        if (!fragmentCache) return;
        for (const fragment of fragments) {
            if (fragmentCache.has(fragment)) continue;
            fragmentCache.add(fragment);
        }
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
            const newFragment = new Fragment(result);
            fragmentCache.add(newFragment);

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
        this.addToCache([store.get()]);
        store.setLoading(true);
        const id = store.get().id;
        const latest = await this.aem.sites.cf.fragments.getById(id);
        store.refreshFrom(latest);
        store.setLoading(false);
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-repository', MasRepository);
