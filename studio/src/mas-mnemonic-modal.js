import { LitElement, html, css } from 'lit';
import { ADOBE_PRODUCTS } from './constants/adobe-products.js';
import { ICON_LIBRARY, renderSpIcon } from './constants/icon-library.js';
import './rte/rte-field.js';
import './fields/product-picker.js';
import './fields/icon-select.js';
import { addRecent, readRecent, writeRecent } from './utils/recent-products.js';

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
        recentIds: { type: Array, state: true },
        altHtml: { type: String, state: true },
        iconLibrary: { type: Boolean },
        badgeIcon: { type: Boolean },
        useRte: { type: Boolean },
        variant: { type: String },
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

        sp-dialog.add-visual {
            box-sizing: border-box;
            width: 484px;
            max-width: 484px;
            border-radius: 16px;
            --mod-dialog-confirm-padding-grid: 20px;
            --spectrum-dialog-footer-justify-content: flex-end;
            --spectrum-dialog-footer-padding-top: 0;
            --spectrum-dialog-footer-border-top: none;
        }

        sp-dialog.add-visual form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 16px;
            margin-bottom: 32px;
        }

        sp-dialog.add-visual .tab-content {
            gap: 16px;
            margin-top: 16px;
        }

        sp-dialog.add-visual .form-field {
            margin-bottom: 0;
        }

        sp-dialog.add-visual sp-button[slot='button'][variant='secondary'] {
            margin-right: 0;
        }

        sp-dialog.add-visual sp-button[slot='button'][variant='accent'] {
            margin-left: 0;
        }

        sp-dialog.badge-icon {
            box-sizing: border-box;
            width: 454px;
            max-width: 454px;
            border-radius: 16px;
            --mod-dialog-confirm-padding-grid: 20px;
            --mod-dialog-confirm-title-text-size: 22px;
            --mod-dialog-confirm-title-text-line-height: 26px;
            --mod-dialog-confirm-title-text-color: #292929;
            --mod-dialog-confirm-divider-block-spacing-start: 0px;
            --mod-dialog-confirm-divider-block-spacing-end: 0px;
            --mod-dialog-confirm-buttongroup-padding-top: 0px;
            --spectrum-dialog-footer-justify-content: flex-end;
            --spectrum-dialog-footer-padding-top: 0;
            --spectrum-dialog-footer-border-top: none;
        }

        sp-dialog.badge-icon form {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 32px;
            margin-bottom: 32px;
        }

        sp-dialog.badge-icon form.select-tab {
            box-sizing: border-box;
            height: 257px;
        }

        sp-dialog.badge-icon mas-icon-select {
            --mas-icon-select-list-max-height: 110px;
        }

        sp-dialog.badge-icon h2[slot='heading'] {
            margin: 0;
            padding: 0;
            line-height: 26px;
        }

        sp-dialog.badge-icon form.select-tab .form-field {
            flex: 1;
        }

        sp-dialog.badge-icon .form-field {
            margin-bottom: 0;
        }

        sp-dialog.badge-icon .form-field sp-field-label {
            margin-bottom: 8px;
        }

        sp-dialog.badge-icon sp-action-group {
            gap: 0;
            background: var(--spectrum-gray-200, #e9e9e9);
            border-radius: 8px;
            align-self: flex-start;
        }

        sp-dialog.badge-icon sp-action-button {
            --mod-actionbutton-background-color-default: transparent;
            --mod-actionbutton-background-color-hover: transparent;
            --mod-actionbutton-border-color-default: transparent;
            --mod-actionbutton-border-color-hover: transparent;
            --mod-actionbutton-content-color-default-selected: #292929;
            --mod-actionbutton-content-color-hover-selected: #292929;
            --mod-actionbutton-content-color-down-selected: #292929;
            --mod-actionbutton-content-color-focus-selected: #292929;
            --mod-actionbutton-border-radius: 8px;
            --mod-actionbutton-border-width: 2px;
        }

        sp-dialog.badge-icon sp-action-button[selected] {
            background-color: #fff;
            border-color: #292929;
        }

        sp-dialog.badge-icon sp-button[slot='button'][variant='secondary'] {
            margin-right: 0;
        }

        sp-dialog.badge-icon sp-button[slot='button'][variant='accent'] {
            margin-left: 0;
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
        this.useRte = false;
        this.altHtml = '';
        this.variant = '';
        this.recentIds = [];
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open && !this.iconLibrary) {
            this.recentIds = readRecent();
        }
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
        } else if (this.badgeIcon) {
            this.selectedTab = 'product-icon';
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

    #hasAltContent(altCombined) {
        const raw = (altCombined ?? '').trim();
        if (!raw) return false;
        if (raw.startsWith('<p>')) {
            const doc = new DOMParser().parseFromString(raw, 'text/html');
            const p = doc.querySelector('p');
            const txt = p?.textContent?.replace(/\u00a0/g, ' ').trim();
            if (txt) return true;
            return !!p?.querySelector('.icon-button');
        }
        return true;
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

        const altPayload = this.altHtml || this.alt || '';
        if (!iconValue.trim() && !this.#hasAltContent(altPayload) && !(this.link || '').trim()) {
            return;
        }

        if (!this.iconLibrary && this.selectedTab === 'product-icon' && this.selectedProductId) {
            writeRecent(addRecent(readRecent(), this.selectedProductId));
        }

        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    icon: iconValue,
                    alt: this.altHtml || this.alt || '',
                    link: this.link || '',
                },
            }),
        );

        this.#handleClose();
    }

    get badgeConfirmDisabled() {
        if (this.selectedTab === 'product-icon') return !this.selectedProductId;
        return this.icon?.startsWith('sp-icon-') || !(this.icon || '').trim();
    }

    #handleBadgeSubmit() {
        if (this.badgeConfirmDisabled) return;
        const icon = this.selectedTab === 'product-icon' ? this.selectedProductId : this.icon.trim();
        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: { icon, alt: '', link: '' },
            }),
        );
        this.#handleClose();
    }

    #handleBadgeModeChange(e) {
        this.selectedTab = e.target.selected[0] === 'url' ? 'url' : 'product-icon';
    }

    get badgeIconTemplate() {
        const isUrl = this.selectedTab === 'url';
        return html`
            <div @input=${(e) => e.stopPropagation()} @change=${(e) => e.stopPropagation()}>
                <sp-underlay ?open=${this.open}></sp-underlay>
                <sp-dialog class="badge-icon" no-divider>
                    <h2 slot="heading">Badge icon</h2>
                    <form class=${isUrl ? '' : 'select-tab'} @submit=${(e) => e.preventDefault()}>
                        <sp-action-group
                            selects="single"
                            .selected=${[isUrl ? 'url' : 'select']}
                            @change=${this.#handleBadgeModeChange}
                        >
                            <sp-action-button value="select">Select</sp-action-button>
                            <sp-action-button value="url">Import via URL</sp-action-button>
                        </sp-action-group>
                        ${isUrl
                            ? html`<div class="form-field">
                                  <sp-field-label for="url-icon">Icon URL</sp-field-label>
                                  <sp-textfield
                                      id="url-icon"
                                      placeholder="e.g., https://adobe.com/assets/firefly-icon.svg"
                                      .value=${!this.icon?.startsWith('sp-icon-') ? (this.icon ?? '') : ''}
                                      @input=${(e) => (this.icon = e.target.value)}
                                  ></sp-textfield>
                              </div>`
                            : html`<div class="form-field">
                                  <sp-field-label>Icon</sp-field-label>
                                  <mas-icon-select
                                      .value=${this.selectedProductId ?? ''}
                                      .variant=${this.variant}
                                      placeholder="Please select"
                                      @change=${(e) => {
                                          this.selectedProductId = e.detail.id;
                                          this.icon = e.detail.id;
                                      }}
                                  ></mas-icon-select>
                              </div>`}
                    </form>
                    <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.#handleCancel} type="button">
                        Cancel
                    </sp-button>
                    <sp-button
                        slot="button"
                        variant="accent"
                        ?disabled=${this.badgeConfirmDisabled}
                        @click=${this.#handleBadgeSubmit}
                    >
                        Confirm
                    </sp-button>
                </sp-dialog>
            </div>
        `;
    }

    get altLabel() {
        return this.iconLibrary ? 'Alt Text' : 'Alt text';
    }

    get linkLabel() {
        return this.iconLibrary ? 'Link URL' : 'Destination URL';
    }

    get confirmDisabled() {
        if (this.iconLibrary) return false;
        const hasVisual = this.selectedTab === 'product-icon' ? !!this.selectedProductId : !!(this.icon || '').trim();
        return !hasVisual && !this.#hasAltContent(this.altHtml || this.alt || '') && !(this.link || '').trim();
    }

    renderProductIcon = (product) =>
        html`<img
            src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${product.id}.svg"
            alt=""
            @error=${(e) => {
                e.target.style.display = 'none';
            }}
        />`;

    get productPickerTemplate() {
        return html`
            <mas-product-picker
                .items=${ADOBE_PRODUCTS}
                .recentIds=${this.recentIds}
                .selectedId=${this.selectedProductId ?? ''}
                .renderIcon=${this.renderProductIcon}
                @item-select=${(e) => this.#handleProductSelect(e.detail.id)}
            ></mas-product-picker>
        `;
    }

    get iconLibraryGridTemplate() {
        return html`
            <div class="icon-grid">
                ${this.icons.map(
                    (product) => html`
                        <div
                            class="icon-item ${this.selectedProductId === product.id ? 'selected' : ''}"
                            @click=${() => this.#handleProductSelect(product.id)}
                        >
                            ${renderSpIcon(product.id, this.variant)}
                            <span>${product.name}</span>
                        </div>
                    `,
                )}
            </div>
        `;
    }

    get productIconTab() {
        return html`
            <div class="tab-content">
                ${this.iconLibrary ? this.iconLibraryGridTemplate : this.productPickerTemplate}
                ${this.useRte
                    ? html`
                          <div class="form-field">
                              <sp-field-label for="description">Description</sp-field-label>
                              <rte-field
                                  id="description"
                                  link
                                  icon
                                  .value=${this.alt || ''}
                                  @change=${(e) => (this.altHtml = e.target.value)}
                              ></rte-field>
                          </div>
                      `
                    : html`
                          <div class="form-field icon-lib-optional">
                              <sp-field-label for="product-alt">${this.altLabel}</sp-field-label>
                              <sp-textfield
                                  id="product-alt"
                                  placeholder="Descriptive text for accessibility"
                                  value="${this.alt}"
                                  @input=${(e) => (this.alt = e.target.value)}
                              ></sp-textfield>
                          </div>
                      `}

                <div class="form-field icon-lib-optional">
                    <sp-field-label for="product-link">${this.linkLabel}</sp-field-label>
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
                    <sp-field-label for="url-icon">Icon URL</sp-field-label>
                    <sp-textfield
                        id="url-icon"
                        placeholder="https://example.com/icon.svg"
                        value="${!this.icon?.startsWith('sp-icon-') ? this.icon : ''}"
                        @input=${(e) => (this.icon = e.target.value)}
                    ></sp-textfield>
                </div>

                ${this.useRte
                    ? html`
                          <div class="form-field">
                              <sp-field-label for="url-description">Description</sp-field-label>
                              <rte-field
                                  id="url-description"
                                  link
                                  icon
                                  .value=${this.alt || ''}
                                  @change=${(e) => (this.altHtml = e.target.value)}
                              ></rte-field>
                          </div>
                      `
                    : html`
                          <div class="form-field icon-lib-optional">
                              <sp-field-label for="url-alt">${this.altLabel}</sp-field-label>
                              <sp-textfield
                                  id="url-alt"
                                  placeholder="Descriptive text for accessibility"
                                  value="${this.alt}"
                                  @input=${(e) => (this.alt = e.target.value)}
                              ></sp-textfield>
                          </div>
                      `}

                <div class="form-field icon-lib-optional">
                    <sp-field-label for="url-link">${this.linkLabel}</sp-field-label>
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
        if (this.badgeIcon) return this.badgeIconTemplate;
        const isEditing = !!(this.icon || this.#hasAltContent(this.altHtml || this.alt || '') || (this.link || '').trim());

        return html`
            <div @input=${(e) => e.stopPropagation()} @change=${(e) => e.stopPropagation()}>
                <sp-underlay ?open=${this.open}></sp-underlay>
                <sp-dialog class="${this.iconLibrary ? 'icon-library' : 'add-visual'}" ?no-divider=${!this.iconLibrary}>
                    <h2 slot="heading">
                        ${this.iconLibrary ? `${isEditing ? 'Edit' : 'Add'} Icon` : isEditing ? 'Edit visual' : 'Add visual'}
                    </h2>

                    <form @submit=${this.#handleSubmit}>
                        <sp-tabs selected="${this.selectedTab}" @change=${this.#handleTabChange}>
                            <sp-tab value="product-icon">${this.iconLibrary ? 'Icon' : 'Select'}</sp-tab>
                            <sp-tab value="url">${this.iconLibrary ? 'URL' : 'Import via URL'}</sp-tab>
                            <sp-tab-panel value="product-icon"> ${this.productIconTab} </sp-tab-panel>
                            <sp-tab-panel value="url"> ${this.urlTab} </sp-tab-panel>
                        </sp-tabs>
                    </form>

                    <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.#handleCancel} type="button">
                        Cancel
                    </sp-button>
                    <sp-button slot="button" variant="accent" ?disabled=${this.confirmDisabled} @click=${this.#handleSubmit}>
                        ${this.iconLibrary ? `${isEditing ? 'Update' : 'Add'} Icon` : 'Confirm'}
                    </sp-button>
                </sp-dialog>
            </div>
        `;
    }
}

customElements.define('mas-mnemonic-modal', MasMnemonicModal);
