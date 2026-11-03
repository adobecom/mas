import { css, html, LitElement } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { EVENT_CHANGE } from '../constants.js';
import { renderSpIcon } from '../constants/icon-library.js';
import { VARIANT_NAMES } from '../editors/variant-picker.js';
import '../mas-icon-picker-modal.js';

class IconPickerField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
            variant: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
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
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 40 40"><path d="M20 37.5C10.3496 37.5 2.5 29.6504 2.5 20C2.5 10.3496 10.3496 2.5 20 2.5C29.6504 2.5 37.5 10.3496 37.5 20C37.5 29.6504 29.6504 37.5 20 37.5ZM20 5.5C12.0039 5.5 5.5 12.0039 5.5 20C5.5 27.9961 12.0039 34.5 20 34.5C27.9961 34.5 34.5 27.9961 34.5 20C34.5 12.0039 27.9961 5.5 20 5.5Z"/><path d="M20.0013 10.5207C20.4626 10.5044 20.912 10.6684 21.2545 10.9779C21.9152 11.708 21.9152 12.8199 21.2545 13.55C20.9158 13.8671 20.4648 14.0362 20.0012 14.0201C19.5285 14.0391 19.0694 13.8594 18.7352 13.5246C18.411 13.1888 18.2369 12.736 18.2524 12.2695C18.2277 11.7996 18.3916 11.3392 18.7078 10.9907C19.055 10.6612 19.5236 10.491 20.0013 10.5207Z"/><path d="M20 30.125C19.1719 30.125 18.5 29.4531 18.5 28.625V18.9551C18.5 18.127 19.1719 17.4551 20 17.4551C20.8281 17.4551 21.5 18.127 21.5 18.9551V28.625C21.5 29.4531 20.8281 30.125 20 30.125Z"/></svg>');
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
        this.variant = VARIANT_NAMES.MINI_COMPARE_CHART;
        this.modalOpen = false;
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

    #getIconName() {
        if (!this.icon) return 'No icon selected';

        if (this.icon.startsWith('sp-icon-')) {
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

    parseTextFromHtml(html) {
        if (!html || !html.startsWith('<p>')) return html;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc.querySelector('p').textContent;
    }

    #renderDescription() {
        if (this.alt?.startsWith('<p>')) {
            const doc = new DOMParser().parseFromString(this.alt, 'text/html');
            const innerHTML = doc.querySelector('p')?.innerHTML?.trim();
            if (innerHTML) return unsafeHTML(innerHTML);
        }
        return this.#getDisplayText(this.parseTextFromHtml(this.alt) || this.#getIconName(), 'No icon selected');
    }

    renderIcon() {
        if (this.icon?.startsWith('sp-icon-')) {
            return html`${renderSpIcon(this.icon, this.variant)}`;
        }
        return html`<img
            src="${this.icon}"
            alt="${this.parseTextFromHtml(this.alt) || 'Icon preview'}"
            @error=${(e) => (e.target.style.display = 'none')}
        />`;
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

            <mas-icon-picker-modal
                ?open=${this.modalOpen}
                .icon=${this.icon}
                .alt=${this.alt}
                .variant=${this.variant}
                @modal-close=${this.#handleModalClose}
                @save=${this.#handleModalSave}
            ></mas-icon-picker-modal>
        `;
    }
}

customElements.define('mas-icon-picker-field', IconPickerField);
