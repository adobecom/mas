import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../../store.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { AEM_TAG_PATH_PRODUCT_CODE_ROOT, FILTER_TYPE, FRAGMENT_STATUS, PAGE_NAMES, TABLE_TYPE } from '../../constants.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { AEM } from '../../aem/aem.js';
import { ensureNamespaceTags, getNamespaceCache, getNamespaceInflight } from '../../aem/tag-cache.js';
import '../../aem/aem-tag-picker-field.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';
const VARIANT_TAG_PREFIX = 'mas:variant/';
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
};
const SELECTOR_FILTER_TYPES = ['market_segments', 'customer_segment', 'product_code', 'variant'];
const STRIPPED_FILTER_TYPES = [...SELECTOR_FILTER_TYPES, 'studio/content-type'];

const STATUS_OPTIONS = [
    { id: FRAGMENT_STATUS.PUBLISHED, title: 'Published' },
    { id: FRAGMENT_STATUS.DRAFT, title: 'Draft' },
    { id: FRAGMENT_STATUS.MODIFIED, title: 'Modified' },
];

class MasSearchAndFilters extends LitElement {
    static styles = styles;

    #savedSearch = null;
    #savedFilters = null;
    #lastForcedSearchSignature = null;
    #defaultTemplateFilterApplied = false;
    #tagCachePromise = null;
    // Search/filters come from the active items-selection store when it provides them
    // (e.g. the compare-chart picker), else the global stores. Resolved at connect.
    #searchStore = Store.search;
    #filtersStore = Store.filters;

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
        pznFilter: { type: Array, state: true },
        tagFilter: { type: Array, state: true },
        statusFilter: { type: Array, state: true },
        templateOptions: { type: Array },
        marketSegmentOptions: { type: Array },
        customerSegmentOptions: { type: Array },
        productOptions: { type: Array },
        offerTypeOptions: { type: Array },
        planTypeOptions: { type: Array },
        pznOptions: { type: Array },
        tagOptions: { type: Array },
        statusOptions: { type: Array },
        searchOnly: { type: Boolean, reflect: true },
        /** When set, preselects this template variant and prevents changing the Template filter. */
        lockedTemplateFilter: { type: String, attribute: 'locked-template-filter' },
        /** When set, preselects this template variant initially while still allowing it to be changed. */
        defaultTemplateFilter: { type: String, attribute: 'default-template-filter' },
        promotionSurfaceOptions: { type: Array },
        promotionSurface: { type: String },
        offerFilterOptions: { type: Array },
        offerFilterValue: { type: String },
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
        this.pznFilter = [];
        this.tagFilter = [];
        this.statusFilter = [];
        this.templateOptions = [];
        this.marketSegmentOptions = [];
        this.customerSegmentOptions = [];
        this.productOptions = [];
        this.offerTypeOptions = [];
        this.planTypeOptions = [];
        this.pznOptions = [];
        this.tagOptions = [];
        this.statusOptions = [];
        this.dataSubscription = null;
        this.lockedTemplateFilter = '';
        this.defaultTemplateFilter = '';
        this.promotionSurfaceOptions = [];
        this.promotionSurface = '';
        this.offerFilterOptions = [];
        this.offerFilterValue = '';
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
        if (typeof tags === 'string') return tags.split(',').filter(Boolean);
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
        const current = this[property] || [];
        if (current.length === values.length && current.every((value, index) => value === values[index])) return;
        this[property] = values;
    }

    #syncFiltersFromStore() {
        if (this.type !== TABLE_TYPE.CARDS) return;
        const tagsByType = this.#tagsByType(this.#filtersStore.get()?.tags);
        if (!this.#isTemplateFilterLocked) {
            this.#setFilterIfChanged(
                'templateFilter',
                tagsByType.variant.map((tag) => tag.replace(VARIANT_TAG_PREFIX, '')),
            );
        }
        this.#setFilterIfChanged('marketSegmentFilter', tagsByType.market_segments);
        this.#setFilterIfChanged('customerSegmentFilter', tagsByType.customer_segment);
        this.#setFilterIfChanged('productFilter', tagsByType.product_code);
    }

    #syncRepositorySearch() {
        if (this.type !== TABLE_TYPE.CARDS) return;

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
        if (currentTags !== nextTags) {
            this.#filtersStore.set({
                ...currentFilters,
                tags: nextTags || undefined,
            });
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
        const selectionStore = getItemsSelectionStore();
        this.#searchStore = selectionStore.search;
        this.#filtersStore = selectionStore.filters;
        if (this.type === TABLE_TYPE.CARDS) {
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
        this.commonDataController = new ReactiveController(this, [
            selectionStore[`all${this.typeUppercased}`],
            selectionStore[`display${this.typeUppercased}`],
            Store[this.type === TABLE_TYPE.PLACEHOLDERS ? 'placeholders' : 'fragments'].list.loading,
            ...(this.type !== TABLE_TYPE.PLACEHOLDERS ? [Store.fragments.list.firstPageLoaded] : []),
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
            this.statusOptions = STATUS_OPTIONS;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('sp-opened', this.#stopOverlayEventPropagation);
        this.removeEventListener('sp-closed', this.#stopOverlayEventPropagation);
        const selectionStore = getItemsSelectionStore({ allowUnset: true });
        if (selectionStore) {
            selectionStore[`display${this.typeUppercased}`].set(selectionStore[`all${this.typeUppercased}`].value);
        }
        this.dataSubscription?.unsubscribe();
        if (this.type === TABLE_TYPE.CARDS) {
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

    get isLoading() {
        if (this.type === TABLE_TYPE.PLACEHOLDERS) return Store.placeholders.list.loading.get();
        return Store.fragments.list.firstPageLoaded.get() === false;
    }

    get isLoadingMore() {
        if (this.type === TABLE_TYPE.PLACEHOLDERS) return false;
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

    #extractFilterOptions() {
        const optionMaps = {
            marketSegments: new Map(),
            customerSegments: new Map(),
            products: new Map(),
            offerTypes: new Map(),
            planTypes: new Map(),
            pzns: new Map(),
            customs: new Map(),
        };
        this.#addSelectedFilterOptions(optionMaps);
        for (const fragment of getItemsSelectionStore()[`all${this.typeUppercased}`].value) {
            if (!fragment.tags) continue;

            for (const tag of fragment.tags) {
                const tagId = tag.id || '';
                const tagTitle = tag.title || tagId.split('/').pop() || '';
                this.#setOptionFromTagId(optionMaps, tagId, tagTitle);
            }
        }
        this.#addCachedFilterOptions(optionMaps);

        const toSortedOptions = (map) => Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.templateOptions = VARIANTS.filter((variant) => variant.label.toLowerCase() !== 'all').map((variant) => ({
            id: variant.value,
            title: variant.label,
        }));
        this.marketSegmentOptions = toSortedOptions(optionMaps.marketSegments);
        this.customerSegmentOptions = toSortedOptions(optionMaps.customerSegments);
        this.productOptions = toSortedOptions(optionMaps.products);
        this.offerTypeOptions = toSortedOptions(optionMaps.offerTypes);
        this.planTypeOptions = toSortedOptions(optionMaps.planTypes);
        this.pznOptions = toSortedOptions(optionMaps.pzns);
        this.tagOptions = toSortedOptions(optionMaps.customs);
    }

    willUpdate(changed) {
        if (changed.has('lockedTemplateFilter') || (changed.has('templateFilter') && this.#isTemplateFilterLocked)) {
            this.#syncLockedTemplateFilter();
        }
        if (
            changed.has('searchQuery') ||
            changed.has('templateFilter') ||
            changed.has('marketSegmentFilter') ||
            changed.has('customerSegmentFilter') ||
            changed.has('productFilter') ||
            changed.has('offerTypeFilter') ||
            changed.has('planTypeFilter') ||
            changed.has('pznFilter') ||
            changed.has('tagFilter') ||
            changed.has('statusFilter')
        ) {
            if (
                changed.has('searchQuery') ||
                changed.has('templateFilter') ||
                changed.has('lockedTemplateFilter') ||
                changed.has('marketSegmentFilter') ||
                changed.has('customerSegmentFilter') ||
                changed.has('productFilter')
            ) {
                this.#syncRepositorySearch();
            }
            this.#applyFilters();
        }
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
                break;
            case FILTER_TYPE.OFFER_TYPE:
                this.offerTypeFilter = selectedTagIds;
                break;
            case FILTER_TYPE.PLAN_TYPE:
                this.planTypeFilter = selectedTagIds;
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
                break;
            case FILTER_TYPE.OFFER_TYPE:
                this.offerTypeFilter = this.offerTypeFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.PLAN_TYPE:
                this.planTypeFilter = this.planTypeFilter.filter((filterId) => filterId !== id);
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
        this.pznFilter = [];
        this.tagFilter = [];
        this.statusFilter = [];
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
                <sp-action-button quiet @click=${this.#clearAllFilters}>Clear all</sp-action-button>
            </div>
        `;
    }

    #renderFilterPicker(label, options, selectedValues, filterType, { locked = false } = {}) {
        if (!options.length) return nothing;
        const selectedCount = selectedValues.length;
        const displayLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label;

        return html`
            <overlay-trigger placement="bottom-start" ?disabled=${locked}>
                <sp-action-button class="template-filter" dir="ltr" slot="trigger" .disabled=${this.isLoading || locked}>
                    ${displayLabel}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>
                <sp-popover slot="click-content" class="filter-popover">
                    <div class="checkbox-list">
                        ${options.map((option) => {
                            const optionId = option.id || option.value;
                            const isChecked = selectedValues.includes(optionId);
                            return html`
                                <sp-checkbox
                                    value=${optionId}
                                    ?checked=${isChecked}
                                    ?disabled=${locked}
                                    @change=${(e) => this.#handleCheckboxChange(filterType, optionId, e)}
                                >
                                    ${option.title || option.label}
                                </sp-checkbox>
                            `;
                        })}
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
                .value=${this.#selectedTagPaths(selectedValues)}
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

    #applyFilters() {
        const source = getItemsSelectionStore()[`all${this.typeUppercased}`].value || [];
        const query = this.searchQuery?.toLowerCase();
        const hasTemplate = this.templateFilter?.length > 0;
        const hasMarket = this.marketSegmentFilter?.length > 0;
        const hasCustomer = this.customerSegmentFilter?.length > 0;
        const hasProduct = this.productFilter?.length > 0;
        const hasOfferType = this.offerTypeFilter?.length > 0;
        const hasPlanType = this.planTypeFilter?.length > 0;
        const hasPzn = this.pznFilter?.length > 0;
        const hasTag = this.tagFilter?.length > 0;
        const hasStatus = this.statusFilter?.length > 0;

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
                        !offerId.toLowerCase().includes(query)
                    ) {
                        return false;
                    }
                }
            }
            if (hasTemplate) {
                const variantField = fragment.fields?.find((field) => field.name === 'variant');
                if (!variantField?.values?.length) return false;
                if (!variantField.values.some((value) => this.templateFilter.includes(value))) return false;
            }
            if (hasStatus) {
                if (!this.statusFilter.includes(fragment.status)) return false;
            }
            if (hasMarket) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.marketSegmentFilter)) return false;
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
            if (hasPzn) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.pznFilter)) return false;
            }
            if (hasTag) {
                if (!this.#fragmentMatchesAnyTag(fragment, this.tagFilter)) return false;
            }
            return true;
        });

        if (this.type === TABLE_TYPE.CARDS) {
            result.sort((a, b) => (b.groupedVariations?.length > 0 ? 1 : 0) - (a.groupedVariations?.length > 0 ? 1 : 0));
        }
        getItemsSelectionStore()[`display${this.typeUppercased}`].set(result);
    }

    renderCount() {
        return html`<div class="result-count">
            ${this.isLoading
                ? html`<sp-progress-circle indeterminate size="s"></sp-progress-circle>`
                : html`${getItemsSelectionStore()[`display${this.typeUppercased}`].value.length}
                  result${getItemsSelectionStore()[`display${this.typeUppercased}`].value.length !== 1 ? 's' : ''}`}
        </div>`;
    }

    render() {
        const surfacePicker = this.#renderPromotionSurfacePicker();
        if (this.searchOnly) {
            return html`${this.renderCount()} ${surfacePicker}`;
        }
        return html`
            <div class="filters">
                ${this.renderCount()}
                ${this.#renderFilterPicker('Template', this.templateOptions, this.templateFilter, FILTER_TYPE.TEMPLATE, {
                    locked: this.#isTemplateFilterLocked,
                })}
                ${this.#renderTagPicker('Offer Type', 'offer_type', this.offerTypeFilter, FILTER_TYPE.OFFER_TYPE)}
                ${this.#renderTagPicker('Plan Type', 'plan_type', this.planTypeFilter, FILTER_TYPE.PLAN_TYPE)}
                ${this.#renderTagPicker(
                    'Market Segment',
                    'market_segments',
                    this.marketSegmentFilter,
                    FILTER_TYPE.MARKET_SEGMENT,
                )}
                ${this.#renderTagPicker(
                    'Customer Segment',
                    'customer_segment',
                    this.customerSegmentFilter,
                    FILTER_TYPE.CUSTOMER_SEGMENT,
                )}
                ${this.#renderTagPicker('Product Code', 'product_code', this.productFilter, FILTER_TYPE.PRODUCT)}
                ${this.#renderTagPicker('Tag', 'custom', this.tagFilter, FILTER_TYPE.TAG)}
                ${this.#renderFilterPicker('Status', this.statusOptions, this.statusFilter, FILTER_TYPE.STATUS)}
                ${this.#renderTagPicker('Personalization', 'pzn', this.pznFilter, FILTER_TYPE.PZN)} ${this.#renderOfferPicker()}
                ${surfacePicker}
            </div>
            ${this.#renderAppliedFilters()}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
