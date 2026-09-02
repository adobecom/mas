const { expect } = require('chai');

/**
 * Can the corpus actually answer the questions users ask?
 *
 * knowledge-retriever.test.js proves the RANKING works, but it runs against
 * six hand-written FIXTURE_CHUNKS. Nothing ran a real question against the
 * real corpus, so the corpus could drift arbitrarily far behind the app
 * without a single test going red. That is how the assistant ended up unable
 * to say what mas-field is while every suite stayed green.
 *
 * The failure that matters is not "retrieves nothing". A lexical retriever
 * asked about an uncovered topic usually finds SOMETHING — a chunk that
 * shares a couple of common words — scores it above threshold, and the action
 * injects it under a "RELEVANT KNOWLEDGE" heading. The model then answers
 * confidently from a passage about something else. A miss produces "I don't
 * know"; a wrong hit produces a wrong answer that reads like a right one.
 *
 * So each probe names the topic the answer must be ABOUT, and a probe that
 * retrieves the wrong chunk fails exactly like one that retrieves nothing.
 */

/**
 * Production settings for the documentation path (index.js buildRagContext,
 * isDocumentation branch). Probing at anything looser would pass questions
 * that fail in the product.
 */
const PROD_RETRIEVAL = { topK: 3, minScore: 0.7 };

/**
 * [question, marker] — `marker` is a string the correct answering section
 * would contain. Phrase questions the way a user would, not the way the
 * headings are worded: matching a heading to itself proves nothing.
 */
const PROBES = [
    ['how do I publish a card?', 'publish a card'],
    ['what is a placeholder?', 'placeholder'],
    ['how do promotions work?', 'promotion'],
    ['what is an OSI?', 'OSI'],
    ['how do I create a collection?', 'collection'],
    ['how do I use the offer selector tool?', 'Offer Selector'],
    ['what is a bulk publish project?', 'Bulk Publish'],
    ['how do I create a translation project?', 'translation project'],
    ['how do I send cards for localization?', 'localization'],
    ['what is the MCS product catalog?', 'product catalog'],
    ['how do I edit a card that is already published?', 'publish'],
    // Written 2026-09-02, after this suite measured them as broken.
    ['what is mas-field?', 'mas-field'],
    ['how do headless cards work?', 'headless'],
    ['how do I author a headless card?', 'headless'],
    ['what card variants are available?', 'variant'],
    ['why is my card showing English on a French page?', 'english'],
    ['what are masks?', 'mask'],
    ['what is the advanced tools page?', 'advanced tools'],
    ['how do I use the locale picker?', 'locale picker'],
    ['what does the fragment editor do?', 'fragment editor'],
    ['how do I roll out a card to other locales?', 'roll out'],
    ['how do I preview a card on a page?', 'preview'],
];

/**
 * Questions the corpus cannot answer correctly today. Empty, and worth keeping
 * that way: every entry is a real question a user can ask and get a wrong
 * answer to.
 *
 * It held 11 entries when this suite was written. They were the measurement
 * that said what to write: mas-field and the headless variant, the card
 * variants, masks, Advanced tools, the locale picker, the fragment editor,
 * rollout projects, previewing a card on a page, and the English-fallback
 * question. All are now covered and have moved into PROBES above.
 *
 * To park a gap here, give the question and why it fails. The test below fails
 * when a parked question starts working, so the list cannot drift into
 * fiction.
 */
const KNOWN_GAPS = {};

let retrieve;

async function answersAbout(question, marker) {
    const { sources } = await retrieve(question);
    if (!sources.length) return { ok: false, why: 'retrieved nothing' };
    const haystack = sources.map((s) => `${s.section} ${s.title}`).join(' | ').toLowerCase();
    if (haystack.includes(marker.toLowerCase())) return { ok: true };
    return { ok: false, why: `top hit was "${sources[0].section}"` };
}

describe('ai-chat/knowledge coverage', () => {
    before(async () => {
        const [{ LocalKnowledgeRetriever }, { KNOWLEDGE_CHUNKS }] = await Promise.all([
            import('../../src/ai-chat/knowledge-retriever.js'),
            import('../../src/ai-chat/knowledge-corpus.js'),
        ]);
        const retriever = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS);
        retrieve = (question) => retriever.queryWithSources(question, PROD_RETRIEVAL);
    });

    it('runs against the real corpus, not a fixture', async () => {
        const { KNOWLEDGE_CHUNKS } = await import('../../src/ai-chat/knowledge-corpus.js');
        expect(KNOWLEDGE_CHUNKS.length, 'corpus looks too small to be the real one').to.be.above(50);
    });

    for (const [question, marker] of PROBES) {
        it(`answers: ${question}`, async () => {
            const verdict = await answersAbout(question, marker);
            expect(verdict.ok, `${question} — ${verdict.why} (expected something about "${marker}")`).to.equal(true);
        });
    }

    /**
     * The corpus names tool identifiers (search_cards, create_locale_variation)
     * so the model can connect a documented capability to an intent it can
     * emit. That makes a stale identifier worse than a stale sentence: it reads
     * like a real tool name, so it seeds a call the registry will reject.
     *
     * find_untranslated_cards survived here for a day after its intent was
     * removed, purely because nothing checked.
     */
    it('names no tool the registry does not have', async () => {
        const fs = require('fs');
        const path = require('path');
        const { INTENTS } = await import('../../src/ai-chat/intent-registry.js');

        const known = new Set();
        for (const intent of INTENTS) {
            known.add(intent.name);
            if (intent.tool_target) known.add(intent.tool_target);
        }

        // Snake_case tokens long enough to be an identifier rather than prose.
        // Domain terms that are not tools live here with a reason.
        const NOT_A_TOOL = new Set(['web_commerce_artifact']);

        const dir = path.join(__dirname, '../../src/ai-chat/knowledge');
        const unknown = [];
        for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
            const text = fs.readFileSync(path.join(dir, file), 'utf8');
            for (const [token] of text.matchAll(/\b[a-z]+(?:_[a-z]+){1,3}\b/g)) {
                if (token.length > 8 && !known.has(token) && !NOT_A_TOOL.has(token)) {
                    unknown.push(`${file}: ${token}`);
                }
            }
        }

        expect([...new Set(unknown)], `corpus names tools that are not in the registry:\n  ${[...new Set(unknown)].join('\n  ')}`).to.deep.equal([]);
    });

    describe('the known gaps', () => {
        it('shrinks: a question that now answers correctly must leave KNOWN_GAPS', async () => {
            const fixed = [];
            for (const [question, entry] of Object.entries(KNOWN_GAPS)) {
                const verdict = await answersAbout(question, entry.marker);
                if (verdict.ok) fixed.push(question);
            }

            expect(fixed, `these now answer correctly — delete them from KNOWN_GAPS:\n  ${fixed.join('\n  ')}`).to.deep.equal(
                [],
            );
        });

        it('keeps every gap question out of the passing probe list', () => {
            const overlap = PROBES.map(([q]) => q).filter((q) => q in KNOWN_GAPS);

            expect(overlap, `listed as both passing and known-broken: ${overlap.join(', ')}`).to.deep.equal([]);
        });
    });
});
