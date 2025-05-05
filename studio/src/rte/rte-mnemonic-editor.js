import { LitElement, html, css } from 'lit';

/**
 * A modal editor for adding mnemonic images to the RTE
 */
class RteMnemonicEditor extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        dialog: { type: Boolean, reflect: true },
    };

    static get styles() {
        return css`
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
                z-index: 1;
                background: var(--spectrum-gray-100);
            }

            sp-dialog {
                width: 100%;
                max-width: 500px;
            }

            .form-field {
                margin-bottom: 8px;
            }

            .form-field sp-textfield {
                width: 100%;
            }

            /* Position buttons on left and right */
            sp-dialog::part(footer) {
                display: flex;
                justify-content: space-between;
                padding-top: 16px;
            }

            sp-button[slot='button'][variant='secondary'] {
                margin-right: auto;
            }

            sp-button[slot='button'][variant='accent'] {
                margin-left: auto;
            }
        `;
    }

    constructor() {
        super();
        this.dialog = false;
        this.open = false;

        // Prevent events from propagating outside the component
        this.addEventListener('change', (e) => {
            e.stopImmediatePropagation();
        });
    }

    firstUpdated() {
        this.imageUrlInput = this.shadowRoot.querySelector('#imageUrl');
        this.altTextInput = this.shadowRoot.querySelector('#altText');
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(
            new CustomEvent('close', { bubbles: false, composed: true }),
        );
    }

    #handleSubmit(e) {
        e.preventDefault();
        const imageUrl = this.imageUrlInput.value;
        const altText = this.altTextInput.value;

        if (!imageUrl.trim()) {
            return;
        }

        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    imageUrl,
                    altText,
                },
            }),
        );

        this.#handleClose();
    }

    get #editor() {
        return html`
            <sp-dialog close=${this.#handleClose}>
                <h2 slot="heading">Add Icon</h2>
                <form @submit=${this.#handleSubmit}>
                    <div class="form-field">
                        <sp-field-label for="imageUrl" required>
                            Icon URL
                        </sp-field-label>
                        <sp-textfield
                            id="imageUrl"
                            placeholder="https://example.com/icon.svg"
                        ></sp-textfield>
                    </div>
                    <div class="form-field">
                        <sp-field-label for="altText">Alt Text</sp-field-label>
                        <sp-textfield
                            id="altText"
                            placeholder="Descriptive text for accessibility"
                        ></sp-textfield>
                    </div>
                </form>
                <sp-button
                    id="cancelButton"
                    slot="button"
                    variant="secondary"
                    treatment="outline"
                    @click=${this.#handleClose}
                    type="button"
                >
                    Cancel
                </sp-button>
                <sp-button
                    id="saveButton"
                    slot="button"
                    variant="accent"
                    @click=${this.#handleSubmit}
                >
                    Add Icon
                </sp-button>
            </sp-dialog>
        `;
    }

    get #asDialog() {
        return html`
            <sp-underlay ?open=${this.open}></sp-underlay>
            ${this.#editor}
        `;
    }

    render() {
        if (this.dialog) return this.#asDialog;
        return this.#editor;
    }
}

customElements.define('rte-mnemonic-editor', RteMnemonicEditor);
