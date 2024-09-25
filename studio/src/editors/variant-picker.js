import { html, LitElement } from 'lit';

//TODO make that feed (excepts ALL maybe) dynamically served from milo
const VARIANTS = [
    { label: 'All', value: 'all', surface: 'all' },
    { label: 'Catalog', value: 'catalog', surface: 'acom' },
    { label: 'CCD Action', value: 'ccd-action', surface: 'ccd' },
    { label: 'Slice', value: 'ccd-slice', surface: 'ccd' },
    { label: 'Special offers', value: 'special-offers', surface: 'acom' },
];

class VariantPicker extends LitElement {
    static properties = {
        defaultValue: { type: String, attribute: 'default-value' },
        showAll: { type: Boolean, attribute: 'show-all' },
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
        >
            ${this.variants}
        </sp-picker>`;
    }
}

customElements.define('variant-picker', VariantPicker);
