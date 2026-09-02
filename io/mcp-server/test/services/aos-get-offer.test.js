import { expect } from 'chai';
import { AOSClient } from '../../src/services/aos-client.js';

const OFFER_ID = 'F5B3D59867BC5B6020EFA0763C3AE92A';
const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };

/**
 * getOffer looked up an offer OST had just handed the user and reported
 * "Offer <id> not found", surfacing as a 500 from get-offer-by-id.
 *
 * The query was over-constrained. OST's own getOfferById
 * (mas-ost/src/utils/aos-client.js) sends five parameters — offer_id, country,
 * api_key, environment, landscape — while this client also sent
 * buying_program=RETAIL, merchant=ADOBE, sales_channel=DIRECT,
 * service_providers=PRICING and language=MULT. Those were lifted from
 * searchOffers, where narrowing an arrangement-code search is the point. An
 * offer_id is already unique, so against a lookup they can only exclude, and
 * any offer outside RETAIL/DIRECT (ETLA and enterprise offers, which the
 * catalog is full of) was filtered out in all 18 landscape x country attempts.
 */
function stubFetch(handler) {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        calls.push({ url: new URL(url), init });
        return handler(new URL(url), calls.length);
    };
    return {
        calls,
        restore: () => {
            globalThis.fetch = original;
        },
    };
}

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const notFound = () => ({ ok: false, status: 404, json: async () => ({ message: 'not found' }) });

const client = () => new AOSClient(STUB_AUTH, { baseUrl: 'https://aos.example.com', apiKey: 'test-key' });

describe('AOSClient.getOffer', () => {
    let fetchStub;

    afterEach(() => {
        fetchStub?.restore();
        fetchStub = null;
    });

    it('does not narrow a lookup by unique id with search filters', async () => {
        fetchStub = stubFetch(() => ok({ data: [{ offer_id: OFFER_ID, commitment: 'YEAR', term: 'MONTHLY' }] }));

        await client().getOffer(OFFER_ID, 'US');

        const params = fetchStub.calls[0].url.searchParams;
        for (const excluded of ['buying_program', 'merchant', 'sales_channel', 'service_providers', 'language']) {
            expect(params.get(excluded), `${excluded} must not narrow an offer_id lookup`).to.equal(null);
        }
    });

    it('sends the parameters OST sends, which is the query known to resolve an offer', async () => {
        fetchStub = stubFetch(() => ok({ data: [{ offer_id: OFFER_ID }] }));

        await client().getOffer(OFFER_ID, 'US');

        const params = fetchStub.calls[0].url.searchParams;
        expect(params.get('offer_id')).to.equal(OFFER_ID);
        expect(params.get('country')).to.equal('US');
        expect(params.get('api_key')).to.equal('test-key');
        expect(params.get('environment')).to.equal('PROD');
        expect(params.get('landscape')).to.be.oneOf(['PUBLISHED', 'DRAFT']);
    });

    it('finds an offer that only exists in the DRAFT landscape', async () => {
        // Published attempts return nothing; the draft pass must still find it.
        fetchStub = stubFetch((url) =>
            url.searchParams.get('landscape') === 'DRAFT' ? ok({ data: [{ offer_id: OFFER_ID }] }) : ok({ data: [] }),
        );

        const offer = await client().getOffer(OFFER_ID, 'US');

        expect(offer.offer_id).to.equal(OFFER_ID);
    });

    it('keeps the exact-match guard, because AOS ignores an unknown offer_id filter', async () => {
        fetchStub = stubFetch(() => ok({ data: [{ offer_id: 'SOMEOTHEROFFER00000000000000000A' }] }));

        await client()
            .getOffer(OFFER_ID, 'US')
            .then(
                () => expect.fail('a non-matching list must not be returned as the answer'),
                (error) => expect(error.message).to.include(OFFER_ID),
            );
    });

    it('gives the v3 fallback the landscape and environment it needs', async () => {
        fetchStub = stubFetch((url) =>
            url.pathname.includes('/v3/offers') ? ok({ data: [{ offer_id: OFFER_ID }] }) : notFound(),
        );

        const offer = await client().getOffer(OFFER_ID, 'US');

        expect(offer.offer_id).to.equal(OFFER_ID);
        const v3 = fetchStub.calls.find((call) => call.url.pathname.includes('/v3/offers'));
        const body = JSON.parse(v3.init.body);
        expect(body.landscape, 'v3 returns empty without a landscape').to.be.a('string');
        expect(body.environment, 'v3 returns empty without an environment').to.be.a('string');
    });
});
