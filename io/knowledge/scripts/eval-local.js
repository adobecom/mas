#!/usr/bin/env node

/**
 * Local RAG Evaluation Script
 *
 * Evaluates retrieval quality without OpenSearch by using cosine similarity locally.
 * Useful for fast iteration when tuning knowledge chunks.
 *
 * Usage: node scripts/eval-local.js
 *
 * Outputs: Hit Rate, MRR, detailed results
 */

import dotenv from 'dotenv';
import { EmbeddingsClient } from '../src/shared/embeddings-client.js';
import { KNOWLEDGE_CHUNKS } from '../src/index-docs/embedded-chunks.js';

dotenv.config();

const EVAL_CASES = [
    {
        query: 'How do I restore a previous version?',
        expectedChunks: ['authoring-version-history-3', 'authoring-version-history-5'],
    },
    {
        query: 'What are field inheritance states for variations?',
        expectedChunks: ['authoring-locale-variations-2', 'authoring-locale-variations-6'],
    },
    {
        query: 'How do I create a regional variation?',
        expectedChunks: ['authoring-locale-variations-0', 'authoring-locale-variations-3'],
    },
    {
        query: 'How to rollback content changes?',
        expectedChunks: ['authoring-version-history-5', 'authoring-version-history-3'],
    },
    {
        query: 'What is the API for listing versions?',
        expectedChunks: ['authoring-version-history-4', 'api-fragment-api-5'],
    },
    {
        query: 'How does inheritance work between parent and variation?',
        expectedChunks: ['authoring-locale-variations-2', 'authoring-locale-variations-4'],
    },
    {
        query: 'What locales can have variations?',
        expectedChunks: ['authoring-locale-variations-1', 'authoring-locale-variations-0'],
    },
    {
        query: 'How to reset a field to parent value?',
        expectedChunks: ['authoring-locale-variations-4', 'authoring-locale-variations-2'],
    },
    {
        query: 'Best practices for version management',
        expectedChunks: ['authoring-version-history-6', 'authoring-locale-variations-6'],
    },
    {
        query: 'Troubleshooting variation not showing',
        expectedChunks: ['authoring-locale-variations-7', 'troubleshooting-common-errors-6'],
    },
    {
        query: 'What is Version History in MAS Studio?',
        expectedChunks: ['authoring-version-history-0'],
    },
    {
        query: 'How to name a version with a meaningful title?',
        expectedChunks: ['authoring-version-history-3', 'authoring-version-history-6'],
    },
    {
        query: 'How do I add a price to a merch card?',
        expectedChunks: ['authoring-pricing-guide-0', 'authoring-pricing-guide-1', 'authoring-rte-authoring-0'],
    },
];

const TOP_K = 5;
const MIN_SCORE = 0.5;

async function generateChunkEmbeddings(embeddings) {
    console.log(`Generating embeddings for ${KNOWLEDGE_CHUNKS.length} chunks...`);

    const chunksWithVectors = [];
    for (let i = 0; i < KNOWLEDGE_CHUNKS.length; i++) {
        const chunk = KNOWLEDGE_CHUNKS[i];
        const vector = await embeddings.embed(chunk.text);
        chunksWithVectors.push({ ...chunk, vector });

        process.stdout.write(`\r  Progress: ${i + 1}/${KNOWLEDGE_CHUNKS.length}`);
    }
    console.log('\n');

    return chunksWithVectors;
}

function searchLocal(queryVector, chunks, topK, minScore) {
    const results = chunks
        .map((chunk) => ({
            id: chunk.id,
            text: chunk.text,
            metadata: chunk.metadata,
            score: EmbeddingsClient.cosineSimilarity(queryVector, chunk.vector),
        }))
        .filter((r) => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return results;
}

function calculateMetrics(results) {
    let hits = 0;
    let reciprocalRankSum = 0;

    for (const result of results) {
        if (result.hitAtK) {
            hits++;
            reciprocalRankSum += 1 / result.firstRelevantRank;
        }
    }

    return {
        hitRate: hits / results.length,
        mrr: reciprocalRankSum / results.length,
        totalCases: results.length,
        hits,
        misses: results.length - hits,
    };
}

async function runEval() {
    console.log('=== LOCAL RAG EVALUATION ===\n');

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('AWS credentials required. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
        process.exit(1);
    }

    const embeddings = new EmbeddingsClient({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-west-2',
    });

    const chunksWithVectors = await generateChunkEmbeddings(embeddings);

    console.log(`Running ${EVAL_CASES.length} eval queries...\n`);

    const evalResults = [];

    for (const { query, expectedChunks } of EVAL_CASES) {
        const queryVector = await embeddings.embed(query);
        const results = searchLocal(queryVector, chunksWithVectors, TOP_K, MIN_SCORE);

        const retrievedIds = results.map((r) => r.id);

        let hitAtK = false;
        let firstRelevantRank = Infinity;

        for (let i = 0; i < retrievedIds.length; i++) {
            if (expectedChunks.includes(retrievedIds[i])) {
                hitAtK = true;
                firstRelevantRank = Math.min(firstRelevantRank, i + 1);
            }
        }

        evalResults.push({
            query,
            expectedChunks,
            retrievedIds,
            hitAtK,
            firstRelevantRank: hitAtK ? firstRelevantRank : null,
            topScore: results.length > 0 ? results[0].score : 0,
        });

        const status = hitAtK ? '✓' : '✗';
        console.log(`${status} "${query.substring(0, 50)}..."`);
        if (hitAtK) {
            console.log(`   → Found at rank ${firstRelevantRank}, score: ${results[firstRelevantRank - 1]?.score.toFixed(3)}`);
        } else {
            console.log(`   → Expected: ${expectedChunks[0]}, Got: ${retrievedIds[0] || 'none'}`);
        }
    }

    const metrics = calculateMetrics(evalResults);

    console.log('\n=== RESULTS ===');
    console.log(`Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
    console.log(`MRR: ${metrics.mrr.toFixed(3)}`);
    console.log(`Total: ${metrics.totalCases} queries (${metrics.hits} hits, ${metrics.misses} misses)`);

    console.log('\n=== THRESHOLDS ===');
    console.log(`Hit Rate ≥ 70%: ${metrics.hitRate >= 0.7 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`MRR ≥ 0.5: ${metrics.mrr >= 0.5 ? '✓ PASS' : '✗ FAIL'}`);

    if (metrics.misses > 0) {
        console.log('\n=== MISSED QUERIES ===');
        evalResults
            .filter((r) => !r.hitAtK)
            .forEach((r) => {
                console.log(`\nQuery: "${r.query}"`);
                console.log(`  Expected: ${r.expectedChunks.join(', ')}`);
                console.log(`  Retrieved: ${r.retrievedIds.slice(0, 3).join(', ') || 'none'}`);
            });
    }

    console.log('\n=== SCORE DISTRIBUTION ===');
    const scoreRanges = { high: 0, medium: 0, low: 0 };
    evalResults.forEach((r) => {
        if (r.topScore >= 0.8) scoreRanges.high++;
        else if (r.topScore >= 0.65) scoreRanges.medium++;
        else scoreRanges.low++;
    });
    console.log(`High (≥0.8): ${scoreRanges.high}`);
    console.log(`Medium (0.65-0.8): ${scoreRanges.medium}`);
    console.log(`Low (<0.65): ${scoreRanges.low}`);

    return metrics;
}

runEval().catch((err) => {
    console.error('Evaluation failed:', err.message);
    process.exit(1);
});
