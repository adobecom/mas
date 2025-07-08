import { html, LitElement } from 'lit';

//TODO make that feed (excepts ALL maybe) dynamically served from milo
export const VARIANTS = [
    { label: 'All', value: 'all', surface: 'all' },
    { label: 'Catalog', value: 'catalog', surface: 'acom' },
    { label: 'Plans', value: 'plans', surface: 'acom' },
    { label: 'Plans Students', value: 'plans-students', surface: 'acom' },
    { label: 'Plans Education', value: 'plans-education', surface: 'acom' },
    { label: 'Slice', value: 'ccd-slice', surface: 'ccd' },
    { label: 'Special offers', value: 'special-offers', surface: 'acom' },
    { label: 'Suggested', value: 'ccd-suggested', surface: 'ccd' },
    {
        label: 'Try Buy Widget',
        value: 'ah-try-buy-widget',
        surface: 'adobe-home',
    },
    {
        label: 'Promoted Plans',
        value: 'ah-promoted-plans',
        surface: 'adobe-home',
    },
    {
        label: 'Fries',
        value: 'fries',
        surface: 'commerce',
    },
    {
        label: 'Simplified pricing Express',
        value: 'simplified-pricing-express',
        surface: 'express',
    },
];

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
        return VARIANTS.filter((variant) => this.showAll || variant.value != 'all').map(
            (variant) => html`<sp-menu-item value="${variant.value}">${variant.label}</sp-menu-item>`,
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
