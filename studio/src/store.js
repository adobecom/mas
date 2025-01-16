import { Fragment } from './aem/fragment.js';
import { getEditorPanel } from './editor-panel.js';
import MasFilters from './entities/filters.js';
import MasSearch from './entities/search.js';
import { reactiveStore } from './reactivity/reactive-store.js';
import { WCS_ENV_PROD } from './constants.js';

const params = Object.fromEntries(
    new URLSearchParams(window.location.hash.slice(1)),
);
const initialSearch = MasSearch.fromHash();
const initialFilters = MasFilters.fromHash();

const Store = {
    fragments: {
        list: {
            loading: reactiveStore(true),
            data: reactiveStore([]),
        },
        recentlyUpdated: {
            loading: reactiveStore(true),
            data: reactiveStore([]),
            limit: reactiveStore(6),
        },
        inEdit: reactiveStore(null),
    },
    folders: {
        loaded: reactiveStore(false),
        data: reactiveStore([]),
    },
    search: reactiveStore(initialSearch),
    filters: reactiveStore(initialFilters),
    renderMode: reactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: reactiveStore(false),
    selection: reactiveStore([]),
    currentPage: reactiveStore(initialSearch.query ? 'content' : 'splash'), // 'splash' | 'content'
    commerceEnv: reactiveStore(params['commerce.env'] ?? WCS_ENV_PROD),
};

export default Store;

/** Utils */

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
        Store.currentPage.set(value);
    };
}
