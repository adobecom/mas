import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { getVariantTreeData } from './editors/variant-picker.js';
import { TEMPLATE_PREVIEWS } from './constants.js';
import { precacheTemplatePreviews } from './utils/template-cache.js';

export class MasChatConfirmationSummary extends LitElement {
    static properties = {
        summary: { type: Object },
        confirmed: { type: Boolean },
        surface: { type: String },
        selectedVariants: { state: true },
        previewsLoaded: { state: true },
        showTemplateDialog: { state: true },
    };

    constructor() {
        super();
        this.summary = null;
        this.confirmed = false;
        this.surface = '';
        this.selectedVariants = new Set();
        this.previewsLoaded = false;
        this.showTemplateDialog = false;
    }

    createRenderRoot() {
        return this;
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('surface') && this.surface) {
            this.loadPreviews();
        }
        if (changedProperties.has('summary') && this.summary?.variant) {
            this.selectedVariants = new Set([this.summary.variant.name]);
        }
    }

    async loadPreviews() {
        this.previewsLoaded = false;
        await precacheTemplatePreviews(this.surface);
        this.previewsLoaded = true;
    }

    toggleVariant(name) {
        const next = new Set(this.selectedVariants);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        this.selectedVariants = next;
    }

    openTemplateDialog() {
        this.showTemplateDialog = true;
    }

    closeTemplateDialog() {
        this.showTemplateDialog = false;
    }

    handleConfirm() {
        this.closeTemplateDialog();
        this.dispatchEvent(
            new CustomEvent('confirmation-action', {
                detail: {
                    action: 'confirm',
                    selectedVariants: [...this.selectedVariants],
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleCancel() {
        this.dispatchEvent(
            new CustomEvent('confirmation-action', {
                detail: { action: 'start-over' },
                bubbles: true,
                composed: true,
            }),
        );
    }

    getProductDescription(product) {
        const candidates = [
            product?.description,
            product?.shortDescription,
            product?.short_description,
            product?.copy?.description,
            product?.copy?.shortDescription,
            product?.copy?.short_description,
        ]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean);

        return candidates.sort((left, right) => right.length - left.length)[0] || '';
    }

    renderTemplateCard(v) {
        const selected = this.selectedVariants.has(v.name);
        const previewId = TEMPLATE_PREVIEWS[v.name];
        const AemFragmentElement = customElements.get('aem-fragment');
        const isCached = previewId && this.previewsLoaded && AemFragmentElement?.cache?.has(previewId);

        return html`
            <div class="template-card ${selected ? 'selected' : ''}" @click=${() => this.toggleVariant(v.name)}>
                <div class="template-preview">
                    ${isCached
                        ? html`<merch-card><aem-fragment author fragment="${previewId}"></aem-fragment></merch-card>`
                        : html`<div class="template-placeholder">${v.label}</div>`}
                </div>
                <div class="template-label">${v.label}</div>
            </div>
        `;
    }

    get templateDialog() {
        if (!this.showTemplateDialog) return nothing;
        const variants = getVariantTreeData(this.surface);
        return html`
            <div class="dialog-backdrop" @click=${() => this.closeTemplateDialog()}>
                <div class="create-dialog" @click=${(e) => e.stopPropagation()}>
                    <div class="create-dialog-top">
                        <h3 class="create-dialog-title">Select Templates</h3>
                        <sp-action-button quiet @click=${() => this.closeTemplateDialog()}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>
                    </div>
                    <div class="template-grid">
                        ${!this.previewsLoaded
                            ? html`<div class="template-loading">
                                  <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                              </div>`
                            : nothing}
                        ${repeat(
                            variants,
                            (v) => v.name,
                            (v) => this.renderTemplateCard(v),
                        )}
                    </div>
                    <div class="dialog-footer">
                        <sp-button variant="secondary" @click=${() => this.closeTemplateDialog()}>Cancel</sp-button>
                        <sp-button
                            variant="accent"
                            ?disabled=${this.selectedVariants.size === 0}
                            @click=${() => this.handleConfirm()}
                        >
                            Confirm
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.summary) return nothing;

        const { product, segment, offeringType, locale, osi, trialOsi } = this.summary;
        const productDescription = this.getProductDescription(product);
        const variantCount = this.selectedVariants.size;

        return html`
            <div class="chat-confirmation-summary">
                <div class="summary-header">Card Configuration</div>
                <div class="summary-rows">
                    <div class="summary-row">
                        <span class="summary-label">Product</span>
                        <span class="summary-value">
                            ${product?.icon ? html`<img src="${product.icon}" alt="" class="summary-product-icon" />` : nothing}
                            ${product?.name || 'Unknown'}
                        </span>
                    </div>
                    ${productDescription
                        ? html`
                              <div class="summary-description-row">
                                  <span class="summary-label">Description</span>
                                  <div class="summary-description">${productDescription}</div>
                              </div>
                          `
                        : nothing}
                    <div class="summary-row">
                        <span class="summary-label">Segment</span>
                        <span class="summary-value">${segment?.label || 'Unknown'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Offering</span>
                        <span class="summary-value">${offeringType?.label || 'Unknown'}</span>
                    </div>
                    ${osi
                        ? html`
                              <div class="summary-row">
                                  <span class="summary-label">Base offer</span>
                                  <span class="summary-value"><code>${osi}</code></span>
                              </div>
                          `
                        : nothing}
                    <div class="summary-row">
                        <span class="summary-label">Trial offer</span>
                        <span class="summary-value">
                            ${trialOsi ? html`<code>${trialOsi}</code>` : html`<em>None — Free trial CTA will be hidden</em>`}
                        </span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Locale</span>
                        <span class="summary-value">${locale || 'en_US'}</span>
                    </div>
                </div>
                ${this.surface
                    ? html`
                          <div class="summary-template-action">
                              <sp-button variant="accent" ?disabled=${this.confirmed} @click=${() => this.openTemplateDialog()}>
                                  <sp-icon-preview slot="icon"></sp-icon-preview>
                                  Select template
                                  ${this.selectedVariants.size > 0
                                      ? html`<sp-badge slot="label" size="s">${this.selectedVariants.size}</sp-badge>`
                                      : nothing}
                              </sp-button>
                          </div>
                          ${this.templateDialog}
                      `
                    : nothing}
                <div class="summary-actions">
                    <sp-button size="s" variant="secondary" ?disabled=${this.confirmed} @click=${this.handleCancel}>
                        Start Over
                    </sp-button>
                    <sp-button
                        size="s"
                        variant="accent"
                        ?disabled=${this.confirmed || variantCount === 0}
                        @click=${this.handleConfirm}
                    >
                        Create Card${variantCount !== 1 ? 's' : ''} (${variantCount})
                    </sp-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-confirmation-summary', MasChatConfirmationSummary);
