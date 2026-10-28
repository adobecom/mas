import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { isVariantMatch, getVariantTreeData, VARIANTS } from '../../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../../store.js';
import ItemsSelectionController from '../../reactivity/items-selection-controller.js';
import {
    AEM_TAG_PATH_PRODUCT_CODE_ROOT,
    FILTER_TYPE,
    FRAGMENT_STATUS_OPTIONS,
    PAGE_NAMES,
    TABLE_TYPE,
} from '../../constants.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { ReactiveStore } from '../../reactivity/reactive-store.js';
import { AEM } from '../../aem/aem.js';
import { Fragment } from '../../aem/fragment.js';
import { ensureNamespaceTags, getNamespaceCache, getNamespaceInflight } from '../../aem/tag-cache.js';
import { PZN_TAG_ID_PREFIX, tagRefToTagId } from '../utils/personalization-utils.js';
import { loadProductArrangementCodes } from '../utils/product-arrangement-codes.js';
import '../../aem/aem-tag-picker-field.js';
import '../../fields/user-picker.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';
const VARIANT_TAG_PREFIX = 'mas:variant/';
const PRODUCT_ARRANGEMENT_CODE_TAG_PREFIX = 'mas:product_arrangement_code/';
const EMPTY_TAGS_BY_TYPE = {
    offer_type: [],
    plan_type: [],
    market_segments: [],
    customer_segment: [],
    product_code: [],
    pzn: [],
    status: [],
    variant: [],
    'studio/content-type': [],
    custom: [],
    'workflow-step': [],
};
const SELECTOR_FILTER_TYPES = ['market_segments', 'customer_segment', 'product_code', 'variant'];
const STRIPPED_FILTER_TYPES = [...SELECTOR_FILTER_TYPES, 'studio/content-type'];
const DEFAULT_ENABLED_FILTERS = [
    FILTER_TYPE.TEMPLATE,
    FILTER_TYPE.OFFER_TYPE,
    FILTER_TYPE.PLAN_TYPE,
    FILTER_TYPE.WORKFLOW_STEP,
    FILTER_TYPE.MARKET_SEGMENT,
    FILTER_TYPE.CUSTOMER_SEGMENT,
    FILTER_TYPE.PRODUCT,
    FILTER_TYPE.TAG,
    FILTER_TYPE.STATUS,
    FILTER_TYPE.PZN,
];
const sameValues = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

class MasSearchAndFilters extends LitElement {
    static styles = styles;

    #savedSearch = null;
    #savedFilters = null;
    #lastForcedSearchSignature = null;
    #defaultTemplateFilterApplied = false;
    #tagCachePromise = null;
    #tagPathsBySelection = new WeakMap();
    #createdByStore = new ReactiveStore([]);
    #syncingCreatedByStore = false;
    // Search/filters come from the active items-selection store when it provides them
    // (e.g. the compare-chart picker), else the global stores. Resolved at connect.
    #searchStore = Store.search;
    #filtersStore = Store.filters;
    itemsSelection = new ItemsSelectionController(this);

    // Overlay open/close events from the internal filter popovers are an
    // implementation detail; stop them at the host so ancestor overlays
    // (e.g. the promotions add-items overlay) never see them.
    #stopOverlayEventPropagation = (event) => event.stopPropagation();

    static properties = {
        type: { type: String }, // 'cards' | 'collections' | 'placeholders'
        searchQuery: { type: String },
        templateFilter: { type: Array, state: true },
        marketSegmentFilter: { type: Array, state: true },
        customerSegmentFilter: { type: Array, state: true },
        productFilter: { type: Array, state: true },
        offerTypeFilter: { type: Array, state: true },
        planTypeFilter: { type: Array, state: true },
        workflowStepFilter: { type: Array, state: true },
        pznFilter: { type: Array, state: true },
        tagFilter: { type: Array, state: true },
        statusFilter: { type: Array, state: true },
        productArrangementCodeFilter: { type: Array, state: true },
        createdByFilter: { type: Array, state: true },
        openFilterPicker: { type: String, state: true },
        filterPickerSearch: { type: String, state: true },
        templateOptions: { type: Array },
        marketSegmentOptions: { type: Array },
        customerSegmentOptions: { type: Array },
        productOptions: { type: Array },
        offerTypeOptions: { type: Array },
        planTypeOptions: { type: Array },
        workflowStepOptions: { type: Array },
        pznOptions: { type: Array },
        tagOptions: { type: Array },
        statusOptions: { type: Array },
        productArrangementCodeOptions: { type: Array },
        /** FILTER_TYPE values to render, in display order. Defaults to every tag/status filter. */
        enabledFilters: { type: Array, attribute: false },
        /** When set, renders a "Reset Filters" button that clears the search query and every filter. */
        showReset: { type: Boolean, attribute: 'show-reset' },
        /** When set, the result count is not rendered (the host shows its own next to the search field). */
        hideCount: { type: Boolean, attribute: 'hide-count' },
        /**
         * Optional `(fragment, filterType) => string[] | undefined` returning the values a fragment is matched on
         * for market segment and product arrangement code filters; tags are used when it returns undefined.
         */
        filterValueResolver: { attribute: false },
        searchOnly: { type: Boolean, reflect: true },
        /** When set, preselects this template variant and prevents changing the Template filter. */
        lockedTemplateFilter: { type: String, attribute: 'locked-template-filter' },
        /** When set, preselects this template variant initially while still allowing it to be changed. */
        defaultTemplateFilter: { type: String, attribute: 'default-template-filter' },
        promotionSurfaceOptions: { type: Array },
        promotionSurface: { type: String },
        offerFilterOptions: { type: Array },
        offerFilterValue: { type: String },
        /** If true, don't overwrite productFilter — the consumer controls it (offers for promotions). */
        externalProductFilter: { type: Boolean },
        /** When set, card search also matches grouped variation ids and personalization tags (promotions picker). */
        matchVariationsAndTags: { type: Boolean, attribute: false },
    };

