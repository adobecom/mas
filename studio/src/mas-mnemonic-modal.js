import { LitElement, html, css } from 'lit';
import { ADOBE_PRODUCTS } from './constants/adobe-products.js';
import { ICON_LIBRARY, renderSpIcon } from './constants/icon-library.js';

class MasMnemonicModal extends LitElement {
    #originalIcon = '';
    #originalAlt = '';
    #originalLink = '';

    static properties = {
        open: { type: Boolean, reflect: true },
        icon: { type: String },
        alt: { type: String },
        link: { type: String },
        selectedTab: { type: String, state: true },
        selectedProductId: { type: String, state: true },
        iconLibrary: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            display: contents;
        }

        sp-underlay:not([open]) + sp-dialog {
            display: none;
        }

        sp-underlay + sp-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
            background: var(--spectrum-white);
            border-radius: 16px;
        }

        sp-dialog {
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
        }

        .tab-content {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 8px;
            margin-bottom: 24px;
            max-height: 360px;
            overflow-y: auto;
            padding: 12px;
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 4px;
            background: var(--spectrum-gray-50);
            min-height: fit-content;
        }

        .icon-grid::-webkit-scrollbar {
            width: 8px;
        }

        .icon-grid::-webkit-scrollbar-track {
            background: var(--spectrum-gray-100);
            border-radius: 4px;
        }

        .icon-grid::-webkit-scrollbar-thumb {
            background: var(--spectrum-gray-400);
            border-radius: 4px;
        }

        .icon-grid::-webkit-scrollbar-thumb:hover {
            background: var(--spectrum-gray-500);
        }

        .icon-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 4px;
            border: 2px solid var(--spectrum-gray-200);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
            min-height: 60px;
        }

        .icon-item:hover {
            background-color: var(--spectrum-gray-100);
            border-color: var(--spectrum-gray-400);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .icon-item.selected {
            border-color: var(--spectrum-blue-600);
            background-color: var(--spectrum-blue-50);
            box-shadow: 0 0 0 1px var(--spectrum-blue-600);
        }

        .icon-item img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-bottom: 4px;
        }

        .icon-item span {
            font-size: 10px;
            text-align: center;
            line-height: 1.2;
            word-break: break-word;
            color: var(--spectrum-gray-800);
            font-weight: 500;
        }

        .form-field {
            margin-bottom: 20px;
        }

        .form-field sp-textfield {
            width: 100%;
        }

        .form-field sp-field-label {
            margin-bottom: 8px;
            display: block;
        }

        sp-tabs {
            width: 100%;
        }

        sp-tab-panel {
            width: 100%;
        }

        sp-dialog {
            --spectrum-dialog-footer-display: flex;
            --spectrum-dialog-footer-justify-content: space-between;
            --spectrum-dialog-footer-padding-top: 16px;
            --spectrum-dialog-footer-border-top: 1px solid var(--spectrum-gray-200);
        }

        sp-dialog.icon-library .icon-lib-optional {
            display: none;
        }

        sp-button[slot='button'][variant='secondary'] {
            margin-right: auto;
        }

        sp-button[slot='button'][variant='accent'] {
            margin-left: auto;
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.icon = '';
        this.alt = '';
        this.link = '';
        this.selectedTab = 'product-icon';
        this.selectedProductId = null;
        this.icons = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this.icons = this.iconLibrary ? ICON_LIBRARY : ADOBE_PRODUCTS;
        this.#initializeFromIcon();
    }

    #storeOriginalValues() {
        this.#originalIcon = this.icon;
        this.#originalAlt = this.alt;
        this.#originalLink = this.link;
    }

    updated(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.#storeOriginalValues();
            this.#initializeFromIcon();
        }
    }

    #initializeFromIcon() {
        if (this.icon) {
            if (this.iconLibrary && this.icon.startsWith('sp-icon-')) {
                this.selectedProductId = this.icon;
                this.selectedTab = 'product-icon';
                return;
            } else if (!this.iconLibrary && this.icon.includes('/product-icons/svg/')) {
                const match = this.icon.match(/\/([^/]+)\.svg$/);
                if (match) {
                    const productId = match[1];
                    const product = ADOBE_PRODUCTS.find((p) => p.id === productId);
                    if (product) {
                        this.selectedProductId = productId;
                        this.selectedTab = 'product-icon';
                        return;
                    }
                }
            }
        }
        this.selectedProductId = null;
        if (this.icon) {
            this.selectedTab = 'url';
        }
    }

    #handleTabChange(e) {
        if (e.target.nodeName !== 'SP-TABS') return;
        this.selectedTab = e.currentTarget.selected;

        if (this.selectedTab === 'product-icon') {
            this.#syncProductIconFromUrl();
        }
    }

    #syncProductIconFromUrl() {
        if (this.icon && this.icon.includes('/product-icons/svg/')) {
            const match = this.icon.match(/\/([^/]+)\.svg$/);
            if (match) {
                const productId = match[1];
                const product = ADOBE_PRODUCTS.find((p) => p.id === productId);
                if (product) {
                    this.selectedProductId = productId;
                }
            }
        }
    }

    #handleProductSelect(productId) {
        this.selectedProductId = productId;
        this.icon = this.iconLibrary
            ? productId
            : `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${productId}.svg`;
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    }

    #handleCancel() {
        this.icon = this.#originalIcon;
        this.alt = this.#originalAlt;
        this.link = this.#originalLink;
        this.#handleClose();
    }

    #handleSubmit(e) {
        e.preventDefault();

        let iconValue;

        if (this.selectedTab === 'product-icon') {
            if (this.selectedProductId) {
                if (this.iconLibrary) {
                    iconValue = this.selectedProductId;
                } else {
                    iconValue = `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${this.selectedProductId}.svg`;
                }
            } else {
                iconValue = '';
            }
        } else {
            iconValue = this.icon || '';
        }

        if (!iconValue.trim()) {
            return;
        }

        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    icon: iconValue,
                    alt: this.alt || '',
                    link: this.link || '',
                },
            }),
        );

        this.#handleClose();
    }

    get productIconTab() {
        return html`
            <div class="tab-content">
                <div class="icon-grid">
                    ${this.icons.map(
                        (product) => html`
                            <div
                                class="icon-item ${this.selectedProductId === product.id ? 'selected' : ''}"
                                @click=${() => this.#handleProductSelect(product.id)}
                            >
                                ${this.iconLibrary
                                    ? html`${renderSpIcon(product.id)}`
                                    : html` <img
                                          src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${product.id}.svg"
                                          alt="${product.name}"
                                          @error=${(e) => {
                                              e.target.style.display = 'none';
                                          }}
                                      />`}
                                <span>${product.name}</span>
                            </div>
                        `,
                    )}
                </div>

                <div class="form-field icon-lib-optional">
                    <sp-field-label for="product-alt">Alt Text</sp-field-label>
                    <sp-textfield
                        id="product-alt"
                        placeholder="Descriptive text for accessibility"
                        value="${this.alt}"
                        @input=${(e) => (this.alt = e.target.value)}
                    ></sp-textfield>
                </div>

                <div class="form-field icon-lib-optional">
                    <sp-field-label for="product-link">Link URL</sp-field-label>
                    <sp-textfield
                        id="product-link"
                        placeholder="https://example.com"
                        value="${this.link}"
                        @input=${(e) => (this.link = e.target.value)}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }

    get urlTab() {
        return html`
            <div class="tab-content">
                <div class="form-field">
                    <sp-field-label for="url-icon" required>Icon URL</sp-field-label>
                    <sp-textfield
                        id="url-icon"
                        required
                        placeholder="https://example.com/icon.svg"
                        value="${!this.icon?.startsWith('sp-icon-') ? this.icon : ''}"
                        @input=${(e) => (this.icon = e.target.value)}
                    ></sp-textfield>
                </div>

                <div class="form-field icon-lib-optional">
                    <sp-field-label for="url-alt">Alt Text</sp-field-label>
                    <sp-textfield
                        id="url-alt"
                        placeholder="Descriptive text for accessibility"
                        value="${this.alt}"
                        @input=${(e) => (this.alt = e.target.value)}
                    ></sp-textfield>
                </div>

                <div class="form-field icon-lib-optional">
                    <sp-field-label for="url-link">Link URL</sp-field-label>
                    <sp-textfield
                        id="url-link"
                        placeholder="https://example.com"
                        value="${this.link}"
                        @input=${(e) => (this.link = e.target.value)}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }

    render() {
        const isEditing = !!this.icon;

        return html`
            <div @input=${(e) => e.stopPropagation()} @change=${(e) => e.stopPropagation()}>
                <sp-underlay ?open=${this.open}></sp-underlay>
                <sp-dialog class="${this.iconLibrary ? 'icon-library' : ''}">
                    <h2 slot="heading">${isEditing ? 'Edit' : 'Add'} ${this.iconLibrary ? '' : 'Mnemonic '}Icon</h2>

                    <form @submit=${this.#handleSubmit}>
                        <sp-tabs selected="${this.selectedTab}" @change=${this.#handleTabChange}>
                            <sp-tab value="product-icon">Product Icon</sp-tab>
                            <sp-tab value="url">URL</sp-tab>
                            <sp-tab-panel value="product-icon"> ${this.productIconTab} </sp-tab-panel>
                            <sp-tab-panel value="url"> ${this.urlTab} </sp-tab-panel>
                        </sp-tabs>
                    </form>

                    <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.#handleCancel} type="button">
                        Cancel
                    </sp-button>
                    <sp-button slot="button" variant="accent" @click=${this.#handleSubmit}>
                        ${isEditing ? 'Update' : 'Add'} Icon
                    </sp-button>
                </sp-dialog>
            </div>
        `;
    }
}

customElements.define('mas-mnemonic-modal', MasMnemonicModal);
