import Store from './store.js';
import { PAGE_NAMES } from './constants.js';
import { getHashParam } from './utils.js';

const originalUrl = window.location.href;

/**
 * Determines and returns the initial page based on URL parameters
 * @returns {string} The page name to initialize with
 */
export function determineInitialPage() {
    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);
    const pageFromHash = hashParams.get('page');
    const pathFromHash = hashParams.get('path');
    const hasQuery = Boolean(getHashParam('query'));
    return pageFromHash || (hasQuery ? PAGE_NAMES.CONTENT : PAGE_NAMES.WELCOME);
}

/**
 * Initialize all store values based on URL parameters
 * This is the central function for URL-based store initialization
 */
export function initializeStoreFromUrl() {
    // Initialize page parameter
    const initialPage = determineInitialPage();
    Store.page.set(initialPage);
    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);
    const pathFromHash = hashParams.get('path');
    if (pathFromHash && Store.search) {
        Store.search.set((prev) => ({ ...prev, path: pathFromHash }));
    }
    
    initializeFiltersFromUrl();
}

/**
 * Navigation function to change the current page
 * @param {string} value - The page to navigate to
 * @returns {Function} A function that when called will navigate to the page
 */
export function navigateToPage(value) {
    return async () => {
        const editorPanel = document.querySelector('editor-panel');
        const confirmed =
            !Store.editor.hasChanges ||
            (await editorPanel.promptDiscardChanges());
        if (confirmed) {
            Store.fragments.inEdit.set();
            Store.page.set(value);
            
            // First remove page from search params if it exists
            const url = new URL(window.location);
            if (url.searchParams.has('page')) {
                url.searchParams.delete('page');
                window.history.replaceState({}, '', url.toString());
            }
            
            const currentHash = window.location.hash.slice(1);
            const hashParams = new URLSearchParams(currentHash);
            hashParams.delete('page');
            const orderedParams = new URLSearchParams();
            orderedParams.set('page', value);
            const pathValue = hashParams.get('path');
            if (pathValue) {
                hashParams.delete('path');
                orderedParams.set('path', pathValue);
            }
            
            for (const [key, val] of hashParams.entries()) {
                orderedParams.set(key, val);
            }
            
            window.location.hash = orderedParams.toString();
        }
    };
}

/**
 * Links a store to the URL hash
 * @param {ReactiveStore} store - The store to link
 * @param {string|string[]} keys - The key(s) to link
 * @param {any} defaultValue - The default value to use if the key is not in the hash
 */
