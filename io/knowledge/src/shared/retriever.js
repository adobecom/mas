/**
 * Knowledge Retriever
 *
 * Combines embedding generation and vector search for RAG (Retrieval-Augmented Generation).
 * Retrieves relevant knowledge chunks based on semantic similarity to user queries.
 */

import { EmbeddingsClient } from './embeddings-client.js';
import { OpenSearchClient } from './opensearch-client.js';

const DEFAULT_TOP_K = 3;
const DEFAULT_MIN_SCORE = 0.7;

export class KnowledgeRetriever {
    constructor(config = {}) {
        const bedrockRegion = config.bedrockRegion || config.region || process.env.AWS_REGION || 'us-west-2';
        const opensearchRegion = config.opensearchRegion || process.env.OPENSEARCH_REGION || 'us-east-2';

        this.embeddings = new EmbeddingsClient({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: bedrockRegion,
        });

        this.opensearch = new OpenSearchClient({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            endpoint: config.endpoint,
            region: opensearchRegion,
        });

        this.config = config;
    }

    /**
     * Retrieve relevant knowledge chunks for a query
     * @param {string} query - User query
     * @param {Object} options - Retrieval options
     * @returns {Promise<Array>} - Relevant knowledge chunks with scores
     */
    async retrieve(query, options = {}) {
        const { topK = DEFAULT_TOP_K, minScore = DEFAULT_MIN_SCORE } = options;

        const queryVector = await this.embeddings.embed(query);
        const results = await this.opensearch.search(queryVector, { topK, minScore });

        return results;
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

        return `=== RELEVANT KNOWLEDGE ===\n\n${contextParts.join('\n\n---\n\n')}`;
    }

    /**
     * Index a single chunk with embedding
     * @param {Object} chunk - Chunk to index
     */
    async indexChunk(chunk) {
        const vector = await this.embeddings.embed(chunk.text);
        return this.opensearch.indexDocument({
            ...chunk,
            vector,
        });
    }

    /**
     * Index multiple chunks with embeddings
     * @param {Array} chunks - Chunks to index
     */
    async indexChunks(chunks) {
        console.log(`Generating embeddings for ${chunks.length} chunks...`);

        const chunksWithVectors = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const vector = await this.embeddings.embed(chunk.text);
            chunksWithVectors.push({
                ...chunk,
                vector,
            });

            if ((i + 1) % 10 === 0) {
                console.log(`  Embedded ${i + 1}/${chunks.length}`);
            }
        }

        console.log('Indexing to OpenSearch...');
        return this.opensearch.bulkIndex(chunksWithVectors);
    }

    /**
     * Initialize the index (create if needed)
     */
    async initializeIndex() {
        return this.opensearch.createIndex();
    }

    /**
     * Check if retriever is properly configured
     */
    async healthCheck() {
        try {
            const testText = 'Health check test';
            await this.embeddings.embed(testText);

            const connected = await this.opensearch.ping();

            return {
                embeddings: true,
                opensearch: connected,
                healthy: connected,
            };
        } catch (error) {
            return {
                embeddings: false,
                opensearch: false,
                healthy: false,
                error: error.message,
            };
        }
    }
}
