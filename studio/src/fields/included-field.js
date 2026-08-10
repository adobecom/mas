import { css, html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { EVENT_CHANGE } from '../constants.js';
import { renderSpIcon } from '../constants/icon-library.js';
import { VARIANT_NAMES } from '../editors/variant-picker.js';
import '../mas-mnemonic-modal.js';

class IncludedField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
            iconLibrary: { type: Boolean, reflect: true },
            variant: { type: String, reflect: true },
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

        .value .icon-button {
            display: inline-flex;
            min-width: 14px;
            min-height: 14px;
            vertical-align: middle;
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
            background-size: 14px;
            background-repeat: no-repeat;
            background-position: center;
        }
    `;

    constructor() {
        super();
        this.icon = '';
        this.alt = '';
        this.link = '';
        this.modalOpen = false;
        this.iconLibrary = this.dataset.fieldState === 'bullet';
        this.variant = this.iconLibrary ? VARIANT_NAMES.PLANS : '';
    }

    #handleEditClick() {
        this.modalOpen = true;
    }

    openModal() {
        this.#handleEditClick();
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

    #hasIncludedContent() {
        if (this.icon?.trim()) return true;
        if (this.link?.trim()) return true;
        return this.#hasAltContent(this.alt);
    }

    #handleModalClose() {
        this.modalOpen = false;
        if (!this.#hasIncludedContent()) {
            this.#handleDeleteClick();
        }
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

    #renderDescription() {
        if (this.alt?.startsWith('<p>')) {
            const doc = new DOMParser().parseFromString(this.alt, 'text/html');
            const innerHTML = doc.querySelector('p')?.innerHTML?.trim();
            if (innerHTML) return unsafeHTML(innerHTML);
        }
        return this.#getDisplayText(this.parseTextFromHtml(this.alt) || this.#getIconName(), 'No icon selected');
    }

    parseTextFromHtml(htmlMarkup) {
        if (!htmlMarkup || !htmlMarkup.startsWith('<p>')) return htmlMarkup;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlMarkup, 'text/html');
        return doc.querySelector('p')?.textContent;
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
            return html`${renderSpIcon(this.icon, this.variant)}`;
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
                    <div class="value">${this.#renderDescription()}</div>
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
                .variant=${this.variant}
                @modal-close=${this.#handleModalClose}
                @save=${this.#handleModalSave}
            ></mas-mnemonic-modal>
        `;
    }
}

customElements.define('mas-included-field', IncludedField);
