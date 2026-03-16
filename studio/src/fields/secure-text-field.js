import { css, html, LitElement } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class SecureTextField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        checked: { type: Boolean, state: true },
    };

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .field-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            ::slotted(.setting-override-indicator) {
                flex: none;
            }

            .field-row sp-switch {
                flex: none;
            }

            :host([data-field-state='overridden']) sp-switch[checked] {
                --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
                --mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
            }
        `;
    }

    constructor() {
        super();
        this.id = '';
        this.label = '';
        this.value = '';
        this.disabled = false;
        this.checked = false;
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            this.checked = Boolean(this.value && this.value !== 'false');
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
                    <slot name="indicator"></slot>
                </div>
            </sp-field-group>
        `;
    }
}

customElements.define('secure-text-field', SecureTextField);
