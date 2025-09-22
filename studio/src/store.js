import { EMPTY_TAGS, PAGE_NAMES, SORT_COLUMNS, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from './constants.js';
import { DerivedStore } from './reactivity/derived-store.js';
import { MapStore } from './reactivity/map-store.js';
import { PaginationStore } from './reactivity/pagination-store.js';
import { ReactiveStore } from './reactivity/reactive-store.js';

// Store definition with default values - no URL parsing here
const Store = {
    fragments: {
        list: {
            loading: new ReactiveStore(true),
            firstPageLoaded: new ReactiveStore(false),
            data: new ReactiveStore([]),
            pagination: new PaginationStore(),
        },
        recentlyUpdated: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
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
};

function updateShowingContent() {
    const { search, filters, pagination } = Store.content;
    const filteredItems = [];
    for (const [, itemStore] of Store.content.loaded.value) {
        const item = itemStore.get();
        /* Search */
        if (search.value.query) {
            let searchTarget = '';
            if (search.value.field && search.value.field !== 'all') {
                const field = item.fields.find((f) => f.name === search.value.field);
                if (field) {
                    if (field.multiple) searchTarget = field.values.join(' ');
                    else searchTarget = field.values[0]?.toString() || '';
                }
            } else {
                searchTarget = item.fields
                    .map((f) => f.values)
                    .flat()
                    .join(' ');
            }
            if (!searchTarget.toLowerCase().includes(search.value.query.toLowerCase())) continue;
        }
        /* Filters */
        const { variant, status, ...restTagCategories } = filters.value.tags;

        const variants = variant.map((v) => v.replace('mas:variant/', ''));
        if (variants.length > 0 && !variants.includes(item.getFieldValue('variant'))) continue;

        const statuses = status.map((s) => s.replace('mas:status/', ''));
        if (statuses.length > 0 && !statuses.includes(item.status.toLowerCase())) continue;

        const createdBy = Store.createdByUsers.value.map((user) => user.userPrincipalName);
        if (createdBy.length > 0 && !createdBy.includes(item.created.by)) continue;

        let shouldInclude = true;
        for (const tags of Object.values(restTagCategories)) {
            if (tags.length === 0) continue;
            let hasATag = false;
            for (const tag of tags) {
                if (item.tags.some((t) => t.id === tag)) {
                    hasATag = true;
                    continue;
                }
            }
            if (!hasATag) {
                shouldInclude = false;
                continue;
            }
        }
        if (!shouldInclude) continue;
        filteredItems.push(itemStore);
    }
    /* Sort - no sorting yet */
    Store.content.total.set(filteredItems.length);
    const paginatedItems = filteredItems.slice(
        (pagination.value.page - 1) * pagination.value.size,
        (pagination.value.page - 1) * pagination.value.size + pagination.value.size,
    );
    Store.content.showing.set(paginatedItems);
}

function resetPage() {
    Store.content.pagination.selectPage(1);
}

Store.content.search.subscribe(resetPage);
Store.content.filters.subscribe(resetPage);
Store.createdByUsers.subscribe(resetPage);

Store.content.loaded.subscribe(updateShowingContent);
Store.content.search.subscribe(updateShowingContent);
Store.content.filters.subscribe(updateShowingContent);
Store.content.sort.subscribe(updateShowingContent);
Store.content.pagination.subscribe(updateShowingContent);
Store.createdByUsers.subscribe(updateShowingContent);

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

Store.placeholders.preview.subscribe(() => {
    if (Store.page.value === PAGE_NAMES.CONTENT) {
        for (const fragmentStore of Store.fragments.list.data.value) {
            fragmentStore.resolvePreviewFragment();
        }
    }
    if (Store.page.value === PAGE_NAMES.WELCOME) {
        for (const fragmentStore of Store.fragments.recentlyUpdated.data.value) {
            fragmentStore.resolvePreviewFragment();
        }
    }
});
