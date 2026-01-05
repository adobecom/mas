/**
 * Knowledge Query Action
 *
 * Retrieves relevant knowledge chunks for a given query using semantic search.
 * Part of the RAG (Retrieval-Augmented Generation) pipeline for the AI assistant.
 */

import { KnowledgeRetriever } from '../shared/retriever.js';

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

    const { query, topK = 3, minScore = 0.7 } = params;

    if (!query) {
        return {
            statusCode: 400,
            headers: getResponseHeaders(),
            body: { error: 'Query parameter is required' },
        };
    }

    try {
        const retriever = new KnowledgeRetriever({
            accessKeyId: params.AWS_ACCESS_KEY_ID,
            secretAccessKey: params.AWS_SECRET_ACCESS_KEY,
            endpoint: params.OPENSEARCH_ENDPOINT,
            region: params.AWS_REGION,
            opensearchRegion: params.OPENSEARCH_REGION,
        });

        const results = await retriever.retrieve(query, { topK, minScore });

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: {
                results,
                query,
                count: results.length,
            },
        };
    } catch (error) {
        console.error('[Knowledge Query] Error:', error.message);
        return {
            statusCode: 500,
            headers: getResponseHeaders(),
            body: { error: error.message },
        };
    }
}

export { main };
