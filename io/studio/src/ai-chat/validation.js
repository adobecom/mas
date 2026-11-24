/**
 * Required fields enforced deterministically for each variant.
 * Mirrors the frontend VARIANT_REQUIRED_FIELDS in studio/src/utils/ai-card-mapper.js.
 * `mnemonics` is absent — injected from MCS data post-validation.
 * `secureLabel` is absent — auto-injected by the card mapper for plans variants.
 */
const VARIANT_REQUIRED_FIELDS = {
    plans: ['title', 'prices', 'description', 'ctas', 'osi'],
    'plans-students': ['title', 'prices', 'description', 'ctas', 'osi'],
    'plans-education': ['title', 'prices', 'description', 'ctas', 'osi'],
    catalog: ['title', 'description', 'ctas'],
};

/**
 * Validates AI-generated config against variant requirements
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {Object} variantConfig - Variant configuration from variant-configs.js
 * @param {Object} [options] - Optional validation options
 * @param {string} [options.trialOsi] - When present, catalog ctas must include a free-trial anchor
 * @returns {Object} - {valid: boolean, errors: string[], warnings: string[]}
 */
export function validateAIConfig(aiConfig, variantConfig, options = {}) {
    const errors = [];
    const warnings = [];

    if (!aiConfig.variant) {
        errors.push('Variant is required');
    }

    if (!variantConfig) {
        errors.push(`Unknown variant: ${aiConfig.variant}`);
        return { valid: false, errors, warnings };
    }

    // Deterministic per-variant required fields (superset of variantConfig.requiredFields)
    const hardRequired = VARIANT_REQUIRED_FIELDS[aiConfig.variant] || [];
    const variantRequired = variantConfig.requiredFields || [];
    const allRequired = [...new Set([...hardRequired, ...variantRequired])];
    for (const field of allRequired) {
        if (!aiConfig[field]) {
            errors.push(`Required field missing: ${field}`);
        }
    }

    // Catalog cards must include a free-trial anchor when a trial offer is selected
    if (aiConfig.variant === 'catalog' && options.trialOsi && typeof aiConfig.ctas === 'string') {
        if (!aiConfig.ctas.includes('data-analytics-id="free-trial"')) {
            errors.push('Catalog card with trial offer must include a free-trial CTA anchor');
        }
    }

    // Validate CTA style
    if (aiConfig.ctas && variantConfig.ctaStyle) {
        const expectedClass = variantConfig.ctaStyle;

        if (typeof aiConfig.ctas === 'string') {
            if (!aiConfig.ctas.includes(expectedClass)) {
                warnings.push(`CTA style mismatch. Expected "${expectedClass}" for ${aiConfig.variant}`);
            }
        } else {
            warnings.push(`CTA field should be HTML string, received ${typeof aiConfig.ctas}`);
        }
    }

    // Validate slots in HTML
    if (variantConfig.mapping) {
        for (const [fieldName, mappingConfig] of Object.entries(variantConfig.mapping)) {
            const value = aiConfig[fieldName];
            if (!value || typeof value !== 'string') continue;

            if (mappingConfig.slot && !value.includes(`slot="${mappingConfig.slot}"`)) {
                warnings.push(`Field "${fieldName}" should include slot="${mappingConfig.slot}"`);
            }

            if (mappingConfig.tag && !value.trim().startsWith(`<${mappingConfig.tag}`)) {
                warnings.push(`Field "${fieldName}" should use <${mappingConfig.tag}> tag`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
