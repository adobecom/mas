/**
 * Web Components Extractor
 *
 * Extracts documentation from web component source files.
 * Parses JSDoc comments, properties, attributes, events, and slots.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateComponentDoc, camelToTitle } from '../generators/markdown.js';

const WEB_COMPONENTS_PATH = 'web-components/src';

const COMPONENTS_TO_DOCUMENT = [
    {
        file: 'merch-card.js',
        name: 'Merch Card',
        tagName: 'merch-card',
        description:
            'The main merch card web component that displays product information, pricing, and call-to-action buttons. Supports multiple variants for different use cases.',
    },
    {
        file: 'inline-price.js',
        name: 'Inline Price',
        tagName: 'span[is="inline-price"]',
        description:
            'Displays dynamic pricing information from WCS (Web Commerce Service). Automatically resolves offers and formats prices based on locale.',
    },
    {
        file: 'sidenav.js',
        name: 'Merch Sidenav',
        tagName: 'merch-sidenav',
        description:
            'Side navigation component for filtering and navigating merch card collections. Supports nested items and selection states.',
    },
    {
        file: 'merch-mnemonic.js',
        name: 'Merch Mnemonic',
        tagName: 'merch-mnemonic',
        description:
            'Displays product icons/mnemonics. Automatically resolves product icons from Adobe icon service.',
    },
    {
        file: 'checkout-link.js',
        name: 'Checkout Link',
        tagName: 'a[is="checkout-link"]',
        description:
            'Enhanced anchor element that generates checkout URLs. Handles offer resolution and checkout parameter generation.',
    },
];

/**
 * Extract JSDoc comments from file
 * @param {string} content - File content
 * @returns {Array<Object>} Extracted JSDoc blocks
 */
