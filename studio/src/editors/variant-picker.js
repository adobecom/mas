import { html, LitElement, css } from 'lit';

export const VARIANT_NAMES = {
    ALL: 'all',
    CATALOG: 'catalog',
    PLANS: 'plans',
    PLANS_V2: 'plans-v2',
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

export const SURFACES = {
    ACOM: 'acom',
    ADOBE_HOME: 'adobe-home',
    CCD: 'ccd',
    COMMERCE: 'commerce',
    DOCS: 'docs',
    EXPRESS: 'express',
    MAS: 'mas',
    NALA: 'nala',
    PROMOTIONS: 'promotions',
    SANDBOX: 'sandbox',
};
export const VARIANTS = [
    { label: 'All', value: VARIANT_NAMES.ALL, surface: 'all' },
    { label: 'Catalog', value: VARIANT_NAMES.CATALOG, surface: SURFACES.ACOM },
    { label: 'Plans', value: VARIANT_NAMES.PLANS, surface: SURFACES.ACOM },
    {
        label: 'Plans v2',
        value: VARIANT_NAMES.PLANS_V2,
        surface: 'acom',
    },
    {
        label: 'Plans Students',
        value: VARIANT_NAMES.PLANS_STUDENTS,
        surface: SURFACES.ACOM,
    },
    {
        label: 'Plans Education',
        value: VARIANT_NAMES.PLANS_EDUCATION,
        surface: SURFACES.ACOM,
    },
    { label: 'Slice', value: VARIANT_NAMES.SLICES, surface: SURFACES.CCD },
    {
        label: 'Special offers',
        value: VARIANT_NAMES.SPECIAL_OFFERS,
        surface: SURFACES.ACOM,
    },
    { label: 'Suggested', value: VARIANT_NAMES.SUGGESTED, surface: SURFACES.CCD },
    {
        label: 'Try Buy Widget',
        value: VARIANT_NAMES.TRY_BUY_WIDGET,
        surface: SURFACES.ADOBE_HOME,
    },
    {
        label: 'Promoted Plans',
        value: VARIANT_NAMES.PROMOTED_PLANS,
        surface: SURFACES.ADOBE_HOME,
    },
    {
        label: 'Fries',
        value: VARIANT_NAMES.FRIES,
        surface: SURFACES.COMMERCE,
    },
    {
        label: 'Simplified pricing Express',
        value: VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS,
        surface: SURFACES.EXPRESS,
    },
    {
        label: 'Mini',
        value: VARIANT_NAMES.MINI,
        surface: SURFACES.CCD,
    },
    {
        label: 'Full Pricing Express',
        value: 'full-pricing-express',
        surface: SURFACES.EXPRESS,
    },
];

class VariantPicker extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
        }

        sp-picker {
            width: 100%;
        }
    `;

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
