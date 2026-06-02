import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../../store.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { FILTER_TYPE, TABLE_TYPE, FRAGMENT_STATUS } from '../../constants.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { AEM } from '../../aem/aem.js';
import { getNamespaceCache, setNamespaceCache } from '../../aem/tag-cache.js';
import { toAttribute } from '../../aem/tag-path-utils.js';
import { isPznCountryTagPath } from '../utils/personalization-utils.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';

const TAXONOMY_FILTERS = [
    { optionsProp: 'marketSegmentOptions', root: 'market_segments' },
    { optionsProp: 'customerSegmentOptions', root: 'customer_segment' },
    { optionsProp: 'productOptions', root: 'product_code', directChildrenOnly: true },
    { optionsProp: 'offerTypeOptions', root: 'offer_type' },
    { optionsProp: 'planTypeOptions', root: 'plan_type' },
    { optionsProp: 'pznOptions', root: 'pzn', exclude: isPznCountryTagPath },
    { optionsProp: 'tagOptions', root: 'custom' },
];

const STATUS_OPTIONS = [
    { id: FRAGMENT_STATUS.PUBLISHED, title: 'Published' },
    { id: FRAGMENT_STATUS.DRAFT, title: 'Draft' },
    { id: FRAGMENT_STATUS.MODIFIED, title: 'Modified' },
];

class MasSearchAndFilters extends LitElement {
    static styles = styles;

    #savedSearch = null;
    #savedFilters = null;

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
        this.promotionSurfaceOptions = [];
        this.promotionSurface = '';
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.type === TABLE_TYPE.CARDS) {
            this.#savedSearch = Store.search.get();
            this.#savedFilters = Store.filters.get();
        }
        const selectionStore = getItemsSelectionStore();
        this.commonDataController = new ReactiveController(this, [
            selectionStore[`all${this.typeUppercased}`],
            selectionStore[`display${this.typeUppercased}`],
            Store[this.type === TABLE_TYPE.PLACEHOLDERS ? 'placeholders' : 'fragments'].list.loading,
            ...(this.type !== TABLE_TYPE.PLACEHOLDERS ? [Store.fragments.list.firstPageLoaded] : []),
        ]);
        const dataCallback = () => {
            this.#applyFilters();
            this.requestUpdate();
        };
        selectionStore[`all${this.typeUppercased}`].subscribe(dataCallback);
        this.dataSubscription = {
            unsubscribe: () => selectionStore[`all${this.typeUppercased}`].unsubscribe(dataCallback),
        };
        if (!this.searchOnly && this.type !== TABLE_TYPE.PLACEHOLDERS) {
            this.templateOptions = VARIANTS.filter((variant) => variant.label.toLowerCase() !== 'all').map((variant) => ({
                id: variant.value,
                title: variant.label,
            }));
            this.statusOptions = STATUS_OPTIONS;
            this.#loadTaxonomyFilterOptions();
        }
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

    async #loadTaxonomyFilterOptions() {
        let data = getNamespaceCache(MAS_TAG_NAMESPACE);
        if (!data) {
            const aem = new AEM(null, document.querySelector('meta[name="aem-base-url"]')?.content);
            let resolveNamespace;
            setNamespaceCache(MAS_TAG_NAMESPACE, new Promise((resolve) => (resolveNamespace = resolve)));
            try {
                const rawTags = await aem.tags.list(MAS_TAG_NAMESPACE);
                data = new Map(rawTags.hits.map((tag) => [tag.path, tag]));
                setNamespaceCache(MAS_TAG_NAMESPACE, data);
            } catch {
                setNamespaceCache(MAS_TAG_NAMESPACE, undefined);
                return;
            }
            resolveNamespace();
        } else if (data instanceof Promise) {
            await data;
            data = getNamespaceCache(MAS_TAG_NAMESPACE);
        }
        if (!data || data instanceof Promise) return;
        const tags = [...data.values()];
        for (const { optionsProp, root, exclude, directChildrenOnly } of TAXONOMY_FILTERS) {
            const rootPath = `${MAS_TAG_NAMESPACE}/${root}/`;
            const matching = tags.filter((tag) => {
                if (!tag.path.startsWith(rootPath)) return false;
                if (exclude && exclude(tag.path)) return false;
                if (directChildrenOnly && tag.path.slice(rootPath.length).includes('/')) return false;
                return true;
            });
            this[optionsProp] = matching
                .map((tag) => ({ id: toAttribute([tag.path]), title: tag.title || tag.name || tag.path.split('/').pop() }))
                .sort((a, b) => a.title.localeCompare(b.title));
        }
    }

    willUpdate(changed) {
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
            this.#applyFilters();
        }
    }

    #handleCheckboxChange(filterType, optionId, e) {
        e.stopPropagation();
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

    #handleTagDelete({
        target: {
            value: { type, id },
        },
    }) {
        switch (type) {
            case FILTER_TYPE.TEMPLATE:
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
        this.templateFilter = [];
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
                                deletable
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

    #renderFilterPicker(label, options, selectedValues, filterType) {
        if (!options.length) return nothing;
        const selectedCount = selectedValues.length;
        const displayLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label;

        return html`
            <overlay-trigger placement="bottom-start" @sp-closed=${(e) => e.stopPropagation()}>
                <sp-action-button slot="trigger" class="filter-trigger" quiet .disabled=${this.isLoading}>
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
                if (!fragment.tags?.some((tag) => this.offerTypeFilter.includes(tag.id))) return false;
            }
            if (hasPlanType) {
                if (!fragment.tags?.some((tag) => this.planTypeFilter.includes(tag.id))) return false;
            }
            if (hasPzn) {
                if (!fragment.tags?.some((tag) => this.pznFilter.includes(tag.id))) return false;
            }
            if (hasTag) {
                if (!fragment.tags?.some((tag) => this.tagFilter.includes(tag.id))) return false;
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
                ${this.#renderFilterPicker('Template', this.templateOptions, this.templateFilter, FILTER_TYPE.TEMPLATE)}
                ${this.#renderFilterPicker('Offer Type', this.offerTypeOptions, this.offerTypeFilter, FILTER_TYPE.OFFER_TYPE)}
                ${this.#renderFilterPicker('Plan Type', this.planTypeOptions, this.planTypeFilter, FILTER_TYPE.PLAN_TYPE)}
                ${this.#renderFilterPicker(
                    'Market Segment',
                    this.marketSegmentOptions,
                    this.marketSegmentFilter,
                    FILTER_TYPE.MARKET_SEGMENT,
                )}
                ${this.#renderFilterPicker(
                    'Customer Segment',
                    this.customerSegmentOptions,
                    this.customerSegmentFilter,
                    FILTER_TYPE.CUSTOMER_SEGMENT,
                )}
                ${this.#renderFilterPicker('Product Code', this.productOptions, this.productFilter, FILTER_TYPE.PRODUCT)}
                ${this.#renderFilterPicker('Tag', this.tagOptions, this.tagFilter, FILTER_TYPE.TAG)}
                ${this.#renderFilterPicker('Status', this.statusOptions, this.statusFilter, FILTER_TYPE.STATUS)}
                ${this.#renderFilterPicker('Personalization', this.pznOptions, this.pznFilter, FILTER_TYPE.PZN)}
                ${surfacePicker}
            </div>
            ${this.#renderAppliedFilters()}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
