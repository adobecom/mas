import { expect } from 'chai';
import { AOSClient } from '../../src/services/aos-client.js';

const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };
const OFFER_ID = 'F5B3D59867BC5B6020EFA0763C3AE92A';

describe('AOSClient API key header', () => {
    const original = globalThis.fetch;
    let sentKeys;
    const client = new AOSClient(STUB_AUTH, { baseUrl: 'https://aos.example.com', apiKey: 'test-key' });

    beforeEach(() => {
        sentKeys = [];
        globalThis.fetch = async (url, init) => {
            sentKeys.push(new Headers(init.headers).get('x-api-key'));
            return { ok: true, status: 200, json: async () => [{ offer_id: OFFER_ID }] };
        };
    });

    afterEach(() => {
        globalThis.fetch = original;
    });

    it('sends one key value from searchOffers', async () => {
        await client.searchOffers({ arrangementCode: 'PA-1' });
        expect(sentKeys).to.deep.equal(['test-key']);
    });

    it('sends one key value from getOffer', async () => {
        await client.getOffer(OFFER_ID, 'US');
        expect(sentKeys).to.deep.equal(['test-key']);
    });

    it('sends one key value when resolving an offer selector', async () => {
        await client.resolveOfferSelector('selector-1', 'US');
        expect(sentKeys.length).to.be.greaterThan(0);
        expect(new Set(sentKeys)).to.deep.equal(new Set(['test-key']));
    });
});
