/**
 * Editor Fields Extractor
 *
 * Extracts editor field documentation from studio/src/editors.
 * Documents field sections, types, and variant-specific visibility.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateTable } from '../generators/markdown.js';

const EDITOR_PATH = 'studio/src/editors/merch-card-editor.js';

const FIELD_DESCRIPTIONS = {
    mnemonics:
        'Product icon/mnemonic display. Shows the Adobe product icon.',
    badge: 'Badge text displayed on the card (e.g., "Best Value", "New").',
    trialBadge: 'Trial-specific badge for trial offers.',
    'border-color': 'Card border color selection from allowed palette.',
    whatsIncluded:
        "What's included list content. Rich text field for feature lists.",
    quantitySelect:
        'Quantity selector configuration for license quantity selection.',
    description:
        'Main product description. Rich text field with formatting support.',
    shortDescription:
        'Short description shown in action menu or compact views.',
    callout:
        'Callout text for highlighting special information.',
    ctas: 'Call-to-action buttons. Supports multiple CTAs with checkout links.',
    secureLabel:
        'Secure transaction label toggle (shows lock icon and "Secure transaction" text).',
    planType:
        'Plan type indicator (monthly, annual, etc.).',
    addon: 'Add-on product configuration.',
    title: 'Card title. Main heading displayed prominently.',
    subtitle: 'Card subtitle. Secondary heading below the title.',
    prices:
        'Pricing display. Shows price from WCS using inline-price component.',
    promoText:
        'Promotional text displayed near price (e.g., "Save 40%").',
    backgroundImage: 'Background image for card variants that support it.',
    size: 'Card size selection (default, wide, super-wide).',
};

const SECTION_DESCRIPTIONS = {
    Visuals:
        'Visual elements that define the card appearance including icons, badges, and colors.',
    "What's included":
        'Feature list and quantity configuration for the product offering.',
    'Product details':
        'Content fields describing the product including descriptions and callouts.',
    Footer: 'Call-to-action buttons and links at the bottom of the card.',
    'Options and settings':
        'Additional configuration options for the card display.',
};

/**
 * Extract SECTION_FIELDS from editor file
 * @param {string} content - File content
 * @returns {Object} Section fields mapping
 */
function extractSectionFields(content) {
    const match = content.match(
        /static\s+SECTION_FIELDS\s*=\s*\{([\s\S]*?)\};/,
    );
    if (!match) return {};

    const sections = {};
    const sectionMatches = match[1].matchAll(
        /['"]?([^'":\n]+)['"]?\s*:\s*\[([^\]]+)\]/g,
    );

    for (const [, sectionName, fieldsStr] of sectionMatches) {
        const fields = fieldsStr
            .match(/['"]([^'"]+)['"]/g)
            ?.map((f) => f.replace(/['"]/g, ''));
        if (fields) {
            sections[sectionName.trim()] = fields;
        }
    }

    return sections;
}

/**
 * Extract variant-specific RTE marks
 * @param {string} content - File content
 * @returns {Object} Variant RTE configuration
 */
function extractVariantRTEMarks(content) {
    const match = content.match(
        /const\s+VARIANT_RTE_MARKS\s*=\s*\{([\s\S]*?)\};/,
    );
    if (!match) return {};

    return {};
}

/**
 * Extract editor configuration
 * @param {string} basePath - Base path to the project
 * @returns {Object} Editor configuration
 */
export function extractEditorConfig(basePath) {
    const filePath = join(basePath, EDITOR_PATH);

    if (!existsSync(filePath)) {
        console.warn(`Editor file not found: ${filePath}`);
        return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const sectionFields = extractSectionFields(content);

    return {
        sectionFields,
        fieldDescriptions: FIELD_DESCRIPTIONS,
        sectionDescriptions: SECTION_DESCRIPTIONS,
    };
}

/**
 * Generate editor fields documentation
 * @param {string} basePath - Base path to the project
 * @param {string} outputDir - Output directory
 * @param {Object} options - Options
 * @returns {Array<string>} Generated file paths
 */
export async function generateEditorFieldsDocs(basePath, outputDir, options = {}) {
    const config = extractEditorConfig(basePath);
    if (!config) return [];

    const generatedFiles = [];

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const markdown = generateEditorFieldsMarkdown(config);
    const filePath = join(outputDir, 'editor-fields.md');

    if (options.dryRun) {
        console.log(`[DRY RUN] Would write: ${filePath}`);
        if (options.verbose) {
            console.log(
                `  Sections: ${Object.keys(config.sectionFields).length}\n`,
            );
        }
    } else {
        writeFileSync(filePath, markdown);
        generatedFiles.push(filePath);
        if (options.verbose) {
            console.log(`Generated: ${filePath}`);
        }
    }

    return generatedFiles;
}

/**
 * Generate editor fields markdown
 * @param {Object} config - Editor configuration
 * @returns {string} Markdown content
 */
function generateEditorFieldsMarkdown(config) {
    const sections = [];

    sections.push(`# MAS Studio Editor Fields\n`);
    sections.push(`## Overview\n`);
    sections.push(
        `The Merch Card Editor organizes fields into sections for easy navigation and editing.\n`,
    );

    sections.push(`## Field Sections\n`);

    for (const [sectionName, fields] of Object.entries(config.sectionFields)) {
        sections.push(`### ${sectionName}\n`);

        const sectionDesc = config.sectionDescriptions[sectionName];
        if (sectionDesc) {
            sections.push(`${sectionDesc}\n`);
        }

        const fieldData = fields.map((field) => ({
            name: field,
            description: config.fieldDescriptions[field] || '',
        }));

        const tableColumns = [
            { key: 'name', header: 'Field' },
            { key: 'description', header: 'Description' },
        ];

        sections.push(generateTable(fieldData, tableColumns));
        sections.push('');
    }

    sections.push(`## All Available Fields\n`);
    sections.push(`Complete reference of all editor fields:\n`);

    const allFields = Object.entries(config.fieldDescriptions).map(
        ([name, description]) => ({
            name,
            description,
        }),
    );

    const tableColumns = [
        { key: 'name', header: 'Field' },
        { key: 'description', header: 'Description' },
    ];

    sections.push(generateTable(allFields, tableColumns));
    sections.push('');

    sections.push(`## Variant-Specific Fields\n`);
    sections.push(
        `Some fields only appear for certain card variants. The variant's fragment mapping defines which fields are available.\n`,
    );
    sections.push(`- Check the variant documentation for field availability`);
    sections.push(`- Fields not in the mapping will be hidden in the editor`);
    sections.push(
        `- Some variants have custom RTE marks for specialized formatting\n`,
    );

    return sections.join('\n');
}
