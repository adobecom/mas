import { WCS_ENV_PROD, WCS_ENV_STAGE } from './constants.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import {
    getHashParam,
    getHashParams,
    looseEquals,
    setHashParams,
} from './utils.js';

const originalUrl = window.location.href;
const urlParams = new URLSearchParams(window.location.search);
const pageFromUrl = urlParams.get('page');
const hasQuery = Boolean(getHashParam('query'));
const initialPage = pageFromUrl || (hasQuery ? 'content' : 'welcome');

const Store = {
    fragments: {
        list: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
        },
        recentlyUpdated: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
            limit: new ReactiveStore(6),
        },
        inEdit: new FragmentStore(null),
    },
    operation: new ReactiveStore(), // current operation in progress, editor or content navigation batch operations
    editor: {
        get hasChanges() {
            return Store.fragments.inEdit.get()?.hasChanges || false;
        },
    },
    folders: {
        loaded: new ReactiveStore(false),
        data: new ReactiveStore([]),
    },
    search: new ReactiveStore({}),
    filters: new ReactiveStore({ locale: 'en_US', tags: [] }, filtersValidator),
    renderMode: new ReactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new ReactiveStore(initialPage, pageValidator),
    commerceEnv: new ReactiveStore(WCS_ENV_PROD, commerceEnvValidator), // 'stage' | 'prod'
    placeholders: {
        list: {
            data: new ReactiveStore([]),
            loading: new ReactiveStore(false),
        },
        selected: new ReactiveStore(null),
        editing: new ReactiveStore(null),
    },
};

export default Store;

/**
 * @param {object} value
 * @returns {object}
 */
function filtersValidator(value) {
    if (!value) return { locale: 'en_US' }; // eventually we can have a constant, initialFilters
    if (!value.locale) value.locale = 'en_US';
    return value;
}

/**
 * @param {string} value
 * @returns {string}
 */
function pageValidator(value) {
    const validPages = ['welcome', 'content', 'placeholders'];
    return validPages.includes(value) ? value : 'welcome';
}

/**
 * @param {string} value
 * @returns {string}
 */
function commerceEnvValidator(value) {
    if (value === WCS_ENV_STAGE) return value;
    return WCS_ENV_PROD;
}

const editorPanel = () => document.querySelector('editor-panel');

export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id))
        Store.selection.set(
            selection.filter((selectedId) => selectedId !== id),
        );
    else Store.selection.set([...selection, id]);
}

export function editFragment(store, x) {
    editorPanel().editFragment(store, x);
}

export function navigateToPage(value) {
    return async () => {
        const confirmed =
            !Store.editor.hasChanges ||
            (await editorPanel().promptDiscardChanges());
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
 * @param {ReactiveStore} store
 */
export function unlinkStoreFromHash(store) {
    const hashLink = store.getMeta('hashLink');
    if (!hashLink) return;
    window.removeEventListener('hashchange', hashLink.from);
    store.unsubscribe(hashLink.to);
    store.removeMeta('hashLink');
}

Store.search.subscribe((value, oldValue) => {
    if (
        (!oldValue.query && value.query) ||
        (Boolean(value.query) && value.query !== oldValue.query)
    )
        Store.page.set('content');
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.history.replaceState({}, '', originalUrl);
        const url = new URL(window.location);
        if (!url.searchParams.has('page')) {
            url.searchParams.set('page', 'welcome');
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
        Store.page.set('welcome');
    }
});

Store.search.subscribe((value, oldValue) => {
    if (value.path !== oldValue.path && Store.page.get() === 'placeholders') {
        Store.placeholders.list.loading.set(true);
    }
});

Store.page.subscribe((value, oldValue) => {
    if (value === 'placeholders' && oldValue !== 'placeholders') {
        const folderPath = Store.search.get()?.path;
        if (folderPath) {
            Store.placeholders.list.loading.set(true);
        }
    }
});
