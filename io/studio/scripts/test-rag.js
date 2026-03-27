#!/usr/bin/env node

/**
 * RAG System Test Script
 * Tests embeddings, OpenSearch connection, and retrieval
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv(envPath) {
    if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                    const key = trimmed.slice(0, eqIndex).trim();
                    const value = trimmed.slice(eqIndex + 1).trim();
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            }
        }
        console.log(`Loaded: ${envPath}`);
    }
}

async function main() {
    console.log('=== RAG System Test ===\n');

    // Load env files
    loadEnv(join(__dirname, '..', '.env'));
    loadEnv('/Users/axelcurenobasurto/Web/mas/.env');

    const config = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-west-2',
        endpoint: process.env.OPENSEARCH_ENDPOINT,
        opensearchRegion: process.env.OPENSEARCH_REGION || 'us-east-2',
    };

    console.log('Configuration:');
    console.log(`  AWS Region: ${config.region}`);
    console.log(`  OpenSearch Region: ${config.opensearchRegion}`);
    console.log(`  OpenSearch Endpoint: ${config.endpoint ? `${config.endpoint.substring(0, 50)}...` : 'NOT SET'}`);
    console.log(`  Has AWS credentials: ${!!config.accessKeyId && !!config.secretAccessKey}`);
    if (config.accessKeyId) {
        console.log(`  AWS Access Key ID: ${config.accessKeyId.substring(0, 8)}...${config.accessKeyId.slice(-4)}`);
    }
    console.log();

    // Test 1: Embeddings
    console.log('--- Test 1: Bedrock Titan Embeddings ---');
    try {
        const { EmbeddingsClient } = await import('../src/ai-chat/embeddings-client.js');
        const embeddings = new EmbeddingsClient(config);
        const vector = await embeddings.embed('How do I restore a previous version?');
        console.log(`✅ Embeddings working! Vector length: ${vector.length}`);
    } catch (error) {
        console.log(`❌ Embeddings failed: ${error.message}`);
        return;
    }
    console.log();

    // Test 2: OpenSearch Connection
    console.log('--- Test 2: OpenSearch Connection ---');
    try {
        const { OpenSearchClient } = await import('../src/ai-chat/knowledge/opensearch-client.js');
        const opensearch = new OpenSearchClient({
            ...config,
            region: config.opensearchRegion,
        });
        const connected = await opensearch.ping();
        console.log(connected ? '✅ OpenSearch connected!' : '❌ OpenSearch connection failed');
    } catch (error) {
        console.log(`❌ OpenSearch failed: ${error.message}`);
        return;
    }
    console.log();

    // Test 3: Retriever Health Check
    console.log('--- Test 3: Retriever Health Check ---');
    try {
        const { KnowledgeRetriever } = await import('../src/ai-chat/knowledge/retriever.js');
        const retriever = new KnowledgeRetriever({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            endpoint: config.endpoint,
            bedrockRegion: config.region,
            opensearchRegion: config.opensearchRegion,
        });
        const health = await retriever.healthCheck();
        console.log(`Embeddings: ${health.embeddings ? '✅' : '❌'}`);
        console.log(`OpenSearch: ${health.opensearch ? '✅' : '❌'}`);
        console.log(`Overall: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
        if (health.error) console.log(`Error: ${health.error}`);
    } catch (error) {
        console.log(`❌ Retriever failed: ${error.message}`);
    }

    console.log('\n=== Test Complete ===');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
