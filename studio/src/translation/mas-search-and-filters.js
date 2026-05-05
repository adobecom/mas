import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../editors/variant-picker.js';
import { styles } from './mas-search-and-filters.css.js';
import Store from '../store.js';
import { FILTER_TYPE, TABLE_TYPE } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';

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
        templateOptions: { type: Array },
        marketSegmentOptions: { type: Array },
        customerSegmentOptions: { type: Array },
        productOptions: { type: Array },
        searchOnly: { type: Boolean },
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
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.type === TABLE_TYPE.CARDS) {
            this.#savedSearch = Store.search.get();
            this.#savedFilters = Store.filters.get();
        }
        this.commonDataController = new ReactiveController(this, [
            Store.translationProjects[`all${this.typeUppercased}`],
            Store.translationProjects[`display${this.typeUppercased}`],
            Store[this.type === TABLE_TYPE.PLACEHOLDERS ? 'placeholders' : 'fragments'].list.loading,
            ...(this.type !== TABLE_TYPE.PLACEHOLDERS ? [Store.fragments.list.firstPageLoaded] : []),
        ]);
        const dataCallback = () => {
            if (!this.searchOnly) {
                this.#extractFilterOptions();
            }
            if (this.type === TABLE_TYPE.PLACEHOLDERS) {
                this.#applyFilters();
            }
            this.requestUpdate();
        };
        Store.translationProjects[`all${this.typeUppercased}`].subscribe(dataCallback);
        this.dataSubscription = {
            unsubscribe: () => Store.translationProjects[`all${this.typeUppercased}`].unsubscribe(dataCallback),
        };
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.translationProjects[`display${this.typeUppercased}`].set(
            Store.translationProjects[`all${this.typeUppercased}`].value,
        );
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

    #extractFilterOptions() {
        const marketSegments = new Map();
        const customerSegments = new Map();
        const products = new Map();
        for (const fragment of Store.translationProjects[`all${this.typeUppercased}`].value) {
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

    willUpdate(changed) {
        if (
            changed.has('searchQuery') ||
            changed.has('templateFilter') ||
            changed.has('marketSegmentFilter') ||
            changed.has('customerSegmentFilter') ||
            changed.has('productFilter')
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
        }
    }

    #clearAllFilters() {
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
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
        if (this.type === TABLE_TYPE.PLACEHOLDERS) {
            this.#applyLocalFilter();
            return;
        }
        const query = this.searchQuery?.trim() || undefined;
        Store.search.set((prev) => ({ ...prev, query }));

        const tagIds = this.#buildTagIds();
        Store.filters.set((prev) => ({ ...prev, tags: tagIds.length ? tagIds.join(',') : undefined }));
    }

    #applyLocalFilter() {
        const source = Store.translationProjects[`all${this.typeUppercased}`].value || [];
        const query = this.searchQuery?.toLowerCase();
        const result = source.filter((fragment) => {
            if (query) {
                const key = fragment.key?.toLowerCase() || '';
                const value = fragment.value?.toLowerCase() || '';
                if (!key.includes(query) && !value.includes(query)) return false;
            }
            return true;
        });
        Store.translationProjects[`display${this.typeUppercased}`].set(result);
    }

    #buildTagIds() {
        const ids = [];
        for (const id of this.templateFilter) {
            ids.push(`mas:variant/${id}`);
        }
        for (const id of this.marketSegmentFilter) ids.push(id);
        for (const id of this.customerSegmentFilter) ids.push(id);
        for (const id of this.productFilter) ids.push(id);
        return ids;
    }

    renderCount() {
        if (this.isLoading) {
            return html`<div class="result-count"><sp-progress-circle indeterminate size="s"></sp-progress-circle></div>`;
        }
        const count = Store.translationProjects[`display${this.typeUppercased}`].value.length;
        return html`<div class="result-count">
            ${count} result${count !== 1 ? 's' : ''}
            ${this.isLoadingMore ? html`<sp-progress-circle indeterminate size="s"></sp-progress-circle>` : nothing}
        </div>`;
    }

    render() {
        if (this.searchOnly) {
            return html`${this.renderCount()}`;
        }
        return html`
            <div class="filters">
                ${this.renderCount()}
                ${this.#renderFilterPicker('Template', this.templateOptions, this.templateFilter, FILTER_TYPE.TEMPLATE)}
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
                ${this.#renderFilterPicker('Product', this.productOptions, this.productFilter, FILTER_TYPE.PRODUCT)}
            </div>
            ${this.#renderAppliedFilters()}
        `;
    }
}

customElements.define('mas-search-and-filters', MasSearchAndFilters);
