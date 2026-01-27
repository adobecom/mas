/**
 * Variant Knowledge Builder
 *
 * Builds AI-friendly variant knowledge for system prompts.
 * Uses a hybrid approach:
 * - Surface mappings and CTA info are hardcoded for stability
 * - Field mappings are retrieved dynamically via RAG when needed
 */

import { SURFACE_MAPPINGS, VARIANT_METADATA } from './variant-configs.js';

/**
 * Build surface reference section
 * Shows which variants are available for each surface
 */
function buildSurfaceReference() {
    const lines = ['=== VARIANT BY SURFACE ===\n'];

    lines.push('Choose the right variant based on where the card will be used:\n');

    for (const [surface, variants] of Object.entries(SURFACE_MAPPINGS)) {
        lines.push(`**${surface.toUpperCase()}**:`);
        variants.forEach((variant) => {
            const meta = VARIANT_METADATA[variant];
            if (meta) {
                lines.push(`  - ${variant}: ${meta.description}`);
            } else {
                lines.push(`  - ${variant}: (variant available)`);
            }
        });
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Build CTA quick reference
 * Critical styling info that must be correct
 */
function buildCtaReference() {
    const lines = ['=== CTA BUTTON STYLING ===\n'];

    lines.push('**CRITICAL: Use correct CTA button classes for each variant:**\n');

    const ctaGroups = {
        'primary-outline': [],
        primary: [],
        accent: [],
    };

    for (const [variant, meta] of Object.entries(VARIANT_METADATA)) {
        const style = meta.ctaStyle;
        if (ctaGroups[style]) {
            ctaGroups[style].push(`${variant} (size: ${meta.ctaSize})`);
        }
    }

    lines.push('**Outline style** (class="con-button primary-outline"):');
    lines.push(ctaGroups['primary-outline'].map((v) => `  - ${v}`).join('\n'));
    lines.push('');

    lines.push('**Solid style** (class="con-button primary"):');
    lines.push(ctaGroups['primary'].map((v) => `  - ${v}`).join('\n'));
    lines.push('');

    lines.push('**Accent style** (class="con-button accent"):');
    lines.push(ctaGroups['accent'].map((v) => `  - ${v}`).join('\n'));
    lines.push('');

    return lines.join('\n');
}

/**
 * Build quick selection guide
 */
function buildQuickReference() {
    return `
=== QUICK VARIANT SELECTION ===

**When user mentions surface**:
- "acom" or "adobe.com" → plans, catalog, mini, special-offers
- "ccd" or "desktop" → ccd-slice, ccd-suggested
- "commerce" → fries
- "adobe home" → ah-try-buy-widget, ah-promoted-plans
- "express" → simplified-pricing-express, full-pricing-express

**When user describes intent**:
- "pricing" or "subscription plan" → plans (or plans-students, plans-education)
- "product showcase" or "commerce" → fries
- "compact" or "small" → mini
- "limited time" or "sale" → special-offers
- "desktop app" → ccd-slice or ccd-suggested
- "catalog" or "browse" → catalog
`;
}

/**
 * Build RAG usage instructions
 * Tells the AI to query knowledge base for field details
 */
function buildRAGInstructions() {
    return `
=== FIELD MAPPING RETRIEVAL ===

For detailed field mappings (slots, tags, sizes) for any variant, the knowledge base
has been populated with complete documentation. When you need field-specific information:

1. The knowledge service will automatically provide relevant variant documentation
2. Field mappings include: slot names, HTML tags, size options, and special attributes
3. If field details are not in context, use general merch-card patterns

**Common slot patterns** (when RAG context unavailable):
- heading-xs, heading-s, heading-m: Title/heading content
- body-xs, body-s: Description/body text
- footer, cta: Call-to-action buttons
- badge: Badge/label content
- price: Pricing information

**Always remember**:
- All purchase CTAs need data-checkout-workflow="UCv2"
- Use correct CTA button class from the CTA reference above
- Match HTML structure to the variant's expected slots
`;
}

/**
 * Build complete variant knowledge for system prompt
 * @returns {Object} { fullPrompt, surfaceMapping, variants }
 */
export function buildVariantKnowledge() {
    const sections = [];

    sections.push(buildSurfaceReference());
    sections.push(buildCtaReference());
    sections.push(buildQuickReference());
    sections.push(buildRAGInstructions());

    return {
        fullPrompt: sections.join('\n'),
        surfaceMapping: SURFACE_MAPPINGS,
        variants: Object.keys(VARIANT_METADATA),
    };
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

/**
 * Get CTA styling for a variant
 */
export function getCtaStyling(variantName) {
    const meta = VARIANT_METADATA[variantName];
    if (!meta) return null;

    return {
        style: meta.ctaStyle,
        size: meta.ctaSize,
        className: `con-button ${meta.ctaStyle}`,
    };
}

/**
 * Build a RAG query for variant field details
 * @param {string} variantName - The variant to query
 * @returns {string} Query string optimized for RAG retrieval
 */
export function buildVariantRAGQuery(variantName) {
    return `${variantName} variant field mappings slots tags HTML structure`;
}
