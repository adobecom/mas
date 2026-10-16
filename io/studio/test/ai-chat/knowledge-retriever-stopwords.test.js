const { expect } = require('chai');

/**
 * The stopword list is hand-written, so it encodes an assumption about English
 * rather than about THIS corpus. Several entries are content words here:
 *
 *   help  df 11, in 8 chunk headlines, idf 2.04
 *   get   df  1, in 1 chunk headline,  idf 4.32  ← most discriminative of all
 *
 * Stopping them means "Where do I get help?" reduces to no query terms at all
 * and retrieves NOTHING — while being, verbatim, the section heading of
 * troubleshooting.md. The corpus contains the answer and cannot find it.
 *
 * The corpus itself says which words are topical: a term that heads a section,
 * and is rare enough to discriminate, is content no matter what a generic list
 * says. Genuine function words stay stopped because they are everywhere and so
 * carry almost no idf ("the" 0.69, "is" 0.87, "of" 1.14).
 */

let LocalKnowledgeRetriever;
let KNOWLEDGE_CHUNKS;
let retriever;

const PROD = { topK: 3, minScore: 0.7 };

describe('ai-chat/knowledge-retriever stopwords', () => {
    before(async () => {
        [{ LocalKnowledgeRetriever }, { KNOWLEDGE_CHUNKS }] = await Promise.all([
            import('../../src/ai-chat/knowledge-retriever.js'),
            import('../../src/ai-chat/knowledge-corpus.js'),
        ]);
        retriever = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS);
    });

    const sectionsFor = async (query) => {
        const { sources } = await retriever.queryWithSources(query, PROD);
        return sources.map((s) => s.section.toLowerCase());
    };

    it('finds a section whose heading is made of former stopwords', async () => {
        const sections = await sectionsFor('Where do I get help?');

        expect(sections.join(' | '), 'troubleshooting.md heads a section with exactly this question').to.include('help');
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
        // "the" appears in all 74 chunks; if it counted, every chunk would
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
