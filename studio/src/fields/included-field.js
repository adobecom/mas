import { css, html, LitElement, nothing } from 'lit';
import { EVENT_CHANGE } from '../constants.js';
import { renderSpIcon } from '../constants/icon-library.js';
import '../mas-mnemonic-modal.js';

class IncludedField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
            iconLibrary: { type: Boolean, reflect: true },
        };
    }

    static styles = css`
        :host {
            display: block;
        }

        .included-preview {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
            min-height: 48px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
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

        .icon-preview img.bullet-icon {
            width: 20px;
            height: 20px;
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

        .included-info {
            flex: 1;
            min-width: 0;
        }

        .included-info .value {
            font-size: 14px;
            color: var(--spectrum-gray-900);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .included-info .empty {
            color: var(--spectrum-gray-500);
            font-style: italic;
        }

        .action-menu {
            margin-left: auto;
        }

        :host([data-field-state='overridden']) .included-preview {
            border: 2px solid var(--spectrum-blue-400);
            background-color: var(--spectrum-blue-100);
        }
    `;

    constructor() {
        super();
        this.icon = '';
        this.alt = '';
        this.link = '';
        this.modalOpen = false;
        this.iconLibrary = this.dataset.fieldState === 'bullet';
    }

    #handleEditClick() {
        this.modalOpen = true;
    }

    openModal() {
        this.#handleEditClick();
    }

    #handleModalClose() {
        this.modalOpen = false;
    }

    #handleDeleteClick() {
        this.dispatchEvent(
            new CustomEvent('delete-field', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleMenuChange(event) {
        event.stopPropagation();
        const value = event.target.value;
        if (value === 'edit') {
            this.#handleEditClick();
        } else if (value === 'delete') {
            this.#handleDeleteClick();
        }
    }

    #handleModalSave(event) {
        // ignore save events fired from link editor
        if (event.detail.href !== undefined) return;

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

        if (this.iconLibrary && this.icon.startsWith('sp-icon-')) {
            return this.icon
                .replace('sp-icon-', '')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());
        }

        if (this.icon.includes('/product-icons/svg/')) {
            const match = this.icon.match(/\/([^/]+)\.svg$/);
            if (match) {
                return match[1].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            }
        }

        const urlParts = this.icon.split('/');
        return urlParts[urlParts.length - 1] || this.icon;
    }

    renderIcon() {
        if (this.iconLibrary && this.icon?.startsWith('sp-icon-')) {
            return html`${renderSpIcon(this.icon)}`;
        } else {
            return html`<img
                src="${this.icon}"
                class="${this.iconLibrary ? 'bullet-icon' : ''}"
                alt="${this.alt || 'Icon preview'}"
                @error=${(e) => (e.target.style.display = 'none')}
            />`;
        }
    }

    render() {
        return html`
            <div class="included-preview">
                <div class="icon-preview">
                    ${this.icon
                        ? html`${this.renderIcon()}`
                        : html`<div class="icon-placeholder">
                              <sp-icon-image size="m"></sp-icon-image>
                          </div>`}
                </div>

                <div class="included-info">
                    <div class="value">${this.#getDisplayText(this.#getIconName(), 'No icon selected')}</div>
                </div>

                <sp-action-menu class="action-menu" quiet size="s" placement="bottom-end" @change=${this.#handleMenuChange}>
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
                .iconLibrary="${this.iconLibrary}"
                .useRte=${this.iconLibrary}
                @modal-close=${this.#handleModalClose}
                @save=${this.#handleModalSave}
            ></mas-mnemonic-modal>
        `;
    }
}

customElements.define('mas-included-field', IncludedField);
