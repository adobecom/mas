import { Fragment } from './aem/fragment.js';
import MasFilters from './entities/filters.js';
import MasSearch from './entities/search.js';
import { reactiveStore } from './reactivity/reactiveStore.js';

const Store = {
    fragments: {
        loading: reactiveStore(true),
        data: reactiveStore([]),
        inEdit: reactiveStore(null),
    },
    folders: {
        loaded: reactiveStore(false),
        data: reactiveStore([]),
    },
    filters: reactiveStore(MasFilters.fromHash()),
    search: reactiveStore(MasSearch.fromHash()),
    renderMode: reactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: reactiveStore(false),
    selection: reactiveStore([]),
    currentPage: reactiveStore('splash'), // 'splash' | 'content'
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
