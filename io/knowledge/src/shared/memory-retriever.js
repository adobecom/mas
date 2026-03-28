/**
 * Memory Retriever
 *
 * In-memory vector search using cosine similarity over pre-computed embeddings.
 * Replaces OpenSearch Serverless for semantic retrieval over ~400 knowledge chunks.
 */

import { CHUNKS_WITH_VECTORS } from './embedded-vectors.js';
import { EmbeddingsClient } from './embeddings-client.js';

const DEFAULT_TOP_K = 3;
const DEFAULT_MIN_SCORE = 0.7;
const LRU_MAX_SIZE = 50;

const queryCache = new Map();

function evictOldest() {
    if (queryCache.size >= LRU_MAX_SIZE) {
        const firstKey = queryCache.keys().next().value;
        queryCache.delete(firstKey);
    }
}

function getCachedEmbedding(query) {
    if (!queryCache.has(query)) return null;
    const value = queryCache.get(query);
    queryCache.delete(query);
    queryCache.set(query, value);
    return value;
}

function setCachedEmbedding(query, vector) {
    evictOldest();
    queryCache.set(query, vector);
}

export class MemoryRetriever {
    constructor(credentials = {}) {
        this.embeddings = new EmbeddingsClient({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region: credentials.region,
        });
    }

    /**
     * Retrieve relevant knowledge chunks for a query
     * @param {string} query - User query
     * @param {Object} options - Retrieval options
     * @returns {Promise<Array>} - Relevant knowledge chunks with scores
     */
    async retrieve(query, options = {}) {
        const { topK = DEFAULT_TOP_K, minScore = DEFAULT_MIN_SCORE } = options;

        let queryVector = getCachedEmbedding(query);
        if (!queryVector) {
            queryVector = await this.embeddings.embed(query);
            setCachedEmbedding(query, queryVector);
        }

        const scored = CHUNKS_WITH_VECTORS.map((chunk) => ({
            id: chunk.id,
            text: chunk.text,
            metadata: chunk.metadata,
            score: EmbeddingsClient.cosineSimilarity(queryVector, chunk.vector),
        })).filter((result) => result.score >= minScore);

        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, topK);
    }

    /**
     * Retrieve and format knowledge as context string
     * @param {string} query - User query
     * @param {Object} options - Retrieval options
     * @returns {Promise<string>} - Formatted knowledge context
     */
    async retrieveAsContext(query, options = {}) {
        const results = await this.retrieve(query, options);

        if (results.length === 0) {
            return '';
        }

        const contextParts = results.map((result) => {
            const header = result.metadata.parentSection
                ? `${result.metadata.parentSection} > ${result.metadata.section}`
                : result.metadata.section;

            return `### ${header}\n${result.text}`;
        });

        return contextParts.join('\n\n---\n\n');
    }
}
