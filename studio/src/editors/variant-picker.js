import { html, LitElement } from 'lit';

export const VARIANT_NAMES = {
    ALL: 'all',
    CATALOG: 'catalog',
    PLANS: 'plans',
    PLANS_STUDENTS: 'plans-students',
    PLANS_EDUCATION: 'plans-education',
    SLICES: 'ccd-slice',
    SPECIAL_OFFERS: 'special-offers',
    SUGGESTED: 'ccd-suggested',
    TRY_BUY_WIDGET: 'ah-try-buy-widget',
    PROMOTED_PLANS: 'ah-promoted-plans',
    FRIES: 'fries',
    MINI: 'mini',
    SIMPLIFIED_PRICING_EXPRESS: 'simplified-pricing-express',
};
//TODO make that feed (excepts ALL maybe) dynamically served from milo
export const VARIANTS = [
    { label: 'All', value: VARIANT_NAMES.ALL, surface: 'all' },
    { label: 'Catalog', value: VARIANT_NAMES.CATALOG, surface: 'acom' },
    { label: 'Plans', value: VARIANT_NAMES.PLANS, surface: 'acom' },
    {
        label: 'Plans Students',
        value: VARIANT_NAMES.PLANS_STUDENTS,
        surface: 'acom',
    },
    {
        label: 'Plans Education',
        value: VARIANT_NAMES.PLANS_EDUCATION,
        surface: 'acom',
    },
    { label: 'Slice', value: VARIANT_NAMES.SLICES, surface: 'ccd' },
    {
        label: 'Special offers',
        value: VARIANT_NAMES.SPECIAL_OFFERS,
        surface: 'acom',
    },
    { label: 'Suggested', value: VARIANT_NAMES.SUGGESTED, surface: 'ccd' },
    {
        label: 'Try Buy Widget',
        value: VARIANT_NAMES.TRY_BUY_WIDGET,
        surface: 'adobe-home',
    },
    {
        label: 'Promoted Plans',
        value: VARIANT_NAMES.PROMOTED_PLANS,
        surface: 'adobe-home',
    },
    {
        label: 'Fries',
        value: VARIANT_NAMES.FRIES,
        surface: 'commerce',
    },
    {
        label: 'Simplified pricing Express',
        value: VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS,
        surface: 'acom',
    },
    {
        label: 'Mini',
        value: VARIANT_NAMES.MINI,
        surface: 'acom',
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
