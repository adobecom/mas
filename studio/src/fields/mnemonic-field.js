import { css, html, LitElement } from 'lit';
import { EVENT_CHANGE } from '../constants.js';
import '../mas-mnemonic-modal.js';

class MnemonicField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
        };
    }

    static styles = css`
        :host {
            display: block;
        }

        .mnemonic-preview {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
            min-height: 48px;
        }

        .icon-preview {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .icon-preview img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .icon-placeholder {
            width: 32px;
            height: 32px;
            background: var(--spectrum-gray-200);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--spectrum-gray-600);
        }

        .mnemonic-info {
            flex: 1;
            min-width: 0;
        }

        .mnemonic-info .value {
            font-size: 14px;
            color: var(--spectrum-gray-900);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .mnemonic-info .empty {
            color: var(--spectrum-gray-500);
            font-style: italic;
        }

        sp-action-menu {
            margin-left: auto;
            align-self: center;
        }
    `;

    constructor() {
        super();
        this.icon = '';
        this.alt = '';
        this.link = '';
        this.modalOpen = false;
    }

    #handleMenuAction(e) {
        const action = e.target.value;
        if (action === 'edit') {
            this.modalOpen = true;
        } else if (action === 'delete') {
            this.dispatchEvent(
                new CustomEvent('delete-field', {
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    #handleModalClose() {
        const wasEmpty = !this.icon && !this.alt && !this.link;
        this.modalOpen = false;

        if (wasEmpty) {
            this.dispatchEvent(
                new CustomEvent('delete-field', {
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    #handleModalSave(event) {
        const { icon, alt, link } = event.detail;
        this.icon = icon;
        this.alt = alt;
        this.link = link;

        this.modalOpen = false;

        this.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, {
                bubbles: true,
                composed: true,
                detail: this,
            }),
        );
    }

    get value() {
        return {
            icon: this.icon ?? '',
            alt: this.alt ?? '',
            link: this.link ?? '',
        };
    }

    #getDisplayText(value, placeholder) {
        return value || html`<span class="empty">${placeholder}</span>`;
    }

    #getIconName() {
        if (!this.icon) return 'No icon selected';

        if (this.icon.includes('/product-icons/svg/')) {
            const match = this.icon.match(/\/([^/]+)\.svg$/);
            if (match) {
                return match[1].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            }
        }

        const urlParts = this.icon.split('/');
        return urlParts[urlParts.length - 1] || this.icon;
    }

    render() {
        return html`
            <div class="mnemonic-preview">
                <div class="icon-preview">
                    ${this.icon
                        ? html`<img
                              src="${this.icon}"
                              alt="${this.alt || 'Icon preview'}"
                              @error=${(e) => (e.target.style.display = 'none')}
                          />`
                        : html`<div class="icon-placeholder">
                              <sp-icon-image size="m"></sp-icon-image>
                          </div>`}
                </div>

                <div class="mnemonic-info">
                    <div class="value">${this.#getDisplayText(this.#getIconName(), 'No icon selected')}</div>
                </div>

                <sp-action-menu quiet placement="bottom-end" @change=${this.#handleMenuAction}>
                    <sp-icon-more slot="icon"></sp-icon-more>
                    <sp-menu>
                        <sp-menu-item value="edit">
                            <sp-icon-edit slot="icon"></sp-icon-edit>
                            Edit
                        </sp-menu-item>
                        <sp-menu-item value="delete">
                            <sp-icon-delete slot="icon"></sp-icon-delete>
                            Delete
                        </sp-menu-item>
                    </sp-menu>
                </sp-action-menu>
            </div>

            <mas-mnemonic-modal
                ?open=${this.modalOpen}
                .icon=${this.icon}
                .alt=${this.alt}
                .link=${this.link}
                @close=${this.#handleModalClose}
                @save=${this.#handleModalSave}
            ></mas-mnemonic-modal>
        `;
    }
}

customElements.define('mas-mnemonic-field', MnemonicField);
