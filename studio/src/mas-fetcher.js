import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/storeController.js';
import Store from './store.js';
import { AEM } from './aem/aem.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import { getInEditFragment } from './store.js';
import { FragmentStore } from './reactivity/reactiveStore.js';
import { editFragment } from './editors/merch-card-editor.js';
import { FOLDER_MAPPING } from './constants.js';

const ROOT = '/content/dam/mas';

function getDamPath(path) {
    if (!path) return ROOT;
    if (path.startsWith(ROOT)) return path;
    return ROOT + '/' + path;
}

function isUUID(str) {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

export class MasFetcher extends LitElement {
    static properties = {
        bucket: { type: String },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    constructor() {
        super();
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.unpublishFragment = this.unpublishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
    }

    #abortController;
    /**
     * @type {AEM}
     */
    #aem;

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    currentPage = new StoreController(this, Store.currentPage);

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

    update() {
        super.update();
        if (!Store.folders.loaded.get()) return;
        this.searchFragments();
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
                    path: Object.keys(FOLDER_MAPPING).at(0),
                }));
        } catch (error) {
            console.error(`Could not load folders: ${error.message}`);
            Store.fragments.loading.set(false);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Could not load folders.',
            });
        }
    }

    async searchFragments() {
        if (this.currentPage.value !== 'content') return;
        Store.fragments.loading.set(true);
        Store.fragments.data.set([]);

        const localSearch = {
            ...this.search.value,
            path: getDamPath(this.search.value.path),
        };

        try {
            if (this.#abortController) this.#abortController.abort();
            this.#abortController = new AbortController();

            if (isUUID(this.search.value.query)) {
                const fragmentData = await this.#aem.sites.cf.fragments.getById(
                    this.searchText,
                );
                if (
                    fragmentData &&
                    fragmentData.path.indexOf(localSearch.path) == 0
                ) {
                    const fragment = new Fragment(fragmentData);
                    Store.fragments.data.set([new FragmentStore(fragment)]);
                }
            } else {
                const cursor = await this.#aem.sites.cf.fragments.search(
                    localSearch,
                    null,
                    this.#abortController,
                );
                for await (const result of cursor) {
                    Store.fragments.data.update((prev) => [
                        ...prev,
                        ...result.map((item) => {
                            const fragment = new Fragment(item);
                            return new FragmentStore(fragment);
                        }),
                    ]);
                }
            }

            this.#abortController = null;

            await this.addToCache(
                Store.fragments.data.get().map((item) => item.get()),
            );
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error(`Could not fetch fragments: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Could not load fragments.',
            });
        }

        Store.fragments.loading.set(false);
    }

    async loadRecentlyUpdatedFragments(path, limit) {
        if (this.#abortController) this.#abortController.abort();
        this.#abortController = new AbortController();

        const cursor = await this.#aem.sites.cf.fragments.search(
            {
                sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                path: `/content/dam/mas/${path}`,
                // tags: ['mas:status/DEMO']
            },
            limit,
            this.#abortController,
        );
        const result = await cursor.next();
        Store.fragments.data.set(
            result.value.map((item) => {
                const fragment = new Fragment(item);
                return new FragmentStore(fragment);
            }),
        );

        this.#abortController = null;

        await this.addToCache(
            Store.fragments.data.get().map((item) => item.get()),
        );
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
        try {
            Events.showToast.emit({
                variant: 'info',
                content: 'Saving fragment...',
            });

            const fragmentStore = Store.fragments.inEdit.get();
            const fragment = fragmentStore.get();
            let updatedFragment =
                await this.#aem.sites.cf.fragments.save(fragment);
            if (!updatedFragment) throw new Error('Invalid fragment.');
            fragmentStore.refreshFrom(updatedFragment);

            Events.showToast.emit({
                variant: 'positive',
                content: 'Fragment successfully saved.',
            });

            return true;
        } catch (error) {
            console.error(`Failed to save fragment: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Failed to save fragment.',
            });
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
            Store.fragments.data.update((prev) => [...prev, newFragmentStore]);
            editFragment(newFragmentStore);

            Events.fragmentAdded.emit(newFragment.id);
            Events.showToast.emit({
                variant: 'positive',
                content: 'Fragment successfully copied.',
            });

            return true;
        } catch (error) {
            console.error(`Failed to copy fragment: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Failed to copy fragment.',
            });
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

            Events.showToast.emit({
                variant: 'positive',
                content: 'Fragment successfully published.',
            });

            return true;
        } catch (error) {
            console.error(`Failed to publish fragment: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Failed to publish fragment.',
            });
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

            Store.fragments.data.update((prev) => {
                var result = [...prev];
                const index = result.indexOf(fragment);
                result.splice(index, 1);
                return result;
            });
            Store.fragments.inEdit.set(null);

            Events.showToast.emit({
                variant: 'positive',
                content: 'Fragment successfully deleted.',
            });

            return true;
        } catch (error) {
            console.error(`Failed to delete fragment: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Failed to delete fragment.',
            });
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

customElements.define('mas-fetcher', MasFetcher);
