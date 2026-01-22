import { css, html, LitElement } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class PlanTypeField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        isEditable: { type: Boolean, state: true },
        showPlanType: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.disabled = false;
        this.isEditable = false;
        this.showPlanType = true;
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

            :host([data-field-state='overridden']) sp-switch[checked] {
                --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
                --mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
            }

            :host([data-field-state='overridden']) sp-checkbox[checked] {
                --mod-checkbox-checkmark-color: var(--spectrum-white);
                --mod-checkbox-background-color-selected-default: var(--spectrum-blue-500);
            }
        `;
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            if (!this.value) {
                this.isEditable = false;
                this.showPlanType = true;
            } else {
                this.isEditable = true;
                this.showPlanType = this.value !== 'false';
            }
        }
    }

    #handleToggle(e) {
        this.isEditable = e.target.checked;
        if (this.isEditable) {
            this.value = this.showPlanType ? '' : 'false';
            this.dispatchInputEvent(this.value);
        } else {
            this.value = '';
            this.dispatchInputEvent(this.value);
        }
    }

    #handleCheckbox(e) {
        this.showPlanType = e.target.checked;
        if (this.isEditable) {
            this.value = e.target.checked ? '' : 'false';
            this.dispatchInputEvent(this.value);
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
            <sp-field-group id="${this.id}">
                <div>
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
                    .checked="${this.showPlanType}"
                    ?disabled="${!this.isEditable}"
                    @change="${this.#handleCheckbox}"
                    >Show Plan Type text</sp-checkbox
                >
            </sp-field-group>
        `;
    }
}

customElements.define('mas-plan-type-field', PlanTypeField);
