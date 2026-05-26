import { html, LitElement, nothing } from 'lit';
import { EVENT_INPUT } from '../constants.js';
import { QUANTITY_SELECT_TAG } from '../common/fields/quantity-select.js';

const QUANTITY_EMPTY = `<${QUANTITY_SELECT_TAG}/>`;
const QUANTITY_NOT_EMPTY = `<${QUANTITY_SELECT_TAG} title="" min="1" max="10" step="1"></${QUANTITY_SELECT_TAG}>`;

export class QuantitySelectSettingsField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        settingsDefaults: { type: String },
        indicatorTemplate: { attribute: false },
        fieldIndicatorTemplate: { attribute: false },
        handleQuantityFieldChange: { type: Function, attribute: false },
    };

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.settingsDefaults = '';
        this.indicatorTemplate = nothing;
        this.fieldIndicatorTemplate = nothing;
        this.handleQuantityFieldChange = () => {};
    }

    createRenderRoot() {
        return this;
    }

    #handleToggle(e) {
        this.value = e.target.checked ? QUANTITY_NOT_EMPTY : QUANTITY_EMPTY;
        this.handleQuantityFieldChange({
            detail: {
                value: this.value,
            },
        });
        this.dispatchInputEvent();
    }

    dispatchInputEvent() {
        const inputEvent = new CustomEvent(EVENT_INPUT, {
            bubbles: true,
            composed: true,
            detail: this,
        });
        this.dispatchEvent(inputEvent);
    }

    #isChecked() {
        return !!this.value && this.value !== QUANTITY_EMPTY;
    }

    get fields() {
        if (!this.#isChecked()) return nothing;
        return html`
            <quantity-select-field
                .value=${this.value}
                @change=${this.handleQuantityFieldChange}
                .fieldIndicatorTemplate=${this.fieldIndicatorTemplate}
            ></quantity-select-field>
        `;
    }

    render() {
        return html`
            <sp-field-group id="${this.id}">
                <div class="field-row">
                    <sp-switch id="${this.id}-toggle" size="m" .checked="${this.#isChecked()}" @change="${this.#handleToggle}"
                        >${this.label}</sp-switch
                    >
                    ${this.indicatorTemplate}
                </div>
                <div>${this.fields}</div>
            </sp-field-group>
        `;
    }
}

customElements.define('quantity-select-settings-field', QuantitySelectSettingsField);
