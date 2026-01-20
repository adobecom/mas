import { html, LitElement, css } from 'lit';
import { SURFACES } from '../constants.js';

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

export const VARIANTS = [
    { label: 'All', value: VARIANT_NAMES.ALL, surface: 'all' },
    { label: 'Catalog', value: VARIANT_NAMES.CATALOG, surface: SURFACES.ACOM.name },
    { label: 'Plans', value: VARIANT_NAMES.PLANS, surface: SURFACES.ACOM.name },
    {
        label: 'Plans v2',
        value: VARIANT_NAMES.PLANS_V2,
        surface: SURFACES.ACOM.name,
    },
    {
        label: 'Plans Students',
        value: VARIANT_NAMES.PLANS_STUDENTS,
        surface: SURFACES.ACOM.name,
    },
    {
        label: 'Plans Education',
        value: VARIANT_NAMES.PLANS_EDUCATION,
        surface: SURFACES.ACOM.name,
    },
    { label: 'Slice', value: VARIANT_NAMES.SLICES, surface: SURFACES.CCD.name },
    {
        label: 'Special offers',
        value: VARIANT_NAMES.SPECIAL_OFFERS,
        surface: SURFACES.ACOM.name,
    },
    { label: 'Suggested', value: VARIANT_NAMES.SUGGESTED, surface: SURFACES.CCD.name },
    {
        label: 'Try Buy Widget',
        value: VARIANT_NAMES.TRY_BUY_WIDGET,
        surface: SURFACES.ADOBE_HOME.name,
    },
    {
        label: 'Promoted Plans',
        value: VARIANT_NAMES.PROMOTED_PLANS,
        surface: SURFACES.ADOBE_HOME.name,
    },
    {
        label: 'Fries',
        value: VARIANT_NAMES.FRIES,
        surface: SURFACES.COMMERCE.name,
    },
    {
        label: 'Simplified pricing Express',
        value: VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS,
        surface: SURFACES.EXPRESS.name,
    },
    {
        label: 'Mini',
        value: VARIANT_NAMES.MINI,
        surface: SURFACES.CCD.name,
    },
    {
        label: 'Full Pricing Express',
        value: 'full-pricing-express',
        surface: SURFACES.EXPRESS.name,
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
            --mod-picker-background-color-default: var(--spectrum-white);
            --mod-picker-border-color-default: var(--spectrum-gray-300);
            --mod-picker-border-width: 2px;
            --mod-picker-border-radius: 8px;
        }

        :host([data-field-state='overridden']) sp-picker {
            --mod-picker-border-color-default: var(--spectrum-blue-400);
            --mod-picker-background-color-default: var(--spectrum-blue-100);
        }
    `;

    static properties = {
        value: { type: String, reflect: true },
        defaultValue: { type: String, attribute: 'default-value' },
        showAll: { type: Boolean, attribute: 'show-all' },
        disabled: { type: Boolean, attribute: 'disabled' },
    };

    get variants() {
        return VARIANTS.filter((variant) => this.showAll || variant.value != 'all').map(
            (variant) => html`<sp-menu-item value="${variant.value}">${variant.label}</sp-menu-item>`,
        );
    }

    #handleChange(e) {
        this.value = e.target.value;
    }

    render() {
        return html`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value ?? this.defaultValue}
            .value=${this.value ?? this.defaultValue}
            ?disabled=${this.disabled}
            @change=${this.#handleChange}
        >
            ${this.variants}
        </sp-picker>`;
    }
}

customElements.define('variant-picker', VariantPicker);
