const { expect } = require('chai');
const { requireRealCorpus } = require('./real-corpus.js');

/**
 * Help/get are content words for author-support questions. Preserve the regression that removing
 * them loses those answers; measure against mas-agent's current export, not the retired corpus.
 */

let LocalKnowledgeRetriever;
let KNOWLEDGE_CHUNKS;
let retriever;

const PROD = { topK: 3, minScore: 0.7 };

describe('ai-chat/knowledge-retriever stopwords', () => {
    before(async function () {
        KNOWLEDGE_CHUNKS = await requireRealCorpus(this);
        ({ LocalKnowledgeRetriever } = await import('../../src/ai-chat/knowledge-retriever.js'));
        retriever = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS);
    });

    const sectionsFor = async (query) => {
        const { sources } = await retriever.queryWithSources(query, PROD);
        return sources.map((s) => s.section.toLowerCase());
    };

    it('finds a section whose heading is made of former stopwords', async () => {
        const sections = await sectionsFor('Where do I get help?');

        expect(sections.join(' | '), 'mas-agent includes author support guidance').to.include('help');
    });

    it('answers a bare plea for help, which is a whole query of former stopwords', async () => {
        for (const query of ['help', 'I need help']) {
            const sections = await sectionsFor(query);
            expect(sections.join(' | '), `"${query}" should reach the help section`).to.include('help');
        }
    });

    /**
     * "work" came off the list with them and went back on. It scores like a
     * topic (df 12, heads 5 sections) but only by accident: headline terms
     * carry 3x weight, so as a query term it drags any "how does X work?"
     * heading to the top regardless of X. These are the two it broke.
     */
    it('does not let a framing verb outrank the subject of the question', async () => {
        expect((await sectionsFor('how do collections work')).join(' ')).to.include('collection');
        expect(
            (await sectionsFor('how does the offer selector work')).join(' '),
            'OSI is a different thing from the OST',
        ).to.include('offer selector tool');
    });

    it('still drops true function words, which carry no signal', async () => {
        // Nothing but function words: there is no topic here to retrieve.
        for (const query of ['the is of', 'a an the', 'is it the one']) {
            const { sources } = await retriever.queryWithSources(query, PROD);
            expect(sources, `"${query}" should retrieve nothing`).to.deep.equal([]);
        }
    });

    it('does not let a function word alone satisfy the coverage gate', async () => {
        // A common function word must not count as evidence; otherwise chunks could
        // score 1.0 coverage and the top-ranked one would be injected as
        // relevant knowledge for a meaningless query.
        const { sources } = await retriever.queryWithSources('the', PROD);

        expect(sources).to.deep.equal([]);
    });

    it('leaves ordinary questions ranked as before', async () => {
        expect((await sectionsFor('how do I publish a card?')).join(' ')).to.include('publish');
        expect((await sectionsFor('what is an OSI?')).join(' ')).to.include('osi');
        expect((await sectionsFor('what is a placeholder?')).join(' ')).to.include('placeholder');
    });

    it('returns nothing for genuinely off-corpus questions', async () => {
        const { sources } = await retriever.queryWithSources('how do I bake sourdough bread', PROD);

        expect(sources).to.deep.equal([]);
    });
});
