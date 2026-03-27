/**
 * Variant Configurations
 *
 * Simplified variant metadata for AI chat. Full field mappings are retrieved
 * dynamically via RAG from the knowledge base (io/knowledge/src/knowledge-chunks/developer/variants/).
 *
 * This file contains:
 * - SURFACE_MAPPINGS: Which variants are available for each surface
 * - VARIANT_METADATA: Minimal CTA styling info needed at runtime
 * - VARIANT_CONFIGS: Full configs (deprecated - use RAG for field details)
 */

/**
 * Surface to variant mappings
 * Defines which card variants are appropriate for each surface
 */
export const SURFACE_MAPPINGS = {
    acom: ['plans', 'plans-students', 'plans-education', 'catalog', 'special-offers', 'mini', 'simplified-pricing-express'],
    ccd: ['ccd-slice', 'ccd-suggested'],
    commerce: ['fries'],
    'adobe-home': ['ah-try-buy-widget', 'ah-promoted-plans'],
    express: ['full-pricing-express', 'simplified-pricing-express'],
};

/**
 * Minimal variant metadata
 * Only contains CTA styling info needed at runtime - field mappings come from RAG
 */
export const VARIANT_METADATA = {
    plans: {
        name: 'Plans',
        description: 'Subscription plan cards with pricing and features',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
    },
    'plans-students': {
        name: 'Plans Students',
        description: 'Student discounted plan cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
    },
    'plans-education': {
        name: 'Plans Education',
        description: 'Education institution plan cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
    },
    fries: {
        name: 'Fries',
        description: 'Commerce-focused product cards with horizontal layout',
        ctaStyle: 'primary',
        ctaSize: 'M',
    },
    mini: {
        name: 'Mini',
        description: 'Compact cards for quick CTAs',
        ctaStyle: 'primary-outline',
        ctaSize: 'S',
    },
    'ccd-slice': {
        name: 'CCD Slice',
        description: 'Creative Cloud Desktop compact cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'S',
    },
    'ccd-suggested': {
        name: 'CCD Suggested',
        description: 'Creative Cloud Desktop suggested product cards',
        ctaStyle: 'primary',
        ctaSize: 'M',
    },
    'special-offers': {
        name: 'Special Offers',
        description: 'Limited time promotions with urgency styling',
        ctaStyle: 'accent',
        ctaSize: 'l',
    },
    catalog: {
        name: 'Catalog',
        description: 'Product catalog cards with action menus',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
    },
    'ah-try-buy-widget': {
        name: 'Adobe Home Try Buy Widget',
        description: 'Adobe Home compact widget for try/buy actions',
        ctaStyle: 'primary',
        ctaSize: 'S',
    },
    'ah-promoted-plans': {
        name: 'Adobe Home Promoted Plans',
        description: 'Adobe Home promoted plan cards with gradient border support',
        ctaStyle: 'primary',
        ctaSize: 'S',
    },
    'simplified-pricing-express': {
        name: 'Simplified Pricing Express',
        description: 'Simplified pricing cards for Adobe Express',
        ctaStyle: 'primary',
        ctaSize: 'XL',
    },
    'full-pricing-express': {
        name: 'Full Pricing Express',
        description: 'Full Express pricing cards with complete feature details',
        ctaStyle: 'primary',
        ctaSize: 'XL',
    },
};

/**
 * @deprecated Use VARIANT_METADATA for CTA info and RAG for field mappings.
 * This constant is kept for backward compatibility during migration.
 * Set RAG_VARIANT_DETAILS=true in params to enable dynamic field retrieval.
 *
 * Full variant configurations including field mappings
 */
