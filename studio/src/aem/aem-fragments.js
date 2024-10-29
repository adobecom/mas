import { LitElement, nothing } from 'lit';
import { AEM } from './aem.js';
import { Folder } from './folder.js';
import { Fragment } from './fragment.js';
import { EVENT_LOAD, EVENT_LOAD_END, EVENT_LOAD_START } from '../events.js';

/** aem-fragment cache */
let aemFragmentCache;

class AemFragments extends LitElement {
    static get properties() {
        return {
            bucket: { type: String },
            baseUrl: { type: String, attribute: 'base-url' },
            root: { type: String, attribute: true, reflect: true },
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
        if (!this.root) throw new Error('root attribute is required');
        if (!(this.bucket || this.baseUrl))
            throw new Error(
                'Either the bucket or baseUrl attribute is required.',
            );
        this.#aem = new AEM(this.bucket, this.baseUrl);
        this.#rootFolder = new Folder(this.root);
        this.style.display = 'none';
    }

    async sendSearch() {
        if (this.searchText) await this.searchFragments();
        else {
            await this.openFolder(this.path || this.root);
            await this.listFragments();
        }
    }

    /**
     * @param {Folder} folder
     */
    async openFolder(folder) {
        this.#loading = true;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_START));
        if (typeof folder === 'string') {
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
            if (!aemFragmentCache) {
                await customElements.whenDefined('aem-fragment').then(() => {
                    aemFragmentCache =
                        document.createElement('aem-fragment').cache;
                });
            }
            aemFragmentCache.add(...fragments);
            this.dispatchEvent(new CustomEvent(EVENT_LOAD));
        }
        this.#loading = false;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_END, { bubbles: true }));
    }

    async listFragments() {
        this.#search = {
            path: this.path || this.currentFolder.path || this.#rootFolder.path,
        };
        const cursor = this.#aem.sites.cf.fragments.search(this.#search);
        this.processFragments(cursor);
    }

    /**
     * Searches for content fragments based on the provided query parameters.
     *
     * @param {Object} search - The search parameters.
     * @param {string} search.variant - The variant to filter by.
     */
    async searchFragments() {
        this.#search = {
            query: this.searchText,
            path: this.#rootFolder.path,
        };
        const cursor = await this.#aem.sites.cf.fragments.search(this.#search);
        this.processFragments(cursor, true);
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

export { AemFragments };
