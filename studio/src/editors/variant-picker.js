import { html, LitElement, css } from 'lit';
import { SURFACES } from '../constants.js';

export const VARIANT_NAMES = {
    ALL: 'all',
    CATALOG: 'catalog',
    PLANS: 'plans',
    PLANS_V2: 'plans-v2',
    PRO: 'pro',
    PLANS_STUDENTS: 'plans-students',
    PLANS_EDUCATION: 'plans-education',
    PRODUCT: 'product',
    SEGMENT: 'segment',
    SLICES: 'ccd-slice',
    SPECIAL_OFFERS: 'special-offers',
    SUGGESTED: 'ccd-suggested',
    TRY_BUY_WIDGET: 'ah-try-buy-widget',
    PROMOTED_PLANS: 'ah-promoted-plans',
    FRIES: 'fries',
    MINI: 'mini',
    IMAGE: 'image',
    MINI_COMPARE_CHART: 'mini-compare-chart',
    MINI_COMPARE_CHART_MWEB: 'mini-compare-chart-mweb',
    SIMPLIFIED_PRICING_EXPRESS: 'simplified-pricing-express',
    FULL_PRICING_EXPRESS: 'full-pricing-express',
    HEADLESS: 'headless',
    MEDIA: 'media',
    COMPARE_CHART_COLUMN: 'compare-chart-column',
};
//TODO make that feed (excepts ALL maybe) dynamically served from milo

export const VARIANTS = [
    { label: 'All', value: VARIANT_NAMES.ALL, surfaces: ['all'] },
    { label: 'Catalog', value: VARIANT_NAMES.CATALOG, surfaces: [SURFACES.ACOM] },
    { label: 'Plans', value: VARIANT_NAMES.PLANS, surfaces: [SURFACES.ACOM] },
    {
        label: 'Plans v2',
        value: VARIANT_NAMES.PLANS_V2,
        surfaces: [SURFACES.ACOM],
    },
    {
        label: 'Pro',
        value: VARIANT_NAMES.PRO,
        surfaces: [SURFACES.ACOM, SURFACES.ACOM_CC, SURFACES.ACOM_DC],
    },
    {
        label: 'Plans Students',
        value: VARIANT_NAMES.PLANS_STUDENTS,
        surfaces: [SURFACES.ACOM],
    },
    {
        label: 'Plans Education',
        value: VARIANT_NAMES.PLANS_EDUCATION,
        surfaces: [SURFACES.ACOM],
    },
    {
        label: 'Product',
        value: VARIANT_NAMES.PRODUCT,
        surfaces: [SURFACES.ACOM_CC, SURFACES.ACOM_DC],
    },
    {
        label: 'Segment',
        value: VARIANT_NAMES.SEGMENT,
        surfaces: [SURFACES.ACOM_CC, SURFACES.ACOM_DC],
    },
    { label: 'Media', value: VARIANT_NAMES.MEDIA, surfaces: [SURFACES.ACOM] },
    { label: 'Slice', value: VARIANT_NAMES.SLICES, surfaces: [SURFACES.CCD] },
    {
        label: 'Special offers',
        value: VARIANT_NAMES.SPECIAL_OFFERS,
        surfaces: [SURFACES.ACOM_CC],
    },
    { label: 'Suggested', value: VARIANT_NAMES.SUGGESTED, surfaces: [SURFACES.CCD] },
    {
        label: 'Try Buy Widget',
        value: VARIANT_NAMES.TRY_BUY_WIDGET,
        surfaces: [SURFACES.ADOBE_HOME],
    },
    {
        label: 'Promoted Plans',
        value: VARIANT_NAMES.PROMOTED_PLANS,
        surfaces: [SURFACES.ADOBE_HOME],
    },
    {
        label: 'Fries',
        value: VARIANT_NAMES.FRIES,
        surfaces: [SURFACES.COMMERCE],
    },
    {
        label: 'Simplified pricing Express',
        value: VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS,
        surfaces: [SURFACES.EXPRESS],
    },
    {
        label: 'Mini',
        value: VARIANT_NAMES.MINI,
        surfaces: [SURFACES.CCD],
    },
    {
        label: 'Image',
        value: VARIANT_NAMES.IMAGE,
        surfaces: [SURFACES.ACOM_CC, SURFACES.ACOM_DC],
    },
    {
        label: 'Full Pricing Express',
        value: 'full-pricing-express',
        surfaces: [SURFACES.EXPRESS],
    },
    {
        label: 'Headless',
        value: VARIANT_NAMES.HEADLESS,
        surfaces: [SURFACES.SANDBOX, SURFACES.ACOM_CC, SURFACES.ACOM_DC],
    },
    {
        label: 'Mini Compare Chart',
        value: VARIANT_NAMES.MINI_COMPARE_CHART,
        surfaces: [SURFACES.ACOM_CC, SURFACES.ACOM_DC],
    },
    {
        label: 'Mini Compare Chart Mweb',
        value: VARIANT_NAMES.MINI_COMPARE_CHART_MWEB,
        surfaces: [SURFACES.ACOM, SURFACES.ACOM_CC],
    },
    {
        label: 'Compare Chart Column',
        value: VARIANT_NAMES.COMPARE_CHART_COLUMN,
        surfaces: [SURFACES.ACOM_CC, SURFACES.ACOM_DC, SURFACES.ACOM, SURFACES.EXPRESS],
    },
];

// TODO(MWPW-200587): remove after content migration
/** Stored variant aliases accepted while existing fragments are migrated. */
export const LEGACY_VARIANTS = new Map([['bizpro', VARIANT_NAMES.PRO]]);

/** All variant values that Studio can display, including stored aliases. */
export const RECOGNIZED_VARIANT_NAMES = new Set([...VARIANTS.map((variant) => variant.value), ...LEGACY_VARIANTS.keys()]);

/** Resolves a stored variant alias to its authorable variant name. */
export const normalizeVariantName = (variant) => LEGACY_VARIANTS.get(variant) ?? variant;

/** Returns whether an authorable variant has stored aliases. */
export const hasLegacyVariantAlias = (variant) =>
    [...LEGACY_VARIANTS.values()].some((authorableVariant) => authorableVariant === normalizeVariantName(variant));

// TODO(MWPW-200587): remove after content migration
/** Rewrites a stored variant alias before a fragment is saved. */
export const migrateLegacyVariant = (fragmentStore) => {
    const variant = fragmentStore.get()?.getFieldValue('variant');
    const normalizedVariant = normalizeVariantName(variant);
    if (variant === normalizedVariant) return;
    fragmentStore.updateField('variant', [normalizedVariant]);
};

/** Returns whether a stored variant matches any selected authorable variant. */
export const isVariantMatch = (variants, variant) =>
    variants.some((selectedVariant) => normalizeVariantName(selectedVariant) === normalizeVariantName(variant));

/** Flat tree-picker-compatible list of allowed variants, optionally filtered by surface. */
export const getVariantTreeData = (surface) =>
    VARIANTS.filter((v) => {
        if (v.value === VARIANT_NAMES.ALL) return false;
        if (!surface) return true;
        if ([SURFACES.SANDBOX.name, SURFACES.NALA.name].includes(surface)) return true;
        return v.surfaces.some((s) => s.name === surface);
    }).map((v) => ({
        name: v.value,
        label: v.label,
    }));

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
            label="Card Template"
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
