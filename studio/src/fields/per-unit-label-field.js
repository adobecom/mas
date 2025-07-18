import { LitElement, html, css } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class PerUnitLabelField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        isEditable: { type: Boolean, state: true },
        perUnitLabelText: { type: String, state: true },
    };

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.disabled = false;
        this.isEditable = false;
        this.perUnitLabelText = '';
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            div {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
        `;
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            // Only update the text content, don't change the enabled state
            // based on whether there's a value or not
            this.perUnitLabelText = this.value || '';
        }
    }

    #handleToggle(e) {
        this.isEditable = e.target.checked;
        if (this.isEditable) {
            this.value = this.perUnitLabelText || '';
            this.dispatchInputEvent(this.value);
        } else {
            this.value = '';
            this.perUnitLabelText = '';
            this.dispatchInputEvent(this.value);
        }
    }

    #handleTextInput(e) {
        this.perUnitLabelText = e.target.value;
        if (this.isEditable) {
            this.value = e.target.value;
            this.dispatchInputEvent();
        }
    }

    dispatchInputEvent() {
        const inputEvent = new CustomEvent(EVENT_INPUT, {
            bubbles: true,
            composed: true,
            detail: this,
        });
        this.dispatchEvent(inputEvent);
    }

    render() {
        return html`
            <div>
                <sp-field-label for="${this.id}">${this.label}</sp-field-label>
                <sp-switch
                    id="${this.id}-toggle"
                    size="m"
                    .checked="${this.isEditable}"
                    @change="${this.#handleToggle}"
                ></sp-switch>
            </div>
            <sp-textfield
                id="${this.id}-text"
                placeholder="Enter per unit label text"
                value="${this.perUnitLabelText}"
                ?disabled="${!this.isEditable}"
                @input="${this.#handleTextInput}"
            ></sp-textfield>
        `;
    }
}

customElements.define('mas-per-unit-label-field', PerUnitLabelField);
