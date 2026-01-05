#!/usr/bin/env node

/**
 * Knowledge Extraction CLI
 *
 * Extracts knowledge from the MAS codebase and generates markdown
 * documentation for the RAG knowledge base.
 *
 * Usage:
 *   node scripts/extract-knowledge/index.js --all
 *   node scripts/extract-knowledge/index.js --variants
 *   node scripts/extract-knowledge/index.js --pipeline
 *   node scripts/extract-knowledge/index.js --components
 *   node scripts/extract-knowledge/index.js --editor
 *   node scripts/extract-knowledge/index.js --docs
 *
 * Options:
 *   --dry-run    Preview without writing files
 *   --verbose    Show detailed output
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { generateVariantDocs } from './extractors/variants.js';
import { generatePipelineDocs } from './extractors/pipeline.js';
import { generateComponentDocs } from './extractors/web-components.js';
import { generateEditorFieldsDocs } from './extractors/editor-fields.js';
import { generateEmbeddedDocs } from './extractors/embedded-docs.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const IO_KNOWLEDGE_DIR = join(currentDirPath, '../..');
const MAS_ROOT = join(IO_KNOWLEDGE_DIR, '../..');
const OUTPUT_BASE = join(IO_KNOWLEDGE_DIR, 'src/knowledge-chunks');

function parseArgs(args) {
    const options = {
        all: false,
        variants: false,
        pipeline: false,
        components: false,
        editor: false,
        docs: false,
        dryRun: false,
        verbose: false,
    };

    for (const arg of args) {
        switch (arg) {
            case '--all':
                options.all = true;
                break;
            case '--variants':
                options.variants = true;
                break;
            case '--pipeline':
                options.pipeline = true;
                break;
            case '--components':
                options.components = true;
                break;
            case '--editor':
                options.editor = true;
                break;
            case '--docs':
                options.docs = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }

    if (
        !options.all &&
        !options.variants &&
        !options.pipeline &&
        !options.components &&
        !options.editor &&
        !options.docs
    ) {
        options.all = true;
    }

    return options;
}

function printHelp() {
    console.log(`
MAS Knowledge Extraction CLI

Usage:
  node scripts/extract-knowledge/index.js [options]

Extractors:
  --all         Run all extractors (default if none specified)
  --variants    Extract variant field mappings
  --pipeline    Extract pipeline transformer documentation
  --components  Extract web component documentation
  --editor      Extract editor field documentation
  --docs        Convert embedded docs to markdown

Options:
  --dry-run     Preview without writing files
  --verbose     Show detailed output
  --help, -h    Show this help message

Examples:
  node scripts/extract-knowledge/index.js --all
  node scripts/extract-knowledge/index.js --variants --verbose
  node scripts/extract-knowledge/index.js --all --dry-run
`);
}

async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    console.log('=== MAS Knowledge Extractor ===\n');

    if (options.dryRun) {
        console.log('[DRY RUN MODE - No files will be written]\n');
    }

    const extractorOptions = {
        dryRun: options.dryRun,
        verbose: options.verbose,
    };

    if (!existsSync(OUTPUT_BASE) && !options.dryRun) {
        mkdirSync(OUTPUT_BASE, { recursive: true });
    }

    const results = {
        variants: [],
        pipeline: [],
        components: [],
        editor: [],
        docs: [],
    };

    if (options.all || options.variants) {
        console.log('📦 Extracting variant documentation...');
        const outputDir = join(OUTPUT_BASE, 'developer/variants');
        results.variants = await generateVariantDocs(
            MAS_ROOT,
            outputDir,
            extractorOptions,
        );
        console.log(`   Generated ${results.variants.length} variant docs\n`);
    }

    if (options.all || options.pipeline) {
        console.log('🔧 Extracting pipeline documentation...');
        const outputDir = join(OUTPUT_BASE, 'developer/pipeline');
        results.pipeline = await generatePipelineDocs(
            MAS_ROOT,
            outputDir,
            extractorOptions,
        );
        console.log(`   Generated ${results.pipeline.length} pipeline docs\n`);
    }

    if (options.all || options.components) {
        console.log('🧩 Extracting web component documentation...');
        const outputDir = join(OUTPUT_BASE, 'developer/components');
        results.components = await generateComponentDocs(
            MAS_ROOT,
            outputDir,
            extractorOptions,
        );
        console.log(
            `   Generated ${results.components.length} component docs\n`,
        );
    }

    if (options.all || options.editor) {
        console.log('📝 Extracting editor field documentation...');
        const outputDir = join(OUTPUT_BASE, 'developer');
        results.editor = await generateEditorFieldsDocs(
            MAS_ROOT,
            outputDir,
            extractorOptions,
        );
        console.log(`   Generated ${results.editor.length} editor docs\n`);
    }

    if (options.all || options.docs) {
        console.log('📚 Converting embedded documentation...');
        results.docs = await generateEmbeddedDocs(
            MAS_ROOT,
            OUTPUT_BASE,
            extractorOptions,
        );
        console.log(`   Generated ${results.docs.length} docs\n`);
    }

    const totalFiles =
        results.variants.length +
        results.pipeline.length +
        results.components.length +
        results.editor.length +
        results.docs.length;

    console.log('=== Summary ===');
    console.log(`Total files generated: ${totalFiles}`);
    console.log(`Output directory: ${OUTPUT_BASE}`);

    if (!options.dryRun) {
        console.log('\nNext step: Run the indexer to update OpenSearch:');
        console.log('  cd ../studio && npm run index-knowledge');
    }
}

main().catch((error) => {
    console.error('Error:', error.message);
    if (error.stack) {
        console.error(error.stack);
    }
    process.exit(1);
});
