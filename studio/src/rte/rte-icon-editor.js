import { css, html, LitElement } from 'lit';

export class RteIconEditor extends LitElement {
    static properties = {
        open: { type: Boolean },
        dialog: { type: Boolean },
        tooltip: { type: String },
    };

    static styles = css`
        :host {
            display: block;
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
            max-width: 600px;
        }
    `;

    constructor() {
        super();
        this.dialog = false;
        this.tooltip = '';
    }

    get #editor() {
        return html`<sp-dialog close=${this.#handleClose}>
            <h2 slot="heading">Insert Info Icon</h2>
            <sp-field-label for="tooltip">Tooltip</sp-field-label>
            <sp-textfield
                id="tooltip"
                placeholder="Enter the tooltip text"
                .value=${this.tooltip}
                @input=${(e) => (this.tooltip = e.target.value)}
            ></sp-textfield>
            <sp-button
                id="cancelButton"
                slot="button"
                variant="secondary"
                treatment="outline"
                @click=${this.#handleClose}
                type="button"
                >Cancel</sp-button
            >
            <sp-button id="saveButton" slot="button" variant="accent" @click=${this.#handleSave}>Insert</sp-button>
        </sp-dialog>`;
    }

    get #asDialog() {
        return html`
            <sp-underlay ?open=${this.open}></sp-underlay>
            ${this.#editor}
        `;
    }

    #handleSave(e) {
        e.preventDefault();
        const data = {
            tooltip: this.tooltip,
        };
        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: data,
            }),
        );
        this.#handleClose();
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: false, composed: true }));
    }

    render() {
        if (this.dialog) return this.#asDialog;
        return this.#editor;
    }
}

customElements.define('rte-icon-editor', RteIconEditor);