export function linkStoreToHash(store, keys, defaultValue) {
    if (!store) return;
    const keysArray = Array.isArray(keys) ? keys : [keys];

    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);

    let shouldUpdateStore = false;
    const updates = {};

    for (const key of keysArray) {
        if (params.has(key)) {
            let value = params.get(key);
            try {
                value = JSON.parse(value);
            } catch (e) {
                // Not JSON, use as is
            }
            updates[key] = value;
            shouldUpdateStore = true;
        } else if (defaultValue !== undefined) {
            const defaultForKey = Array.isArray(defaultValue)
                ? defaultValue
                : typeof defaultValue === 'object' && defaultValue !== null
                  ? defaultValue[key]
                  : defaultValue;

            if (defaultForKey !== undefined) {
                updates[key] = defaultForKey;
                shouldUpdateStore = true;
            }
        }
    }

    if (shouldUpdateStore) {
        store.set((prev) => ({ ...prev, ...updates }));
    }

    store.subscribe((value, oldValue) => {
        const currentHash = window.location.hash.slice(1);
        const currentParams = new URLSearchParams(currentHash);
        let hasChanges = false;

        for (const key of keysArray) {
            const storeValue = value[key];
            if (Array.isArray(storeValue) && storeValue.length === 0) {
                if (currentParams.has(key)) {
                    currentParams.delete(key);
                    hasChanges = true;
                }
                continue;
            }

            if (storeValue === undefined) {
                if (currentParams.has(key)) {
                    currentParams.delete(key);
                    hasChanges = true;
                }
                continue;
            }

            const stringValue =
                typeof storeValue === 'object'
                    ? JSON.stringify(storeValue)
                    : String(storeValue);

            if (currentParams.get(key) !== stringValue) {
                currentParams.set(key, stringValue);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const newHash = currentParams.toString();
            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${window.location.search}${
                    newHash ? '#' + newHash : ''
                }`,
            );
        }
    });
}

/**
 * Unlinks a store from the URL hash
 * @param {ReactiveStore} store
 */
export function unlinkStoreFromHash(store) {
    const hashLink = store.getMeta('hashLink');
    if (!hashLink) return;
    window.removeEventListener('hashchange', hashLink.from);
    store.unsubscribe(hashLink.to);
    store.removeMeta('hashLink');
}

/**
 * Initialize the router system
 */
export function initializeRouter() {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.history.replaceState({}, '', originalUrl);
            
            const url = new URL(window.location);
            const pageFromSearch = url.searchParams.get('page');
            const pathFromSearch = url.searchParams.get('path');
            
            if (url.searchParams.has('page')) {
                url.searchParams.delete('page');
            }
            
            const orderedHashParams = new URLSearchParams();
            
            if (pageFromSearch) {
                orderedHashParams.set('page', pageFromSearch);
            } else {
                const hash = window.location.hash.slice(1);
                const hashParams = new URLSearchParams(hash);
                const pageFromHash = hashParams.get('page');
                
                if (pageFromHash) {
                    orderedHashParams.set('page', pageFromHash);
                } else {
                    orderedHashParams.set('page', PAGE_NAMES.WELCOME);
                }
            }
            
            if (pathFromSearch) {
                url.searchParams.delete('path');
                orderedHashParams.set('path', pathFromSearch);
            } else {
                const hash = window.location.hash.slice(1);
                const hashParams = new URLSearchParams(hash);
                const pathFromHash = hashParams.get('path');
                
                if (pathFromHash) {
                    orderedHashParams.set('path', pathFromHash);
                }
            }
            
            const hash = window.location.hash.slice(1);
            const existingHashParams = new URLSearchParams(hash);
            
            for (const [key, value] of existingHashParams.entries()) {
                if (key !== 'page' && key !== 'path') {
                    url.searchParams.set(key, value);
                }
            }
            
            for (const [key, value] of existingHashParams.entries()) {
                if (key === 'query') {
                    orderedHashParams.set(key, value);
                }
            }
            
            url.hash = orderedHashParams.toString();
            window.history.replaceState({}, '', url.toString());
        }, 100);
    });

    window.addEventListener('popstate', (event) => {
        // Get page and path from hash
        const hash = window.location.hash.slice(1);
        const hashParams = new URLSearchParams(hash);
        const pageFromHash = hashParams.get('page');
        const pathFromHash = hashParams.get('path');

        if (pageFromHash) {
            Store.page.set(pageFromHash);
        } else {
            Store.page.set(PAGE_NAMES.WELCOME);
        }
        
        if (pathFromHash && Store.search) {
            Store.search.set((prev) => ({ ...prev, path: pathFromHash }));
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const localeFromUrl = urlParams.get('locale');
        const tagsFromUrl = urlParams.get('tags');
        
        if (localeFromUrl || tagsFromUrl) {
            const updates = {};
            if (localeFromUrl) updates.locale = localeFromUrl;
            if (tagsFromUrl) {
                try {
                    updates.tags = JSON.parse(tagsFromUrl);
                } catch (e) {
                    updates.tags = tagsFromUrl;
                }
            }
            Store.filters.set((prev) => ({ ...prev, ...updates }));
        }
        
        const commerceEnvFromUrl = urlParams.get('commerce.env');
        if (commerceEnvFromUrl) {
            Store.commerceEnv.set(commerceEnvFromUrl);
        }
    });
}

/**
 * Set up store subscriptions related to navigation
 */
export function setupNavigationSubscriptions() {
    Store.search.subscribe((value, oldValue) => {
        if (
            (!oldValue.query && value.query) ||
            (Boolean(value.query) && value.query !== oldValue.query)
        )
            Store.page.set(PAGE_NAMES.CONTENT);
    });

    Store.search.subscribe((value, oldValue) => {
        if (
            value.path !== oldValue.path &&
            Store.page.get() === PAGE_NAMES.PLACEHOLDERS
        ) {
            Store.placeholders.list.loading.set(true);
        }
    });

    Store.page.subscribe((value, oldValue) => {
        if (
            value === PAGE_NAMES.PLACEHOLDERS &&
            oldValue !== PAGE_NAMES.PLACEHOLDERS
        ) {
            const folderPath = Store.search.get()?.path;
            if (folderPath) {
                Store.placeholders.list.loading.set(true);
            }
        }
    });

    Store.search.subscribe((value, oldValue) => {
        if (value.path !== oldValue.path) {
            const currentHash = window.location.hash.slice(1);
            const hashParams = new URLSearchParams(currentHash);
            
            hashParams.delete('path');
            
            const orderedParams = new URLSearchParams();
            
            const pageValue = hashParams.get('page');
            if (pageValue) {
                hashParams.delete('page');
                orderedParams.set('page', pageValue);
            }
            
            if (value.path) {
                orderedParams.set('path', value.path);
            }
            
            for (const [key, val] of hashParams.entries()) {
                orderedParams.set(key, val);
            }
            
            window.location.hash = orderedParams.toString();
        }
    });

    Store.filters.subscribe((value, oldValue) => {
        const urlParams = new URLSearchParams(window.location.search);
        let hasChanges = false;
        
        if (value.locale !== oldValue.locale) {
            if (value.locale) {
                urlParams.set('locale', value.locale);
            } else {
                urlParams.delete('locale');
            }
            hasChanges = true;
        }
        
        if (JSON.stringify(value.tags) !== JSON.stringify(oldValue.tags)) {
            if (value.tags && (Array.isArray(value.tags) ? value.tags.length > 0 : true)) {
                urlParams.set('tags', JSON.stringify(value.tags));
            } else {
                urlParams.delete('tags');
            }
            hasChanges = true;
        }
        
        if (hasChanges) {
            const newSearch = urlParams.toString();
            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${
                    newSearch ? '?' + newSearch : ''
                }${window.location.hash}`,
            );
        }
    });
    
    Store.commerceEnv.subscribe((value, oldValue) => {
        if (value !== oldValue) {
            const urlParams = new URLSearchParams(window.location.search);
            
            if (value) {
                urlParams.set('commerce.env', value);
            } else {
                urlParams.delete('commerce.env');
            }
            
            const newSearch = urlParams.toString();
            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${
                    newSearch ? '?' + newSearch : ''
                }${window.location.hash}`,
            );
        }
    });
}

/**
 * Links a store to the URL search parameters
 * @param {ReactiveStore} store - The store to link
 * @param {string|string[]} keys - The key(s) to link
 * @param {any} defaultValue - The default value to use if the key is not in the search params
 */
export function linkStoreToSearch(store, keys, defaultValue) {
    if (!store) return;
    const keysArray = Array.isArray(keys) ? keys : [keys];

    const urlParams = new URLSearchParams(window.location.search);

    let shouldUpdateStore = false;
    const updates = {};

    for (const key of keysArray) {
        if (urlParams.has(key)) {
            let value = urlParams.get(key);
            try {
                value = JSON.parse(value);
            } catch (e) {
                // Not JSON, use as is
            }
            updates[key] = value;
            shouldUpdateStore = true;
        } else if (defaultValue !== undefined) {
            const defaultForKey = Array.isArray(defaultValue)
                ? defaultValue
                : typeof defaultValue === 'object' && defaultValue !== null
                  ? defaultValue[key]
                  : defaultValue;

            if (defaultForKey !== undefined) {
                updates[key] = defaultForKey;
                shouldUpdateStore = true;
            }
        }
    }

    if (shouldUpdateStore) {
        store.set((prev) => ({ ...prev, ...updates }));
    }

    store.subscribe((value, oldValue) => {
        const currentParams = new URLSearchParams(window.location.search);
        let hasChanges = false;

        for (const key of keysArray) {
            const storeValue = value[key];
            if (Array.isArray(storeValue) && storeValue.length === 0) {
                if (currentParams.has(key)) {
                    currentParams.delete(key);
                    hasChanges = true;
                }
                continue;
            }

            if (storeValue === undefined) {
                if (currentParams.has(key)) {
                    currentParams.delete(key);
                    hasChanges = true;
                }
                continue;
            }

            const stringValue =
                typeof storeValue === 'object'
                    ? JSON.stringify(storeValue)
                    : String(storeValue);

            if (currentParams.get(key) !== stringValue) {
                currentParams.set(key, stringValue);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const newSearch = currentParams.toString();
            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${
                    newSearch ? '?' + newSearch : ''
                }${window.location.hash}`,
            );
        }
    });
}

/**
 * Initialize filters from URL search parameters
 * This should be called in initializeStoreFromUrl
 */
function initializeFiltersFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const localeFromUrl = urlParams.get('locale');
    const tagsFromUrl = urlParams.get('tags');
    
    if (localeFromUrl || tagsFromUrl) {
        const updates = {};
        if (localeFromUrl) updates.locale = localeFromUrl;
        if (tagsFromUrl) {
            try {
                updates.tags = JSON.parse(tagsFromUrl);
            } catch (e) {
                updates.tags = tagsFromUrl;
            }
        }
        Store.filters.set((prev) => ({ ...prev, ...updates }));
    } else {
        Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));
    }
    
    const commerceEnvFromUrl = urlParams.get('commerce.env');
    if (commerceEnvFromUrl) {
        Store.commerceEnv.set(commerceEnvFromUrl);
    }
}
