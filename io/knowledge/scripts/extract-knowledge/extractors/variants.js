/**
 * Variant Extractor
 *
 * Extracts variant documentation from web-components/src/variants/*.js files.
 * Parses AEM_FRAGMENT_MAPPING exports to generate field documentation.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { generateVariantDoc, kebabToTitle } from '../generators/markdown.js';

const WEB_COMPONENTS_PATH = 'web-components/src/variants';

/**
 * Parse AEM_FRAGMENT_MAPPING from file content
 * @param {string} content - File content
 * @param {string} variantName - Variant name for context
 * @returns {Object|null} Parsed mapping or null
 */
function parseFragmentMapping(content, variantName) {
    const mappingRegex = /export\s+const\s+(\w+_AEM_FRAGMENT_MAPPING)\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;
    const matches = [...content.matchAll(mappingRegex)];

    if (matches.length === 0) return null;

    const mappings = [];
    for (const match of matches) {
        const mappingName = match[1];
        const mappingContent = match[2];
        mappings.push({ name: mappingName, content: mappingContent });
    }

    return mappings;
}

/**
 * Parse individual field from mapping content
 * @param {string} fieldName - Name of the field
 * @param {string} fieldValue - Value expression
 * @returns {Object} Parsed field info
 */
function parseField(fieldName, fieldValue) {
    const field = {
        name: fieldName,
        slot: '-',
        tag: '-',
        size: '-',
        notes: '',
    };

    if (fieldValue === 'true' || fieldValue === 'false') {
        field.notes = fieldValue === 'true' ? 'Boolean flag' : 'Disabled';
        return field;
    }

    const slotMatch = fieldValue.match(/slot:\s*['"]([^'"]+)['"]/);
    if (slotMatch) field.slot = slotMatch[1];

    const tagMatch = fieldValue.match(/tag:\s*['"]([^'"]+)['"]/);
    if (tagMatch) field.tag = tagMatch[1];

    const sizeMatch = fieldValue.match(/size:\s*['"]([^'"]+)['"]/);
    if (sizeMatch) field.size = sizeMatch[1];

    const attributeMatch = fieldValue.match(/attribute:\s*['"]([^'"]+)['"]/);
    if (attributeMatch) field.notes = `Sets ${attributeMatch[1]} attribute`;

    const defaultMatch = fieldValue.match(/default:\s*['"]([^'"]+)['"]/);
    if (defaultMatch) field.notes = `Default: ${defaultMatch[1]}`;

    if (fieldValue.includes('[') && !fieldValue.includes('slot')) {
        const sizesMatch = fieldValue.match(/\[([^\]]+)\]/);
        if (sizesMatch) {
            field.notes = `Sizes: ${sizesMatch[1].replace(/'/g, '')}`;
        }
    }

    return field;
}

/**
 * Parse all fields from mapping content
 * @param {string} mappingContent - Content inside the mapping object
 * @returns {Array} Array of parsed fields
 */
function parseFields(mappingContent) {
    const fields = [];
    const lines = mappingContent.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('...')) continue;

        const fieldMatch = trimmed.match(/^(\w+):\s*(.+?),?\s*$/);
        if (fieldMatch) {
            const [, fieldName, fieldValue] = fieldMatch;
            if (fieldName === 'allowedBadgeColors' || fieldName === 'allowedBorderColors') {
                continue;
            }
            fields.push(parseField(fieldName, fieldValue));
        }
    }

    return fields;
}

/**
 * Extract sizes from mapping
 * @param {string} mappingContent - Mapping content
 * @returns {Array<string>} Available sizes
 */
function extractSizes(mappingContent) {
    const sizeMatch = mappingContent.match(/size:\s*\[([^\]]+)\]/);
    if (!sizeMatch) return [];

    return sizeMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/'/g, ''))
        .filter(Boolean);
}

/**
 * Extract allowed colors from mapping
 * @param {string} mappingContent - Mapping content
 * @param {string} colorType - 'Badge' or 'Border'
 * @returns {Array<string>} Allowed colors
 */
