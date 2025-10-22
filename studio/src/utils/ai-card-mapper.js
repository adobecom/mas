/**
 * AI Card Mapper
 *
 * Maps AI-generated card configurations to AEM Fragment structures
 * using Milo variant mappings as the source of truth.
 */

import { Fragment } from '../aem/fragment.js';
import { TAG_MODEL_ID_MAPPING, CARD_MODEL_PATH } from '../constants.js';
import { getFragmentMapping } from '../utils.js';

/**
 * Maps variant field names to AEM field names
 * This is needed because variant mappings use generic names (title, description)
 * but AEM model expects specific names (cardTitle, etc.)
 */
const VARIANT_TO_AEM_FIELD_MAPPING = {
    title: 'cardTitle',
};

/**
 * Determines the AEM field type based on variant mapping
 * @param {string} fieldName - AEM field name
 * @param {Object} mappingConfig - Field mapping configuration
 * @returns {string} - 'long-text' for HTML fields, 'text' for plain text
 */
function getFieldType(fieldName, mappingConfig) {
    if (fieldName === 'cardTitle') {
        return 'text';
    }

    if (mappingConfig?.tag || mappingConfig?.slot) {
        return 'long-text';
    }
    return 'text';
}

/**
 * Maps AI-generated config to AEM Fragment fields
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {string} variant - Card variant
 * @returns {Array} - AEM fragment fields array
 */
export function mapAIConfigToFragmentFields(aiConfig, variant) {
    const fragmentMapping = getFragmentMapping(variant);

    if (!fragmentMapping) {
        throw new Error(`No fragment mapping found for variant: ${variant}`);
    }

    const fields = [];

    // Map variant
    fields.push({ name: 'variant', type: 'text', values: [variant] });

    // Map each field based on AI config and Milo mapping
    for (const [fieldName, value] of Object.entries(aiConfig)) {
        if (fieldName === 'variant') continue;
        if (!value) continue;

        const mappingConfig = fragmentMapping[fieldName];

        // Handle special field types
        if (fieldName === 'mnemonics' && Array.isArray(value)) {
            fields.push(...mapMnemonics(value, mappingConfig));
        } else if (fieldName === 'badge' && typeof value === 'object') {
            fields.push(...mapBadge(value, mappingConfig));
        } else if (fieldName === 'osi') {
            fields.push({ name: 'osi', type: 'text', values: [value] });
        } else if (mappingConfig) {
            // Translate variant field name to AEM field name
            const aemFieldName = VARIANT_TO_AEM_FIELD_MAPPING[fieldName] || fieldName;
            const fieldType = getFieldType(aemFieldName, mappingConfig);
            fields.push({ name: aemFieldName, type: fieldType, values: [value] });
        }
    }

    return fields;
}

/**
 * Maps mnemonic array to AEM fragment fields
 */
function mapMnemonics(mnemonics, config) {
    if (!Array.isArray(mnemonics) || mnemonics.length === 0) {
        return [];
    }

    return [
        { name: 'mnemonicIcon', type: 'text', values: mnemonics.map((m) => m.icon || '') },
        { name: 'mnemonicAlt', type: 'text', values: mnemonics.map((m) => m.alt || '') },
        { name: 'mnemonicLink', type: 'text', values: mnemonics.map((m) => m.link || '') },
    ];
}

/**
 * Maps badge object to AEM fragment field
 */
function mapBadge(badge, config) {
    if (!badge || !badge.text) return [];

    // Create badge HTML with background color
    let badgeHTML = `<merch-badge`;

    if (badge.backgroundColor) {
        badgeHTML += ` background-color="${badge.backgroundColor}"`;
    } else if (config?.default) {
        badgeHTML += ` background-color="${config.default}"`;
    }

    badgeHTML += `>${badge.text}</merch-badge>`;

    return [{ name: 'badge', type: 'long-text', values: [badgeHTML] }];
}

/**
 * Creates a complete Fragment instance from AI config
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {string} variant - Card variant
 * @param {Object} options - Additional options (title, folder path, etc.)
 * @returns {Fragment} - Fragment instance
 */
export function createFragmentFromAIConfig(aiConfig, variant, options = {}) {
    const fields = mapAIConfigToFragmentFields(aiConfig, variant);

    const fragmentData = {
        id: options.id || `temp-ai-${Date.now()}`,
        model: {
            id: TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'],
            path: CARD_MODEL_PATH,
        },
        title: options.title || extractTitleFromConfig(aiConfig),
        name: options.name,
        fields,
        status: options.status || 'DRAFT',
        tags: options.tags || [],
    };

    const fragment = new Fragment(fragmentData);

    const AemFragmentElement = customElements.get('aem-fragment');
    if (AemFragmentElement) {
        const cacheData = {
            id: fragment.id,
            fields: fragment.fields.reduce((acc, field) => {
                acc[field.name] = field.values;
                return acc;
            }, {}),
        };
        AemFragmentElement.cache.add(cacheData);
    }

    return fragment;
}

/**
 * Extracts a title from AI config
 */
function extractTitleFromConfig(config) {
    // Try to extract plain text from title HTML
    if (config.title) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = config.title;
        return tempDiv.textContent || config.title;
    }

    if (config.cardTitle) {
        return config.cardTitle;
    }

    if (config.name) {
        return config.name;
    }

    return 'AI Generated Card';
}

/**
 * Validates AI-generated config against variant requirements
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {Object} variantConfig - Variant configuration from variant-configs.js
 * @returns {Object} - {valid: boolean, errors: string[], warnings: string[]}
 */
export function validateAIConfig(aiConfig, variantConfig) {
    const errors = [];
    const warnings = [];

    if (!aiConfig.variant) {
        errors.push('Variant is required');
    }

    if (!variantConfig) {
        errors.push(`Unknown variant: ${aiConfig.variant}`);
        return { valid: false, errors, warnings };
    }

    // Check required fields
    for (const field of variantConfig.requiredFields || []) {
        if (!aiConfig[field]) {
            errors.push(`Required field missing: ${field}`);
        }
    }

    // Validate CTA style
    if (aiConfig.ctas && variantConfig.ctaStyle) {
        const expectedClass = variantConfig.ctaStyle;
        if (!aiConfig.ctas.includes(expectedClass)) {
            warnings.push(`CTA style mismatch. Expected "${expectedClass}" for ${aiConfig.variant}`);
        }
    }

    // Validate slots in HTML
    if (variantConfig.mapping) {
        for (const [fieldName, mappingConfig] of Object.entries(variantConfig.mapping)) {
            const value = aiConfig[fieldName];
            if (!value || typeof value !== 'string') continue;

            // Check for required slot
            if (mappingConfig.slot && !value.includes(`slot="${mappingConfig.slot}"`)) {
                warnings.push(`Field "${fieldName}" should include slot="${mappingConfig.slot}"`);
            }

            // Check for required tag
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

/**
 * Creates fragment data ready for AEM createFragment() API
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {string} variant - Card variant
 * @param {Object} options - Options (title, parent path, etc.)
 * @returns {Object} - Fragment data for AEM API
 */
export function createFragmentDataForAEM(aiConfig, variant, options = {}) {
    const fields = mapAIConfigToFragmentFields(aiConfig, variant);

    return {
        modelId: TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'],
        title: options.title || extractTitleFromConfig(aiConfig),
        name: options.name,
        parentPath: options.parentPath,
        fields,
    };
}
