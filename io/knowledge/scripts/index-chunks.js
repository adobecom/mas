#!/usr/bin/env node

/**
 * Local Indexing Script
 *
 * Indexes knowledge chunks to OpenSearch from local machine.
 * Bypasses serverless timeout limits.
 *
 * Usage: node scripts/index-chunks.js [--clear]
 */

import dotenv from 'dotenv';
import { KnowledgeRetriever } from '../src/shared/retriever.js';
import { KNOWLEDGE_CHUNKS } from '../src/index-docs/embedded-chunks.js';

dotenv.config();

async function main() {
    const clearFirst = process.argv.includes('--clear');

    console.log('=== Knowledge Chunk Indexer ===\n');

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('AWS credentials required.');
        process.exit(1);
    }

    if (!process.env.OPENSEARCH_ENDPOINT) {
        console.error('OPENSEARCH_ENDPOINT required.');
        process.exit(1);
    }

    const retriever = new KnowledgeRetriever({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.OPENSEARCH_ENDPOINT,
        region: process.env.AWS_REGION,
        opensearchRegion: process.env.OPENSEARCH_REGION,
    });

    const health = await retriever.healthCheck();
    console.log(`Health: embeddings=${health.embeddings}, opensearch=${health.opensearch}\n`);

    if (!health.healthy) {
        console.error('Service not healthy. Aborting.');
        process.exit(1);
    }

    if (clearFirst) {
        console.log('Clearing existing index...');
        await retriever.opensearch.clearIndex();
        console.log('Index cleared.\n');
    }

    console.log(`Indexing ${KNOWLEDGE_CHUNKS.length} chunks...`);
    const startTime = Date.now();

    const result = await retriever.indexChunks(KNOWLEDGE_CHUNKS);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nIndexing complete in ${duration}s`);
    console.log(`  Indexed: ${result.indexed}`);
    console.log(`  Errors: ${result.errors}`);

    const count = await retriever.opensearch.getDocumentCount();
    console.log(`\nTotal documents in index: ${count}`);
}

main().catch((err) => {
    console.error('Indexing failed:', err.message);
    process.exit(1);
});
