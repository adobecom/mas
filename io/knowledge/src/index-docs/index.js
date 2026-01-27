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

import { KnowledgeRetriever } from '../shared/retriever.js';
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
        const retriever = new KnowledgeRetriever({
            accessKeyId: params.AWS_ACCESS_KEY_ID,
            secretAccessKey: params.AWS_SECRET_ACCESS_KEY,
            endpoint: params.OPENSEARCH_ENDPOINT,
            region: params.AWS_REGION,
            opensearchRegion: params.OPENSEARCH_REGION,
        });

        if (action === 'health') {
            const health = await retriever.healthCheck();
            return {
                statusCode: health.healthy ? 200 : 503,
                headers: getResponseHeaders(),
                body: health,
            };
        }

        if (action === 'init') {
            await retriever.initializeIndex();
            return {
                statusCode: 200,
                headers: getResponseHeaders(),
                body: { message: 'Index initialized' },
            };
        }

        if (action === 'reset') {
            console.log('Resetting index (delete and recreate)...');
            await retriever.opensearch.deleteIndex();
            await retriever.opensearch.createIndex();
            return {
                statusCode: 200,
                headers: getResponseHeaders(),
                body: { message: 'Index reset successfully' },
            };
        }

        if (action === 'index') {
            const chunks = getEmbeddedChunks();

            if (chunks.length === 0) {
                return {
                    statusCode: 200,
                    headers: getResponseHeaders(),
                    body: {
                        message: 'No knowledge chunks found to index',
                    },
                };
            }

            if (clearFirst) {
                console.log('Clearing existing index...');
                await retriever.opensearch.clearIndex();
            }

            console.log(`Indexing ${chunks.length} chunks...`);
            const result = await retriever.indexChunks(chunks);

            return {
                statusCode: 200,
                headers: getResponseHeaders(),
                body: {
                    message: 'Indexing complete',
                    chunksIndexed: result.indexed,
                    errors: result.errors,
                },
            };
        }

        return {
            statusCode: 400,
            headers: getResponseHeaders(),
            body: { error: `Unknown action: ${action}. Valid actions: health, init, index` },
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
