import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { renderSpIcon } from '../constants/icon-library.js';
import '../rte/rte-field.js';
import './icon-select.js';

class MasWhatsIncludedModal extends LitElement {
    #nextKey = 0;

    static properties = {
        open: { type: Boolean, reflect: true },
        label: { type: String },
        items: { type: Array },
        focusIndex: { type: Number },
        richLabel: { type: Boolean },
        variant: { type: String },
        draftLabel: { type: String, state: true },
        draftItems: { type: Array, state: true },
        heading: { type: String, state: true },
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
        }

        sp-dialog.whats-included {
            box-sizing: border-box;
            width: 548px;
            max-width: 548px;
            max-height: 90vh;
            border-radius: 16px;
            --mod-dialog-confirm-padding-grid: 20px;
            --mod-dialog-confirm-divider-block-spacing-start: 0px;
            --mod-dialog-confirm-divider-block-spacing-end: 25px;
            --mod-dialog-confirm-title-text-size: 22px;
            --mod-dialog-confirm-title-text-line-height: 26px;
            --mod-dialog-confirm-title-text-color: #292929;
            --spectrum-dialog-footer-display: flex;
            --spectrum-dialog-footer-justify-content: flex-end;
            --spectrum-dialog-footer-padding-top: 0;
            --spectrum-dialog-footer-border-top: none;
        }

        sp-dialog.whats-included form {
            display: flex;
            flex-direction: column;
            gap: 32px;
            margin-bottom: 32px;
        }

        sp-tabs,
        sp-tab-panel {
            width: 100%;
        }

