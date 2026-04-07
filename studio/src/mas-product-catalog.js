import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { executeMCPTool } from './services/mcp-client.js';
import { fetchProducts } from './services/product-api.js';
import { showToast } from './utils.js';
import Store from './store.js';
import { EVENT_OST_OFFER_SELECT, PAGE_NAMES, TEMPLATE_PREVIEWS } from './constants.js';
import { getVariantTreeData } from './editors/variant-picker.js';
import { precacheTemplatePreviews } from './utils/template-cache.js';
import { getUserSurfaces } from './groups.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './rte/ost.js';

class MasProductCatalog extends LitElement {
    createRenderRoot() {
        return this;
    }

    static properties = {
        products: { state: true },
        loading: { state: true },
        error: { state: true },
        createDialog: { state: true },
        creating: { state: true },
        currentPage: { state: true },
        pendingCreate: { state: true },
        sortBy: { state: true },
        sortDirection: { state: true },
        marketsFilter: { state: true },
        planTypesFilter: { state: true },
        segmentsFilter: { state: true },
    };

    pageSize = 50;

    constructor() {
        super();
        this.products = [];
        this.loading = false;
        this.currentPage = 0;
        this.error = null;
        this.createDialog = null;
        this.creating = false;
        this.pendingCreate = null;
        this.sortBy = null;
        this.sortDirection = 'asc';
        this.marketsFilter = new Set();
        this.planTypesFilter = new Set();
        this.segmentsFilter = new Set();
        this.handleOfferSelect = this.handleOfferSelect.bind(this);
    }

    toggleFilter(facet, value) {
        const current = this[facet];
        const next = new Set(current);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        this[facet] = next;
        this.currentPage = 0;
    }

    clearAllFilters = () => {
        this.marketsFilter = new Set();
        this.planTypesFilter = new Set();
        this.segmentsFilter = new Set();
        this.currentPage = 0;
    };

    getProductMarkets(product) {
        return Array.isArray(product.market_segments) ? product.market_segments : Object.keys(product.marketSegments || {});
    }

    getProductPlanTypes(product) {
        return Object.keys(product.planTypes || {}).filter(Boolean);
    }

    getProductSegments(product) {
        return product.customer_segment ? [product.customer_segment] : Object.keys(product.customerSegments || {});
    }

    get availableFacets() {
        const markets = new Set();
        const planTypes = new Set();
        const segments = new Set();
        for (const p of this.products) {
            this.getProductMarkets(p).forEach((m) => markets.add(m));
            this.getProductPlanTypes(p).forEach((t) => planTypes.add(t));
            this.getProductSegments(p).forEach((s) => segments.add(s));
        }
        return {
            markets: [...markets].sort(),
            planTypes: [...planTypes].sort(),
            segments: [...segments].sort(),
        };
    }

    get hasActiveFilters() {
        return this.marketsFilter.size > 0 || this.planTypesFilter.size > 0 || this.segmentsFilter.size > 0;
    }

    handleSort = ({ detail: { sortKey, sortDirection } }) => {
        this.sortBy = sortKey;
        this.sortDirection = sortDirection;
        this.currentPage = 0;
    };

    getSortValue(product, column) {
        switch (column) {
            case 'name':
                return product.copy?.name || product.name || '';
            case 'code':
                return product.product_code || '';
            case 'arrangement':
                return product.arrangement_code || '';
            case 'family':
                return product.product_family || '';
            case 'segment':
                return (
                    product.customer_segment ||
                    Object.keys(product.customerSegments || {})
                        .sort()
                        .join(', ')
                );
            case 'markets':
                return Array.isArray(product.market_segments)
                    ? [...product.market_segments].sort().join(', ')
                    : Object.keys(product.marketSegments || {})
                          .sort()
                          .join(', ');
            case 'plans':
                return Object.keys(product.planTypes || {})
                    .sort()
                    .join(', ');
            default:
                return '';
        }
    }

