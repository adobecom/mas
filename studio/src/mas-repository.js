import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import Store from './store.js';
import router from './router.js';
import { AEM, filterByTags } from './aem/aem.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import {
    debounce,
    looseEquals,
    showToast,
    UserFriendlyError,
    extractLocaleFromPath,
    extractSurfaceFromPath,
    isUUID,
    matchesContentTypeFilter,
    resolveContentTypeFilters,
} from './utils.js';
import {
    OPERATIONS,
    STATUS_PUBLISHED,
    TAG_STATUS_PUBLISHED,
    ROOT_PATH,
    PAGE_NAMES,
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
    EDITABLE_FRAGMENT_MODEL_IDS,
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    COMPAT_VERSION,
    MAS_PRODUCT_CODE_PREFIX,
    PZN_FOLDER,
    SURFACES,
    BULK_PUBLISH_PROJECTS_FOLDER,
    COMPARE_CHART_FIELD,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD_COLLECTION,
} from './constants.js';
import { applyFragmentListFilters } from './fragments/fragment-list-filters.js';
import * as promotionsRepository from './promotions/promotions-repository.js';
import {
    clearDictionaryCache,
    fetchDictionary,
    getDictionaryPath,
    loadPlaceholders,
    loadPreviewPlaceholders,
} from './placeholders/mas-placeholders-repository.js';
import { fragmentHasPersonalizationTag, isPznCountryTagId, PZN_TAG_ID_PREFIX } from './common/utils/personalization-utils.js';
import { findFragmentDataById, findFragmentStoreById } from './common/utils/fragment-selection-utils.js';
import { getFragmentName } from './translation/translation-utils.js';
import { getItemsSelectionStore } from './common/items-selection-store.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';
import { getDefaultLocaleCode } from '../../io/www/src/fragment/locales.js';
import { applyCorrectorToFragment } from './utils/corrector-helper.js';
import {
    classifyVariationByPath,
    resolveLocaleVariationParentPath,
    resolvePromoVariationParentPath,
    VARIATION_SEARCH_TABS,
} from './utils/variation-search.js';
import { getFragmentByPathOrNull } from './promotions/promotion-model.js';
import { Promotion } from './aem/promotion.js';

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

