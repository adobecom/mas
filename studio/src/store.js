import { WCS_ENV_PROD, WCS_ENV_STAGE } from './constants.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import { getHashParam, getHashParams, setHashParams } from './utils.js';

const hasQuery = Boolean(getHashParam('query'));

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
            return Store.fragments.inEdit.get()?.get()?.hasChanges || false;
        },
    },
    folders: {
        loaded: new ReactiveStore(false),
        data: new ReactiveStore([]),
    },
    search: new ReactiveStore({}),
    filters: new ReactiveStore({ locale: 'en_US' }, filtersValidator),
    renderMode: new ReactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new ReactiveStore(hasQuery ? 'content' : 'welcome', pageValidator), // 'welcome' | 'content'
    commerceEnv: new ReactiveStore(WCS_ENV_PROD, commerceEnvValidator), // 'stage' | 'prod'
};

export default Store;

// #region Validators

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
    if (value === 'content') return value;
    return 'welcome';
}

/**
 * @param {string} value
 * @returns {string}
 */
function commerceEnvValidator(value) {
    if (value === WCS_ENV_STAGE) return value;
    return WCS_ENV_PROD;
}

// #endregion

// #region Utils

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
            Store.fragments.inEdit.set(null);
            Store.page.set(value);
        }
    };
}

// #endregion

// #region Hash link

/**
 * Links a given store to the hash; Only primitive values and object values with primitive properties are supported
 * @param {ReactiveStore} store
 * @param {string | string[]} params
 * @param {any} defaultValue - The default value that will not be shown in the hash; for object values, pass an
 *                             object containing the default values for as many properties as needed
 */
export function linkStoreToHash(store, params, defaultValue) {
    if (store.hasMeta('hashLink')) {
        console.error('Cannot link to hash a store that is already linked.');
        return;
    }

    const isPrimitive = !Array.isArray(params);

    function syncFromHash() {
        const value = store.get();
        const defaultValues = isPrimitive
            ? { [params]: defaultValue }
            : defaultValue || {};

        if (isPrimitive) {
            const hashValue = getHashParam(params);
            if (hashValue && hashValue !== value) {
                store.set(hashValue);
            }
        } else {
            let hasChanges = false;
            const hashValue = {};
            for (const param of params) {
                hashValue[param] = getHashParam(param);
                if (hashValue[param] !== value[param]) {
                    if (
                        !hashValue[param] &&
                        defaultValues[param] &&
                        value[param] === defaultValues[param]
                    )
                        hashValue[param] = defaultValues[param];
                    else hasChanges = true;
                }
            }
            if (hasChanges) store.set(hashValue);
        }
    }
    function syncToHash(value) {
        const normalizedValue = isPrimitive
            ? { [params]: value }
            : structuredClone(value); // TODO pass clones from stores to these functions, instead of the underlying value
        const hashParams = getHashParams();

        const defaultValues = isPrimitive
            ? { [params]: defaultValue }
            : defaultValue;

        for (const prop in defaultValues) {
            if (normalizedValue[prop] === defaultValues[prop]) {
                hashParams.delete(prop);
                delete normalizedValue[prop];
            }
        }
        setHashParams(hashParams, normalizedValue);
        window.location.hash = hashParams.toString();
    }

    // Initialize
    syncFromHash();

    // Subscribe
    window.addEventListener('hashchange', syncFromHash);
    store.subscribe(syncToHash);
    store.setMeta('hashLink', { from: syncFromHash, to: syncToHash });
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

// #endregion

// #region Behaviors

// When the query param is populated or changes, switch to the 'content' page.
Store.search.subscribe((value, oldValue) => {
    if (
        (!oldValue.query && value.query) ||
        (Boolean(value.query) && value.query !== oldValue.query)
    )
        Store.page.set('content');
});

// #endregion
