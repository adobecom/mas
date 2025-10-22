/**
 * Variant Knowledge Builder
 *
 * Transforms variant configurations into AI-friendly documentation.
 * Single source of truth for variant knowledge used in system prompts.
 */

import { VARIANT_CONFIGS } from './variant-configs.js';

const SURFACE_MAPPINGS = {
    acom: ['plans', 'plans-students', 'plans-education', 'catalog', 'special-offers', 'mini', 'simplified-pricing-express'],
    ccd: ['ccd-slice', 'ccd-suggested'],
    commerce: ['fries'],
    'adobe-home': ['ah-try-buy-widget', 'ah-promoted-plans'],
};

function formatFieldMapping(mapping) {
    const lines = [];

    for (const [field, config] of Object.entries(mapping)) {
        if (config === true || config === false) {
            lines.push(`- ${field}: ${config ? 'enabled' : 'disabled'}`);
            continue;
        }

        const parts = [];
        if (config.tag) parts.push(`<${config.tag}>`);
        if (config.slot) parts.push(`slot="${config.slot}"`);
        if (config.attribute) parts.push(`${config.attribute} attribute`);
        if (config.size) parts.push(`size="${config.size}"`);
        if (config.default) parts.push(`default: "${config.default}"`);
        if (config.maxCount) parts.push(`max ${config.maxCount} chars`);

        if (parts.length > 0) {
            lines.push(`- ${field}: ${parts.join(', ')}`);
        }
    }

    return lines.join('\n');
}

function buildVariantDoc(variantName, config) {
    if (!config) return '';

    const requiredFields = config.requiredFields?.join(', ') || 'none';
    const optionalFields = config.optionalFields?.join(', ') || 'none';
    const sizes = config.sizes?.length > 0 ? config.sizes.join(', ') : 'default only';

    return `
## ${config.name.toUpperCase()} (${variantName})

**Description**: ${config.description}

**Use Case**: ${getSurfaceNameForVariant(variantName)} surface - ${config.description}

**CTA Convention**:
- Style: \`class="con-button ${config.ctaStyle}"\`
- Size: ${config.ctaSize}

**Required Fields**: ${requiredFields}

**Optional Fields**: ${optionalFields}

**Available Sizes**: ${sizes}

**Field Mappings**:
${formatFieldMapping(config.mapping)}

**HTML Structure Example**:
\`\`\`html
${generateExampleHTML(variantName, config)}
\`\`\`
`;
}

function getSurfaceNameForVariant(variantName) {
    for (const [surface, variants] of Object.entries(SURFACE_MAPPINGS)) {
        if (variants.includes(variantName)) {
            return surface;
        }
    }
    return 'unknown';
}

function generateExampleHTML(variantName, config) {
    const examples = {
        plans: `<merch-card variant="plans">
  <h3 slot="heading-xs">Creative Cloud All Apps</h3>
  <p slot="subtitle">Everything you need to create</p>
  <p slot="heading-m"><span class="heading-xs">US$59.99/mo</span></p>
  <div slot="body-xs">
    <p>Get <strong>20+ creative apps</strong> including Photoshop, Illustrator, and more.</p>
  </div>
  <p slot="footer">
    <a href="#" class="con-button primary-outline" data-checkout-workflow="UCv2">Buy now</a>
  </p>
</merch-card>`,

        fries: `<merch-card variant="fries">
  <h3 slot="heading-xxs">Adobe Express Premium</h3>
  <div slot="body-s">
    <p>Create stunning content with <strong>premium templates</strong>.</p>
  </div>
  <p slot="cta">
    <a href="#" class="con-button primary" data-checkout-workflow="UCv2">Buy now</a>
  </p>
</merch-card>`,

        mini: `<merch-card variant="mini">
  <p slot="title">Start Your Free Trial</p>
  <p slot="description">Try all features for 7 days</p>
  <p slot="ctas">
    <a href="#" class="con-button primary-outline">Start free trial</a>
  </p>
</merch-card>`,

        'ccd-slice': `<merch-card variant="ccd-slice">
  <div slot="body-s">
    <p>Launch your creative projects faster</p>
  </div>
  <p slot="footer">
    <a href="#" class="con-button primary-outline">Get started</a>
  </p>
</merch-card>`,

        'special-offers': `<merch-card variant="special-offers">
  <h4 slot="detail-m">Creative Cloud Sale</h4>
  <h3 slot="heading-xs">
    <span class="strikethrough">$79.99</span> $54.99
  </h3>
  <p slot="footer">
    <a href="#" class="con-button accent" data-checkout-workflow="UCv2">Save now</a>
  </p>
</merch-card>`,
    };

    return examples[variantName] || `<!-- Example HTML for ${variantName} -->`;
}

