import { Fragment } from './aem/fragment.js';
import { getEditorPanel } from './editor-panel.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import { getHashParam, getHashParams, setHashParams } from './utils.js';

const hasQuery = Boolean(getHashParam('query'));
console.log('watafak', hasQuery);

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
        inEdit: new ReactiveStore(null),
    },
    folders: {
        loaded: new ReactiveStore(false),
        data: new ReactiveStore([]),
    },
    search: new ReactiveStore({}),
    filters: new ReactiveStore({}),
    renderMode: new ReactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new ReactiveStore(hasQuery ? 'content' : 'welcome', pageValidator), // 'welcome' | 'content'
};

export default Store;

// #region Validators

function pageValidator(value) {
    if (value === 'content') return value;
    console.log(value, 'valid1');
    return 'welcome';
}

// #endregion

// #region Utils

/**
 * Shortcut for retrieveing the underlying in edit fragment
 * @returns {Fragment}
 */
export function getInEditFragment() {
    return Store.fragments.inEdit.get().get();
}

export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id))
        Store.selection.set(
            selection.filter((selectedId) => selectedId !== id),
        );
    else Store.selection.set([...selection, id]);
}

export function navigateToPage(value) {
    return function () {
        const editor = getEditorPanel();
        if (editor && !editor.close()) return;
        Store.page.set(value);
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
                if (hashValue[param] && hashValue[param] !== value[param]) {
                    if (
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
}

linkStoreToHash(Store.search, ['path', 'query']);
linkStoreToHash(Store.filters, []);
linkStoreToHash(Store.page, 'page', 'welcome');

// #endregion
