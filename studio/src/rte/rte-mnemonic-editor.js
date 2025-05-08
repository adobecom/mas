import { LitElement, html, css } from 'lit';

/**
 * A modal editor for adding mnemonic images to the RTE
 */
class RteMnemonicEditor extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        dialog: { type: Boolean, reflect: true },
        imageUrl: { type: String, reflect: true },
        altText: { type: String, reflect: true },
        size: { type: String, reflect: true },
        tooltipText: { type: String, reflect: true },
        tooltipPlacement: { type: String, reflect: true },
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
        this.imageUrl = '';
        this.altText = '';
        this.size = 'xs';
        this.tooltipText = '';
        this.tooltipPlacement = 'top';

        // Prevent events from propagating outside the component
        this.addEventListener('change', (e) => {
            e.stopImmediatePropagation();
        });
    }

    firstUpdated() {
        this.imageUrlInput = this.shadowRoot.querySelector('#imageUrl');
        this.altTextInput = this.shadowRoot.querySelector('#altText');
        this.sizeSelect = this.shadowRoot.querySelector('#size');
        this.tooltipTextInput = this.shadowRoot.querySelector('#tooltipText');
        this.tooltipPlacementSelect =
            this.shadowRoot.querySelector('#tooltipPlacement');
    }

    updated(changedProperties) {
        if (changedProperties.has('imageUrl') && this.imageUrlInput) {
            this.imageUrlInput.value = this.imageUrl;
        }
        if (changedProperties.has('altText') && this.altTextInput) {
            this.altTextInput.value = this.altText;
        }
        if (changedProperties.has('size') && this.sizeSelect) {
            this.sizeSelect.value = this.size;
        }
        if (changedProperties.has('tooltipText') && this.tooltipTextInput) {
            this.tooltipTextInput.value = this.tooltipText;
        }
        if (
            changedProperties.has('tooltipPlacement') &&
            this.tooltipPlacementSelect
        ) {
            this.tooltipPlacementSelect.value = this.tooltipPlacement;
        }
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
        const size = this.sizeSelect.value;
        const tooltipText = this.tooltipTextInput.value;
        const tooltipPlacement = this.tooltipPlacementSelect.value;

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
                    size,
                    tooltipText,
                    tooltipPlacement,
                },
            }),
        );

        this.#handleClose();
    }

    get #editor() {
        const isEditing = !!this.imageUrl;
        return html`
            <sp-dialog close=${this.#handleClose}>
                <h2 slot="heading">
                    ${isEditing ? 'Edit' : 'Add'} Inline Icon
                </h2>
                <p>
                    ${isEditing ? 'Edit the' : 'Add an'} icon that will appear
                    inline with your text
                </p>
                <form @submit=${this.#handleSubmit}>
                    <div class="form-field">
                        <sp-field-label for="imageUrl" required>
                            Icon URL
                        </sp-field-label>
                        <sp-textfield
                            id="imageUrl"
                            placeholder="https://example.com/icon.svg"
                            .value=${this.imageUrl}
                        ></sp-textfield>
                    </div>
                    <div class="form-field">
                        <sp-field-label for="altText">Alt Text</sp-field-label>
                        <sp-textfield
                            id="altText"
                            placeholder="Descriptive text for accessibility"
                            .value=${this.altText}
                        ></sp-textfield>
                    </div>
                    <div class="form-field">
                        <sp-field-label for="size">Size</sp-field-label>
                        <sp-picker id="size" .value=${this.size}>
                            <sp-menu-item value="xs">Extra Small</sp-menu-item>
                            <sp-menu-item value="s">Small</sp-menu-item>
                            <sp-menu-item value="m">Medium</sp-menu-item>
                            <sp-menu-item value="l">Large</sp-menu-item>
                        </sp-picker>
                    </div>
                    <div class="form-field">
                        <sp-field-label for="tooltipText"
                            >Tooltip Text</sp-field-label
                        >
                        <sp-textfield
                            id="tooltipText"
                            placeholder="Enter tooltip text (optional)"
                            .value=${this.tooltipText}
                        ></sp-textfield>
                    </div>
                    <div class="form-field">
                        <sp-field-label for="tooltipPlacement"
                            >Tooltip Placement</sp-field-label
                        >
                        <sp-picker
                            id="tooltipPlacement"
                            .value=${this.tooltipPlacement}
                        >
                            <sp-menu-item value="top">Top</sp-menu-item>
                            <sp-menu-item value="bottom">Bottom</sp-menu-item>
                            <sp-menu-item value="left">Left</sp-menu-item>
                            <sp-menu-item value="right">Right</sp-menu-item>
                            <sp-menu-item value="top-start"
                                >Top Start</sp-menu-item
                            >
                            <sp-menu-item value="top-end">Top End</sp-menu-item>
                            <sp-menu-item value="bottom-start"
                                >Bottom Start</sp-menu-item
                            >
                            <sp-menu-item value="bottom-end"
                                >Bottom End</sp-menu-item
                            >
                            <sp-menu-item value="left-start"
                                >Left Start</sp-menu-item
                            >
                            <sp-menu-item value="left-end"
                                >Left End</sp-menu-item
                            >
                            <sp-menu-item value="right-start"
                                >Right Start</sp-menu-item
                            >
                            <sp-menu-item value="right-end"
                                >Right End</sp-menu-item
                            >
                        </sp-picker>
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
                    ${isEditing ? 'Update' : 'Add'} Icon
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
