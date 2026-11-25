import { css, html, LitElement, nothing } from 'lit';
import { EVENT_CHANGE } from '../constants.js';
import { renderSpIcon } from '../constants/icon-library.js';
import { fieldStatusStyles } from '../common/fields/field-status.css.js';
import { imageRowStyles } from '../common/fields/image-row.css.js';
import { imageAddIcon } from '../icons.js';
import '../mas-mnemonic-modal.js';

/** Item state of a visual inherited from a baseline (other states are the variation ones, e.g. `overridden`). */
export const BASELINE_FIELD_STATE = 'baseline';

class MnemonicField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
            iconLibrary: { type: Boolean, state: true },
            badgeIcon: { type: Boolean },
            variant: { type: String },
            fieldState: { type: String, attribute: 'data-field-state' },
        };
    }

    static styles = [
        fieldStatusStyles,
        imageRowStyles,
        css`
            :host {
                display: block;
            }

            .icon-placeholder {
                width: 40px;
                height: 40px;
                background: var(--spectrum-gray-200);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--spectrum-gray-600);
            }

            .add-button-wrapper {
                display: flex;
            }

            .add-button-wrapper--quiet {
                justify-content: center;
            }

            .add-button-wrapper--quiet sp-action-button {
                flex: 0 0 auto;
            }

            .mnemonic-info {
                flex: 1;
                min-width: 0;
            }

            .mnemonic-info .empty {
                color: var(--spectrum-gray-500);
                font-style: italic;
            }

            :host([data-field-state='overridden']) .mnemonic-preview {
                border: 2px solid var(--spectrum-blue-400);
                background-color: var(--spectrum-blue-100);
            }
        `,
    ];

    constructor() {
        super();
        this.icon = '';
        this.alt = '';
        this.link = '';
        this.modalOpen = false;
        this.iconLibrary = false;
        this.badgeIcon = false;
        this.variant = '';
    }

    #handleEditClick() {
        this.modalOpen = true;
    }

    openModal() {
        this.#handleEditClick();
    }

    #handleModalClose() {
        this.modalOpen = false;
        // If field is empty (no icon selected), remove it
        if (!this.icon && !this.badgeIcon) {
            this.#handleDeleteClick();
        }
    }

    #handleDeleteClick() {
        if (this.iconLibrary) {
            this.icon = '';
            this.dispatchEvent(
                new CustomEvent(EVENT_CHANGE, {
                    bubbles: true,
                    composed: true,
                    detail: this,
                }),
            );
            return;
        }

        this.dispatchEvent(
            new CustomEvent('delete-field', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    #stopEvent = (event) => event.stopPropagation();

    #handleRowClick() {
        this.#handleEditClick();
    }

    #handleRowKeydown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.#handleEditClick();
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
        const { icon, alt, link } = event.detail;
        this.icon = icon;
        this.alt = alt;
        this.link = link;
        this.modalOpen = false;
        this.#blurFocusedElement();

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
        if (this.iconLibrary && this.icon.startsWith('sp-icon-')) {
            return html`${renderSpIcon(this.icon, this.variant)}`;
        } else {
            return html`<img
                src="${this.icon}"
                alt="${this.alt || 'Icon preview'}"
                @error=${(e) => (e.target.style.display = 'none')}
            />`;
        }
    }

    /** The parent multifield skips re-rendering while focus is inside a field, which would keep this field's state stale. */
    #blurFocusedElement() {
        let element = this.shadowRoot.activeElement;
        while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
        element?.blur();
    }

    #handleRestoreClick(event) {
        event.preventDefault();
        event.currentTarget.blur();
        this.dispatchEvent(new CustomEvent('restore-field', { bubbles: true, composed: true }));
    }

    get fieldStatusIndicator() {
        if (this.iconLibrary) return nothing;
        if (this.fieldState === BASELINE_FIELD_STATE) {
            return html`<div class="field-status-indicator field-status-indicator--baseline">
                <span class="field-status-label">From baseline</span>
            </div>`;
        }
        if (this.fieldState !== 'overridden') return nothing;
        return html`<div class="field-status-indicator">
            <sp-icon-unlink class="field-status-icon"></sp-icon-unlink>
            <span class="field-status-label">Overridden.</span>
            <a href="#" class="field-status-restore-link" @click=${this.#handleRestoreClick}
                ><span class="field-status-restore-link-prefix" aria-hidden="true">Overridden. </span>
                <span class="field-status-restore-link-text">Click to restore.</span></a
            >
        </div>`;
    }

    get addButtonTemplate() {
        return html`
            <div class="add-button-wrapper add-button-wrapper--quiet">
                <sp-action-button quiet @click=${this.#handleEditClick}>
                    <span slot="icon">${imageAddIcon}</span>Add icon
                </sp-action-button>
            </div>
        `;
    }

    get rowTemplate() {
        return html`
            <div
                class="image-row mnemonic-preview ${this.iconLibrary ? 'icon-library' : ''}"
                role="button"
                tabindex="0"
                @click=${this.#handleRowClick}
                @keydown=${this.#handleRowKeydown}
            >
                <div class="image-row-icon">
                    ${this.icon
                        ? html`${this.renderIcon()}`
                        : html`<div class="icon-placeholder">
                              <sp-icon-image size="m"></sp-icon-image>
                          </div>`}
                </div>

                <div class="image-row-text mnemonic-info">
                    <div class="image-row-name">${this.#getDisplayText(this.#getIconName(), 'No icon selected')}</div>
                    ${this.alt ? html`<div class="image-row-description">${this.alt}</div>` : nothing}
                </div>

                <sp-action-menu
                    class="action-menu"
                    quiet
                    size="s"
                    placement="bottom-end"
                    @click=${this.#stopEvent}
                    @keydown=${this.#stopEvent}
                    @change=${this.#handleMenuChange}
                >
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
        `;
    }

    render() {
        return html`
            ${this.badgeIcon && !this.icon ? this.addButtonTemplate : this.rowTemplate}
            <mas-mnemonic-modal
                ?open=${this.modalOpen}
                .badgeIcon=${this.badgeIcon}
                .icon=${this.icon}
                .alt=${this.alt}
                .link=${this.link}
                .variant=${this.variant}
                .iconLibrary="${this.iconLibrary}"
                @modal-close=${this.#handleModalClose}
                @save=${this.#handleModalSave}
            ></mas-mnemonic-modal>
            ${this.fieldStatusIndicator}
        `;
    }
}

customElements.define('mas-mnemonic-field', MnemonicField);
