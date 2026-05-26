import { LitElement, html, css } from 'lit';
import { ADOBE_PRODUCTS } from './constants/adobe-products.js';
import { ICON_LIBRARY, renderSpIcon } from './constants/icon-library.js';

class MasIconPickerModal extends LitElement {
    #originalIcon = '';
    #originalAlt = '';

    static properties = {
        open: { type: Boolean, reflect: true },
        icon: { type: String },
        alt: { type: String },
        variant: { type: String },
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

        .section-divider {
            grid-column: 1 / -1;
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 0 4px;
            border-top: 1px solid var(--spectrum-gray-200);
            margin-top: 4px;
        }

        .section-divider:first-child {
            border-top: none;
            margin-top: 0;
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
        this.variant = '';
        this.selectedTab = 'icons';
        this.selectedProductId = null;
        this._isSpectrum = false;
        this.altHtml = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.#initializeFromIcon();
    }

    #storeOriginalValues() {
        this.#originalIcon = this.icon;
        this.#originalAlt = this.alt;
    }

    updated(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.#storeOriginalValues();
            this.#initializeFromIcon();
        }
    }

    get allIcons() {
        return [
            { type: 'divider', label: 'Adobe Products' },
            ...ADOBE_PRODUCTS.map((p) => ({ ...p, isSpectrum: false })),
            { type: 'divider', label: 'Spectrum Icons' },
            ...ICON_LIBRARY.map((p) => ({ ...p, isSpectrum: true })),
        ];
    }

    #initializeFromIcon() {
        if (this.icon) {
            // Check if it's a spectrum icon
            if (this.icon.startsWith('sp-icon-')) {
                const found = ICON_LIBRARY.find((p) => p.id === this.icon);
                if (found) {
                    this.selectedProductId = this.icon;
                    this._isSpectrum = true;
                    this.selectedTab = 'icons';
                    return;
                }
            }
            // Check if it's an Adobe product icon URL
            if (this.icon.includes('/product-icons/svg/')) {
                const match = this.icon.match(/\/([^/]+)\.svg$/);
                if (match) {
                    const productId = match[1];
                    const product = ADOBE_PRODUCTS.find((p) => p.id === productId);
                    if (product) {
                        this.selectedProductId = productId;
                        this._isSpectrum = false;
                        this.selectedTab = 'icons';
                        return;
                    }
                }
            }
            // Unrecognized icon value -- treat as custom URL
            this.selectedProductId = null;
            this._isSpectrum = false;
            this.selectedTab = 'url';
            return;
        }
        this.selectedProductId = null;
        this._isSpectrum = false;
    }

    #handleTabChange(e) {
        if (e.target.nodeName !== 'SP-TABS') return;
        this.selectedTab = e.currentTarget.selected;
    }

    #handleIconSelect(item) {
        this.selectedProductId = item.id;
        this._isSpectrum = item.isSpectrum;
        if (item.isSpectrum) {
            this.icon = item.id;
        } else {
            this.icon = `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${item.id}.svg`;
        }
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    }

    #hasAltContent(altCombined) {
        const raw = (altCombined ?? '').trim();
        if (!raw) return false;
        if (raw.startsWith('<p>')) {
            const doc = new DOMParser().parseFromString(raw, 'text/html');
            const txt = doc
                .querySelector('p')
                ?.textContent?.replace(/\u00a0/g, ' ')
                .trim();
            return !!txt;
        }
        return true;
    }

    #handleCancel() {
        this.icon = this.#originalIcon;
        this.alt = this.#originalAlt;
        this.#handleClose();
    }

    #handleSubmit(e) {
        e.preventDefault();

        let iconValue;

        if (this.selectedTab === 'icons') {
            if (this.selectedProductId) {
                if (this._isSpectrum) {
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

        const altPayload = this.altHtml || this.alt || '';
        if (!iconValue.trim() && !this.#hasAltContent(altPayload)) {
            return;
        }

        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    icon: iconValue,
                    alt: this.altHtml || this.alt || '',
                    link: '',
                },
            }),
        );

        this.#handleClose();
    }

    get iconsTab() {
        return html`
            <div class="tab-content">
                <div class="icon-grid">
                    ${this.allIcons.map((item) => {
                        if (item.type === 'divider') {
                            return html`<div class="section-divider">${item.label}</div>`;
                        }
                        return html`
                            <div
                                class="icon-item ${this.selectedProductId === item.id ? 'selected' : ''}"
                                @click=${() => this.#handleIconSelect(item)}
                            >
                                ${item.isSpectrum
                                    ? html`${renderSpIcon(item.id, this.variant)}`
                                    : html`<img
                                          src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${item.id}.svg"
                                          alt="${item.name}"
                                          @error=${(e) => {
                                              e.target.style.display = 'none';
                                          }}
                                      />`}
                                <span>${item.name}</span>
                            </div>
                        `;
                    })}
                </div>

                <div class="form-field">
                    <sp-field-label for="icon-description">Description</sp-field-label>
                    <rte-field
                        id="icon-description"
                        link
                        .value=${this.alt || ''}
                        @change=${(e) => (this.altHtml = e.target.value)}
                    ></rte-field>
                </div>
            </div>
        `;
    }

    get urlTab() {
        return html`
            <div class="tab-content">
                <div class="form-field">
                    <sp-field-label for="url-icon">Icon URL</sp-field-label>
                    <sp-textfield
                        id="url-icon"
                        placeholder="https://example.com/icon.svg"
                        value="${!this.icon?.startsWith('sp-icon-') ? this.icon : ''}"
                        @input=${(e) => (this.icon = e.target.value)}
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="url-description">Description</sp-field-label>
                    <rte-field
                        id="url-description"
                        link
                        .value=${this.alt || ''}
                        @change=${(e) => (this.altHtml = e.target.value)}
                    ></rte-field>
                </div>
            </div>
        `;
    }

    render() {
        const isEditing = !!(this.icon || this.#hasAltContent(this.altHtml || this.alt || ''));

        return html`
            <div @input=${(e) => e.stopPropagation()} @change=${(e) => e.stopPropagation()}>
                <sp-underlay ?open=${this.open}></sp-underlay>
                <sp-dialog>
                    <h2 slot="heading">${isEditing ? 'Edit' : 'Add'} Icon</h2>

                    <form @submit=${this.#handleSubmit}>
                        <sp-tabs selected="${this.selectedTab}" @change=${this.#handleTabChange}>
                            <sp-tab value="icons">Icons</sp-tab>
                            <sp-tab value="url">URL</sp-tab>
                            <sp-tab-panel value="icons"> ${this.iconsTab} </sp-tab-panel>
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

customElements.define('mas-icon-picker-modal', MasIconPickerModal);
