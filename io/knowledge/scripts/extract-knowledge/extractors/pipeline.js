/**
 * Pipeline Extractor
 *
 * Extracts documentation from the fragment pipeline transformers.
 * Documents the transformer order, responsibilities, and context modifications.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generatePipelineDoc, camelToTitle } from '../generators/markdown.js';

const PIPELINE_PATH = 'io/www/src/fragment';

const TRANSFORMER_DESCRIPTIONS = {
    fetchFragment: {
        name: 'Fetch Fragment',
        description:
            'Fetches the fragment content from Odin (AEM). Handles locale-based lookups and caching.',
        contextChanges: [
            'Sets `body` with raw fragment data',
            'Sets `fragmentsIds` with locale-specific fragment IDs',
            'Sets `status` to indicate success or failure',
        ],
    },
    promotions: {
        name: 'Promotions',
        description:
            'Applies promotional offers and pricing overrides based on active campaigns.',
        contextChanges: [
            'May modify `body.fields` with promotional content',
            'Applies promo codes to pricing fields',
        ],
    },
    customize: {
        name: 'Customize (Locale)',
        description:
            'Handles locale customization and translation lookups. Falls back to default locale if regional translation not found.',
        contextChanges: [
            'May fetch translated fragment variation',
            'Updates `body` with localized content',
            'Sets `translatedStatus` for debugging',
        ],
    },
    settings: {
        name: 'Settings',
        description:
            'Applies global and surface-specific settings to the fragment.',
        contextChanges: [
            'Merges settings into context',
            'Applies display configurations',
        ],
    },
    replace: {
        name: 'Replace',
        description:
            'Performs content replacements and placeholder substitutions in fragment fields.',
        contextChanges: [
            'Replaces placeholder tokens in field values',
            'Applies text transformations',
        ],
    },
    wcs: {
        name: 'WCS (Web Commerce Service)',
        description:
            'Integrates pricing data from Web Commerce Service. Resolves offer IDs to actual pricing.',
        contextChanges: [
            'Resolves `osi` (Offer Selector IDs) to pricing',
            'Adds `resolvedOffers` with price data',
            'Prefills WCS cache for performance',
        ],
    },
    corrector: {
        name: 'Corrector',
        description:
            'Final corrections and validation. Ensures output format is correct.',
        contextChanges: [
            'Validates final output structure',
            'Applies any last-minute corrections',
            'Ensures required fields are present',
        ],
    },
};

const PIPELINE_ORDER = [
    'fetchFragment',
    'promotions',
    'customize',
    'settings',
    'replace',
    'wcs',
    'corrector',
];

/**
 * Extract JSDoc from transformer file
 * @param {string} content - File content
 * @returns {string} Extracted description
 */
