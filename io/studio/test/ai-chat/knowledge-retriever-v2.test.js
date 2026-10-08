const { expect } = require('chai');
const { loadRealCorpus } = require('./real-corpus.js');
const fs = require('node:fs');
const path = require('node:path');

let LocalKnowledgeRetriever;
let KNOWLEDGE_CHUNKS;

const PROD = { topK: 3, minScore: 0.7 };

const CONFIG_ARM = [
    "What's the difference between a card variation and a template?",
    'How do placeholders get their values on a non-English page?',
    'Why might a merch card show the wrong price?',
    'How does bulk publishing work, and can I revert it?',
    'What is an offer selector (OSI) and where do I use it?',
    'How do I create a promotion and where does it apply?',
    'Why is my fragment showing English text on a French page?',
    "What's the difference between a collection and a grouped variation?",
    'What surfaces can I publish a card to, and how is access controlled?',
    'How do I add a card to a translation project?',
    'What does the landscape toggle (draft vs published) change in Studio?',
    'How do I give a card a promotional price without changing its base offer?',
];

// Indices (into CONFIG_ARM) that retrieved at least one chunk before the corpus merge and the retriever change.
const RETRIEVED_BEFORE = [2, 3, 4, 6, 8, 9];

const PROMO_PRICE = 11;

const OFF_CORPUS = ["what's the weather in paris", 'how do I bake sourdough bread', 'who won the world cup in 2018'];

function chunk(id, text) {
    return { id, topic: 'fixture', title: 'Fixture', section: id, keywords: [], text };
}

// Two chunks each cover two thirds of a compound question; neither passes the 0.7 gate alone, and both clear the trust bar.
const COMPLEMENTARY_FIXTURE = [
    chunk('left', 'alpha bravo charlie delta sections explain the first part of the answer in detail here'),
    chunk('right', 'charlie delta echo foxtrot sections explain the second part of the answer in detail here'),
    ...Array.from({ length: 12 }, (_, i) => chunk(`filler${i}`, `unrelated${i} topic${i} words${i} about something else entirely`)),
];
const COMPOUND_QUERY = 'alpha bravo charlie delta echo foxtrot';

