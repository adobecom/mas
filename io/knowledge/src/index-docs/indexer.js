/**
 * Knowledge Indexer
 *
 * Processes markdown documentation files into chunks suitable for embedding.
 * Generates vector embeddings using Amazon Titan and prepares data for OpenSearch.
 *
 * Chunking strategy:
 * - Split by H2 (##) headers as primary boundaries
 * - Large sections split by H3 (###) sub-headers
 * - Maintains context by preserving section hierarchy
 * - Target chunk size: ~500-1000 tokens
 */

import { EmbeddingsClient } from '../shared/embeddings-client.js';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename, relative } from 'path';

const CHUNK_SIZE_CHARS = 2000;
const MIN_CHUNK_SIZE = 100;

/**
 * Extract source URL from markdown content
 * Matches lines like: > Source: https://wiki.corp.adobe.com/...
 */
function extractSourceUrl(content) {
    const match = content.match(/^>\s*Source:\s*(https?:\/\/[^\s]+)/m);
    return match ? match[1] : null;
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir, files = []) {
    if (!existsSync(dir)) {
        return files;
    }

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            findMarkdownFiles(fullPath, files);
        } else if (entry.name.endsWith('.md')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Extract the header from a section
 */
function extractHeader(section) {
    const match = section.match(/^#+\s+(.+)/m);
    return match ? match[1].trim() : 'Untitled Section';
}

/**
 * Split content into chunks by markdown headers
 */
function splitByHeaders(content, filePath) {
    const chunks = [];
    const lines = content.split('\n');

    let currentSection = '';
    let currentHeader = '';
    let parentHeader = '';

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentSection.trim().length >= MIN_CHUNK_SIZE) {
                chunks.push({
                    text: currentSection.trim(),
                    header: currentHeader,
                    parentHeader,
                    file: filePath,
                });
            }
            parentHeader = line.replace('## ', '').trim();
            currentHeader = parentHeader;
            currentSection = `${line}\n`;
        } else if (line.startsWith('### ')) {
            if (currentSection.length > CHUNK_SIZE_CHARS) {
                chunks.push({
                    text: currentSection.trim(),
                    header: currentHeader,
                    parentHeader,
                    file: filePath,
                });
                currentSection = '';
            }
            currentHeader = line.replace('### ', '').trim();
            currentSection += `${line}\n`;
        } else {
            currentSection += `${line}\n`;
        }
    }

    if (currentSection.trim().length >= MIN_CHUNK_SIZE) {
        chunks.push({
            text: currentSection.trim(),
            header: currentHeader || extractHeader(content),
            parentHeader,
            file: filePath,
        });
    }

    return chunks;
}

/**
 * Split large sections into smaller chunks
 */
function splitLargeChunk(chunk, maxSize = CHUNK_SIZE_CHARS) {
    if (chunk.text.length <= maxSize) {
        return [chunk];
    }

    const paragraphs = chunk.text.split(/\n\n+/);
    const subChunks = [];
    let currentText = '';

    for (const para of paragraphs) {
        if ((currentText + para).length > maxSize && currentText.length >= MIN_CHUNK_SIZE) {
            subChunks.push({
                ...chunk,
                text: currentText.trim(),
            });
            currentText = `${para}\n\n`;
        } else {
            currentText += `${para}\n\n`;
        }
    }

    if (currentText.trim().length >= MIN_CHUNK_SIZE) {
        subChunks.push({
            ...chunk,
            text: currentText.trim(),
        });
    }

    return subChunks;
}

/**
 * Process a single file into chunks
 */
function processFile(filePath, baseDir) {
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(baseDir, filePath);
    const sourceUrl = extractSourceUrl(content);

    const chunks = splitByHeaders(content, relativePath);

    const finalChunks = [];
    for (const chunk of chunks) {
        finalChunks.push(...splitLargeChunk(chunk));
    }

    return finalChunks.map((chunk, index) => ({
        id: `${relativePath.replace(/\//g, '-').replace('.md', '')}-${index}`,
        ...chunk,
        metadata: {
            file: relativePath,
            section: chunk.header,
            parentSection: chunk.parentHeader,
            category: getCategory(relativePath),
            sourceUrl,
        },
    }));
}

/**
 * Extract category from file path
 */
function getCategory(filePath) {
    const parts = filePath.split('/');
    if (parts.length > 1) {
        return parts[parts.length - 2];
    }
    return 'general';
}

/**
 * Index all knowledge files
 * @param {Object} config - Configuration with AWS credentials
 * @param {string} chunksDir - Directory containing knowledge chunks
 * @param {string} outputDir - Directory to save index files
 */
export async function indexKnowledge(config, chunksDir, outputDir) {
    const embeddings = new EmbeddingsClient(config);
    const files = findMarkdownFiles(chunksDir);

    console.log(`Found ${files.length} knowledge files to index`);

    const allChunks = [];

    for (const file of files) {
        const chunks = processFile(file, chunksDir);
        console.log(`  ${basename(file)}: ${chunks.length} chunks`);
        allChunks.push(...chunks);
    }

    console.log(`\nTotal chunks: ${allChunks.length}`);
    console.log('Generating embeddings...');

    const indexedChunks = [];
    let processed = 0;

    for (const chunk of allChunks) {
        try {
            const vector = await embeddings.embed(chunk.text);
            indexedChunks.push({
                ...chunk,
                vector,
            });
            processed++;
            if (processed % 10 === 0) {
                console.log(`  Processed ${processed}/${allChunks.length} chunks`);
            }
        } catch (error) {
            console.error(`Failed to embed chunk ${chunk.id}:`, error.message);
        }
    }

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const indexWithVectors = join(outputDir, 'vectors.json');
    writeFileSync(indexWithVectors, JSON.stringify(indexedChunks, null, 2));
    console.log(`\nSaved ${indexedChunks.length} indexed chunks to ${indexWithVectors}`);

    const indexWithoutVectors = join(outputDir, 'chunks.json');
    const chunksOnly = indexedChunks.map(({ vector, ...rest }) => rest);
    writeFileSync(indexWithoutVectors, JSON.stringify(chunksOnly, null, 2));
    console.log(`Saved chunk metadata to ${indexWithoutVectors}`);

    return indexedChunks;
}

/**
 * Load pre-indexed chunks from file
 */
export function loadIndex(indexPath) {
    if (!existsSync(indexPath)) {
        throw new Error(`Index file not found: ${indexPath}`);
    }
    return JSON.parse(readFileSync(indexPath, 'utf-8'));
}

export { findMarkdownFiles, splitByHeaders, splitLargeChunk, processFile, getCategory };
