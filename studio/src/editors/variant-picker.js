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
        initvalue: { type: String },
    };

    get value() {
        return this.querySelector('sp-picker')?.value;
    }

    createRenderRoot() {
        return this;
    }

    renderVariants = () => {
        return VARIANTS.map(
            (variant) =>
                html`<sp-menu-item value="${variant.value}"
                    >${variant.label}</sp-menu-item
                >`,
        );
    };

    handler = () => {
        this.dispatchEvent(new CustomEvent('selectionchange'));
    };

    render() {
        return html`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value || this.initvalue}
            @change="${this.handler}"
        >
            ${this.renderVariants()}
        </sp-picker>`;
    }
}

customElements.define('variant-picker', VariantPicker);
