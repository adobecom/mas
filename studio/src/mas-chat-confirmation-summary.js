import { LitElement, html, nothing } from 'lit';

export class MasChatConfirmationSummary extends LitElement {
    static properties = {
        summary: { type: Object },
        confirmed: { type: Boolean },
    };

    constructor() {
        super();
        this.summary = null;
        this.confirmed = false;
    }

    createRenderRoot() {
        return this;
    }

    handleConfirm() {
        this.dispatchEvent(
            new CustomEvent('confirmation-action', {
                detail: { action: 'confirm' },
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

    render() {
        if (!this.summary) return nothing;

        const { product, variant, segment, offeringType, promoCode, locale } = this.summary;

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
                    ${variant
                        ? html`
                              <div class="summary-row">
                                  <span class="summary-label">Variant</span>
                                  <span class="summary-value">${variant.name}</span>
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
                    <div class="summary-row">
                        <span class="summary-label">Promo Code</span>
                        <span class="summary-value">${promoCode || 'None'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Locale</span>
                        <span class="summary-value">${locale || 'en_US'}</span>
                    </div>
                </div>
                <div class="summary-actions">
                    <sp-button size="s" variant="secondary" ?disabled=${this.confirmed} @click=${this.handleCancel}>
                        Start Over
                    </sp-button>
                    <sp-button size="s" variant="accent" ?disabled=${this.confirmed} @click=${this.handleConfirm}>
                        Create Card
                    </sp-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-confirmation-summary', MasChatConfirmationSummary);
