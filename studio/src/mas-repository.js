import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { AEM } from './aem/aem.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import { getInEditFragment } from './store.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { editFragment } from './editor-panel.js';
import { looseEquals, UserFriendlyError } from './utils.js';

const ROOT = '/content/dam/mas';

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

    constructor() {
        super();
        this.#abortControllers = { search: null, recentlyUpdated: null };
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.unpublishFragment = this.unpublishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
    }

    /** @type {{ search: AbortController | null, recentlyUpdated: AbortController | null }} */
    #abortControllers;
    /** @type {AEM} */
    #aem;

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    currentPage = new StoreController(this, Store.currentPage);
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
        this.#aem = new AEM(this.bucket, this.baseUrl);
        this.loadFolders();
        this.style.display = 'none';
    }

    /**
     * @param {Error} error
     * @param {string} defaultMessage - Generic toast message (can be overriden by the error's message)
     */
    processError(error, defaultMessage) {
        let message = defaultMessage;
        if (error instanceof UserFriendlyError) message = error.message;
        console.error(`Failed to save fragment: ${error.message}`);
        Events.toast.emit({
            variant: 'negative',
            content: message,
        });
    }

    update() {
        super.update();
        if (!this.foldersLoaded.value) return;
        /**
         * Automatically fetch data when search/filters update.
         * Both load methods have page guards (ex. fragments won't be searched on the 'splash' page)
         */
        this.searchFragments();
        this.loadRecentlyUpdatedFragments();
    }

    async loadFolders() {
        try {
            const { children } = await this.#aem.folders.list(ROOT);
            const ignore = window.localStorage.getItem('ignore_folders') || [
                'images',
            ];
            const folders = children
                .map((folder) => folder.name)
                .filter((child) => !ignore.includes(child));

            Store.folders.loaded.set(true);
            Store.folders.data.set(folders);

            if (!folders.includes(this.search.value.path))
                Store.search.update((prev) => ({
                    ...prev,
                    path: folders.at(0),
                }));
        } catch (error) {
            Store.fragments.list.loading.set(false);
            Store.fragments.recentlyUpdated.loading.set(false);
            this.processError(error, 'Could not load folders.');
        }
    }

    async searchFragments() {
        if (this.currentPage.value !== 'content') return;

        Store.fragments.list.loading.set(true);

        const dataStore = Store.fragments.list.data;
        const path = this.search.value.path;
        const query = this.search.value.query;

        if (
            !looseEquals(dataStore.getMeta('path'), path) ||
            !looseEquals(dataStore.getMeta('query'), query)
        ) {
            dataStore.set([]);
            dataStore.removeMeta('path');
            dataStore.removeMeta('query');
        }

        const localSearch = {
            ...this.search.value,
            path: getDamPath(path) + `/en_US`,
        };
        const fragments = [];

        try {
            if (this.#abortControllers.search)
                this.#abortControllers.search.abort();
            this.#abortControllers.search = new AbortController();

            if (isUUID(this.search.value.query)) {
                const fragmentData = await this.#aem.sites.cf.fragments.getById(
                    localSearch.query,
                    this.#abortControllers.search,
                );
                if (
                    fragmentData &&
                    fragmentData.path.indexOf(localSearch.path) == 0
                ) {
                    const fragment = new Fragment(fragmentData);
                    fragments.push(fragment);
                    dataStore.set([new FragmentStore(fragment)]);
                }
            } else {
                const cursor = await this.#aem.sites.cf.fragments.search(
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

            this.#abortControllers.search = null;

            await this.addToCache(fragments);
        } catch (error) {
            if (error.name === 'AbortError') return;
            this.processError(error, 'Could not load fragments.');
        }

        Store.fragments.list.loading.set(false);
    }

    async loadRecentlyUpdatedFragments() {
        if (this.currentPage.value !== 'splash') return;
        if (this.#abortControllers.recentlyUpdated)
            this.#abortControllers.recentlyUpdated.abort();
        this.#abortControllers.recentlyUpdated = new AbortController();

        Store.fragments.recentlyUpdated.loading.set(true);

        const dataStore = Store.fragments.recentlyUpdated.data;
        const path = this.search.value.path;

        if (!looseEquals(dataStore.getMeta('path'), path)) {
            dataStore.set([]);
            dataStore.removeMeta('path');
        }

        try {
            const cursor = await this.#aem.sites.cf.fragments.search(
                {
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                    path: `/content/dam/mas/${path}`,
                    // tags: ['mas:status/DEMO']
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

    async addToCache(fragments) {
        if (!Fragment.cache) {
            await customElements.whenDefined('aem-fragment').then(() => {
                Fragment.cache = document.createElement('aem-fragment').cache;
            });
        }
        Fragment.cache.add(...fragments);
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

        try {
            const fragmentStore = Store.fragments.inEdit.get();
            const fragment = fragmentStore.get();
            let updatedFragment =
                await this.#aem.sites.cf.fragments.save(fragment);
            if (!updatedFragment) throw new Error('Invalid fragment.');
            fragmentStore.refreshFrom(updatedFragment);

            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully saved.',
            });

            return true;
        } catch (error) {
            this.processError(error, 'Failed to save fragment.');
        }
        return false;
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async copyFragment() {
        try {
            const fragment = getInEditFragment();

            const result = await this.#aem.sites.cf.fragments.copy(fragment);
            const newFragment = new Fragment(result);
            Fragment.cache.add(newFragment);

            const newFragmentStore = new FragmentStore(newFragment);
            Store.fragments.list.data.update((prev) => [
                ...prev,
                newFragmentStore,
            ]);
            editFragment(newFragmentStore);

            Events.fragmentAdded.emit(newFragment.id);
            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully copied.',
            });

            return true;
        } catch (error) {
            this.processError(error, 'Failed to copy fragment.');
        }
        return false;
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async publishFragment() {
        try {
            const fragment = getInEditFragment();
            await this.#aem.sites.cf.fragments.publish(fragment);

            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully published.',
            });

            return true;
        } catch (error) {
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
            const fragment = getInEditFragment();
            await this.#aem.sites.cf.fragments.delete(fragment);

            Store.fragments.list.data.update((prev) => {
                var result = [...prev];
                const index = result.indexOf(fragment);
                result.splice(index, 1);
                return result;
            });
            Store.fragments.inEdit.set(null);

            Events.toast.emit({
                variant: 'positive',
                content: 'Fragment successfully deleted.',
            });

            return true;
        } catch (error) {
            this.processError(error, 'Failed to delete fragment.');
        }
        return false;
    }

    /**
     * Updates a given fragment store with the latest data
     * @param {FragmentStore} store
     */
    async refreshFragment(store) {
        const id = store.get().id;
        const latest = await this.#aem.sites.cf.fragments.getById(id);
        store.refreshFrom(latest);
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-repository', MasRepository);
