/**
 * AI Card Mapper
 *
 * Maps AI-generated card configurations to AEM Fragment structures
 * using Milo variant mappings as the source of truth.
 */

import { Fragment } from '../aem/fragment.js';
import { TAG_MODEL_ID_MAPPING, CARD_MODEL_PATH } from '../constants.js';
import { getFragmentMapping } from '../utils.js';
import { fetchProductDetail } from '../services/product-api.js';

/**
 * Maps variant field names to AEM field names
 * This is needed because variant mappings use generic names (title, description)
 * but AEM model expects specific names (cardTitle, etc.)
 */
const VARIANT_TO_AEM_FIELD_MAPPING = {
    title: 'cardTitle',
};

/**
 * Variants that render badges via element attributes (badge-text, badge-background-color)
 * rather than projecting HTML into a slot. These expect the `badge` AEM field to hold
 * plain text and `badgeBackgroundColor` as a separate field.
 */
const BADGE_ATTRIBUTE_VARIANTS = new Set(['catalog', 'ccd-slice', 'ccd-suggested']);

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
 * Returns the text label for a release CTA anchor, mirroring OST's path-based
 * placeholder logic from `studio/src/rte/ost.js:153-157`.
 * On acom/sandbox/nala surfaces the RTE placeholder token is used (resolved at
 * render time by commerce-service); on all other surfaces literal text is used.
 *
 * @param {'buy-now'|'free-trial'} analyticsId
 * @param {string} currentPath - surface path (e.g. 'acom', 'sandbox', 'nala')
 * @returns {string}
 */
/**
 * Builds the `ctas` HTML for a release card.
 * Free trial anchor comes first (if present) with secondary style, Buy now second.
 *
 * @param {string} baseOsi - Base offer selector ID
 * @param {string|null|undefined} trialOsi - Trial offer selector ID (omit for single-CTA)
 * @param {Object} [options]
 * @param {boolean} [options.includeTrial=true] - Whether to include the trial CTA
 * @param {string} [options.buyNowLabel='Buy now'] - Label for the primary CTA
 * @returns {string} - `<p slot="footer">…</p>` HTML
 */
export function buildReleaseCtas(baseOsi, trialOsi, { includeTrial = true, buyNowLabel = 'Buy now' } = {}) {
    const parts = [];
    if (trialOsi && includeTrial) {
        parts.push(
            `<a is="checkout-link" data-wcs-osi="${trialOsi}" data-analytics-id="free-trial" class="secondary">Free trial</a>`,
        );
    }
    if (baseOsi) {
        parts.push(`<a is="checkout-link" data-wcs-osi="${baseOsi}" data-analytics-id="buy-now">${buyNowLabel}</a>`);
    }
    return `<p slot="footer">${parts.join('')}</p>`;
}

/**
 * Builds the `prices` HTML for a release card, byte-identical to what OST
 * would emit — no data-template attribute (OST omits it for the default price type).
 *
 * @param {string} osi - Base offer selector ID
 * @returns {string}
 */
