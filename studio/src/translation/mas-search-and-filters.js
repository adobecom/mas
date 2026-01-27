import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../store.js';

class MasSearchAndFilters extends LitElement {
    static styles = styles;

    static properties = {
        params: { type: Object },
        filters: { type: Object },
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
    };

    constructor() {
        super();
        this.filters = {};
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
    }

    connectedCallback() {
        super.connectedCallback();

        Store[this.params.mainStore][this.params.storeSourceKey].subscribe(() => {
            this.#extractFilterOptions();
            this.resultCount = Store[this.params.mainStore][this.params.storeTargetKey].value.length;
            this.requestUpdate();
        });
    }

    #extractFilterOptions() {
        const marketSegments = new Map();
        const customerSegments = new Map();
        const products = new Map();
        for (const fragment of Store[this.params.mainStore][this.params.storeSourceKey].value) {
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
            case 'template':
                currentValues = [...this.templateFilter];
                break;
            case 'marketSegment':
                currentValues = [...this.marketSegmentFilter];
                break;
            case 'customerSegment':
                currentValues = [...this.customerSegmentFilter];
                break;
            case 'product':
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
            case 'template':
                this.templateFilter = currentValues;
                break;
            case 'marketSegment':
                this.marketSegmentFilter = currentValues;
                break;
            case 'customerSegment':
                this.customerSegmentFilter = currentValues;
                break;
            case 'product':
                this.productFilter = currentValues;
                break;
        }
        this.#applyFilters();
    }

    #handleTagDelete(e) {
        const { type, id } = e.target.value;
        switch (type) {
            case 'template':
                this.templateFilter = this.templateFilter.filter((filterId) => filterId !== id);
                break;
            case 'marketSegment':
                this.marketSegmentFilter = this.marketSegmentFilter.filter((filterId) => filterId !== id);
                break;
            case 'customerSegment':
                this.customerSegmentFilter = this.customerSegmentFilter.filter((filterId) => filterId !== id);
                break;
            case 'product':
                this.productFilter = this.productFilter.filter((filterId) => filterId !== id);
                break;
        }
        this.#applyFilters();
    }

    #handleClearAll() {
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.#applyFilters();
    }

    #getAppliedFilters() {
        const filters = [];

        this.templateFilter.forEach((id) => {
            const option = this.templateOptions.find((opt) => (opt.id || opt.value) === id);
            if (option) {
                filters.push({
                    type: 'template',
                    id,
                    label: option.title || option.label,
                });
            }
        });

        this.marketSegmentFilter.forEach((id) => {
            const option = this.marketSegmentOptions.find((opt) => (opt.id || opt.value) === id);
            if (option) {
                filters.push({
                    type: 'marketSegment',
                    id,
                    label: option.title || option.label,
                });
            }
        });

        this.customerSegmentFilter.forEach((id) => {
            const option = this.customerSegmentOptions.find((opt) => (opt.id || opt.value) === id);
            if (option) {
                filters.push({
                    type: 'customerSegment',
                    id,
                    label: option.title || option.label,
                });
            }
        });

        this.productFilter.forEach((id) => {
            const option = this.productOptions.find((opt) => (opt.id || opt.value) === id);
            if (option) {
                filters.push({
                    type: 'product',
                    id,
                    label: option.title || option.label,
                });
            }
        });

        return filters;
    }

    #renderAppliedFilters() {
        const appliedFilters = this.#getAppliedFilters();
        if (appliedFilters.length === 0) return nothing;

        return html`
            <div class="applied-filters">
                <sp-tags>
                    ${repeat(
                        appliedFilters,
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
                <a class="clear-all" @click=${this.#handleClearAll}>Clear all</a>
            </div>
        `;
    }

    #renderFilterPicker(label, options, selectedValues, filterType) {
        const selectedCount = selectedValues.length;
        const displayLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label;

        return html`
            <overlay-trigger placement="bottom-start" @sp-closed=${(e) => e.stopPropagation()}>
                <sp-action-button slot="trigger" class="filter-trigger" quiet .disabled=${Store.translationProjects.isLoading.get()}>
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
        let result = Store[this.params.mainStore][this.params.storeSourceKey].value || [];

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter((fragment) => {
                const title = (fragment.title || '').toLowerCase();
                const productTag = fragment.tags?.find(({ id }) => id?.startsWith('mas:product_code/'))?.title || '';
                const offerId = fragment.offerData?.offerId || '';

                return (
                    title.includes(query) || productTag.toLowerCase().includes(query) || offerId.toLowerCase().includes(query)
                );
            });
        }

        if (this.templateFilter?.length > 0) {
            result = result.filter((fragment) => {
                const variantField = fragment.fields?.find((field) => field.name === 'variant');
                if (!variantField?.values?.length) return false;
                return variantField.values.some((value) => this.templateFilter.includes(value));
            });
        }

        if (this.marketSegmentFilter?.length > 0) {
            result = result.filter((fragment) =>
                fragment.tags?.some((tag) => this.marketSegmentFilter.includes(tag.id)),
            );
        }

        if (this.customerSegmentFilter?.length > 0) {
            result = result.filter((fragment) =>
                fragment.tags?.some((tag) => this.customerSegmentFilter.includes(tag.id)),
            );
        }

        if (this.productFilter?.length > 0) {
            result = result.filter((fragment) => fragment.tags?.some((tag) => this.productFilter.includes(tag.id)));
        }

        Store[this.params.mainStore][this.params.storeTargetKey].set(result);
        this.resultCount = Store[this.params.mainStore][this.params.storeTargetKey].value.length;
    }

    render() {
        return html`
            <div class="search">
                <sp-search
                    size="m"
                    placeholder="Search fragments..."
                    value=${this.searchQuery}
                    .disabled=${Store.translationProjects.isLoading.get()}
                    @input=${this.#handleSearchInput}
                    @submit=${this.#handleSearchSubmit}
                ></sp-search>
                ${this.searchQuery
                    ? html`<div class="result-count">${`${this.resultCount} result${this.resultCount !== 1 ? 's' : ''}`}</div>`
                    : nothing}
            </div>

            <div class="filters">
                ${this.#renderFilterPicker('Template', this.templateOptions, this.templateFilter, 'template')}
                ${this.#renderFilterPicker(
                    'Market Segment',
                    this.marketSegmentOptions,
                    this.marketSegmentFilter,
                    'marketSegment',
                )}
                ${this.#renderFilterPicker(
                    'Customer Segment',
                    this.customerSegmentOptions,
                    this.customerSegmentFilter,
                    'customerSegment',
                )}
                ${this.#renderFilterPicker('Product', this.productOptions, this.productFilter, 'product')}
            </div>

            ${this.#renderAppliedFilters()}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
