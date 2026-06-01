import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../../store.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { AEM_TAG_PATH_PRODUCT_CODE_ROOT, FILTER_TYPE, PAGE_NAMES, TABLE_TYPE } from '../../constants.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { AEM } from '../../aem/aem.js';
import { getNamespaceCache, setNamespaceCache } from '../../aem/tag-cache.js';
import '../../aem/aem-tag-picker-field.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';
const VARIANT_TAG_PREFIX = 'mas:variant/';
const EMPTY_TAGS_BY_TYPE = {
    offer_type: [],
    plan_type: [],
    market_segment: [],
    market_segments: [],
    customer_segment: [],
    product_code: [],
    pzn: [],
    status: [],
    variant: [],
    'studio/content-type': [],
    custom: [],
};
const SELECTOR_FILTER_TYPES = ['market_segment', 'market_segments', 'customer_segment', 'product_code', 'variant'];
const STRIPPED_FILTER_TYPES = [...SELECTOR_FILTER_TYPES, 'studio/content-type'];

class MasSearchAndFilters extends LitElement {
    static styles = styles;

    #savedSearch = null;
    #savedFilters = null;
    #lastForcedSearchSignature = null;
    #tagCachePromise = null;

    static properties = {
        type: { type: String }, // 'cards' | 'collections' | 'placeholders'
        searchQuery: { type: String },
        templateFilter: { type: Array, state: true },
        marketSegmentFilter: { type: Array, state: true },
        customerSegmentFilter: { type: Array, state: true },
        productFilter: { type: Array, state: true },
        templateOptions: { type: Array },
        marketSegmentOptions: { type: Array },
        customerSegmentOptions: { type: Array },
        productOptions: { type: Array },
        searchOnly: { type: Boolean, reflect: true },
        /** When set, preselects this template variant and prevents changing the Template filter. */
        lockedTemplateFilter: { type: String, attribute: 'locked-template-filter' },
        promotionSurfaceOptions: { type: Array },
        promotionSurface: { type: String },
    };

    constructor() {
        super();
        this.searchQuery = '';
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.templateOptions = [];
        this.marketSegmentOptions = [];
        this.customerSegmentOptions = [];
        this.productOptions = [];
        this.dataSubscription = null;
        this.lockedTemplateFilter = '';
        this.promotionSurfaceOptions = [];
        this.promotionSurface = '';
    }

