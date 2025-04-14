import { html, LitElement } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class SecureTextField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        isEditable: { type: Boolean, state: true },
        showSecureTextField: { type: Boolean, state: true }
    };

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.disabled = false;
        this.isEditable = false;
        this.showSecureTextField = true;
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            if (!this.value || this.value === '') {
                this.isEditable = false;
                this.showSecureTextField = true;
            } else {
                this.isEditable = true;
                this.showSecureTextField = this.value !== 'false';
            }
        }
    }

    #handleToggle(e) {
        this.isEditable = e.target.checked;
        if (this.isEditable) {
            this.value = this.showSecureTextField ? '' : 'false';
            this.dispatchInputEvent(this.value);
        } else {
            this.value = '';
            this.dispatchInputEvent(this.value);
        }
    }

    #handleCheckbox(e) {
        this.showSecureTextField = e.target.checked;
        if (this.isEditable) {
            this.value = e.target.checked ? '' : 'false';
            this.dispatchInputEvent(this.value);
        }
    }

    dispatchInputEvent() {
        const inputEvent = new CustomEvent(EVENT_INPUT, {
            bubbles: true,
            composed: true,
            detail: this
        });
        this.dispatchEvent(inputEvent);
    }

    render() {
        return html`
            <sp-field-group id="${this.id}">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <sp-field-label for="${this.id}">${this.label}</sp-field-label>
                    <sp-switch 
                        id="${this.id}-toggle"
                        size="m"
                        .checked="${this.isEditable}"
                        @change="${this.#handleToggle}"
                    ></sp-switch>
                </div>
                <sp-checkbox
                    size="m"
                    .checked="${this.showSecureTextField}"
                    ?disabled="${!this.isEditable}"
                    @change="${this.#handleCheckbox}"
                >Show Secure Transaction Label</sp-checkbox>
            </sp-field-group>
        `;
    }
}

customElements.define('secure-text-field', SecureTextField);
