const { expect } = require('chai');
const { loadRealCorpus, requireRealCorpus } = require('./real-corpus.js');

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
    // Coverage of the retired Studio source, beyond the original feature smoke questions.
    ['what is Merch at Scale?', 'Merch at Scale'],
    ['what is MAS Studio?', 'What is MAS Studio'],
    ['where does card content live?', 'card content live'],
    ['how does a card reach adobe.com?', 'card reach adobe.com'],
    ['what features does Merch at Scale Studio have?', 'features'],
    ['what is a surface and how does it affect my card?', 'surface and how'],
    ['how do I choose the right card variant?', 'choose the right card'],
    ["can I change a card's variant after it is created?", 'change a card'],
    ['how do I unpublish a card and what happens to pages using it?', 'unpublish a card'],
    ['what is a locale variation and what are the rules?', 'locale variation'],
    ['what is a grouped pzn variation?', 'grouped (pzn) variation'],
    ['how do I use one field of a card on a page?', 'one field of a card'],
    ['which field names can mas-field address?', 'field names'],
    ['does a single field still get the right price, promo and locale?', 'single field'],
    ['what is the difference between a card and an offer?', 'card and an offer'],
    ['what about offers that are not live yet (draft offers)?', 'draft offers'],
    ['what are placeholders in MAS Studio?', 'What are placeholders'],
    ["why don't I see the Promotions page?", "Why don't I see Promotions"],
    ['what does the promotions list show?', 'promotions list'],
    ['how do I create a promotion?', 'create a promotion'],
    ['what fields are required before a promotion can be saved?', 'fields are required'],
    ['how do I publish or schedule a promotion?', 'publish or schedule'],
    ['how do promo code exceptions and offer substitutions work?', 'exceptions and offer substitutions'],
    ['is the Promotions page the same as a PROMOTION offer type?', 'PROMOTION offer type'],
    ['what are masks in MAS Studio?', 'What are masks'],
    ['how do I add content and locales to a translation project?', 'add content and locales'],
    ['what do the translation project statuses mean?', 'statuses mean'],
    ['what happens after I submit a translation project?', 'submit a translation project'],
    ['are prices and offers translated too?', 'translated too'],
    ["why don't I see Promotions or Global settings in the side navigation?", "Why don't I see Promotions"],
    ['what do 401 and 403 errors mean?', '401 and 403'],
    ['why does OST show no results for my search?', 'OST show no results'],
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
    const haystack = sources
        .map((s) => `${s.section} ${s.title}`)
        .join(' | ')
        .toLowerCase();
    if (haystack.includes(marker.toLowerCase())) return { ok: true };
    return { ok: false, why: `top hit was "${sources[0].section}"` };
}

describe('ai-chat/knowledge coverage', () => {
    before(async function () {
        const KNOWLEDGE_CHUNKS = await requireRealCorpus(this);
        const { LocalKnowledgeRetriever } = await import('../../src/ai-chat/knowledge-retriever.js');
        const retriever = new LocalKnowledgeRetriever(KNOWLEDGE_CHUNKS);
        retrieve = (question) => retriever.queryWithSources(question, PROD_RETRIEVAL);
    });

    it('runs against the real corpus, not a fixture', async () => {
        const { chunks } = await loadRealCorpus();
        expect(chunks.length, 'corpus looks too small to be the real one').to.be.above(50);
    });

    for (const [question, marker] of PROBES) {
        it(`answers: ${question}`, async () => {
            const verdict = await answersAbout(question, marker);
            expect(verdict.ok, `${question} — ${verdict.why} (expected something about "${marker}")`).to.equal(true);
        });
    }

    for (const [question, evidence] of [
        ['how do I create a card in Studio?', /tags include an offerless tag/],
        ['how do I edit and publish a placeholder?', /placeholder fragment and then its dictionary index/],
        ['how do rich text placeholders work?', /500-character limit/],
        ['where do I get help?', /Support in Studio's navigation/],
        ['what happens when I edit a card that is already published?', /Published, Draft, New, Modified and Unpublished/],
        ['can I unpublish a card in Studio?', /does not currently offer Unpublish for cards/],
    ]) {
        it(`grounds the answer in current behavior: ${question}`, async () => {
            const { context } = await retrieve(question);
            expect(context).to.match(evidence);
        });
    }

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
