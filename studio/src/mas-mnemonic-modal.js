import { LitElement, html, css } from 'lit';

const ADOBE_PRODUCTS = [
    { id: 'creative-cloud', name: 'Creative Cloud' },
    { id: 'photoshop', name: 'Photoshop' },
    { id: 'lightroom', name: 'Lightroom' },
    { id: 'illustrator', name: 'Illustrator' },
    { id: 'indesign', name: 'InDesign' },
    { id: 'premiere-pro', name: 'Premiere Pro' },
    { id: 'after-effects', name: 'After Effects' },
    { id: 'acrobat-pro', name: 'Acrobat Pro' },
    { id: 'dreamweaver', name: 'Dreamweaver' },
    { id: 'animate', name: 'Animate' },
    { id: 'audition', name: 'Audition' },
    { id: 'bridge', name: 'Bridge' },
    { id: 'character-animator', name: 'Character Animator' },
    { id: 'dimension', name: 'Dimension' },
    { id: 'xd', name: 'XD' },
    { id: 'firefly', name: 'Firefly' },
    { id: 'cc-express', name: 'Adobe Express' },
    { id: 'fresco', name: 'Fresco' },
    { id: 'aero', name: 'Aero' },
    { id: 'substance-3d-modeler', name: 'Substance 3D Modeler' },
    { id: 'substance-3d-stager', name: 'Substance 3D Stager' },
    { id: 'substance-3d-painter', name: 'Substance 3D Painter' },
    { id: 'substance-3d-sampler', name: 'Substance 3D Sampler' },
    { id: 'substance-3d-designer', name: 'Substance 3D Designer' },
    { id: 'substance-3d-assets', name: 'Substance 3D Assets' },
    { id: 'stock', name: 'Stock' },
    { id: 'fonts', name: 'Fonts' },
    { id: 'color', name: 'Color' },
    { id: 'capture', name: 'Capture' },
    { id: 'incopy', name: 'InCopy' },
];

class MasMnemonicModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        icon: { type: String },
        alt: { type: String },
        link: { type: String },
        selectedTab: { type: String, state: true },
        selectedProductId: { type: String, state: true },
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
            z-index: 1;
            background: var(--spectrum-gray-100);
        }

        sp-dialog {
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
        }

        .tab-content {
            margin-top: 20px;
            min-height: 400px;
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

        @media (max-width: 768px) {
            sp-dialog {
                max-width: 95vw;
            }

            .icon-grid {
                grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                max-height: 300px;
                gap: 6px;
                padding: 8px;
            }

            .icon-item {
                padding: 6px 2px;
                min-height: 50px;
            }

            .icon-item img {
                width: 18px;
                height: 18px;
            }

            .icon-item span {
                font-size: 9px;
            }
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

        this.addEventListener('change', (e) => {
            e.stopImmediatePropagation();
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.#initializeFromIcon();
    }

    updated(changedProperties) {
        if (changedProperties.has('icon')) {
            this.#initializeFromIcon();
        }
    }

    #initializeFromIcon() {
        if (this.icon && this.icon.includes('/product-icons/svg/')) {
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
        this.selectedProductId = null;
    }

    #handleTabChange(e) {
        this.selectedTab = e.target.selected;
    }

    #handleProductSelect(productId) {
        this.selectedProductId = productId;
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    #handleSubmit(e) {
        e.preventDefault();

        let iconValue;

        if (this.selectedTab === 'product-icon') {
            if (this.selectedProductId) {
                iconValue = `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${this.selectedProductId}.svg`;
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
                        value="${this.alt}"
                        @input=${(e) => {
                            this.alt = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="product-link">Link URL</sp-field-label>
                    <sp-textfield
                        id="product-link"
                        placeholder="https://example.com"
                        value="${this.link}"
                        @input=${(e) => {
                            this.link = e.target.value;
                        }}
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
                        value="${this.icon}"
                        @input=${(e) => {
                            this.icon = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="url-alt">Alt Text</sp-field-label>
                    <sp-textfield
                        id="url-alt"
                        placeholder="Descriptive text for accessibility"
                        value="${this.alt}"
                        @input=${(e) => {
                            this.alt = e.target.value;
                        }}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="url-link">Link URL</sp-field-label>
                    <sp-textfield
                        id="url-link"
                        placeholder="https://example.com"
                        value="${this.link}"
                        @input=${(e) => {
                            this.link = e.target.value;
                        }}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }

    render() {
        const isEditing = !!this.icon;

        return html`
            <sp-underlay ?open=${this.open}></sp-underlay>
            <sp-dialog @close=${this.#handleClose}>
                <h2 slot="heading">${isEditing ? 'Edit' : 'Add'} Mnemonic Icon</h2>

                <form @submit=${this.#handleSubmit}>
                    <sp-tabs selected="${this.selectedTab}" @change=${this.#handleTabChange}>
                        <sp-tab value="product-icon">Product Icon</sp-tab>
                        <sp-tab value="url">URL</sp-tab>
                        <sp-tab-panel value="product-icon"> ${this.productIconTab} </sp-tab-panel>
                        <sp-tab-panel value="url"> ${this.urlTab} </sp-tab-panel>
                    </sp-tabs>
                </form>

                <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.#handleClose} type="button">
                    Cancel
                </sp-button>
                <sp-button slot="button" variant="accent" @click=${this.#handleSubmit}>
                    ${isEditing ? 'Update' : 'Add'} Icon
                </sp-button>
            </sp-dialog>
        `;
    }
}

customElements.define('mas-mnemonic-modal', MasMnemonicModal);