function buildSurfaceReference() {
    const lines = ['=== VARIANT BY SURFACE ===\n'];

    lines.push('Choose the right variant based on where the card will be used:\n');

    for (const [surface, variants] of Object.entries(SURFACE_MAPPINGS)) {
        lines.push(`**${surface.toUpperCase()}**:`);
        variants.forEach((variant) => {
            const config = VARIANT_CONFIGS[variant];
            if (config) {
                lines.push(`  - ${variant}: ${config.description}`);
            } else {
                lines.push(`  - ${variant}: (configuration pending)`);
            }
        });
        lines.push('');
    }

    return lines.join('\n');
}

function buildQuickReference() {
    return `
=== QUICK VARIANT SELECTION ===

**When user mentions surface**:
- "acom" or "adobe.com" → plans, catalog, mini, special-offers
- "ccd" or "desktop" → ccd-slice, ccd-suggested
- "commerce" → fries
- "adobe home" → ah-try-buy-widget, ah-promoted-plans

**When user describes intent**:
- "pricing" or "subscription plan" → plans (or plans-students, plans-education)
- "product showcase" or "commerce" → fries
- "compact" or "small" → mini
- "limited time" or "sale" → special-offers
- "desktop app" → ccd-slice or ccd-suggested
- "catalog" or "browse" → catalog

**CTA Button Classes by Variant**:
- plans, plans-students, plans-education → "con-button primary-outline"
- fries, ccd-suggested → "con-button primary" (SOLID!)
- mini, ccd-slice, catalog → "con-button primary-outline"
- special-offers → "con-button accent"
`;
}

export function buildVariantKnowledge() {
    const sections = [];

    sections.push(buildSurfaceReference());
    sections.push(buildQuickReference());

    sections.push('\n=== DETAILED VARIANT SPECIFICATIONS ===\n');

    for (const [variantName, config] of Object.entries(VARIANT_CONFIGS)) {
        sections.push(buildVariantDoc(variantName, config));
    }

    sections.push(`
=== IMPORTANT REMINDERS ===

1. **Always use correct CTA class**: Check variant's ctaStyle - fries and ccd-suggested use "primary" (solid), most others use "primary-outline"
2. **Include checkout attributes**: All purchase CTAs need data-checkout-workflow="UCv2"
3. **Match HTML structure exactly**: Use correct tags and slots from field mappings
4. **Respect size options**: Only use sizes listed in variant config
5. **Surface context matters**: Consider where the card will be displayed when selecting variant
`);

    return {
        fullPrompt: sections.join('\n'),
        surfaceMapping: SURFACE_MAPPINGS,
        variants: Object.keys(VARIANT_CONFIGS),
    };
}

export function getVariantsForSurface(surface) {
    return SURFACE_MAPPINGS[surface] || [];
}

export function getSurfaceForVariant(variantName) {
    for (const [surface, variants] of Object.entries(SURFACE_MAPPINGS)) {
        if (variants.includes(variantName)) {
            return surface;
        }
    }
    return null;
}
