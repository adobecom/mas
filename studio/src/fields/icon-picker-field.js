import { css, html, LitElement } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { EVENT_CHANGE } from '../constants.js';
import { renderSpIcon } from '../constants/icon-library.js';
import { VARIANT_NAMES } from '../editors/variant-picker.js';
import { fieldStatusStyles } from '../common/fields/field-status.css.js';
import { blurFocusedElement, itemStatusIndicator } from '../common/fields/item-status.js';
import '../mas-icon-picker-modal.js';

class IconPickerField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
            variant: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
            fieldState: { type: String, attribute: 'data-field-state' },
        };
    }

    static styles = [
        fieldStatusStyles,
        css`
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
                background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="14" width="14"><path d="m10,18.75c-4.8252,0-8.75-3.9248-8.75-8.75S5.1748,1.25,10,1.25s8.75,3.9248,8.75,8.75-3.9248,8.75-8.75,8.75Zm0-16c-3.99805,0-7.25,3.25195-7.25,7.25s3.25195,7.25,7.25,7.25,7.25-3.25195,7.25-7.25-3.25195-7.25-7.25-7.25Z"/><path d="m10.00064,5.26036c.23065-.00813.45538.07387.62661.22862.33033.36505.33033.92102,0,1.28607-.16935.15851-.39483.24308-.62664.23504-.23635.00948-.46589-.08035-.63302-.24775-.16207-.1679-.24916-.39432-.24137-.62755-.01238-.23497.06959-.46515.2277-.6394.17358-.16474.40786-.24988.64671-.23503Z"/><path d="m10,15.0625c-.41406,0-.75-.33594-.75-.75v-4.83496c0-.41406.33594-.75.75-.75s.75.33594.75.75v4.83496c0,.41406-.33594.75-.75.75Z"/></svg>');
                background-size: 14px;
                background-repeat: no-repeat;
                background-position: center;
            }
        `,
    ];

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
        blurFocusedElement(this.shadowRoot);

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
            ${itemStatusIndicator(this.fieldState)}
        `;
    }
}

customElements.define('mas-icon-picker-field', IconPickerField);