describe('ai-chat/knowledge retriever v2 (complementary selection)', () => {
    before(async () => {
        ({ LocalKnowledgeRetriever } = await import('../../src/ai-chat/knowledge-retriever.js'));
        ({ chunks: KNOWLEDGE_CHUNKS } = await loadRealCorpus());
    });

    describe('flag off is v1', () => {
        it('a compound question split across two chunks retrieves neither', async () => {
            const { sources } = await new LocalKnowledgeRetriever(COMPLEMENTARY_FIXTURE).queryWithSources(COMPOUND_QUERY, PROD);
            expect(sources).to.have.length(0);
        });

        it('the default constructor is the v1 behavior', async () => {
            const off = await new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS).queryWithSources(CONFIG_ARM[2], PROD);
            const explicit = await new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, { complementary: false }).queryWithSources(CONFIG_ARM[2], PROD);
            expect(explicit).to.deep.equal(off);
        });
    });

    describe('flag on', () => {
        it('two complementary chunks that each cover part of a compound question both qualify', async () => {
            const retriever = new LocalKnowledgeRetriever(COMPLEMENTARY_FIXTURE, { complementary: true });
            const { sources } = await retriever.queryWithSources(COMPOUND_QUERY, PROD);
            expect(sources.map((s) => s.id).sort()).to.deep.equal(['left', 'right']);
        });

        it('still returns nothing when the chunks together do not cover the question', async () => {
            const retriever = new LocalKnowledgeRetriever(COMPLEMENTARY_FIXTURE, { complementary: true });
            const { sources } = await retriever.queryWithSources('alpha unrelated0 unrelated1 unrelated2 unrelated3 unrelated4', PROD);
            expect(sources).to.have.length(0);
        });

        it('keeps every chunk v1 would have returned, in the same order', async () => {
            const v1 = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS);
            const v2 = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, { complementary: true });
            for (const question of CONFIG_ARM) {
                const before = (await v1.queryWithSources(question, PROD)).sources.map((s) => s.id);
                const after = (await v2.queryWithSources(question, PROD)).sources.map((s) => s.id);
                expect(after.slice(0, before.length), question).to.deep.equal(before);
            }
        });

        it('never returns more than topK', async () => {
            const v2 = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, { complementary: true });
            for (const question of CONFIG_ARM) {
                expect((await v2.queryWithSources(question, PROD)).sources.length, question).to.be.at.most(PROD.topK);
            }
        });
    });

    describe('on the merged corpus', () => {
        it('every config-arm question retrieves at least one chunk with v2 on', async () => {
            const v2 = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, { complementary: true });
            for (const question of CONFIG_ARM) {
                expect((await v2.queryWithSources(question, PROD)).sources.length, question).to.be.at.least(1);
            }
        });

        it('questions that retrieved before still retrieve, with v2 off and on', async () => {
            for (const options of [{}, { complementary: true }]) {
                const retriever = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, options);
                for (const index of RETRIEVED_BEFORE) {
                    const { sources } = await retriever.queryWithSources(CONFIG_ARM[index], PROD);
                    expect(sources.length, `${CONFIG_ARM[index]} ${JSON.stringify(options)}`).to.be.at.least(1);
                }
            }
        });

        it('v1 alone (corpus merge only) retrieves more of the config-arm questions than the old 6 of 12', async () => {
            const v1 = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS);
            let retrieved = 0;
            for (const question of CONFIG_ARM) if ((await v1.queryWithSources(question, PROD)).sources.length) retrieved += 1;
            expect(retrieved).to.be.above(6);
        });

        it('off-corpus questions stay at or below the pre-change leak rate on the two probes that never leaked', async () => {
            const v2 = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, { complementary: true });
            let leaks = 0;
            for (const question of OFF_CORPUS) if ((await v2.queryWithSources(question, PROD)).sources.length) leaks += 1;
            expect(leaks).to.equal(0);
        });
    });

    describe('trust bar (low-confidence marker)', () => {
        const flagOf = async (question, options = { complementary: true }) => new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS, options).queryWithSources(question, PROD);

        it('the bar sits between the marginal promo-price retrieval and the weakest good one', async () => {
            const { TRUST_BAR } = await import('../../src/ai-chat/knowledge-retriever.js');
            const top = async (question) => Math.max(...(await flagOf(question, { complementary: true, trust: 0 })).sources.map((s) => s.score));
            expect(await top(CONFIG_ARM[PROMO_PRICE])).to.be.below(TRUST_BAR);
            expect(await top(CONFIG_ARM[1])).to.be.at.least(TRUST_BAR);
        });

        it('a retrieval whose best chunk is below the bar is flagged, and its chunks are kept', async () => {
            const result = await flagOf(CONFIG_ARM[PROMO_PRICE]);
            expect(result.lowConfidence).to.equal(true);
            expect(result.sources.length).to.be.at.least(1);
            expect(result.context).to.not.equal('');
        });

        it('the questions that answer well are not flagged', async () => {
            for (const index of [0, 1, 4]) {
                const result = await flagOf(CONFIG_ARM[index]);
                expect(result.sources.length, CONFIG_ARM[index]).to.be.at.least(1);
                expect(result.lowConfidence, CONFIG_ARM[index]).to.equal(false);
            }
        });

        it('flag off never flags and has no bar', async () => {
            const result = await flagOf(CONFIG_ARM[PROMO_PRICE], {});
            expect(result.lowConfidence ?? false).to.equal(false);
            expect(new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS).trust).to.equal(0);
        });

        it('an empty retrieval is not flagged', async () => {
            expect((await flagOf("what's the weather in paris")).lowConfidence ?? false).to.equal(false);
        });
    });

    describe('isolation', () => {
        it('the retriever imports nothing, so it cannot touch operations, the envelope or IMS', () => {
            const source = fs.readFileSync(path.join(__dirname, '../../src/ai-chat/knowledge-retriever.js'), 'utf8');
            expect(source).to.not.match(/^\s*import\s/m);
        });

        it('the retriever flag is declared as a deploy input', () => {
            const manifest = fs.readFileSync(path.join(__dirname, '../../app.config.yaml'), 'utf8');
            expect(manifest).to.include('RETRIEVER_V2: $RETRIEVER_V2');
        });
    });
});
