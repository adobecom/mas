import { expect } from '@open-wc/testing';
import { searchOffers, createOfferSelector } from '../../src/utils/aos-client.js';

let fetchCalls = [];
let fetchResponse = {};

function mockFetch(url, options) {
    fetchCalls.push({ url, options });
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fetchResponse),
        text: () => Promise.resolve(''),
    });
}

describe('aos-client', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;
        fetchCalls = [];
        fetchResponse = {};
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe('searchOffers', () => {
        it('builds correct URL with search params', async () => {
            fetchResponse = [{ offer_id: 'ABC123' }];
            const params = {
                arrangementCode: ['ccsn_direct_individual'],
                buyingProgram: 'RETAIL',
                commitment: 'YEAR',
                term: 'MONTHLY',
                offerType: 'BASE',
                customerSegment: 'INDIVIDUAL',
                marketSegment: 'COM',
                country: 'US',
                language: 'MULT',
                merchant: 'ADOBE',
                salesChannel: 'DIRECT',
                serviceProviders: ['PRICING'],
            };
            const config = {
                accessToken: 'test-token',
                apiKey: 'test-key',
                env: 'PRODUCTION',
                environment: 'PRODUCTION',
                landscape: 'DRAFT',
                pageSize: 1000,
            };

            const result = await searchOffers(params, config);

            expect(fetchCalls.length).to.equal(1);
            const call = fetchCalls[0];
            expect(call.url).to.include('https://aos.adobe.io/offers?');
            expect(call.url).to.include('arrangement_code=ccsn_direct_individual');
            expect(call.url).to.include('buying_program=RETAIL');
            expect(call.url).to.include('commitment=YEAR');
            expect(call.url).to.include('term=MONTHLY');
            expect(call.url).to.include('country=US');
            expect(call.url).to.include('api_key=test-key');
            expect(call.url).to.include('landscape=DRAFT');
            expect(call.url).to.include('page_size=1000');
            expect(call.options.headers['Authorization']).to.equal('Bearer test-token');
            expect(call.options.headers['X-Api-Key']).to.equal('test-key');
            expect(result.data).to.deep.equal(fetchResponse);
        });

        it('uses stage base URL for STAGE env', async () => {
            fetchResponse = [];
            await searchOffers(
                { arrangementCode: ['test'] },
                { env: 'STAGE', apiKey: 'k' },
            );

            expect(fetchCalls[0].url).to.include('https://aos-stage.adobe.io/offers?');
        });

        it('uses custom baseUrl when provided', async () => {
            fetchResponse = [];
            await searchOffers(
                { arrangementCode: ['test'] },
                { baseUrl: 'https://custom.example.com', apiKey: 'k' },
            );

            expect(fetchCalls[0].url).to.include('https://custom.example.com/offers?');
        });

        it('omits undefined params from URL', async () => {
            fetchResponse = [];
            await searchOffers(
                { arrangementCode: ['test'], language: undefined },
                { apiKey: 'k', env: 'PRODUCTION' },
            );

            expect(fetchCalls[0].url).not.to.include('language=');
        });

        it('throws on non-OK response', async () => {
            globalThis.fetch = () =>
                Promise.resolve({
                    ok: false,
                    status: 401,
                    text: () => Promise.resolve('Unauthorized'),
                });

            try {
                await searchOffers({ arrangementCode: ['test'] }, { apiKey: 'k' });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.include('401');
                expect(err.message).to.include('Unauthorized');
            }
        });
    });

    describe('createOfferSelector', () => {
        it('sends POST with offer selector params', async () => {
            fetchResponse = { id: 'osi-abc123' };
            const params = {
                product_arrangement_code: 'ccsn_direct_individual',
                buying_program: 'RETAIL',
                commitment: 'YEAR',
                term: 'MONTHLY',
                customer_segment: 'INDIVIDUAL',
                market_segment: 'COM',
                sales_channel: 'DIRECT',
                offer_type: 'BASE',
                merchant: 'ADOBE',
            };
            const config = {
                accessToken: 'test-token',
                apiKey: 'test-key',
                env: 'PRODUCTION',
            };

            const result = await createOfferSelector(params, config);

            expect(fetchCalls.length).to.equal(1);
            const call = fetchCalls[0];
            expect(call.url).to.include('https://aos.adobe.io/offer_selectors?');
            expect(call.url).to.include('api_key=test-key');
            expect(call.options.method).to.equal('POST');
            expect(call.options.headers['Content-Type']).to.equal('application/json');
            expect(call.options.headers['Authorization']).to.equal('Bearer test-token');
            expect(JSON.parse(call.options.body)).to.deep.equal(params);
            expect(result.data).to.deep.equal(fetchResponse);
        });

        it('throws on non-OK response', async () => {
            globalThis.fetch = () =>
                Promise.resolve({
                    ok: false,
                    status: 403,
                    text: () => Promise.resolve('Forbidden'),
                });

            try {
                await createOfferSelector({}, { apiKey: 'k' });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.include('403');
                expect(err.message).to.include('Forbidden');
            }
        });
    });
});
