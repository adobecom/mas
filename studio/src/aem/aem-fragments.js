import { LitElement, nothing } from 'lit';
import { filterByTags, AEM } from './aem.js';
import { Fragment } from './fragment.js';
import {
    EVENT_CHANGE,
    EVENT_LOAD,
    EVENT_LOAD_END,
    EVENT_LOAD_START,
} from '../events.js';

/** aem-fragment cache */
let aemFragmentCache;

const ROOT = '/content/dam/mas';

const getDamPath = (path) => {
    if (!path) return ROOT;
    if (path.startsWith(ROOT)) return path;
    return ROOT + '/' + path;
};

const getTopFolder = (path) => {
    return path?.substring(ROOT.length + 1)?.split('/')[0];
};

class AemFragments extends LitElement {
    static get properties() {
        return {
            bucket: { type: String },
            baseUrl: { type: String, attribute: 'base-url' },
            path: { type: String, attribute: true, reflect: true },
            searchText: { type: String, attribute: 'search' },
            tags: {
                type: Array,
                attribute: 'tags',
                converter: {
                    fromAttribute(value) {
                        return value
                            ? value.split(',').map((tag) => tag.trim())
                            : [];
                    },
                    toAttribute(value) {
                        return value.join(',');
                    },
                },
            },
            fragment: { type: Object },
        };
    }

    createRenderRoot() {
        return this;
    }

    /**
     * @type {AEM}
     */
    aem;

    /**
     *
     */
    #currentFragments = [];

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
        this.aem = new AEM(this.bucket, this.baseUrl);
    }

    async selectFragment(x, y, fragment) {
        const latest = await this.aem.sites.cf.fragments.getById(fragment.id);
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
        const { children } = await this.aem.folders.list(ROOT);
        const ignore = window.localStorage.getItem('ignore_folders') || [
            'images',
        ];
        const topFolders = children
            .map((folder) => folder.name)
            .filter((child) => !ignore.includes(child));

        // Dispatch a custom event with the top folders
        this.dispatchEvent(
            new CustomEvent('top-folders-loaded', {
                detail: { topFolders },
                bubbles: true,
                composed: true,
            }),
        );

        return topFolders;
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
        this.#currentFragments = [];
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
                this.#currentFragments.push(...fragments);
            }
            await this.addToCache(fragments);
            this.dispatchEvent(new CustomEvent(EVENT_LOAD));
        }
        this.#loading = false;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_END, { bubbles: true }));
    }

    update(changedProperties) {
        super.update(changedProperties);
        if (changedProperties.has('tags')) {
            this.searchFragments();
        }
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
        let fragmentData = await this.aem.sites.cf.fragments.getById(
            this.searchText,
        );
        if (this.tags) {
            if (!filterByTags(this.tags)(fragmentData)) {
                fragmentData = null;
            }
        }
        if (
            fragmentData &&
            fragmentData.path.indexOf(getDamPath(this.path)) == 0
        ) {
            const fragment = new Fragment(fragmentData, this);
            this.#searchResult = [fragment];
            await this.addToCache([fragment]);
        }
        this.#loading = false;
        this.dispatchEvent(new CustomEvent(EVENT_LOAD), { bubbles: true });
        this.dispatchEvent(new CustomEvent(EVENT_LOAD_END, { bubbles: true }));
    }

    isFragmentId(str) {
        return this.isUUID(str);
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
        if (this.tags) {
            this.#search.tags = this.tags;
        }
        if (this.isFragmentId(this.searchText)) {
            await this.searchFragmentByUUID();
        } else {
            const cursor = await this.aem.sites.cf.fragments.search(
                this.#search,
            );
            await this.processFragments(cursor, search);
        }
    }

    async saveFragment() {
        let fragment = await this.aem.sites.cf.fragments.save(this.fragment);
        if (!fragment) throw new Error('Failed to save fragment');
        aemFragmentCache.get(fragment.id)?.refreshFrom(fragment, true);
    }

    async copyFragment() {
        const oldFragment = this.fragment;
        const fragment = await this.aem.sites.cf.fragments.copy(oldFragment);
        const newFragment = new Fragment(fragment, this);
        aemFragmentCache?.add(newFragment);
        if (this.searchText) {
            this.#searchResult.push(newFragment);
        } else {
            this.#currentFragments?.push(newFragment);
        }
        this.setFragment(newFragment);
        this.dispatchEvent(new CustomEvent(EVENT_CHANGE, { bubbles: true }));
    }

    async publishFragment() {
        await this.aem.sites.cf.fragments.publish(this.fragment);
    }

    async deleteFragment() {
        await this.aem.sites.cf.fragments.delete(this.fragment);
        if (this.searchText) {
            const fragmentIndex = this.#searchResult.indexOf(this.fragment);
            this.#searchResult.splice(fragmentIndex, 1);
        } else {
            this.#currentFragments = this.#currentFragments.filter(
                (f) => f.id !== this.fragment.id,
            );
        }
        this.setFragment(null);
        this.dispatchEvent(new CustomEvent(EVENT_CHANGE, { bubbles: true }));
    }

    clearSelection() {
        this.fragments.forEach((fragment) => fragment.toggleSelection(false));
    }

    get fragments() {
        return (
            (this.searchText ? this.#searchResult : this.#currentFragments) ??
            []
        );
    }

    get selectedFragments() {
        return this.fragments.filter((fragment) => fragment.selected);
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

export { AemFragments, getDamPath, getTopFolder };
