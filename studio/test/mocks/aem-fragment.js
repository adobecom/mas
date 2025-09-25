/* TODO not sure mocking it like this is the best approach */

class FragmentCache {
    #fragmentCache = new Map();
    #fetchInfos = new Map();
    #promises = new Map();

    clear() {
        this.#fragmentCache.clear();
        this.#fetchInfos.clear();
        this.#promises.clear();
    }

    /**
     * Add fragment to cache
     * @param {Object} fragment fragment object.
     */
    add(fragment, references = true) {
        if (this.has(fragment.id)) return;
        if (this.has(fragment.fields?.originalId)) return;

        this.#fragmentCache.set(fragment.id, fragment);
        if (fragment.fields?.originalId) {
            this.#fragmentCache.set(fragment.fields.originalId, fragment);
        }
        if (this.#promises.has(fragment.id)) {
            const [, resolve] = this.#promises.get(fragment.id);
            resolve();
        }
        if (this.#promises.has(fragment.fields?.originalId)) {
            const [, resolve] = this.#promises.get(fragment.fields?.originalId);
            resolve();
        }

        if (!references || typeof fragment.references !== 'object' || Array.isArray(fragment.references)) return;

        for (const key in fragment.references) {
            const { type, value } = fragment.references[key];
            if (type === 'content-fragment') {
                value.settings = {
                    ...fragment?.settings,
                    ...value.settings,
                };
                value.placeholders = {
                    ...fragment?.placeholders,
                    ...value.placeholders,
                };
                value.dictionary = {
                    ...fragment?.dictionary,
                    ...value.dictionary,
                };
                value.priceLiterals = {
                    ...fragment?.priceLiterals,
                    ...value.priceLiterals,
                };
                this.add(value, fragment);
            }
        }
    }

    has(fragmentId) {
        return this.#fragmentCache.has(fragmentId);
    }

    entries() {
        return this.#fragmentCache.entries();
    }

    get(key) {
        return this.#fragmentCache.get(key);
    }

    getAsPromise(key) {
        let [promise] = this.#promises.get(key) ?? [];
        if (promise) {
            return promise;
        }
        let resolveFn;
        promise = new Promise((resolve) => {
            resolveFn = resolve;
            if (this.has(key)) {
                resolve();
            }
        });
        this.#promises.set(key, [promise, resolveFn]);
        return promise;
    }

    getFetchInfo(fragmentId) {
        let fetchInfo = this.#fetchInfos.get(fragmentId);
        if (!fetchInfo) {
            fetchInfo = {
                url: null,
                retryCount: 0,
                stale: false,
                measure: null,
                status: null,
            };
            this.#fetchInfos.set(fragmentId, fetchInfo);
        }
        return fetchInfo;
    }

    remove(fragmentId) {
        this.#fragmentCache.delete(fragmentId);
        this.#fetchInfos.delete(fragmentId);
        this.#promises.delete(fragmentId);
    }
}

const cache = new FragmentCache();

export class AemFragment extends HTMLElement {
    cache = cache;
    static cache = cache;
}

customElements.define('aem-fragment', AemFragment);