        .tab-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 32px;
            width: 100%;
        }

        .field {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .field sp-textfield {
            width: 100%;
        }

        .items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .count {
            font-size: 14px;
            color: var(--spectrum-gray-700, #505050);
        }

        .item-card {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 16px;
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 12px;
        }

        .item-header {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .item-header sp-action-button[label='Delete item'] {
            margin-left: auto;
        }

        .item-header sp-action-group {
            gap: 0;
            background: var(--spectrum-gray-200, #e9e9e9);
            border-radius: 8px;
        }

        .item-header sp-action-group sp-action-button {
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

        .item-header sp-action-group sp-action-button[selected] {
            background-color: #fff;
            border-color: #292929;
        }

        .preview {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 8px;
            background: var(--spectrum-gray-100, #f8f8f8);
            overflow: hidden;
        }

        .preview img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .add-item {
            align-self: flex-start;
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.label = '';
        this.items = [];
        this.focusIndex = 0;
        this.richLabel = false;
        this.variant = '';
        this.draftLabel = '';
        this.draftItems = [];
        this.heading = "Add what's included";
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.draftLabel = this.label ?? '';
            this.draftItems = this.items.map((item) => this.#toDraft(item));
            const hasContent = this.items.some((item) => item.icon || item.alt);
            this.heading = hasContent ? "Edit what's included" : "Add what's included";
        }
    }

    async updated(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            await this.updateComplete;
            this.#focusItem(this.focusIndex);
        }
    }

    #toDraft({ icon, alt, link }) {
        const mode = icon && !icon.startsWith('sp-icon-') ? 'url' : 'select';
        return { key: this.#nextKey++, icon, alt, link, mode };
    }

    #focusItem(index) {
        const card = this.shadowRoot.querySelectorAll('.item-card')[index];
        card?.querySelector('mas-icon-select, .icon-url')?.focus();
    }

    #updateItem(index, changes) {
        this.draftItems = this.draftItems.map((item, i) => (i === index ? { ...item, ...changes } : item));
    }

    async #addItem() {
        this.draftItems = [...this.draftItems, this.#toDraft({ icon: '', alt: '', link: '' })];
        await this.updateComplete;
        this.#focusItem(this.draftItems.length - 1);
    }

    #deleteItem(index) {
        this.draftItems = this.draftItems.filter((_, i) => i !== index);
    }

    #close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    }

    #handleConfirm(event) {
        event.preventDefault();
        const items = this.draftItems.map(({ icon, alt, link }) => ({ icon, alt, link }));
        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: { label: this.draftLabel, items },
            }),
        );
        this.#close();
    }

    get itemCountText() {
        const count = this.draftItems.length;
        return `${count} item${count === 1 ? '' : 's'}`;
    }

    get labelTemplate() {
        return html`
            <div class="field">
                <sp-field-label for="section-title">Section title</sp-field-label>
                ${this.richLabel
                    ? html`<rte-field
                          id="section-title"
                          inline
                          link
                          .value=${this.draftLabel}
                          @change=${(event) => (this.draftLabel = event.target.value)}
                      ></rte-field>`
                    : html`<sp-textfield
                          id="section-title"
                          placeholder="Enter the label text"
                          .value=${this.draftLabel}
                          @input=${(event) => (this.draftLabel = event.target.value)}
                      ></sp-textfield>`}
            </div>
        `;
    }

    renderPreview({ icon }) {
        if (icon?.startsWith('sp-icon-')) return renderSpIcon(icon, this.variant);
        if (icon) return html`<img src=${icon} alt="" />`;
        return html`<sp-icon-image></sp-icon-image>`;
    }

    renderItem(item, index) {
        return html`
            <div class="item-card">
                <div class="item-header">
                    <div class="preview">${this.renderPreview(item)}</div>
                    <sp-action-group
                        selects="single"
                        .selected=${[item.mode]}
                        @change=${(event) => this.#updateItem(index, { mode: event.target.selected[0] ?? item.mode })}
                    >
                        <sp-action-button value="select">Select</sp-action-button>
                        <sp-action-button value="url">Import via URL</sp-action-button>
                    </sp-action-group>
                    <sp-action-button quiet label="Delete item" @click=${() => this.#deleteItem(index)}>
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                    </sp-action-button>
                </div>
                ${item.mode === 'select'
                    ? html`<div class="field">
                          <sp-field-label>Icon</sp-field-label>
                          <mas-icon-select
                              .value=${item.icon}
                              .variant=${this.variant}
                              @change=${(event) => this.#updateItem(index, { icon: event.detail.id })}
                          ></mas-icon-select>
                      </div>`
                    : html`<div class="field">
                          <sp-field-label>Icon URL</sp-field-label>
                          <sp-textfield
                              class="icon-url"
                              placeholder="e.g., https://adobe.com/assets/firefly-icon.svg"
                              .value=${item.icon?.startsWith('sp-icon-') ? '' : (item.icon ?? '')}
                              @input=${(event) => this.#updateItem(index, { icon: event.target.value })}
                          ></sp-textfield>
                      </div>`}
                <div class="field">
                    <sp-field-label>Description</sp-field-label>
                    <rte-field
                        link
                        icon
                        .value=${item.alt || ''}
                        @change=${(event) => this.#updateItem(index, { alt: event.target.value })}
                    ></rte-field>
                </div>
            </div>
        `;
    }

    get iconTabTemplate() {
        return html`
            <div class="tab-content">
                ${this.labelTemplate}
                <div class="items-header">
                    <sp-field-label>Content items</sp-field-label>
                    <span class="count">${this.itemCountText}</span>
                </div>
                ${repeat(
                    this.draftItems,
                    (item) => item.key,
                    (item, index) => this.renderItem(item, index),
                )}
                <sp-action-button quiet class="add-item" @click=${this.#addItem}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Add item
                </sp-action-button>
            </div>
        `;
    }

    render() {
        return html`
            <div @input=${(event) => event.stopPropagation()} @change=${(event) => event.stopPropagation()}>
                <sp-underlay ?open=${this.open}></sp-underlay>
                <sp-dialog class="whats-included" no-divider>
                    <h2 slot="heading">${this.heading}</h2>
                    <form @submit=${this.#handleConfirm}>
                        <sp-tabs selected="icon">
                            <sp-tab value="icon">Icon</sp-tab>
                            <sp-tab-panel value="icon">${this.open ? this.iconTabTemplate : nothing}</sp-tab-panel>
                        </sp-tabs>
                    </form>
                    <sp-button slot="button" variant="secondary" treatment="outline" type="button" @click=${this.#close}>
                        Cancel
                    </sp-button>
                    <sp-button slot="button" variant="accent" @click=${this.#handleConfirm}>Confirm</sp-button>
                </sp-dialog>
            </div>
        `;
    }
}

customElements.define('mas-whats-included-modal', MasWhatsIncludedModal);
