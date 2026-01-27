import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import './mas-selected-items.js';
import './mas-fragment-picker-toolbar.js';
import Store from '../store.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        fragments: { type: Array, state: true },
        filteredFragments: { type: Array, state: true },
        itemToRemove: { type: String, state: true },
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        fragmentsById: { type: Map, state: true },
        columnsToShow: { type: Set, state: true },
        selectedInTable: { type: Array, state: true },
        // Filter options extracted from fragments
        templateOptions: { type: Array, state: true },
        marketSegmentOptions: { type: Array, state: true },
        customerSegmentOptions: { type: Array, state: true },
        productOptions: { type: Array, state: true },
        tableKey: { type: Number, state: true },
    };

    constructor() {
        super();
        this.error = null;
        this.abortController = null;
        this.unsubscribe = null;
        // Toolbar state
        this.searchQuery = '';
        this.activeFilters = {
            template: [],
            marketSegment: [],
            customerSegment: [],
            product: [],
        };
        // Filter options
        this.templateOptions = [];
        this.marketSegmentOptions = [];
        this.customerSegmentOptions = [];
        this.productOptions = [];
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.abortController) {
            this.abortController.abort();
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    setItemToRemove({ detail: { path } }) {
        this.itemToRemove = path;
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /**
     * Apply search query and filters to fragments
     */
    #applyFilters() {
        let result = Store.translationProjects.allFragments.value || [];

        // Apply search query
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

        // Apply template filter by checking the variant field in fields array
        if (this.activeFilters.template.length > 0) {
            result = result.filter((fragment) => {
                const variantField = fragment.fields?.find((field) => field.name === 'variant');
                if (!variantField?.values?.length) return false;
                return variantField.values.some((value) => this.activeFilters.template.includes(value));
            });
        }

        // Apply market segment filter
        if (this.activeFilters.marketSegment.length > 0) {
            result = result.filter((fragment) =>
                fragment.tags?.some((tag) => this.activeFilters.marketSegment.includes(tag.id)),
            );
        }

        // Apply customer segment filter
        if (this.activeFilters.customerSegment.length > 0) {
            result = result.filter((fragment) =>
                fragment.tags?.some((tag) => this.activeFilters.customerSegment.includes(tag.id)),
            );
        }

        // Apply product filter
        if (this.activeFilters.product.length > 0) {
            result = result.filter((fragment) => fragment.tags?.some((tag) => this.activeFilters.product.includes(tag.id)));
        }

        Store.translationProjects.displayFragments.set(result);
        this.tableKey++;
    }

    #handleSearchChange(e) {
        this.searchQuery = e.detail.query;
        this.#applyFilters();
    }

    #handleFilterChange(e) {
        this.activeFilters = {
            template: e.detail.template || [],
            marketSegment: e.detail.marketSegment || [],
            customerSegment: e.detail.customerSegment || [],
            product: e.detail.product || [],
        };
        this.#applyFilters();
    }

    render() {
        return html`
            <mas-fragment-picker-toolbar
                .searchQuery=${this.searchQuery}
                .loading=${this.loading}
                .templateOptions=${this.templateOptions}
                .marketSegmentOptions=${this.marketSegmentOptions}
                .customerSegmentOptions=${this.customerSegmentOptions}
                .productOptions=${this.productOptions}
                @search-change=${this.#handleSearchChange}
                @filter-change=${this.#handleFilterChange}
            ></mas-fragment-picker-toolbar>
            <div class="container">
                <mas-select-fragments-table
                    .type=${'fragments'}
                    .itemToRemove=${this.itemToRemove}
                ></mas-select-fragments-table>
                <mas-selected-items @remove=${this.setItemToRemove}></mas-selected-items>
            </div>
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
