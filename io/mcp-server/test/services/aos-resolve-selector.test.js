import { expect } from 'chai';
import { AOSClient } from '../../src/services/aos-client.js';

const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };
const client = () => new AOSClient(STUB_AUTH, { baseUrl: 'https://aos.example.com', apiKey: 'test-key' });

/**
 * AOS ignores an offer_selector_ids filter it does not recognise and answers
 * with an unfiltered page of offers, exactly as it does for offer_id. getOffer
 * guards against that by matching the id exactly; resolveOfferSelector did not,
 * and the release flow reads offers[0].
 *
 * Measured against the live service: resolving a mistranscribed OSI and
 * resolving the literal string "THIS_IS_NOT_A_REAL_OSI_AT_ALL_1234567890xyz"
 * both returned the SAME 20 offers spanning 19 different products, first among
 * them creative_cloud_all_apps_stock_bundle_edu_t_direct_team. So a stale or
 * mistyped OSI did not fail — it silently produced a Creative Cloud EDU Team
 * card for someone asking about Firefly.
 *
 * The offers carry no field naming the selector they came from, so the only
 * available signal is coherence: a selector resolves offers for ONE product
 * arrangement (its base, trial and term variants). Offers spanning several
 * products mean the filter was dropped. Returning nothing is the safe answer —
 * callers already handle the empty case — because a wrong offer here becomes a
 * wrong card.
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
const offer = (id, product) => ({ offer_id: id, product_arrangement_code: product, commitment: 'YEAR', term: 'ANNUAL' });

const OSI = 'AYWFYb2BjlsnXgYwWJzBPN2anVXjJPsDtW49Ozqb1Qw';

describe('AOSClient.resolveOfferSelector', () => {
    let fetchStub;

    afterEach(() => {
        fetchStub?.restore();
        fetchStub = null;
    });

    it('rejects an unfiltered page rather than handing back its first offer', async () => {
        fetchStub = stubFetch(() =>
            ok([
                offer('A'.repeat(32), 'creative_cloud_all_apps_stock_bundle_edu_t_direct_team'),
                offer('B'.repeat(32), 'stks_direct_indirect_team'),
                offer('C'.repeat(32), 'photoshop_for_multi_frl_online_in_etla_enterprise_frl'),
            ]),
        );

        const offers = await client().resolveOfferSelector(OSI, 'US');

        expect(offers, 'offers spanning several products mean AOS dropped the filter').to.deep.equal([]);
    });

    it('returns the offers when they all belong to one product', async () => {
        fetchStub = stubFetch(() =>
            ok([
                offer('A'.repeat(32), 'firefly_standard_direct_individual'),
                offer('B'.repeat(32), 'firefly_standard_direct_individual'),
            ]),
        );

        const offers = await client().resolveOfferSelector(OSI, 'US');

        expect(offers).to.have.lengthOf(2);
        expect(offers[0].product_arrangement_code).to.equal('firefly_standard_direct_individual');
    });

    it('returns a single resolved offer', async () => {
        fetchStub = stubFetch(() => ok([offer('A'.repeat(32), 'firefly_standard_direct_individual')]));

        const offers = await client().resolveOfferSelector(OSI, 'US');

        expect(offers).to.have.lengthOf(1);
    });

    it('still falls back to a direct lookup when an offer id was passed as the selector', async () => {
        const offerId = 'F5B3D59867BC5B6020EFA0763C3AE92A';
        fetchStub = stubFetch((url) =>
            url.searchParams.get('offer_selector_ids') ? ok([]) : ok([offer(offerId, 'firefly_standard_direct_individual')]),
        );

        const offers = await client().resolveOfferSelector(offerId, 'US');

        expect(offers).to.have.lengthOf(1);
        expect(offers[0].offer_id).to.equal(offerId);
    });
});
