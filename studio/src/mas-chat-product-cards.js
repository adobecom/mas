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
                detail: { value: product.value, label: product.label, product },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleCardKeydown(event, product) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.handleSelect(product);
    }

    getProductPills(product) {
        const pills = [];

        if (product.product_family) {
            pills.push({
                label: product.product_family,
                kind: 'family',
            });
        }

        const primarySegment = product.segments?.[0];
        if (primarySegment) {
            pills.push({
                label: primarySegment,
                kind: 'segment',
            });
        }

        return pills.slice(0, 2);
    }

    render() {
        if (!this.products?.length) return nothing;

        return html`
            <div class="chat-product-cards">
                ${this.products.map((product) => {
                    const isSelected = this.selectedValue === product.value;
                    const isDisabled = this.disabled || (this.selectedValue && !isSelected);
                    const pills = this.getProductPills(product);
                    return html`
                        <div
                            class="product-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                            role="button"
                            tabindex=${isDisabled ? '-1' : '0'}
                            aria-pressed=${isSelected ? 'true' : 'false'}
                            aria-disabled=${isDisabled ? 'true' : 'false'}
                            @click=${() => this.handleSelect(product)}
                            @keydown=${(event) => this.handleCardKeydown(event, product)}
                        >
                            <div class="product-card-main">
                                ${product.icon
                                    ? html`<img
                                          class="product-icon"
                                          src="${product.icon}"
                                          alt="${product.label}"
                                          width="40"
                                          height="40"
                                      />`
                                    : nothing}
                                <div class="product-card-copy">
                                    <strong class="product-title">${product.label}</strong>
                                    <span class="product-code">${product.arrangement_code}</span>
                                    ${pills.length
                                        ? html`
                                              <div class="product-card-details">
                                                  ${pills.map(
                                                      (pill) => html`
                                                          <sp-tag size="s" class="product-pill product-pill-${pill.kind}">
                                                              ${pill.label}
                                                          </sp-tag>
                                                      `,
                                                  )}
                                              </div>
                                          `
                                        : nothing}
                                </div>
                                <div class="product-card-affordance">
                                    <sp-icon-chevron-right></sp-icon-chevron-right>
                                    <span>${isSelected ? 'Selected' : 'Select'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                })}
            </div>
        `;
    }
}

customElements.define('mas-chat-product-cards', MasChatProductCards);
