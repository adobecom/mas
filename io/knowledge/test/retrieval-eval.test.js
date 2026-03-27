/**
 * RAG Retrieval Evaluation Test Suite
 *
 * Evaluates retrieval quality using query-expected chunk pairs.
 * Metrics: Hit Rate, MRR (Mean Reciprocal Rank), Precision@k
 *
 * Run: npm test
 */

import { expect } from 'chai';
import { KnowledgeRetriever } from '../src/shared/retriever.js';
import dotenv from 'dotenv';

dotenv.config();

const EVAL_CASES = [
    {
        query: 'How do I restore a previous version?',
        expectedChunks: ['authoring-version-history-3', 'authoring-version-history-5'],
        description: 'Version restore workflow',
    },
    {
        query: 'What are field inheritance states for variations?',
        expectedChunks: ['authoring-locale-variations-2', 'authoring-locale-variations-6'],
        description: 'Field inheritance states (inherited, overridden, etc.)',
    },
    {
        query: 'How do I create a regional variation?',
        expectedChunks: ['authoring-locale-variations-0', 'authoring-locale-variations-3'],
        description: 'Creating variations workflow',
    },
    {
        query: 'How to rollback content changes?',
        expectedChunks: ['authoring-version-history-5', 'authoring-version-history-3'],
        description: 'Rollback using version history',
    },
    {
        query: 'What is the API for listing versions?',
        expectedChunks: ['authoring-version-history-4', 'api-fragment-api-5'],
        description: 'Version history AEM API endpoints',
    },
    {
        query: 'How does inheritance work between parent and variation?',
        expectedChunks: ['authoring-locale-variations-2', 'authoring-locale-variations-4'],
        description: 'Field inheritance mechanism',
    },
    {
        query: 'What locales can have variations?',
        expectedChunks: ['authoring-locale-variations-1', 'authoring-locale-variations-0'],
        description: 'Same-language variation rules',
    },
    {
        query: 'How to reset a field to parent value?',
        expectedChunks: ['authoring-locale-variations-4', 'authoring-locale-variations-2'],
        description: 'Reset override to inherit from parent',
    },
    {
        query: 'Best practices for version management',
        expectedChunks: ['authoring-version-history-6', 'authoring-locale-variations-6'],
        description: 'Version history best practices',
    },
    {
        query: 'Troubleshooting variation not showing',
        expectedChunks: ['authoring-locale-variations-7', 'troubleshooting-common-errors-6'],
        description: 'Variation troubleshooting',
    },
    {
        query: 'What is Version History in MAS Studio?',
        expectedChunks: ['authoring-version-history-0'],
        description: 'Version history overview',
    },
    {
        query: 'How to name a version with a meaningful title?',
        expectedChunks: ['authoring-version-history-3', 'authoring-version-history-6'],
        description: 'Version naming and metadata',
    },
    {
        query: 'How do I add a price to a merch card?',
        expectedChunks: ['authoring-pricing-guide-0', 'authoring-pricing-guide-1', 'authoring-rte-authoring-0'],
        description: 'Adding pricing via OST in RTE editor',
    },
];

function calculateMetrics(results) {
    let hits = 0;
    let reciprocalRankSum = 0;

    for (const result of results) {
        if (result.hitAtK) {
            hits++;
            reciprocalRankSum += 1 / result.firstRelevantRank;
        }
    }

    const hitRate = hits / results.length;
    const mrr = reciprocalRankSum / results.length;

    return {
        hitRate,
        mrr,
        totalCases: results.length,
        hits,
        misses: results.length - hits,
    };
}

describe('RAG Retrieval Evaluation', function () {
    this.timeout(180000);

    let retriever;

    before(async function () {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.OPENSEARCH_ENDPOINT) {
            this.skip();
        }

        retriever = new KnowledgeRetriever({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            endpoint: process.env.OPENSEARCH_ENDPOINT,
            region: process.env.AWS_REGION,
            opensearchRegion: process.env.OPENSEARCH_REGION,
        });

        const health = await retriever.healthCheck();
        if (!health.healthy) {
            this.skip();
        }
    });

    describe('Health Check', function () {
        it('should have healthy service', async function () {
            const health = await retriever.healthCheck();
            expect(health.healthy).to.be.true;
            expect(health.embeddings).to.be.true;
            expect(health.opensearch).to.be.true;
        });
    });

    describe('Query-Chunk Mapping Evaluation', function () {
        const evalResults = [];

        EVAL_CASES.forEach(({ query, expectedChunks, description }) => {
            it(`should retrieve relevant chunks for: "${query}"`, async function () {
                const results = await retriever.retrieve(query, { topK: 5, minScore: 0.5 });
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
                    description,
                    expectedChunks,
                    retrievedIds,
                    hitAtK,
                    firstRelevantRank: hitAtK ? firstRelevantRank : null,
                    topScore: results.length > 0 ? results[0].score : 0,
                });

                expect(hitAtK, `Expected one of ${expectedChunks.join(', ')} in results`).to.be.true;
            });
        });

        after(function () {
            if (evalResults.length > 0) {
                const metrics = calculateMetrics(evalResults);

                console.log('\n=== RETRIEVAL METRICS ===');
                console.log(`Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
                console.log(`MRR (Mean Reciprocal Rank): ${metrics.mrr.toFixed(3)}`);
                console.log(`Cases: ${metrics.totalCases} (${metrics.hits} hits, ${metrics.misses} misses)`);
                console.log('========================\n');

                const misses = evalResults.filter((r) => !r.hitAtK);
                if (misses.length > 0) {
                    console.log('Missed queries:');
                    misses.forEach((m) => {
                        console.log(`  - "${m.query}" (expected: ${m.expectedChunks.join(', ')})`);
                        console.log(`    Retrieved: ${m.retrievedIds.slice(0, 3).join(', ')}`);
                    });
                }
            }
        });
    });

    describe('Retrieval Quality Thresholds', function () {
        it('should achieve minimum 70% hit rate', async function () {
            const evalResults = [];

            for (const { query, expectedChunks, description } of EVAL_CASES) {
                const results = await retriever.retrieve(query, { topK: 5, minScore: 0.5 });
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
                    description,
                    expectedChunks,
                    retrievedIds,
                    hitAtK,
                    firstRelevantRank: hitAtK ? firstRelevantRank : null,
                });
            }

            const metrics = calculateMetrics(evalResults);
            expect(metrics.hitRate).to.be.at.least(0.7, 'Hit rate should be at least 70%');
        });

        it('should achieve minimum 0.5 MRR', async function () {
            const evalResults = [];

            for (const { query, expectedChunks } of EVAL_CASES) {
                const results = await retriever.retrieve(query, { topK: 5, minScore: 0.5 });
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
                    hitAtK,
                    firstRelevantRank: hitAtK ? firstRelevantRank : null,
                });
            }

            const metrics = calculateMetrics(evalResults);
            expect(metrics.mrr).to.be.at.least(0.5, 'MRR should be at least 0.5');
        });
    });
});
