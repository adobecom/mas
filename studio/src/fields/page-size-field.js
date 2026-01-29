import { css, html, LitElement, nothing } from 'lit';
import { EVENT_INPUT } from '../constants.js';

export class PageSizeField extends LitElement {
    static properties = {
        id: { type: String },
        label: { type: String },
        value: { type: String },
        enabled: { type: Boolean, state: true },
        pageSize: { type: Number, state: true },
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

            .page-size-input {
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
        this.id = 'page-size';
        this.label = 'Show More Pagination';
        this.value = '';
        this.enabled = false;
        this.pageSize = 27; // Default page size matching catalog
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            this.#parseValue();
        }
    }

    #parseValue() {
        if (!this.value || this.value === '') {
            this.enabled = false;
            // Don't reset pageSize when value is cleared - preserve it for re-enabling
        } else {
            const parsed = parseInt(this.value, 10);
            if (!isNaN(parsed) && parsed > 0) {
                this.enabled = true;
                this.pageSize = parsed;
            } else {
                this.enabled = false;
                // Don't reset pageSize for invalid values - preserve current pageSize
            }
        }
    }

    #handleToggle(e) {
        this.enabled = e.target.checked;
        if (this.enabled) {
            this.value = String(this.pageSize);
        } else {
            this.value = '';
        }
        this.#dispatchInputEvent();
    }

    #handlePageSizeChange(e) {
        const newPageSize = parseInt(e.target.value, 10);
        if (!isNaN(newPageSize) && newPageSize > 0) {
            this.pageSize = newPageSize;
            this.value = String(this.pageSize);
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
                          <div class="page-size-input">
                              <sp-field-label for="${this.id}-value">Initial cards to display</sp-field-label>
                              <sp-number-field
                                  id="${this.id}-value"
                                  .value="${this.pageSize}"
                                  min="1"
                                  max="100"
                                  step="1"
                                  @change="${this.#handlePageSizeChange}"
                              ></sp-number-field>
                          </div>
                      `
                    : nothing}
            </sp-field-group>
        `;
    }
}

customElements.define('mas-page-size-field', PageSizeField);
