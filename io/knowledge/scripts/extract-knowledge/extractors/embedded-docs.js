/**
 * Embedded Docs Extractor
 *
 * Converts existing embedded documentation from JS template literals
 * to markdown files for the RAG knowledge base.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DOCS_PATH = 'io/studio/src/ai-chat/docs';

const DOC_MAPPINGS = [
    {
        source: 'architecture-knowledge.js',
        exportName: 'ARCHITECTURE_KNOWLEDGE',
        outputDir: 'architecture',
        outputFile: 'platform-overview.md',
        title: 'M@S Platform Architecture',
    },
    {
        source: 'authoring-knowledge.js',
        exportName: 'AUTHORING_KNOWLEDGE',
        outputDir: 'authoring',
        outputFile: 'studio-guide.md',
        title: 'M@S Studio Authoring Guide',
    },
    {
        source: 'developer-knowledge.js',
        exportName: 'DEVELOPER_KNOWLEDGE',
        outputDir: 'developer',
        outputFile: 'setup-guide.md',
        title: 'M@S Developer Guide',
    },
    {
        source: 'troubleshooting-knowledge.js',
        exportName: 'TROUBLESHOOTING_KNOWLEDGE',
        outputDir: 'troubleshooting',
        outputFile: 'common-issues.md',
        title: 'M@S Troubleshooting Guide',
    },
];

/**
 * Extract content from template literal export
 * @param {string} content - File content
 * @param {string} exportName - Name of the export
 * @returns {string|null} Extracted content
 */
function extractTemplateContent(content, exportName) {
    const regex = new RegExp(
        `export\\s+const\\s+${exportName}\\s*=\\s*\`([\\s\\S]*?)\`\\s*;?`,
        'm',
    );
    const match = content.match(regex);

    if (!match) return null;

    let extracted = match[1];

    extracted = extracted.replace(/^\s*You are an? .*?\.\n+/i, '');
    extracted = extracted.replace(/\$\{[^}]+\}/g, '');

    return extracted.trim();
}

/**
 * Clean up the extracted markdown content
 * @param {string} content - Raw extracted content
 * @param {string} title - Document title
 * @returns {string} Cleaned content
 */
function cleanupContent(content, title) {
    let cleaned = content;

    if (!cleaned.startsWith('#')) {
        cleaned = `# ${title}\n\n${cleaned}`;
    }

    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
    cleaned = cleaned.replace(/^\s+$/gm, '');

    return cleaned;
}

/**
 * Extract a single embedded doc
 * @param {string} basePath - Base path to the project
 * @param {Object} mapping - Doc mapping configuration
 * @returns {Object} Extracted doc data
 */
function extractDoc(basePath, mapping) {
    const filePath = join(basePath, DOCS_PATH, mapping.source);

    if (!existsSync(filePath)) {
        console.warn(`Source file not found: ${filePath}`);
        return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const extracted = extractTemplateContent(content, mapping.exportName);

    if (!extracted) {
        console.warn(`Could not extract ${mapping.exportName} from ${mapping.source}`);
        return null;
    }

    const cleanedContent = cleanupContent(extracted, mapping.title);

    return {
        ...mapping,
        content: cleanedContent,
    };
}

/**
 * Extract all embedded docs
 * @param {string} basePath - Base path to the project
 * @returns {Array<Object>} Extracted docs
 */
export function extractAllEmbeddedDocs(basePath) {
    const docs = [];

    for (const mapping of DOC_MAPPINGS) {
        const doc = extractDoc(basePath, mapping);
        if (doc) {
            docs.push(doc);
        }
    }

    return docs;
}

/**
 * Generate embedded docs markdown files
 * @param {string} basePath - Base path to the project
 * @param {string} outputBaseDir - Base output directory
 * @param {Object} options - Options
 * @returns {Array<string>} Generated file paths
 */
export async function generateEmbeddedDocs(basePath, outputBaseDir, options = {}) {
    const docs = extractAllEmbeddedDocs(basePath);
    const generatedFiles = [];

    for (const doc of docs) {
        const outputDir = join(outputBaseDir, doc.outputDir);
        const filePath = join(outputDir, doc.outputFile);

        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        if (options.dryRun) {
            console.log(`[DRY RUN] Would write: ${filePath}`);
            if (options.verbose) {
                console.log(`  Title: ${doc.title}`);
                console.log(`  Content length: ${doc.content.length} chars\n`);
            }
        } else {
            writeFileSync(filePath, doc.content);
            generatedFiles.push(filePath);
            if (options.verbose) {
                console.log(`Generated: ${filePath} (${doc.content.length} chars)`);
            }
        }
    }

    return generatedFiles;
}
