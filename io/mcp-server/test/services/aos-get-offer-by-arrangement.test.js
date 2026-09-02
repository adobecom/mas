import { expect } from 'chai';
import { AOSClient } from '../../src/services/aos-client.js';

const OFFER_ID = 'F5B3D59867BC5B6020EFA0763C3AE92A';
const ARRANGEMENT = 'PA-1930';
const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };
const client = () => new AOSClient(STUB_AUTH, { baseUrl: 'https://aos.example.com', apiKey: 'test-key' });

/**
 * Looking an offer up by its id could not work, and only appeared to.
 *
 * Measured against the live AOS on 2026-09-02 with these exact queries:
 *
 *   offer_id=F5B3D598...          ignored -> 100 unfiltered rows, target absent
 *   offer_ids=F5B3D598...         ignored -> the same 100 rows
 *   offer_selector_ids=...        ignored -> the same 100 rows
 *   POST /v3/offers               404, the endpoint does not exist
 *   arrangement_code=PA-1930      FILTERS -> 15 rows, one product, target PRESENT
 *
 * So AOS does not filter by offer id on this endpoint. getOffer fetched an
 * unfiltered page and matched the id inside it, which succeeded only when the
 * requested offer happened to fall in AOS's first hundred rows. For everything
 * else it reported "not found" for an offer that exists.
 *
 * The release flow always knows the product by this point — the user picked it
 * a turn earlier — so ask AOS something it honours and match the id in the
 * result.
 */
function stubFetch(handler) {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        calls.push({ url: new URL(url), init });
        return handler(new URL(url));
    };
    return {
        calls,
        restore: () => {
            globalThis.fetch = original;
        },
    };
}

const ok = (offers) => ({ ok: true, status: 200, json: async () => ({ data: offers }) });
const offer = (id, product = ARRANGEMENT) => ({
    offer_id: id,
    product_arrangement_code: product,
    commitment: 'YEAR',
    term: 'ANNUAL',
});

describe('AOSClient.getOffer with an arrangement code', () => {
    let fetchStub;

    afterEach(() => {
        fetchStub?.restore();
        fetchStub = null;
    });

    it('asks AOS by arrangement code, the filter it actually honours', async () => {
        fetchStub = stubFetch(() => ok([offer('AAAA'.repeat(8)), offer(OFFER_ID), offer('BBBB'.repeat(8))]));

        const found = await client().getOffer(OFFER_ID, 'US', { arrangementCode: ARRANGEMENT });

        expect(found.offer_id).to.equal(OFFER_ID);
        expect(fetchStub.calls[0].url.searchParams.get('arrangement_code')).to.equal(ARRANGEMENT);
    });

    it('picks the requested offer out of the product, not merely the first one', async () => {
        fetchStub = stubFetch(() => ok([offer('AAAA'.repeat(8)), offer('BBBB'.repeat(8)), offer(OFFER_ID)]));

        const found = await client().getOffer(OFFER_ID, 'US', { arrangementCode: ARRANGEMENT });

        expect(found.offer_id).to.equal(OFFER_ID);
    });

    it('fails honestly when the product genuinely does not carry that offer', async () => {
        fetchStub = stubFetch(() => ok([offer('AAAA'.repeat(8)), offer('BBBB'.repeat(8))]));

        await client()
            .getOffer(OFFER_ID, 'US', { arrangementCode: ARRANGEMENT })
            .then(
                () => expect.fail('a product without the offer must not resolve'),
                (error) => expect(error.message).to.include(OFFER_ID),
            );
    });

    it('never calls the v3 endpoint, which answers 404', async () => {
        fetchStub = stubFetch(() => ok([offer(OFFER_ID)]));

        await client().getOffer(OFFER_ID, 'US', { arrangementCode: ARRANGEMENT });

        expect(fetchStub.calls.filter((c) => c.url.pathname.includes('/v3/'))).to.have.lengthOf(0);
    });

    it('still works without an arrangement code, since not every caller has one', async () => {
        fetchStub = stubFetch(() => ok([offer(OFFER_ID)]));

        const found = await client().getOffer(OFFER_ID, 'US');

        expect(found.offer_id).to.equal(OFFER_ID);
    });
});
