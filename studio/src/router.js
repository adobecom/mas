import { PAGE_NAMES, SORT_COLUMNS, WCS_LANDSCAPE_PUBLISHED, COLLECTION_MODEL_PATH } from './constants.js';
import Store from './store.js';
import { debounce } from './utils.js';

export class Router extends EventTarget {
    constructor(location = window.location) {
        super();
        this.location = location;
        this.updateHistory = debounce(this.updateHistory.bind(this), 50);
        this.linkedStores = [];
        this.isNavigating = false;
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
            if (Store.page.value === value) return;
            this.isNavigating = true;
            try {
                const fragmentEditor = document.querySelector('mas-fragment-editor');
                const isLoading = fragmentEditor?.isLoading ?? false;
                const confirmed =
                    isLoading ||
                    !Store.editor.hasChanges ||
                    (fragmentEditor ? await fragmentEditor.promptDiscardChanges() : true);
                if (confirmed) {
                    if (Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR && value !== PAGE_NAMES.FRAGMENT_EDITOR) {
                        Store.fragmentEditor.fragmentId.set(null);
                    }
                    Store.fragments.inEdit.set();
                    if (value !== PAGE_NAMES.CONTENT) {
                        Store.fragments.list.data.set([]);
                        Store.search.set((prev) => ({ ...prev, query: undefined }));
                        Store.filters.set((prev) => ({ ...prev, tags: undefined }));
                    }
                    Store.viewMode.set('default');
                    Store.page.set(value);
                }
            } finally {
                this.isNavigating = false;
            }
        };
    }

    /**
     * Navigate to the fragment editor
     * @param {string} fragmentId - The fragment ID to edit
     * @param {Object} options - Navigation options
     * @param {string} options.locale - Optional locale to set before navigation
     */
    async navigateToFragmentEditor(fragmentId, options = {}) {
        if (!fragmentId) {
            console.error('Fragment ID is required for navigation');
            return;
        }

        const { locale } = options;

        this.isNavigating = true;
        try {
            // Set locale BEFORE setting page to include it in the first URL change
            if (locale && locale !== Store.filters.value.locale) {
                Store.filters.set((prev) => ({ ...prev, locale }));
            }

            // Check if this is a collection to use editor-panel instead
            const fragmentList = Store.fragments.list.data.get();
            const fragmentStore = fragmentList?.find((f) => f.get()?.id === fragmentId);

            if (fragmentStore?.get()?.model?.path === COLLECTION_MODEL_PATH) {
                // Use editor-panel for collections
                const editorPanel = document.querySelector('editor-panel');
                if (editorPanel) {
                    if (Store.editor.hasChanges) {
                        const confirmed = await editorPanel.promptDiscardChanges();
                        if (!confirmed) return;
                    }
                    await editorPanel.editFragment(fragmentStore);
                    Store.viewMode.set('editing');
                    return;
                }
            }

            // Default: use full-page fragment editor for regular cards
            if (Store.editor.hasChanges) {
                const fragmentEditor = document.querySelector('mas-fragment-editor');
                const confirmed = fragmentEditor ? await fragmentEditor.promptDiscardChanges() : true;
                if (!confirmed) return;
            }

            Store.fragments.inEdit.set();
            Store.fragmentEditor.fragmentId.set(fragmentId);
            Store.search.set((prev) => ({ ...prev, query: undefined }));
            Store.page.set(PAGE_NAMES.FRAGMENT_EDITOR);
            Store.viewMode.set('editing');
        } finally {
            this.isNavigating = false;
        }
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
    syncStoreFromHash(store, currentValue, isObject, keysArray, defaultValue = undefined) {
        this.currentParams ??= new URLSearchParams(this.location.hash.slice(1));
        let newValue = isObject ? structuredClone(currentValue) : currentValue;
        const hashUpdated = false;

        for (const key of keysArray) {
            if (this.currentParams.has(key)) {
                const value = this.currentParams.get(key);
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
                const defaultVal = defaultValueGetter(defaultValue)();
                if (isObject) {
                    newValue[key] = defaultVal?.[key];
                } else {
                    newValue = defaultVal;
                }
            }
        }

        // Update hash if invalid parameters were removed
        if (hashUpdated) {
            this.updateHistory();
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
        const getDefaultValue = defaultValueGetter(defaultValue);
        store.set(getDefaultValue());
        const keysArray = Array.isArray(keys) ? keys : [keys];

        // Store the link configuration for later use with popstate
        this.linkedStores.push({
            store,
            keysArray,
            defaultValue,
        });

        const newValue = store.get();
        const isObject = typeof newValue === 'object' && newValue !== null;
        // Initial sync from hash to store
        this.syncStoreFromHash(store, newValue, isObject, keysArray, defaultValue);

        const self = this;
        store.subscribe((value) => {
            self.currentParams ??= new URLSearchParams(self.location.hash.slice(1));

            for (const key of keysArray) {
                const storeValue = isObject ? value?.[key] : value;

                if (Array.isArray(storeValue) && storeValue.length === 0) {
                    if (self.currentParams.has(key)) {
                        self.currentParams.delete(key);
                    }
                    continue;
                }

                if (storeValue === undefined || storeValue === null) {
                    if (self.currentParams.has(key)) {
                        self.currentParams.delete(key);
                    }
                    continue;
                }

                const stringValue = typeof storeValue === 'object' ? JSON.stringify(storeValue) : String(storeValue);

                if (self.currentParams.get(key) !== stringValue) {
                    self.currentParams.set(key, stringValue);
                }

                const defaultValue = getDefaultValue();
                const defaultValueToCompare = isObject ? defaultValue?.[key] : defaultValue;
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
        this.previousHash = this.location.hash;
        this.linkStoreToHash(Store.page, 'page', PAGE_NAMES.WELCOME);
        this.linkStoreToHash(Store.search, ['path', 'query'], {});
        this.linkStoreToHash(Store.filters, ['locale', 'tags'], {
            locale: 'en_US',
        });
        this.linkStoreToHash(Store.sort, ['sortBy', 'sortDirection'], getSortDefaultValue);
        this.linkStoreToHash(Store.placeholders.search, 'search');
        this.linkStoreToHash(Store.landscape, 'commerce.landscape', WCS_LANDSCAPE_PUBLISHED);
        this.linkStoreToHash(Store.version.fragmentId, 'fragment');
        this.linkStoreToHash(Store.fragmentEditor.fragmentId, 'fragmentId');
        this.linkStoreToHash(Store.promotions.promotionId, 'promotionId');
        if (Store.search.value.query) {
            Store.page.set(PAGE_NAMES.CONTENT);
        }

        if (this.currentParams.get('page') === PAGE_NAMES.FRAGMENT_EDITOR) {
            Store.viewMode.set('editing');
            if (this.currentParams.has('query')) {
                this.currentParams.delete('query');
                Store.search.set((prev) => ({ ...prev, query: undefined }));
                this.updateHistory();
            }
        }

        window.addEventListener('hashchange', async (event) => {
            if (!this.isNavigating) {
                const fragmentEditor = document.querySelector('mas-fragment-editor');
                const isLoading = fragmentEditor?.isLoading ?? false;
                const shouldCheckUnsavedChanges =
                    !isLoading && Store.editor.hasChanges && Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR;

                if (shouldCheckUnsavedChanges) {
                    const confirmed = fragmentEditor ? await fragmentEditor.promptDiscardChanges() : true;
                    if (!confirmed) {
                        event.preventDefault();
                        this.location.hash = this.previousHash;
                        return;
                    }
                }
            }

            /* fix hash when missing params(e.g: manual edit) */
            this.currentParams = new URLSearchParams(this.location.hash.slice(1));
            if (this.currentParams.has('query') && !this.currentParams.has('fragmentId')) {
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
            const locale = this.currentParams.get('locale');
            if (!locale && Store.filters.value.locale && Store.filters.value.locale !== 'en_US') {
                this.currentParams.set('locale', Store.filters.value.locale);
            }

            if (page === PAGE_NAMES.FRAGMENT_EDITOR) {
                Store.viewMode.set('editing');
                if (this.currentParams.has('query')) {
                    this.currentParams.delete('query');
                    Store.search.set((prev) => ({ ...prev, query: undefined }));
                    this.updateHistory();
                }
            } else if (Store.viewMode.value === 'editing') {
                Store.viewMode.set('default');
            }

            // Sync all linked stores from the current hash
            this.linkedStores.forEach(({ store, keysArray, defaultValue }) => {
                const currentValue = store.get();
                const isObject = typeof currentValue === 'object' && currentValue !== null;
                this.syncStoreFromHash(store, currentValue, isObject, keysArray, defaultValue);
            });

            this.previousHash = this.location.hash;
        });

        window.addEventListener('beforeunload', (event) => {
            if (Store.editor.hasChanges && Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR) {
                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        });
    }
}

export default new Router();

// Default value handling

function defaultValueGetter(defaultValue) {
    if (!defaultValue) return () => undefined;
    if (typeof defaultValue === 'function') return defaultValue;
    return () => defaultValue;
}

function getSortDefaultValue() {
    const page = Store.page.get();
    const defaultSortBy = SORT_COLUMNS[page]?.[0];
    return { sortBy: defaultSortBy, sortDirection: 'asc' };
}
