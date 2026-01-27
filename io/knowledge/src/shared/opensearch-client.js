/**
 * OpenSearch Serverless Client
 *
 * Handles vector search operations with AWS OpenSearch Serverless.
 * Uses AWS Signature v4 authentication for secure access.
 *
 * Collection: mas-knowledge-base (vector search type)
 * Index: mas-knowledge (k-NN enabled, 1536-dim vectors)
 */

import { Client } from '@opensearch-project/opensearch';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

const DEFAULT_INDEX = 'mas-knowledge';
const DEFAULT_TOP_K = 3;
const DEFAULT_MIN_SCORE = 0.7;

export class OpenSearchClient {
    constructor(config = {}) {
        const endpoint = config.endpoint || process.env.OPENSEARCH_ENDPOINT;
        const region = config.region || process.env.OPENSEARCH_REGION || 'us-east-2';
        const indexName = config.indexName || DEFAULT_INDEX;

        if (!endpoint) {
            throw new Error('OpenSearch endpoint is required');
        }

        this.client = new Client({
            ...AwsSigv4Signer({
                region,
                service: 'aoss',
                getCredentials: () => {
                    if (config.accessKeyId && config.secretAccessKey) {
                        return Promise.resolve({
                            accessKeyId: config.accessKeyId,
                            secretAccessKey: config.secretAccessKey,
                        });
                    }
                    return defaultProvider()();
                },
            }),
            node: endpoint,
        });
        this.indexName = indexName;
    }

    /**
     * Create the index with k-NN mapping
     */
    async createIndex() {
        const exists = await this.client.indices.exists({ index: this.indexName });
        if (exists.body) {
            console.log(`Index ${this.indexName} already exists`);
            return false;
        }

        await this.client.indices.create({
            index: this.indexName,
            body: {
                settings: {
                    'index.knn': true,
                },
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        text: { type: 'text' },
                        vector: {
                            type: 'knn_vector',
                            dimension: 1536,
                            method: {
                                name: 'hnsw',
                                space_type: 'cosinesimil',
                                engine: 'nmslib',
                            },
                        },
                        metadata: {
                            properties: {
                                file: { type: 'keyword' },
                                section: { type: 'text' },
                                parentSection: { type: 'text' },
                                category: { type: 'keyword' },
                                sourceUrl: { type: 'keyword' },
                            },
                        },
                    },
                },
            },
        });

        console.log(`Created index ${this.indexName}`);
        return true;
    }

    /**
     * Delete the index if it exists
     */
    async deleteIndex() {
        const exists = await this.client.indices.exists({ index: this.indexName });
        if (!exists.body) {
            console.log(`Index ${this.indexName} does not exist`);
            return false;
        }

        await this.client.indices.delete({ index: this.indexName });
        console.log(`Deleted index ${this.indexName}`);
        return true;
    }

    /**
     * Index a single document
     * Note: OpenSearch Serverless doesn't support client-provided document IDs
     */
    async indexDocument(doc) {
        return this.client.index({
            index: this.indexName,
            body: {
                id: doc.id,
                text: doc.text,
                vector: doc.vector,
                metadata: doc.metadata,
            },
        });
    }

    /**
     * Bulk index multiple documents
     * Note: OpenSearch Serverless doesn't support client-provided document IDs
     */
    async bulkIndex(documents) {
        if (!documents || documents.length === 0) {
            return { success: true, indexed: 0 };
        }

        const operations = documents.flatMap((doc) => [
            { index: { _index: this.indexName } },
            {
                id: doc.id,
                text: doc.text,
                vector: doc.vector,
                metadata: doc.metadata,
            },
        ]);

        const response = await this.client.bulk({
            body: operations,
        });

        const errors = response.body.items.filter((item) => item.index.error);
        if (errors.length > 0) {
            console.error('Bulk index errors:', JSON.stringify(errors.slice(0, 3), null, 2));
        }

        return {
            success: errors.length === 0,
            indexed: documents.length - errors.length,
            errors: errors.length,
        };
    }

    /**
     * Perform k-NN vector search
     * @param {number[]} queryVector - Query embedding vector (1536-dim)
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Matching documents with scores
     */
    async search(queryVector, options = {}) {
        const { topK = DEFAULT_TOP_K, minScore = DEFAULT_MIN_SCORE } = options;

        const response = await this.client.search({
            index: this.indexName,
            body: {
                size: topK,
                min_score: minScore,
                query: {
                    knn: {
                        vector: {
                            vector: queryVector,
                            k: topK,
                        },
                    },
                },
            },
        });

        return response.body.hits.hits.map((hit) => ({
            id: hit._source.id,
            text: hit._source.text,
            metadata: hit._source.metadata,
            score: hit._score,
        }));
    }

    /**
     * Delete all documents from the index
     * Note: OpenSearch Serverless doesn't support refresh parameter
     */
    async clearIndex() {
        await this.client.deleteByQuery({
            index: this.indexName,
            body: {
                query: {
                    match_all: {},
                },
            },
        });
    }

    /**
     * Get document count
     */
    async getDocumentCount() {
        const response = await this.client.count({ index: this.indexName });
        return response.body.count;
    }

    /**
     * Check if client can connect
     * Note: OpenSearch Serverless doesn't support GET /, so we check indices instead
     */
    async ping() {
        try {
            const response = await this.client.cat.indices({ format: 'json' });
            return response.statusCode === 200;
        } catch (error) {
            if (error.meta?.statusCode === 403) {
                console.error('OpenSearch access denied (403). Check:');
                console.error('  1. Data access policy grants aoss:* to your IAM principal');
                console.error('  2. Collection name matches the policy');
                if (error.meta?.body) {
                    const body = typeof error.meta.body === 'string' ? error.meta.body : JSON.stringify(error.meta.body);
                    console.error('  Response:', body);
                }
            } else {
                console.error('OpenSearch ping error:', error.message);
                console.error('Status code:', error.meta?.statusCode);
            }
            return false;
        }
    }
}
