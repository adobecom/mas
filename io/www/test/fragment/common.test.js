import { expect } from 'chai';
import sinon from 'sinon';
import { fetch as internalFetch } from '../../src/fragment/utils/common.js';

describe('internalFetch', () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    describe('auth header injection', () => {
        it('should include Authorization header when authToken is set', async () => {
            fetchStub.resolves(new Response(JSON.stringify({ id: '123' }), { status: 200 }));

            const context = {
                authToken: 'test-ims-token',
                DEFAULT_HEADERS: { Accept: 'application/json' },
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            await internalFetch('https://example.com/fragment/123', context, 'test');

            const callArgs = fetchStub.firstCall.args;
            expect(callArgs[1].headers).to.have.property('Authorization', 'Bearer test-ims-token');
            expect(callArgs[1].headers).to.have.property('Accept', 'application/json');
        });

        it('should not include Authorization header when authToken is absent', async () => {
            fetchStub.resolves(new Response(JSON.stringify({ id: '123' }), { status: 200 }));

            const context = {
                DEFAULT_HEADERS: { Accept: 'application/json' },
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            await internalFetch('https://example.com/fragment/123', context, 'test');

            const callArgs = fetchStub.firstCall.args;
            expect(callArgs[1].headers).to.not.have.property('Authorization');
        });
    });

    describe('fallback logic', () => {
        it('should fall back to fallbackUrl when primary fetch fails with 5xx', async () => {
            const freyjaUrl =
                'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/abc?references=all-hydrated';
            const expectedOdinUrl = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments/abc?references=all-hydrated';

            fetchStub.withArgs(freyjaUrl, sinon.match.any).resolves(new Response('Server Error', { status: 500 }));
            fetchStub
                .withArgs(expectedOdinUrl, sinon.match.any)
                .resolves(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));

            const context = {
                authToken: 'test-token',
                preview: { url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments' },
                fallbackUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            const result = await internalFetch(freyjaUrl, context, 'test');
            expect(result.status).to.equal(200);
            const odinCall = fetchStub.getCalls().find((c) => c.args[0] === expectedOdinUrl);
            expect(odinCall).to.not.be.undefined;
            expect(odinCall.args[1].headers).to.not.have.property('Authorization');
        });

        it('should not fall back when primary fetch succeeds', async () => {
            fetchStub.resolves(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));

            const context = {
                authToken: 'test-token',
                preview: { url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments' },
                fallbackUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            const result = await internalFetch(
                'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/abc',
                context,
                'test',
            );
            expect(result.status).to.equal(200);
            expect(fetchStub.callCount).to.equal(1);
        });

        it('should propagate error when both primary and fallback fail', async () => {
            const freyjaUrl = 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/abc';
            const odinUrl = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments/abc';

            fetchStub.withArgs(freyjaUrl, sinon.match.any).resolves(new Response('Server Error', { status: 500 }));
            fetchStub.withArgs(odinUrl, sinon.match.any).resolves(new Response('Server Error', { status: 500 }));

            const context = {
                authToken: 'test-token',
                preview: { url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments' },
                fallbackUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            const result = await internalFetch(freyjaUrl, context, 'test');
            expect(result.status).to.equal(500);
        });
    });
});
