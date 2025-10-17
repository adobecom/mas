import { LitElement, html, css } from 'lit';
import { ADOBE_PRODUCTS } from '../constants/adobe-products.js';

class RteMnemonicEditor extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        dialog: { type: Boolean, reflect: true },
        imageUrl: { type: String, reflect: true },
        altText: { type: String, reflect: true },
        size: { type: String, reflect: true },
        mnemonicText: { type: String, reflect: true },
        mnemonicPlacement: { type: String, reflect: true },
        selectedTab: { type: String, state: true },
        selectedProductId: { type: String, state: true },
    };

    static get styles() {
        return css`
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
                background: var(--spectrum-gray-100);
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
                border-color: var(--spectrum-global-color-blue-600);
                background-color: var(--spectrum-global-color-blue-50);
                box-shadow: 0 0 0 1px var(--spectrum-global-color-blue-600);
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

            sp-dialog::part(footer) {
                display: flex;
                justify-content: space-between;
                padding-top: 16px;
                border-top: 1px solid var(--spectrum-gray-200);
            }

            sp-button[slot='button'][variant='secondary'] {
                margin-right: auto;
            }

            sp-button[slot='button'][variant='accent'] {
                margin-left: auto;
            }
        `;
    }

    constructor() {
        super();
        this.dialog = false;
        this.open = false;
        this.imageUrl = '';
        this.altText = '';
        this.size = 'xs';
        this.mnemonicText = '';
        this.mnemonicPlacement = 'top';
        this.selectedTab = 'product-icon';
        this.selectedProductId = null;

        this.addEventListener('change', (e) => {
            e.stopImmediatePropagation();
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.#initializeFromIcon();
    }

    updated(changedProperties) {
        if (changedProperties.has('imageUrl')) {
            this.#initializeFromIcon();
        }
        if (changedProperties.has('altText') && this.altTextInput) {
            this.altTextInput.value = this.altText;
        }
        if (changedProperties.has('size') && this.sizeSelect) {
            this.sizeSelect.value = this.size;
        }
        if (changedProperties.has('mnemonicText') && this.mnemonicTextInput) {
            this.mnemonicTextInput.value = this.mnemonicText;
        }
        if (changedProperties.has('mnemonicPlacement') && this.mnemonicPlacementSelect) {
            this.mnemonicPlacementSelect.value = this.mnemonicPlacement;
        }
    }

    firstUpdated() {
        this.#updateInputReferences();
    }

    #updateInputReferences() {
        this.altTextInput = this.shadowRoot.querySelector('#altText, #product-alt');
        this.sizeSelect = this.shadowRoot.querySelector('#size');
        this.mnemonicTextInput = this.shadowRoot.querySelector('#mnemonicText');
        this.mnemonicPlacementSelect = this.shadowRoot.querySelector('#mnemonicPlacement');
        this.customUrlInput = this.shadowRoot.querySelector('#url-icon');
    }

    #initializeFromIcon() {
        if (this.imageUrl && this.imageUrl.includes('/product-icons/svg/')) {
            const match = this.imageUrl.match(/\/([^/]+)\.svg$/);
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
        if (this.imageUrl) {
            this.selectedTab = 'url';
        }
        this.selectedProductId = null;
    }

    #handleTabChange(e) {
        this.selectedTab = e.currentTarget.selected;
        this.requestUpdate();
        setTimeout(() => this.#updateInputReferences(), 0);
    }

    #handleProductSelect(productId) {
        this.selectedProductId = productId;
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: false, composed: true }));
    }

    #handleSubmit(e) {
        e.preventDefault();

        let imageUrl;

        if (this.selectedTab === 'product-icon') {
            if (this.selectedProductId) {
                imageUrl = `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${this.selectedProductId}.svg`;
            } else {
                return;
            }
        } else {
            imageUrl = this.customUrlInput?.value || this.imageUrl;
        }

        if (!imageUrl?.trim()) {
            return;
        }

        const altText = this.altTextInput?.value || this.altText || '';
        const size = this.sizeSelect?.value || this.size || 'xs';
        const mnemonicText = this.mnemonicTextInput?.value || this.mnemonicText || '';
        const mnemonicPlacement = this.mnemonicPlacementSelect?.value || this.mnemonicPlacement || 'top';

        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    imageUrl,
                    altText,
                    size,
                    mnemonicText,
                    mnemonicPlacement,
                },
            }),
        );

        this.#handleClose();
    }

    get productIconTab() {
        return html`
            <div class="tab-content">
                <div class="icon-grid">
                    ${ADOBE_PRODUCTS.map(
                        (product) => html`
                            <div
                                class="icon-item ${this.selectedProductId === product.id ? 'selected' : ''}"
                                @click=${() => this.#handleProductSelect(product.id)}
                            >
                                <img
                                    src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${product.id}.svg"
                                    alt="${product.name}"
                                    @error=${(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <span>${product.name}</span>
                            </div>
                        `,
                    )}
                </div>

                <div class="form-field">
                    <sp-field-label for="product-alt">Alt Text</sp-field-label>
                    <sp-textfield
                        id="product-alt"
                        placeholder="Descriptive text for accessibility"
                        value="${this.altText}"
                        @input=${(e) => {
                            this.altText = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="size">Size</sp-field-label>
                    <sp-picker id="size" .value=${this.size}>
                        <sp-menu-item value="xs">Extra Small</sp-menu-item>
                        <sp-menu-item value="s">Small</sp-menu-item>
                        <sp-menu-item value="m">Medium</sp-menu-item>
                        <sp-menu-item value="l">Large</sp-menu-item>
                    </sp-picker>
                </div>

                <div class="form-field">
                    <sp-field-label for="mnemonicText">Mnemonic Text</sp-field-label>
                    <sp-textfield
                        id="mnemonicText"
                        placeholder="Enter mnemonic text (optional)"
                        .value=${this.mnemonicText}
                        @input=${(e) => {
                            this.mnemonicText = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="mnemonicPlacement">Mnemonic Placement</sp-field-label>
                    <sp-picker id="mnemonicPlacement" .value=${this.mnemonicPlacement}>
                        <sp-menu-item value="top">Top</sp-menu-item>
                        <sp-menu-item value="bottom">Bottom</sp-menu-item>
                        <sp-menu-item value="left">Left</sp-menu-item>
                        <sp-menu-item value="right">Right</sp-menu-item>
                        <sp-menu-item value="top-start">Top Start</sp-menu-item>
                        <sp-menu-item value="top-end">Top End</sp-menu-item>
                        <sp-menu-item value="bottom-start">Bottom Start</sp-menu-item>
                        <sp-menu-item value="bottom-end">Bottom End</sp-menu-item>
                        <sp-menu-item value="left-start">Left Start</sp-menu-item>
                        <sp-menu-item value="left-end">Left End</sp-menu-item>
                        <sp-menu-item value="right-start">Right Start</sp-menu-item>
                        <sp-menu-item value="right-end">Right End</sp-menu-item>
                    </sp-picker>
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
                        value="${this.imageUrl}"
                        @input=${(e) => {
                            this.imageUrl = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="altText">Alt Text</sp-field-label>
                    <sp-textfield
                        id="altText"
                        placeholder="Descriptive text for accessibility"
                        .value=${this.altText}
                        @input=${(e) => {
                            this.altText = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="size">Size</sp-field-label>
                    <sp-picker id="size" .value=${this.size}>
                        <sp-menu-item value="xs">Extra Small</sp-menu-item>
                        <sp-menu-item value="s">Small</sp-menu-item>
                        <sp-menu-item value="m">Medium</sp-menu-item>
                        <sp-menu-item value="l">Large</sp-menu-item>
                    </sp-picker>
                </div>

                <div class="form-field">
                    <sp-field-label for="mnemonicText">Mnemonic Text</sp-field-label>
                    <sp-textfield
                        id="mnemonicText"
                        placeholder="Enter mnemonic text (optional)"
                        .value=${this.mnemonicText}
                        @input=${(e) => {
                            this.mnemonicText = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="mnemonicPlacement">Mnemonic Placement</sp-field-label>
                    <sp-picker id="mnemonicPlacement" .value=${this.mnemonicPlacement}>
                        <sp-menu-item value="top">Top</sp-menu-item>
                        <sp-menu-item value="bottom">Bottom</sp-menu-item>
                        <sp-menu-item value="left">Left</sp-menu-item>
                        <sp-menu-item value="right">Right</sp-menu-item>
                        <sp-menu-item value="top-start">Top Start</sp-menu-item>
                        <sp-menu-item value="top-end">Top End</sp-menu-item>
                        <sp-menu-item value="bottom-start">Bottom Start</sp-menu-item>
                        <sp-menu-item value="bottom-end">Bottom End</sp-menu-item>
                        <sp-menu-item value="left-start">Left Start</sp-menu-item>
                        <sp-menu-item value="left-end">Left End</sp-menu-item>
                        <sp-menu-item value="right-start">Right Start</sp-menu-item>
                        <sp-menu-item value="right-end">Right End</sp-menu-item>
                    </sp-picker>
                </div>
            </div>
        `;
    }

    get #editor() {
        const isEditing = !!this.imageUrl;
        return html`
            <sp-dialog close=${this.#handleClose}>
                <h2 slot="heading">${isEditing ? 'Edit' : 'Add'} Inline Mnemonic</h2>

                <form @submit=${this.#handleSubmit}>
                    <sp-tabs selected="${this.selectedTab}" @change=${this.#handleTabChange}>
                        <sp-tab value="product-icon">Product Icon</sp-tab>
                        <sp-tab value="url">Custom URL</sp-tab>
                        <sp-tab-panel value="product-icon"> ${this.productIconTab} </sp-tab-panel>
                        <sp-tab-panel value="url"> ${this.urlTab} </sp-tab-panel>
                    </sp-tabs>
                </form>

                <sp-button
                    id="cancelButton"
                    slot="button"
                    variant="secondary"
                    treatment="outline"
                    @click=${this.#handleClose}
                    type="button"
                >
                    Cancel
                </sp-button>
                <sp-button id="saveButton" slot="button" variant="accent" @click=${this.#handleSubmit}>
                    ${isEditing ? 'Update' : 'Add'} Icon
                </sp-button>
            </sp-dialog>
        `;
    }

    get #asDialog() {
        return html`
            <sp-underlay ?open=${this.open}></sp-underlay>
            ${this.#editor}
        `;
    }

    render() {
        if (this.dialog) return this.#asDialog;
        return this.#editor;
    }
}

customElements.define('rte-mnemonic-editor', RteMnemonicEditor);
