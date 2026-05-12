import { PAGE_NAMES, SORT_COLUMNS, WCS_LANDSCAPE_PUBLISHED, COLLECTION_MODEL_PATH } from './constants.js';
import Store from './store.js';
import { debounce } from './utils.js';
import { canAccessSettings } from './groups.js';

const STORE_SEARCH_HASH_KEYS = ['path', 'query'];
const STORE_SEARCH_HASH_DEFAULT = {};

export class Router extends EventTarget {
    #settingsAccessRouteWatcher = () => {
        this.#resolveSettingsAccessRoute();
    };

    constructor(location = window.location) {
        super();
        this.location = location;
        this.updateHistory = debounce(this.updateHistory.bind(this), 50);
        this.linkedStores = [];
        this.isNavigating = false;
    }

    #hashValue() {
        return this.location.hash?.startsWith('#') ? this.location.hash.slice(1) : this.location.hash || '';
    }

    updateHistory() {
        // Sort the parameters by name
        const sortedParams = new URLSearchParams();
        Array.from(this.currentParams.entries())
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .forEach(([key, value]) => sortedParams.append(key, value));
        const newHash = sortedParams.toString();
        if (newHash !== this.location.hash) {
            this.location.hash = newHash;
            this.dispatchEvent(new Event('change'));
        }
        this.currentParams = undefined;
    }

    translationEditorHasUnsavedChanges() {
        const inEdit = Store.translationProjects.inEdit?.get()?.get();
        if (!inEdit) return false;
        if (inEdit.hasChanges) return true;

        const savedData = {
            selectedCards: inEdit.getFieldValues('fragments'),
            selectedCollections: inEdit.getFieldValues('collections'),
            selectedPlaceholders: inEdit.getFieldValues('placeholders'),
            targetLocales: inEdit.getFieldValues('targetLocales'),
        };

        const fieldsToCompare = ['selectedCards', 'selectedCollections', 'selectedPlaceholders', 'targetLocales'];

        for (const field of fieldsToCompare) {
            const currentValues = Store.translationProjects[field].value || [];
            const savedValues = savedData[field] || [];

            if (currentValues.length !== savedValues.length) {
                return true;
            }

            const currentSet = new Set(currentValues);
            const savedSet = new Set(savedValues);

            if (currentSet.size !== savedSet.size) {
                return true;
            }

            for (const item of currentSet) {
                if (!savedSet.has(item)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Gets the active editor element and its hasChanges state based on the current page
     * @returns {{ editor: Element|null, hasChanges: boolean }}
     */
    getActiveEditor() {
        const currentPage = Store.page.value;

        switch (currentPage) {
            case PAGE_NAMES.FRAGMENT_EDITOR: {
                const editor = document.querySelector('mas-fragment-editor');
                return {
                    editor,
                    hasChanges: editor && Store.editor.hasChanges,
                    shouldCheckUnsavedChanges: editor && Store.editor.hasChanges,
                };
            }
            case PAGE_NAMES.TRANSLATION_EDITOR: {
                const editor = document.querySelector('mas-translation-editor');
                const hasUnsavedChanges = this.translationEditorHasUnsavedChanges();
                return {
                    editor,
                    hasChanges: editor && hasUnsavedChanges,
                    shouldCheckUnsavedChanges: editor && !editor.isLoading && hasUnsavedChanges,
                };
            }
            case PAGE_NAMES.BULK_PUBLISH_EDITOR: {
                const editor = document.querySelector('mas-bulk-publish-editor');
                const hasUnsavedChanges = editor && editor.hasChanges;
                return {
                    editor,
                    hasChanges: hasUnsavedChanges,
                    shouldCheckUnsavedChanges: hasUnsavedChanges,
                };
            }
            case PAGE_NAMES.SETTINGS:
            case PAGE_NAMES.SETTINGS_EDITOR: {
                const editor = document.querySelector('mas-settings');
                const hasUnsavedChanges = editor && editor.hasUnsavedChanges;
                return {
                    editor,
                    hasChanges: hasUnsavedChanges,
                    shouldCheckUnsavedChanges: hasUnsavedChanges,
                };
            }
            default:
                return { editor: null, hasChanges: false, shouldCheckUnsavedChanges: false };
        }
    }

    /**
     * Navigation function to change the current page
     * @param {string} value - The page to navigate to
     * @param {object} [options] - Optional state to set on navigation
     * @param {string} [options.bulkPublishProjectId] - Project ID for bulk publish editor
     * @param {string} [options.translationProjectId] - Project ID for translation editor
     * @returns {Function} A function that when called will navigate to the page
     */
    navigateToPage(value, options = {}) {
        return async () => {
            const targetPage = this.#getAuthorizedPage(value);
            if (Store.page.value === targetPage) return;

            this.isNavigating = true;
            try {
                const { editor, shouldCheckUnsavedChanges } = this.getActiveEditor();
                const confirmed = !shouldCheckUnsavedChanges || (editor ? await editor.promptDiscardChanges() : true);
                if (confirmed) {
                    Store.fragmentEditor.translatedLocales.set(null);
                    if (
                        (Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR || Store.page.value === PAGE_NAMES.VERSION) &&
                        targetPage !== PAGE_NAMES.FRAGMENT_EDITOR &&
                        targetPage !== PAGE_NAMES.VERSION
                    ) {
                        Store.fragmentEditor.fragmentId.set(null);
                        Store.fragmentEditor.loading.set(false);
                        Store.version.fragmentId.set(null);
                    }
                    if (Store.page.value === PAGE_NAMES.TRANSLATION_EDITOR && targetPage !== PAGE_NAMES.TRANSLATION_EDITOR) {
                        Store.translationProjects.translationProjectId.set(null);
                        Store.translationProjects.inEdit.set(null);
                        Store.translationProjects.showSelected.set(false);
                    }
                    if (targetPage === PAGE_NAMES.TRANSLATIONS && Store.page.value !== PAGE_NAMES.TRANSLATIONS) {
                        Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));
                    }
                    Store.fragments.inEdit.set();
                    if (targetPage !== PAGE_NAMES.CONTENT) {
                        Store.fragments.list.data.set([]);
                        Store.search.set((prev) => ({ ...prev, query: undefined }));
                        Store.filters.set((prev) => ({ ...prev, tags: undefined }));
                    }
                    if (
                        (Store.page.value === PAGE_NAMES.SETTINGS || Store.page.value === PAGE_NAMES.SETTINGS_EDITOR) &&
                        targetPage !== PAGE_NAMES.SETTINGS_EDITOR
                    ) {
                        Store.settings.creating.set(false);
                        Store.settings.fragmentId.set(null);
                    }
                    if (options.bulkPublishProjectId !== undefined) {
                        Store.bulkPublishProjects.projectId.set(options.bulkPublishProjectId);
                    }
                    if (options.translationProjectId !== undefined) {
                        Store.translationProjects.translationProjectId.set(options.translationProjectId);
                    }
                    Store.viewMode.set('default');
                    Store.page.set(targetPage);
                }
            } finally {
                this.isNavigating = false;
            }
        };
    }

    /**
     * Navigate to the content table with a specific fragment expanded to show variations.
     * @param {string} fragmentId - The fragment ID to expand in the variations table
     */
    async navigateToVariationsTable(fragmentId) {
        if (!fragmentId) {
            console.error('Fragment ID is required for navigation');
            return;
        }

        this.isNavigating = true;
        try {
            // Check for unsaved changes
            const { editor, shouldCheckUnsavedChanges } = this.getActiveEditor();
            const confirmed = !shouldCheckUnsavedChanges || (editor ? await editor.promptDiscardChanges() : true);

            if (!confirmed) return;

            // Set the fragment ID to be expanded
            Store.fragments.expandedId.set(fragmentId);

            // Clear fragment editor state
            Store.fragmentEditor.fragmentId.set(null);
            Store.fragmentEditor.loading.set(false);
            Store.fragments.inEdit.set();

            // Navigate to content page in table view
            Store.viewMode.set('default');
            Store.renderMode.set('table');
            Store.page.set(PAGE_NAMES.CONTENT);
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * Navigate to the fragment editor
     * @param {string} fragmentId - The fragment ID to edit
     * @param {Object} options - Navigation options
     * @param {string} options.locale - Optional locale to set before navigation
     */
    async navigateToFragmentEditor(fragmentId, options = {}) {
        if (!fragmentId) {
            console.error('Fragment ID is required for navigation');
            return;
        }

        const { locale } = options;

        this.isNavigating = true;
        try {
            // Set locale BEFORE setting page to include it in the first URL change
            if (locale && locale !== Store.filters.value.locale) {
                Store.search.set((prev) => ({ ...prev, region: locale }));
            }

            // Check if this is a collection to use editor-panel instead
            const fragmentList = Store.fragments.list.data.get();
            const fragmentStore = fragmentList?.find((f) => f.get()?.id === fragmentId);

            if (fragmentStore?.get()?.model?.path === COLLECTION_MODEL_PATH) {
                // Use editor-panel for collections
                const editorPanel = document.querySelector('editor-panel');
                if (editorPanel) {
                    if (Store.editor.hasChanges) {
                        const confirmed = await editorPanel.promptDiscardChanges();
                        if (!confirmed) return;
                    }
                    await editorPanel.editFragment(fragmentStore);
                    Store.viewMode.set('editing');
                    return;
                }
            }

            // Default: use full-page fragment editor for regular cards
            if (Store.editor.hasChanges) {
                const fragmentEditor = document.querySelector('mas-fragment-editor');
                const confirmed = fragmentEditor ? await fragmentEditor.promptDiscardChanges() : true;
                if (!confirmed) return;
            }

            Store.fragments.inEdit.set();
            Store.fragmentEditor.fragmentId.set(fragmentId);
            Store.search.set((prev) => ({ ...prev, query: undefined }));
            Store.page.set(PAGE_NAMES.FRAGMENT_EDITOR);
            Store.viewMode.set('editing');
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * Navigate to the translation editor with optional pre-fill data
     * @param {Object} options - Navigation options
     * @param {string} options.targetLocale - Optional target locale to pre-fill
     * @param {string} options.fragmentPath - Optional fragment path to pre-fill
     */
    async navigateToTranslationEditor(options = {}) {
        const { targetLocale, fragmentPath } = options;

        this.isNavigating = true;
        try {
            // Check for unsaved changes
            const { editor, shouldCheckUnsavedChanges } = this.getActiveEditor();
            const confirmed = !shouldCheckUnsavedChanges || (editor ? await editor.promptDiscardChanges() : true);

            if (!confirmed) return;

            // Clear fragment editor state
            Store.fragmentEditor.fragmentId.set(null);
            Store.fragments.inEdit.set();
            Store.viewMode.set('default');

            // Reset locale to default
            Store.search.set((prev) => ({ ...prev, region: null }));
            Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));

            // Store pre-fill data for the translation editor to consume
            if (targetLocale || fragmentPath) {
                Store.translationProjects.prefill.set({ targetLocale, fragmentPath });
            }

            // Set the page - the store subscription will update the URL
            Store.page.set(PAGE_NAMES.TRANSLATION_EDITOR);
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * Syncs a store with the current URL hash parameters
     * @param {ReactiveStore} store - The store to sync
     * @param {any} currentValue - The current value of the store
     * @param {boolean} isObject - Whether the store value is an object
     * @param {string[]} keysArray - The keys to sync
     * @param {any} defaultValue - The default value to use if the key is not in the hash
     * @returns {boolean} Whether the store was updated
     */
    syncStoreFromHash(store, currentValue, isObject, keysArray, defaultValue = undefined) {
        this.currentParams ??= new URLSearchParams(this.#hashValue());
        let newValue = isObject ? structuredClone(currentValue) : currentValue;

        for (const key of keysArray) {
            if (this.currentParams.has(key)) {
                const value = this.currentParams.get(key);
                let parsedValue;
                try {
                    parsedValue = JSON.parse(value);
                } catch (e) {
                    // Not JSON, use as is
                    parsedValue = value;
                }

                if (isObject) {
                    newValue[key] = parsedValue;
                } else {
                    newValue = parsedValue;
                }
            } else {
                const defaultVal = defaultValueGetter(defaultValue)();
                if (isObject) {
                    newValue[key] = defaultVal?.[key];
                } else {
                    newValue = defaultVal;
                }
            }
        }

        if (JSON.stringify(store.value) !== JSON.stringify(newValue)) {
            store.set(newValue);
            this.dispatchEvent(new Event('change'));
        }
    }

    /**
     * Links a store to the URL hash
     * @param {ReactiveStore} store - The store to link
     * @param {string|string[]} keys - The key(s) to link
     * @param {any} defaultValue - The default value to use if the key is not in the hash
     */
    linkStoreToHash(store, keys, defaultValue) {
        const getDefaultValue = defaultValueGetter(defaultValue);
        store.set(getDefaultValue());
        const keysArray = Array.isArray(keys) ? keys : [keys];

        // Store the link configuration for later use with popstate
        this.linkedStores.push({
            store,
            keysArray,
            defaultValue,
        });

        const newValue = store.get();
        const isObject = typeof newValue === 'object' && newValue !== null;
        // Initial sync from hash to store
        this.syncStoreFromHash(store, newValue, isObject, keysArray, defaultValue);

        const self = this;
        store.subscribe((value) => {
            self.currentParams ??= new URLSearchParams(self.#hashValue());

            for (const key of keysArray) {
                const hadParamBeforeUpdate = self.currentParams.has(key);
                const storeValue = isObject ? value?.[key] : value;

                if (Array.isArray(storeValue) && storeValue.length === 0) {
                    if (self.currentParams.has(key)) {
                        self.currentParams.delete(key);
                    }
                    continue;
                }

                if (storeValue === undefined || storeValue === null) {
                    if (self.currentParams.has(key)) {
                        self.currentParams.delete(key);
                    }
                    continue;
                }

                const stringValue = typeof storeValue === 'object' ? JSON.stringify(storeValue) : String(storeValue);

                if (self.currentParams.get(key) !== stringValue) {
                    self.currentParams.set(key, stringValue);
                }

                const defaultValue = getDefaultValue();
                const defaultValueToCompare = isObject ? defaultValue?.[key] : defaultValue;
                const currentParamValue = self.currentParams.get(key);
                if (currentParamValue === String(defaultValueToCompare) && currentParamValue !== PAGE_NAMES.WELCOME) {
                    self.currentParams.delete(key);
                }
            }
            for (const [key, value] of self.currentParams.entries()) {
                if (!value || value === '') {
                    self.currentParams.delete(key);
                }
            }
            if (self.currentParams.toString() === self.#hashValue()) {
                return;
            }
            self.updateHistory();
        });
    }

    start() {
        this.currentParams = new URLSearchParams(this.#hashValue());
        const normalizedOnStart = this.#normalizeSettingsEditorRoute();
        this.linkStoreToHash(Store.page, 'page', PAGE_NAMES.WELCOME);
        this.linkStoreToHash(Store.search, STORE_SEARCH_HASH_KEYS, STORE_SEARCH_HASH_DEFAULT);
        this.linkStoreToHash(Store.filters, ['locale', 'tags', 'personalizationFilterEnabled'], {
            locale: 'en_US',
            personalizationFilterEnabled: false,
        });
        this.linkStoreToHash(Store.sort, ['sortBy', 'sortDirection'], getSortDefaultValue);
        this.linkStoreToHash(Store.placeholders.search, 'search');
        this.linkStoreToHash(Store.landscape, 'commerce.landscape', WCS_LANDSCAPE_PUBLISHED);
        this.linkStoreToHash(Store.version.fragmentId, 'fragmentId');
        this.linkStoreToHash(Store.fragmentEditor.fragmentId, 'fragmentId');
        this.linkStoreToHash(Store.promotions.promotionId, 'promotionId');
        this.linkStoreToHash(Store.translationProjects.translationProjectId, 'translationProjectId');
        this.linkStoreToHash(Store.bulkPublishProjects.projectId, 'bulkPublishProjectId');
        this.linkStoreToHash(Store.settings.fragmentId, 'fragmentId');
        const redirectedOnStart = this.#enforceSettingsAccessFromParams();
        if (normalizedOnStart || redirectedOnStart) {
            this.updateHistory();
        }
        if (Store.search.value.query) {
            Store.page.set(PAGE_NAMES.CONTENT);
        }

        if (this.currentParams.get('page') === PAGE_NAMES.FRAGMENT_EDITOR) {
            Store.viewMode.set('editing');
            if (this.currentParams.has('query')) {
                this.currentParams.delete('query');
                Store.search.set((prev) => ({ ...prev, query: undefined }));
                this.updateHistory();
            }
        }

        this.previousHash = this.location.hash;

        window.addEventListener('hashchange', async (event) => {
            if (!this.isNavigating) {
                const { editor, shouldCheckUnsavedChanges } = this.getActiveEditor();

                if (shouldCheckUnsavedChanges) {
                    const confirmed = editor ? await editor.promptDiscardChanges() : true;
                    if (!confirmed) {
                        event.preventDefault();
                        this.location.hash = this.previousHash;
                        return;
                    }
                }
            }

            /* fix hash when missing params(e.g: manual edit) */
            this.currentParams = new URLSearchParams(this.#hashValue());
            const currentPage = this.currentParams.get('page') || Store.page.value;
            const isContentPage = !currentPage || currentPage === PAGE_NAMES.CONTENT || currentPage === PAGE_NAMES.WELCOME;
            if (this.currentParams.has('query') && !this.currentParams.has('fragmentId') && isContentPage) {
                Store.page.set(PAGE_NAMES.CONTENT);
            }
            const page = this.currentParams.get('page');
            const isSandboxRouteWithoutPage = !page && this.currentParams.get('path') === 'sandbox';
            if (!page && Store.page.value && !isSandboxRouteWithoutPage) {
                this.currentParams.set('page', Store.page.value);
            }
            const path = this.currentParams.get('path');
            if (!path && Store.search.value.path) {
                this.currentParams.set('path', Store.search.value.path);
            }
            const normalizedSettingsRoute = this.#normalizeSettingsEditorRoute();
            this.#syncSearchStoreFromHashParams();
            const redirectedSettingsRoute = this.#enforceSettingsAccessFromParams();
            if (normalizedSettingsRoute || redirectedSettingsRoute) {
                this.updateHistory();
            }

            if (page === PAGE_NAMES.FRAGMENT_EDITOR) {
                Store.viewMode.set('editing');
                if (this.currentParams.has('query')) {
                    this.currentParams.delete('query');
                    Store.search.set((prev) => ({ ...prev, query: undefined }));
                    this.updateHistory();
                }
            } else {
                Store.fragmentEditor.loading.set(false);
                if (Store.viewMode.value === 'editing') {
                    Store.viewMode.set('default');
                }
            }

            Store.removeRegionOverride();

            // Sync all linked stores from the current hash
            this.linkedStores.forEach(({ store, keysArray, defaultValue }) => {
                const currentValue = store.get();
                const isObject = typeof currentValue === 'object' && currentValue !== null;
                this.syncStoreFromHash(store, currentValue, isObject, keysArray, defaultValue);
            });

            this.previousHash = this.location.hash;
        });

        window.addEventListener('beforeunload', (event) => {
            if (Store.editor.hasChanges && Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR) {
                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        });
    }

    #isSettingsPage(page) {
        return page === PAGE_NAMES.SETTINGS || page === PAGE_NAMES.SETTINGS_EDITOR;
    }

    #syncSearchStoreFromHashParams() {
        const currentValue = Store.search.get();
        this.syncStoreFromHash(Store.search, currentValue, true, STORE_SEARCH_HASH_KEYS, STORE_SEARCH_HASH_DEFAULT);
    }

    #getAuthorizedPage(page) {
        if (!this.#isSettingsPage(page)) return page;
        if (!Store.users.getMeta('loaded')) return page;
        if (canAccessSettings(Store.surface())) return page;
        Store.settings.creating.set(false);
        Store.settings.fragmentId.set(null);
        return PAGE_NAMES.WELCOME;
    }

    #normalizeSettingsEditorRoute() {
        if (this.currentParams.get('page') !== PAGE_NAMES.SETTINGS_EDITOR) return false;
        if (this.currentParams.get('fragmentId')) return false;
        if (Store.settings.creating.get()) return false;
        this.currentParams.set('page', PAGE_NAMES.SETTINGS);
        return true;
    }

    #enforceSettingsAccessFromParams() {
        const page = this.currentParams.get('page');
        if (!this.#isSettingsPage(page)) return false;
        if (!Store.users.getMeta('loaded')) {
            this.#startWatchingSettingsAccessRoute();
            return false;
        }
        this.#stopWatchingSettingsAccessRoute();
        if (canAccessSettings(Store.surface())) return false;
        this.currentParams.set('page', PAGE_NAMES.WELCOME);
        this.currentParams.delete('fragmentId');
        Store.page.set(PAGE_NAMES.WELCOME);
        Store.settings.creating.set(false);
        Store.settings.fragmentId.set(null);
        return true;
    }

    #startWatchingSettingsAccessRoute() {
        Store.profile.subscribe(this.#settingsAccessRouteWatcher);
        Store.users.subscribe(this.#settingsAccessRouteWatcher);
    }

    #stopWatchingSettingsAccessRoute() {
        Store.profile.unsubscribe(this.#settingsAccessRouteWatcher);
        Store.users.unsubscribe(this.#settingsAccessRouteWatcher);
    }

    #resolveSettingsAccessRoute() {
        this.currentParams ??= new URLSearchParams(this.#hashValue());
        if (!this.#isSettingsPage(this.currentParams.get('page'))) {
            this.#stopWatchingSettingsAccessRoute();
            return false;
        }
        const redirected = this.#enforceSettingsAccessFromParams();
        if (redirected) {
            this.updateHistory();
        }
        return redirected;
    }
}

export default new Router();

// Default value handling

function defaultValueGetter(defaultValue) {
    if (!defaultValue) return () => undefined;
    if (typeof defaultValue === 'function') return defaultValue;
    return () => defaultValue;
}

function getSortDefaultValue() {
    const page = Store.page.get();
    const defaultSortBy = SORT_COLUMNS[page]?.[0];
    return { sortBy: defaultSortBy, sortDirection: 'asc' };
}
