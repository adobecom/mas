import { PAGE_NAMES, SORT_COLUMNS, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from './constants.js';
import { MapStore } from './reactivity/map-store.js';
import { PaginationStore } from './reactivity/pagination-store.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import { getHashParam, isUUID } from './utils.js';

// Store definition with default values - no URL parsing here
const Store = {
    content: {
        data: new MapStore(),
        displaying: new ReactiveStore([]),
        total: new ReactiveStore(0) /* Total number of items after filtering */,
        loading: new ReactiveStore(true),
        batchesLoaded: new ReactiveStore(0),
        search: new ReactiveStore({ field: 'cardTitle', query: '' }, contentSearchValidator),
        filters: {
            tags: new ReactiveStore([], contentTagsValidator),
        },
        sort: new ReactiveStore({}),
        pagination: new PaginationStore(),
        recentlyUpdated: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
        },
        inEdit: new ReactiveStore(null),
    },
    operation: new ReactiveStore(),
    editor: {
        get hasChanges() {
            return Store.content.inEdit.get()?.get()?.hasChanges || false;
        },
    },
    folders: {
        loaded: new ReactiveStore(false),
        data: new ReactiveStore([]),
    },
    tags: new ReactiveStore({}),
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
        preview: new ReactiveStore(null),
    },
    profile: new ReactiveStore(),
    createdByUsers: new ReactiveStore([]),
    users: new ReactiveStore([]),
    confirmDialogOptions: new ReactiveStore(null),
    showCloneDialog: new ReactiveStore(false),
    preview: new ReactiveStore(null, previewValidator),
    surface: new ReactiveStore(null),
    locale: new ReactiveStore('en_US', localeValidator),
    singleFragmentMode: new ReactiveStore(
        (function () {
            const query = getHashParam('query');
            if (query && isUUID(query)) return true;
            return false;
        })(),
    ),
};

// #region Validators

function localeValidator(value) {
    if (!value || typeof value !== 'string') return 'en_US';
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

function contentSearchValidator(value) {
    if (!value || typeof value !== 'object') return { field: 'all', query: '' };
    if (!value.field) return { ...value, field: 'all' };
    return value;
}

function contentTagsValidator(value) {
    if (!value) return [];
    if (typeof value === 'string') return value.split(',');
    if (!Array.isArray(value)) return [];
    return value;
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
    editorPanel()?.editFragment(store, x);
}

export default Store;

// Reset sort on page change
Store.page.subscribe((value) => {
    Store.sort.set({ sortBy: SORT_COLUMNS[value]?.[0], sortDirection: 'asc' });
});

Store.placeholders.preview.subscribe(() => {
    for (const [, fragmentStore] of Store.content.data.value) {
        fragmentStore.resolvePreviewFragment();
    }
});