    constructor() {
        super();
        this.searchQuery = '';
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.offerTypeFilter = [];
        this.planTypeFilter = [];
        this.workflowStepFilter = [];
        this.pznFilter = [];
        this.tagFilter = [];
        this.statusFilter = [];
        this.productArrangementCodeFilter = [];
        this.createdByFilter = [];
        this.openFilterPicker = '';
        this.filterPickerSearch = '';
        this.templateOptions = [];
        this.marketSegmentOptions = [];
        this.customerSegmentOptions = [];
        this.productOptions = [];
        this.offerTypeOptions = [];
        this.planTypeOptions = [];
        this.workflowStepOptions = [];
        this.pznOptions = [];
        this.tagOptions = [];
        this.statusOptions = [];
        this.productArrangementCodeOptions = [];
        this.enabledFilters = DEFAULT_ENABLED_FILTERS;
        this.showReset = false;
        this.hideCount = false;
        this.filterValueResolver = null;
        this.dataSubscription = null;
        this.lockedTemplateFilter = '';
        this.defaultTemplateFilter = '';
        this.promotionSurfaceOptions = [];
        this.promotionSurface = '';
        this.offerFilterOptions = [];
        this.offerFilterValue = '';
        this.externalProductFilter = false;
        this.matchVariationsAndTags = false;
    }

