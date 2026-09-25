import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { groupBySelectStyles } from './mas-group-by-select.css.js';

class MasGroupBySelect extends LitElement {
    static styles = [groupBySelectStyles];

    static properties = {
        label: { type: String },
        options: { type: Array },
        value: { type: String },
        disabled: { type: Boolean, reflect: true },
    };

    constructor() {
        super();
        this.label = 'Group by';
        this.options = [];
        this.value = '';
        this.disabled = false;
    }

    #onChange(e) {
        e.stopPropagation();
        if (this.disabled) return;
        const value = e.currentTarget.selected?.[0];
        if (value == null || value === this.value) return;
        this.value = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
    }

    render() {
        return html`<div class="group-by-toolbar">
            <span class="group-by-label">${this.label}</span>
            <sp-action-group class="group-by-track" selects="single" @change=${(e) => this.#onChange(e)}>
                ${repeat(
                    this.options,
                    (option) => option.value,
                    (option) =>
                        html`<sp-action-button
                            value=${option.value}
                            ?selected=${option.value === this.value}
                            ?disabled=${this.disabled}
                        >
                            ${option.label}
                        </sp-action-button>`,
                )}
            </sp-action-group>
        </div>`;
    }
}

export default MasGroupBySelect;
export { MasGroupBySelect };
customElements.define('mas-group-by-select', MasGroupBySelect);
