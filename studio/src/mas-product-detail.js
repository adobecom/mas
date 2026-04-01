import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { executeMCPTool } from './services/mcp-client.js';
import { fetchProductDetail } from './services/product-api.js';
import { showToast } from './utils.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import { EVENT_OST_OFFER_SELECT, PAGE_NAMES, TEMPLATE_PREVIEWS } from './constants.js';
import { getVariantTreeData } from './editors/variant-picker.js';
import { precacheTemplatePreviews } from './utils/template-cache.js';
import { getUserSurfaces } from './groups.js';
import { openOfferSelectorTool, closeOfferSelectorTool } from './rte/ost.js';

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
        pendingCreate: { state: true },
    };

    arrangementCode = new StoreController(this, Store.productDetail.arrangementCode);

    constructor() {
        super();
        this.product = null;
        this.loading = false;
        this.error = null;
        this.createDialog = null;
        this.creating = false;
        this.pendingCreate = null;
        this.loadedCode = null;
        this.handleOfferSelect = this.handleOfferSelect.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.handleOfferSelect);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.handleOfferSelect);
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
            const result = await fetchProductDetail(arrangementCode);
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
        if (this.loading) return this.loadingTemplate;
        if (this.error) return this.errorTemplate;
        if (!this.product) return nothing;
        return html`
            <div class="product-detail">
                ${this.breadcrumbTemplate} ${this.headerTemplate} ${this.copySectionTemplate} ${this.tagsSectionTemplate}
                ${this.detailsSectionTemplate} ${this.linksSectionTemplate} ${this.fulfillableItemsSectionTemplate}
            </div>
            ${this.createDialog ? this.createDialogTemplate : nothing}
            ${this.creating ? this.creatingOverlayTemplate : nothing}
        `;
    }

    get loadingTemplate() {
        return html`<div class="product-detail-loading">
            <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            <p>Loading product details...</p>
        </div>`;
    }

    get errorTemplate() {
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

    get breadcrumbTemplate() {
        return html`<div class="product-detail-breadcrumb">
            <sp-action-button quiet size="s" @click=${() => this.navigateBack()}>
                <sp-icon-chevron-left slot="icon"></sp-icon-chevron-left>
                Product Catalog
            </sp-action-button>
        </div>`;
    }

    get headerTemplate() {
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

    get copySectionTemplate() {
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

    get tagsSectionTemplate() {
        const tags = this.product.copy?.tags;
        if (!tags?.length) return nothing;
        return html`<div class="section">
            <h3 class="section-title">Tags</h3>
            <div class="tags">${tags.map((tag) => html`<sp-badge size="s">${tag}</sp-badge>`)}</div>
        </div>`;
    }

    get detailsSectionTemplate() {
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

    get linksSectionTemplate() {
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

    get fulfillableItemsSectionTemplate() {
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

    get createDialogTemplate() {
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

customElements.define('mas-product-detail', MasProductDetail);
