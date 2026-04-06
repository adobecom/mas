import { html, LitElement, nothing } from 'lit';
import { EVENT_INPUT } from '../constants.js';
import { QUANTITY_SELECT_TAG } from '../common/fields/quantity-select.js';

const QUANTITY_EMPTY = `<${QUANTITY_SELECT_TAG}/>`;

export class QuantitySelectField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        settingsDefaults: { type: String },
        checked: { type: Boolean, state: true },
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
        this.disabled = false;
        this.checked = false;
        this.indicatorTemplate = nothing;
        this.fieldIndicatorTemplate = nothing;
        this.handleQuantityFieldChange = () => {};
    }

    createRenderRoot() {
        return this;
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            this.checked = !!this.value && this.value !== QUANTITY_EMPTY;
        }
    }

    #handleToggle(e) {
        this.checked = e.target.checked;
        if (!this.checked) {
            this.handleQuantityFieldChange({
                detail: {
                    value: QUANTITY_EMPTY,
                },
            });
        } else {
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

    get fields() {
        if (!this.checked) return nothing;
        return html`
            <quantity-select-field
                .value=${this.value}
                @change=${this.handleQuantityFieldChange}
                .fieldIndicatorTemplate=${this.fieldIndicatorTemplate}
            ></quantity-select-field>
        `;
    }

    render() {
        if (!this.settingsDefaults) return nothing;
        return html`
            <sp-field-group id="${this.id}">
                <div class="field-row">
                    <sp-switch id="${this.id}-toggle" size="m" .checked="${this.checked}" @change="${this.#handleToggle}"
                        >${this.label}</sp-switch
                    >
                    ${this.indicatorTemplate}
                </div>
                <div>${this.fields}</div>
            </sp-field-group>
        `;
    }
}

customElements.define('quantity-select-settings-field', QuantitySelectField);