function extractColors(mappingContent, colorType) {
    const regex = new RegExp(`allowed${colorType}Colors:\\s*\\[([^\\]]+)\\]`);
    const match = mappingContent.match(regex);
    if (!match) return [];

    return match[1]
        .split(',')
        .map((s) => s.trim().replace(/'/g, ''))
        .filter(Boolean);
}

/**
 * Extract slots from variant class
 * @param {string} content - File content
 * @returns {Array<string>} Slot names
 */
function extractSlots(content) {
    const slotRegex = /slot\s*name=["']([^"']+)["']/g;
    const slots = new Set();

    let match;
    while ((match = slotRegex.exec(content)) !== null) {
        slots.add(match[1]);
    }

    return [...slots];
}

/**
 * Get variant description based on name
 * @param {string} variantName - Variant name
 * @returns {string} Description
 */
function getVariantDescription(variantName) {
    const descriptions = {
        catalog: 'product catalog cards with action menus and detailed product information',
        plans: 'subscription plan cards with pricing, features, and CTAs',
        'plans-education': 'education-focused plan cards with simplified layout',
        'plans-students': 'student-specific plan cards with streamlined options',
        'plans-v2': 'modern plan cards with enhanced pricing display',
        'ccd-slice': 'compact Creative Cloud Desktop slice cards',
        'ccd-suggested': 'suggested product cards for Creative Cloud Desktop',
        'special-offers': 'promotional special offer cards with callouts',
        mini: 'minimal compact cards for tight spaces',
        'simplified-pricing-express': 'Express pricing cards with simplified display',
        'full-pricing-express': 'Full Express pricing cards with complete feature details',
        'ah-try-buy-widget': 'Adobe Home try-before-buy widget cards',
        'ah-promoted-plans': 'Adobe Home promoted plan cards',
        fries: 'commerce checkout recommendation cards',
    };

    return descriptions[variantName] || 'displaying merch card content';
}

/**
 * Extract variant data from a file
 * @param {string} filePath - Path to variant file
 * @returns {Array<Object>} Extracted variant data
 */
function extractVariantFromFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const fileName = basename(filePath, '.js');

    const mappings = parseFragmentMapping(content, fileName);
    if (!mappings) return [];

    const variants = [];

    for (const mapping of mappings) {
        const variantName = mapping.name.replace('_AEM_FRAGMENT_MAPPING', '').toLowerCase().replace(/_/g, '-');

        const fields = parseFields(mapping.content);
        const sizes = extractSizes(mapping.content);
        const badgeColors = extractColors(mapping.content, 'Badge');
        const borderColors = extractColors(mapping.content, 'Border');
        const slots = extractSlots(content);

        variants.push({
            name: kebabToTitle(variantName),
            slug: variantName,
            description: getVariantDescription(variantName),
            fields,
            sizes,
            badgeColors,
            borderColors,
            slots,
            sourceFile: fileName,
        });
    }

    return variants;
}

/**
 * Extract all variants from web-components
 * @param {string} basePath - Base path to the project
 * @returns {Array<Object>} All extracted variants
 */
export function extractAllVariants(basePath) {
    const variantsDir = join(basePath, WEB_COMPONENTS_PATH);

    if (!existsSync(variantsDir)) {
        console.error(`Variants directory not found: ${variantsDir}`);
        return [];
    }

    const files = readdirSync(variantsDir).filter(
        (f) => f.endsWith('.js') && !f.endsWith('.css.js') && f !== 'variants.js' && f !== 'variant-layout.js',
    );

    const allVariants = [];

    for (const file of files) {
        const filePath = join(variantsDir, file);
        const variants = extractVariantFromFile(filePath);
        allVariants.push(...variants);
    }

    return allVariants;
}

/**
 * Generate variant documentation files
 * @param {string} basePath - Base path to the project
 * @param {string} outputDir - Output directory for markdown files
 * @param {Object} options - Options
 * @returns {Array<string>} Generated file paths
 */
export async function generateVariantDocs(basePath, outputDir, options = {}) {
    const variants = extractAllVariants(basePath);
    const generatedFiles = [];

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    for (const variant of variants) {
        const markdown = generateVariantDoc(variant);
        const fileName = `${variant.slug}.md`;
        const filePath = join(outputDir, fileName);

        if (options.dryRun) {
            console.log(`[DRY RUN] Would write: ${filePath}`);
            if (options.verbose) {
                console.log(`${markdown.substring(0, 200)}...\n`);
            }
        } else {
            writeFileSync(filePath, markdown);
            generatedFiles.push(filePath);
            if (options.verbose) {
                console.log(`Generated: ${filePath}`);
            }
        }
    }

    return generatedFiles;
}
