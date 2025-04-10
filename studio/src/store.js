import { PAGE_NAMES, WCS_ENV_PROD, WCS_ENV_STAGE } from './constants.js';
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
    search: new ReactiveStore({ path: 'acom' }),
    filters: new ReactiveStore({ locale: 'en_US', tags: '' }, filtersValidator),
    renderMode: new ReactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ),
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new ReactiveStore(PAGE_NAMES.WELCOME, pageValidator),
    commerceEnv: new ReactiveStore(WCS_ENV_PROD, commerceEnvValidator),
    placeholders: {
        list: {
            data: new ReactiveStore([]),
            loading: new ReactiveStore(false),
        },
        selected: new ReactiveStore(null),
        editing: new ReactiveStore(null),
    },
    profile: new ReactiveStore(),
    userGroups: new ReactiveStore([]), // groups for the current user
    selectedUserId: new ReactiveStore(null),
    users: new ReactiveStore([]),
};

export default Store;

/**
 * @param {object} value
 * @returns {object}
 */
function filtersValidator(value) {
    if (!value) return { locale: 'en_US', tags: '' };
    if (!value.locale) value.locale = 'en_US';

    // Ensure tags is always a string
    if (value.tags === undefined || value.tags === null) {
        value.tags = '';
    } else if (Array.isArray(value.tags)) {
        value.tags = value.tags.join(',');
    } else if (typeof value.tags !== 'string') {
        value.tags = String(value.tags);
    }

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

/**
 * @param {string} value
 * @returns {string}
 */
function commerceEnvValidator(value) {
    if (value === WCS_ENV_STAGE) return value;
    return WCS_ENV_PROD;
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