    get searchQuery() {
        return Store.productCatalog.search.value;
    }

    handleSearchChange = () => {
        this.currentPage = 0;
        this.requestUpdate();
    };

    connectedCallback() {
        super.connectedCallback();
        this.loadProducts();
        Store.productCatalog.search.subscribe(this.handleSearchChange);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.handleOfferSelect);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.productCatalog.search.unsubscribe(this.handleSearchChange);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.handleOfferSelect);
    }

    async loadProducts() {
        this.loading = true;
        this.error = null;
        try {
            const result = await fetchProducts();
            this.products = result.products || [];
        } catch (e) {
            console.error('Failed to load products:', e);
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }

    matchesFacetFilters(product) {
        if (this.marketsFilter.size > 0) {
            const productMarkets = this.getProductMarkets(product);
            const match = productMarkets.some((m) => this.marketsFilter.has(m));
            if (!match) return false;
        }
        if (this.planTypesFilter.size > 0) {
            const productPlanTypes = this.getProductPlanTypes(product);
            const match = productPlanTypes.some((t) => this.planTypesFilter.has(t));
            if (!match) return false;
        }
        if (this.segmentsFilter.size > 0) {
            const productSegments = this.getProductSegments(product);
            const match = productSegments.some((s) => this.segmentsFilter.has(s));
            if (!match) return false;
        }
        return true;
    }

    get filteredProducts() {
        const source = this.products.filter((p) => {
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const matchesSearch =
                    (p.copy?.name || p.name || '').toLowerCase().includes(q) ||
                    (p.product_code || '').toLowerCase().includes(q) ||
                    (p.arrangement_code || '').toLowerCase().includes(q) ||
                    (p.product_family || '').toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }
            return this.matchesFacetFilters(p);
        });

        if (this.sortBy) {
            const direction = this.sortDirection === 'desc' ? -1 : 1;
            return [...source].sort((a, b) => {
                const left = this.getSortValue(a, this.sortBy) || '';
                const right = this.getSortValue(b, this.sortBy) || '';
                // Empty values always sort to the bottom regardless of direction,
                // so toggling asc/desc never pins nameless rows at the top.
                if (!left && right) return 1;
                if (left && !right) return -1;
                const comparison = String(left).localeCompare(String(right), undefined, { sensitivity: 'base' });
                if (comparison !== 0) return comparison * direction;
                return (a.arrangement_code || '').localeCompare(b.arrangement_code || '');
            });
        }

        // Default sort: cluster by product family, then by product name.
        // Users asked for a consistent default ordering so the same product always appears in
        // the same spot, and so products from the same family sit next to each other.
        return [...source].sort((a, b) => {
            const familyCompare = (a.product_family || '').localeCompare(b.product_family || '');
            if (familyCompare !== 0) return familyCompare;
            const nameA = a.copy?.name || a.name || '';
            const nameB = b.copy?.name || b.name || '';
            return nameA.localeCompare(nameB);
        });
    }

    get totalPages() {
        return Math.ceil(this.filteredProducts.length / this.pageSize);
    }

    handleSearch(e) {
        Store.productCatalog.search.set(e.target.value || '');
    }

    copyToClipboard(e, text) {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'positive');
    }

    navigateToDetail(product) {
        Store.productDetail.arrangementCode.set(product.arrangement_code);
        Store.page.set(PAGE_NAMES.PRODUCT_DETAIL);
    }

    openCreateDialog(product) {
        const surfaces = getUserSurfaces();
        const surface = surfaces[0] || 'sandbox';
        const locale = Store.filters?.value?.locale || 'en_US';

        this.createDialog = {
            product,
            surface,
            locale,
            selectedVariants: new Set(),
            previewsLoaded: false,
        };
        this.loadTemplatePreviews(surface);
    }

    async loadTemplatePreviews(surface) {
        await precacheTemplatePreviews(surface);
        if (this.createDialog) {
            this.createDialog = { ...this.createDialog, previewsLoaded: true };
        }
    }

    closeCreateDialog() {
        this.createDialog = null;
    }

    handleDialogSurfaceChange(e) {
        const value = e.target?.value || e.detail?.value;
        if (!value) return;
        this.createDialog = {
            ...this.createDialog,
            surface: value,
            previewsLoaded: false,
        };
        this.loadTemplatePreviews(value);
    }

    toggleVariant(name) {
        const next = new Set(this.createDialog.selectedVariants);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        this.createDialog = { ...this.createDialog, selectedVariants: next };
    }

    loadMore() {
        if (this.currentPage + 1 < this.totalPages) {
            this.currentPage++;
        }
    }

    get visibleProducts() {
        return this.filteredProducts.slice(0, (this.currentPage + 1) * this.pageSize);
    }

    handleTableScroll(e) {
        const el = e.target;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
            this.loadMore();
        }
    }

    confirmCreate() {
        const { product, surface, locale, selectedVariants } = this.createDialog;
        this.pendingCreate = {
            product,
            surface,
            locale,
            variants: [...selectedVariants],
        };
        this.closeCreateDialog();
        openOfferSelectorTool({ tagName: 'OSI-FIELD' }, null, {
            arrangement_code: product.arrangement_code,
        });
    }

    handleOfferSelect({ detail: { offerSelectorId } }) {
        if (!this.pendingCreate) return;
        closeOfferSelectorTool();
        this.executeCreate(offerSelectorId);
    }

    async executeCreate(osi) {
        const { product, surface, locale, variants } = this.pendingCreate;
        this.pendingCreate = null;
        this.creating = true;
        try {
            const parentPath = `/content/dam/mas/${surface}/${locale}`;
            const result = await executeMCPTool('create_release_cards', {
                arrangement_code: product.arrangement_code,
                variants,
                parentPath,
                osi,
            });
            if (result.success) {
                const count = result.cards?.filter((c) => !c.error).length || 0;
                showToast(`Created ${count} fragment${count !== 1 ? 's' : ''}`, 'positive');
            } else {
                showToast(`Failed: ${result.cards?.[0]?.error || 'Unknown error'}`, 'negative');
            }
        } catch (e) {
            console.error('Failed to create fragments:', e);
            showToast(`Error: ${e.message}`, 'negative');
        } finally {
            this.creating = false;
        }
    }

    render() {
        return html`
            <div class="product-catalog">
                <div class="product-catalog-header">
                    <h2>Product Catalog</h2>
                    <span class="product-count">${this.filteredProducts.length} products</span>
                    ${this.products.length > 0 ? this.filtersTemplate : nothing}
                </div>
                ${this.loading ? this.loadingTemplate : nothing} ${this.error ? this.errorTemplate : nothing}
                ${!this.loading && !this.error ? this.tableTemplate : nothing}
                ${this.createDialog ? this.createDialogTemplate : nothing}
                ${this.creating ? this.creatingOverlayTemplate : nothing}
            </div>
        `;
    }

    facetMenuTemplate(facetState, label, facet, options) {
        const count = this[facetState].size;
        const displayLabel = count > 0 ? `${label} (${count})` : label;
        return html`
            <sp-action-menu size="m" quiet placement="bottom-start" label=${displayLabel}>
                <span slot="label">${displayLabel}</span>
                ${options.length === 0
                    ? html`<sp-menu-item disabled>No values</sp-menu-item>`
                    : options.map(
                          (value) => html`
                              <sp-menu-item
                                  ?selected=${this[facetState].has(value)}
                                  @click=${(event) => {
                                      event.stopPropagation();
                                      this.toggleFilter(facetState, value);
                                  }}
                              >
                                  ${value}
                              </sp-menu-item>
                          `,
                      )}
            </sp-action-menu>
        `;
    }

    get filtersTemplate() {
        const facets = this.availableFacets;
        return html`
            <div class="product-catalog-filters">
                ${this.facetMenuTemplate('marketsFilter', 'Markets', 'markets', facets.markets)}
                ${this.facetMenuTemplate('planTypesFilter', 'Plan Types', 'planTypes', facets.planTypes)}
                ${this.facetMenuTemplate('segmentsFilter', 'Segments', 'segments', facets.segments)}
                ${this.hasActiveFilters
                    ? html`
                          <sp-action-button quiet size="s" @click=${this.clearAllFilters} title="Clear all filters">
                              <sp-icon-close slot="icon"></sp-icon-close>
                              Clear filters
                          </sp-action-button>
                      `
                    : nothing}
            </div>
        `;
    }

    get loadingTemplate() {
        return html`<div class="product-catalog-loading">
            <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            <p>Loading products from MCS...</p>
        </div>`;
    }

    get errorTemplate() {
        return html`<div class="product-catalog-error">
            <sp-icon-alert size="l"></sp-icon-alert>
            <p>${this.error}</p>
            <sp-button @click=${() => this.loadProducts()}>Retry</sp-button>
        </div>`;
    }

    get tableTemplate() {
        if (this.filteredProducts.length === 0) {
            return html`<div class="product-catalog-empty">
                <p>${this.searchQuery ? 'No products match your search.' : 'No products found.'}</p>
            </div>`;
        }

        const directionFor = (key) => (this.sortBy === key ? this.sortDirection : 'asc');
        return html`
            <sp-table emphasized>
                <sp-table-head>
                    <sp-table-head-cell class="col-icon"></sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-product"
                        sortable
                        sort-key="name"
                        sort-direction=${directionFor('name')}
                        @sorted=${this.handleSort}
                    >
                        Product
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-code"
                        sortable
                        sort-key="code"
                        sort-direction=${directionFor('code')}
                        @sorted=${this.handleSort}
                    >
                        Code
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-arrangement"
                        sortable
                        sort-key="arrangement"
                        sort-direction=${directionFor('arrangement')}
                        @sorted=${this.handleSort}
                    >
                        Arrangement
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-family"
                        sortable
                        sort-key="family"
                        sort-direction=${directionFor('family')}
                        @sorted=${this.handleSort}
                    >
                        Family
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-segment"
                        sortable
                        sort-key="segment"
                        sort-direction=${directionFor('segment')}
                        @sorted=${this.handleSort}
                    >
                        Segment
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-markets"
                        sortable
                        sort-key="markets"
                        sort-direction=${directionFor('markets')}
                        @sorted=${this.handleSort}
                    >
                        Markets
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        class="col-plans"
                        sortable
                        sort-key="plans"
                        sort-direction=${directionFor('plans')}
                        @sorted=${this.handleSort}
                    >
                        Plan Types
                    </sp-table-head-cell>
                    <sp-table-head-cell class="col-action"></sp-table-head-cell>
                </sp-table-head>
                <sp-table-body @scroll=${this.handleTableScroll}>
                    ${repeat(
                        this.visibleProducts,
                        (p) => p.arrangement_code,
                        (p) => this.renderProductRow(p),
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    renderProductRow(product) {
        const name = product.copy?.name || product.name || '';
        const icon = product.assets?.icons?.svg || product.icon || '';
        const segment =
            product.customer_segment ||
            Object.keys(product.customerSegments || {})
                .sort()
                .join(', ');
        const markets = Array.isArray(product.market_segments)
            ? [...product.market_segments].sort().join(', ')
            : Object.keys(product.marketSegments || {})
                  .sort()
                  .join(', ');
        const planTypes = Object.keys(product.planTypes || {})
            .sort()
            .join(', ');

        return html`
            <sp-table-row value=${product.arrangement_code}>
                <sp-table-cell class="col-icon">
                    ${icon ? html`<img src="${icon}" alt="${name}" loading="lazy" />` : nothing}
                </sp-table-cell>
                <sp-table-cell class="col-product product-name">
                    <span class="product-link" @click=${() => this.navigateToDetail(product)}>${name}</span>
                </sp-table-cell>
                <sp-table-cell class="col-code"><code>${product.product_code || ''}</code></sp-table-cell>
                <sp-table-cell class="col-arrangement">
                    <code>${product.arrangement_code || ''}</code>
                    <sp-action-button
                        quiet
                        size="xs"
                        class="copy-btn"
                        @click=${(e) => this.copyToClipboard(e, product.arrangement_code)}
                    >
                        <sp-icon-copy slot="icon"></sp-icon-copy>
                    </sp-action-button>
                </sp-table-cell>
                <sp-table-cell class="col-family">${product.product_family || ''}</sp-table-cell>
                <sp-table-cell class="col-segment">${segment}</sp-table-cell>
                <sp-table-cell class="col-markets">${markets}</sp-table-cell>
                <sp-table-cell class="col-plans">${planTypes}</sp-table-cell>
                <sp-table-cell class="col-action">
                    <sp-action-button quiet size="s" @click=${() => this.openCreateDialog(product)}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create Fragment
                    </sp-action-button>
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    get createDialogTemplate() {
        const { product, surface, locale, selectedVariants } = this.createDialog;
        const name = product.copy?.name || product.name || '';
        const icon = product.assets?.icons?.svg || product.icon || '';
        const folders = getUserSurfaces();
        const variants = getVariantTreeData(surface);

        return html`
            <div class="dialog-backdrop" @click=${() => this.closeCreateDialog()}>
                <div class="create-dialog" @click=${(e) => e.stopPropagation()}>
                    <div class="create-dialog-top">
                        <h3 class="create-dialog-title">Create Fragment</h3>
                        <div class="create-dialog-product">
                            ${icon ? html`<img src="${icon}" width="36" height="36" class="product-icon-img" />` : nothing}
                            <strong>${name}</strong>
                        </div>
                        <div class="create-dialog-top-right">
                            <sp-picker size="s" value=${surface} label="Surface" @change=${this.handleDialogSurfaceChange}>
                                ${folders.map((f) => html`<sp-menu-item value="${f}">${f.toUpperCase()}</sp-menu-item>`)}
                            </sp-picker>
                            <sp-action-button quiet @click=${() => this.closeCreateDialog()}>
                                <sp-icon-close slot="icon"></sp-icon-close>
                            </sp-action-button>
                        </div>
                    </div>
                    <div class="template-grid">
                        ${!this.createDialog.previewsLoaded
                            ? html`<div class="template-loading">
                                  <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                              </div>`
                            : nothing}
                        ${repeat(
                            variants,
                            (v) => v.name,
                            (v) => this.renderTemplateCard(v, selectedVariants),
                        )}
                    </div>

                    <div class="dialog-footer">
                        <sp-button variant="secondary" @click=${() => this.closeCreateDialog()}>Cancel</sp-button>
                        <sp-button
                            variant="accent"
                            ?disabled=${selectedVariants.size === 0}
                            @click=${() => this.confirmCreate()}
                        >
                            Next: Select Offer
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }

    get creatingOverlayTemplate() {
        return html`
            <div class="dialog-backdrop">
                <div class="create-dialog creating-overlay">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    <p>Creating fragments...</p>
                </div>
            </div>
        `;
    }

    renderTemplateCard(v, selectedVariants) {
        const selected = selectedVariants.has(v.name);
        const previewId = TEMPLATE_PREVIEWS[v.name];

        return html`
            <div class="template-card ${selected ? 'selected' : ''}" @click=${() => this.toggleVariant(v.name)}>
                <div class="template-preview">
                    ${previewId && this.createDialog.previewsLoaded
                        ? html`<merch-card><aem-fragment author fragment="${previewId}"></aem-fragment></merch-card>`
                        : html`<div class="template-placeholder">${v.label}</div>`}
                </div>
                <div class="template-label">${v.label}</div>
            </div>
        `;
    }
}

customElements.define('mas-product-catalog', MasProductCatalog);
