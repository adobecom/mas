import { LitElement, nothing } from 'lit';
import { AEM } from './aem.js';
import { Folder } from './folder.js';
import { Fragment } from './fragment.js';
import { EVENT_LOAD, EVENT_LOAD_END, EVENT_LOAD_START } from '../events.js';

/** aem-fragment cache */
let aemFragmentCache;

const ROOT = '/content/dam/mas';

const getDamPath = (path) => {
    if (!path) return ROOT;
    if (path.startsWith(ROOT)) return path;
    return ROOT + '/' + path;
};

class AemFragments extends LitElement {
    static get properties() {
        return {
            bucket: { type: String },
            baseUrl: { type: String, attribute: 'base-url' },
            path: { type: String, attribute: true, reflect: true },
            searchText: { type: String, attribute: 'search' },
            fragment: { type: Object },
        };
    }

    createRenderRoot() {
        return this;
    }

    /**
     * @type {AEM}
     */
    #aem;

    /**
     * @type {Folder}
     */
    #rootFolder;

    /**
     * @type {Folder}
     */
    currentFolder;

    #folders = new Map();

    #loading = true;

    /**
     * Fragments in the search result.
     */
    #searchResult;

    #search;

    #cursor; // last active cursor being processed

    connectedCallback() {
        super.connectedCallback();
        if (!(this.bucket || this.baseUrl))
            throw new Error(
                'Either the bucket or baseUrl attribute is required.',
            );
        this.#aem = new AEM(this.bucket, this.baseUrl);
        this.#rootFolder = new Folder(getDamPath());
        this.style.display = 'none';
    }

    /**
     * @param {Folder} folder
     */
    async openFolder(folder) {
        this.#loading = true;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_START));
        if (typeof folder === 'string') {
            folder = getDamPath(folder);
            this.currentFolder = this.#folders.get(folder);
            if (!this.currentFolder) {
                this.currentFolder = new Folder(folder);
                this.#folders.set(folder, this.currentFolder);
            }
        } else {
            this.currentFolder = folder;
        }

        const { self, children } = await this.#aem.folders.list(
            this.currentFolder.path,
        );
        this.currentFolder.open(self, children);
    }

    async selectFragment(x, y, fragment) {
        const latest = await this.#aem.sites.cf.fragments.getById(fragment.id);
        Object.assign(fragment, latest);
        fragment.refreshFrom(latest);
        this.setFragment(fragment);
        this.dispatchEvent(
            new CustomEvent('select-fragment', {
                detail: { x, y, fragment },
                bubbles: true,
                composed: true,
            }),
        );
    }

    setFragment(fragment) {
        this.fragment = fragment;
    }

    async getTopFolders() {
        const { children } = await this.#aem.folders.list(ROOT);
        const ignore = window.localStorage.getItem('ignore_folders') || [
            'images',
        ];
        return children
            .map((folder) => folder.name)
            .filter((child) => !ignore.includes(child));
    }

    async addToCache(fragments) {
        if (!aemFragmentCache) {
            await customElements.whenDefined('aem-fragment').then(() => {
                aemFragmentCache = document.createElement('aem-fragment').cache;
            });
        }
        aemFragmentCache.add(...fragments);
    }

    async processFragments(cursor, search = false) {
        if (this.#cursor) {
            this.#cursor.cancelled = true;
        }
        this.#cursor = cursor;
        this.#loading = true;
        this.#searchResult = [];
        this.currentFolder?.clear();
        this.dispatchEvent(
            new CustomEvent(EVENT_LOAD_START, {
                bubbles: true,
            }),
        );
        for await (const result of cursor) {
            if (cursor.cancelled) break;
            this.#loading = true;
            const fragments = result.map((item) => new Fragment(item, this));
            if (search) {
                this.#searchResult = [...this.#searchResult, ...fragments];
            } else {
                this.currentFolder.add(...fragments);
            }
            this.addToCache(fragments);
            this.dispatchEvent(new CustomEvent(EVENT_LOAD));
        }
        this.#loading = false;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_END, { bubbles: true }));
    }

    isUUID(str) {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }
    /**
     * Searches for a content fragment by its UUID.
     */
    async searchFragmentByUUID() {
        this.#loading = true;
        this.#cursor = null;
        this.#searchResult = [];
        this.dispatchEvent(
            new CustomEvent(EVENT_LOAD_START, {
                bubbles: true,
            }),
        );
        const fragment = await this.#aem.sites.cf.fragments.getById(
            this.searchText,
        );
        if (!fragment || fragment.path.indexOf(getDamPath(this.path)) < 0) {
            this.#searchResult = [];
        } else {
            this.#searchResult = [fragment];
            this.addToCache([fragment]);
        }
        this.#loading = false;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD), { bubbles: true });
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_END, { bubbles: true }));
    }

    /**
     * Searches for content fragments based on the provided query.
     *
     * @param {Object} search - The search parameters.
     * @param {string} search.variant - The variant to filter by.
     */
    async searchFragments() {
        this.#search = {
            path: getDamPath(this.path),
        };

        let search = false;
        if (this.searchText) {
            this.#search.query = this.searchText;
            search = true;
        }
        const isFragmentId = this.isUUID(this.searchText);
        if (isFragmentId) {
            await this.searchFragmentByUUID();
        } else {
            const cursor = await this.#aem.sites.cf.fragments.search(
                this.#search,
            );
            this.processFragments(cursor, search);
        }
    }

    async saveFragment() {
        let fragment = await this.#aem.sites.cf.fragments.save(this.fragment);
        if (!fragment) throw new Error('Failed to save fragment');
        aemFragmentCache.get(fragment.id)?.refreshFrom(fragment);
    }

    async copyFragment() {
        const oldFragment = this.fragment;
        this.setFragment(null);
        const fragment = await this.#aem.sites.cf.fragments.copy(oldFragment);
        aemFragmentCache?.add(fragment);
        const newFragment = new Fragment(fragment);
        this.#search.addToResult(newFragment, oldFragment);
        this.setFragment(newFragment);
    }

    async publishFragment() {
        await this.#aem.sites.cf.fragments.publish(this.fragment);
    }

    async deleteFragment() {
        await this.#aem.sites.cf.fragments.delete(this.fragment);
        this.#search.removeFromResult(this.fragment);
        this.setFragment(null);
    }

    clearSelection() {
        this.fragments.forEach((fragment) => fragment.toggleSelection(false));
    }

    get fragments() {
        return (
            (this.searchText
                ? this.#searchResult
                : this.currentFolder?.fragments) ?? []
        );
    }

    get selectedFragments() {
        return this.fragments.filter((fragment) => fragment.selected);
    }

    get folders() {
        return this.currentFolder?.folders ?? [];
    }

    get search() {
        return { ...this.#search };
    }

    get loading() {
        return this.#loading;
    }

    render() {
        return nothing;
    }
}

customElements.define('aem-fragments', AemFragments);

export { AemFragments, getDamPath };