    get #isTemplateFilterLocked() {
        return Boolean(this.lockedTemplateFilter);
    }

    #syncLockedTemplateFilter() {
        if (!this.#isTemplateFilterLocked) return;
        if (this.templateFilter.length === 1 && this.templateFilter[0] === this.lockedTemplateFilter) return;
        this.templateFilter = [this.lockedTemplateFilter];
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
        const tagsByType = this.#tagsByType(Store.filters.get()?.tags);
        if (!this.#isTemplateFilterLocked) {
            this.#setFilterIfChanged(
                'templateFilter',
                tagsByType.variant.map((tag) => tag.replace(VARIANT_TAG_PREFIX, '')),
            );
        }
        this.#setFilterIfChanged('marketSegmentFilter', [...tagsByType.market_segment, ...tagsByType.market_segments]);
        this.#setFilterIfChanged('customerSegmentFilter', tagsByType.customer_segment);
        this.#setFilterIfChanged('productFilter', tagsByType.product_code);
    }

    #syncRepositorySearch() {
        if (this.type !== TABLE_TYPE.CARDS) return;

        const nextQuery = this.searchQuery?.trim() || undefined;
        const currentSearch = Store.search.get() || {};
        const currentQuery = currentSearch.query || undefined;
        if (currentQuery !== nextQuery) {
            const nextSearch = { ...currentSearch };
            if (nextQuery) {
                nextSearch.query = nextQuery;
            } else {
                delete nextSearch.query;
            }
            Store.search.set(nextSearch);
        }

        const currentFilters = Store.filters.get() || {};
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
            Store.filters.set({
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
        document.querySelector('mas-repository')?.searchFragments?.({ force: true });
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
        const cachedTags = getNamespaceCache(MAS_TAG_NAMESPACE);
        if (cachedTags instanceof Promise) {
            this.#refreshOptionsAfterTagCacheLoad(cachedTags);
            return;
        }
        if (cachedTags) return;

        const baseUrl = document.querySelector('meta[name="aem-base-url"]')?.content;
        if (!baseUrl) return;

        let resolveNamespace;
        const cachePromise = new Promise((resolve) => {
            resolveNamespace = resolve;
        });
        setNamespaceCache(MAS_TAG_NAMESPACE, cachePromise);
        this.#refreshOptionsAfterTagCacheLoad(cachePromise);

        new AEM(null, baseUrl).tags
            .list(MAS_TAG_NAMESPACE)
            .then((rawTags) => {
                setNamespaceCache(MAS_TAG_NAMESPACE, new Map((rawTags?.hits || []).map((tag) => [tag.path, tag])));
            })
            .catch(() => {
                setNamespaceCache(MAS_TAG_NAMESPACE, new Map());
            })
            .finally(resolveNamespace);
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.type === TABLE_TYPE.CARDS) {
            this.#savedSearch = Store.search.get();
            this.#savedFilters = Store.filters.get();
            this.#syncFiltersFromStore();
            this.#syncLockedTemplateFilter();
            this.#syncRepositorySearch();
            if (!this.searchOnly) this.#loadTagOptions();
        } else {
            this.#syncLockedTemplateFilter();
        }
        const selectionStore = getItemsSelectionStore();
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
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        const selectionStore = getItemsSelectionStore({ allowUnset: true });
        if (selectionStore) {
            selectionStore[`display${this.typeUppercased}`].set(selectionStore[`all${this.typeUppercased}`].value);
        }
        this.dataSubscription?.unsubscribe();
        if (this.type === TABLE_TYPE.CARDS) {
            if (this.#savedSearch !== null) {
                Store.search.set(this.#savedSearch);
            }
            if (this.#savedFilters !== null) {
                Store.filters.set(this.#savedFilters);
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

    #setOptionFromTagId({ marketSegments, customerSegments, products }, tagId, title) {
        if (tagId.startsWith('mas:market_segment/') || tagId.startsWith('mas:market_segments/')) {
            this.#setOption(marketSegments, tagId, title);
        } else if (tagId.startsWith('mas:customer_segment/')) {
            this.#setOption(customerSegments, tagId, title);
        } else if (tagId.startsWith('mas:product_code/')) {
            const productTagId = this.#productParentTagId(tagId);
            const cachedTitle = getNamespaceCache(MAS_TAG_NAMESPACE)?.get?.(this.#tagIdToPath(productTagId))?.title;
            this.#setOption(products, productTagId, cachedTitle || (productTagId === tagId ? title : ''));
        }
    }

    #addSelectedFilterOptions(optionMaps) {
        [...(this.marketSegmentFilter || []), ...(this.customerSegmentFilter || []), ...(this.productFilter || [])].forEach(
            (tagId) => {
                const cachedTag = getNamespaceCache(MAS_TAG_NAMESPACE)?.get?.(this.#tagIdToPath(tagId));
                this.#setOptionFromTagId(optionMaps, tagId, cachedTag?.title);
            },
        );
    }

    #addCachedFilterOptions(optionMaps) {
        const cachedTags = getNamespaceCache(MAS_TAG_NAMESPACE);
        if (cachedTags instanceof Promise) {
            this.#refreshOptionsAfterTagCacheLoad(cachedTags);
            return;
        }
        if (!cachedTags?.values) return;

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

        this.templateOptions = VARIANTS.filter((variant) => variant.label.toLowerCase() !== 'all').map((variant) => ({
            id: variant.value,
            title: variant.label,
        }));
        this.marketSegmentOptions = Array.from(optionMaps.marketSegments.values()).sort((a, b) =>
            a.title.localeCompare(b.title),
        );
        this.customerSegmentOptions = Array.from(optionMaps.customerSegments.values()).sort((a, b) =>
            a.title.localeCompare(b.title),
        );
        this.productOptions = Array.from(optionMaps.products.values()).sort((a, b) => a.title.localeCompare(b.title));
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
            changed.has('productFilter')
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
        const selectedCount = selectedValues.length;
        const displayLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label;

        return html`
            <overlay-trigger placement="bottom-start" ?disabled=${locked} @sp-closed=${(e) => e.stopPropagation()}>
                <sp-action-button slot="trigger" class="filter-trigger" quiet .disabled=${this.isLoading || locked}>
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
            <overlay-trigger placement="bottom-start" @sp-closed=${(e) => e.stopPropagation()}>
                <sp-action-button slot="trigger" class="filter-trigger" quiet .disabled=${this.isLoading}>
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

    #applyFilters() {
        const source = getItemsSelectionStore()[`all${this.typeUppercased}`].value || [];
        const query = this.searchQuery?.toLowerCase();
        const hasTemplate = this.templateFilter?.length > 0;
        const hasMarket = this.marketSegmentFilter?.length > 0;
        const hasCustomer = this.customerSegmentFilter?.length > 0;
        const hasProduct = this.productFilter?.length > 0;

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
            if (hasMarket) {
                if (!fragment.tags?.some((tag) => this.marketSegmentFilter.includes(tag.id))) return false;
            }
            if (hasCustomer) {
                if (!fragment.tags?.some((tag) => this.customerSegmentFilter.includes(tag.id))) return false;
            }
            if (hasProduct) {
                if (
                    !fragment.tags?.some((tag) =>
                        this.productFilter.some(
                            (productTagId) => tag.id === productTagId || tag.id?.startsWith(`${productTagId}/`),
                        ),
                    )
                ) {
                    return false;
                }
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
                ${this.#renderTagPicker(
                    'Market Segment',
                    'market_segment,market_segments',
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
                ${surfacePicker}
            </div>
            ${this.#renderAppliedFilters()}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
