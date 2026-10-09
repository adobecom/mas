import { expect } from 'chai';
import { AEMClient } from '../../src/lib/aem-client.js';

const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };

function stubFetch(responses) {
    const calls = [];
    globalThis.fetch = async (url) => {
        calls.push(url);
        const r = responses[calls.length - 1];
        if (!r) throw new Error(`Unexpected fetch call ${calls.length}: ${url}`);
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            text: async () => '',
            json: async () => r,
        };
    };
    return calls;
}

describe('AEMClient.searchFragments cursor support', () => {
    let originalFetch;
    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('returns array by default (backwards compatible)', async () => {
        stubFetch([{ items: [{ id: 'a' }, { id: 'b' }], cursor: 'next-page' }]);
        const client = new AEMClient('https://aem.example.com', STUB_AUTH);
        const result = await client.searchFragments({ path: '/x', limit: 50 });
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length).to.equal(2);
    });

    it('returns {items, cursor} when includeCursor is true', async () => {
        stubFetch([{ items: [{ id: 'a' }, { id: 'b' }], cursor: 'page-2' }]);
        const client = new AEMClient('https://aem.example.com', STUB_AUTH);
        const result = await client.searchFragments({ path: '/x', limit: 50, includeCursor: true });
        expect(result.items.length).to.equal(2);
        expect(result.cursor).to.equal('page-2');
    });

    it('returns null cursor when AEM omits it (last page)', async () => {
        stubFetch([{ items: [{ id: 'a' }] }]);
        const client = new AEMClient('https://aem.example.com', STUB_AUTH);
        const result = await client.searchFragments({ path: '/x', includeCursor: true });
        expect(result.cursor).to.equal(null);
    });

    it('uses cursor query param when cursor is provided', async () => {
        const calls = stubFetch([{ items: [], cursor: null }]);
        const client = new AEMClient('https://aem.example.com', STUB_AUTH);
        await client.searchFragments({ path: '/x', cursor: 'abc-123', includeCursor: true });
        expect(calls[0]).to.contain('cursor=abc-123');
        expect(calls[0]).not.to.contain('offset=');
    });

    it('uses offset when no cursor is provided', async () => {
        const calls = stubFetch([{ items: [] }]);
        const client = new AEMClient('https://aem.example.com', STUB_AUTH);
        await client.searchFragments({ path: '/x', offset: 100 });
        expect(calls[0]).to.contain('offset=100');
        expect(calls[0]).not.to.contain('cursor=');
    });
});
