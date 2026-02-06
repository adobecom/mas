import { PAGE_NAMES, SORT_COLUMNS, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from './constants.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import { EditorContextStore } from './reactivity/editor-context-store.js';

let editorContextInstance = null;

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
        expandedId: new ReactiveStore(null), // Fragment ID to auto-expand in variations table
    },
    fragmentEditor: {
        fragmentId: new ReactiveStore(null),
        translatedLocales: new ReactiveStore(null), // Array of locale codes like ['en_US', 'fr_FR'] or null
        get editorContext() {
            if (!editorContextInstance) {
                editorContextInstance = new EditorContextStore(null);
            }
            return editorContextInstance;
        },
    },
    operation: new ReactiveStore(),
    editor: {
        resetChanges() {
            const fragmentData = Store.fragments.inEdit.get()?.get();
            if (fragmentData) {
                fragmentData.hasChanges = false;
            }
        },
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
    viewMode: new ReactiveStore('default'),
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
    version: {
        fragmentId: new ReactiveStore(null),
    },
    promotions: {
        list: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
            filter: new ReactiveStore('scheduled'),
            filterOptions: new ReactiveStore([
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'expired', label: 'Expired' },
                { value: 'archived', label: 'Archived' },
            ]),
        },
        inEdit: new ReactiveStore(null),
        promotionId: new ReactiveStore(null),
    },
    localeOrRegion: function () {
        return Store.search.value.region || Store.filters.value.locale || 'en_US';
    },
    removeRegionOverride: function () {
        if (Store.search.value.region) {
            Store.search.set((prev) => ({ ...prev, region: null }));
        }
    },
    surface: function () {
        return Store.search.value.path;
    },
    translationProjects: {
        list: {
            data: new ReactiveStore([]),
            loading: new ReactiveStore(true),
        },
        inEdit: new ReactiveStore(null),
        translationProjectId: new ReactiveStore(null),

        allCards: new ReactiveStore([]),
        cardsByPaths: new ReactiveStore(new Map()),
        displayCards: new ReactiveStore([]),
        selectedCards: new ReactiveStore([]),

        allCollections: new ReactiveStore([]),
        collectionsByPaths: new ReactiveStore(new Map()),
        displayCollections: new ReactiveStore([]),
        selectedCollections: new ReactiveStore([]),

        allPlaceholders: new ReactiveStore([]),
        placeholdersByPaths: new ReactiveStore(new Map()),
        displayPlaceholders: new ReactiveStore([]),
        selectedPlaceholders: new ReactiveStore([]),

        targetLocales: new ReactiveStore([]),
        showSelected: new ReactiveStore(false),
    },
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
    const validPages = [
        PAGE_NAMES.WELCOME,
        PAGE_NAMES.CONTENT,
        PAGE_NAMES.PLACEHOLDERS,
        PAGE_NAMES.VERSION,
        PAGE_NAMES.FRAGMENT_EDITOR,
        PAGE_NAMES.PROMOTIONS,
        PAGE_NAMES.PROMOTIONS_EDITOR,
        PAGE_NAMES.TRANSLATIONS,
        PAGE_NAMES.TRANSLATION_EDITOR,
    ];
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
    const fragmentId = store.get().id;
    const storeFragments = Store.fragments.list.data.get();
    const defaultInStore = storeFragments.includes(store);
    const variationInStore = storeFragments.find((s) => s.get().references?.find((r) => r.id === fragmentId));
    if (!defaultInStore && !variationInStore) {
        Store.fragments.list.data.set((prev) => [store, ...prev]);
    }
    editorPanel()?.editFragment(store, x);
}

function editorPanel() {
    return document.querySelector('editor-panel');
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
    if (Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR) {
        const fragmentStore = Store.fragments.inEdit.get();
        if (fragmentStore) {
            fragmentStore.resolvePreviewFragment();
        }
    }
});

Store.filters.subscribe(() => {
    const regionLocale = Store.search.value.region;
    if (!regionLocale) return;
    const currentLocale = Store.filters.value.locale;
    const main = currentLocale.split('_')[0];
    const region = regionLocale.split('_')[0];
    if (region !== main) {
        // If region language doesn't match filter language, reset filter language
        Store.search.set((prev) => ({
            ...prev,
            region: undefined,
        }));
    }
});
