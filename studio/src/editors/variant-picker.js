import { html, LitElement } from 'lit';
import { VARIANTS } from '../constants.js';

class VariantPicker extends LitElement {
    static properties = {
        defaultValue: { type: String, attribute: 'default-value' },
        showAll: { type: Boolean, attribute: 'show-all' },
        disabled: { type: Boolean, attribute: 'disabled' },
    };

    get value() {
        return this.shadowRoot.querySelector('sp-picker')?.value;
    }

    get variants() {
        return VARIANTS.filter(
            (variant) => this.showAll || variant.value != 'all',
        ).map(
            (variant) =>
                html`<sp-menu-item value="${variant.value}"
                    >${variant.label}</sp-menu-item
                >`,
        );
    }

    render() {
        return html`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value || this.defaultValue}
            ?disabled=${this.disabled}
        >
            ${this.variants}
        </sp-picker>`;
    }
}

customElements.define('variant-picker', VariantPicker);
