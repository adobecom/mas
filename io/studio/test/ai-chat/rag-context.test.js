const { expect } = require('chai');

let retrieveRAGContext;

describe('ai-chat/retrieveRAGContext', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/index.js');
        retrieveRAGContext = mod.retrieveRAGContext;
    });

    const fakeClient = (result) => ({
        queryWithSources: async () => result,
    });

    it('returns empty context without a knowledge client', async () => {
        const result = await retrieveRAGContext('what is odin?', null, { isDocumentation: true });
        expect(result).to.deep.equal({ ragContext: '', sources: [] });
    });

    it('retrieves documentation knowledge for documentation queries', async () => {
        const client = fakeClient({
            context: '=== RELEVANT KNOWLEDGE ===\nOdin is the AEM headless content store.',
            sources: [{ title: 'Architecture' }],
        });
        const result = await retrieveRAGContext('what is odin?', client, { isDocumentation: true });
        expect(result.ragContext).to.include('Odin is the AEM headless content store.');
        expect(result.sources).to.have.length(1);
    });

    it('skips retrieval for non-documentation queries without variant details', async () => {
        let called = false;
        const client = {
            queryWithSources: async () => {
                called = true;
                return { context: 'x', sources: [] };
            },
        };
        const result = await retrieveRAGContext('publish my card', client, { isDocumentation: false });
        expect(called).to.equal(false);
        expect(result.ragContext).to.equal('');
    });

    it('appends variant field details when enabled', async () => {
        const client = fakeClient({ context: 'Catalog cards require a size field.', sources: [{ title: 'Variants' }] });
        const result = await retrieveRAGContext('make a catalog card', client, {
            isDocumentation: false,
            ragVariantDetails: true,
            detectedVariant: 'catalog',
        });
        expect(result.ragContext).to.include('VARIANT FIELD DETAILS FOR CATALOG');
        expect(result.ragContext).to.include('Catalog cards require a size field.');
    });

    it('swallows knowledge-service errors and returns empty context', async () => {
        const client = {
            queryWithSources: async () => {
                throw new Error('service down');
            },
        };
        const result = await retrieveRAGContext('what is odin?', client, { isDocumentation: true });
        expect(result).to.deep.equal({ ragContext: '', sources: [] });
    });
});
