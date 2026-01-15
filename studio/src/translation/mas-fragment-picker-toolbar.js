import { LitElement, html, css } from 'lit';

/**
 * Toolbar component for MasFragmentPicker with search and filter capabilities.
 * Features:
 * - Search input with result count
 * - Four pinned filters: Template, Market Segment, Customer Segment, Product
 * - Filters work on top of search results
 */
class MasFragmentPickerToolbar extends LitElement {
    static properties = {
        searchQuery: { type: String },
        resultCount: { type: Number },
        loading: { type: Boolean },
        // Filter values (arrays of selected tag IDs)
        templateFilter: { type: Array, state: true },
        marketSegmentFilter: { type: Array, state: true },
        customerSegmentFilter: { type: Array, state: true },
        productFilter: { type: Array, state: true },
        // Available options for each filter (populated from fragments)
        templateOptions: { type: Array },
        marketSegmentOptions: { type: Array },
        customerSegmentOptions: { type: Array },
        productOptions: { type: Array },
    };

    static styles = css`
        :host {
            display: block;
        }

        .search {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 32px 0 20px 0;
        }

        .search sp-search {
            flex: 1;
            max-width: 400px;
        }

        .result-count {
            color: var(--spectrum-gray-700);
            font-size: 14px;
            white-space: nowrap;
        }

        .filters {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .filters sp-picker {
            --mod-picker-background-color-default: transparent;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 12px;
            min-width: 140px;
        }

        .filters sp-picker sp-menu-item {
            --mod-menu-item-background-color-default: transparent;
            --mod-menu-item-background-color-hover: var(--spectrum-gray-100);
        }

        .filters sp-picker sp-menu-item::before {
            display: none;
        }

        .filters sp-picker sp-checkbox {
            width: 100%;
        }
    `;

    constructor() {
        super();
        this.searchQuery = '';
        this.resultCount = 0;
        this.loading = false;
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.templateOptions = [];
        this.marketSegmentOptions = [];
        this.customerSegmentOptions = [];
        this.productOptions = [];
    }

    #handleSearchInput(e) {
        const query = e.target.value;
        this.searchQuery = query;
        this.dispatchEvent(
            new CustomEvent('search-change', {
                detail: { query },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleSearchSubmit(e) {
        e.preventDefault();
        this.dispatchEvent(
            new CustomEvent('search-submit', {
                detail: { query: this.searchQuery },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleCheckboxChange(filterType, optionId, e) {
        const isChecked = e.target.checked;
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

        if (isChecked) {
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

        this.#emitFilterChange();
    }

    #emitFilterChange() {
        this.dispatchEvent(
            new CustomEvent('filter-change', {
                detail: {
                    template: this.templateFilter,
                    marketSegment: this.marketSegmentFilter,
                    customerSegment: this.customerSegmentFilter,
                    product: this.productFilter,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #renderFilterPicker(label, options, selectedValues, filterType) {
        const selectedCount = selectedValues.length;
        const displayLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label;

        return html`
            <sp-picker label=${displayLabel}>
                <span slot="label">${displayLabel}</span>
                ${options.map((option) => {
                    const optionId = option.id || option.value;
                    const isChecked = selectedValues.includes(optionId);
                    return html`
                        <sp-menu-item
                            @click=${(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.target.closest('sp-menu-item')?.removeAttribute('selected');
                                const checkbox = e.target.closest('sp-menu-item')?.querySelector('sp-checkbox');
                                if (checkbox) {
                                    checkbox.checked = !checkbox.checked;
                                    this.#handleCheckboxChange(filterType, optionId, { target: { checked: checkbox.checked } });
                                }
                            }}
                        >
                            <sp-checkbox
                                ?checked=${isChecked}
                                @click=${(e) => e.stopPropagation()}
                                @change=${(e) => {
                                    e.stopPropagation();
                                    e.target.closest('sp-menu-item')?.removeAttribute('selected');
                                    this.#handleCheckboxChange(filterType, optionId, e);
                                }}
                            >
                                ${option.title || option.label}
                            </sp-checkbox>
                        </sp-menu-item>
                    `;
                })}
            </sp-picker>
        `;
    }

    #getResultCountText() {
        if (this.loading) {
            return 'Loading...';
        }
        return `${this.resultCount} result${this.resultCount !== 1 ? 's' : ''}`;
    }

    render() {
        return html`
            <div class="search">
                <sp-search
                    size="m"
                    placeholder="Search fragments..."
                    value=${this.searchQuery}
                    @input=${this.#handleSearchInput}
                    @submit=${this.#handleSearchSubmit}
                ></sp-search>
                <div class="result-count">${this.#getResultCountText()}</div>
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
        `;
    }

    /**
     * Clear all filters and search
     */
    reset() {
        this.searchQuery = '';
        this.templateFilter = [];
        this.marketSegmentFilter = [];
        this.customerSegmentFilter = [];
        this.productFilter = [];
        this.#emitFilterChange();
    }

    /**
     * Get current filter state
     */
    getFilters() {
        return {
            query: this.searchQuery,
            template: this.templateFilter,
            marketSegment: this.marketSegmentFilter,
            customerSegment: this.customerSegmentFilter,
            product: this.productFilter,
        };
    }
}

customElements.define('mas-fragment-picker-toolbar', MasFragmentPickerToolbar);