export function buildReleasePrice(osi) {
    return `<span is="inline-price" data-wcs-osi="${osi}"></span>`;
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

    const baseOsi = aiConfig.osi;

    // Map each field based on AI config and Milo mapping
    for (const [fieldName, value] of Object.entries(aiConfig)) {
        if (fieldName === 'variant') continue;
        if (fieldName === 'osi') continue;
        if (fieldName === 'trialOsi') continue;
        // Skip only genuinely absent values; preserve explicit 0, '', false.
        if (value === null || value === undefined) continue;

        const mappingConfig = fragmentMapping[fieldName];

        // Handle special field types
        if (fieldName === 'mnemonics' && Array.isArray(value)) {
            fields.push(...mapMnemonics(value, mappingConfig));
        } else if (fieldName === 'badge' && typeof value === 'object') {
            fields.push(...mapBadge(value, mappingConfig, variant));
        } else if (fieldName === 'badge' && typeof value === 'string') {
            const parsed = parseBadgeHtmlString(value);
            fields.push(
                ...(parsed
                    ? mapBadge(parsed, mappingConfig, variant)
                    : [{ name: 'badge', type: 'long-text', values: [value] }]),
            );
        } else if (mappingConfig) {
            // Translate variant field name to AEM field name
            const aemFieldName = VARIANT_TO_AEM_FIELD_MAPPING[fieldName] || fieldName;
            const fieldType = getFieldType(aemFieldName);
            fields.push({ name: aemFieldName, type: fieldType, values: [value] });
        }
    }

    // Re-emit osi as a top-level field so the merch-card render fallback sees it.
    if (baseOsi) {
        fields.push({ name: 'osi', type: 'text', values: [baseOsi] });
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
 * Parses a pre-rendered `<merch-badge>` HTML string back into a badge object.
 * Returns null if the input is not a merch-badge HTML string.
 * @param {string} html
 * @returns {{text: string, backgroundColor?: string} | null}
 */
export function parseBadgeHtmlString(html) {
    if (typeof html !== 'string' || !html.includes('<merch-badge')) return null;
    if (typeof DOMParser === 'undefined') return null;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const el = doc.querySelector('merch-badge');
    if (!el) return null;
    const text = el.textContent?.trim();
    if (!text) return null;
    return {
        text,
        backgroundColor: el.getAttribute('background-color') || undefined,
    };
}

/**
 * Maps badge object to AEM fragment fields.
 * Attribute-mode variants (catalog, ccd-slice, ccd-suggested) render badges via
 * element attributes, so they need plain text in `badge` + a separate
 * `badgeBackgroundColor` field. Slot-based variants wrap the text as
 * `<merch-badge>` HTML so hydrate.js can project it into the badge slot.
 * @param {{text: string, backgroundColor?: string}} badge
 * @param {object} config - variant mapping config for the badge field
 * @param {string} variant - card variant name
 */
function escapeHtmlText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function mapBadge(badge, config, variant) {
    if (!badge || !badge.text) return [];

    if (BADGE_ATTRIBUTE_VARIANTS.has(variant)) {
        const fields = [{ name: 'badge', type: 'long-text', values: [badge.text] }];
        const bgColor = badge.backgroundColor || config?.default;
        if (bgColor) {
            fields.push({ name: 'badgeBackgroundColor', type: 'text', values: [bgColor] });
        }
        return fields;
    }

    const bgColor = badge.backgroundColor || config?.default;
    const bgAttr = bgColor ? ` background-color="${escapeHtmlAttr(bgColor)}"` : '';
    const badgeHTML = `<merch-badge${bgAttr}>${escapeHtmlText(badge.text)}</merch-badge>`;
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
    if (config.title?.trim()) {
        const doc = new DOMParser().parseFromString(config.title, 'text/html');
        return doc.body.textContent?.trim() || config.title;
    }

    if (config.cardTitle?.trim()) {
        return config.cardTitle;
    }

    if (config.name?.trim()) {
        return config.name;
    }

    return 'AI Generated Card';
}

/**
 * Required fields enforced deterministically for each variant, independent of
 * variantConfig.requiredFields which may lag behind prompt contract changes.
 * `mnemonics` is intentionally absent — it is injected from MCS data by
 * enrichConfigWithMcsMnemonic, so validating it here would cause spurious failures.
 * `secureLabel` is already auto-injected for plans variants by mapAIConfigToFragmentFields.
 */
const VARIANT_REQUIRED_FIELDS = {
    plans: ['title', 'prices', 'description', 'ctas', 'osi'],
    'plans-students': ['title', 'prices', 'description', 'ctas', 'osi'],
    'plans-education': ['title', 'prices', 'description', 'ctas', 'osi'],
    catalog: ['title', 'description', 'ctas'],
};

/**
 * Enriches an AI-generated card config with mnemonic data from MCS.
 *
 * The AI is not expected to supply correct icon URLs — they come from MCS.
 * If `config.mnemonics` is already populated (non-empty array), the override
 * is preserved and no MCS lookup is performed (allows AI to pass its own value
 * for debugging, which the mapper will use directly).
 *
 * Resolution order:
 *  1. `selectedProduct` argument (already resolved in release flow)
 *  2. `fetchProductDetail(config.arrangementCode)` (fallback MCS fetch)
 *
 * Never throws — on MCS failure or missing icon the config is returned unchanged.
 *
 * @param {Object} config - AI-generated card config
 * @param {Object|null} selectedProduct - Already-resolved MCS product (optional)
 * @returns {Promise<Object>} - Enriched config (or original on failure)
 */
export async function enrichConfigWithMcsMnemonic(config, selectedProduct = null) {
    if (!config || typeof config !== 'object') return config;

    let product = selectedProduct;
    if (!product && config.arrangementCode) {
        try {
            const detail = await fetchProductDetail(config.arrangementCode);
            product = detail?.product || detail;
        } catch {
            return config;
        }
    }
    if (!product) return config;

    const icon = product.assets?.icons?.svg || product.icon;
    if (!icon) return config;

    const alt = product.copy?.name || product.name || '';
    return {
        ...config,
        mnemonics: [{ icon, alt, link: '' }],
    };
}

/**
 * Validates AI-generated config against variant requirements
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {Object} variantConfig - Variant configuration from variant-configs.js
 * @param {Object} [options] - Optional validation options
 * @param {string} [options.trialOsi] - Trial OSI from chat state; when present, catalog ctas must include a free-trial anchor
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
        if (typeof aiConfig.ctas === 'string' && !aiConfig.ctas.includes(expectedClass)) {
            warnings.push(`CTA style mismatch. Expected "${expectedClass}" for ${aiConfig.variant}`);
        } else if (typeof aiConfig.ctas !== 'string') {
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

/**
 * Build MCS-aligned tag list for a release-flow card so the io/www settings
 * transformer can match the right per-surface overrides (secure label,
 * plan-type copy, etc.). Mirrors the shape emitted by
 * io/mcp-server/src/actions/create-release-cards.js.
 *
 * @param {Object} product - Selected release product (from MCS)
 * @returns {string[]} - Tag IDs in `mas:...` form
 */
export function buildReleaseTags(product) {
    if (!product) return [];
    const tags = [];
    if (product.product_code) tags.push(`mas:product_code/${product.product_code}`);
    const pa = product.arrangement_code || product.value;
    if (pa) tags.push(`mas:pa/${pa}`);
    if (product.product_family) tags.push(`mas:product_family/${product.product_family}`);
    const customerSegment = product.customer_segment || (Array.isArray(product.segments) ? product.segments[0] : undefined);
    if (customerSegment) tags.push(`mas:customer_segment/${customerSegment}`);
    const marketSegments = Array.isArray(product.market_segments)
        ? product.market_segments
        : product.marketSegments
          ? Object.keys(product.marketSegments).filter((k) => product.marketSegments[k])
          : [];
    marketSegments.forEach((s) => tags.push(`mas:market_segments/${s}`));
    return tags;
}

/**
 * Creates fragment data ready for AEM createFragment() API
 * @param {Object} aiConfig - AI-generated card configuration
 * @param {string} variant - Card variant
 * @param {Object} options - Options (title, parent path, tags, etc.)
 * @returns {Object} - Fragment data for AEM API
 */
export function createFragmentDataForAEM(aiConfig, variant, options = {}) {
    const fields = mapAIConfigToFragmentFields(aiConfig, variant);

    const data = {
        modelId: TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'],
        title: options.title || extractTitleFromConfig(aiConfig),
        name: options.name,
        parentPath: options.parentPath,
        fields,
    };
    if (Array.isArray(options.tags) && options.tags.length > 0) {
        data.tags = options.tags;
    }
    return data;
}
