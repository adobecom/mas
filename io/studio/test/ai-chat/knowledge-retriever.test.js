const { expect } = require('chai');

let LocalKnowledgeRetriever;

const FIXTURE_CHUNKS = [
    {
        id: 'translations.md#0',
        topic: 'translations',
        title: 'Translations in MAS Studio',
        section: 'How do I create a translation project?',
        keywords: ['translation', 'translate', 'locale', 'language'],
        text: 'Open the Translations view from the side navigation and click New Project. Pick the source cards and the target locales, then submit the translation project.',
    },
    {
        id: 'translations.md#1',
        topic: 'translations',
        title: 'Translations in MAS Studio',
        section: 'How do I check translation status?',
        keywords: ['translation', 'translate', 'locale', 'language'],
        text: 'The Translations view lists every project with its current status. Completed projects create locale variations automatically.',
    },
    {
        id: 'bulk-operations.md#0',
        topic: 'bulk',
        title: 'Bulk Operations in MAS Studio',
        section: 'How do I bulk publish cards?',
        keywords: ['bulk', 'publish', 'batch'],
        text: 'Select multiple cards and choose Publish, or ask the assistant to bulk publish them. A preview step shows exactly which fragments will be published before you confirm.',
    },
    {
        id: 'promotions.md#0',
        topic: 'promotions',
        title: 'Promotions in MAS Studio',
        section: 'What is a promotion?',
        keywords: ['promotion', 'promo', 'discount', 'campaign'],
        text: 'A promotion applies discounted pricing to offers for a limited window. Promotions are managed in the Promotions view, where each promotion has a status and schedule.',
    },
    {
        id: 'cards.md#0',
        topic: 'cards',
        title: 'Cards in MAS Studio',
        section: 'What fields does a card have?',
        keywords: ['card', 'fields', 'variant'],
        text: 'Cards carry a title, description, prices, and CTAs. A card can also reference a promotion when its offer is discounted during a campaign window.',
    },
    {
        id: 'placeholders.md#0',
        topic: 'placeholders',
        title: 'Placeholders in MAS Studio',
        section: 'What is a placeholder?',
        keywords: ['placeholder', 'dictionary', 'key'],
        text: 'A placeholder is a dictionary entry fragment resolved into card text at render time. Placeholders are managed per surface and locale in the Placeholders view.',
    },
];

describe('ai-chat/knowledge-retriever', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/knowledge-retriever.js');
        LocalKnowledgeRetriever = mod.LocalKnowledgeRetriever;
    });

    const makeRetriever = () => new LocalKnowledgeRetriever(FIXTURE_CHUNKS);

    it('retrieves the matching chunk for a feature question', async () => {
        const { context, sources } = await makeRetriever().queryWithSources('How do I create a translation project?', {
            topK: 2,
            minScore: 0.7,
        });
        expect(context).to.include('New Project');
        expect(context).to.include('RELEVANT KNOWLEDGE');
        expect(sources[0].title).to.include('translation project');
    });

    it('ranks the most specific chunk first', async () => {
        const { sources } = await makeRetriever().queryWithSources('bulk publish cards', {
            topK: 3,
            minScore: 0.5,
        });
        expect(sources[0].id).to.equal('bulk-operations.md#0');
    });

    it('matches plural and singular forms', async () => {
        const { context } = await makeRetriever().queryWithSources('what are promotions?', {
            topK: 2,
            minScore: 0.6,
        });
        expect(context).to.include('discounted pricing');
    });

    it('ranks the dedicated topic chunk above incidental mentions', async () => {
        const { sources } = await makeRetriever().queryWithSources('what are promotions?', {
            topK: 3,
            minScore: 0.6,
        });
        expect(sources[0].id).to.equal('promotions.md#0');
    });

    it('matches -ing and -e verb forms against the corpus', async () => {
        const { sources } = await makeRetriever().queryWithSources('how does bulk publishing work?', {
            topK: 2,
            minScore: 0.7,
        });
        expect(sources.map((s) => s.id)).to.include('bulk-operations.md#0');
    });

    it('is not diluted by generic filler words in the question', async () => {
        const { sources } = await makeRetriever().queryWithSources('what is a placeholder and how do I use one?', {
            topK: 2,
            minScore: 0.7,
        });
        expect(sources.map((s) => s.id)).to.include('placeholders.md#0');
    });

    it('returns empty results for off-corpus questions', async () => {
        const { context, sources } = await makeRetriever().queryWithSources('what is the weather in paris today?', {
            topK: 3,
            minScore: 0.6,
        });
        expect(context).to.equal('');
        expect(sources).to.deep.equal([]);
    });

    it('respects topK', async () => {
        const { sources } = await makeRetriever().queryWithSources('translation locale status project', {
            topK: 1,
            minScore: 0.3,
        });
        expect(sources).to.have.length(1);
    });

    it('handles empty and junk queries without throwing', async () => {
        const retriever = makeRetriever();
        expect(await retriever.queryWithSources('')).to.deep.equal({ context: '', sources: [] });
        expect(await retriever.queryWithSources('the a of and')).to.deep.equal({ context: '', sources: [] });
        expect(await retriever.queryWithSources(null)).to.deep.equal({ context: '', sources: [] });
    });
});
