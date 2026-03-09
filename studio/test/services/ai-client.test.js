import { expect } from '@open-wc/testing';

const AI_CHAT_BASE_URL_RE = /adobeioruntime\.net\/api\/v1\/web\/MerchAtScaleStudio/;

describe('ai-client', () => {
    let originalFetch;
    let originalAdobeIMS;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        originalAdobeIMS = window.adobeIMS;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        window.adobeIMS = originalAdobeIMS;
    });

    async function loadModule() {
        const mod = await import('../../src/services/ai-client.js');
        return mod.callAIChatAction;
    }

    it('throws if window.adobeIMS is missing', async () => {
        const callAIChatAction = await loadModule();
        delete window.adobeIMS;
        try {
            await callAIChatAction({ message: 'hello' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Adobe IMS not loaded');
        }
    });

    it('throws if no access token', async () => {
        const callAIChatAction = await loadModule();
        window.adobeIMS = { getAccessToken: () => null };
        try {
            await callAIChatAction({ message: 'hello' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.message).to.include('Not authenticated');
        }
    });

    it('throws if access token object has no token property', async () => {
        const callAIChatAction = await loadModule();
        window.adobeIMS = { getAccessToken: () => ({}) };
        try {
            await callAIChatAction({ message: 'hello' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.message).to.include('Not authenticated');
        }
    });

    it('calls fetch with correct URL, headers, and body', async () => {
        const callAIChatAction = await loadModule();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'test-token-123' }),
            adobeIdData: { client_id: 'test-client' },
        };

        globalThis.fetch = async (url, options) => {
            expect(url).to.match(AI_CHAT_BASE_URL_RE);
            expect(url).to.include('/ai-chat');
            expect(options.method).to.equal('POST');
            expect(options.headers['Content-Type']).to.equal('application/json');
            expect(options.headers['Authorization']).to.equal('Bearer test-token-123');
            expect(options.headers['x-api-key']).to.equal('test-client');
            const body = JSON.parse(options.body);
            expect(body.message).to.equal('hello');
            return {
                ok: true,
                json: async () => ({ reply: 'world' }),
            };
        };

        const result = await callAIChatAction({ message: 'hello' });
        expect(result.reply).to.equal('world');
    });

    it('returns parsed JSON on success', async () => {
        const callAIChatAction = await loadModule();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'tok' }),
        };

        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({ cards: [1, 2, 3] }),
        });

        const result = await callAIChatAction({});
        expect(result.cards).to.deep.equal([1, 2, 3]);
    });

    it('throws on non-OK response with error message from body', async () => {
        const callAIChatAction = await loadModule();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'tok' }),
        };

        globalThis.fetch = async () => ({
            ok: false,
            json: async () => ({ error: 'rate limited' }),
        });

        try {
            await callAIChatAction({});
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.message).to.equal('rate limited');
        }
    });

    it('throws default message when error body has no error field', async () => {
        const callAIChatAction = await loadModule();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'tok' }),
        };

        globalThis.fetch = async () => ({
            ok: false,
            json: async () => ({}),
        });

        try {
            await callAIChatAction({});
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Failed to communicate with AI service');
        }
    });
});
