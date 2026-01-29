import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import Store from './store.js';
import router from './router.js';
import { AEM } from './aem/aem.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import { debounce, looseEquals, showToast, UserFriendlyError, extractLocaleFromPath } from './utils.js';
import {
    OPERATIONS,
    STATUS_PUBLISHED,
    TAG_STATUS_PUBLISHED,
    ROOT_PATH,
    PAGE_NAMES,
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
    EDITABLE_FRAGMENT_MODEL_IDS,
    DICTIONARY_INDEX_MODEL_ID,
    DICTIONARY_ENTRY_MODEL_ID,
    TAG_STATUS_DRAFT,
    CARD_MODEL_PATH,
    SURFACES,
} from './constants.js';
import { Placeholder } from './aem/placeholder.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';
import { getDefaultLocale, getLocaleCode } from '../../io/www/src/fragment/locales.js';
import { getDictionary } from '../libs/fragment-client.js';
import { applyCorrectorToFragment } from './utils/corrector-helper.js';
import { Promotion } from './aem/promotion.js';
import { TranslationProject } from './translation/translation-project.js';

let fragmentCache;

export function getDamPath(path) {
    if (!path) return ROOT_PATH;
    if (path.startsWith(ROOT_PATH)) return path;
    return `${ROOT_PATH}/${path}`;
}

export async function initFragmentCache() {
    if (fragmentCache) return;
    await customElements.whenDefined('aem-fragment').then(() => {
        fragmentCache = document.createElement('aem-fragment').cache;
    });
}

export async function getFromFragmentCache(fragmentId) {
    await initFragmentCache();
    return fragmentCache.get(fragmentId);
}

export async function prepopulateFragmentCache(fragmentId, previewFragment) {
    if (!previewFragment) return;
    await initFragmentCache();

    fragmentCache.remove(fragmentId);

    const normalizedFields = previewFragment.fields.map((field) => {
        if (field.name === 'size' && field.values && field.values.length > 0) {
            return {
                ...field,
                values: field.values.map((v) => (typeof v === 'string' ? v.toLowerCase() : v)),
            };
        }
        return field;
    });

    const cacheData = new Fragment(previewFragment);
    cacheData.fields = normalizedFields;

    fragmentCache.add(cacheData);
}

function isUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

export class MasRepository extends LitElement {
    static properties = {
        bucket: { type: String },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    inEdit = Store.fragments.inEdit;
    operation = Store.operation;

    getFromFragmentCache = getFromFragmentCache;

    constructor() {
        super();
        this.#abortControllers = {
            search: null,
            recentlyUpdated: null,
            placeholders: null,
            promotions: null,
            translations: null,
        };
        this.dictionaryCache = new Map();
        this.inflightDictionaryRequest = null;
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.search = new StoreController(this, Store.search);
        this.filters = new StoreController(this, Store.filters);
        this.page = new StoreController(this, Store.page);
        this.foldersLoaded = new StoreController(this, Store.folders.loaded);
        this.reactiveController = new ReactiveController(this, [Store.profile, Store.createdByUsers]);
        this.recentlyUpdatedLimit = new StoreController(this, Store.fragments.recentlyUpdated.limit);
        this.handleSearch = debounce(this.handleSearch.bind(this), 50);
    }

    /** @type {{ search: AbortController | null, recentlyUpdated: AbortController | null }} */
    #abortControllers;
    /** @type {AEM} */
    aem;

    connectedCallback() {
        super.connectedCallback();
        if (!(this.bucket || this.baseUrl)) throw new Error('Either the bucket or baseUrl attribute is required.');
        this.aem = new AEM(this.bucket, this.baseUrl);

        // Invalidate dictionary cache when filters or search path change
        Store.filters.subscribe(() => {
            this.dictionaryCache.clear();
        });
        Store.search.subscribe(() => {
            this.dictionaryCache.clear();
        });

        this.loadFolders();
        this.style.display = 'none';
    }

    /**
     * @param {Error} error
     * @param {string} defaultMessage - Generic toast message (can be overriden by the error's message)
     */
    processError(error, defaultMessage) {
        if (error.name === 'AbortError') return;
        let message = defaultMessage;
        if (error instanceof UserFriendlyError) message = error.message;
        console.error(`${defaultMessage ? `${defaultMessage}: ` : ''}${error.message}`, error.stack);
        Events.toast.emit({
            variant: 'negative',
            content: message,
        });
    }

    update(changedProperties) {
        super.update(changedProperties);
        if (!this.foldersLoaded.value) return;
        this.handleSearch();
    }

    handleSearch() {
        if (!Store.profile.value) return;
        switch (this.page.value) {
            case PAGE_NAMES.CONTENT:
                this.searchFragments();
                this.loadPreviewPlaceholders();
                break;
            case PAGE_NAMES.WELCOME:
                this.loadRecentlyUpdatedFragments();
                this.loadPreviewPlaceholders();
                break;
            case PAGE_NAMES.FRAGMENT_EDITOR:
                this.loadPreviewPlaceholders();
                break;
            case PAGE_NAMES.PLACEHOLDERS:
                this.loadPlaceholders();
                break;
            case PAGE_NAMES.PROMOTIONS:
                this.loadPromotions();
                break;
            case PAGE_NAMES.TRANSLATIONS:
                this.loadTranslationProjects();
                break;
        }
    }

    async loadFolders() {
        try {
            const { children } = await this.aem.folders.list(ROOT_PATH);
            const ignore = window.localStorage.getItem('ignore_folders') || ['images', 'promotions'];
            const folders = children.map((folder) => folder.name).filter((child) => !ignore.includes(child));

            Store.folders.loaded.set(true);
            Store.folders.data.set(folders);

            if (!folders.includes(this.search.value.path) && !this.search.value.query)
                Store.search.set((prev) => ({
                    ...prev,
                    path: folders.at(0),
                }));
        } catch (error) {
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(false);
            Store.fragments.recentlyUpdated.loading.set(false);
            this.processError(error, 'Could not load folders.');
        }
    }

    get parentPath() {
        return `${getDamPath(this.search.value.path)}/${this.filters.value.locale}`;
    }

    get fragmentStoreInEdit() {
        return this.inEdit.get();
    }

