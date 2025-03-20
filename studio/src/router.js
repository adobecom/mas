import Store from './store.js';
import { PAGE_NAMES } from './constants.js';
import { getHashParam } from './utils.js';

const originalUrl = window.location.href;

/**
 * Determines and returns the initial page based on URL parameters
 * @returns {string} The page name to initialize with
 */
export function determineInitialPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = urlParams.get('page');
    const hasQuery = Boolean(getHashParam('query'));
    return pageFromUrl || (hasQuery ? PAGE_NAMES.CONTENT : PAGE_NAMES.WELCOME);
}

/**
 * Initialize all store values based on URL parameters
 * This is the central function for URL-based store initialization
 */
export function initializeStoreFromUrl() {
    // Initialize page parameter
    const initialPage = determineInitialPage();
    Store.page.set(initialPage);
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
            const url = new URL(window.location);
            url.searchParams.set('page', value);
            window.history.pushState({}, '', url.toString());
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

    store.subscribe((value) => {
        const currentHash = window.location.hash.slice(1);
        const currentParams = new URLSearchParams(currentHash);
        let hasChanges = false;

        for (const key of keysArray) {
            const storeValue = value[key];
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
            if (!url.searchParams.has('page')) {
                url.searchParams.set('page', PAGE_NAMES.WELCOME);
                window.history.replaceState({}, '', url.toString());
            }
        }, 100);
    });

    window.addEventListener('popstate', (event) => {
        const urlParams = new URLSearchParams(window.location.search);
        const pageFromUrl = urlParams.get('page');

        if (pageFromUrl) {
            Store.page.set(pageFromUrl);
        } else {
            Store.page.set(PAGE_NAMES.WELCOME);
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
}
