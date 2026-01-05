/**
 * Markdown Generator Utilities
 *
 * Provides utilities for generating consistent markdown documentation
 * from extracted codebase information.
 */

/**
 * Generate a markdown table from array of objects
 * @param {Array<Object>} data - Array of row objects
 * @param {Array<{key: string, header: string}>} columns - Column definitions
 * @returns {string} Markdown table
 */
export function generateTable(data, columns) {
    if (!data || data.length === 0) return '';

    const headers = columns.map((col) => col.header);
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${columns.map(() => '---').join(' | ')} |`;

    const dataRows = data.map((row) => {
        const cells = columns.map((col) => {
            const value = row[col.key];
            if (value === undefined || value === null) return '-';
            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
            if (Array.isArray(value)) return value.join(', ') || '-';
            return String(value);
        });
        return `| ${cells.join(' | ')} |`;
    });

    return [headerRow, separatorRow, ...dataRows].join('\n');
}

/**
 * Generate a code block
 * @param {string} code - Code content
 * @param {string} language - Code language
 * @returns {string} Markdown code block
 */
export function generateCodeBlock(code, language = '') {
    return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Generate a bullet list
 * @param {Array<string>} items - List items
 * @param {number} indent - Indentation level
 * @returns {string} Markdown list
 */
export function generateList(items, indent = 0) {
    const prefix = '  '.repeat(indent);
    return items.map((item) => `${prefix}- ${item}`).join('\n');
}

/**
 * Convert camelCase to Title Case
 * @param {string} str - camelCase string
 * @returns {string} Title Case string
 */
export function camelToTitle(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}

/**
 * Convert kebab-case to Title Case
 * @param {string} str - kebab-case string
 * @returns {string} Title Case string
 */
export function kebabToTitle(str) {
    return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Generate variant documentation markdown
 * @param {Object} variant - Variant data
 * @returns {string} Markdown content
 */
export function generateVariantDoc(variant) {
    const sections = [];

    sections.push(`# ${variant.name} Variant\n`);

    sections.push(`## Overview\n`);
    sections.push(
        `The ${variant.name} variant is used for ${variant.description || 'displaying merch card content'}.\n`,
    );

    if (variant.fields && variant.fields.length > 0) {
        sections.push(`## Field Mappings\n`);

        const tableColumns = [
            { key: 'name', header: 'Field' },
            { key: 'slot', header: 'Slot' },
            { key: 'tag', header: 'Tag' },
            { key: 'size', header: 'Size' },
            { key: 'notes', header: 'Notes' },
        ];

        sections.push(generateTable(variant.fields, tableColumns));
        sections.push('');
    }

    if (variant.sizes && variant.sizes.length > 0) {
        sections.push(`## Available Sizes\n`);
        sections.push(generateList(variant.sizes));
        sections.push('');
    }

    if (variant.badgeColors && variant.badgeColors.length > 0) {
        sections.push(`## Allowed Badge Colors\n`);
        sections.push(generateList(variant.badgeColors));
        sections.push('');
    }

    if (variant.borderColors && variant.borderColors.length > 0) {
        sections.push(`## Allowed Border Colors\n`);
        sections.push(generateList(variant.borderColors));
        sections.push('');
    }

    if (variant.slots && variant.slots.length > 0) {
        sections.push(`## Slot Structure\n`);
        const slotHtml = variant.slots
            .map((slot) => `<slot name="${slot}"></slot>`)
            .join('\n');
        sections.push(generateCodeBlock(slotHtml, 'html'));
        sections.push('');
    }

    return sections.join('\n');
}

/**
 * Generate component documentation markdown
 * @param {Object} component - Component data
 * @returns {string} Markdown content
 */
export function generateComponentDoc(component) {
    const sections = [];

    sections.push(`# ${component.name}\n`);

    if (component.description) {
        sections.push(`## Overview\n`);
        sections.push(`${component.description}\n`);
    }

    if (component.tagName) {
        sections.push(`## Usage\n`);
        sections.push(generateCodeBlock(`<${component.tagName}></${component.tagName}>`, 'html'));
        sections.push('');
    }

    if (component.properties && component.properties.length > 0) {
        sections.push(`## Properties\n`);
        const tableColumns = [
            { key: 'name', header: 'Property' },
            { key: 'type', header: 'Type' },
            { key: 'default', header: 'Default' },
            { key: 'description', header: 'Description' },
        ];
        sections.push(generateTable(component.properties, tableColumns));
        sections.push('');
    }

    if (component.attributes && component.attributes.length > 0) {
        sections.push(`## Attributes\n`);
        const tableColumns = [
            { key: 'name', header: 'Attribute' },
            { key: 'type', header: 'Type' },
            { key: 'description', header: 'Description' },
        ];
        sections.push(generateTable(component.attributes, tableColumns));
        sections.push('');
    }

    if (component.events && component.events.length > 0) {
        sections.push(`## Events\n`);
        const tableColumns = [
            { key: 'name', header: 'Event' },
            { key: 'detail', header: 'Detail' },
            { key: 'description', header: 'Description' },
        ];
        sections.push(generateTable(component.events, tableColumns));
        sections.push('');
    }

    if (component.slots && component.slots.length > 0) {
        sections.push(`## Slots\n`);
        const tableColumns = [
            { key: 'name', header: 'Slot' },
            { key: 'description', header: 'Description' },
        ];
        sections.push(generateTable(component.slots, tableColumns));
        sections.push('');
    }

    return sections.join('\n');
}

/**
 * Generate pipeline documentation markdown
 * @param {Object} pipeline - Pipeline data
 * @returns {string} Markdown content
 */
export function generatePipelineDoc(pipeline) {
    const sections = [];

    sections.push(`# Fragment Pipeline\n`);

    sections.push(`## Overview\n`);
    sections.push(
        `The fragment pipeline processes AEM content fragments through a series of transformers to prepare them for display.\n`,
    );

    if (pipeline.transformers && pipeline.transformers.length > 0) {
        sections.push(`## Transformer Order\n`);
        sections.push(
            `Transformers run in sequence, each modifying the context object:\n`,
        );

        pipeline.transformers.forEach((transformer, index) => {
            sections.push(`### ${index + 1}. ${transformer.name}\n`);
            if (transformer.description) {
                sections.push(`${transformer.description}\n`);
            }
            if (transformer.contextChanges) {
                sections.push(`**Context modifications:**\n`);
                sections.push(generateList(transformer.contextChanges));
                sections.push('');
            }
        });
    }

    return sections.join('\n');
}
