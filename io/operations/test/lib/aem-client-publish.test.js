import { expect } from 'chai';
import { AEMClient } from '../../src/lib/aem-client.js';

const STUB_AUTH = { getAuthHeader: async () => 'Bearer fake-token' };

function makeClient() {
    const client = new AEMClient('https://aem.example.com', STUB_AUTH);
    client.getCsrfToken = async () => 'csrf-token';
    client.getFragment = async () => ({ id: 'frag-1', path: '/content/dam/x', etag: 'etag-1' });
    return client;
}

function capturePublishBody() {
    const bodies = [];
    globalThis.fetch = async (url, opts) => {
        bodies.push(JSON.parse(opts.body));
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            text: async () => '',
            json: async () => ({ success: true }),
        };
    };
    return bodies;
}

describe('AEMClient.publishFragment reference control', () => {
    let originalFetch;
    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('includes DRAFT and UNPUBLISHED references by default', async () => {
        const bodies = capturePublishBody();
        await makeClient().publishFragment('frag-1');
        expect(bodies[0].filterReferencesByStatus).to.deep.equal(['DRAFT', 'UNPUBLISHED']);
    });

    it('publishes with no references when publishReferences is false', async () => {
        const bodies = capturePublishBody();
        await makeClient().publishFragment('frag-1', false);
        expect(bodies[0].filterReferencesByStatus).to.deep.equal([]);
    });
});