function ensureCompatVersionOnMerchCardFieldList(modelPath, fields) {
    if (modelPath !== CARD_MODEL_PATH) return false;
    const idx = fields.findIndex((f) => f.name === 'compatVersion');
    const valuesEmpty = (vals) => !vals?.length || vals[0] === '' || vals[0] == null;
    if (idx === -1) {
        fields.push({ name: 'compatVersion', type: 'number', values: [COMPAT_VERSION] });
        return true;
    }
    if (valuesEmpty(fields[idx].values)) {
        fields[idx] = { ...fields[idx], type: fields[idx].type || 'number', values: [COMPAT_VERSION] };
        return true;
    }
    return false;
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
            promotions: null,
            translations: null,
            collections: null,
            bulkPublish: null,
        };
        this.saveFragment = this.saveFragment.bind(this);
        this.copyFragment = this.copyFragment.bind(this);
        this.publishFragment = this.publishFragment.bind(this);
        this.unpublishFragment = this.unpublishFragment.bind(this);
        this.deleteFragment = this.deleteFragment.bind(this);
        this.search = new StoreController(this, Store.search);
        this.promotionsItemPickerSurface = new StoreController(this, Store.promotions.itemPickerSurface);
        this.filters = new StoreController(this, Store.filters);
        this.page = new StoreController(this, Store.page);
        this.foldersLoaded = new StoreController(this, Store.folders.loaded);
        this.reactiveController = new ReactiveController(this, [Store.profile, Store.createdByUsers]);
        this.recentlyUpdatedLimit = new StoreController(this, Store.fragments.recentlyUpdated.limit);
        this.handleSearch = debounce(this.handleSearch.bind(this), 50);
    }

    /** @type {{ search: AbortController | null, recentlyUpdated: AbortController | null }} */
    #abortControllers;
    #searchCursor = null;
    #addonPlaceholdersRequest = null;

    #applyFragmentListFilters(fragmentStores) {
        return applyFragmentListFilters(fragmentStores, {
            page: this.page.value,
            personalizationFilterEnabled: this.filters.value.personalizationFilterEnabled,
        });
    }

    /** @type {AEM} */
    aem;

    connectedCallback() {
        super.connectedCallback();
        if (!(this.bucket || this.baseUrl)) throw new Error('Either the bucket or baseUrl attribute is required.');
        this.aem = new AEM(this.bucket, this.baseUrl);

        Store.filters.subscribe(this.#onFiltersChange);
        Store.search.subscribe(this.#onSearchChange);

        Events.fragmentAdded.subscribe(this.#stampLastEdit);
        Events.fragmentDeleted.subscribe(this.#stampLastEdit);
        Events.fragmentSaved.subscribe(this.#stampLastEdit);

        this.loadFolders();
        this.style.display = 'none';
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.filters.unsubscribe(this.#onFiltersChange);
        Store.search.unsubscribe(this.#onSearchChange);
        Events.fragmentAdded.unsubscribe(this.#stampLastEdit);
        Events.fragmentDeleted.unsubscribe(this.#stampLastEdit);
        Events.fragmentSaved.unsubscribe(this.#stampLastEdit);
    }

    #stampLastEdit = () => Store.fragments.list.data.setMeta('lastEdit', Date.now());

    #onFiltersChange = () => {
        clearDictionaryCache();
        if (this.page.value === PAGE_NAMES.CONTENT) {
            this.#searchCursor = null;
        }
    };

    #onSearchChange = () => {
        clearDictionaryCache();
        this.#searchCursor = null;
    };

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
                void this.loadPromotions();
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
            case PAGE_NAMES.SETTINGS:
            case PAGE_NAMES.SETTINGS_EDITOR:
                this.loadAddonPlaceholders();
                break;
            case PAGE_NAMES.PROMOTIONS:
                this.loadPromotions();
                break;
            case PAGE_NAMES.TRANSLATIONS:
                this.loadTranslationProjects();
                break;
            case PAGE_NAMES.BULK_PUBLISH:
                this.loadBulkPublishProjects();
                break;
            case PAGE_NAMES.TRANSLATION_EDITOR:
            case PAGE_NAMES.BULK_PUBLISH_EDITOR:
            case PAGE_NAMES.PROMOTIONS_EDITOR:
                this.searchFragments();
                break;
        }
    }

    async loadFolders() {
        try {
            const { children } = await this.aem.folders.list(ROOT_PATH);
            const ignore = window.localStorage.getItem('ignore_folders') || ['images', 'promotions', 'bulk-publish-projects'];
            const folders = children.map((folder) => folder.name).filter((child) => !ignore.includes(child));

            Store.folders.loaded.set(true);
            Store.folders.data.set(folders);

            if (!folders.includes(this.search.value.path) && !this.search.value.query)
                Store.search.set((prev) => ({
                    ...prev,
                    path: SURFACES.SANDBOX.name,
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

    #skipVariant(variants, item) {
        if (Fragment.isGroupedVariationPath(item.path)) return true;
        const variant = item.fields.find((field) => field.name === 'variant')?.values?.[0];
        return variants.length && !variants.includes(variant);
    }

    /**
     * Builds a lowercase haystack covering title, description, path, and every string-valued
     * field. AEM's fullText index only covers title+description, so this is what makes
     * searches like "Photoshop" match cards whose product name lives in cardTitle/description fields.
     */
    #queryHaystack(item) {
        const parts = [item.title || '', item.description || '', item.path || ''];
        for (const field of item.fields || []) {
            for (const value of field.values || []) {
                if (typeof value === 'string') parts.push(value);
            }
        }
        return parts.join('\n').toLowerCase();
    }

    /** Pass `query` already lowercased to avoid re-lowercasing once per item. */
    #skipQuery(query, item) {
        if (!query) return false;
        return !this.#queryHaystack(item).includes(query);
    }

    /**
     * Returns true when every dimension of `next` is "same or narrower" than `prev`.
     * Caller has already established the two filter sets are not identical, so any "same or narrower"
     * result implies at least one dimension is strictly narrower.
     */
    #isNarrowing(prev, next) {
        const queryNarrowed =
            prev.query === next.query ||
            (next.query && (!prev.query || next.query.toLowerCase().includes(prev.query.toLowerCase())));
        const isSuperset = (prevArr, nextArr) => prevArr.every((v) => nextArr.includes(v));
        const isSubset = (prevArr, nextArr) => nextArr.every((v) => prevArr.includes(v));
        const variantsNarrowed =
            prev.variants.length === 0 || (next.variants.length > 0 && isSubset(prev.variants, next.variants));
        const contentTypesNarrowed =
            prev.contentTypes.length === 0 || (next.contentTypes.length > 0 && isSubset(prev.contentTypes, next.contentTypes));
        return (
            queryNarrowed &&
            isSuperset(prev.tags, next.tags) &&
            variantsNarrowed &&
            contentTypesNarrowed &&
            isSuperset(prev.createdBy, next.createdBy)
        );
    }

    /**
     * Guard for in-memory narrowing: surface must be fully loaded and free of pending edits.
     */
    #canNarrowInMemory(dataStore) {
        if (this.#searchCursor !== null) return false;
        if (Store.fragments.list.hasMore.get() === true) return false;
        const lastEdit = dataStore.getMeta('lastEdit');
        const lastLoad = dataStore.getMeta('lastLoad');
        if (lastEdit && (!lastLoad || lastEdit > lastLoad)) return false;
        return true;
    }

    #applyInMemoryFilter(stores, { query, tags, variants, contentTypes, createdBy }) {
        const tagPredicate = filterByTags(tags);
        const personalizationOn = this.filters.value.personalizationFilterEnabled === true;
        const lowerQuery = query?.toLowerCase() || '';
        const createdByLc = createdBy.map((value) => value.toLowerCase());
        return stores.filter((store) => {
            const item = store?.get?.() ?? store?.value;
            if (!item) return false;
            if (Fragment.isGroupedVariationPath(item.path)) return false;
            if (this.#skipVariant(variants, item)) return false;
            if (!matchesContentTypeFilter(contentTypes, item)) return false;
            if (!tagPredicate(item)) return false;
            if (createdByLc.length) {
                const itemCreatedBy = (item.created?.by || '').toLowerCase();
                if (!itemCreatedBy || !createdByLc.includes(itemCreatedBy)) return false;
            }
            if (this.#skipQuery(lowerQuery, item)) return false;
            if (!personalizationOn && fragmentHasPersonalizationTag(item)) return false;
            return true;
        });
    }

    /** Fragment list surface on promotions editor item picker (no top-nav fallback). */
    #promotionsItemPickerSurfaceOrNavPath() {
        const override = Store.promotions.itemPickerSurface.get();
        if (override != null && override !== '') return override;
        return null;
    }

    async searchFragments({ force = false, tags: tagsOverride, query: queryOverride } = {}) {
        if (
            !force &&
            !(
                this.page.value === PAGE_NAMES.CONTENT ||
                this.page.value === PAGE_NAMES.TRANSLATION_EDITOR ||
                this.page.value === PAGE_NAMES.BULK_PUBLISH_EDITOR ||
                this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR
            )
        )
            return;
        if (!Store.profile.value) return;

        const path =
            this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR
                ? this.#promotionsItemPickerSurfaceOrNavPath()
                : this.search.value.path;

        if (this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR && !path) {
            const dataStore = Store.fragments.list.data;
            if (dataStore.get().length > 0) dataStore.set([]);
            dataStore.setMeta('path', null);
            dataStore.setMeta('promotionPickerSurface', null);
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.hasMore.set(false);
            return;
        }

        const dataStore = Store.fragments.list.data;
        const query = queryOverride !== undefined ? queryOverride : this.search.value.query;

        const currentPath = dataStore.getMeta('path');
        const currentQuery = dataStore.getMeta('query');
        const currentLocale = dataStore.getMeta('locale');
        const currentData = dataStore.get();
        const locale = this.filters.value.locale;
        const personalizationOn = this.filters.value.personalizationFilterEnabled === true;
        const metaPersonalizationOn = dataStore.getMeta('personalizationFilterEnabled') === true;
        let resolvedLocale = locale;
        let resolvedPath = path;

        const currentTags = dataStore.getMeta('tags');
        const rawTags = tagsOverride ?? this.filters.value.tags;
        const tagsString = Array.isArray(rawTags) ? rawTags.join(',') : rawTags || '';
        const currentCreatedBy = dataStore.getMeta('createdBy');
        const createdBy = Store.createdByUsers.get().map((user) => user.userPrincipalName);
        const createdByString = createdBy.join(',');

        const TAG_VARIANT_PREFIX = 'mas:variant/';

        let tags = [];
        if (rawTags) {
            if (typeof rawTags === 'string') {
                tags = rawTags.split(',').filter(Boolean);
            } else if (Array.isArray(rawTags)) {
                tags = rawTags.filter(Boolean);
            } else {
                console.warn('Unexpected tags format:', rawTags);
            }
        }

        // Non-country mas:pzn/* filters apply only to the Personalization group in mas-content, not the search API
        tags = tags.filter((tag) => {
            if (!tag.startsWith(PZN_TAG_ID_PREFIX)) return true;
            return isPznCountryTagId(tag);
        });

        const { contentTypes, modelIds: contentTypeModelIds } = resolveContentTypeFilters(tags);
        let modelIds = contentTypeModelIds;

        if (modelIds.length === 0) modelIds = EDITABLE_FRAGMENT_MODEL_IDS;

        const variants = tags
            .filter((tag) => tag.startsWith(TAG_VARIANT_PREFIX))
            .map((tag) => tag.replace(TAG_VARIANT_PREFIX, ''));
        const shouldPassCompareChartTag = contentTypes.length === 1 && contentTypes[0] === TAG_COMPARE_CHART;
        tags = tags.filter((tag) => !tag.startsWith(TAG_STUDIO_CONTENT_TYPE) && !tag.startsWith(TAG_VARIANT_PREFIX));

        const tracing = typeof localStorage !== 'undefined' && localStorage.getItem('mas-perf-trace');

        const promotionPickerSurfaceMark =
            this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR ? Store.promotions.itemPickerSurface.get() : undefined;
        const currentPromotionPickerMark = dataStore.getMeta('promotionPickerSurface');
        const promotionPickerMatches =
            this.page.value !== PAGE_NAMES.PROMOTIONS_EDITOR ||
            (promotionPickerSurfaceMark ?? null) === (currentPromotionPickerMark ?? null);

        const sameSurface =
            promotionPickerMatches &&
            currentData?.length > 0 &&
            currentPath === path &&
            currentLocale === locale &&
            metaPersonalizationOn === personalizationOn;

        const identicalFilters =
            sameSurface && currentQuery === query && currentTags === tagsString && currentCreatedBy === createdByString;

        if (identicalFilters) {
            let filteredData = currentData.filter((fragmentStore) => {
                const fragmentPath = fragmentStore?.get?.()?.path;
                return !Fragment.isGroupedVariationPath(fragmentPath);
            });
            filteredData = this.#applyFragmentListFilters(filteredData);
            if (filteredData.length !== currentData.length) {
                dataStore.set(filteredData);
            }
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            return;
        }

        // UUID queries are ID lookups, not haystack searches. The in-memory haystack does not include
        // the fragment ID, so narrowing would falsely drop the matching fragment. Route to AEM (the
        // UUID branch below has its own fast path that skips the network when the fragment is already
        // the sole entry in the store).
        if (sameSurface && !isUUID(query) && this.#canNarrowInMemory(dataStore)) {
            const prevTagsAll = currentTags ? currentTags.split(',').filter(Boolean) : [];
            const prevVariants = prevTagsAll
                .filter((t) => t.startsWith(TAG_VARIANT_PREFIX))
                .map((t) => t.replace(TAG_VARIANT_PREFIX, ''));
            const prevTagsNonVariant = prevTagsAll.filter(
                (t) => !t.startsWith(TAG_VARIANT_PREFIX) && !t.startsWith(TAG_STUDIO_CONTENT_TYPE),
            );
            const prevContentTypes = prevTagsAll.filter((t) => t.startsWith(TAG_STUDIO_CONTENT_TYPE));
            const prevCreatedBy = currentCreatedBy ? currentCreatedBy.split(',').filter(Boolean) : [];
            const narrowed = this.#isNarrowing(
                {
                    query: currentQuery || '',
                    tags: prevTagsNonVariant,
                    variants: prevVariants,
                    contentTypes: prevContentTypes,
                    createdBy: prevCreatedBy,
                },
                { query: query || '', tags, variants, contentTypes, createdBy },
            );
            if (narrowed) {
                if (tracing) console.time('searchFragments:in-memory');
                const filtered = this.#applyInMemoryFilter(currentData, { query, tags, variants, contentTypes, createdBy });
                if (filtered.length !== currentData.length) {
                    dataStore.set(filtered);
                }
                dataStore.setMeta('query', query);
                dataStore.setMeta('tags', tagsString);
                dataStore.setMeta('createdBy', createdByString);
                Store.fragments.list.loading.set(false);
                Store.fragments.list.firstPageLoaded.set(true);
                if (tracing) console.timeEnd('searchFragments:in-memory');
                return;
            }
        }

        Store.fragments.list.loading.set(true);
        Store.fragments.list.firstPageLoaded.set(false);
        if (Store.fragments.list.hasMore.get()) Store.fragments.list.hasMore.set(false);
        if (dataStore.get().length > 0) {
            dataStore.set([]);
        }

        const damPath = getDamPath(path);
        const localizedPath = `${damPath}/${locale}`;
        const localSearch = {
            ...this.search.value,
            query,
            modelIds,
            path: localizedPath,
            tags,
            ...(this.page.value !== PAGE_NAMES.TRANSLATION_EDITOR && { createdBy }),
            sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
        };

        // AEM's fullText.EDGES index only covers title+description and ANDs across
        // tokens, so multi-word queries like "creative cloud" return zero on catalogs
        // where no card has both tokens at edge positions in metadata — even though
        // many cards have the phrase in body fields (cardTitle, description, etc.).
        // To make search reliable, we route a single discriminative term to AEM and
        // apply the user's full query client-side via #skipQuery() against an expanded
        // haystack covering all string field values.
        //   - single variant chip: variant name → AEM
        //   - else multi-word query: longest token → AEM
        //   - else (single-word or UUID): query unchanged
        // The client-side #skipQuery is idempotent in the single-word case (matches
        // exactly what AEM returned) and only narrows in the multi-word case.
        const userQuery = !isUUID(query) && query ? query : '';
        let clientQuery = '';
        if (variants.length === 1) {
            localSearch.query = variants[0];
            clientQuery = userQuery;
        } else if (userQuery) {
            const tokens = userQuery.match(/\S+/g) || [];
            if (tokens.length > 1) {
                const longest = tokens.reduce((a, b) => (b.length > a.length ? b : a));
                localSearch.query = longest;
                clientQuery = userQuery;
            }
        }
        const lowerClientQuery = clientQuery.toLowerCase();

        const publishedTagIndex = tags.indexOf(TAG_STATUS_PUBLISHED);
        if (publishedTagIndex > -1) {
            tags.splice(publishedTagIndex, 1);
            localSearch.status = STATUS_PUBLISHED;
        }
        if (shouldPassCompareChartTag) {
            localSearch.tags = [TAG_COMPARE_CHART, ...tags];
        }

        if (tracing) console.time('searchFragments:aem');
        let refilling = false;
        try {
            if (this.#abortControllers.search) this.#abortControllers.search.abort();
            this.#searchCursor = null;
            this.#abortControllers.search = new AbortController();
            const searchController = this.#abortControllers.search;

            if (isUUID(query)) {
                const [currentFragment] = dataStore.get() ?? [];
                const highlightedId = Store.fragments.highlightedVariationId.get();
                const expandedId = Store.fragments.expandedId.get();
                const alreadyResolvedVariation =
                    highlightedId === query && expandedId && currentFragment?.value?.id === expandedId;
                if (
                    (currentFragment?.value?.id === query || alreadyResolvedVariation) &&
                    dataStore.get()?.length === 1 &&
                    metaPersonalizationOn === personalizationOn
                ) {
                    Store.fragments.list.loading.set(false);
                    Store.fragments.list.firstPageLoaded.set(true);
                    return;
                }
                const fragmentData = await this.aem.sites.cf.fragments.getById(query, this.#abortControllers.search);
                let displayFragment = fragmentData;
                const { isVariation, tab } = classifyVariationByPath(fragmentData?.path);

                if (isVariation && fragmentData) {
                    const parentData = await this.#resolveParentForVariationSearch(fragmentData);
                    if (this.#abortControllers.search !== searchController) {
                        Store.fragments.list.loading.set(false);
                        return;
                    }
                    if (!parentData) {
                        Store.fragments.expandedId.set(null);
                        Store.fragments.highlightedVariationId.set(null);
                        Store.fragments.variationSearchTab.set(null);
                        dataStore.set([]);
                        Store.fragments.list.data.set([]);
                        Store.fragments.list.firstPageLoaded.set(true);
                        Store.fragments.list.loading.set(false);
                        return;
                    }
                    displayFragment = parentData;
                    Store.fragments.expandedId.set(parentData.id);
                    Store.fragments.highlightedVariationId.set(query);
                    Store.fragments.variationSearchTab.set(tab);
                } else {
                    Store.fragments.expandedId.set(fragmentData?.id ?? null);
                    Store.fragments.highlightedVariationId.set(null);
                    Store.fragments.variationSearchTab.set(null);
                }

                const fragmentSurface = extractSurfaceFromPath(displayFragment?.path)?.toLowerCase() || null;
                const fragmentLocale = extractLocaleFromPath(displayFragment?.path);
                const matchesSurface = !fragmentSurface || fragmentSurface === path;
                const syncedPathQuery = Store.search.getMeta('uuid-query');
                const syncedPath = Store.search.getMeta('uuid-path');
                const canSyncSurface = syncedPathQuery !== query || Store.search.value.path === syncedPath;
                const syncedLocaleQuery = Store.filters.getMeta('uuid-query');
                const syncedLocale = Store.filters.getMeta('uuid-locale');
                const canSyncLocale = syncedLocaleQuery !== query || Store.filters.value.locale === syncedLocale;
                const matchesLocale = !fragmentLocale || fragmentLocale === locale;

                if (
                    displayFragment &&
                    (canSyncSurface || matchesSurface) &&
                    (canSyncLocale || matchesLocale) &&
                    matchesContentTypeFilter(contentTypes, displayFragment) &&
                    (isVariation || !Fragment.isGroupedVariationPath(fragmentData?.path))
                ) {
                    resolvedLocale = canSyncLocale ? fragmentLocale || locale : locale;
                    resolvedPath = canSyncSurface ? fragmentSurface || path : path;
                    applyCorrectorToFragment(displayFragment, fragmentSurface);
                    displayFragment = await promotionsRepository.mergePromoReferencesIntoFragmentData(
                        this.aem,
                        displayFragment,
                        () => this.loadPromotions(),
                    );
                    if (this.#abortControllers.search !== searchController) {
                        Store.fragments.list.loading.set(false);
                        return;
                    }
                    const fragment = await this.#addToCache(displayFragment);
                    const sourceStore = generateFragmentStore(fragment, null, { lazy: true });
                    dataStore.set(this.#applyFragmentListFilters([sourceStore]));

                    if (fragmentSurface) {
                        Store.search.setMeta('uuid-query', query);
                        Store.search.setMeta('uuid-path', fragmentSurface);
                    }

                    if (fragmentLocale) {
                        Store.filters.setMeta('uuid-query', query);
                        Store.filters.setMeta('uuid-locale', fragmentLocale);
                    }

                    if (
                        canSyncSurface &&
                        fragmentSurface &&
                        Store.search.value.path !== fragmentSurface &&
                        !(
                            this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR &&
                            Store.promotions.itemPickerSurface.get() != null &&
                            Store.promotions.itemPickerSurface.get() !== ''
                        )
                    ) {
                        Store.search.set((prev) => ({
                            ...prev,
                            query: prev.query ?? query,
                            path: fragmentSurface,
                        }));
                    }

                    if (canSyncLocale && fragmentLocale && Store.filters.value.locale !== fragmentLocale) {
                        Store.filters.set((prev) => ({
                            ...prev,
                            locale: fragmentLocale,
                        }));
                    }
                }
                Store.fragments.list.data.set(dataStore.get());
                Store.fragments.list.firstPageLoaded.set(true);
            } else {
                Store.fragments.expandedId.set(null);
                Store.fragments.highlightedVariationId.set(null);
                Store.fragments.variationSearchTab.set(null);
                const surface = path?.split('/').filter(Boolean)[0]?.toLowerCase();
                const fragmentStores = [];
                if (lowerClientQuery.trim().includes(' ')) {
                    // first try to find the card that matches the full query
                    const reducedQuery = localSearch.query;
                    localSearch.query = lowerClientQuery;
                    const cursorExact = await this.aem.sites.cf.fragments.search(
                        localSearch,
                        null,
                        this.#abortControllers.search,
                    );
                    await this.#fillPage(
                        cursorExact,
                        variants,
                        contentTypes,
                        surface,
                        fragmentStores,
                        lowerClientQuery,
                        searchController.signal,
                    );
                    Store.fragments.list.data.set([...this.#applyFragmentListFilters(fragmentStores)]);
                    Store.fragments.list.firstPageLoaded.set(true);
                    // then load cards that contain the longest word and do the filtering
                    localSearch.query = reducedQuery;
                }

                const cursor = await this.aem.sites.cf.fragments.search(localSearch, null, this.#abortControllers.search);
                const done = await this.#fillPage(
                    cursor,
                    variants,
                    contentTypes,
                    surface,
                    fragmentStores,
                    lowerClientQuery,
                    searchController.signal,
                );
                if (this.#abortControllers.search !== searchController) {
                    Store.fragments.list.loading.set(false);
                    return;
                }
                Store.fragments.list.data.set([...this.#applyFragmentListFilters(fragmentStores)]);
                Store.fragments.list.firstPageLoaded.set(true);
                const cursorState = done ? null : { cursor, variants, contentTypes, surface, fragmentStores, lowerClientQuery };
                this.#searchCursor = cursorState;
                Store.fragments.list.hasMore.set(!done);
                if (personalizationOn && cursorState) {
                    Store.fragments.list.hasMore.set(false);
                    this.#eagerLoadAllPznPages(cursorState, searchController);
                } else {
                    this.#abortControllers.search = null;
                    if (cursorState) {
                        refilling = true;
                        this.#refillBelowThreshold(cursorState, searchController);
                    }
                }
            }

            dataStore.setMeta('path', resolvedPath);
            dataStore.setMeta('query', query);
            dataStore.setMeta('locale', resolvedLocale);
            dataStore.setMeta('tags', tagsString);
            dataStore.setMeta('createdBy', createdByString);
            dataStore.setMeta('personalizationFilterEnabled', personalizationOn);
            if (this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR) {
                dataStore.setMeta('promotionPickerSurface', Store.promotions.itemPickerSurface.get());
            }
            dataStore.setMeta('lastLoad', Date.now());
        } catch (error) {
            if (error.name !== 'AbortError') {
                Store.fragments.list.loading.set(false);
            }
            this.processError(error, 'Could not load fragments.');
            return;
        }

        if (!refilling) Store.fragments.list.loading.set(false);
        if (tracing) console.timeEnd('searchFragments:aem');
    }

    static MIN_PAGE_SIZE = 10;
    /**
     * Soft cap on the eager personalization-page loop in #eagerLoadAllPznPages.
     * Once the cap is hit, hasMore is set to true and the rest is delivered on
     * demand by loadNextPage() (one page per scroll-trigger). Pagination is not
     * lost — it simply stops being eager-prefetched after this many pages.
     */
    static MAX_EAGER_PZN_PAGES = 20;
    /**
     * Visible-row threshold for the post-filter refill loop in #refillBelowThreshold.
     * When a cursor page, after #applyFragmentListFilters has been
     * applied, has fewer than this many visible items AND the cursor is not
     * exhausted, the loop fetches additional cursor pages until the threshold is
     * met or the cursor runs out. Prevents the narrow-filter UX where a user sees
     * "1 result" when the underlying catalog has many more matches spread across
     * later cursor pages.
     */
    static MIN_FILTERED_PAGE_RESULTS = 25;
    /**
     * Soft cap on the number of #fillPage rounds the refill loop will run before
     * giving up. Mirrors MAX_EAGER_PZN_PAGES to keep the non-personalization
     * refill path bounded when a filter matches very little in the catalog.
     * When the cap is hit, hasMore stays true so loadNextPage can continue
     * fetching on scroll.
     */
    static MAX_REFILL_ROUNDS = 20;

    /**
     * If card content matches the query in exact order the card will be displayed in top results
     * If card content contains all words from the query in at least one field, in any order
     * the card will be displayed after top results.
     */
    #queryMatches(query, item) {
        if (!query) return { exact: false };

        const haystack = this.#queryHaystack(item);
        if (haystack.includes(query)) {
            return { exact: true };
        }

        const queryArray = query.split(' ');
        const match = haystack.split('\n').some((hs) => queryArray.every((q) => hs.includes(q)));
        if (match) {
            return { exact: false };
        }

        return null;
    }

    async #fillPage(cursor, variants, contentTypes, surface, fragmentStores, lowerClientQuery, signal) {
        if (signal?.aborted) return false;
        const page = await cursor.next();
        if (page.done) return true;
        const fgStores = [];
        for await (const item of page.value) {
            if (this.#skipVariant(variants, item)) continue;
            if (!matchesContentTypeFilter(contentTypes, item)) continue;
            const match = this.#queryMatches(lowerClientQuery, item);
            if (!match) continue;
            applyCorrectorToFragment(item, surface);
            if (!fragmentStores.some((f) => f.value.id === item.id)) {
                const fragment = await this.#addToCache(item);
                const fgStore = generateFragmentStore(fragment, null, { lazy: true });
                if (match.exact) {
                    fgStores.unshift(fgStore);
                } else {
                    fgStores.push(fgStore);
                }
            }
        }
        fragmentStores.push(...fgStores);
        return false;
    }

    async #eagerLoadAllPznPages(cursorSnapshot, searchController) {
        const { cursor, variants, contentTypes, surface, fragmentStores, lowerClientQuery } = cursorSnapshot;
        let pagesLoaded = 0;
        try {
            while (this.#searchCursor === cursorSnapshot) {
                if (pagesLoaded >= MasRepository.MAX_EAGER_PZN_PAGES) {
                    Store.fragments.list.hasMore.set(true);
                    break;
                }
                const done = await this.#fillPage(
                    cursor,
                    variants,
                    contentTypes,
                    surface,
                    fragmentStores,
                    lowerClientQuery,
                    searchController.signal,
                );
                pagesLoaded++;
                if (this.#searchCursor !== cursorSnapshot) return;
                Store.fragments.list.data.set([...this.#applyFragmentListFilters(fragmentStores)]);
                if (done) {
                    this.#searchCursor = null;
                    return;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            if (this.#searchCursor === cursorSnapshot) {
                Store.fragments.list.hasMore.set(true);
            }
        }
    }

    async #refillBelowThreshold(cursorSnapshot, searchController) {
        const { cursor, variants, contentTypes, surface, fragmentStores, lowerClientQuery } = cursorSnapshot;
        let rounds = 0;
        Store.fragments.list.loading.set(true);
        try {
            while (this.#searchCursor === cursorSnapshot) {
                const filtered = this.#applyFragmentListFilters(fragmentStores);
                if (filtered.length >= MasRepository.MIN_FILTERED_PAGE_RESULTS) return;
                if (rounds >= MasRepository.MAX_REFILL_ROUNDS) {
                    Store.fragments.list.hasMore.set(true);
                    return;
                }
                const beforeCount = fragmentStores.length;
                const done = await this.#fillPage(
                    cursor,
                    variants,
                    contentTypes,
                    surface,
                    fragmentStores,
                    lowerClientQuery,
                    searchController.signal,
                );
                rounds++;
                if (this.#searchCursor !== cursorSnapshot) return;
                if (fragmentStores.length === beforeCount && !done) {
                    Store.fragments.list.hasMore.set(true);
                    return;
                }
                Store.fragments.list.data.set([...this.#applyFragmentListFilters(fragmentStores)]);
                if (done) {
                    this.#searchCursor = null;
                    Store.fragments.list.hasMore.set(false);
                    return;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            if (this.#searchCursor === cursorSnapshot) {
                Store.fragments.list.hasMore.set(true);
            }
        } finally {
            if (this.#searchCursor === cursorSnapshot || this.#searchCursor === null) {
                Store.fragments.list.loading.set(false);
            }
        }
    }

    async loadNextPage() {
        if (Store.fragments.list.loading.get()) return;
        const cursorSnapshot = this.#searchCursor;
        if (!cursorSnapshot) return;
        Store.fragments.list.loading.set(true);
        const { cursor, variants, contentTypes, surface, fragmentStores, lowerClientQuery } = cursorSnapshot;
        try {
            const done = await this.#fillPage(
                cursor,
                variants,
                contentTypes,
                surface,
                fragmentStores,
                lowerClientQuery,
                this.#abortControllers.search?.signal,
            );
            if (this.#searchCursor !== cursorSnapshot) return;
            Store.fragments.list.data.set([...this.#applyFragmentListFilters(fragmentStores)]);
            if (done) {
                this.#searchCursor = null;
                Store.fragments.list.hasMore.set(false);
            }
        } catch (error) {
            this.processError(error, 'Could not load next page.');
            this.#searchCursor = null;
            Store.fragments.list.hasMore.set(false);
        } finally {
            Store.fragments.list.loading.set(false);
        }
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
                const sourceStore = generateFragmentStore(fragment, null, { lazy: true });
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

    async loadAllCollections() {
        const surfaceKey =
            this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR
                ? this.#promotionsItemPickerSurfaceOrNavPath()
                : this.search.value.path;
        if (!surfaceKey) return;
        try {
            if (this.#abortControllers.collections) this.#abortControllers.collections.abort();
            this.#abortControllers.collections = new AbortController();

            const damPath = getDamPath(surfaceKey);
            const locale = this.filters.value.locale;
            const searchPath = this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR ? damPath : `${damPath}/${locale}`;
            const searchOptions = {
                path: searchPath,
                modelIds: [TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION]],
                sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
            };

            const fragments = await this.searchFragmentList(searchOptions, 50, this.#abortControllers.collections);
            const collections = [];
            const collectionsByPath = new Map();
            for (const fragment of fragments) {
                let studioPath;
                if (this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR) {
                    const surface = (extractSurfaceFromPath(fragment.path) ?? this.search.value.path)?.toUpperCase();
                    studioPath = `merch-card-collection: ${surface} / ${fragment.title || ''}`;
                } else {
                    studioPath = getFragmentName(fragment);
                }
                const collection = { ...fragment, studioPath };
                collections.push(collection);
                collectionsByPath.set(fragment.path, collection);
            }

            const s = getItemsSelectionStore({ allowUnset: true });
            if (!s) return;
            s.allCollections.setMeta('loaded', true);
            s.allCollections.set(collections);
            s.displayCollections.set(collections);
            s.collectionsByPaths.set(collectionsByPath);
        } catch (error) {
            if (error.name === 'AbortError') return;
            this.processError(error, 'Could not load collections.');
        }
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
            const signal = this.#abortControllers.promotions.signal;
            const expiredPublished = promotions.filter((store) => {
                const p = store.get();
                return p?.promotionStatus === 'expired' && p.isPromotionPublished;
            });

            Store.promotions.list.data.set(promotions);

            if (expiredPublished.length) {
                void this.#unpublishExpiredPromotions(expiredPublished, signal);
            }
        } catch (error) {
            this.processError(error, 'Could not load promotions.');
        } finally {
            Store.promotions.list.data.setMeta('listFetched', true);
            Store.promotions.list.loading.set(false);
        }
    }

    async #unpublishExpiredPromotions(stores, signal) {
        for (const store of stores) {
            if (signal.aborted) break;
            const p = store.get();
            const ok = await this.unpublishFragment(p, false);
            if (!ok || signal.aborted) continue;
            const fresh = await this.aem.sites.cf.fragments.getById(p.id);
            if (fresh) store.set(new Promotion(fresh));
        }
    }

    getPromotionsPath() {
        return `${ROOT_PATH}/promotions`;
    }

    /** Mockable seam for components; the implementation lives in placeholders/mas-placeholders-repository.js. */
    getDictionaryPath() {
        return getDictionaryPath();
    }

    /** Mockable seam for components; the implementation lives in placeholders/mas-placeholders-repository.js. */
    loadPlaceholders() {
        return loadPlaceholders();
    }

    /** Mockable seam for components; the implementation lives in placeholders/mas-placeholders-repository.js. */
    loadPreviewPlaceholders(locale) {
        return loadPreviewPlaceholders(locale);
    }

    /** Mockable seam for components; the implementation lives in placeholders/mas-placeholders-repository.js. */
    fetchDictionary(abortController, locale) {
        return fetchDictionary(abortController, locale);
    }

    getTranslationsPath() {
        const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        return surface ? `${ROOT_PATH}/${surface}/translations` : null;
    }

    async loadTranslationProjects() {
        const translationsPath = this.getTranslationsPath();
        if (!translationsPath) return;
        try {
            if (this.#abortControllers.translations) this.#abortControllers.translations.abort();
            this.#abortControllers.translations = new AbortController();
            Store.translationProjects.list.loading.set(true);
            const fragments = await this.searchFragmentList(
                {
                    path: translationsPath,
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                },
                50,
                this.#abortControllers.translations,
            );
            const translationProjects = fragments.map((fragment) => new FragmentStore(new Fragment(fragment)));
            Store.translationProjects.list.data.set(translationProjects);
        } catch (error) {
            this.processError(error, 'Could not load translation projects.');
        } finally {
            Store.translationProjects.list.loading.set(false);
        }
    }

    getBulkPublishParentPath(surface) {
        return `${getDamPath(surface?.toLowerCase())}/${BULK_PUBLISH_PROJECTS_FOLDER}`;
    }

    getBulkPublishProjectsPath() {
        const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase() ?? 'sandbox';
        return this.getBulkPublishParentPath(surface);
    }

    async loadBulkPublishProjects() {
        const path = this.getBulkPublishProjectsPath();
        if (!path) return;
        try {
            if (this.#abortControllers.bulkPublish) this.#abortControllers.bulkPublish.abort();
            this.#abortControllers.bulkPublish = new AbortController();
            Store.bulkPublishProjects.list.loading.set(true);
            const fragments = await this.searchFragmentList(
                { path, sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
                50,
                this.#abortControllers.bulkPublish,
            );
            const projects = fragments.map((fragment) => new FragmentStore(new Fragment(fragment)));
            Store.bulkPublishProjects.list.data.set(projects);
        } catch (error) {
            this.processError(error, 'Could not load bulk publish projects.');
        } finally {
            Store.bulkPublishProjects.list.loading.set(false);
        }
    }

    getFragmentById(id) {
        return this.aem.sites.cf.fragments.getById(id);
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
                        const type =
                            key === 'locReady'
                                ? 'boolean'
                                : key === 'compatVersion'
                                  ? 'number'
                                  : key === COMPARE_CHART_FIELD
                                    ? 'long-text'
                                    : 'text';
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

            const collectionModelId = TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION];
            const data = fragmentData.data ? { ...fragmentData.data } : undefined;
            let tagsToSave = fragmentData.tags;

            if (data?.tags && fragmentData.modelId === collectionModelId) {
                tagsToSave = tagsToSave ?? data.tags;
                delete data.tags;
            }

            const fields = this.createFieldsFromData(data, fragmentData.fields || []);

            const result = await this.aem.sites.cf.fragments.create({
                ...fragmentData,
                description: fragmentData.description || '',
                fields,
                parentPath: fragmentData.parentPath || this.parentPath,
            });
            let latest = await this.aem.sites.cf.fragments.getById(result.id);
            const tags = tagsToSave ?? fragmentData.data?.tags;
            if (tags?.length) {
                latest.newTags = tags;
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
        } else {
            fragment.refreshFrom(fragmentData);
        }
        return fragment;
    }

    /**
     * Generic method to save any fragment with card-specific validation and variation handling
     * @param {FragmentStore} fragmentStore - The fragment store to save
     * @param {boolean} withToast - Whether to show toast notifications
     * @returns {Promise<Object>} The saved fragment
     */
    async saveFragment(fragmentStore, withToast = true) {
        if (withToast) showToast('Saving fragment...');
        this.operation.set(OPERATIONS.SAVE);

        const fragment = fragmentStore.get();
        const parentFragment = fragmentStore.parentFragment;

        // For variations, prepare the fragment by stripping inherited values before save
        const fragmentToSave = parentFragment ? fragment.prepareVariationForSave(parentFragment) : fragment;

        // Card-specific validation
        const tags = fragment.getField('tags')?.values || [];
        const hasOfferlessTag = tags.some((tag) => tag?.includes('offerless'));
        const osi = fragment.getFieldValue('osi') || parentFragment?.getFieldValue('osi');

        if (fragmentToSave.model?.path === CARD_MODEL_PATH && !osi && !hasOfferlessTag) {
            if (withToast) showToast('Please select offer', 'negative');
            this.operation.set(null);
            return false;
        }

        if (!fragmentToSave.fields) {
            fragmentToSave.fields = [];
        }
        ensureCompatVersionOnMerchCardFieldList(fragmentToSave.model?.path, fragmentToSave.fields);

        try {
            const savedFragment = await this.aem.sites.cf.fragments.save(fragmentToSave);
            if (!savedFragment) throw new Error('Invalid fragment.');

            fragmentStore.refreshFrom(savedFragment);
            await initFragmentCache();
            fragmentCache.remove(savedFragment.id);
            fragmentCache.add(new Fragment(savedFragment));
            if (parentFragment) {
                await this.refreshVariationParentInList(savedFragment, parentFragment);
            }
            Events.fragmentSaved.emit(savedFragment.id);
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
     * Refreshes parent/list stores that reference a saved variation so nested rows in
     * the content table stay in sync when navigating back from the editor.
     * @param {Object} variationFragment
     * @param {Object} parentFragment
     */
    async refreshVariationParentInList(variationFragment, parentFragment) {
        if (!variationFragment) return;

        const listStores = Store.fragments.list.data.get() || [];
        const variationId = variationFragment.id;
        const variationPath = variationFragment.path;
        const parentId = parentFragment?.id;

        const storesToRefresh = listStores.filter((store) => {
            const fragment = store?.get?.();
            if (!fragment) return false;
            if (parentId && fragment.id === parentId) return true;
            if (fragment.references?.some((reference) => reference.id === variationId || reference.path === variationPath)) {
                return true;
            }
            const variationPaths = fragment.getVariations?.() || [];
            return Boolean(variationPath && variationPaths.includes(variationPath));
        });

        if (!storesToRefresh.length) return;

        await Promise.all(
            storesToRefresh.map(async (store) => {
                try {
                    await this.refreshFragment(store);
                } catch (error) {
                    console.warn('Failed to refresh parent fragment store after variation save:', error?.message || error);
                }
            }),
        );
    }

    /**
     * @returns {Promise<boolean>} Whether or not it was successful
     */
    async copyFragment(updatedTitle, osi, tags = []) {
        try {
            this.operation.set(OPERATIONS.CLONE);
            const result = await this.aem.sites.cf.fragments.copy(this.fragmentInEdit);
            let savedResult = result;
            if (!result.fields) {
                result.fields = [];
            }
            const needsCompatSave = ensureCompatVersionOnMerchCardFieldList(result.model?.path, result.fields);
            const needsSave = (updatedTitle && updatedTitle !== result.title) || osi || needsCompatSave;
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
            sourceStore.skipVariationDetection = true;
            Store.fragments.list.data.set((prev) => [sourceStore, ...prev]);

            // Reset changes on the current fragment to prevent discard prompt during navigation
            Store.editor.resetChanges();

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
    async publishFragment(fragment, options = {}, withToast = true) {
        const { selectedRefIds = null, allSelected = false } = options;
        try {
            this.operation.set(OPERATIONS.PUBLISH);

            if (allSelected) {
                await this.aem.sites.cf.fragments.publish(fragment, []);
                const { variations = [], cards = [] } = fragment.getPublishableReferences?.() ?? {};
                const allRefIds = [...variations, ...cards].map((r) => r.id);
                if (allRefIds.length) await this.#publishRefIds(allRefIds);
            } else {
                await this.aem.sites.cf.fragments.publish(fragment, []);
                if (selectedRefIds?.length) {
                    await this.#publishRefIds(selectedRefIds);
                }
            }

            if (withToast) {
                const message =
                    fragment instanceof Promotion ? 'Project successfully published.' : 'Fragment successfully published.';
                showToast(message, 'positive');
            }

            return true;
        } catch (error) {
            this.processError(error, 'Failed to publish fragment.');
            return false;
        } finally {
            this.operation.set(null);
        }
    }

    async #publishRefIds(refIds) {
        const CHUNK_SIZE = 10;
        const valid = [];
        let failedCount = 0;
        for (let i = 0; i < refIds.length; i += CHUNK_SIZE) {
            const chunk = refIds.slice(i, i + CHUNK_SIZE);
            const fetched = await Promise.all(chunk.map((id) => this.aem.sites.cf.fragments.getWithEtag(id).catch(() => null)));
            fetched.forEach((result) => {
                if (result) valid.push(result);
                else failedCount++;
            });
        }
        if (failedCount > 0) {
            throw new Error(`Failed to fetch ${failedCount} of ${refIds.length} refs for publishing`);
        }
        if (valid.length === 0) throw new Error('Failed to fetch any ref for publishing');
        for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
            const chunk = valid.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map((ref) => this.aem.sites.cf.fragments.publish(ref, [])));
        }
    }

    /**
     * @param {Fragment} fragment Fragment to unpublish
     * @param {boolean} [withToast=true]
     * @returns {Promise<boolean>}
     */
    async unpublishFragment(fragment, withToast = true) {
        try {
            this.operation.set(OPERATIONS.UNPUBLISH);
            await this.aem.sites.cf.fragments.unpublish(fragment);
            if (withToast) showToast('Fragment successfully unpublished.', 'positive');
            return true;
        } catch (error) {
            this.processError(error, 'Failed to unpublish fragment.');
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

            const listStores = Store.fragments.list.data.get();
            const fragments = [];
            for (const id of fragmentIds) {
                let fragment = findFragmentDataById(id, listStores);
                if (!fragment?.etag) {
                    try {
                        fragment = await this.aem.sites.cf.fragments.getById(id);
                    } catch {
                        fragment = null;
                    }
                }
                if (fragment) fragments.push(fragment);
            }

            if (fragments.length === 0) {
                if (withToast) showToast('No valid fragments found to publish.', 'negative');
                return false;
            }

            await this.aem.sites.cf.fragments.publishFragments(fragments, publishReferencesWithStatus);

            const refreshPromises = fragmentIds.map((id) => {
                const store = findFragmentStoreById(id, listStores);
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
    async deleteFragment(fragment, { startToast = true, endToast = true, force = false } = {}) {
        try {
            this.operation.set(OPERATIONS.DELETE);
            if (startToast) showToast('Deleting fragment...');

            if (force) {
                await this.aem.sites.cf.fragments.forceDelete({ path: fragment.path });
            } else {
                const fragmentWithEtag = await this.aem.sites.cf.fragments.getWithEtag(fragment.id);
                if (fragmentWithEtag) await this.aem.sites.cf.fragments.delete(fragmentWithEtag);
            }

            if (endToast) showToast('Fragment successfully deleted.', 'positive');

            if (fragment?.id) {
                await initFragmentCache();
                fragmentCache.remove(fragment.id);
            }

            // Keep expanded variation rows in sync when a variation is deleted from editor.
            // This refreshes any parent/list stores that currently reference the deleted fragment.
            await this.refreshVariationParentInList(fragment, null);

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

        const createFields = [];
        ensureCompatVersionOnMerchCardFieldList(parentFragment.model?.path, createFields);

        const newFragment = await this.aem.sites.cf.fragments.create({
            title: parentFragment.title,
            description: parentFragment.description,
            modelId: parentFragment.model.id,
            parentPath: targetFolder,
            name: fragmentName,
            fields: createFields,
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
        const latestParent = await this.aem.sites.cf.fragments.getWithEtag(parentFragment.id);
        if (!latestParent) {
            throw new Error('Failed to retrieve parent fragment for update');
        }

        const variationsField = latestParent.fields.find((f) => f.name === 'variations');
        const currentVariations = variationsField?.values || [];
        if (currentVariations.includes(variationPath)) {
            return latestParent;
        }

        const updatedVariations = [...currentVariations, variationPath];

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

        try {
            const variationFragment = await this.createEmptyVariation(parentFragment, targetLocale);
            if (!variationFragment) {
                throw new Error('Failed to create variation');
            }

            await this.updateParentVariations(parentFragment, variationFragment.path);

            // Refresh the parent FragmentStore to include the new variation in references
            const parentStore = Store.fragments.list.data.get().find((store) => store.get()?.id === fragmentId);
            if (parentStore) {
                await this.refreshFragment(parentStore);
            }

            return variationFragment;
        } catch (err) {
            const existingPath = this.parseVariationAlreadyExistsPath(err?.message);
            if (existingPath) {
                await this.updateParentVariations(parentFragment, existingPath);
                const existingFragment = await this.aem.sites.cf.fragments.getByPath(existingPath);
                const parentStore = Store.fragments.list.data.get().find((store) => store.get()?.id === fragmentId);
                if (parentStore) {
                    await this.refreshFragment(parentStore);
                }
                return existingFragment;
            }
            throw err;
        }
    }

    /**
     * If message is "A variation already exists at /path/to/fragment", returns that path.
     * Used to repair parent's variations when a variation exists but was missing from the list (e.g. after a past restore).
     * @param {string} [message]
     * @returns {string|null}
     */
    parseVariationAlreadyExistsPath(message) {
        if (!message || typeof message !== 'string') return null;
        const prefix = 'A variation already exists at ';
        if (!message.startsWith(prefix)) return null;
        const path = message.slice(prefix.length).trim();
        return path.length > 0 ? path : null;
    }

    /**
     * Generates a slugified fragment name from fragment tags (product first) + locale codes (first 3).
     * @param {Object} fragment - The parent fragment
     * @param {string[]} pznTags - Array of locale codes (e.g. ['fr_BE', 'fr_CH', 'fr_CA'])
     * @returns {string} The generated fragment name
     */
    generateGroupedVariationName(fragment, pznTags) {
        const parts = [];
        const product = fragment.getCurrentTagTitle?.(MAS_PRODUCT_CODE_PREFIX) || fragment.getTagTitle?.('mas:product/');
        if (product) parts.push(product);

        const customerSegment = fragment.getTagTitle('customer_segment');
        if (customerSegment) parts.push(customerSegment);

        const marketSegment = fragment.getTagTitle('market_segment');
        if (marketSegment) parts.push(marketSegment);

        if (parts.length === 0) {
            parts.push(fragment.title || 'variation');
        }

        if (pznTags?.length) {
            parts.push(...pznTags.slice(0, 3));
        }

        return parts
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    async #resolveParentForVariationSearch(variationFragment) {
        const path = variationFragment.path;
        const { tab } = classifyVariationByPath(path);

        if (tab === VARIATION_SEARCH_TABS.GROUPED) {
            return await this.resolveHydratedParentFragment(path);
        }
        if (tab === VARIATION_SEARCH_TABS.PROMOTION) {
            const candidates = resolvePromoVariationParentPath(path);
            for (const candidatePath of candidates) {
                const fragment = await getFragmentByPathOrNull(this.aem.sites.cf.fragments, candidatePath, {
                    references: 'direct-hydrated',
                });
                if (fragment) return fragment;
            }
            return null;
        }
        if (tab === VARIATION_SEARCH_TABS.LOCALE) {
            const parentPath = resolveLocaleVariationParentPath(path);
            if (!parentPath) return null;
            return await this.aem.sites.cf.fragments.getByPath(parentPath);
        }
        return null;
    }

    /**
     * Resolves the parent fragment for the provided fragment path and hydrates references.
     * Finds the parent whose variations field contains fragmentPath.
     * Flow: referencedBy -> filter by variations field -> getById (hydrated)
     * Note: localization copies the `variations` field to all locale copies, so
     * getReferencedBy may return 30+ candidates. We sort to check the default-locale
     * parent first since grouped variations always derive from the default locale.
     * @param {string} fragmentPath
     * @returns {Promise<Object|null>}
     */
    async resolveHydratedParentFragment(fragmentPath) {
        const references = await this.aem.sites.cf.fragments.getReferencedBy(fragmentPath);
        const parentRefs = references?.parentReferences || [];
        if (!parentRefs.length) return null;

        const surface = extractSurfaceFromPath(fragmentPath);
        const variationLocale = extractLocaleFromPath(fragmentPath);
        const defaultLocale = surface && variationLocale ? getDefaultLocaleCode(surface, variationLocale) : null;
        const sortedRefs = defaultLocale
            ? [...parentRefs].sort((a, b) => {
                  const aIsDefault = extractLocaleFromPath(a.path) === defaultLocale ? -1 : 1;
                  const bIsDefault = extractLocaleFromPath(b.path) === defaultLocale ? -1 : 1;
                  return aIsDefault - bIsDefault;
              })
            : parentRefs;

        for (const ref of sortedRefs) {
            const candidate = await this.aem.sites.cf.fragments.getByPath(ref.path);
            if (!candidate) continue;

            const variationsField = candidate.fields?.find((f) => f.name === 'variations');
            const variations = variationsField?.values || [];
            if (!variations.includes(fragmentPath)) continue;

            if (!candidate.id) return candidate;

            const hydrated = await this.aem.sites.cf.fragments.getById(candidate.id);
            return hydrated || candidate;
        }

        return null;
    }

    /**
     * Creates a grouped variation fragment under en_US/{productArrangementCode}/pzn/.
     * @param {string} fragmentId - The parent fragment ID
     * @param {string[]} pznTags - Array of locale codes (e.g. ['fr_FR', 'fr_CH', 'fr_BE'])
     * @param {Object} offerData - The resolved WCS offer data containing productArrangementCode
     * @returns {Promise<Object>} The created variation fragment
     */
    async createGroupedVariation(fragmentId, pznTags, offerData) {
        const sourceFragment = await this.aem.sites.cf.fragments.getById(fragmentId);
        if (!sourceFragment) {
            throw new Error('Failed to fetch parent fragment');
        }

        let parentFragment = sourceFragment;
        if (Fragment.isGroupedVariationPath(sourceFragment.path)) {
            parentFragment = await this.resolveHydratedParentFragment(sourceFragment.path);
            if (!parentFragment) {
                throw new Error('Failed to resolve parent fragment for grouped variation');
            }
        }

        const fragment = new Fragment(parentFragment);

        const productArrangementCode = offerData?.productArrangementCode;
        if (!productArrangementCode) {
            throw new Error('Product arrangement code not available. The parent fragment must have a resolved offer.');
        }

        const parentPath = parentFragment.path;
        const surface = extractSurfaceFromPath(parentPath);
        if (!surface) {
            throw new Error('Could not determine surface from parent path');
        }
        let fragmentName = this.generateGroupedVariationName(fragment, pznTags);
        const targetFolder = `${ROOT_PATH}/${surface}/en_US/${productArrangementCode}/${PZN_FOLDER}`;

        await this.aem.sites.cf.fragments.ensureFolderExists(targetFolder);

        const existingFragment = await this.aem.sites.cf.fragments
            .getByPath(`${targetFolder}/${fragmentName}`)
            .catch(() => null);
        if (existingFragment) {
            const suffix = Array.from({ length: 4 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
            fragmentName = `${fragmentName}-${suffix}`;
        }

        const groupedFields = [];
        if (pznTags?.length) {
            groupedFields.push({ name: 'pznTags', type: 'tag', multiple: true, values: pznTags });
        }

        // Snapshot parent list fields so grouped collection variations do not inherit live parent edits.
        if (parentFragment.model?.path === COLLECTION_MODEL_PATH) {
            for (const name of ['cards', 'collections']) {
                const field = (parentFragment.fields || []).find((f) => f.name === name);
                if (field?.values?.length) {
                    groupedFields.push({
                        name,
                        type: field.type || 'content-reference',
                        multiple: field.multiple !== false,
                        values: [...field.values],
                    });
                }
            }
        }

        ensureCompatVersionOnMerchCardFieldList(parentFragment.model?.path, groupedFields);

        const newFragment = await this.aem.sites.cf.fragments.create({
            title: parentFragment.title,
            description: parentFragment.description,
            modelId: parentFragment.model.id,
            parentPath: targetFolder,
            name: fragmentName,
            fields: groupedFields,
        });

        if (parentFragment.tags?.length) {
            await this.aem.sites.cf.fragments.copyFragmentTags(newFragment, parentFragment.tags);
        }

        const createdFragment = await this.aem.sites.cf.fragments.pollCreatedFragment(newFragment);
        if (!createdFragment) {
            throw new Error('Failed to create grouped variation');
        }

        await this.updateParentVariations(parentFragment, createdFragment.path);
        const parentStore = Store.fragments.list.data.get().find((store) => store.get()?.id === parentFragment.id);
        if (parentStore) {
            await this.refreshFragment(parentStore);
        }

        return createdFragment;
    }

    /**
     * Duplicates an existing grouped variation with new pznTags.
     * Copies all fields (except variations) from the source, applies new pznTags,
     * and registers the copy with the parent fragment.
     * @param {string} sourceVariationId - The ID of the grouped variation to duplicate
     * @param {string[]} pznTags - New pznTags for the duplicate
     * @returns {Promise<Object>} The created duplicate fragment
     */
    async duplicateGroupedVariation(sourceVariationId, pznTags) {
        const sourceFragment = await this.aem.sites.cf.fragments.getById(sourceVariationId);
        if (!sourceFragment) {
            throw new Error('Failed to fetch source grouped variation');
        }

        const parentFragment = await this.resolveHydratedParentFragment(sourceFragment.path);
        if (!parentFragment) {
            throw new Error('Failed to resolve parent fragment for grouped variation');
        }

        const parent = new Fragment(parentFragment);
        const targetFolder = sourceFragment.path.split('/').slice(0, -1).join('/');

        let fragmentName = this.generateGroupedVariationName(parent, pznTags);
        const existingFragment = await this.aem.sites.cf.fragments
            .getByPath(`${targetFolder}/${fragmentName}`)
            .catch(() => null);
        if (existingFragment) {
            const suffix = Array.from({ length: 4 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
            fragmentName = `${fragmentName}-${suffix}`;
        }

        const fieldsToClone = sourceFragment.fields
            .filter((field) => field.name !== 'variations')
            .map((field) => (field.name === 'pznTags' ? { ...field, values: pznTags } : field));

        ensureCompatVersionOnMerchCardFieldList(sourceFragment.model?.path, fieldsToClone);

        const newFragment = await this.aem.sites.cf.fragments.create({
            title: sourceFragment.title,
            description: sourceFragment.description,
            modelId: sourceFragment.model.id,
            parentPath: targetFolder,
            name: fragmentName,
            fields: fieldsToClone,
        });

        if (sourceFragment.tags?.length) {
            await this.aem.sites.cf.fragments.copyFragmentTags(newFragment, sourceFragment.tags);
        }

        const createdFragment = await this.aem.sites.cf.fragments.pollCreatedFragment(newFragment);
        if (!createdFragment) {
            throw new Error('Failed to duplicate grouped variation');
        }

        await this.updateParentVariations(parentFragment, createdFragment.path);
        const parentStore = Store.fragments.list.data.get().find((store) => store.get()?.id === parentFragment.id);
        if (parentStore) {
            await this.refreshFragment(parentStore);
        }

        return createdFragment;
    }

    /**
     * Updates a given fragment store with the latest data
     * @param {FragmentStore} store
     */
    async refreshFragment(store, { skipPromoMerge = false } = {}) {
        store.setLoading(true);
        const id = store.get().id;
        let latest = await this.aem.sites.cf.fragments.getById(id);
        if (!skipPromoMerge) {
            latest = await promotionsRepository.mergePromoReferencesIntoFragmentData(this.aem, latest, () =>
                this.loadPromotions(),
            );
        }

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
        const currentOptions = this.#dedupeAddonOptions(Store.placeholders.addons.data.get());
        if (currentOptions.length !== Store.placeholders.addons.data.get().length) {
            Store.placeholders.addons.data.set(currentOptions);
        }
        if (currentOptions.length > 1) return;
        if (this.#addonPlaceholdersRequest) return this.#addonPlaceholdersRequest;

        this.#addonPlaceholdersRequest = this.#loadAddonPlaceholders();
        await this.#addonPlaceholdersRequest;
    }

    async #loadAddonPlaceholders() {
        Store.placeholders.addons.loading.set(true);
        try {
            await this.loadPreviewPlaceholders();
            const dictionary = Store.previewDictionary();
            if (Store.previewDictionaryReady()) {
                const addonFragments = Object.keys(dictionary)
                    .filter((key) => /^addon-/.test(key))
                    .map((key) => ({ value: key, itemText: key }));
                const nextOptions = this.#dedupeAddonOptions([...Store.placeholders.addons.data.get(), ...addonFragments]);
                Store.placeholders.addons.data.set(nextOptions);
            }
        } catch (error) {
            this.processError(error, 'Could not load addon placeholders.');
        } finally {
            this.#addonPlaceholdersRequest = null;
            Store.placeholders.addons.loading.set(false);
        }
    }

    #dedupeAddonOptions(options) {
        const seen = new Set();
        const uniqueOptions = [];
        for (const option of options) {
            const key = option.value;
            if (seen.has(key)) continue;
            seen.add(key);
            uniqueOptions.push(option);
        }
        return uniqueOptions;
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-repository', MasRepository);
