import { html, LitElement, nothing } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class PlanTypeField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        checked: { type: Boolean, state: true },
        indicatorTemplate: { attribute: false },
    };

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.disabled = false;
        this.checked = false;
        this.indicatorTemplate = nothing;
    }

    createRenderRoot() {
        return this;
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            this.checked = `${this.value}` === 'true';
        }
    }

    #handleToggle(e) {
        this.checked = e.target.checked;
        this.value = this.checked ? 'true' : 'false';
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

    render() {
        return html`
            <sp-field-group id="${this.id}">
                <div class="field-row">
                    <sp-switch id="${this.id}-toggle" size="m" .checked="${this.checked}" @change="${this.#handleToggle}"
                        >${this.label}</sp-switch
                    >
                    ${this.indicatorTemplate}
                </div>
            </sp-field-group>
        `;
    }
}

customElements.define('mas-plan-type-field', PlanTypeField);
