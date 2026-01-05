#!/usr/bin/env node

/**
 * Knowledge Indexing Script
 *
 * Indexes knowledge chunks from markdown files to AWS OpenSearch for RAG.
 *
 * Usage:
 *   node scripts/index-knowledge.js
 *
 * Environment variables required:
 *   AWS_ACCESS_KEY_ID - AWS access key
 *   AWS_SECRET_ACCESS_KEY - AWS secret key
 *   OPENSEARCH_ENDPOINT - OpenSearch Serverless endpoint
 *   OPENSEARCH_REGION - OpenSearch region (default: us-east-2)
 *
 * Or use a .env file in the project root.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { KnowledgeRetriever } from '../src/ai-chat/knowledge/retriever.js';
import { findMarkdownFiles, processFile } from '../src/ai-chat/knowledge/indexer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
    const envPath = join(__dirname, '..', '.env');
    if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
        console.log('Loaded environment from .env file');
    }
}

async function main() {
    loadEnv();

    const config = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.OPENSEARCH_ENDPOINT,
        bedrockRegion: process.env.AWS_REGION || 'us-west-2',
        opensearchRegion: process.env.OPENSEARCH_REGION || 'us-east-2',
    };

    if (!config.accessKeyId || !config.secretAccessKey) {
        console.error('Error: AWS credentials not found');
        console.error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
        process.exit(1);
    }

    if (!config.endpoint) {
        console.error('Error: OpenSearch endpoint not found');
        console.error('Set OPENSEARCH_ENDPOINT environment variable');
        process.exit(1);
    }

    console.log('=== M@S Knowledge Indexer ===\n');
    console.log('Configuration:');
    console.log(`  Bedrock Region: ${config.bedrockRegion}`);
    console.log(`  OpenSearch Region: ${config.opensearchRegion}`);
    console.log(`  OpenSearch Endpoint: ${config.endpoint.substring(0, 40)}...`);
    console.log();

    const chunksDir = join(__dirname, '..', 'src', 'ai-chat', 'knowledge', 'chunks');

    if (!existsSync(chunksDir)) {
        console.error(`Error: Chunks directory not found: ${chunksDir}`);
        process.exit(1);
    }

    console.log('Scanning for knowledge files...');
    const files = findMarkdownFiles(chunksDir);
    console.log(`Found ${files.length} markdown files\n`);

    if (files.length === 0) {
        console.log('No files to index. Add markdown files to:');
        console.log(`  ${chunksDir}`);
        process.exit(0);
    }

    console.log('Processing files into chunks...');
    const allChunks = [];
    for (const file of files) {
        const chunks = processFile(file, chunksDir);
        console.log(`  ${file.split('/').pop()}: ${chunks.length} chunks`);
        allChunks.push(...chunks);
    }
    console.log(`\nTotal chunks: ${allChunks.length}\n`);

    console.log('Initializing retriever...');
    const retriever = new KnowledgeRetriever(config);

    console.log('Checking OpenSearch connection...');
    const health = await retriever.healthCheck();
    if (!health.healthy) {
        console.error('Error: Cannot connect to OpenSearch');
        console.error(health.error || 'Unknown error');
        process.exit(1);
    }
    console.log('OpenSearch connection OK\n');

    console.log('Creating/verifying index...');
    await retriever.initializeIndex();

    console.log('Indexing chunks to OpenSearch...');
    const result = await retriever.indexChunks(allChunks);

    console.log('\n=== Indexing Complete ===');
    console.log(`  Indexed: ${result.indexed} chunks`);
    if (result.errors > 0) {
        console.log(`  Errors: ${result.errors}`);
    }

    console.log('\nTesting retrieval...');
    const testQuery = 'How do I restore a previous version of a fragment?';
    console.log(`  Query: "${testQuery}"`);

    const results = await retriever.retrieve(testQuery, { topK: 2 });
    console.log(`  Results: ${results.length} chunks found`);

    if (results.length > 0) {
        console.log(`  Top result: ${results[0].metadata.section} (score: ${results[0].score.toFixed(3)})`);
    }

    console.log('\nDone! Knowledge base is ready for RAG.');
}

main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});
