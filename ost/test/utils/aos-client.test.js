import { expect } from '@open-wc/testing';
import { searchOffers, createOfferSelector, getOfferById } from '../../src/utils/aos-client.js';

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
            // AOS rejects environment=PRODUCTION with HTTP 400; it must be normalized to PROD.
            expect(call.url).to.include('environment=PROD');
            expect(call.url).to.not.include('environment=PRODUCTION');
            expect(call.options.headers['Authorization']).to.equal('Bearer test-token');
            expect(call.options.headers['X-Api-Key']).to.equal('test-key');
            expect(result.data).to.deep.equal(fetchResponse);
        });

        it('uses stage base URL for STAGE env', async () => {
            fetchResponse = [];
            await searchOffers({ arrangementCode: ['test'] }, { env: 'STAGE', apiKey: 'k' });

            expect(fetchCalls[0].url).to.include('https://aos-stage.adobe.io/offers?');
        });

        it('uses custom baseUrl when provided', async () => {
            fetchResponse = [];
            await searchOffers({ arrangementCode: ['test'] }, { baseUrl: 'https://custom.example.com', apiKey: 'k' });

            expect(fetchCalls[0].url).to.include('https://custom.example.com/offers?');
        });

        it('omits undefined params from URL', async () => {
            fetchResponse = [];
            await searchOffers({ arrangementCode: ['test'], language: undefined }, { apiKey: 'k', env: 'PRODUCTION' });

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

    describe('getOfferById', () => {
        it('looks up a single offer via the path form, not the ignored offer_id query param', async () => {
            fetchResponse = [{ offer_id: '040DCF1A11122A9096E4756473D186AF', product_arrangement_code: 'PA-954' }];

            await getOfferById('040DCF1A11122A9096E4756473D186AF', 'AU', {
                accessToken: 'test-token',
                apiKey: 'test-key',
                env: 'PRODUCTION',
                environment: 'PRODUCTION',
                landscape: 'PUBLISHED',
            });

            expect(fetchCalls.length).to.equal(1);
            const call = fetchCalls[0];
            expect(call.url).to.include('https://aos.adobe.io/offers/040DCF1A11122A9096E4756473D186AF?');
            expect(call.url).to.not.include('offer_id=');
            expect(call.url).to.include('country=AU');
            expect(call.url).to.include('api_key=test-key');
            expect(call.url).to.include('landscape=PUBLISHED');
            expect(call.url).to.include('environment=PROD');
            expect(call.options.headers['Authorization']).to.equal('Bearer test-token');
        });
    });
});
