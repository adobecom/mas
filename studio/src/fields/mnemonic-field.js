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
            padding: 8px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            min-height: 48px;
            max-width: 340px;
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

        .mnemonic-info .label {
            font-size: 12px;
            color: var(--spectrum-gray-700);
            margin-bottom: 2px;
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

        .edit-button {
            margin-left: auto;
        }

        sp-icon-edit {
            cursor: pointer;
            color: var(--spectrum-gray-700);
        }

        sp-icon-edit:hover {
            color: var(--spectrum-blue-600);
        }
    `;

    constructor() {
        super();
        this.icon = '';
        this.alt = '';
        this.link = '';
        this.modalOpen = false;
    }

    get iconElement() {
        return this.shadowRoot.getElementById('icon');
    }

    get altElement() {
        return this.shadowRoot.getElementById('alt');
    }

    get linkElement() {
        return this.shadowRoot.getElementById('link');
    }

    #handleEditClick() {
        this.modalOpen = true;
    }

    #handleModalClose() {
        this.modalOpen = false;
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
                    <div class="label">Icon</div>
                    <div class="value">${this.#getDisplayText(this.#getIconName(), 'No icon selected')}</div>

                    ${this.alt
                        ? html`
                              <div class="label">Alt text</div>
                              <div class="value">${this.alt}</div>
                          `
                        : ''}
                    ${this.link
                        ? html`
                              <div class="label">Link</div>
                              <div class="value">${this.link}</div>
                          `
                        : ''}
                </div>

                <sp-action-button class="edit-button" quiet @click=${this.#handleEditClick} title="Edit mnemonic">
                    <sp-icon-edit slot="icon"></sp-icon-edit>
                </sp-action-button>
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
