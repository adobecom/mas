import { css, html, LitElement, nothing } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class PaginationLimitField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        enabled: { type: Boolean, state: true },
        limit: { type: Number, state: true },
    };

    static get styles() {
        return css`
            :host {
                display: block;
                --spectrum-fieldgroup-margin: 0;
            }

            .field-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .limit-input {
                margin-top: 12px;
            }

            sp-number-field {
                width: 100%;
            }

            :host([data-field-state='overridden']) sp-switch[checked] {
                --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
                --mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
            }

            :host([data-field-state='overridden']) sp-number-field {
                --mod-textfield-border-color: var(--spectrum-blue-400);
                --mod-textfield-background-color: var(--spectrum-blue-100);
            }
        `;
    }

    constructor() {
        super();
        this.id = 'pagination-limit';
        this.label = 'Show More Pagination';
        this.value = '';
        this.enabled = false;
        this.limit = 27; // Default limit matching catalog
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            this.#parseValue();
        }
    }

    #parseValue() {
        if (!this.value || this.value === '') {
            this.enabled = false;
            // Don't reset limit when value is cleared - preserve it for re-enabling
        } else {
            const parsed = parseInt(this.value, 10);
            if (!isNaN(parsed) && parsed > 0) {
                this.enabled = true;
                this.limit = parsed;
            } else {
                this.enabled = false;
                // Don't reset limit for invalid values - preserve current limit
            }
        }
    }

    #handleToggle(e) {
        this.enabled = e.target.checked;
        if (this.enabled) {
            this.value = String(this.limit);
        } else {
            this.value = '';
        }
        this.#dispatchInputEvent();
    }

    #handleLimitChange(e) {
        const newLimit = parseInt(e.target.value, 10);
        if (!isNaN(newLimit) && newLimit > 0) {
            this.limit = newLimit;
            this.value = String(this.limit);
            this.#dispatchInputEvent();
        }
    }

    #dispatchInputEvent() {
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
                    <sp-field-label for="${this.id}-toggle">${this.label}</sp-field-label>
                    <sp-switch
                        id="${this.id}-toggle"
                        size="m"
                        .checked="${this.enabled}"
                        @change="${this.#handleToggle}"
                    ></sp-switch>
                </div>
                ${this.enabled
                    ? html`
                          <div class="limit-input">
                              <sp-field-label for="${this.id}-limit">Initial cards to display</sp-field-label>
                              <sp-number-field
                                  id="${this.id}-limit"
                                  .value="${this.limit}"
                                  min="1"
                                  max="100"
                                  step="1"
                                  @change="${this.#handleLimitChange}"
                              ></sp-number-field>
                          </div>
                      `
                    : nothing}
            </sp-field-group>
        `;
    }
}

customElements.define('mas-pagination-limit-field', PaginationLimitField);