export const VARIANT_CONFIGS = {
    plans: {
        name: 'Plans',
        description: 'Standard product plans with pricing and feature lists',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
        requiredFields: ['title', 'prices', 'ctas'],
        optionalFields: ['subtitle', 'description', 'badge', 'mnemonics', 'whatsIncluded', 'promoText', 'callout', 'addon'],
        sizes: ['wide', 'super-wide'],
        mapping: {
            cardName: { attribute: 'name' },
            title: { tag: 'h3', slot: 'heading-xs' },
            subtitle: { tag: 'p', slot: 'subtitle' },
            prices: { tag: 'p', slot: 'heading-m' },
            promoText: { tag: 'p', slot: 'promo-text' },
            description: { tag: 'div', slot: 'body-xs' },
            mnemonics: { size: 'l' },
            callout: { tag: 'div', slot: 'callout-content' },
            quantitySelect: { tag: 'div', slot: 'quantity-select' },
            addon: true,
            secureLabel: true,
            planType: true,
            badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
            borderColor: { attribute: 'border-color' },
            whatsIncluded: { tag: 'div', slot: 'whats-included' },
            ctas: { slot: 'footer', size: 'm' },
            perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
        },
    },

    'plans-students': {
        name: 'Plans Students',
        description: 'Student discounted plan cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
        requiredFields: ['title', 'prices', 'ctas'],
        optionalFields: ['description', 'badge', 'mnemonics', 'promoText', 'callout', 'addon'],
        sizes: [],
        mapping: {
            cardName: { attribute: 'name' },
            title: { tag: 'h3', slot: 'heading-xs' },
            prices: { tag: 'p', slot: 'heading-m' },
            promoText: { tag: 'p', slot: 'promo-text' },
            description: { tag: 'div', slot: 'body-xs' },
            mnemonics: { size: 'l' },
            callout: { tag: 'div', slot: 'callout-content' },
            addon: true,
            secureLabel: true,
            planType: true,
            badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
            borderColor: { attribute: 'border-color' },
            ctas: { slot: 'footer', size: 'm' },
            perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
        },
    },

    'plans-education': {
        name: 'Plans Education',
        description: 'Education institution plan cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
        requiredFields: ['title', 'prices', 'ctas'],
        optionalFields: ['description', 'badge', 'mnemonics', 'promoText', 'callout', 'addon'],
        sizes: [],
        mapping: {
            cardName: { attribute: 'name' },
            title: { tag: 'h3', slot: 'heading-s' },
            prices: { tag: 'p', slot: 'heading-m' },
            promoText: { tag: 'p', slot: 'promo-text' },
            description: { tag: 'div', slot: 'body-xs' },
            mnemonics: { size: 'l' },
            callout: { tag: 'div', slot: 'callout-content' },
            addon: true,
            secureLabel: false,
            planType: true,
            badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
            borderColor: { attribute: 'border-color' },
            ctas: { slot: 'footer', size: 'm' },
            perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
        },
    },

    fries: {
        name: 'Fries',
        description: 'Commerce-focused product cards with horizontal layout',
        ctaStyle: 'primary',
        ctaSize: 'M',
        requiredFields: ['title', 'description', 'ctas'],
        optionalFields: ['badge', 'trialBadge', 'prices', 'mnemonics', 'addonConfirmation'],
        sizes: [],
        mapping: {
            mnemonics: { size: 's' },
            title: { tag: 'h3', slot: 'heading-xxs', maxCount: 250, withSuffix: true },
            description: { tag: 'div', slot: 'body-s', maxCount: 2000, withSuffix: false },
            badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300' },
            trialBadge: { tag: 'div', slot: 'trial-badge', default: 'spectrum-green-800' },
            prices: { tag: 'p', slot: 'price' },
            ctas: { slot: 'cta', size: 'M' },
            addonConfirmation: { tag: 'div', slot: 'addon-confirmation' },
            borderColor: { attribute: 'border-color' },
        },
    },

    mini: {
        name: 'Mini',
        description: 'Compact cards for quick CTAs',
        ctaStyle: 'primary-outline',
        ctaSize: 'S',
        requiredFields: ['title', 'ctas'],
        optionalFields: ['description', 'prices'],
        sizes: [],
        mapping: {
            title: { tag: 'p', slot: 'title' },
            prices: { tag: 'p', slot: 'prices' },
            description: { tag: 'p', slot: 'description' },
            planType: true,
            ctas: { slot: 'ctas', size: 'S' },
        },
    },

    'ccd-slice': {
        name: 'CCD Slice',
        description: 'Creative Cloud Desktop compact cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'S',
        requiredFields: ['description', 'ctas'],
        optionalFields: ['backgroundImage', 'badge', 'mnemonics'],
        sizes: ['wide'],
        mapping: {
            backgroundImage: { tag: 'div', slot: 'image' },
            badge: true,
            ctas: { slot: 'footer', size: 'S' },
            description: { tag: 'div', slot: 'body-s' },
            mnemonics: { size: 'm' },
        },
    },

    'ccd-suggested': {
        name: 'CCD Suggested',
        description: 'Creative Cloud Desktop suggested product cards',
        ctaStyle: 'primary',
        ctaSize: 'M',
        requiredFields: ['title', 'ctas'],
        optionalFields: ['subtitle', 'description', 'badge', 'mnemonics', 'prices', 'backgroundImage'],
        sizes: [],
        mapping: {
            backgroundImage: { attribute: 'background-image' },
            badge: true,
            ctas: { slot: 'cta', size: 'M' },
            description: { tag: 'div', slot: 'body-xs' },
            mnemonics: { size: 'l' },
            prices: { tag: 'p', slot: 'price' },
            subtitle: { tag: 'h4', slot: 'detail-s' },
            title: { tag: 'h3', slot: 'heading-xs' },
        },
    },

    'special-offers': {
        name: 'Special Offers',
        description: 'Limited time promotions with urgency styling',
        ctaStyle: 'accent',
        ctaSize: 'l',
        requiredFields: ['title', 'prices', 'ctas'],
        optionalFields: ['name', 'description', 'backgroundImage'],
        sizes: [],
        mapping: {
            name: { tag: 'h4', slot: 'detail-m' },
            title: { tag: 'h4', slot: 'detail-m' },
            backgroundImage: { tag: 'div', slot: 'bg-image' },
            prices: { tag: 'h3', slot: 'heading-xs' },
            description: { tag: 'div', slot: 'body-xs' },
            ctas: { slot: 'footer', size: 'l' },
        },
    },

    catalog: {
        name: 'Catalog',
        description: 'Product catalog cards',
        ctaStyle: 'primary-outline',
        ctaSize: 'm',
        requiredFields: ['title', 'description', 'ctas'],
        optionalFields: ['backgroundImage', 'badge', 'actionMenu'],
        sizes: [],
        mapping: {
            actionMenu: true,
            actionMenuContent: { tag: 'div', slot: 'action-menu-content' },
            badge: { tag: 'div', slot: 'badge' },
            backgroundImage: { tag: 'div', slot: 'bg-image' },
            title: { tag: 'h3', slot: 'heading-xs' },
            description: { tag: 'div', slot: 'body-xs' },
            ctas: { slot: 'footer', size: 'm' },
        },
    },

    'ah-try-buy-widget': {
        name: 'Adobe Home Try Buy Widget',
        description: 'Adobe Home compact widget for try/buy actions',
        ctaStyle: 'primary',
        ctaSize: 'S',
        requiredFields: ['title', 'description', 'ctas'],
        optionalFields: ['mnemonics', 'prices', 'backgroundImage', 'backgroundColor', 'borderColor', 'badge'],
        sizes: ['single', 'double', 'triple'],
        mapping: {
            mnemonics: { size: 's' },
            title: { tag: 'h3', slot: 'heading-xxxs', maxCount: 40, withSuffix: true },
            badge: { tag: 'div', slot: 'badge', default: 'fuchsia' },
            description: { tag: 'div', slot: 'body-xxs', maxCount: 200, withSuffix: false },
            prices: { tag: 'p', slot: 'price' },
            ctas: { slot: 'cta', size: 'S' },
            backgroundImage: { tag: 'div', slot: 'image' },
            backgroundColor: { attribute: 'background-color' },
            borderColor: { attribute: 'border-color' },
        },
    },

    'ah-promoted-plans': {
        name: 'Adobe Home Promoted Plans',
        description: 'Adobe Home promoted plan cards with gradient border support',
        ctaStyle: 'primary',
        ctaSize: 'S',
        requiredFields: ['title', 'description', 'ctas'],
        optionalFields: ['mnemonics', 'prices', 'backgroundImage', 'backgroundColor', 'borderColor'],
        sizes: [],
        mapping: {
            mnemonics: { size: 's' },
            title: { tag: 'h3', slot: 'heading-xxxs', maxCount: 40, withSuffix: true },
            description: { tag: 'div', slot: 'body-xxs', maxCount: 200, withSuffix: false },
            prices: { tag: 'p', slot: 'price' },
            ctas: { slot: 'cta', size: 'S' },
            backgroundImage: { tag: 'div', slot: 'image' },
            backgroundColor: { attribute: 'background-color' },
            borderColor: {
                attribute: 'border-color',
                specialValues: { gradient: 'linear-gradient(135deg, #ff4885 0%, #b272eb 50%, #5d89ff 100%)' },
            },
        },
    },

    'simplified-pricing-express': {
        name: 'Simplified Pricing Express',
        description: 'Simplified pricing cards for Adobe Express',
        ctaStyle: 'primary',
        ctaSize: 'XL',
        requiredFields: ['title', 'description', 'prices', 'ctas'],
        optionalFields: ['badge', 'borderColor'],
        sizes: [],
        mapping: {
            title: { tag: 'h3', slot: 'heading-xs', maxCount: 250, withSuffix: true },
            badge: { tag: 'div', slot: 'badge', default: 'spectrum-blue-400' },
            description: { tag: 'div', slot: 'body-xs', maxCount: 2000, withSuffix: false },
            prices: { tag: 'div', slot: 'price' },
            ctas: { slot: 'cta', size: 'XL' },
            borderColor: {
                attribute: 'border-color',
                specialValues: {
                    gray: 'var(--spectrum-gray-300)',
                    blue: 'var(--spectrum-blue-400)',
                    'gradient-purple-blue': 'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
                    'gradient-firefly-spectrum': 'linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)',
                },
            },
        },
    },
};

/**
 * Get variant configuration by name
 * @deprecated Use VARIANT_METADATA and RAG for field details
 */
export function getVariantConfig(variantName) {
    return VARIANT_CONFIGS[variantName];
}

/**
 * Get variant metadata by name (recommended)
 */
export function getVariantMetadata(variantName) {
    return VARIANT_METADATA[variantName];
}

/**
 * Get all available variants
 */
export function getAllVariants() {
    return Object.keys(VARIANT_METADATA);
}

/**
 * Validate if a variant exists
 */
export function isValidVariant(variantName) {
    return variantName in VARIANT_METADATA;
}

/**
 * Get variants available for a specific surface
 */
export function getVariantsForSurface(surface) {
    return SURFACE_MAPPINGS[surface] || [];
}

/**
 * Get surface for a given variant
 */
export function getSurfaceForVariant(variantName) {
    for (const [surface, variants] of Object.entries(SURFACE_MAPPINGS)) {
        if (variants.includes(variantName)) {
            return surface;
        }
    }
    return null;
}
