import { PAGE_NAMES, SORT_COLUMNS, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from './constants.js';
import { ReactiveStore } from './reactivity/reactive-store.js';

// Store definition with default values - no URL parsing here
const Store = {
    fragments: {
        list: {
            loading: new ReactiveStore(true),
            firstPageLoaded: new ReactiveStore(false),
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
    sort: new ReactiveStore({}),
    renderMode: new ReactiveStore(localStorage.getItem('mas-render-mode') || 'render'),
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new ReactiveStore(PAGE_NAMES.WELCOME, pageValidator),
    landscape: new ReactiveStore(WCS_LANDSCAPE_PUBLISHED, landscapeValidator),
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
            data: new ReactiveStore([{ value: 'disabled', itemText: 'disabled' }]),
        },
    },
    profile: new ReactiveStore(),
    createdByUsers: new ReactiveStore([]),
    users: new ReactiveStore([]),
    confirmDialogOptions: new ReactiveStore(null),
    showCloneDialog: new ReactiveStore(false),
    preview: new ReactiveStore(null, previewValidator),
};

// #region Validators

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

/**
 * @param {string} value
 * @returns {string}
 */
function pageValidator(value) {
    const validPages = [PAGE_NAMES.WELCOME, PAGE_NAMES.CONTENT, PAGE_NAMES.PLACEHOLDERS];
    return validPages.includes(value) ? value : PAGE_NAMES.WELCOME;
}

/**
 * @param {string} value
 * @returns {string}
 */
function landscapeValidator(value) {
    return [WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED].includes(value) ? value : WCS_LANDSCAPE_PUBLISHED;
}

function sortValidator(value) {
    const page = Store.page.get();
    const defaultSortBy = SORT_COLUMNS[page]?.[0];
    if (!value) return { sortBy: defaultSortBy, sortDirection: 'asc' };
    const result = { ...value };
    if (!result.sortBy) result.sortBy = defaultSortBy;
    else {
        const isValidField = (SORT_COLUMNS[page] || []).includes(result.sortBy);
        if (!isValidField) result.sortBy = defaultSortBy;
    }
    if (result.sortDirection !== 'asc' && result.sortDirection !== 'desc') result.sortDirection = 'asc';
    return result;
}
// This validator accesses the store object, so it can't be passed in the
// ReactiveStore contructor - it gets registered separately
Store.sort.registerValidator(sortValidator);

function previewValidator(value) {
    const defaultPosition = { top: 0, right: undefined, bottom: undefined, left: 0 };
    if (!value || typeof value !== 'object') return { id: null, position: defaultPosition };
    if (!value.position) return { ...value, position: defaultPosition };
    value.position = { ...defaultPosition, ...value.position };
    return value;
}

// #endregion

const editorPanel = () => document.querySelector('editor-panel');

/**
 * Toggle selection of a fragment
 */
export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id)) Store.selection.set(selection.filter((selectedId) => selectedId !== id));
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

// Reset sort on page change
Store.page.subscribe((value) => {
    Store.sort.set({ sortBy: SORT_COLUMNS[value]?.[0], sortDirection: 'asc' });
});

// Derived values

const placeholdersDict = {
    value: {},
};

Store.placeholders.list.data.subscribe((value) => {
    // Update placeholders dict
    placeholdersDict.value = {};
    const extractValue = (ref) => {
        const value = ref.getFieldValue('value') || ref.getFieldValue('richTextValue') || '';
        // Escape control characters and double quotes before parsing
        return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/"/g, '\\"');
    };
    for (const placeholderStore of value) {
        const placeholder = placeholderStore.get();
        placeholdersDict.value[placeholder.getFieldValue('key')] = extractValue(placeholder);
    }
    // If on the content page, trigger fragment resolve
    if (Store.page.value !== PAGE_NAMES.CONTENT) return;
    for (const fragmentStore of Store.fragments.list.data.value) {
        fragmentStore.resolvePreviewFragment();
    }
});

export { placeholdersDict };
