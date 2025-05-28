import { PAGE_NAMES, WCS_ENV_PROD } from './constants.js';
import { ReactiveStore } from './reactivity/reactive-store.js';

// Store definition with default values - no URL parsing here
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
    operation: new ReactiveStore(),
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
    sort: new ReactiveStore({}, sortValidator),
    renderMode: new ReactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ),
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new ReactiveStore(PAGE_NAMES.WELCOME, pageValidator),
    commerceEnv: new ReactiveStore(WCS_ENV_PROD),
    placeholders: {
        search: new ReactiveStore(''),
        list: {
            data: new ReactiveStore([]),
            loading: new ReactiveStore(true),
        },
        index: new ReactiveStore(null),
        selection: new ReactiveStore([]),
        editing: new ReactiveStore(null),
        addons: {
            loading: new ReactiveStore(false),
            data: new ReactiveStore([
                { value: 'disabled', itemText: 'disabled' },
            ]),
        },
    },
    confirmDialogOptions: new ReactiveStore(null),
};

/**
 * @param {object} value
 * @returns {object}
 */
function filtersValidator(value) {
    if (!value) return { locale: 'en_US', tags: undefined };
    if (!value.locale) value.locale = 'en_US';

    // Ensure tags is always a string
    if (!value.tags) {
        value.tags = undefined;
    } else if (Array.isArray(value.tags)) {
        value.tags = value.tags.join(',');
    } else if (typeof value.tags !== 'string') {
        value.tags = String(value.tags);
    }
    return value;
}

function sortValidator(value) {
    if (!value) return { sortBy: 'id', sortDirection: 'asc' };
    if (!value.sortBy) value.sortBy = 'id';
    if (value.sortDirection !== 'asc' && value.sortDirection !== 'desc')
        value.sortDirection = 'asc';
    return value;
}

/**
 * @param {string} value
 * @returns {string}
 */
function pageValidator(value) {
    const validPages = [
        PAGE_NAMES.WELCOME,
        PAGE_NAMES.CONTENT,
        PAGE_NAMES.PLACEHOLDERS,
    ];
    return validPages.includes(value) ? value : PAGE_NAMES.WELCOME;
}

const editorPanel = () => document.querySelector('editor-panel');

/**
 * Toggle selection of a fragment
 */
export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id))
        Store.selection.set(
            selection.filter((selectedId) => selectedId !== id),
        );
    else Store.selection.set([...selection, id]);
}

/**
 * Edit a fragment in the editor panel
 */
export function editFragment(store, x = 0) {
    if (!Store.fragments.list.data.get().includes(store)) {
        Store.fragments.list.data.set((prev) => [store, ...prev]);
    }
    editorPanel()?.editFragment(store, x);
}

export default Store;