function extractJSDocBlocks(content) {
    const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
    const blocks = content.match(jsdocRegex) || [];

    return blocks.map((block) => {
        const description = block
            .replace(/\/\*\*|\*\//g, '')
            .replace(/^\s*\*\s?/gm, '')
            .trim();

        const tags = {};
        const tagMatches = description.matchAll(/@(\w+)\s+(.+)/g);
        for (const match of tagMatches) {
            const [, tagName, tagValue] = match;
            if (!tags[tagName]) tags[tagName] = [];
            tags[tagName].push(tagValue.trim());
        }

        const cleanDescription = description
            .replace(/@\w+\s+.+/g, '')
            .trim()
            .split('\n')[0];

        return { description: cleanDescription, tags };
    });
}

/**
 * Extract static properties from Lit component
 * @param {string} content - File content
 * @returns {Array<Object>} Extracted properties
 */
function extractProperties(content) {
    const properties = [];

    const propsRegex =
        /static\s+(?:get\s+)?properties\s*(?:\(\))?\s*(?:=\s*\{|{\s*return\s*\{)([\s\S]*?)\}/;
    const match = content.match(propsRegex);

    if (!match) return properties;

    const propsContent = match[1];
    const propMatches = propsContent.matchAll(
        /(\w+):\s*\{\s*type:\s*(\w+)(?:,\s*reflect:\s*(true|false))?(?:,\s*attribute:\s*['"]([^'"]+)['"])?/g,
    );

    for (const propMatch of propMatches) {
        const [, name, type, reflect, attribute] = propMatch;
        properties.push({
            name,
            type: type.toLowerCase(),
            default: '-',
            description: attribute
                ? `Reflected from "${attribute}" attribute`
                : reflect === 'true'
                  ? 'Reflected to attribute'
                  : '',
        });
    }

    return properties;
}

/**
 * Extract custom events dispatched by component
 * @param {string} content - File content
 * @returns {Array<Object>} Extracted events
 */
function extractEvents(content) {
    const events = [];

    const dispatchRegex =
        /this\.dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = dispatchRegex.exec(content)) !== null) {
        events.push({
            name: match[1],
            detail: '-',
            description: '',
        });
    }

    const eventConstRegex = /EVENT_\w+\s*=\s*['"]([^'"]+)['"]/g;
    while ((match = eventConstRegex.exec(content)) !== null) {
        if (!events.find((e) => e.name === match[1])) {
            events.push({
                name: match[1],
                detail: '-',
                description: '',
            });
        }
    }

    return events;
}

/**
 * Extract slots from component
 * @param {string} content - File content
 * @returns {Array<Object>} Extracted slots
 */
function extractSlots(content) {
    const slots = [];
    const slotRegex = /<slot(?:\s+name=["']([^"']+)["'])?/g;

    let match;
    while ((match = slotRegex.exec(content)) !== null) {
        const name = match[1] || '(default)';
        if (!slots.find((s) => s.name === name)) {
            slots.push({
                name,
                description: '',
            });
        }
    }

    return slots;
}

/**
 * Extract observed attributes
 * @param {string} content - File content
 * @returns {Array<Object>} Extracted attributes
 */
function extractAttributes(content) {
    const attributes = [];

    const observedRegex =
        /static\s+get\s+observedAttributes\s*\(\)\s*\{\s*return\s*\[([^\]]+)\]/;
    const observedMatch = content.match(observedRegex);

    if (observedMatch) {
        const attrStrings = observedMatch[1].match(/['"]([^'"]+)['"]/g) || [];
        for (const attrStr of attrStrings) {
            const attr = attrStr.replace(/['"]/g, '');
            attributes.push({
                name: attr,
                type: 'string',
                description: '',
            });
        }
    }

    const attrGetterRegex =
        /get\s+(\w+)\s*\(\)\s*\{\s*return\s+this\.getAttribute\s*\(\s*['"]([^'"]+)['"]/g;
    let getterMatch;
    while ((getterMatch = attrGetterRegex.exec(content)) !== null) {
        const [, propName, attrName] = getterMatch;
        if (!attributes.find((a) => a.name === attrName)) {
            attributes.push({
                name: attrName,
                type: 'string',
                description: `Maps to ${propName} property`,
            });
        }
    }

    return attributes;
}

/**
 * Extract component data from file
 * @param {string} basePath - Base path to the project
 * @param {Object} componentDef - Component definition
 * @returns {Object} Component data
 */
function extractComponentFromFile(basePath, componentDef) {
    const filePath = join(basePath, WEB_COMPONENTS_PATH, componentDef.file);

    if (!existsSync(filePath)) {
        console.warn(`Component file not found: ${filePath}`);
        return null;
    }

    const content = readFileSync(filePath, 'utf-8');

    const component = {
        name: componentDef.name,
        tagName: componentDef.tagName,
        description: componentDef.description,
        properties: extractProperties(content),
        attributes: extractAttributes(content),
        events: extractEvents(content),
        slots: extractSlots(content),
        sourceFile: componentDef.file,
    };

    return component;
}

/**
 * Extract all components
 * @param {string} basePath - Base path to the project
 * @returns {Array<Object>} Extracted components
 */
export function extractAllComponents(basePath) {
    const components = [];

    for (const componentDef of COMPONENTS_TO_DOCUMENT) {
        const component = extractComponentFromFile(basePath, componentDef);
        if (component) {
            components.push(component);
        }
    }

    return components;
}

/**
 * Generate component documentation files
 * @param {string} basePath - Base path to the project
 * @param {string} outputDir - Output directory
 * @param {Object} options - Options
 * @returns {Array<string>} Generated file paths
 */
export async function generateComponentDocs(basePath, outputDir, options = {}) {
    const components = extractAllComponents(basePath);
    const generatedFiles = [];

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    for (const component of components) {
        const markdown = generateComponentDoc(component);
        const fileName = `${component.sourceFile.replace('.js', '')}.md`;
        const filePath = join(outputDir, fileName);

        if (options.dryRun) {
            console.log(`[DRY RUN] Would write: ${filePath}`);
            if (options.verbose) {
                console.log(
                    `  Properties: ${component.properties.length}, Events: ${component.events.length}, Slots: ${component.slots.length}\n`,
                );
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
