import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { executeMCPTool } from './services/mcp-client.js';
import { showToast } from './utils.js';
import Store from './store.js';
import { PAGE_NAMES } from './constants.js';
import { getVariantTreeData } from './editors/variant-picker.js';
import { getUserSurfaces } from './groups.js';

class MasProductCatalog extends LitElement {
    createRenderRoot() {
        return this;
    }

    static properties = {
        products: { state: true },
        loading: { state: true },
        error: { state: true },
        searchQuery: { state: true },
        createDialog: { state: true },
        creating: { state: true },
        currentPage: { state: true },
    };

    pageSize = 50;

    constructor() {
        super();
        this.products = [];
        this.loading = false;
        this.currentPage = 0;
        this.error = null;
        this.searchQuery = '';
        this.createDialog = null;
        this.creating = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadProducts();
    }

    async loadProducts() {
        this.loading = true;
        this.error = null;
        try {
            const result = await executeMCPTool('list_products', {});
            this.products = result.products || [];
        } catch (e) {
            console.error('Failed to load products:', e);
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }

    get filteredProducts() {
        if (!this.searchQuery) return this.products;
        const q = this.searchQuery.toLowerCase();
        return this.products.filter(
            (p) =>
                (p.copy?.name || p.name || '').toLowerCase().includes(q) ||
                (p.product_code || '').toLowerCase().includes(q) ||
                (p.arrangement_code || '').toLowerCase().includes(q) ||
                (p.product_family || '').toLowerCase().includes(q),
        );
    }

    get totalPages() {
        return Math.ceil(this.filteredProducts.length / this.pageSize);
    }

    handleSearch(e) {
        this.searchQuery = e.target.value || '';
        this.currentPage = 0;
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

        // Show modal immediately
        this.createDialog = {
            product,
            surface,
            locale,
            selectedVariants: new Set(),
            previewsLoaded: false,
        };

        // Lazy-load previews in background
        this.precacheTemplatePreviews(surface);
    }

    async precacheTemplatePreviews(surface) {
        const AemFragmentElement = customElements.get('aem-fragment');
        if (!AemFragmentElement?.cache) return;

        const variants = getVariantTreeData(surface);
        const ids = variants.map((v) => this.templatePreviews[v.name]).filter(Boolean);
        const uncached = ids.filter((id) => !AemFragmentElement.cache.has(id));

        if (uncached.length === 0) {
            this.createDialog = { ...this.createDialog, previewsLoaded: true };
            return;
        }

        const baseUrl =
            document.querySelector('mas-repository')?.getAttribute('base-url') || 'https://odinpreview.corp.adobe.com';
        const token = sessionStorage.getItem('masAccessToken') || window.adobeIMS?.getAccessToken()?.token;

        await Promise.allSettled(
            uncached.map(async (id) => {
                try {
                    const resp = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${id}?references=all-hydrated`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!resp.ok) return;
                    const fragment = await resp.json();
                    AemFragmentElement.cache.add(fragment);
                } catch (e) {
                    console.warn(`Failed to cache template ${id}:`, e.message);
                }
            }),
        );

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
        this.precacheTemplatePreviews(value);
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

    async confirmCreate() {
        const { product, surface, locale, selectedVariants } = this.createDialog;
        const variants = [...selectedVariants];
        this.creating = true;
        try {
            const parentPath = `/content/dam/mas/${surface}/${locale}`;
            const result = await executeMCPTool('create_release_cards', {
                arrangement_code: product.arrangement_code,
                variants,
                parentPath,
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
            this.closeCreateDialog();
        }
    }

    render() {
        return html`
            <div class="product-catalog">
                <div class="product-catalog-header">
                    <h2>Product Catalog</h2>
                    <span class="product-count">${this.filteredProducts.length} products</span>
                </div>
                <div class="product-catalog-toolbar">
                    <sp-search
                        placeholder="Search by product name, code, or arrangement..."
                        @input=${this.handleSearch}
                        @submit=${(e) => e.preventDefault()}
                    ></sp-search>
                    <sp-action-button quiet @click=${() => this.loadProducts()}>
                        <sp-icon-refresh slot="icon"></sp-icon-refresh>
                    </sp-action-button>
                </div>
                ${this.loading ? this.renderLoading() : nothing} ${this.error ? this.renderError() : nothing}
                ${!this.loading && !this.error ? this.renderTable() : nothing}
                ${this.createDialog ? this.renderCreateDialog() : nothing}
            </div>
        `;
    }

    renderLoading() {
        return html`<div class="product-catalog-loading">
            <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            <p>Loading products from MCS...</p>
        </div>`;
    }

    renderError() {
        return html`<div class="product-catalog-error">
            <sp-icon-alert size="l"></sp-icon-alert>
            <p>${this.error}</p>
            <sp-button @click=${() => this.loadProducts()}>Retry</sp-button>
        </div>`;
    }

    renderTable() {
        if (this.filteredProducts.length === 0) {
            return html`<div class="product-catalog-empty">
                <p>${this.searchQuery ? 'No products match your search.' : 'No products found.'}</p>
            </div>`;
        }

        return html`
            <sp-table emphasized scroller @scroll=${this.handleTableScroll}>
                <sp-table-head>
                    <sp-table-head-cell class="col-icon"></sp-table-head-cell>
                    <sp-table-head-cell class="col-product" sortable sort-direction="asc">Product</sp-table-head-cell>
                    <sp-table-head-cell class="col-code">Code</sp-table-head-cell>
                    <sp-table-head-cell class="col-arrangement">Arrangement</sp-table-head-cell>
                    <sp-table-head-cell class="col-family">Family</sp-table-head-cell>
                    <sp-table-head-cell class="col-segment">Segment</sp-table-head-cell>
                    <sp-table-head-cell class="col-markets">Markets</sp-table-head-cell>
                    <sp-table-head-cell class="col-plans">Plan Types</sp-table-head-cell>
                    <sp-table-head-cell class="col-action"></sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        this.visibleProducts,
                        (p) => p.arrangement_code,
                        (p) => this.renderProductRow(p),
                    )}
                </sp-table-body>
            </sp-table>
            <div class="product-catalog-pagination">
                <span>Showing ${this.visibleProducts.length} of ${this.filteredProducts.length} products</span>
                ${this.visibleProducts.length < this.filteredProducts.length
                    ? html`<sp-action-button quiet @click=${() => this.loadMore()}>Load more</sp-action-button>`
                    : nothing}
            </div>
        `;
    }

    renderProductRow(product) {
        const name = product.copy?.name || product.name || '';
        const icon = product.assets?.icons?.svg || product.icon || '';
        const segment = product.customer_segment || Object.keys(product.customerSegments || {}).join(', ');
        const markets = Array.isArray(product.market_segments)
            ? product.market_segments.join(', ')
            : Object.keys(product.marketSegments || {}).join(', ');
        const planTypes = Object.keys(product.planTypes || {}).join(', ');

        return html`
            <sp-table-row value=${product.arrangement_code} @dblclick=${() => this.navigateToDetail(product)}>
                <sp-table-cell class="col-icon">
                    ${icon ? html`<img src="${icon}" alt="${name}" loading="lazy" />` : nothing}
                </sp-table-cell>
                <sp-table-cell class="col-product product-name">${name}</sp-table-cell>
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

    get templatePreviews() {
        return {
            'ccd-slice': '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
            'ccd-suggested': '45783ec8-ed85-4595-a445-3f018ac4ad9d',
            mini: '03a36f0f-3e5d-4881-ae6b-273c517c9d38',
            'ah-try-buy-widget': '44520fdc-f6e1-4c21-8978-9cd25a1be158',
            'ah-promoted-plans': '031e2f50-5cbc-4e4b-af9b-c63f0e4f2a93',
            'simplified-pricing-express': 'aaa728dc-2b44-495c-b9f0-bb82044db18a',
            'full-pricing-express': '9406f1ae-7bee-48c3-9892-49af6816033e',
            plans: '1736f2c9-0931-401b-b3c0-fe87ff72ad38',
            'plans-education': 'b8cd82c8-f8fa-433a-afa2-9aba4ebe5ea5',
            fries: '8487f19d-b038-44fa-9db6-0dc55a85b326',
            catalog: '562e30f0-df13-4a42-a129-6faa0e9a315e',
            'special-offers': 'ff7c7861-453f-43d6-a380-5a56bb2facfd',
            'mini-compare-chart': 'aec33efb-3eae-4dee-aab1-fd07e17c47c8',
            'mini-compare-chart-mweb': 'b621670d-e7d1-4be4-97f5-a4cdc6f6dea0',
        };
    }

    renderCreateDialog() {
        const { product, surface, locale, selectedVariants } = this.createDialog;
        const name = product.copy?.name || product.name || '';
        const icon = product.assets?.icons?.svg || product.icon || '';
        const folders = getUserSurfaces();
        const variants = getVariantTreeData(surface);

        return html`
            <div class="dialog-backdrop" @click=${() => this.closeCreateDialog()}>
                <div class="create-dialog" @click=${(e) => e.stopPropagation()}>
                    <div class="create-dialog-top">
                        <div class="create-dialog-product">
                            ${icon ? html`<img src="${icon}" width="36" height="36" class="product-icon-img" />` : nothing}
                            <div>
                                <strong>${name}</strong>
                                <div class="product-subtitle">${product.product_code} · ${product.arrangement_code}</div>
                            </div>
                        </div>
                        <sp-action-button quiet @click=${() => this.closeCreateDialog()}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>
                    </div>

                    <div class="create-dialog-config">
                        <div class="create-dialog-field">
                            <sp-field-label size="s">Surface</sp-field-label>
                            <sp-picker size="s" value=${surface} label="Surface" @change=${this.handleDialogSurfaceChange}>
                                ${folders.map((f) => html`<sp-menu-item value="${f}">${f.toUpperCase()}</sp-menu-item>`)}
                            </sp-picker>
                        </div>
                    </div>

                    <sp-field-label size="s" class="product-detail-content">Select a template</sp-field-label>
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
                            ?disabled=${this.creating || selectedVariants.size === 0}
                            @click=${() => this.confirmCreate()}
                        >
                            ${this.creating
                                ? 'Creating...'
                                : `Create ${selectedVariants.size || ''} Fragment${selectedVariants.size !== 1 ? 's' : ''}`}
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }

    renderTemplateCard(v, selectedVariants) {
        const selected = selectedVariants.has(v.name);
        const previewId = this.templatePreviews[v.name];

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
