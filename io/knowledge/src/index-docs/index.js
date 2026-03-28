/**
 * Index Documents Action
 *
 * Indexes knowledge documents into OpenSearch for semantic search.
 * This action requires IMS authentication (admin-only).
 *
 * Workflow:
 * 1. Process markdown files from knowledge-chunks directory
 * 2. Generate embeddings using Amazon Titan
 * 3. Index into OpenSearch Serverless
 */

import { EmbeddingsClient } from '../shared/embeddings-client.js';
import { getEmbeddedChunks } from './embedded-chunks.js';

/**
 * Get response headers for web action
 * Note: CORS headers are handled automatically by OpenWhisk gateway for web actions
 * @returns {Object} - Response headers
 */
function getResponseHeaders() {
    return {
        'Content-Type': 'application/json',
    };
}

async function main(params) {
    if (params.__ow_method?.toLowerCase() === 'options') {
        return { statusCode: 200, headers: getResponseHeaders() };
    }

    const { action = 'index', clearFirst = false } = params;

    try {
        if (action === 'generate-vectors') {
            const allChunks = getEmbeddedChunks();
            const batchStart = parseInt(params.batchStart || '0', 10);
            const batchSize = parseInt(params.batchSize || '50', 10);
            const chunks = allChunks.slice(batchStart, batchStart + batchSize);

            const client = new EmbeddingsClient({
                accessKeyId: params.AWS_ACCESS_KEY_ID,
                secretAccessKey: params.AWS_SECRET_ACCESS_KEY,
                region: params.AWS_REGION || 'us-west-2',
            });

            console.log(`Embedding batch ${batchStart}-${batchStart + chunks.length} of ${allChunks.length}...`);
            const results = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const vector = await client.embed(chunk.text);
                results.push({ id: chunk.id, vector });
                if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${chunks.length}`);
            }

            return {
                statusCode: 200,
                headers: getResponseHeaders(),
                body: { chunks: results, count: results.length, total: allChunks.length, batchStart },
            };
        }

        return {
            statusCode: 400,
            headers: getResponseHeaders(),
            body: { error: `Unknown action: ${action}. Valid actions: generate-vectors` },
        };
    } catch (error) {
        console.error('[Index Docs] Error:', error.message);
        return {
            statusCode: 500,
            headers: getResponseHeaders(),
            body: { error: error.message },
        };
    }
}

export { main };
