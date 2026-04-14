import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { VARIANTS } from '../../editors/variant-picker.js';
import { styles } from './mas-items-search-filters.css.js';
import { FILTER_TYPE, TABLE_TYPE } from '../../constants.js';

/**
 * Search and filter bar for items selection.
 * Props-driven: receives items, emits filtered results via events.
 *
 * @fires items-filtered - Dispatched when filters/search change. detail: { items: Array }
 *
 * @property {string} type - 'cards' | 'collections' | 'placeholders'
 * @property {Array} items - All items to filter
 * @property {boolean} searchOnly - If true, only show search bar (no filter pickers)
 * @property {boolean} loading - Whether data is still loading
 */
class MasItemsSearchFilters extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String },
        items: { type: Array },
        searchOnly: { type: Boolean },
        loading: { type: Boolean },
        searchQuery: { type: String, state: true },
        templateFilter: { type: Array, state: true },
        marketSegmentFilter: { type: Array, state: true },
        customerSegmentFilter: { type: Array, state: true },
        productFilter: { type: Array, state: true },
    };

    constructor() {
        super();
        this.type = TABLE_TYPE.CARDS;
        this.items = [];
        this.searchOnly = false;
        this.loading = false;
        this.searchQuery = '';
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('items')) {
            if (!this.searchOnly) this.#extractFilterOptions();
            this.#applyFilters();
        }
    }

    get templateOptions() {
        return VARIANTS.filter((v) => v.label.toLowerCase() !== 'all').map((v) => ({ id: v.value, title: v.label }));
    }

    get marketSegmentOptions() {
        return this.#extractTagOptions('mas:market_segment/', 'mas:market_segments/');
    }

    get customerSegmentOptions() {
        return this.#extractTagOptions('mas:customer_segment/');
    }

    get productOptions() {
        return this.#extractTagOptions('mas:product_code/');
    }

    get filteredCount() {
        return this._filteredItems?.length ?? this.items.length;
    }

    get appliedFilters() {
        const filters = [];
        const addFilters = (filterValues, options, filterType) => {
            const optionsMap = new Map(options.map((opt) => [opt.id, opt]));
            for (const id of filterValues) {
                const option = optionsMap.get(id);
                if (option) filters.push({ type: filterType, id, label: option.title });
            }
        };
        addFilters(this.templateFilter, this.templateOptions, FILTER_TYPE.TEMPLATE);
        addFilters(this.marketSegmentFilter, this.marketSegmentOptions, FILTER_TYPE.MARKET_SEGMENT);
        addFilters(this.customerSegmentFilter, this.customerSegmentOptions, FILTER_TYPE.CUSTOMER_SEGMENT);
        addFilters(this.productFilter, this.productOptions, FILTER_TYPE.PRODUCT);
        return filters;
    }

    #extractTagOptions(...prefixes) {
        const tags = new Map();
        for (const item of this.items) {
            if (!item.tags) continue;
            for (const tag of item.tags) {
                const tagId = tag.id || '';
                if (prefixes.some((prefix) => tagId.startsWith(prefix))) {
                    tags.set(tagId, { id: tagId, title: tag.title || tagId.split('/').pop() || '' });
                }
            }
        }
        return Array.from(tags.values()).sort((a, b) => a.title.localeCompare(b.title));
    }

    #extractFilterOptions() {
        // Filter options are derived from items reactively via getters
        // This method is kept as a hook for future enhancements
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
        const filterMap = {
            [FILTER_TYPE.TEMPLATE]: 'templateFilter',
            [FILTER_TYPE.MARKET_SEGMENT]: 'marketSegmentFilter',
            [FILTER_TYPE.CUSTOMER_SEGMENT]: 'customerSegmentFilter',
            [FILTER_TYPE.PRODUCT]: 'productFilter',
        };
        const prop = filterMap[filterType];
        if (!prop) return;

        const current = [...this[prop]];
        if (e.target.checked) {
            if (!current.includes(optionId)) current.push(optionId);
        } else {
            const idx = current.indexOf(optionId);
            if (idx !== -1) current.splice(idx, 1);
        }
        this[prop] = current;
        this.#applyFilters();
    }

    #handleTagDelete({
        target: {
            value: { type, id },
        },
    }) {
        const filterMap = {
            [FILTER_TYPE.TEMPLATE]: 'templateFilter',
            [FILTER_TYPE.MARKET_SEGMENT]: 'marketSegmentFilter',
            [FILTER_TYPE.CUSTOMER_SEGMENT]: 'customerSegmentFilter',
            [FILTER_TYPE.PRODUCT]: 'productFilter',
        };
        const prop = filterMap[type];
        if (prop) {
            this[prop] = this[prop].filter((filterId) => filterId !== id);
            this.#applyFilters();
        }
    }

    #clearAllFilters() {
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.#applyFilters();
    }

    #applyFilters() {
        const query = this.searchQuery?.toLowerCase();
        const hasTemplate = this.templateFilter.length > 0;
        const hasMarket = this.marketSegmentFilter.length > 0;
        const hasCustomer = this.customerSegmentFilter.length > 0;
        const hasProduct = this.productFilter.length > 0;

        const result = (this.items || []).filter((item) => {
            if (query) {
                if (this.type === TABLE_TYPE.PLACEHOLDERS) {
                    const key = item.key?.toLowerCase() || '';
                    const value = item.value?.toLowerCase() || '';
                    if (!key.includes(query) && !value.includes(query)) return false;
                } else {
                    const title = (item.title || '').toLowerCase();
                    const productTag = item.tags?.find(({ id }) => id?.startsWith('mas:product_code/'))?.title || '';
                    const offerId = item.offerData?.offerId || '';
                    if (
                        !title.includes(query) &&
                        !productTag.toLowerCase().includes(query) &&
                        !offerId.toLowerCase().includes(query)
                    )
                        return false;
                }
            }
            if (hasTemplate) {
                const variantField = item.fields?.find((f) => f.name === 'variant');
                if (!variantField?.values?.some((v) => this.templateFilter.includes(v))) return false;
            }
            if (hasMarket && !item.tags?.some((tag) => this.marketSegmentFilter.includes(tag.id))) return false;
            if (hasCustomer && !item.tags?.some((tag) => this.customerSegmentFilter.includes(tag.id))) return false;
            if (hasProduct && !item.tags?.some((tag) => this.productFilter.includes(tag.id))) return false;
            return true;
        });

        if (this.type === TABLE_TYPE.CARDS) {
            result.sort((a, b) => (b.groupedVariations?.length > 0 ? 1 : 0) - (a.groupedVariations?.length > 0 ? 1 : 0));
        }

        this._filteredItems = result;
        this.dispatchEvent(new CustomEvent('items-filtered', { detail: { items: result }, bubbles: true, composed: true }));
    }

    #renderFilterPicker(label, options, selectedValues, filterType) {
        const count = selectedValues.length;
        const displayLabel = count > 0 ? `${label} (${count})` : label;

        return html`
            <overlay-trigger placement="bottom-start" @sp-closed=${(e) => e.stopPropagation()}>
                <sp-action-button slot="trigger" class="filter-trigger" quiet .disabled=${this.loading}>
                    ${displayLabel}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>
                <sp-popover slot="click-content" class="filter-popover">
                    <div class="checkbox-list">
                        ${options.map((option) => {
                            const optionId = option.id;
                            return html`
                                <sp-checkbox
                                    value=${optionId}
                                    ?checked=${selectedValues.includes(optionId)}
                                    @change=${(e) => this.#handleCheckboxChange(filterType, optionId, e)}
                                >
                                    ${option.title}
                                </sp-checkbox>
                            `;
                        })}
                    </div>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    #renderAppliedFilters() {
        if (this.appliedFilters.length === 0) return nothing;

        return html`
            <div class="applied-filters">
                <sp-tags>
                    ${repeat(
                        this.appliedFilters,
                        (f) => `${f.type}-${f.id}`,
                        (f) => html`
                            <sp-tag size="s" deletable .value=${{ type: f.type, id: f.id }} @delete=${this.#handleTagDelete}>
                                ${f.label}
                            </sp-tag>
                        `,
                    )}
                </sp-tags>
                <sp-action-button quiet @click=${this.#clearAllFilters}>Clear all</sp-action-button>
            </div>
        `;
    }

    render() {
        return html`
            <div class="search">
                <sp-search
                    size="m"
                    placeholder="Search fragments..."
                    value=${this.searchQuery}
                    .disabled=${this.loading}
                    @input=${this.#handleSearchInput}
                    @submit=${this.#handleSearchSubmit}
                ></sp-search>
                <div class="result-count">
                    ${this.loading
                        ? html`<sp-progress-circle indeterminate size="s"></sp-progress-circle>`
                        : html`${this.filteredCount} result${this.filteredCount !== 1 ? 's' : ''}`}
                </div>
            </div>

            ${this.searchOnly
                ? nothing
                : html`
                      <div class="filters">
                          ${this.#renderFilterPicker(
                              'Template',
                              this.templateOptions,
                              this.templateFilter,
                              FILTER_TYPE.TEMPLATE,
                          )}
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
                  `}
        `;
    }
}

customElements.define('mas-items-search-filters', MasItemsSearchFilters);
