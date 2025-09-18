import { LitElement, html, css } from 'lit';

/**
 * A modal editor for adding dividers to the RTE
 */
class RteDividerEditor extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        dialog: { type: Boolean, reflect: true },
        size: { type: String, reflect: true },
        vertical: { type: Boolean, reflect: true },
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

            .form-field sp-picker {
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
        this.size = 's';
        this.vertical = false;

        // Prevent events from propagating outside the component
        this.addEventListener('change', (e) => {
            e.stopImmediatePropagation();
        });
    }

    firstUpdated() {
        this.sizeSelect = this.shadowRoot.querySelector('#size');
        this.verticalCheckbox = this.shadowRoot.querySelector('#vertical');
    }

    updated(changedProperties) {
        if (changedProperties.has('size') && this.sizeSelect) {
            this.sizeSelect.value = this.size;
        }
        if (changedProperties.has('vertical') && this.verticalCheckbox) {
            this.verticalCheckbox.checked = this.vertical;
        }
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: false, composed: true }));
    }

    #handleSubmit(e) {
        e.preventDefault();
        const size = this.sizeSelect.value;
        const vertical = this.verticalCheckbox.checked;

        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: false,
                composed: true,
                detail: {
                    size,
                    vertical,
                },
            }),
        );

        this.#handleClose();
    }

    get #editor() {
        return html`
            <sp-dialog close=${this.#handleClose}>
                <h2 slot="heading">Add Divider</h2>
                <p>Add a divider to separate content sections</p>
                <form @submit=${this.#handleSubmit}>
                    <div class="form-field">
                        <sp-field-label for="size">Size</sp-field-label>
                        <sp-picker id="size" .value=${this.size}>
                            <sp-menu-item value="s">Small</sp-menu-item>
                            <sp-menu-item value="m">Medium</sp-menu-item>
                            <sp-menu-item value="l">Large</sp-menu-item>
                        </sp-picker>
                    </div>
                    <div class="form-field">
                        <sp-checkbox id="vertical" .checked=${this.vertical}> Vertical orientation </sp-checkbox>
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
                <sp-button id="saveButton" slot="button" variant="accent" @click=${this.#handleSubmit}> Add Divider </sp-button>
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

customElements.define('rte-divider-editor', RteDividerEditor);
