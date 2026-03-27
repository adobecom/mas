/**
 * AWS Bedrock Embeddings Client
 *
 * Handles text embedding generation using Amazon Titan Embed Text v1.
 * Used for semantic search in the RAG (Retrieval-Augmented Generation) pipeline.
 *
 * Model: amazon.titan-embed-text-v1
 * Output: 1536-dimensional float vectors
 * Max input: 8192 tokens (~8000 characters for safety)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const TITAN_EMBED_MODEL = 'amazon.titan-embed-text-v1';
const MAX_INPUT_CHARS = 8000;

export class EmbeddingsClient {
    constructor(credentials = {}) {
        const accessKeyId = credentials.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = credentials.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
        const region = credentials.region || process.env.AWS_REGION || 'us-west-2';

        if (!accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials required for embeddings client');
        }

        this.client = new BedrockRuntimeClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.modelId = TITAN_EMBED_MODEL;
    }

    /**
     * Generate embedding vector for a single text
     * @param {string} text - Text to embed (max ~8000 chars)
     * @returns {Promise<number[]>} - 1536-dimensional embedding vector
     */
    async embed(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Text input required for embedding');
        }

        const truncatedText = text.slice(0, MAX_INPUT_CHARS);

        const command = new InvokeModelCommand({
            modelId: this.modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({ inputText: truncatedText }),
        });

        try {
            const response = await this.client.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.body));
            return result.embedding;
        } catch (error) {
            console.error('Titan Embeddings Error:', error);
            throw new Error(`Embedding generation failed: ${error.message}`);
        }
    }

    /**
     * Generate embeddings for multiple texts
     * Processes in parallel for efficiency
     * @param {string[]} texts - Array of texts to embed
     * @returns {Promise<number[][]>} - Array of embedding vectors
     */
    async embedBatch(texts) {
        if (!Array.isArray(texts) || texts.length === 0) {
            return [];
        }

        return Promise.all(texts.map((text) => this.embed(text)));
    }

    /**
     * Calculate cosine similarity between two vectors
     * Useful for comparing embeddings locally
     * @param {number[]} vecA - First embedding vector
     * @param {number[]} vecB - Second embedding vector
     * @returns {number} - Similarity score between -1 and 1
     */
    static cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have same dimension');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
