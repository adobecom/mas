import { expect } from 'chai';
import { Ims } from '@adobe/aio-lib-ims';
import { StudioOperations } from '../../src/lib/studio-operations.js';
import { main } from '../../src/actions/search-cards.js';

/**
 * The Find Cards chips offer "Draft cards only", "Published cards" and
 * "Recently modified", which send status, sortBy and sortDirection.
 * search-cards.js read none of them, so the user got the unfiltered surface
 * listing under a heading that said otherwise: a wrong answer that looks right,
 * which is worse than an error. `offset` was dropped the same way, so paging
 * silently repeated the first page.
 *
 * Cards already carry `status` and `modified` (studio-operations formatCard),
 * so the filtering is real, it was just never wired.
 */
const validHeaders = { authorization: 'Bearer valid-test-token' };
const baseParams = { AEM_BASE_URL: 'https://author-test.adobeaemcloud.com', __ow_headers: validHeaders };

const card = (id, status, modified) => ({ id, title: `Card ${id}`, status, modified });

describe('search-cards filters', () => {
    let originalValidateToken;
    let originalSearch;
    let received;

    before(() => {
        originalValidateToken = Ims.prototype.validateToken;
        originalSearch = StudioOperations.prototype.searchCards;
    });

    after(() => {
        Ims.prototype.validateToken = originalValidateToken;
        StudioOperations.prototype.searchCards = originalSearch;
    });

    beforeEach(() => {
        received = null;
        Ims.prototype.validateToken = async () => ({ valid: true });
    });

    function stubResults(results) {
        StudioOperations.prototype.searchCards = async function stubbed(params) {
            received = params;
            return { success: true, operation: 'search', results, count: results.length, message: 'Found cards' };
        };
    }

    const MIXED = [
        card('a', 'PUBLISHED', '2026-01-03T00:00:00Z'),
        card('b', 'DRAFT', '2026-01-01T00:00:00Z'),
        card('c', 'Published', '2026-01-02T00:00:00Z'),
        card('d', 'MODIFIED', '2026-01-04T00:00:00Z'),
    ];

    it('returns only published cards when the published chip is used', async () => {
        stubResults(MIXED);

        const result = await main({ ...baseParams, surface: 'acom', status: 'PUBLISHED' });

        const ids = result.body.results.map((c) => c.id);
        expect(ids).to.deep.equal(['a', 'c']);
        expect(result.body.count).to.equal(2);
    });

    it('treats anything not published as a draft, the way the publish check does', async () => {
        stubResults(MIXED);

        const result = await main({ ...baseParams, surface: 'acom', status: 'DRAFT' });

        const ids = result.body.results.map((c) => c.id);
        expect(ids).to.deep.equal(['b', 'd']);
    });

    it('sorts by modified, newest first, for the recently-modified chip', async () => {
        stubResults(MIXED);

        const result = await main({ ...baseParams, surface: 'acom', sortBy: 'modified', sortDirection: 'desc' });

        expect(result.body.results.map((c) => c.id)).to.deep.equal(['d', 'a', 'c', 'b']);
    });

    it('honours an ascending sort direction', async () => {
        stubResults(MIXED);

        const result = await main({ ...baseParams, surface: 'acom', sortBy: 'modified', sortDirection: 'asc' });

        expect(result.body.results.map((c) => c.id)).to.deep.equal(['b', 'c', 'a', 'd']);
    });

    it('passes offset through, so paging does not repeat the first page', async () => {
        stubResults(MIXED);

        await main({ ...baseParams, surface: 'acom', offset: 20 });

        expect(received.offset).to.equal(20);
    });

    it('over-fetches when filtering, so a status filter is not starved by the limit', async () => {
        stubResults(MIXED);

        await main({ ...baseParams, surface: 'acom', status: 'DRAFT', limit: 10 });

        expect(received.limit, 'a status filter needs a wider read than the caller asked for').to.be.above(10);
    });

    it('still returns no more than the caller asked for', async () => {
        stubResults([card('a', 'DRAFT', '1'), card('b', 'DRAFT', '2'), card('c', 'DRAFT', '3')]);

        const result = await main({ ...baseParams, surface: 'acom', status: 'DRAFT', limit: 2 });

        expect(result.body.results).to.have.length(2);
    });

    it('leaves an unfiltered search exactly as it was', async () => {
        stubResults(MIXED);

        const result = await main({ ...baseParams, surface: 'acom', limit: 10 });

        // Same order, same rows, and no widening: only a filtered read is
        // allowed to ask for more than the caller wanted.
        expect(result.body.results.map((c) => c.id)).to.deep.equal(['a', 'b', 'c', 'd']);
        expect(received.limit).to.equal(10);
    });

    it('says what it filtered, so the heading and the list agree', async () => {
        stubResults(MIXED);

        const result = await main({ ...baseParams, surface: 'acom', status: 'DRAFT' });

        expect(result.body.message).to.match(/draft/i);
    });
});