    get #isTemplateFilterLocked() {
        return Boolean(this.lockedTemplateFilter);
    }

    #syncLockedTemplateFilter() {
        if (!this.#isTemplateFilterLocked) return;
        if (this.templateFilter.length === 1 && this.templateFilter[0] === this.lockedTemplateFilter) return;
        this.templateFilter = [this.lockedTemplateFilter];
    }

    #applyDefaultTemplateFilter() {
        if (this.#isTemplateFilterLocked || !this.defaultTemplateFilter) return;
        if (this.#defaultTemplateFilterApplied) return;
        this.#defaultTemplateFilterApplied = true;
        if (this.templateFilter.length) return;
        this.templateFilter = [this.defaultTemplateFilter];
    }

    #tagsList(tags) {
        if (Array.isArray(tags)) return tags.filter(Boolean);
        if (typeof tags === 'string' || typeof tags === 'number') return String(tags).split(',').filter(Boolean);
        return [];
    }

    #tagsByType(tags) {
        return this.#tagsList(tags).reduce(
            (acc, tag) => {
                const tagPath = tag.replace('mas:', '');
                const parts = tagPath.split('/');
                let type = parts[0];

                for (let i = 1; i < parts.length; i++) {
                    const potentialType = parts.slice(0, i + 1).join('/');
                    if (potentialType in EMPTY_TAGS_BY_TYPE) type = potentialType;
                }

                return {
                    ...acc,
                    [type]: [...(acc[type] || []), tag],
                };
            },
            { ...EMPTY_TAGS_BY_TYPE },
        );
    }

    #isManagedTag(tag) {
        const tagPath = tag.replace('mas:', '');
        return STRIPPED_FILTER_TYPES.some((type) => tagPath === type || tagPath.startsWith(`${type}/`));
    }

    #setFilterIfChanged(property, values) {
        if (sameValues(this[property] || [], values)) return;
        this[property] = values;
    }

    get #syncsFiltersToStore() {
        return this.type === TABLE_TYPE.CARDS || this.type === TABLE_TYPE.BASELINES;
    }

    #isFilterEnabled(filterType) {
        return this.enabledFilters.includes(filterType);
    }

    #syncFiltersFromStore() {
        if (!this.#syncsFiltersToStore) return;
        const filters = this.#filtersStore.get();
        const tagsByType = this.#tagsByType(filters?.tags);
        if (!this.#isTemplateFilterLocked) {
            this.#setFilterIfChanged(
                'templateFilter',
                tagsByType.variant.map((tag) => tag.replace(VARIANT_TAG_PREFIX, '')),
            );
        }
        this.#setFilterIfChanged('marketSegmentFilter', tagsByType.market_segments);
        this.#setFilterIfChanged('customerSegmentFilter', tagsByType.customer_segment);
        if (!this.externalProductFilter) {
            this.#setFilterIfChanged('productFilter', tagsByType.product_code);
        }
        this.#setFilterIfChanged('productArrangementCodeFilter', this.#tagsList(filters?.paCodes));
        this.#setFilterIfChanged('createdByFilter', this.#tagsList(filters?.createdBy));
    }

    #onFiltersStoreChange = () => {
        this.#syncFiltersFromStore();
    };

    #onCreatedByStoreChange = (users) => {
        if (this.#syncingCreatedByStore) return;
        this.#setFilterIfChanged(
            'createdByFilter',
            users.map(({ userPrincipalName }) => userPrincipalName),
        );
    };

    #syncCreatedByStore() {
        const toNames = (users) => users.map(({ userPrincipalName }) => userPrincipalName);
        const selectedUsers = (Store.users.get() ?? []).filter(({ userPrincipalName }) =>
            this.createdByFilter.includes(userPrincipalName),
        );
        if (sameValues(toNames(this.#createdByStore.get()), toNames(selectedUsers))) return;
        this.#syncingCreatedByStore = true;
        this.#createdByStore.set(selectedUsers);
        this.#syncingCreatedByStore = false;
    }

    #userDisplayName(userPrincipalName) {
        return (
            (Store.users.get() ?? []).find((user) => user.userPrincipalName === userPrincipalName)?.displayName ??
            userPrincipalName
        );
    }

    #syncRepositorySearch() {
        if (!this.#syncsFiltersToStore) return;

        const nextQuery = this.searchQuery?.trim() || undefined;
        const currentSearch = this.#searchStore.get() || {};
        const currentQuery = currentSearch.query || undefined;
        if (currentQuery !== nextQuery) {
            const nextSearch = { ...currentSearch };
            if (nextQuery) {
                nextSearch.query = nextQuery;
            } else {
                delete nextSearch.query;
            }
            this.#searchStore.set(nextSearch);
        }

        const currentFilters = this.#filtersStore.get() || {};
        const unmanagedTags = this.#tagsList(currentFilters.tags).filter((tag) => !this.#isManagedTag(tag));
        const variantTags = (this.templateFilter || []).filter(Boolean).map((template) => `${VARIANT_TAG_PREFIX}${template}`);
        const nextTags = [
            ...unmanagedTags,
            ...(this.marketSegmentFilter || []),
            ...(this.customerSegmentFilter || []),
            ...(this.productFilter || []),
            ...variantTags,
        ].join(',');
        const currentTags = this.#tagsList(currentFilters.tags).join(',');
        const nextPaCodes = this.productArrangementCodeFilter.join(',');
        const nextCreatedBy = this.createdByFilter.join(',');
        if (
            currentTags !== nextTags ||
            this.#tagsList(currentFilters.paCodes).join(',') !== nextPaCodes ||
            this.#tagsList(currentFilters.createdBy).join(',') !== nextCreatedBy
        ) {
            const nextFilters = {
                ...currentFilters,
                tags: nextTags || undefined,
                paCodes: nextPaCodes,
                createdBy: nextCreatedBy,
            };
            if (!nextPaCodes) delete nextFilters.paCodes;
            if (!nextCreatedBy) delete nextFilters.createdBy;
            this.#filtersStore.set(nextFilters);
        }

        this.#forceRepositorySearchInFragmentEditor(nextQuery, nextTags);
    }

    #forceRepositorySearchInFragmentEditor(query, tags) {
        if (Store.page.get() !== PAGE_NAMES.FRAGMENT_EDITOR) return;
        const signature = `${query || ''}\0${tags}`;
        if (this.#lastForcedSearchSignature === signature) return;
        this.#lastForcedSearchSignature = signature;
        document.querySelector('mas-repository')?.searchFragments?.({ force: true, query, tags });
    }

    #refreshOptionsAfterTagCacheLoad(cachePromise) {
        if (this.#tagCachePromise === cachePromise) return;
        this.#tagCachePromise = cachePromise;
        cachePromise.finally(() => {
            if (!this.isConnected) return;
            this.#tagCachePromise = null;
            if (!this.searchOnly) this.#extractFilterOptions();
            if (this.matchVariationsAndTags) this.#applyFilters();
            this.requestUpdate();
        });
    }

    #loadTagOptions() {
        if (getNamespaceCache(MAS_TAG_NAMESPACE)) return;

        const inflightLoad = getNamespaceInflight(MAS_TAG_NAMESPACE);
        if (inflightLoad) {
            this.#refreshOptionsAfterTagCacheLoad(inflightLoad);
            return;
        }

        const baseUrl = document.querySelector('meta[name="aem-base-url"]')?.content;
        if (!baseUrl) return;

        const loadPromise = ensureNamespaceTags(MAS_TAG_NAMESPACE, (namespace) => new AEM(null, baseUrl).tags.list(namespace));
        this.#refreshOptionsAfterTagCacheLoad(loadPromise);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('sp-opened', this.#stopOverlayEventPropagation);
        this.addEventListener('sp-closed', this.#stopOverlayEventPropagation);
        const selectionStore = this.itemsSelection.value;
        this.#searchStore = selectionStore.search;
        this.#filtersStore = selectionStore.filters;
        if (this.#isFilterEnabled(FILTER_TYPE.CREATED_BY)) this.#createdByStore.subscribe(this.#onCreatedByStoreChange);
        if (this.#syncsFiltersToStore) {
            this.#savedSearch = this.#searchStore.get();
            this.#savedFilters = this.#filtersStore.get();
            this.#syncFiltersFromStore();
            this.#syncLockedTemplateFilter();
            this.#applyDefaultTemplateFilter();
            this.#syncRepositorySearch();
            if (!this.searchOnly) this.#loadTagOptions();
        } else {
            this.#syncLockedTemplateFilter();
        }
        if (this.type === TABLE_TYPE.BASELINES) this.#filtersStore.subscribe(this.#onFiltersStoreChange);
        if (!this.searchOnly && this.#isFilterEnabled(FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE)) {
            loadProductArrangementCodes().then((options) => {
                if (this.isConnected) this.productArrangementCodeOptions = options;
            });
        }
        this.commonDataController = new ReactiveController(this, [
            selectionStore[`all${this.typeUppercased}`],
            selectionStore[`display${this.typeUppercased}`],
            this.#listStore.loading,
            ...(this.#listStore === Store.fragments.list ? [Store.fragments.list.firstPageLoaded] : []),
            ...(this.#isFilterEnabled(FILTER_TYPE.CREATED_BY) ? [Store.users] : []),
        ]);
        const dataCallback = () => {
            if (!this.searchOnly) {
                this.#extractFilterOptions();
            }
            this.#applyFilters();
            this.requestUpdate();
        };
        selectionStore[`all${this.typeUppercased}`].subscribe(dataCallback);
        this.dataSubscription = {
            unsubscribe: () => selectionStore[`all${this.typeUppercased}`].unsubscribe(dataCallback),
        };
        if (!this.searchOnly && this.type !== TABLE_TYPE.PLACEHOLDERS) {
            this.statusOptions = FRAGMENT_STATUS_OPTIONS;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('sp-opened', this.#stopOverlayEventPropagation);
        this.removeEventListener('sp-closed', this.#stopOverlayEventPropagation);
        const selectionStore = this.itemsSelection.value;
        if (selectionStore) {
            selectionStore[`display${this.typeUppercased}`].set(selectionStore[`all${this.typeUppercased}`].value);
        }
        this.dataSubscription?.unsubscribe();
        this.#filtersStore.unsubscribe(this.#onFiltersStoreChange);
        this.#createdByStore.unsubscribe(this.#onCreatedByStoreChange);
        if (this.#syncsFiltersToStore) {
            if (this.#savedSearch !== null) {
                this.#searchStore.set(this.#savedSearch);
            }
            if (this.#savedFilters !== null) {
                this.#filtersStore.set(this.#savedFilters);
            }
        }
    }

    get typeUppercased() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    get #listStore() {
        if (this.type === TABLE_TYPE.PLACEHOLDERS) return Store.placeholders.list;
        if (this.type === TABLE_TYPE.BASELINES) return Store.baselines.list;
        return Store.fragments.list;
    }

    get isLoading() {
        if (this.#listStore !== Store.fragments.list) return this.#listStore.loading.get();
        return Store.fragments.list.firstPageLoaded.get() === false;
    }

    get isLoadingMore() {
        if (this.#listStore !== Store.fragments.list) return false;
        return Store.fragments.list.firstPageLoaded.get() === true && Store.fragments.list.loading.get();
    }

    get appliedFilters() {
        const filters = [];
        const templateMap = new Map(this.templateOptions.map((opt) => [opt.id || opt.value, opt]));
        const marketSegmentMap = new Map(this.marketSegmentOptions.map((opt) => [opt.id || opt.value, opt]));
        const customerSegmentMap = new Map(this.customerSegmentOptions.map((opt) => [opt.id || opt.value, opt]));
        const productMap = new Map(this.productOptions.map((opt) => [opt.id || opt.value, opt]));
        const offerTypeMap = new Map(this.offerTypeOptions.map((opt) => [opt.id || opt.value, opt]));
        const planTypeMap = new Map(this.planTypeOptions.map((opt) => [opt.id || opt.value, opt]));
        const workflowStepMap = new Map(this.workflowStepOptions.map((opt) => [opt.id || opt.value, opt]));
        const pznMap = new Map(this.pznOptions.map((opt) => [opt.id || opt.value, opt]));
        const tagMap = new Map(this.tagOptions.map((opt) => [opt.id || opt.value, opt]));
        const statusMap = new Map(this.statusOptions.map((opt) => [opt.id || opt.value, opt]));

        for (const id of this.templateFilter) {
            const option = templateMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.TEMPLATE, id, label: option.title || option.label });
        }
        for (const id of this.marketSegmentFilter) {
            const option = marketSegmentMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.MARKET_SEGMENT, id, label: option.title || option.label });
        }
        for (const id of this.customerSegmentFilter) {
            const option = customerSegmentMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.CUSTOMER_SEGMENT, id, label: option.title || option.label });
        }
        for (const id of this.productFilter) {
            const option = productMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.PRODUCT, id, label: option.title || option.label });
        }
        for (const id of this.offerTypeFilter) {
            const option = offerTypeMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.OFFER_TYPE, id, label: option.title || option.label });
        }
        for (const id of this.planTypeFilter) {
            const option = planTypeMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.PLAN_TYPE, id, label: option.title || option.label });
        }
        for (const id of this.workflowStepFilter) {
            const option = workflowStepMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.WORKFLOW_STEP, id, label: option.title || option.label });
        }
        for (const id of this.pznFilter) {
            const option = pznMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.PZN, id, label: option.title || option.label });
        }
        for (const id of this.tagFilter) {
            const option = tagMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.TAG, id, label: option.title || option.label });
        }
        for (const id of this.statusFilter) {
            const option = statusMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.STATUS, id, label: option.title || option.label });
        }
        for (const id of this.productArrangementCodeFilter) {
            filters.push({ type: FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE, id, label: id });
        }
        for (const id of this.createdByFilter) {
            filters.push({ type: FILTER_TYPE.CREATED_BY, id, label: this.#userDisplayName(id) });
        }
        return filters;
    }

    #tagPathToId(path) {
        if (!path?.startsWith(`${MAS_TAG_NAMESPACE}/`)) return '';
        return `mas:${path.replace(`${MAS_TAG_NAMESPACE}/`, '')}`;
    }

    #tagIdToPath(tagId) {
        if (!tagId?.startsWith('mas:')) return '';
        return `${MAS_TAG_NAMESPACE}/${tagId.replace('mas:', '')}`;
    }

    #tagTitleFallback(tagId) {
        return tagId?.split('/').pop() || '';
    }

    #setOption(options, id, title = '') {
        if (!id) return;
        options.set(id, { id, title: title || this.#tagTitleFallback(id) });
    }

    #productParentTagId(tagId) {
        if (!tagId?.startsWith('mas:product_code/')) return tagId;
        const [type, product] = tagId.split('/');
        return product ? `${type}/${product}` : tagId;
    }

    #setOptionFromTagId(maps, tagId, title) {
        if (tagId.startsWith('mas:market_segments/')) {
            this.#setOption(maps.marketSegments, tagId, title);
        } else if (tagId.startsWith('mas:customer_segment/')) {
            this.#setOption(maps.customerSegments, tagId, title);
        } else if (tagId.startsWith('mas:product_code/')) {
            const productTagId = this.#productParentTagId(tagId);
            const cachedTitle = getNamespaceCache(MAS_TAG_NAMESPACE)?.get?.(this.#tagIdToPath(productTagId))?.title;
            this.#setOption(maps.products, productTagId, cachedTitle || (productTagId === tagId ? title : ''));
        } else if (tagId.startsWith('mas:offer_type/')) {
            this.#setOption(maps.offerTypes, tagId, title);
        } else if (tagId.startsWith('mas:plan_type/')) {
            this.#setOption(maps.planTypes, tagId, title);
        } else if (tagId.startsWith('mas:workflow-step/')) {
            this.#setOption(maps.workflowSteps, tagId, title);
        } else if (tagId.startsWith('mas:pzn/')) {
            this.#setOption(maps.pzns, tagId, title);
        } else if (tagId.startsWith('mas:custom/')) {
            this.#setOption(maps.customs, tagId, title);
        }
    }

    #addSelectedFilterOptions(optionMaps) {
        [
            ...(this.marketSegmentFilter || []),
            ...(this.customerSegmentFilter || []),
            ...(this.productFilter || []),
            ...(this.offerTypeFilter || []),
            ...(this.planTypeFilter || []),
            ...(this.workflowStepFilter || []),
            ...(this.pznFilter || []),
            ...(this.tagFilter || []),
        ].forEach((tagId) => {
            const cachedTag = getNamespaceCache(MAS_TAG_NAMESPACE)?.get?.(this.#tagIdToPath(tagId));
            this.#setOptionFromTagId(optionMaps, tagId, cachedTag?.title);
        });
    }

    #addCachedFilterOptions(optionMaps) {
        const cachedTags = getNamespaceCache(MAS_TAG_NAMESPACE);
        if (!cachedTags) {
            const inflightLoad = getNamespaceInflight(MAS_TAG_NAMESPACE);
            if (inflightLoad) this.#refreshOptionsAfterTagCacheLoad(inflightLoad);
            return;
        }
        if (!cachedTags.values) return;

        for (const tag of cachedTags.values()) {
            if (!tag?.path) continue;
            if (tag.path.startsWith(`${AEM_TAG_PATH_PRODUCT_CODE_ROOT}/`)) {
                const relativeProductPath = tag.path.replace(`${AEM_TAG_PATH_PRODUCT_CODE_ROOT}/`, '');
                if (relativeProductPath.includes('/')) continue;
            }
            this.#setOptionFromTagId(optionMaps, this.#tagPathToId(tag.path), tag.title || tag.name);
        }
    }

    #matchSurface(variant) {
        if (Store.page.get() === 'promotions-editor') return true;
        return getVariantTreeData(Store.surface()).some((v) => v.name === variant.value);
    }

    #extractFilterOptions() {
        const optionMaps = {
            marketSegments: new Map(),
            customerSegments: new Map(),
            products: new Map(),
            offerTypes: new Map(),
            planTypes: new Map(),
            workflowSteps: new Map(),
            pzns: new Map(),
            customs: new Map(),
        };
        this.#addSelectedFilterOptions(optionMaps);
        for (const fragment of this.itemsSelection.value[`all${this.typeUppercased}`].value) {
            for (const tag of fragment.tags ?? []) {
                const tagId = tag.id || '';
                const tagTitle = tag.title || tagId.split('/').pop() || '';
                this.#setOptionFromTagId(optionMaps, tagId, tagTitle);
            }
            if (this.matchVariationsAndTags) {
                for (const item of [fragment, ...(fragment.groupedVariations ?? [])]) {
                    for (const tag of this.#personalizationTags(item)) {
                        this.#setOptionFromTagId(optionMaps, tagRefToTagId(tag), tag.title);
                    }
                }
            }
        }
        this.#addCachedFilterOptions(optionMaps);

        const toSortedOptions = (map) => Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.templateOptions = VARIANTS.filter(
            (variant) => variant.label.toLowerCase() !== 'all' && this.#matchSurface(variant),
        )
            .map((variant) => ({
                id: variant.value,
                title: variant.label,
            }))
            .sort((a, b) => a.title.localeCompare(b.title));
        this.marketSegmentOptions = toSortedOptions(optionMaps.marketSegments);
        this.customerSegmentOptions = toSortedOptions(optionMaps.customerSegments);
        this.productOptions = toSortedOptions(optionMaps.products);
        this.offerTypeOptions = toSortedOptions(optionMaps.offerTypes);
        this.planTypeOptions = toSortedOptions(optionMaps.planTypes);
        this.workflowStepOptions = toSortedOptions(optionMaps.workflowSteps);
        this.pznOptions = toSortedOptions(optionMaps.pzns);
        this.tagOptions = toSortedOptions(optionMaps.customs);
    }

    willUpdate(changed) {
        if (this.#isFilterEnabled(FILTER_TYPE.CREATED_BY)) this.#syncCreatedByStore();
        if (changed.has('lockedTemplateFilter') || (changed.has('templateFilter') && this.#isTemplateFilterLocked)) {
            this.#syncLockedTemplateFilter();
        }
        if (this.matchVariationsAndTags) {
            for (const selectedValues of [
                this.offerTypeFilter,
                this.planTypeFilter,
                this.workflowStepFilter,
                this.marketSegmentFilter,
                this.customerSegmentFilter,
                this.productFilter,
                this.tagFilter,
                this.pznFilter,
            ]) {
                if (!this.#tagPathsBySelection.has(selectedValues)) {
                    this.#tagPathsBySelection.set(selectedValues, this.#selectedTagPaths(selectedValues));
                }
            }
        }
        if (
            changed.has('searchQuery') ||
            changed.has('templateFilter') ||
            changed.has('marketSegmentFilter') ||
            changed.has('customerSegmentFilter') ||
            changed.has('productFilter') ||
            changed.has('offerTypeFilter') ||
            changed.has('planTypeFilter') ||
            changed.has('workflowStepFilter') ||
            changed.has('pznFilter') ||
            changed.has('tagFilter') ||
            changed.has('statusFilter') ||
            changed.has('productArrangementCodeFilter') ||
            changed.has('createdByFilter') ||
            changed.has('filterValueResolver') ||
            changed.has('matchVariationsAndTags')
        ) {
            if (
                changed.has('searchQuery') ||
                changed.has('templateFilter') ||
                changed.has('lockedTemplateFilter') ||
                changed.has('marketSegmentFilter') ||
                changed.has('customerSegmentFilter') ||
                changed.has('productFilter') ||
                changed.has('productArrangementCodeFilter') ||
                changed.has('createdByFilter')
            ) {
                this.#syncRepositorySearch();
            }
            this.#applyFilters();
        }
    }

    #notifyProductFilterChange() {
        if (this.type !== TABLE_TYPE.CARDS || !this.externalProductFilter) return;
        this.dispatchEvent(
            new CustomEvent('product-filter-change', {
                detail: { value: this.productFilter },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleCheckboxChange(filterType, optionId, e) {
        e.stopPropagation();
        if (filterType === FILTER_TYPE.TEMPLATE && this.#isTemplateFilterLocked) return;
        let currentValues;
        switch (filterType) {
            case FILTER_TYPE.TEMPLATE:
                currentValues = [...this.templateFilter];
                break;
            case FILTER_TYPE.MARKET_SEGMENT:
                currentValues = [...this.marketSegmentFilter];
                break;
            case FILTER_TYPE.CUSTOMER_SEGMENT:
                currentValues = [...this.customerSegmentFilter];
                break;
            case FILTER_TYPE.PRODUCT:
                currentValues = [...this.productFilter];
                break;
            case FILTER_TYPE.OFFER_TYPE:
                currentValues = [...this.offerTypeFilter];
                break;
            case FILTER_TYPE.PLAN_TYPE:
                currentValues = [...this.planTypeFilter];
                break;
            case FILTER_TYPE.PZN:
                currentValues = [...this.pznFilter];
                break;
            case FILTER_TYPE.TAG:
                currentValues = [...this.tagFilter];
                break;
            case FILTER_TYPE.STATUS:
                currentValues = [...this.statusFilter];
                break;
            case FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE:
                currentValues = [...this.productArrangementCodeFilter];
                break;
            default:
                currentValues = [];
        }

        if (e.target.checked) {
            if (!currentValues.includes(optionId)) {
                currentValues.push(optionId);
            }
        } else {
            currentValues = currentValues.filter((id) => id !== optionId);
        }

        switch (filterType) {
            case FILTER_TYPE.TEMPLATE:
                this.templateFilter = currentValues;
                break;
            case FILTER_TYPE.MARKET_SEGMENT:
                this.marketSegmentFilter = currentValues;
                break;
            case FILTER_TYPE.CUSTOMER_SEGMENT:
                this.customerSegmentFilter = currentValues;
                break;
            case FILTER_TYPE.PRODUCT:
                this.productFilter = currentValues;
                this.#notifyProductFilterChange();
                break;
            case FILTER_TYPE.OFFER_TYPE:
                this.offerTypeFilter = currentValues;
                break;
            case FILTER_TYPE.PLAN_TYPE:
                this.planTypeFilter = currentValues;
                break;
            case FILTER_TYPE.PZN:
                this.pznFilter = currentValues;
                break;
            case FILTER_TYPE.TAG:
                this.tagFilter = currentValues;
                break;
            case FILTER_TYPE.STATUS:
                this.statusFilter = currentValues;
                break;
            case FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE:
                this.productArrangementCodeFilter = currentValues;
                break;
        }
    }

    #selectedTagPaths(selectedValues) {
        return (selectedValues || []).map((tagId) => this.#tagIdToPath(tagId)).filter(Boolean);
    }

    #handleTagPickerChange(filterType, e) {
        e.stopPropagation();
        const selectedTagIds = (e.currentTarget.value || []).map((path) => this.#tagPathToId(path)).filter(Boolean);
        switch (filterType) {
            case FILTER_TYPE.MARKET_SEGMENT:
                this.marketSegmentFilter = selectedTagIds;
                break;
            case FILTER_TYPE.CUSTOMER_SEGMENT:
                this.customerSegmentFilter = selectedTagIds;
                break;
            case FILTER_TYPE.PRODUCT:
                this.productFilter = selectedTagIds.map((tagId) => this.#productParentTagId(tagId));
                this.#notifyProductFilterChange();
                break;
            case FILTER_TYPE.OFFER_TYPE:
                this.offerTypeFilter = selectedTagIds;
                break;
            case FILTER_TYPE.PLAN_TYPE:
                this.planTypeFilter = selectedTagIds;
                break;
            case FILTER_TYPE.WORKFLOW_STEP:
                this.workflowStepFilter = selectedTagIds;
                break;
            case FILTER_TYPE.PZN:
                this.pznFilter = selectedTagIds;
                break;
            case FILTER_TYPE.TAG:
                this.tagFilter = selectedTagIds;
                break;
        }
    }

    #handleTagDelete({
        target: {
            value: { type, id },
        },
    }) {
        switch (type) {
            case FILTER_TYPE.TEMPLATE:
                if (this.#isTemplateFilterLocked) return;
                this.templateFilter = this.templateFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.MARKET_SEGMENT:
                this.marketSegmentFilter = this.marketSegmentFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.CUSTOMER_SEGMENT:
                this.customerSegmentFilter = this.customerSegmentFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.PRODUCT:
                this.productFilter = this.productFilter.filter((filterId) => filterId !== id);
                this.#notifyProductFilterChange();
                break;
            case FILTER_TYPE.OFFER_TYPE:
                this.offerTypeFilter = this.offerTypeFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.PLAN_TYPE:
                this.planTypeFilter = this.planTypeFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.WORKFLOW_STEP:
                this.workflowStepFilter = this.workflowStepFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.PZN:
                this.pznFilter = this.pznFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.TAG:
                this.tagFilter = this.tagFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.STATUS:
                this.statusFilter = this.statusFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE:
                this.productArrangementCodeFilter = this.productArrangementCodeFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.CREATED_BY:
                this.createdByFilter = this.createdByFilter.filter((filterId) => filterId !== id);
                break;
        }
    }

    #clearAllFilters() {
        if (this.#isTemplateFilterLocked) {
            this.#syncLockedTemplateFilter();
        } else {
            this.templateFilter = [];
        }
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.offerTypeFilter = [];
        this.planTypeFilter = [];
        this.workflowStepFilter = [];
        this.pznFilter = [];
        this.tagFilter = [];
        this.statusFilter = [];
        this.productArrangementCodeFilter = [];
        this.createdByFilter = [];
        if (this.offerFilterValue) {
            this.offerFilterValue = '';
            this.dispatchEvent(
                new CustomEvent('offer-filter-change', {
                    detail: { value: this.offerFilterValue },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    resetFilters() {
        this.#clearAllFilters();
    }

    #renderAppliedFilters() {
        if (this.appliedFilters.length === 0) return nothing;

        return html`
            <div class="applied-filters">
                <sp-tags>
                    ${repeat(
                        this.appliedFilters,
                        (filter) => `${filter.type}-${filter.id}`,
                        (filter) => html`
                            <sp-tag
                                size="s"
                                ?deletable=${!(filter.type === FILTER_TYPE.TEMPLATE && this.#isTemplateFilterLocked)}
                                .value=${{ type: filter.type, id: filter.id }}
                                @delete=${this.#handleTagDelete}
                            >
                                ${filter.label}
                            </sp-tag>
                        `,
                    )}
                </sp-tags>
                ${this.showReset
                    ? nothing
                    : html`<sp-action-button
                          quiet
                          @click=${() => {
                              this.#clearAllFilters();
                              this.#notifyProductFilterChange();
                          }}
                          >Clear all</sp-action-button
                      >`}
            </div>
        `;
    }

    #filterPickerOptions(options, filterType, searchable) {
        if (!searchable) return options;
        if (this.openFilterPicker !== filterType) return [];
        const query = this.filterPickerSearch.trim().toLowerCase();
        if (!query) return options;
        return options.filter((option) => (option.title || option.label).toLowerCase().includes(query));
    }

    #handleFilterPickerToggle(filterType, open) {
        if (open) {
            this.openFilterPicker = filterType;
        } else if (this.openFilterPicker === filterType) {
            this.openFilterPicker = '';
        }
        this.filterPickerSearch = '';
    }

    #renderFilterPicker(label, options, selectedValues, filterType, { locked = false, searchable = false } = {}) {
        if (!options.length) return nothing;
        const selectedCount = selectedValues.length;
        const displayLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label;

        return html`
            <overlay-trigger
                placement="bottom-start"
                ?disabled=${locked}
                @sp-opened=${searchable ? () => this.#handleFilterPickerToggle(filterType, true) : nothing}
                @sp-closed=${searchable ? () => this.#handleFilterPickerToggle(filterType, false) : nothing}
            >
                <sp-action-button class="template-filter" dir="ltr" slot="trigger" .disabled=${this.isLoading || locked}>
                    ${displayLabel}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>
                <sp-popover slot="click-content" class="filter-popover">
                    ${searchable
                        ? html`<sp-search
                              size="m"
                              class="filter-search"
                              placeholder="Search"
                              .value=${this.filterPickerSearch}
                              @input=${(e) => (this.filterPickerSearch = e.target.value)}
                              @submit=${(e) => e.preventDefault()}
                          ></sp-search>`
                        : nothing}
                    <div class="checkbox-list">
                        ${repeat(
                            this.#filterPickerOptions(options, filterType, searchable),
                            (option) => option.id || option.value,
                            (option) => {
                                const optionId = option.id || option.value;
                                return html`
                                    <sp-checkbox
                                        value=${optionId}
                                        ?checked=${selectedValues.includes(optionId)}
                                        ?disabled=${locked}
                                        @change=${(e) => this.#handleCheckboxChange(filterType, optionId, e)}
                                    >
                                        ${option.title || option.label}
                                    </sp-checkbox>
                                `;
                            },
                        )}
                    </div>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    #renderTagPicker(label, top, selectedValues, filterType) {
        return html`
            <aem-tag-picker-field
                namespace=${MAS_TAG_NAMESPACE}
                top=${top}
                label=${label}
                multiple
                selection="checkbox"
                .quiet=${false}
                .value=${this.matchVariationsAndTags
                    ? this.#tagPathsBySelection.get(selectedValues)
                    : this.#selectedTagPaths(selectedValues)}
                ?disabled=${this.isLoading}
                @change=${(e) => this.#handleTagPickerChange(filterType, e)}
            ></aem-tag-picker-field>
        `;
    }

    #renderPromotionSurfacePicker() {
        if (!this.promotionSurfaceOptions?.length || this.promotionSurfaceOptions.length <= 1) {
            return nothing;
        }
        const displayLabel = 'Surface';

        return html`
            <overlay-trigger placement="bottom-start">
                <sp-action-button slot="trigger" .disabled=${this.isLoading}>
                    ${displayLabel}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>
                <sp-popover slot="click-content" class="filter-popover">
                    <sp-menu>
                        ${this.promotionSurfaceOptions.map(
                            (opt) => html`
                                <sp-menu-item
                                    value=${opt.id}
                                    ?selected=${opt.id === this.promotionSurface}
                                    @click=${(e) => {
                                        e.stopPropagation();
                                        if (opt.id === this.promotionSurface) return;
                                        this.dispatchEvent(
                                            new CustomEvent('promotion-surface-change', {
                                                detail: { value: opt.id },
                                                bubbles: true,
                                                composed: true,
                                            }),
                                        );
                                    }}
                                >
                                    ${opt.title}
                                </sp-menu-item>
                            `,
                        )}
                    </sp-menu>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    #renderOfferPicker() {
        if (!this.offerFilterOptions?.length || this.offerFilterOptions.length < 2) return nothing;
        return html`<sp-picker
            class="offer-filter"
            size="m"
            label="Offer"
            .value=${this.offerFilterValue}
            @change=${(e) => {
                e.stopPropagation();
                this.dispatchEvent(
                    new CustomEvent('offer-filter-change', {
                        detail: { value: e.target.value },
                        bubbles: true,
                        composed: true,
                    }),
                );
            }}
        >
            <sp-menu-item value="all">All offers</sp-menu-item>
            ${this.offerFilterOptions.map(({ id, label }) => html`<sp-menu-item value=${id}>${label}</sp-menu-item>`)}
        </sp-picker>`;
    }

    #fragmentMatchesAnyTag(fragment, selectedIds) {
        return fragment.tags?.some((tag) => selectedIds.some((sel) => tag.id === sel || tag.id?.startsWith(`${sel}/`)));
    }

    #fragmentMatchesResolvedValues(fragment, filterType, selectedIds, toTagId = (id) => id) {
        const values = this.filterValueResolver?.(fragment, filterType);
        if (!values) return this.#fragmentMatchesAnyTag(fragment, selectedIds.map(toTagId));
        const lowerValues = values.map((value) => value.toLowerCase());
        return selectedIds.some((id) => lowerValues.includes(id.toLowerCase()));
    }

    #personalizationTags(fragment) {
        return [
            ...(fragment.tags ?? []),
            ...(fragment.fieldTags ?? []),
            ...(fragment.fields?.filter(({ name }) => name === 'pznTags' || name === 'tags').flatMap(({ values }) => values) ??
                []),
        ].filter((tag) => tagRefToTagId(tag)?.startsWith(PZN_TAG_ID_PREFIX));
    }

    #personalizationTagMatchesQuery(tag, query) {
        const id = tagRefToTagId(tag);
        const title = tag.title || getNamespaceCache(MAS_TAG_NAMESPACE)?.get(this.#tagIdToPath(id))?.title || '';
        return id.split('/').pop().toLowerCase() === query || title.toLowerCase().includes(query);
    }

    #fragmentMatchesVariationOrTag(fragment, query) {
        return [fragment, ...(fragment.groupedVariations ?? [])].some(
            (item) =>
                item.id?.toLowerCase() === query ||
                this.#personalizationTags(item).some((tag) => this.#personalizationTagMatchesQuery(tag, query)),
        );
    }

    #fragmentMatchesPersonalization(fragment) {
        if (!this.matchVariationsAndTags) return this.#fragmentMatchesAnyTag(fragment, this.pznFilter);
        return [fragment, ...(fragment.groupedVariations ?? [])].some((item) =>
            this.#personalizationTags(item).some((tag) => {
                const id = tagRefToTagId(tag);
                return this.pznFilter.some((selected) => id === selected || id.startsWith(`${selected}/`));
            }),
        );
    }

    #applyFilters() {
        const source = this.itemsSelection.value[`all${this.typeUppercased}`].value || [];
        const query = this.searchQuery?.toLowerCase();
        const hasTemplate = this.templateFilter?.length > 0;
        const hasMarket = this.marketSegmentFilter?.length > 0;
        const hasCustomer = this.customerSegmentFilter?.length > 0;
        const hasProduct = this.productFilter?.length > 0;
        const hasOfferType = this.offerTypeFilter?.length > 0;
        const hasPlanType = this.planTypeFilter?.length > 0;
        const hasWorkflowStep = this.workflowStepFilter?.length > 0;
        const hasPzn = this.pznFilter?.length > 0;
        const hasTag = this.tagFilter?.length > 0;
        const hasStatus = this.statusFilter?.length > 0;
        const hasProductArrangementCode = this.productArrangementCodeFilter.length > 0;
        const hasCreatedBy = this.createdByFilter.length > 0;

        const result = source.filter((fragment) => {
            if (query) {
                if (this.type === TABLE_TYPE.PLACEHOLDERS) {
                    const key = fragment.key?.toLowerCase() || '';
                    const value = fragment.value?.toLowerCase() || '';
                    if (!key.includes(query) && !value.includes(query)) return false;
                } else {
                    const title = (fragment.title || '').toLowerCase();
                    const studioPath = (fragment.studioPath || '').toLowerCase();
                    const path = (fragment.path || '').toLowerCase();
                    const fragmentId = (fragment.id || '').toLowerCase();
                    const productTag = fragment.tags?.find(({ id }) => id?.startsWith('mas:product_code/'))?.title || '';
                    const offerId = fragment.offerData?.offerId || '';
                    if (
                        !title.includes(query) &&
                        !studioPath.includes(query) &&
                        !path.includes(query) &&
                        !(fragmentId && fragmentId === query) &&
                        !productTag.toLowerCase().includes(query) &&
                        !offerId.toLowerCase().includes(query) &&
                        !(this.matchVariationsAndTags && this.#fragmentMatchesVariationOrTag(fragment, query))
                    ) {
                        return false;
                    }
                }
            }
            if (hasTemplate) {
                const variantField = fragment.fields?.find((field) => field.name === 'variant');
                if (!variantField?.values?.length) return false;
                if (!variantField.values.some((value) => isVariantMatch(this.templateFilter, value))) return false;
            }
            if (hasStatus) {
                if (!this.statusFilter.includes(fragment.status)) return false;
            }
            if (hasMarket) {
                if (!this.#fragmentMatchesResolvedValues(fragment, FILTER_TYPE.MARKET_SEGMENT, this.marketSegmentFilter)) {
                    return false;
                }
            }
            if (hasProductArrangementCode) {
                const matches = this.#fragmentMatchesResolvedValues(
                    fragment,
                    FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE,
                    this.productArrangementCodeFilter,
                    (code) => `${PRODUCT_ARRANGEMENT_CODE_TAG_PREFIX}${code.toLowerCase()}`,
                );
                if (!matches) return false;
            }
            if (hasCreatedBy) {
                if (!Fragment.isCreatedByAny(fragment, this.createdByFilter)) return false;
            }
            if (hasCustomer) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.customerSegmentFilter)) return false;
            }
            if (hasProduct) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.productFilter)) return false;
            }
            if (hasOfferType) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.offerTypeFilter)) return false;
            }
            if (hasPlanType) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.planTypeFilter)) return false;
            }
            if (hasWorkflowStep) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.workflowStepFilter)) return false;
            }
            if (hasPzn) {
                if (!this.#fragmentMatchesPersonalization(fragment)) return false;
            }
            if (hasTag) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.tagFilter)) return false;
            }
            return true;
        });

        if (this.type === TABLE_TYPE.CARDS) {
            result.sort((a, b) => (b.groupedVariations?.length > 0 ? 1 : 0) - (a.groupedVariations?.length > 0 ? 1 : 0));
        }
        this.itemsSelection.value[`display${this.typeUppercased}`].set(result);
    }

    renderCount() {
        if (this.hideCount) return nothing;
        return html`<div class="result-count">
            ${this.isLoading
                ? html`<sp-progress-circle indeterminate size="s"></sp-progress-circle>`
                : html`${this.itemsSelection.value[`display${this.typeUppercased}`].value.length}
                  result${this.itemsSelection.value[`display${this.typeUppercased}`].value.length !== 1 ? 's' : ''}`}
        </div>`;
    }

    get #filterRenderers() {
        return {
            [FILTER_TYPE.TEMPLATE]: () =>
                this.#renderFilterPicker('Template', this.templateOptions, this.templateFilter, FILTER_TYPE.TEMPLATE, {
                    locked: this.#isTemplateFilterLocked,
                }),
            [FILTER_TYPE.OFFER_TYPE]: () =>
                this.#renderTagPicker('Offer Type', 'offer_type', this.offerTypeFilter, FILTER_TYPE.OFFER_TYPE),
            [FILTER_TYPE.PLAN_TYPE]: () =>
                this.#renderTagPicker('Plan Type', 'plan_type', this.planTypeFilter, FILTER_TYPE.PLAN_TYPE),
            [FILTER_TYPE.WORKFLOW_STEP]: () =>
                this.#renderTagPicker('Workflow Step', 'workflow-step', this.workflowStepFilter, FILTER_TYPE.WORKFLOW_STEP),
            [FILTER_TYPE.MARKET_SEGMENT]: () =>
                this.#renderTagPicker(
                    'Market Segment',
                    'market_segments',
                    this.marketSegmentFilter,
                    FILTER_TYPE.MARKET_SEGMENT,
                ),
            [FILTER_TYPE.CUSTOMER_SEGMENT]: () =>
                this.#renderTagPicker(
                    'Customer Segment',
                    'customer_segment',
                    this.customerSegmentFilter,
                    FILTER_TYPE.CUSTOMER_SEGMENT,
                ),
            [FILTER_TYPE.PRODUCT]: () =>
                this.#renderTagPicker('Product Code', 'product_code', this.productFilter, FILTER_TYPE.PRODUCT),
            [FILTER_TYPE.TAG]: () => this.#renderTagPicker('Tag', 'custom', this.tagFilter, FILTER_TYPE.TAG),
            [FILTER_TYPE.STATUS]: () =>
                this.#renderFilterPicker('Status', this.statusOptions, this.statusFilter, FILTER_TYPE.STATUS),
            [FILTER_TYPE.PZN]: () => this.#renderTagPicker('Personalization', 'pzn', this.pznFilter, FILTER_TYPE.PZN),
            [FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE]: () =>
                this.#renderFilterPicker(
                    'Product Arrangement Code',
                    this.productArrangementCodeOptions,
                    this.productArrangementCodeFilter,
                    FILTER_TYPE.PRODUCT_ARRANGEMENT_CODE,
                    { searchable: true },
                ),
            [FILTER_TYPE.CREATED_BY]: () =>
                html`<mas-user-picker
                    .quiet=${false}
                    label="Created by"
                    .currentUser=${Store.profile}
                    .selectedUsers=${this.#createdByStore}
                    .users=${Store.users}
                ></mas-user-picker>`,
        };
    }

    #handleResetFilters() {
        this.searchQuery = '';
        this.#clearAllFilters();
        this.#notifyProductFilterChange();
    }

    get #resetButton() {
        if (!this.showReset) return nothing;
        return html`<sp-action-button quiet class="reset-filters" title="Clear all filters" @click=${this.#handleResetFilters}>
            Reset Filters
            <sp-icon-refresh slot="icon"></sp-icon-refresh>
        </sp-action-button>`;
    }

    render() {
        const surfacePicker = this.#renderPromotionSurfacePicker();
        if (this.searchOnly) {
            return html`${this.renderCount()} ${surfacePicker}`;
        }
        const filterRenderers = this.#filterRenderers;
        return html`
            <div class="filters">
                ${this.renderCount()} ${this.enabledFilters.map((filterType) => filterRenderers[filterType]())}
                ${this.#renderOfferPicker()} ${surfacePicker} ${this.#resetButton}
            </div>
            ${this.#renderAppliedFilters()}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
