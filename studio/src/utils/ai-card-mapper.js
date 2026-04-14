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

/** AEM card model fields that use 'long-text' type (HTML content). */
const LONG_TEXT_FIELDS = new Set([
    'badge',
    'trialBadge',
    'prices',
    'shortDescription',
    'description',
    'ctas',
    'callout',
    'stockOffer',
    'whatsIncluded',
    'quantitySelect',
    'promoText',
]);

/**
 * Determines the AEM field type for a given field name.
 * @param {string} fieldName - AEM field name
 * @returns {string} - 'long-text' for HTML fields, 'text' for plain text
 */
function getFieldType(fieldName) {
    return LONG_TEXT_FIELDS.has(fieldName) ? 'long-text' : 'text';
}

/**
 * Rewrites a `ctas` HTML blob so the Buy and Trial anchors carry distinct
 * `data-wcs-osi` attributes. The plans web component already supports per-anchor
 * OSIs at render time; this helper just ensures the right value lands on each
 * anchor before the fragment is created.
 *
 * Anchors are matched by `data-analytics-id`:
 *   - `data-analytics-id="buy-now"` → `baseOsi`
 *   - `data-analytics-id="free-trial"` → `trialOsi`
 *
 * If `trialOsi` is missing/empty, the trial anchor is removed entirely (along
 * with any whitespace-only siblings) so the rendered card has only the Buy CTA
 * — no orphaned Free trial button pointing at the wrong offer.
 *
 * Anchors with neither analytics id are left untouched. Non-string inputs return
 * the input as-is.
 *
 * @param {string} ctasHtml - The original ctas HTML value
 * @param {string} baseOsi - OSI to stamp onto the buy-now anchor
 * @param {string} [trialOsi] - OSI to stamp onto the free-trial anchor
 * @returns {string} - Rewritten ctas HTML (or the original if no rewrite was needed)
 */
export function applyDualOsiToCtas(ctasHtml, baseOsi, trialOsi) {
    if (typeof ctasHtml !== 'string' || !ctasHtml) return ctasHtml;
    if (typeof DOMParser === 'undefined') return ctasHtml;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = ctasHtml;

    const buyAnchor = wrapper.querySelector('a[data-analytics-id="buy-now"]');
    const trialAnchor = wrapper.querySelector('a[data-analytics-id="free-trial"]');

    if (!buyAnchor && !trialAnchor) return ctasHtml;

    if (buyAnchor && baseOsi) {
        buyAnchor.setAttribute('data-wcs-osi', baseOsi);
    }

    if (trialAnchor) {
        if (trialOsi) {
            trialAnchor.setAttribute('data-wcs-osi', trialOsi);
        } else {
            // No trial offer picked — drop the anchor entirely so the card
            // only shows Buy now. Also strip a leading/trailing whitespace
            // text node so we don't leave a stray space behind.
            const prev = trialAnchor.previousSibling;
            const next = trialAnchor.nextSibling;
            if (prev && prev.nodeType === Node.TEXT_NODE && !prev.textContent.trim()) {
                prev.remove();
            }
            if (next && next.nodeType === Node.TEXT_NODE && !next.textContent.trim()) {
                next.remove();
            }
            trialAnchor.remove();
        }
    }

    return wrapper.innerHTML;
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

    // Pull the OSI pair out up-front so the loop below can leave them alone
    // and the ctas rewrite has access to both values.
    const baseOsi = aiConfig.osi;
    const trialOsi = aiConfig.trialOsi;

    // Map each field based on AI config and Milo mapping
    for (const [fieldName, value] of Object.entries(aiConfig)) {
        if (fieldName === 'variant') continue;
        if (fieldName === 'osi') continue;
        if (fieldName === 'trialOsi') continue;
        if (!value) continue;

        const mappingConfig = fragmentMapping[fieldName];

        // Handle special field types
        if (fieldName === 'mnemonics' && Array.isArray(value)) {
            fields.push(...mapMnemonics(value, mappingConfig));
        } else if (fieldName === 'badge' && typeof value === 'object') {
            fields.push(...mapBadge(value, mappingConfig));
        } else if (mappingConfig) {
            // Translate variant field name to AEM field name
            const aemFieldName = VARIANT_TO_AEM_FIELD_MAPPING[fieldName] || fieldName;
            const fieldType = getFieldType(aemFieldName);
            fields.push({ name: aemFieldName, type: fieldType, values: [value] });
        }
    }

    // Re-emit osi as a top-level field so the merch-card render fallback sees it.
    // trialOsi is NOT an AEM model field — the trial offer is already embedded in
    // the ctas HTML via applyDualOsiToCtas below.
    if (baseOsi) {
        fields.push({ name: 'osi', type: 'text', values: [baseOsi] });
    }

    // For plans variants, stamp distinct data-wcs-osi attributes onto the
    // buy-now and free-trial anchors inside the ctas HTML so each CTA resolves
    // to its own offer at render time.
    if (variant?.startsWith('plans') && baseOsi) {
        const ctasField = fields.find((field) => field.name === 'ctas');
        if (ctasField && Array.isArray(ctasField.values) && ctasField.values.length > 0) {
            ctasField.values = [applyDualOsiToCtas(ctasField.values[0], baseOsi, trialOsi)];
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
                acc[field.name] = field.values.length === 1 ? field.values[0] : field.values;
                return acc;
            }, {}),
        };
        AemFragmentElement.cache.add(cacheData);
    }

    return fragment;
}

/**
 * Extracts a title from AI config.
 *
 * Uses DOMParser (inert document) instead of innerHTML on a detached element
 * so that <img> tags and other resource-loading elements in the HTML do not
 * trigger network requests during text extraction. See audit finding M1.
 */
export function extractTitleFromConfig(config) {
    if (config.title) {
        const doc = new DOMParser().parseFromString(config.title, 'text/html');
        return doc.body.textContent || config.title;
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