    get fragmentInEdit() {
        return this.fragmentStoreInEdit?.get();
    }

    async searchFragmentList(options, limit, abortController) {
        const cursor = await this.aem.sites.cf.fragments.search(options, limit, abortController);
        const fragments = [];
        for await (const result of cursor) {
            for await (const item of result) {
                const fragment = await this.#addToCache(item);
                fragments.push(fragment);
            }
        }
        return fragments;
    }

    skipVariant(variants, item) {
        const variant = item.fields.find((field) => field.name === 'variant')?.values?.[0];
        return variants.length && !variants.includes(variant);
    }

    async searchFragments() {
        if (this.page.value !== PAGE_NAMES.CONTENT) return;
        if (!Store.profile.value) return;

        const path = this.search.value.path;
        const dataStore = Store.fragments.list.data;
        const query = this.search.value.query;

        const currentPath = dataStore.getMeta('path');
        const currentQuery = dataStore.getMeta('query');
        const currentLocale = dataStore.getMeta('locale');
        const currentData = dataStore.get();
        const locale = this.filters.value.locale;

        if (currentData?.length > 0 && currentPath === path && currentQuery === query && currentLocale === locale) {
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            return;
        }

        Store.fragments.list.loading.set(true);
        Store.fragments.list.firstPageLoaded.set(false);

        const TAG_VARIANT_PREFIX = 'mas:variant/';

        let tags = [];
        if (this.filters.value.tags) {
            if (typeof this.filters.value.tags === 'string') {
                tags = this.filters.value.tags.split(',').filter(Boolean);
            } else if (Array.isArray(this.filters.value.tags)) {
                tags = this.filters.value.tags.filter(Boolean);
            } else {
                console.warn('Unexpected tags format:', this.filters.value.tags);
            }
        }

        const createdBy = Store.createdByUsers.get().map((user) => user.userPrincipalName);

        let modelIds = tags.filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE)).map((tag) => TAG_MODEL_ID_MAPPING[tag]);

        if (modelIds.length === 0) modelIds = EDITABLE_FRAGMENT_MODEL_IDS;

        const variants = tags
            .filter((tag) => tag.startsWith(TAG_VARIANT_PREFIX))
            .map((tag) => tag.replace(TAG_VARIANT_PREFIX, ''));
        tags = tags.filter((tag) => !tag.startsWith(TAG_STUDIO_CONTENT_TYPE) && !tag.startsWith(TAG_VARIANT_PREFIX));

        const damPath = getDamPath(path);
        const localSearch = {
            ...this.search.value,
            modelIds,
            path: `${damPath}/${this.filters.value.locale}`,
            tags,
            createdBy,
            sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
        };

        const publishedTagIndex = tags.indexOf(TAG_STATUS_PUBLISHED);
        if (publishedTagIndex > -1) {
            tags.splice(publishedTagIndex, 1);
            localSearch.status = STATUS_PUBLISHED;
        }

        try {
            if (this.#abortControllers.search) this.#abortControllers.search.abort();
            this.#abortControllers.search = new AbortController();

            if (isUUID(this.search.value.query)) {
                // Check if the fragment with this UUID is already the only one in the store
                const [currentFragment] = dataStore.get() ?? [];
                if (currentFragment?.value.id === this.search.value.query && dataStore.get()?.length === 1) {
                    // Skip search if we already have exactly this fragment
                    Store.fragments.list.loading.set(false);
                    Store.fragments.list.firstPageLoaded.set(true);
                    return;
                }
                const fragmentData = await this.aem.sites.cf.fragments.getById(
                    localSearch.query,
                    this.#abortControllers.search,
                );
                if (fragmentData && fragmentData.path.indexOf(ROOT_PATH) === 0) {
                    const fragmentFolderPath = fragmentData.path.substring(ROOT_PATH.length + 1);
                    const fragmentFolder = fragmentFolderPath.split('/')[0];
                    const surface = fragmentFolder?.toLowerCase();
                    applyCorrectorToFragment(fragmentData, surface);
                    const fragment = await this.#addToCache(fragmentData);
                    const sourceStore = generateFragmentStore(fragment);
                    dataStore.set([sourceStore]);

                    // Update the search path to the fragment's folder
                    if (Store.folders.data.get().includes(fragmentFolder)) {
                        Store.search.set((prev) => ({
                            ...prev,
                            path: fragmentFolder,
                        }));
                    }
                }
            } else {
                const cursor = await this.aem.sites.cf.fragments.search(localSearch, null, this.#abortControllers.search);
                const fragmentStores = [];
                // Extract surface from path for corrector
                const surface = path?.split('/').filter(Boolean)[0]?.toLowerCase();
                for await (const result of cursor) {
                    for await (const item of result) {
                        if (this.skipVariant(variants, item)) continue;
                        // Apply corrector transformer before caching
                        applyCorrectorToFragment(item, surface);
                        const fragment = await this.#addToCache(item);
                        const sourceStore = generateFragmentStore(fragment);
                        fragmentStores.push(sourceStore);
                    }
                    dataStore.set([...fragmentStores]);
                    Store.fragments.list.firstPageLoaded.set(true);
                }
            }

            dataStore.setMeta('path', path);
            dataStore.setMeta('query', query);
            dataStore.setMeta('locale', locale);
            dataStore.setMeta('tags', tags);

            this.#abortControllers.search = null;
        } catch (error) {
            this.processError(error, 'Could not load fragments.');
        }

        Store.fragments.list.loading.set(false);
    }

    async loadRecentlyUpdatedFragments() {
        if (this.page.value !== PAGE_NAMES.WELCOME) return;
        if (this.#abortControllers.recentlyUpdated) this.#abortControllers.recentlyUpdated.abort();
        this.#abortControllers.recentlyUpdated = new AbortController();

        Store.fragments.recentlyUpdated.loading.set(true);

        const dataStore = Store.fragments.recentlyUpdated.data;
        const path = `${this.search.value.path}/${this.filters.value.locale}`;

        if (!looseEquals(dataStore.getMeta('path'), path)) {
            dataStore.set([]);
            dataStore.removeMeta('path');
        }

        try {
            const cursor = await this.aem.sites.cf.fragments.search(
                {
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                    path: `/content/dam/mas/${path}`,
                },
                this.recentlyUpdatedLimit.value,
                this.#abortControllers.recentlyUpdated,
            );

            const result = await cursor.next();
            const fragmentStores = [];
            // Extract surface from path for corrector
            const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
            for await (const item of result.value) {
                // Apply corrector transformer before caching
                applyCorrectorToFragment(item, surface);
                const fragment = await this.#addToCache(item);
                const sourceStore = generateFragmentStore(fragment);
                fragmentStores.push(sourceStore);
            }
            dataStore.set(fragmentStores);

            dataStore.setMeta('path', path);

            this.#abortControllers.recentlyUpdated = null;
        } catch (error) {
            this.processError(error, 'Could not load recently updated fragments.');
        }

        Store.fragments.recentlyUpdated.loading.set(false);
    }

    async loadPlaceholders() {
        try {
            /* If surface is not set yet, skip loading placeholders */
            if (!this.search.value.path) return;

            const dictionaryPath = this.getDictionaryPath();
            try {
                await this.ensureDictionaryIndex(dictionaryPath);
            } catch (error) {
                console.error('Failed to ensure dictionary index:', error);
            }

            const searchOptions = {
                path: dictionaryPath,
                sort: [{ on: 'created', order: 'ASC' }],
            };

            if (this.#abortControllers.placeholders) this.#abortControllers.placeholders.abort();
            this.#abortControllers.placeholders = new AbortController();

            Store.placeholders.list.loading.set(true);

            const fragments = await this.searchFragmentList(searchOptions, 50, this.#abortControllers.placeholders);

            const indexFragment = fragments.find((fragment) => fragment.path.endsWith('/index'));
            if (indexFragment) Store.placeholders.index.set(indexFragment);
            else console.warn('No index fragment found for dictionary path:', dictionaryPath);

            const placeholders = fragments
                .filter((fragment) => !fragment.path.endsWith('/index'))
                .map((fragment) => new FragmentStore(new Placeholder(fragment)));

            Store.placeholders.list.data.set(placeholders);
        } catch (error) {
            this.processError(error, 'Could not load placeholders.');
        } finally {
            Store.placeholders.list.loading.set(false);
        }
    }

    async loadPreviewPlaceholders() {
        if (!this.search.value.path) return;

        const cacheKey = `${this.filters.value.locale}_${this.search.value.path}`;

        // Return cached result if available
        if (this.dictionaryCache.has(cacheKey)) {
            Store.placeholders.preview.set(this.dictionaryCache.get(cacheKey));
            return;
        }

        // Return existing promise if same cache key is already in-flight
        if (this.inflightDictionaryRequest?.cacheKey === cacheKey) {
            return this.inflightDictionaryRequest.promise;
        }

        // Abort previous placeholder fetch if still running with different cache key
        if (this.#abortControllers.placeholders) {
            this.#abortControllers.placeholders.abort();
        }
        this.#abortControllers.placeholders = new AbortController();

        try {
            const promise = this.fetchDictionary(this.#abortControllers.placeholders);
            this.inflightDictionaryRequest = { promise, cacheKey };
            const result = await promise;

            // Verify cache key hasn't changed during fetch (prevents stale data)
            const currentKey = `${this.filters.value.locale}_${this.search.value.path}`;
            if (currentKey === cacheKey) {
                // If result is empty and locale isn't en_US, try fallback
                if ((!result || Object.keys(result).length === 0) && this.filters.value.locale !== 'en_US') {
                    const fallbackContext = {
                        preview: {
                            url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
                        },
                        locale: 'en_US',
                        surface: this.search.value.path,
                        signal: this.#abortControllers.placeholders?.signal,
                    };

                    const fallbackResult = await getDictionary(fallbackContext);
                    this.dictionaryCache.set(cacheKey, fallbackResult);
                    Store.placeholders.preview.set(fallbackResult);
                } else {
                    this.dictionaryCache.set(cacheKey, result);
                    Store.placeholders.preview.set(result);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') return; // Silent abort during navigation
            this.processError(error, 'Could not load preview placeholders.');
        } finally {
            this.inflightDictionaryRequest = null;
            this.#abortControllers.placeholders = null;
            Store.placeholders.list.loading.set(false);
        }
    }

    async fetchDictionary(abortController) {
        const context = {
            preview: {
                url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            },
            locale: this.filters.value.locale,
            surface: this.search.value.path,
            networkConfig: {
                mainTimeout: 15000,
                fetchTimeout: 10000,
                retries: 3,
            },
        };

        // Pass abort signal if available (fragment-client may support it)
        if (abortController) {
            context.signal = abortController.signal;
        }

        return await getDictionary(context);
    }

    async loadPromotions() {
        try {
            const promotionsPath = this.getPromotionsPath();

            const searchOptions = {
                path: promotionsPath,
                sort: [{ on: 'created', order: 'ASC' }],
            };

            if (this.#abortControllers.promotions) this.#abortControllers.promotions.abort();
            this.#abortControllers.promotions = new AbortController();

            Store.promotions.list.loading.set(true);

            const fragments = await this.searchFragmentList(searchOptions, 50, this.#abortControllers.promotions);

            const promotions = fragments.map((fragment) => new FragmentStore(new Promotion(fragment)));

            Store.promotions.list.data.set(promotions);
        } catch (error) {
            this.processError(error, 'Could not load promotions.');
        } finally {
            Store.promotions.list.loading.set(false);
        }
    }

    getPromotionsPath() {
        return `${ROOT_PATH}/promotions`;
    }

    getDictionaryPath() {
        return `${ROOT_PATH}/${Store.surface()}/${Store.localeOrRegion()}/dictionary`;
    }

    parseDictionaryPath(dictionaryPath) {
        if (!dictionaryPath?.startsWith(ROOT_PATH)) return {};
        const relativePath = dictionaryPath.slice(ROOT_PATH.length).replace(/^\/+/, '');

        // Expected structure: [surface segments...]/[locale]/dictionary
        const match = relativePath.match(/^(?<surfacePath>.*?)\/(?<locale>[^/]+)\/dictionary$/);
        if (!match) return {};

        const { surfacePath = '', locale } = match.groups;
        const surfaceRoot = surfacePath.split('/').filter(Boolean)[0] ?? '';

        return {
            locale,
            surfacePath,
            surfaceRoot,
        };
    }

    getDictionaryFolderPath(surfacePath, locale) {
        if (!locale) return null;
        const trimmedSurface = surfacePath?.replace(/^\/+|\/+$/g, '') ?? '';
        const prefix = trimmedSurface ? `${ROOT_PATH}/${trimmedSurface}` : ROOT_PATH;
        return `${prefix}/${locale}/dictionary`;
    }

    async ensureDictionaryFolder(dictionaryPath) {
        if (!dictionaryPath) return false;
        const normalized = dictionaryPath.replace(/\/+$/, '');
        if (!normalized) return false;

        const parentPath = normalized.slice(0, normalized.lastIndexOf('/'));
        const folderName = normalized.slice(parentPath.length + 1);
        if (!parentPath || !folderName) return false;

        // Check if dictionary folder already exists
        let parentListResult;
        try {
            parentListResult = await this.aem.folders.list(parentPath);
        } catch (error) {
            console.warn('An error occurred while checking dictionary folder. Placeholder feature may be degraded:', error);
            return false;
        }

        const { children = [] } = parentListResult ?? {};
        const exists = children.some((child) => child.path === normalized || child.name === folderName);
        if (exists) return true;

        try {
            await this.aem.folders.create(parentPath, folderName, folderName);
            return true;
        } catch (error) {
            if (error.message?.includes('409')) return true;
            console.warn('An error occurred while creating dictionary folder. Placeholder feature may be degraded:', error);
            return false;
        }
    }

    async fetchIndexFragment(indexPath) {
        try {
            return await this.aem.sites.cf.fragments.getByPath(indexPath);
        } catch (error) {
            const message = error.message?.toLowerCase() ?? '';
            if (message.includes('404') || message.includes('not found')) return null;
            throw error;
        }
    }

    ensureReferenceField(fields, fieldName, value) {
        const field = fields.find((item) => item.name === fieldName);
        const desiredValues = value ? [value] : [];

        if (field) {
            const currentValues = Array.isArray(field.values) ? field.values : [];
            const sameValues =
                currentValues.length === desiredValues.length &&
                currentValues.every((item, index) => item === desiredValues[index]);
            if (sameValues && field.type === 'content-fragment' && field.multiple === false) {
                return { fields, changed: false };
            }
            Object.assign(field, {
                type: 'content-fragment',
                multiple: false,
                locked: false,
                values: desiredValues,
            });
            return { fields, changed: true };
        }

        fields.push({
            name: fieldName,
            type: 'content-fragment',
            multiple: false,
            locked: false,
            values: desiredValues,
        });
        return { fields, changed: true };
    }

    async ensureIndexFallbackFields(indexFragment, parentReference) {
        if (!indexFragment || !parentReference) return indexFragment;

        const fields = [...(indexFragment.fields ?? [])];
        const result = this.ensureReferenceField(fields, 'parent', parentReference);

        if (!result.changed) return indexFragment;

        try {
            const saved = await this.aem.sites.cf.fragments.save({
                ...indexFragment,
                fields,
            });
            return saved ?? indexFragment;
        } catch (error) {
            console.error('Failed to save dictionary index fallback fields:', error);
            return indexFragment;
        }
    }

    async createDictionaryIndexFragment({ parentPath, parentReference, publish = true }) {
        try {
            const fields = [
                {
                    name: 'parent',
                    type: 'content-fragment',
                    multiple: false,
                    locked: false,
                    values: parentReference ? [parentReference] : [],
                },
                {
                    name: 'entries',
                    type: 'content-fragment',
                    multiple: true,
                    values: [],
                },
            ];

            const indexFragment = await this.aem.sites.cf.fragments.create({
                parentPath,
                modelId: DICTIONARY_INDEX_MODEL_ID,
                name: 'index',
                title: 'Dictionary Index',
                description: 'Index of dictionary placeholders',
                fields,
            });

            if (!indexFragment?.id) {
                console.error('Failed to create dictionary index fragment');
                return null;
            }

            if (publish) {
                await this.publishFragment(indexFragment, [], false);
            }
            return indexFragment;
        } catch (error) {
            console.error('Failed to create dictionary index fragment:', error);
            return null;
        }
    }

    async ensureDictionaryIndex(dictionaryPath, visited = new Set()) {
        if (!dictionaryPath) return null;
        if (visited.has(dictionaryPath)) {
            try {
                return await this.fetchIndexFragment(`${dictionaryPath}/index`);
            } catch (error) {
                console.error(`Failed to fetch already visited dictionary index for ${dictionaryPath}:`, error);
                return null;
            }
        }
        visited.add(dictionaryPath);

        const { locale, surfacePath, surfaceRoot } = this.parseDictionaryPath(dictionaryPath);
        if (!locale || !surfacePath) return null;

        const indexPath = `${dictionaryPath}/index`;
        let indexFragment = await this.fetchIndexFragment(indexPath);
        const currentParent = indexFragment?.fields?.find((f) => f.name === 'parent')?.values?.[0] ?? null;

        let parentReference = null;
        const fallbackLocale = getLocaleCode(getDefaultLocale(locale, surfaceRoot));
        const surfaceFallbackLocale = fallbackLocale && fallbackLocale !== locale ? fallbackLocale : null;
        const acomFallbackLocale = fallbackLocale ?? locale;

        const sameSurfaceDictionaryPath = surfaceFallbackLocale
            ? this.getDictionaryFolderPath(surfacePath, surfaceFallbackLocale)
            : null;

        // 2. Check surface language fallback (same surface, fallback locale)
        if (sameSurfaceDictionaryPath) {
            try {
                const sameSurfaceIndex = await this.ensureDictionaryIndex(sameSurfaceDictionaryPath, visited);
                if (sameSurfaceIndex?.path) parentReference = sameSurfaceIndex.path;
            } catch (error) {
                console.error(`Failed to ensure same-surface fallback index for ${sameSurfaceDictionaryPath}:`, error);
            }
        }

        // 3. Check ACOM language fallback (ACOM surface, fallback locale or current locale)
        if (!parentReference && surfaceRoot !== SURFACES.ACOM.name && acomFallbackLocale) {
            const acomFallbackPath = this.getDictionaryFolderPath(SURFACES.ACOM.name, acomFallbackLocale);
            if (acomFallbackPath) {
                try {
                    const acomIndex = await this.ensureDictionaryIndex(acomFallbackPath, visited);
                    if (acomIndex?.path) parentReference = acomIndex.path;
                } catch (error) {
                    console.error(`Failed to ensure ACOM fallback index for ${acomFallbackPath}:`, error);
                }
            }
        }

        if (!indexFragment) {
            const hasDictionaryFolder = await this.ensureDictionaryFolder(dictionaryPath);
            if (!hasDictionaryFolder) {
                console.error(`Failed to ensure dictionary folder exists: ${dictionaryPath}`);
                return null;
            }

            indexFragment = await this.createDictionaryIndexFragment({
                parentPath: dictionaryPath,
                parentReference,
            });
            if (!indexFragment) return null;
        } else if (parentReference && currentParent !== parentReference) {
            indexFragment = await this.ensureIndexFallbackFields(indexFragment, parentReference);
        }

        return indexFragment;
    }

    getTranslationsPath() {
        const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        return surface ? `${ROOT_PATH}/${surface}/translations` : null;
    }

    async loadTranslationProjects() {
        try {
            const translationsPath = this.getTranslationsPath();
            if (!translationsPath) return;
            if (this.#abortControllers.translations) this.#abortControllers.translations.abort();
            this.#abortControllers.translations = new AbortController();
            Store.translationProjects.list.loading.set(true);
            const fragments = await this.searchFragmentList(
                { path: translationsPath },
                50,
                this.#abortControllers.translations,
            );
            const translationProjects = fragments.map((fragment) => new FragmentStore(new TranslationProject(fragment)));
            Store.translationProjects.list.data.set(translationProjects);
        } catch (error) {
            this.processError(error, 'Could not load translation projects.');
        } finally {
            Store.translationProjects.list.loading.set(false);
        }
    }
    /**
     * Helper method to create fragment fields from data object
     * @param {Object} data - The data object containing field values
     * @param {Array} existingFields - Any existing fields to include
     * @returns {Array} The complete fields array
     */
    createFieldsFromData(data, existingFields = []) {
        if (!data) return existingFields;

        return Object.entries(data)
            .filter(([key, value]) => value !== undefined)
            .reduce(
                (fields, [key, value]) => {
                    if (key === 'tags') {
                        fields.push({ name: key, type: 'tag', values: value });
                    } else {
                        const type = key === 'locReady' ? 'boolean' : 'text';
                        fields.push({ name: key, type, values: [value] });
                    }
                    return fields;
                },
                [...existingFields],
            );
    }

    /**
     * @param {object} fragmentData
     * @param {boolean} withToast
     * @returns {Promise<Fragment>}
     */
    async createFragment(fragmentData, withToast = true) {
        try {
            if (withToast) showToast('Creating fragment...');

            this.operation.set(OPERATIONS.CREATE);

            const fields = this.createFieldsFromData(fragmentData.data, fragmentData.fields || []);

            const result = await this.aem.sites.cf.fragments.create({
                ...fragmentData,
                description: fragmentData.description || '',
                fields,
                parentPath: fragmentData.parentPath || this.parentPath,
            });
            let latest = await this.aem.sites.cf.fragments.getById(result.id);
            if (fragmentData.data?.tags?.length) {
                latest.newTags = fragmentData.data.tags;
                await this.aem.saveTags(latest);
                latest = await this.aem.sites.cf.fragments.getById(result.id);
            }
            // Apply corrector transformer before caching
            const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
            applyCorrectorToFragment(latest, surface);
            const fragment = await this.#addToCache(latest);

            if (withToast) showToast('Fragment successfully created.', 'positive');

            return fragment;
        } catch (error) {
            if (error.message.includes(': 409')) {
                throw error;
            } else {
                this.processError(error, 'Failed to create fragment.');
            }
        } finally {
            this.operation.set(null);
        }
    }

    async #addToCache(fragmentData) {
        await initFragmentCache();
        for (const reference of fragmentData.references || []) {
            if (fragmentCache.has(reference.id)) continue;
            await this.#addToCache(reference);
        }
        let fragment = fragmentCache.get(fragmentData.id);
        if (!fragment) {
            fragment = new Fragment(fragmentData);
            fragmentCache.add(fragment);
        }
        return fragment;
    }

    /**
     * Unified method to save a fragment (regular or dictionary)
     * @param {FragmentStore} fragmentStore - The fragment to save
     * @param {boolean} withToast - Whether to show toast notifications
     * @returns {Promise<Object>} The saved fragment
     */
    async saveFragment(fragmentStore, withToast = true) {
        if (withToast) showToast('Saving fragment...');
        const fragmentToSave = fragmentStore.get();
        const tags = fragmentToSave.getField('tags')?.values || [];
        const hasOfferlessTag = tags.some((tag) => tag?.includes('offerless'));
        if (fragmentToSave.model?.path === CARD_MODEL_PATH && !fragmentToSave.getFieldValue('osi') && !hasOfferlessTag) {
            if (withToast) showToast('Please select offer', 'negative');
            return false;
        }
        this.operation.set(OPERATIONS.SAVE);

        try {
            const savedFragment = await this.aem.sites.cf.fragments.save(fragmentToSave);
            if (!savedFragment) throw new Error('Invalid fragment.');

            fragmentStore.refreshFrom(savedFragment);
            fragmentCache.remove(savedFragment.id);
            fragmentCache.add(new Fragment(savedFragment));
            if (withToast) showToast('Fragment successfully saved.', 'positive');
            return savedFragment;
        } catch (error) {
            this.processError(error, 'Failed to save fragment.');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async copyFragment(updatedTitle, osi, tags = []) {
        try {
            this.operation.set(OPERATIONS.CLONE);
            const result = await this.aem.sites.cf.fragments.copy(this.fragmentInEdit);
            let savedResult = result;
            const needsSave = (updatedTitle && updatedTitle !== result.title) || osi;
            if (needsSave) {
                if (updatedTitle && updatedTitle !== result.title) {
                    result.title = updatedTitle;
                }
                result.fields.forEach((field) => {
                    if (osi && field.name === 'osi') {
                        field.values = [osi];
                    }
                });
                savedResult = await this.aem.sites.cf.fragments.save(result);
            }
            if (tags.length) {
                savedResult.newTags = tags;
                await this.aem.saveTags(savedResult);
                savedResult = await this.aem.sites.cf.fragments.getById(savedResult.id);
            }
            // Apply corrector transformer before caching
            const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
            applyCorrectorToFragment(savedResult, surface);
            const newFragment = await this.#addToCache(savedResult);

            const sourceStore = generateFragmentStore(newFragment);
            sourceStore.get().hasChanges = false;
            Store.fragments.list.data.set((prev) => [sourceStore, ...prev]);
            this.skipVariationDetection = true;
            await router.navigateToFragmentEditor(newFragment.id);

            this.operation.set();
            Events.fragmentAdded.emit(newFragment.id);
            showToast('Fragment successfully copied.', 'positive');
            return true;
        } catch (error) {
            this.operation.set();
            this.processError(error, 'Failed to copy fragment.');
        }
        return false;
    }

    /**
     * @param {Fragment} fragment Fragment to publish
     * @param {boolean} withToast Whether or not to display toasts
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async publishFragment(fragment, publishReferencesWithStatus = ['DRAFT', 'UNPUBLISHED'], withToast = true) {
        try {
            this.operation.set(OPERATIONS.PUBLISH);
            await this.aem.sites.cf.fragments.publish(fragment, publishReferencesWithStatus);
            if (withToast) showToast('Fragment successfully published.', 'positive');

            return true;
        } catch (error) {
            this.processError(error, 'Failed to publish fragment.');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * Publish multiple fragments in bulk
     * @param {Array<string>} fragmentIds - Array of fragment IDs to publish
     * @param {object} options - Options object
     * @param {Array<string>} options.publishReferencesWithStatus - Statuses to include references for
     * @param {boolean} options.withToast - Whether to show toast notifications
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async bulkPublishFragments(fragmentIds, options = {}) {
        const { publishReferencesWithStatus = ['DRAFT', 'UNPUBLISHED'], withToast = true } = options;

        if (!fragmentIds || fragmentIds.length === 0) {
            if (withToast) showToast('No fragments selected to publish.', 'negative');
            return false;
        }

        try {
            this.operation.set(OPERATIONS.PUBLISH);
            if (withToast) showToast(`Publishing ${fragmentIds.length} fragment(s)...`);

            // Get fragment objects from the store
            const fragments = fragmentIds
                .map((id) => {
                    const store = Store.fragments.list.data.get().find((fragmentStore) => fragmentStore.get()?.id === id);
                    return store?.get();
                })
                .filter(Boolean);

            if (fragments.length === 0) {
                if (withToast) showToast('No valid fragments found to publish.', 'negative');
                return false;
            }

            // Publish all fragments in a single request
            await this.aem.sites.cf.fragments.publishFragments(fragments, publishReferencesWithStatus);

            // Refresh all published fragments
            const refreshPromises = fragmentIds.map((id) => {
                const store = Store.fragments.list.data.get().find((fragmentStore) => fragmentStore.get()?.id === id);
                if (store) {
                    return this.refreshFragment(store);
                }
                return Promise.resolve();
            });
            await Promise.all(refreshPromises);

            if (withToast) {
                showToast(`Successfully published ${fragments.length} fragment(s).`, 'positive');
            }

            return true;
        } catch (error) {
            this.processError(error, 'Failed to publish fragments.');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * @param {Fragment} fragment Fragment to delete
     * @param {object} options
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async deleteFragment(fragment, { startToast = true, endToast = true } = {}) {
        try {
            this.operation.set(OPERATIONS.DELETE);
            if (startToast) showToast('Deleting fragment...');

            const fragmentWithEtag = await this.aem.sites.cf.fragments.getWithEtag(fragment.id);

            if (fragmentWithEtag) await this.aem.sites.cf.fragments.delete(fragmentWithEtag);

            if (endToast) showToast('Fragment successfully deleted.', 'positive');

            Events.fragmentDeleted.emit(fragment);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to delete fragment');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    /**
     * Deletes multiple fragments in parallel, using the 'deleteFragment' method
     * @param {Fragment[]} fragments Fragments to delete
     * @param {object} options
     */
    async bulkDeleteFragments(fragments, options) {
        const promises = fragments.map((fragment) => this.deleteFragment(fragment, options));
        return Promise.all(promises);
    }

    /**
     * Deletes a fragment and all its locale variations
     * @param {Fragment} fragment - The parent fragment to delete
     * @returns {Promise<{success: boolean, failedVariations: string[]}>}
     */
    async deleteFragmentWithVariations(fragment) {
        const variations = fragment.getVariations();
        const failedVariations = [];

        if (variations.length > 0) {
            showToast(`Deleting fragment and ${variations.length} variation(s)...`);

            try {
                const latestParent = await this.aem.sites.cf.fragments.getWithEtag(fragment.id);
                if (latestParent) {
                    const variationsField = latestParent.fields.find((f) => f.name === 'variations');
                    if (variationsField && variationsField.values?.length > 0) {
                        variationsField.values = [];
                        await this.aem.sites.cf.fragments.save(latestParent);
                    }
                }
            } catch (error) {
                console.error('Failed to clear parent variations field:', error);
            }

            for (const variationPath of variations) {
                try {
                    await this.aem.sites.cf.fragments.forceDelete({ path: variationPath });
                } catch (error) {
                    console.error(`Failed to delete variation ${variationPath}:`, error);
                    failedVariations.push(variationPath);
                }
            }
        }

        let success = false;
        if (variations.length > 0) {
            try {
                await this.aem.sites.cf.fragments.forceDelete({ path: fragment.path });
                success = true;
            } catch (error) {
                console.error(`Failed to force delete parent fragment:`, error);
            }
        } else {
            success = await this.deleteFragment(fragment, {
                startToast: true,
                endToast: false,
            });
            if (!success) {
                console.warn('Regular delete failed, trying force delete');
                try {
                    await this.aem.sites.cf.fragments.forceDelete({ path: fragment.path });
                    success = true;
                } catch (forceError) {
                    console.error('Force delete also failed:', forceError);
                }
            }
        }

        if (success) {
            if (failedVariations.length > 0) {
                showToast(`Fragment deleted but ${failedVariations.length} variation(s) failed to delete`, 'warning');
            } else if (variations.length > 0) {
                showToast('Fragment and all variations successfully deleted.', 'positive');
            } else {
                showToast('Fragment successfully deleted.', 'positive');
            }
        }

        return { success, failedVariations };
    }

    /**
     * Creates an empty variation fragment for the given parent fragment in a target locale.
     * @param {Object} parentFragment - The parent fragment to create a variation from
     * @param {string} targetLocale - The target locale for the variation (e.g., 'en_GB')
     * @returns {Promise<Object>} The created variation fragment
     */
    async createEmptyVariation(parentFragment, targetLocale) {
        if (!parentFragment?.path || !parentFragment?.model?.id) {
            throw new Error('Invalid parent fragment');
        }

        const parentPath = parentFragment.path;
        const pathParts = parentPath.split('/');
        const fragmentName = pathParts.pop();

        const sourceLocaleIndex = pathParts.findIndex((part) => /^[a-z]{2}_[A-Z]{2}$/.test(part));
        if (sourceLocaleIndex === -1) {
            throw new Error('Could not determine source locale from parent path');
        }

        pathParts[sourceLocaleIndex] = targetLocale;
        const targetFolder = pathParts.join('/');

        await this.aem.sites.cf.fragments.ensureFolderExists(targetFolder);

        const targetPath = `${targetFolder}/${fragmentName}`;
        const existingFragment = await this.aem.sites.cf.fragments.getByPath(targetPath).catch(() => null);
        if (existingFragment) {
            throw new Error(`A variation already exists at ${targetPath}`);
        }

        const newFragment = await this.aem.sites.cf.fragments.create({
            title: parentFragment.title,
            description: parentFragment.description,
            modelId: parentFragment.model.id,
            parentPath: targetFolder,
            name: fragmentName,
            fields: [],
        });

        if (parentFragment.tags?.length) {
            await this.aem.sites.cf.fragments.copyFragmentTags(newFragment, parentFragment.tags);
        }

        return this.aem.sites.cf.fragments.pollCreatedFragment(newFragment);
    }

    /**
     * Updates the parent fragment's variations field to include a new variation path.
     * @param {Object} parentFragment - The parent fragment to update
     * @param {string} variationPath - The path of the variation to add
     * @returns {Promise<Object>} The updated parent fragment
     */
    async updateParentVariations(parentFragment, variationPath) {
        const variationsField = parentFragment.fields.find((f) => f.name === 'variations');
        const currentVariations = variationsField?.values || [];

        if (currentVariations.includes(variationPath)) {
            return parentFragment;
        }

        const updatedVariations = [...currentVariations, variationPath];

        const latestParent = await this.aem.sites.cf.fragments.getWithEtag(parentFragment.id);
        if (!latestParent) {
            throw new Error('Failed to retrieve parent fragment for update');
        }

        const updatedFields = latestParent.fields.map((field) => {
            if (field.name === 'variations') {
                return { ...field, values: updatedVariations };
            }
            return field;
        });

        if (!variationsField) {
            updatedFields.push({
                name: 'variations',
                type: 'content-fragment',
                multiple: true,
                values: updatedVariations,
            });
        }

        await this.aem.sites.cf.fragments.save({
            id: parentFragment.id,
            title: latestParent.title,
            description: latestParent.description,
            fields: updatedFields,
            etag: latestParent.etag,
        });

        return this.aem.sites.cf.fragments.pollUpdatedFragment(latestParent);
    }

    /**
     * Removes a variation path from the parent fragment's variations field.
     * @param {Object} parentFragment - The parent fragment to update
     * @param {string} variationPath - The path of the variation to remove
     * @returns {Promise<Object>} The updated parent fragment
     */
    async removeFromParentVariations(parentFragment, variationPath) {
        const latestParent = await this.aem.sites.cf.fragments.getWithEtag(parentFragment.id);
        if (!latestParent) {
            throw new Error('Failed to retrieve parent fragment for update');
        }

        const variationsField = latestParent.fields.find((f) => f.name === 'variations');
        const currentVariations = variationsField?.values || [];

        if (!currentVariations.includes(variationPath)) {
            return latestParent;
        }

        const updatedVariations = currentVariations.filter((v) => v !== variationPath);

        const updatedFields = latestParent.fields.map((field) => {
            if (field.name === 'variations') {
                return { ...field, values: updatedVariations };
            }
            return field;
        });

        await this.aem.sites.cf.fragments.save({
            id: parentFragment.id,
            title: latestParent.title,
            description: latestParent.description,
            fields: updatedFields,
            etag: latestParent.etag,
        });

        return this.aem.sites.cf.fragments.pollUpdatedFragment(latestParent);
    }

    async getExistingVariationLocales(fragmentId) {
        const fragment = await this.aem.sites.cf.fragments.getById(fragmentId);
        if (!fragment) return [];

        const variationsField = fragment.fields?.find((f) => f.name === 'variations');
        const variationPaths = variationsField?.values || [];

        return variationPaths.map((path) => extractLocaleFromPath(path)).filter(Boolean);
    }

    async createVariation(fragmentId, targetLocale, isVariation = false) {
        if (isVariation) {
            throw new Error('Cannot create a variation from another variation. Please use the default locale fragment.');
        }

        const parentFragment = await this.aem.sites.cf.fragments.getById(fragmentId);
        if (!parentFragment) {
            throw new Error('Failed to fetch parent fragment');
        }

        const variationFragment = await this.createEmptyVariation(parentFragment, targetLocale);
        if (!variationFragment) {
            throw new Error('Failed to create variation');
        }

        await this.updateParentVariations(parentFragment, variationFragment.path);

        return variationFragment;
    }

    async createPlaceholder(placeholder) {
        try {
            const folderPath = this.search.value.path;
            const locale = this.filters.value.locale;
            if (!folderPath || !locale) return false;

            const dictionaryPath = this.getDictionaryPath();

            const typeMap = {
                richTextValue: 'long-text',
                locReady: 'boolean',
            };

            const fields = {
                key: placeholder.key,
                value: placeholder.isRichText ? '' : placeholder.value,
                richTextValue: placeholder.isRichText ? placeholder.value : '',
                locReady: true,
            };

            const payload = {
                name: placeholder.key,
                parentPath: dictionaryPath,
                modelId: DICTIONARY_ENTRY_MODEL_ID,
                title: placeholder.key,
                description: `Placeholder for ${placeholder.key}`,
                fields: Object.keys(fields).map((key) => ({
                    name: key,
                    type: typeMap[key] || 'text',
                    values: [fields[key]],
                })),
            };

            const fragment = await this.createFragment(payload, false);
            const newPlaceholder = new Placeholder(fragment);
            newPlaceholder.updateField('tags', [TAG_STATUS_DRAFT]);
            await this.aem.saveTags(newPlaceholder);

            const addedToIndex = await this.addToIndexFragment(newPlaceholder);
            if (!addedToIndex) throw new Error('Failed to update index fragment with new placeholder reference');

            Store.placeholders.list.data.set((prev) => [...prev, new FragmentStore(newPlaceholder)]);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to create');
            return false;
        }
    }

    /**
     * @param {Fragment} fragment
     * @returns {{ parentPath: string, fragmentPath: string }}
     */
    getParentPath(fragment) {
        const parentPath = fragment.path.substring(0, fragment.path.lastIndexOf('/'));
        if (!parentPath) throw new Error(`Failed to determine dictionary path from fragment path: ${fragment.path}`);
        return parentPath;
    }

    /**
     * @param {string} path
     * @returns {Promise<Fragment | null>}
     */
    async getIndexFragment(path) {
        try {
            const indexFragment = await this.aem.sites.cf.fragments.getByPath(path);
            return new Fragment(indexFragment);
        } catch (error) {
            return null;
        }
    }

    async addToIndexFragment(fragment) {
        const parentPath = this.getParentPath(fragment);

        const indexPath = `${parentPath}/index`;

        const indexFragment = await this.getIndexFragment(indexPath);
        if (!indexFragment) {
            console.error(`Index fragment does not exist at ${indexPath}.`);
            return false;
        }

        try {
            const entriesField = indexFragment.getField('entries');
            if (!entriesField) {
                console.error(`Index fragment at ${indexPath} is missing entries field`);
                return false;
            }

            const shouldUpdate = !entriesField.values.includes(fragment.path);

            let updatedIndexFragment = indexFragment;
            if (shouldUpdate) {
                indexFragment.updateField('entries', [...entriesField.values, fragment.path]);
                updatedIndexFragment = await this.aem.sites.cf.fragments.save(indexFragment);
            } else {
                console.info(`Fragment already added to index: ${fragment.path}`);
            }

            await this.publishFragment(updatedIndexFragment, [], false);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to add fragment to index.');
            return false;
        }
    }

    async removeFromIndexFragment(fragments) {
        const fragmentsToRemove = !Array.isArray(fragments) ? [fragments] : fragments;

        const parentPath = this.getParentPath(fragmentsToRemove[0]);

        const indexPath = `${parentPath}/index`;

        const indexFragment = await this.getIndexFragment(indexPath);
        if (!indexFragment) return false;

        try {
            const entries = indexFragment.getField('entries');
            let shouldUpdate = false;
            for (const fragment of fragmentsToRemove) {
                if (entries.values.includes(fragment.path)) {
                    shouldUpdate = true;
                    break;
                }
            }

            let updatedIndexFragment = indexFragment;
            if (shouldUpdate) {
                const fragmentPaths = fragmentsToRemove.map((fragment) => fragment.path);
                indexFragment.updateField(
                    'entries',
                    entries.values.filter((entry) => !fragmentPaths.includes(entry)),
                );
                updatedIndexFragment = await this.aem.sites.cf.fragments.save(indexFragment);
            } else {
                console.info(`Fragment(s) already added to index.`);
            }

            await this.publishFragment(updatedIndexFragment, [], false);

            return true;
        } catch (error) {
            this.processError(error, 'Failed to add fragment(s) to index.');
            return false;
        }
    }

    /**
     * Updates a given fragment store with the latest data
     * @param {FragmentStore} store
     */
    async refreshFragment(store) {
        store.setLoading(true);
        const id = store.get().id;
        const latest = await this.aem.sites.cf.fragments.getById(id);

        // Apply corrector transformer before refreshing
        const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        applyCorrectorToFragment(latest, surface);

        store.refreshFrom(latest);
        this.#addToCache(store.get());
        store.setLoading(false);
    }

    /**
     * Fetches a fragment by its path to get the latest version
     * @param {string} path - Path to the fragment
     * @returns {Promise<Object>} - The latest fragment data
     */
    async getFragmentByPath(path) {
        if (!path) {
            throw new Error('Fragment path is required');
        }

        if (path.includes('/dictionary/')) {
            return {
                path,
                id: 'stub-fragment-id',
                etag: 'stub-etag',
                fields: [],
                status: 'PUBLISHED',
            };
        }

        if (!this.aem) {
            throw new Error('AEM client not initialized');
        }

        const encodedPath = encodeURIComponent(path);
        const url = `${this.aem.cfFragmentsUrl}/api/assets/${encodedPath}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.aem?.headers || {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Fragment not found at path: ${path}`);
        }

        return await response.json();
    }

    /**
     * Populates the store with addon placeholders by filtering for keys that start with 'addon-'
     * Uses the preview dictionary (loaded via odinpreview) instead of slow AEM search
     */
    async loadAddonPlaceholders() {
        if (Store.placeholders.addons.data.get().length > 1) return;
        Store.placeholders.addons.loading.set(true);
        try {
            await this.loadPreviewPlaceholders();
            const dictionary = Store.placeholders.preview.get();
            if (dictionary) {
                const addonFragments = Object.keys(dictionary)
                    .filter((key) => /^addon-/.test(key))
                    .map((key) => ({ value: key, itemText: key }));
                Store.placeholders.addons.data.set((prev) => [...prev, ...addonFragments]);
            }
        } catch (error) {
            this.processError(error, 'Could not load addon placeholders.');
        } finally {
            Store.placeholders.addons.loading.set(false);
        }
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-repository', MasRepository);