function extractTransformerJSDoc(content) {
    const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (!jsdocMatch) return '';

    return jsdocMatch[0]
        .replace(/\/\*\*|\*\//g, '')
        .replace(/^\s*\*\s?/gm, '')
        .trim()
        .split('\n')[0];
}

/**
 * Check if transformer has init function
 * @param {string} content - File content
 * @returns {boolean}
 */
function hasInitFunction(content) {
    return /export\s+(?:async\s+)?function\s+init|\.init\s*=/.test(content);
}

/**
 * Extract transformer data from file
 * @param {string} basePath - Base path to the project
 * @param {string} transformerName - Transformer name
 * @returns {Object} Transformer data
 */
function extractTransformer(basePath, transformerName) {
    const fileName = `${transformerName}.js`;
    const filePath = join(basePath, PIPELINE_PATH, 'transformers', fileName);

    if (!existsSync(filePath)) {
        console.warn(`Transformer file not found: ${filePath}`);
        return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const staticInfo = TRANSFORMER_DESCRIPTIONS[transformerName] || {
        name: camelToTitle(transformerName),
        description: extractTransformerJSDoc(content),
        contextChanges: [],
    };

    return {
        ...staticInfo,
        hasInit: hasInitFunction(content),
        sourceFile: fileName,
    };
}

/**
 * Extract all pipeline transformers
 * @param {string} basePath - Base path to the project
 * @returns {Object} Pipeline data
 */
export function extractPipeline(basePath) {
    const transformers = [];

    for (const transformerName of PIPELINE_ORDER) {
        const transformer = extractTransformer(basePath, transformerName);
        if (transformer) {
            transformers.push(transformer);
        }
    }

    return {
        name: 'Fragment Pipeline',
        description:
            'The fragment pipeline processes AEM content fragments through a series of transformers to prepare them for display on consuming surfaces.',
        transformers,
    };
}

/**
 * Generate pipeline documentation
 * @param {string} basePath - Base path to the project
 * @param {string} outputDir - Output directory
 * @param {Object} options - Options
 * @returns {Array<string>} Generated file paths
 */
export async function generatePipelineDocs(basePath, outputDir, options = {}) {
    const pipeline = extractPipeline(basePath);
    const generatedFiles = [];

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const overviewMarkdown = generatePipelineOverview(pipeline);
    const overviewPath = join(outputDir, 'overview.md');

    if (options.dryRun) {
        console.log(`[DRY RUN] Would write: ${overviewPath}`);
        if (options.verbose) {
            console.log(`  Transformers: ${pipeline.transformers.length}\n`);
        }
    } else {
        writeFileSync(overviewPath, overviewMarkdown);
        generatedFiles.push(overviewPath);
        if (options.verbose) {
            console.log(`Generated: ${overviewPath}`);
        }
    }

    const transformersMarkdown = generateTransformersDoc(pipeline);
    const transformersPath = join(outputDir, 'transformers.md');

    if (options.dryRun) {
        console.log(`[DRY RUN] Would write: ${transformersPath}`);
    } else {
        writeFileSync(transformersPath, transformersMarkdown);
        generatedFiles.push(transformersPath);
        if (options.verbose) {
            console.log(`Generated: ${transformersPath}`);
        }
    }

    return generatedFiles;
}

/**
 * Generate pipeline overview markdown
 * @param {Object} pipeline - Pipeline data
 * @returns {string} Markdown content
 */
function generatePipelineOverview(pipeline) {
    const sections = [];

    sections.push(`# Fragment Pipeline Overview\n`);
    sections.push(`## What is the Fragment Pipeline?\n`);
    sections.push(`${pipeline.description}\n`);

    sections.push(`## Pipeline Flow\n`);
    sections.push(
        `Fragments are processed through these transformers in order:\n`,
    );

    pipeline.transformers.forEach((t, i) => {
        sections.push(`${i + 1}. **${t.name}** - ${t.description.split('.')[0]}`);
    });

    sections.push('');
    sections.push(`## How It Works\n`);
    sections.push(`1. A request comes in with a fragment path and locale`);
    sections.push(`2. Each transformer runs in sequence, modifying a shared context object`);
    sections.push(`3. Transformers with \`init()\` functions pre-fetch data in parallel`);
    sections.push(`4. The final context contains the processed fragment data`);
    sections.push(`5. Response is compressed with Brotli and cached at edge\n`);

    sections.push(`## Context Object\n`);
    sections.push(`The context object flows through all transformers and accumulates data:\n`);
    sections.push('```javascript');
    sections.push(`{
  path: '/content/dam/mas/...',  // Fragment path
  locale: 'en_US',               // Requested locale
  body: { ... },                 // Fragment content
  fragmentsIds: { ... },         // Locale-specific IDs
  status: 200,                   // HTTP status
  resolvedOffers: { ... },       // WCS pricing data
}`);
    sections.push('```\n');

    return sections.join('\n');
}

/**
 * Generate transformers documentation
 * @param {Object} pipeline - Pipeline data
 * @returns {string} Markdown content
 */
function generateTransformersDoc(pipeline) {
    const sections = [];

    sections.push(`# Pipeline Transformers\n`);
    sections.push(
        `Detailed documentation for each transformer in the fragment pipeline.\n`,
    );

    for (const transformer of pipeline.transformers) {
        sections.push(`## ${transformer.name}\n`);
        sections.push(`**Source:** \`${transformer.sourceFile}\`\n`);
        if (transformer.hasInit) {
            sections.push(`**Has Init:** Yes (pre-fetches data in parallel)\n`);
        }
        sections.push(`${transformer.description}\n`);

        if (transformer.contextChanges && transformer.contextChanges.length > 0) {
            sections.push(`### Context Modifications\n`);
            for (const change of transformer.contextChanges) {
                sections.push(`- ${change}`);
            }
            sections.push('');
        }
    }

    return sections.join('\n');
}
