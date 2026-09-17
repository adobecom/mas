import { LitElement, html, css } from 'lit';

class MasBackgroundsModal extends LitElement {
    #originalDesktop = '';
    #originalTablet = '';
    #originalMobile = '';

    static properties = {
        open: { type: Boolean, reflect: true },
        desktop: { type: String },
        tablet: { type: String },
        mobile: { type: String },
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
            max-width: 560px;
            max-height: 90vh;
            --spectrum-dialog-footer-display: flex;
            --spectrum-dialog-footer-justify-content: space-between;
            --spectrum-dialog-footer-padding-top: 16px;
            --spectrum-dialog-footer-border-top: 1px solid var(--spectrum-gray-200);
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
        this.desktop = '';
        this.tablet = '';
        this.mobile = '';
    }

    #storeOriginalValues() {
        this.#originalDesktop = this.desktop;
        this.#originalTablet = this.tablet;
        this.#originalMobile = this.mobile;
    }

    updated(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.#storeOriginalValues();
        }
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    }

    #handleCancel() {
        this.desktop = this.#originalDesktop;
        this.tablet = this.#originalTablet;
        this.mobile = this.#originalMobile;
        this.#handleClose();
    }

    #handleSubmit(e) {
        e.preventDefault();
        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    desktop: this.desktop || '',
                    tablet: this.tablet || '',
                    mobile: this.mobile || '',
                },
            }),
        );
        this.#handleClose();
    }

    render() {
        const isEditing = !!(this.desktop || this.tablet || this.mobile);

        return html`
            <div @input=${(e) => e.stopPropagation()} @change=${(e) => e.stopPropagation()}>
                <sp-underlay ?open=${this.open}></sp-underlay>
                <sp-dialog>
                    <h2 slot="heading">${isEditing ? 'Edit' : 'Add'} Backgrounds</h2>

                    <form @submit=${this.#handleSubmit}>
                        <div class="form-field">
                            <sp-field-label for="backgrounds-desktop">Desktop</sp-field-label>
                            <sp-textfield
                                id="backgrounds-desktop"
                                placeholder="https://example.aem.page/desktop.png"
                                value="${this.desktop}"
                                @input=${(e) => (this.desktop = e.target.value)}
                            ></sp-textfield>
                        </div>
                        <div class="form-field">
                            <sp-field-label for="backgrounds-tablet">Tablet</sp-field-label>
                            <sp-textfield
                                id="backgrounds-tablet"
                                placeholder="https://example.aem.page/tablet.png"
                                value="${this.tablet}"
                                @input=${(e) => (this.tablet = e.target.value)}
                            ></sp-textfield>
                        </div>
                        <div class="form-field">
                            <sp-field-label for="backgrounds-mobile">Mobile</sp-field-label>
                            <sp-textfield
                                id="backgrounds-mobile"
                                placeholder="https://example.aem.page/mobile.png"
                                value="${this.mobile}"
                                @input=${(e) => (this.mobile = e.target.value)}
                            ></sp-textfield>
                        </div>
                    </form>

                    <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.#handleCancel} type="button">
                        Cancel
                    </sp-button>
                    <sp-button slot="button" variant="accent" @click=${this.#handleSubmit}>
                        ${isEditing ? 'Update' : 'Add'} Backgrounds
                    </sp-button>
                </sp-dialog>
            </div>
        `;
    }
}

customElements.define('mas-backgrounds-modal', MasBackgroundsModal);
