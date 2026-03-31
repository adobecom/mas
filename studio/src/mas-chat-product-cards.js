import { LitElement, html, nothing } from 'lit';

export class MasChatProductCards extends LitElement {
    static properties = {
        products: { type: Array },
        selectedValue: { type: String, attribute: 'selected-value' },
        disabled: { type: Boolean },
    };

    constructor() {
        super();
        this.products = [];
        this.selectedValue = null;
        this.disabled = false;
    }

    createRenderRoot() {
        return this;
    }

    handleSelect(product) {
        if (this.selectedValue || this.disabled) return;
        this.selectedValue = product.value;
        this.dispatchEvent(
            new CustomEvent('button-selected', {
                detail: { value: product.value, label: product.label },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        if (!this.products?.length) return nothing;

        return html`
            <div class="chat-product-cards">
                ${this.products.map((product) => {
                    const isSelected = this.selectedValue === product.value;
                    const isDisabled = this.disabled || (this.selectedValue && !isSelected);
                    return html`
                        <div class="product-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}">
                            <div class="product-card-header">
                                ${product.icon
                                    ? html`<img
                                          class="product-icon"
                                          src="${product.icon}"
                                          alt="${product.label}"
                                          width="32"
                                          height="32"
                                      />`
                                    : nothing}
                                <div class="product-card-title">
                                    <strong>${product.label}</strong>
                                    <span class="product-code">${product.arrangement_code}</span>
                                </div>
                            </div>
                            <div class="product-card-details">
                                ${product.product_code ? html`<sp-badge size="s">${product.product_code}</sp-badge>` : nothing}
                                ${product.product_family
                                    ? html`<sp-badge size="s" variant="informative">${product.product_family}</sp-badge>`
                                    : nothing}
                                ${product.segments?.map((seg) => html`<sp-badge size="s" variant="positive">${seg}</sp-badge>`)}
                            </div>
                            <sp-button
                                size="s"
                                variant=${isSelected ? 'accent' : 'primary'}
                                ?disabled=${isDisabled}
                                @click=${() => this.handleSelect(product)}
                            >
                                ${isSelected ? 'Selected' : 'Select'}
                            </sp-button>
                        </div>
                    `;
                })}
            </div>
        `;
    }
}

customElements.define('mas-chat-product-cards', MasChatProductCards);
