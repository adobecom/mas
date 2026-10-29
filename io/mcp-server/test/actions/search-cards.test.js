import { expect } from 'chai';
import { Ims } from '@adobe/aio-lib-ims';
import { main } from '../../src/actions/search-cards.js';
import { StudioOperations } from '../../src/lib/studio-operations.js';

const validHeaders = { authorization: 'Bearer valid-test-token' };

const baseParams = {
    __ow_headers: validHeaders,
    surface: 'acom',
    locale: 'en_US',
    AEM_BASE_URL: 'https://author-p148704-e1564096.adobeaemcloud.com',
    STUDIO_BASE_URL: 'https://mas.adobe.com/studio.html',
};

function makeCard(i, { withFragmentData = false, bloat = 0 } = {}) {
    const card = {
        id: `card-${i}`,
        path: `/content/dam/mas/acom/en_US/card-${i}`,
        title: `Card ${i}`,
        variant: 'plans',
        size: 'wide',
        osi: `osi-${i}`,
        fields: { title: `Card ${i}`, variant: 'plans' },
        tags: [],
    };
    if (withFragmentData) {
        card.fragmentData = {
            id: `card-${i}`,
            fields: { title: `Card ${i}`, description: 'x'.repeat(bloat) },
            settings: {},
            priceLiterals: {},
            dictionary: {},
            placeholders: {},
        };
    }
    return card;
}

describe('search-cards action', () => {
    let originalValidateToken;
    let originalSearchCards;
    let originalSearchById;

    before(() => {
        originalValidateToken = Ims.prototype.validateToken;
        originalSearchCards = StudioOperations.prototype.searchCards;
        originalSearchById = StudioOperations.prototype.searchById;
        Ims.prototype.validateToken = async () => ({ valid: true });
    });

    after(() => {
        Ims.prototype.validateToken = originalValidateToken;
        StudioOperations.prototype.searchCards = originalSearchCards;
        StudioOperations.prototype.searchById = originalSearchById;
    });

    afterEach(() => {
        StudioOperations.prototype.searchCards = originalSearchCards;
        StudioOperations.prototype.searchById = originalSearchById;
    });

    it('preserves fragmentData on small responses', async () => {
        StudioOperations.prototype.searchCards = async () => ({
            success: true,
            operation: 'search',
            results: [makeCard(1, { withFragmentData: true }), makeCard(2, { withFragmentData: true })],
            count: 2,
            message: 'Found 2 cards',
        });

        const result = await main({ ...baseParams, query: 'photoshop' });
        expect(result.statusCode).to.equal(200);
        expect(result.body.results).to.have.lengthOf(2);
        for (const card of result.body.results) {
            expect(card).to.have.property('fragmentData');
        }
        expect(result.body.truncated).to.not.equal(true);
    });

    it('truncates results when total payload exceeds 900 KB', async () => {
        // Each card with fragmentData containing 20 KB of bloat = ~20 KB per card.
        // 60 of them = ~1.2 MB, well over the 900 KB budget.
        const huge = Array.from({ length: 60 }, (_, i) => makeCard(i, { withFragmentData: true, bloat: 20_000 }));
        StudioOperations.prototype.searchCards = async () => ({
            success: true,
            operation: 'search',
            results: huge,
            count: huge.length,
            message: 'Found 60 cards',
        });

        const result = await main({ ...baseParams, query: 'photoshop' });
        expect(result.statusCode).to.equal(200);
        expect(result.body.truncated).to.equal(true);
        expect(result.body.results.length).to.be.lessThan(60);
        expect(result.body.count).to.equal(result.body.results.length);
        expect(result.body.message).to.match(/truncated/i);

        const size = Buffer.byteLength(JSON.stringify(result.body), 'utf8');
        expect(size).to.be.lessThan(900_000);
    });

    it('does not mark non-truncated responses as truncated', async () => {
        StudioOperations.prototype.searchCards = async () => ({
            success: true,
            operation: 'search',
            results: [makeCard(1), makeCard(2)],
            count: 2,
            message: 'Found 2 cards',
        });

        const result = await main({ ...baseParams, query: 'photoshop' });
        expect(result.body.truncated).to.not.equal(true);
        expect(result.body.message).to.not.match(/truncated/i);
    });

    it('keeps fragmentData on surviving entries after truncation', async () => {
        // Surviving entries must keep fragmentData so the frontend's
        // AemFragment cache can serve hover previews without a refetch.
        const huge = Array.from({ length: 60 }, (_, i) => makeCard(i, { withFragmentData: true, bloat: 20_000 }));
        StudioOperations.prototype.searchCards = async () => ({
            success: true,
            operation: 'search',
            results: huge,
            count: huge.length,
            message: 'Found 60 cards',
        });

        const result = await main({ ...baseParams, query: 'photoshop' });
        expect(result.body.truncated).to.equal(true);
        for (const card of result.body.results) {
            expect(card).to.have.property('fragmentData');
            expect(card.fragmentData).to.have.property('settings');
        }
    });

    it('forwards variant param to StudioOperations.searchCards', async () => {
        let captured = null;
        StudioOperations.prototype.searchCards = async (args) => {
            captured = args;
            return {
                success: true,
                operation: 'search',
                results: [makeCard(1)],
                count: 1,
                message: 'Found 1 card',
            };
        };

        await main({ ...baseParams, query: 'photoshop', variant: 'plans' });
        expect(captured).to.not.equal(null);
        expect(captured.variant).to.equal('plans');
    });

    it('forwards variationType param to StudioOperations.searchCards', async () => {
        let captured = null;
        StudioOperations.prototype.searchCards = async (args) => {
            captured = args;
            return {
                success: true,
                operation: 'search',
                results: [],
                count: 0,
                message: 'Found 0 cards',
            };
        };

        await main({ ...baseParams, query: 'photoshop', variationType: 'masters' });
        expect(captured.variationType).to.equal('masters');
    });

    it('passes through TIMEOUT result unchanged in shape', async () => {
        StudioOperations.prototype.searchCards = () =>
            new Promise(() => {
                /* never resolves */
            });

        const result = await main({ ...baseParams, query: 'photoshop', SEARCH_TIMEOUT_MS: '1' });
        expect(result.statusCode).to.equal(200);
        expect(result.body.success).to.equal(false);
        expect(result.body.error).to.equal('TIMEOUT');
        expect(result.body.results).to.deep.equal([]);
    });
});
