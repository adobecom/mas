import { Fragment } from './aem/fragment.js';
import MasFilters from './entities/filters.js';
import MasSearch from './entities/search.js';
import {
    FragmentStore,
    ReactiveStore,
    reactiveStore,
} from './reactivity/reactiveStore.js';

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
 *
 * @param {string} id
 * @returns {FragmentStore}
 */
export function getFragmentStore(id) {
    const fragments = Store.fragments.data.get();
    const fragmentStore = fragments.find((f) => f.get().id === id);
    return fragmentStore || null;
}

/**
 *
 * @param {string} id
 * @returns {Fragment}
 */
export function getFragment(id) {
    const fragments = Store.fragments.data.get();
    const fragmentStore = fragments.find((f) => f.get().id === id);
    return fragmentStore?.get() || null;
}

/**
 *
 * @param {string} id
 * @returns {Fragment}
 */
export function getInEditFragment() {
    const fragments = Store.fragments.data.get();
    const fragmentStore = fragments.find(
        (f) => f.get().id === Store.fragments.inEdit.get(),
    );
    return fragmentStore?.get() || null;
}

export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id))
        Store.selection.set(
            selection.filter((selectedId) => selectedId !== id),
        );
    else Store.selection.set([...selection, id]);
}

export function isInSelection(id) {
    return Store.selection.get().includes(id);
}

export function updateStore(path) {
    return function (value) {
        let target = Store;
        let lastStore = null;
        const segments = path.split('.');
        for (const segment of segments) {
            if (target instanceof ReactiveStore) {
                lastStore = target;
                target = target.get();
            }
            target = target[segment];
        }
        if (target instanceof ReactiveStore) {
            target.set(value);
        } else {
            lastStore.update((prev) => ({ ...prev, [segments.at(-1)]: value }));
        }
    };
}
