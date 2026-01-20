import { LitElement, html, nothing, repeat } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import './mas-selected-items.js';
import './mas-fragment-picker-toolbar.js';
import Store from '../store.js';
import { ROOT_PATH, EDITABLE_FRAGMENT_MODEL_IDS } from '../constants.js';
import { getService, showToast, copyToClipboard } from '../utils.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        fragments: { type: Array, state: true },
        filteredFragments: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        fragmentsById: { type: Map, state: true },
        columnsToShow: { type: Set, state: true },
        selectedInTable: { type: Array, state: true },
        // Toolbar state
        searchQuery: { type: String, state: true },
        activeFilters: { type: Object, state: true },
        // Filter options extracted from fragments
        templateOptions: { type: Array, state: true },
        marketSegmentOptions: { type: Array, state: true },
        customerSegmentOptions: { type: Array, state: true },
        productOptions: { type: Array, state: true },
    };

    constructor() {
        super();
        this.selectedInTable = [];
        this.fragments = [];
        this.filteredFragments = [];
        this.fragmentsById = new Map();
        this.loading = false;
        this.error = null;
        this.abortController = null;
        this.unsubscribe = null;
        this.columnsToShow = new Set([
            { label: 'Offer', key: 'offer', sortable: true },
            { label: 'Fragment title', key: 'fragmentTitle' },
            { label: 'Offer ID', key: 'offerId' },
            { label: 'Path', key: 'path' },
            { label: 'Status', key: 'status' },
        ]);
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

    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = Store.search.subscribe(() => {
            this.fetchFragments();
        });
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

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    async fetchFragments() {
        const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        if (!surface) return;

        const aem = this.repository?.aem;
        if (!aem) {
            this.error = 'Repository not available';
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.loading = true;
        this.error = null;

        try {
            const cursor = await aem.sites.cf.fragments.search(
                {
                    path: `${ROOT_PATH}/${surface}/${Store.filters.value?.locale || 'en_US'}`,
                    modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                },
                null,
                this.abortController,
            );
            const fetchedFragments = [];
            for await (const result of cursor) {
                for (const item of result) {
                    fetchedFragments.push(item);
                }
            }
            // const fetchedFragments = hardcoded;
            this.fragments = await Promise.all(
                fetchedFragments.map(async (fragment) => ({
                    ...fragment,
                    offerData: await this.loadOfferData(fragment),
                })),
            );
            this.fragmentsById = new Map(this.fragments.map((fragment) => [fragment.id, fragment]));
            // Update Store so mas-selected-items can access fragment data
            Store.translationProjects.fragmentsByIds.set(this.fragmentsById);
            this.#extractFilterOptions();
            this.#applyFilters();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch fragments:', err);
                this.error = err.message;
                showToast('Failed to fetch fragments.', 'negative');
            }
        } finally {
            this.loading = false;
        }
    }

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        // Update Store so mas-selected-items can show selected items
        Store.translationProjects.selected.set(new Set(selected));
        this.dispatchEvent(
            new CustomEvent('selected', {
                detail: {
                    selected: selected.map((item) => this.fragmentsById.get(item)),
                    type: 'fragments',
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    setItemToRemove({ detail: { id } }) {
        // Remove item from selection
        const newSelected = this.selectedInTable.filter((selectedId) => selectedId !== id);
        this.selectedInTable = newSelected;
        Store.translationProjects.selected.set(new Set(newSelected));
    }

    renderTableHeader() {
        return html`
            <sp-table-head>
                ${repeat(
                    this.columnsToShow,
                    (column) => column.key,
                    (column) => html`<sp-table-head-cell> ${column.label} </sp-table-head-cell>`,
                )}
            </sp-table-head>
        `;
    }

    async loadOfferData(fragment) {
        try {
            const wcsOsi = fragment?.fields?.find(({ name }) => name === 'osi')?.values?.[0];
            if (!wcsOsi) return;
            const service = getService();
            const priceOptions = service.collectPriceOptions({ wcsOsi });
            const [offersPromise] = service.resolveOfferSelectors(priceOptions);
            if (!offersPromise) return;
            const [offer] = await offersPromise;
            return offer;
        } catch (err) {
            console.warn(`Failed to load offer data for fragment ${fragment.id}:`, err.message);
            return null;
        }
    }

    /**
     * Extract unique filter options from loaded fragments
     */
    #extractFilterOptions() {
        const templates = new Map();
        const marketSegments = new Map();
        const customerSegments = new Map();
        const products = new Map();

        for (const fragment of this.fragments) {
            if (!fragment.tags) continue;

            for (const tag of fragment.tags) {
                const tagId = tag.id || '';
                const tagTitle = tag.title || tagId.split('/').pop() || '';

                // Template/Variant tags
                if (tagId.startsWith('mas:variant/')) {
                    templates.set(tagId, { id: tagId, title: tagTitle });
                }
                // Market Segment tags
                else if (tagId.startsWith('mas:market_segment/') || tagId.startsWith('mas:market_segments/')) {
                    marketSegments.set(tagId, { id: tagId, title: tagTitle });
                }
                // Customer Segment tags
                else if (tagId.startsWith('mas:customer_segment/')) {
                    customerSegments.set(tagId, { id: tagId, title: tagTitle });
                }
                // Product tags
                else if (tagId.startsWith('mas:product_code/') || tagId.startsWith('mas:product/')) {
                    products.set(tagId, { id: tagId, title: tagTitle });
                }
            }
        }

        this.templateOptions = Array.from(templates.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.marketSegmentOptions = Array.from(marketSegments.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.customerSegmentOptions = Array.from(customerSegments.values()).sort((a, b) => a.title.localeCompare(b.title));
        this.productOptions = Array.from(products.values()).sort((a, b) => a.title.localeCompare(b.title));
    }

    /**
     * Apply search query and filters to fragments
     */
    #applyFilters() {
        let result = [...this.fragments];

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

        // Apply template filter
        if (this.activeFilters.template.length > 0) {
            result = result.filter((fragment) => fragment.tags?.some((tag) => this.activeFilters.template.includes(tag.id)));
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

        this.filteredFragments = result;
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

    renderStatus(status) {
        if (!status) return nothing;
        let statusClass = '';
        if (status === 'PUBLISHED') {
            statusClass = 'green';
        } else if (status === 'MODIFIED') {
            statusClass = 'blue';
        }
        return html`<sp-table-cell class="status-cell">
            <div class="status-dot ${statusClass}"></div>
            ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
        </sp-table-cell>`;
    }

    render() {
        const hasFiltersOrSearch = this.filteredFragments.length > 0 || this.searchQuery || this.#hasActiveFilters();
        const displayFragments = hasFiltersOrSearch ? this.filteredFragments : this.fragments;

        return html`
            <mas-fragment-picker-toolbar
                .searchQuery=${this.searchQuery}
                .resultCount=${displayFragments.length}
                .loading=${this.loading}
                .templateOptions=${this.templateOptions}
                .marketSegmentOptions=${this.marketSegmentOptions}
                .customerSegmentOptions=${this.customerSegmentOptions}
                .productOptions=${this.productOptions}
                @search-change=${this.#handleSearchChange}
                @filter-change=${this.#handleFilterChange}
            ></mas-fragment-picker-toolbar>

            <div class="container">
                ${this.loading
                    ? html`<div class="loading-container">${this.loadingIndicator}</div>`
                    : displayFragments.length
                      ? html` <sp-table
                            class="fragments-table"
                            emphasized
                            selects="multiple"
                            .selected=${this.selectedInTable}
                            @change=${this.updateSelected}
                        >
                            ${this.renderTableHeader()}
                            <sp-table-body>
                                ${repeat(
                                    displayFragments,
                                    (fragment) => fragment.id,
                                    (fragment) =>
                                        html`<sp-table-row value=${fragment.id}>
                                            <sp-table-cell>
                                                ${fragment.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title ||
                                                '-'}
                                            </sp-table-cell>
                                            <sp-table-cell>${fragment.title}</sp-table-cell>
                                            <sp-table-cell class="offer-id" title=${fragment.offerData?.offerId}>
                                                <div>${fragment.offerData?.offerId}</div>
                                                ${fragment.offerData?.offerId
                                                    ? html`<sp-button
                                                          icon-only
                                                          aria-label="Copy Offer ID to clipboard"
                                                          @click=${(e) => copyToClipboard(e, fragment.offerData?.offerId)}
                                                      >
                                                          <sp-icon-copy slot="icon"></sp-icon-copy>
                                                      </sp-button>`
                                                    : 'no offer data'}
                                            </sp-table-cell>
                                            <sp-table-cell></sp-table-cell>
                                            ${this.renderStatus(fragment.status)}
                                        </sp-table-row>`,
                                )}
                            </sp-table-body>
                        </sp-table>`
                      : html`<p>No fragments found.</p>`}
                <mas-selected-items .type=${'fragments'} @remove=${this.setItemToRemove}></mas-selected-items>
            </div>
        `;
    }

    #hasActiveFilters() {
        return (
            this.activeFilters.template.length > 0 ||
            this.activeFilters.marketSegment.length > 0 ||
            this.activeFilters.customerSegment.length > 0 ||
            this.activeFilters.product.length > 0
        );
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
