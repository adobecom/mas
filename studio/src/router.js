import { PAGE_NAMES, WCS_ENV_PROD } from './constants.js';
import Store from './store.js';
import { debounce } from './utils.js';

export class Router extends EventTarget {
    constructor(location = window.location) {
        super();
        this.location = location;
        this.updateHistory = debounce(this.updateHistory.bind(this), 50);
        this.linkedStores = [];
    }

    updateHistory() {
        // Sort the parameters by name
        const sortedParams = new URLSearchParams();
        Array.from(this.currentParams.entries())
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .forEach(([key, value]) => sortedParams.append(key, value));
        const newHash = sortedParams.toString();
        if (newHash !== this.location.hash) {
            this.location.hash = newHash;
            this.dispatchEvent(new Event('change'));
        }
        this.currentParams = undefined;
    }

    /**
     * Navigation function to change the current page
     * @param {string} value - The page to navigate to
     * @returns {Function} A function that when called will navigate to the page
     */
    navigateToPage(value) {
        return async () => {
            const editorPanel = document.querySelector('editor-panel');
            const confirmed =
                !Store.editor.hasChanges ||
                (await editorPanel.promptDiscardChanges());
            if (confirmed) {
                Store.fragments.inEdit.set();
                Store.fragments.list.data.set([]);
                Store.search.set((prev) => ({ ...prev, query: undefined }));
                Store.filters.set((prev) => ({ ...prev, tags: undefined }));
                Store.page.set(value);
            }
        };
    }

    /**
     * Syncs a store with the current URL hash parameters
     * @param {ReactiveStore} store - The store to sync
     * @param {any} currentValue - The current value of the store
     * @param {boolean} isObject - Whether the store value is an object
     * @param {string[]} keysArray - The keys to sync
     * @param {any} defaultValue - The default value to use if the key is not in the hash
     * @returns {boolean} Whether the store was updated
     */
    syncStoreFromHash(
        store,
        currentValue,
        isObject,
        keysArray,
        defaultValue = undefined,
    ) {
        this.currentParams ??= new URLSearchParams(this.location.hash.slice(1));
        let newValue = isObject ? structuredClone(currentValue) : currentValue;
        for (const key of keysArray) {
            if (this.currentParams.has(key)) {
                let value = this.currentParams.get(key);
                let parsedValue;
                try {
                    parsedValue = JSON.parse(value);
                } catch (e) {
                    // Not JSON, use as is
                    parsedValue = value;
                }
                if (isObject) {
                    newValue[key] = parsedValue;
                } else {
                    newValue = parsedValue;
                }
            } else {
                if (isObject) {
                    newValue[key] = defaultValue?.[key];
                } else {
                    newValue = defaultValue;
                }
            }
        }
        if (JSON.stringify(store.value) !== JSON.stringify(newValue)) {
            store.set(newValue);
            this.dispatchEvent(new Event('change'));
        }
    }

    /**
     * Links a store to the URL hash
     * @param {ReactiveStore} store - The store to link
     * @param {string|string[]} keys - The key(s) to link
     * @param {any} defaultValue - The default value to use if the key is not in the hash
     */
    linkStoreToHash(store, keys, defaultValue) {
        store.set(defaultValue);
        const keysArray = Array.isArray(keys) ? keys : [keys];

        // Store the link configuration for later use with popstate
        this.linkedStores.push({ store, keysArray, defaultValue });

        const newValue = store.get();
        const isObject = typeof newValue === 'object' && newValue !== null;
        // Initial sync from hash to store
        this.syncStoreFromHash(
            store,
            newValue,
            isObject,
            keysArray,
            defaultValue,
        );

        const self = this;
        store.subscribe((value) => {
            self.currentParams ??= new URLSearchParams(
                self.location.hash.slice(1),
            );

            for (const key of keysArray) {
                const storeValue = isObject ? value?.[key] : value;

                if (Array.isArray(storeValue) && storeValue.length === 0) {
                    if (self.currentParams.has(key)) {
                        self.currentParams.delete(key);
                    }
                    continue;
                }

                if (storeValue === undefined) {
                    if (self.currentParams.has(key)) {
                        self.currentParams.delete(key);
                    }
                    continue;
                }

                const stringValue =
                    typeof storeValue === 'object'
                        ? JSON.stringify(storeValue)
                        : String(storeValue);

                if (self.currentParams.get(key) !== stringValue) {
                    self.currentParams.set(key, stringValue);
                }

                const defaultValueToCompare = isObject
                    ? defaultValue?.[key]
                    : defaultValue;
                if (self.currentParams.get(key) === defaultValueToCompare) {
                    self.currentParams.delete(key);
                }
            }
            for (const [key, value] of self.currentParams.entries()) {
                if (!value || value === '') {
                    self.currentParams.delete(key);
                }
            }
            if (self.currentParams.toString() === self.location.hash.slice(1)) {
                return;
            }
            self.updateHistory();
        });
    }

    start() {
        this.currentParams = new URLSearchParams(this.location.hash.slice(1));
        this.linkStoreToHash(Store.page, 'page', PAGE_NAMES.WELCOME);
        this.linkStoreToHash(Store.search, ['path', 'query'], {});
        this.linkStoreToHash(Store.filters, ['locale', 'tags'], {
            locale: 'en_US',
        });
        this.linkStoreToHash(Store.commerceEnv, 'commerce.env', WCS_ENV_PROD);
        if (Store.search.value.query) {
            Store.page.set(PAGE_NAMES.CONTENT);
        }
        window.addEventListener('hashchange', () => {
            /* fix hash when missing params(e.g: manual edit) */
            this.currentParams = new URLSearchParams(
                this.location.hash.slice(1),
            );
            if (this.currentParams.has('query')) {
                Store.page.set(PAGE_NAMES.CONTENT);
            }
            const page = this.currentParams.get('page');
            if (!page && Store.page.value) {
                this.currentParams.set('page', Store.page.value);
            }
            const path = this.currentParams.get('path');
            if (!path && Store.search.value.path) {
                this.currentParams.set('path', Store.search.value.path);
            }
            // Sync all linked stores from the current hash
            this.linkedStores.forEach(({ store, keysArray, defaultValue }) => {
                const currentValue = store.get();
                const isObject =
                    typeof currentValue === 'object' && currentValue !== null;
                this.syncStoreFromHash(
                    store,
                    currentValue,
                    isObject,
                    keysArray,
                    defaultValue,
                );
            });
        });
    }
}

export default new Router();
