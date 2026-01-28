import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../store.js';
import { FILTER_TYPE, TABLE_TYPE } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasSearchAndFilters extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String }, // 'cards' | 'collections' | 'placeholders'
        resultCount: { type: Number },
        searchQuery: { type: String },
        templateFilter: { type: Array, state: true },
        marketSegmentFilter: { type: Array, state: true },
        customerSegmentFilter: { type: Array, state: true },
        productFilter: { type: Array, state: true },
        templateOptions: { type: Array },
        marketSegmentOptions: { type: Array },
        customerSegmentOptions: { type: Array },
        productOptions: { type: Array },
        searchOnly: { type: Boolean },
    };

    constructor() {
        super();
        this.resultCount = 0;
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
        this.loadingController = new ReactiveController(this, [
            Store[this.type === TABLE_TYPE.PLACEHOLDERS ? 'placeholders' : 'fragments'].list.loading,
        ]);
    }

    connectedCallback() {
        super.connectedCallback();
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return Store.translationProjects.allCards.subscribe(() => {
                    if (!this.searchOnly) {
                        this.#extractFilterOptions();
                    }
                    this.resultCount = Store.translationProjects[`display${this.typeUppercased}`].value.length;
                    this.requestUpdate();
                });
            case TABLE_TYPE.COLLECTIONS:
                return Store.translationProjects.allCollections.subscribe(() => {
                    if (!this.searchOnly) {
                        this.#extractFilterOptions();
                    }
                    this.resultCount = Store.translationProjects[`display${this.typeUppercased}`].value.length;
                    this.requestUpdate();
                });
            case TABLE_TYPE.PLACEHOLDERS:
                return Store.placeholders.list.data.subscribe(() => {
                    if (!this.searchOnly) {
                        this.#extractFilterOptions();
                    }
                    this.resultCount = Store.translationProjects[`display${this.typeUppercased}`].value.length;
                    this.requestUpdate();
                });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                Store.translationProjects.displayCards.set(Store.translationProjects.allCards.value);
                break;
            case TABLE_TYPE.COLLECTIONS:
                Store.translationProjects.displayCollections.set(Store.translationProjects.allCollections.value);
                break;
            case TABLE_TYPE.PLACEHOLDERS:
                break;
        }
        this.dataSubscription?.unsubscribe();
    }

    get typeUppercased() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    get isLoading() {
        return Store[this.type === TABLE_TYPE.PLACEHOLDERS ? 'placeholders' : 'fragments'].list.loading.get();
    }

    get appliedFilters() {
        const filters = [];
        const templateMap = new Map(this.templateOptions.map((opt) => [opt.id || opt.value, opt]));
        const marketSegmentMap = new Map(this.marketSegmentOptions.map((opt) => [opt.id || opt.value, opt]));
        const customerSegmentMap = new Map(this.customerSegmentOptions.map((opt) => [opt.id || opt.value, opt]));
        const productMap = new Map(this.productOptions.map((opt) => [opt.id || opt.value, opt]));

        for (const id of this.templateFilter) {
            const option = templateMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.template, id, label: option.title || option.label });
        }
        for (const id of this.marketSegmentFilter) {
            const option = marketSegmentMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.marketSegment, id, label: option.title || option.label });
        }
        for (const id of this.customerSegmentFilter) {
            const option = customerSegmentMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.customerSegment, id, label: option.title || option.label });
        }
        for (const id of this.productFilter) {
            const option = productMap.get(id);
            if (option) filters.push({ type: FILTER_TYPE.product, id, label: option.title || option.label });
        }
        return filters;
    }

    get allItems() {
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return Store.translationProjects.allCards.value;
            case TABLE_TYPE.COLLECTIONS:
                return Store.translationProjects.allCollections.value;
        }
    }

    #extractFilterOptions() {
        const marketSegments = new Map();
        const customerSegments = new Map();
        const products = new Map();
        for (const fragment of this.allItems) {
            if (!fragment.tags) continue;

            for (const tag of fragment.tags) {
                const tagId = tag.id || '';
                const tagTitle = tag.title || tagId.split('/').pop() || '';
                if (tagId.startsWith('mas:market_segment/') || tagId.startsWith('mas:market_segments/')) {
                    marketSegments.set(tagId, { id: tagId, title: tagTitle });
                } else if (tagId.startsWith('mas:customer_segment/')) {
                    customerSegments.set(tagId, { id: tagId, title: tagTitle });
                } else if (tagId.startsWith('mas:product_code/')) {
                    products.set(tagId, { id: tagId, title: tagTitle });
                }
            }
        }
        this.templateOptions = VARIANTS.filter((variant) => variant.label.toLowerCase() !== 'all').map((variant) => ({
            id: variant.value,
            title: variant.label,
        }));
        this.marketSegmentOptions = Array.from(marketSegments.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.customerSegmentOptions = Array.from(customerSegments.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.productOptions = Array.from(products.values()).sort((a, b) => a.title.localeCompare(b.title));
    }

    #handleSearchInput({ target: { value: query } }) {
        this.searchQuery = query;
        this.#applyFilters();
    }

    #handleSearchSubmit(e) {
        e.preventDefault();
        this.#applyFilters();
    }

    #handleCheckboxChange(filterType, optionId, e) {
        let currentValues;
        switch (filterType) {
            case FILTER_TYPE.template:
                currentValues = [...this.templateFilter];
                break;
            case FILTER_TYPE.marketSegment:
                currentValues = [...this.marketSegmentFilter];
                break;
            case FILTER_TYPE.customerSegment:
                currentValues = [...this.customerSegmentFilter];
                break;
            case FILTER_TYPE.product:
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
            case FILTER_TYPE.template:
                this.templateFilter = currentValues;
                break;
            case FILTER_TYPE.marketSegment:
                this.marketSegmentFilter = currentValues;
                break;
            case FILTER_TYPE.customerSegment:
                this.customerSegmentFilter = currentValues;
                break;
            case FILTER_TYPE.product:
                this.productFilter = currentValues;
                break;
        }
        this.#applyFilters();
    }

    #handleTagDelete({
        target: {
            value: { type, id },
        },
    }) {
        switch (type) {
            case FILTER_TYPE.template:
                this.templateFilter = this.templateFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.marketSegment:
                this.marketSegmentFilter = this.marketSegmentFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.customerSegment:
                this.customerSegmentFilter = this.customerSegmentFilter.filter((filterId) => filterId !== id);
                break;
            case FILTER_TYPE.product:
                this.productFilter = this.productFilter.filter((filterId) => filterId !== id);
                break;
        }
        this.#applyFilters();
    }

    #clearAllFilters() {
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.#applyFilters();
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
                <a class="clear-all" @click=${this.#clearAllFilters}>Clear all</a>
            </div>
        `;
    }

    #renderFilterPicker(label, options, selectedValues, filterType) {
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

    #applyFilters() {
        const source = Store.translationProjects[`all${this.typeUppercased}`].value || [];
        const query = this.searchQuery?.toLowerCase();
        const hasTemplate = this.templateFilter?.length > 0;
        const hasMarket = this.marketSegmentFilter?.length > 0;
        const hasCustomer = this.customerSegmentFilter?.length > 0;
        const hasProduct = this.productFilter?.length > 0;

        const result = source.filter((fragment) => {
            if (query) {
                const title = (fragment.title || '').toLowerCase();
                const productTag = fragment.tags?.find(({ id }) => id?.startsWith('mas:product_code/'))?.title || '';
                const offerId = fragment.offerData?.offerId || '';
                if (
                    !title.includes(query) &&
                    !productTag.toLowerCase().includes(query) &&
                    !offerId.toLowerCase().includes(query)
                ) {
                    return false;
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
                if (!fragment.tags?.some((tag) => this.productFilter.includes(tag.id))) return false;
            }
            return true;
        });

        Store.translationProjects[`display${this.typeUppercased}`].set(result);
        this.resultCount = Store.translationProjects[`display${this.typeUppercased}`].value.length;
    }

    render() {
        return html`
            <div class="search">
                <sp-search
                    size="m"
                    placeholder="Search fragments..."
                    value=${this.searchQuery}
                    .disabled=${this.isLoading}
                    @input=${this.#handleSearchInput}
                    @submit=${this.#handleSearchSubmit}
                ></sp-search>
                ${this.searchQuery
                    ? html`<div class="result-count">${`${this.resultCount} result${this.resultCount !== 1 ? 's' : ''}`}</div>`
                    : nothing}
            </div>

            ${!this.searchOnly
                ? html`
                      <div class="filters">
                          ${this.#renderFilterPicker(
                              'Template',
                              this.templateOptions,
                              this.templateFilter,
                              FILTER_TYPE.template,
                          )}
                          ${this.#renderFilterPicker(
                              'Market Segment',
                              this.marketSegmentOptions,
                              this.marketSegmentFilter,
                              FILTER_TYPE.marketSegment,
                          )}
                          ${this.#renderFilterPicker(
                              'Customer Segment',
                              this.customerSegmentOptions,
                              this.customerSegmentFilter,
                              FILTER_TYPE.customerSegment,
                          )}
                          ${this.#renderFilterPicker('Product', this.productOptions, this.productFilter, FILTER_TYPE.product)}
                      </div>

                      ${this.#renderAppliedFilters()}
                  `
                : nothing}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
