import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { executeMCPTool } from './services/mcp-client.js';
import { showToast } from './utils.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import { PAGE_NAMES } from './constants.js';
import { getVariantTreeData } from './editors/variant-picker.js';
import { getUserSurfaces } from './groups.js';

class MasProductDetail extends LitElement {
    createRenderRoot() {
        return this;
    }

    static properties = {
        product: { state: true },
        loading: { state: true },
        error: { state: true },
        createDialog: { state: true },
        creating: { state: true },
    };

    arrangementCode = new StoreController(this, Store.productDetail.arrangementCode);

    constructor() {
        super();
        this.product = null;
        this.loading = false;
        this.error = null;
        this.createDialog = null;
        this.creating = false;
        this.loadedCode = null;
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        const code = this.arrangementCode.value;
        if (code && code !== this.loadedCode) {
            this.loadProduct(code);
        }
    }

    async loadProduct(arrangementCode) {
        this.loadedCode = arrangementCode;
        this.loading = true;
        this.error = null;
        this.product = null;
        try {
            const result = await executeMCPTool('get-product-detail', { arrangementCode });
            this.product = result.product;
        } catch (e) {
            console.error('Failed to load product detail:', e);
            this.error = e.message;
        } finally {
            this.loading = false;
        }
    }

    navigateBack() {
        Store.productDetail.arrangementCode.set(null);
        Store.page.set(PAGE_NAMES.PRODUCT_CATALOG);
    }

    openCreateDialog() {
        const surfaces = getUserSurfaces();
        const surface = surfaces[0] || 'sandbox';
        const locale = Store.filters?.value?.locale || 'en_US';
        this.createDialog = {
            product: this.product,
            surface,
            locale,
            selectedVariants: new Set(),
            previewsLoaded: false,
        };
        this.precacheTemplatePreviews(surface);
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
        if (this.loading) return this.renderLoading();
        if (this.error) return this.renderError();
        if (!this.product) return nothing;
        return html`
            <div class="product-detail">
                ${this.renderBreadcrumb()} ${this.renderHeader()} ${this.renderCopySection()} ${this.renderTagsSection()}
                ${this.renderDetailsSection()} ${this.renderLinksSection()} ${this.renderFulfillableItemsSection()}
            </div>
            ${this.createDialog ? this.renderCreateDialog() : nothing}
        `;
    }

    renderLoading() {
        return html`<div class="product-detail-loading">
            <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            <p>Loading product details...</p>
        </div>`;
    }

    renderError() {
        return html`<div class="product-detail-error">
            <sp-icon-alert size="l"></sp-icon-alert>
            <p>${this.error}</p>
            <sp-button
                @click=${() => {
                    this.loadedCode = null;
                    this.loadProduct(this.arrangementCode.value);
                }}
                >Retry</sp-button
            >
        </div>`;
    }

    renderBreadcrumb() {
        return html`<div class="product-detail-breadcrumb">
            <sp-action-button quiet size="s" @click=${() => this.navigateBack()}>
                <sp-icon-chevron-left slot="icon"></sp-icon-chevron-left>
                Product Catalog
            </sp-action-button>
        </div>`;
    }

    renderHeader() {
        const { name, icon, arrangement_code } = this.product;
        return html`<div class="product-detail-header">
            ${icon ? html`<img src="${icon}" alt="${name}" width="48" height="48" />` : nothing}
            <div class="product-detail-title">
                <h2>${name || arrangement_code}</h2>
                <code>${arrangement_code}</code>
            </div>
            <div class="spacer"></div>
            <sp-button variant="accent" @click=${() => this.openCreateDialog()}>
                <sp-icon-add slot="icon"></sp-icon-add>
                Create Fragment
            </sp-button>
        </div>`;
    }

    renderCopySection() {
        const { copy } = this.product;
        if (!copy?.name && !copy?.description && !copy?.short_description) return nothing;
        return html`<div class="section">
            <h3 class="section-title">Marketing Copy</h3>
            <div class="detail-grid">
                ${copy.name ? this.renderField('Name', copy.name) : nothing}
                ${copy.description ? this.renderField('Description', copy.description) : nothing}
                ${copy.short_description ? this.renderField('Short Description', copy.short_description) : nothing}
            </div>
        </div>`;
    }

    renderTagsSection() {
        const tags = this.product.copy?.tags;
        if (!tags?.length) return nothing;
        return html`<div class="section">
            <h3 class="section-title">Tags</h3>
            <div class="tags">${tags.map((tag) => html`<sp-badge size="s">${tag}</sp-badge>`)}</div>
        </div>`;
    }

    renderDetailsSection() {
        const { product_code, product_family, customer_segment, market_segments } = this.product;
        return html`<div class="section">
            <h3 class="section-title">Product Details</h3>
            <div class="detail-grid">
                ${product_code ? this.renderField('Product Code', product_code) : nothing}
                ${product_family ? this.renderField('Product Family', product_family) : nothing}
                ${customer_segment ? this.renderField('Customer Segment', customer_segment) : nothing}
                ${market_segments?.length ? this.renderField('Market Segments', market_segments.join(', ')) : nothing}
            </div>
        </div>`;
    }

    renderLinksSection() {
        const { links } = this.product;
        if (!links) return nothing;
        const entries = Object.entries(links).filter(([, items]) => Array.isArray(items) && items.length);
        if (!entries.length) return nothing;
        return html`<div class="section">
            <h3 class="section-title">Links</h3>
            <div class="detail-grid">
                ${entries.map(
                    ([key, items]) =>
                        html`<div class="detail-field">
                            <label>${key.replace(/_/g, ' ')}</label>
                            <div class="value">
                                ${items.map(
                                    (link) =>
                                        html`<a href="${link.href}" target="_blank" rel="noopener"
                                            >${link.text || link.href}</a
                                        >`,
                                )}
                            </div>
                        </div>`,
                )}
            </div>
        </div>`;
    }

    renderFulfillableItemsSection() {
        const items = this.product.fulfillable_items;
        if (!items?.length) return nothing;
        return html`<div class="section">
            <h3 class="section-title">Fulfillable Items</h3>
            ${repeat(
                items,
                (item, i) => i,
                (item) =>
                    html`<div class="fulfillable-item">
                        <strong>${item.copy?.name || 'Unnamed Item'}</strong>
                        ${item.copy?.description ? html`<p>${item.copy.description}</p>` : nothing}
                    </div>`,
            )}
        </div>`;
    }

    renderField(label, value) {
        return html`<div class="detail-field">
            <label>${label}</label>
            <div class="value">${value}</div>
        </div>`;
    }

    renderCreateDialog() {
        const { product, surface, selectedVariants } = this.createDialog;
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

customElements.define('mas-product-detail', MasProductDetail);
