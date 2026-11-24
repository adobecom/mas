import { expect } from 'chai';
import { AEMClient } from '../../src/lib/aem-client.js';

const STUB_AUTH = { getAuthHeader: async () => 'Bearer t' };

function client() {
    const c = new AEMClient('https://aem.example.com', STUB_AUTH);
    c.getCsrfToken = async () => 'csrf';
    c.waitForFragment = async () => {};
    return c;
}

function stubFetch(responder) {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
        calls.push({ url, opts });
        return responder(url, opts, calls.length);
    };
    return calls;
}
const ok = (json, status = 200) => ({
    ok: true,
    status,
    statusText: 'OK',
    text: async () => JSON.stringify(json),
    json: async () => json,
});
const fail = (status, json) => ({
    ok: false,
    status,
    statusText: 'ERR',
    text: async () => JSON.stringify(json),
    json: async () => json,
});

describe('AEMClient.createFragment', () => {
    let original;
    beforeEach(() => {
        original = globalThis.fetch;
    });
    afterEach(() => {
        globalThis.fetch = original;
    });

    it('POSTs the fragment data to the CF fragments endpoint', async () => {
        const calls = stubFetch(() => ok({ id: 'new-1', title: 'T' }));
        const res = await client().createFragment({ title: 'T', parentPath: '/p', fields: [] });
        expect(calls[0].url).to.equal('https://aem.example.com/adobe/sites/cf/fragments');
        expect(calls[0].opts.method).to.equal('POST');
        expect(JSON.parse(calls[0].opts.body).title).to.equal('T');
        expect(res.id).to.equal('new-1');
    });

    it('throws with the error detail on failure', async () => {
        stubFetch(() => fail(400, { detail: 'bad model' }));
        try {
            await client().createFragment({ title: 'T' });
            expect.fail('should reject');
        } catch (e) {
            expect(e.message).to.include('Failed to create fragment: 400');
            expect(e.message).to.include('bad model');
        }
    });
});

describe('AEMClient.updateFragment', () => {
    let original;
    const current = {
        id: 'frag-1',
        title: 'Old',
        etag: 'etag-1',
        fields: [
            { name: 'osi', values: ['old'] },
            { name: 'variant', values: ['plans'] },
        ],
    };
    beforeEach(() => {
        original = globalThis.fetch;
    });
    afterEach(() => {
        globalThis.fetch = original;
    });

    function upClient(applyTagsCalls = []) {
        const c = client();
        c.getFragment = async () => ({ ...current, fields: current.fields.map((f) => ({ ...f })) });
        c.applyValidTags = async (id, tags) => applyTagsCalls.push({ id, tags });
        return c;
    }

    it('merges changed fields, keeps the rest, and sends If-Match with the etag', async () => {
        const calls = stubFetch(() => ok({ id: 'frag-1', title: 'New' }));
        await upClient().updateFragment('frag-1', { osi: 'NEW' }, 'etag-1', 'New');
        const req = calls[0];
        expect(req.url).to.equal('https://aem.example.com/adobe/sites/cf/fragments/frag-1');
        expect(req.opts.method).to.equal('PUT');
        expect(req.opts.headers['If-Match']).to.equal('etag-1');
        const body = JSON.parse(req.opts.body);
        expect(body.title).to.equal('New');
        expect(body.fields.find((f) => f.name === 'osi').values).to.deep.equal(['NEW']);
        expect(body.fields.find((f) => f.name === 'variant').values).to.deep.equal(['plans']);
    });

    it('appends a field that is not already present', async () => {
        const calls = stubFetch(() => ok({ id: 'frag-1' }));
        await upClient().updateFragment('frag-1', { badge: 'HOT' });
        const body = JSON.parse(calls[0].opts.body);
        expect(body.fields.find((f) => f.name === 'badge').values).to.deep.equal(['HOT']);
    });

    it('applies tags only when tags are provided', async () => {
        stubFetch(() => ok({ id: 'frag-1' }));
        const applied = [];
        await upClient(applied).updateFragment('frag-1', {}, 'etag-1', 'T', ['mas:x/y']);
        expect(applied).to.have.lengthOf(1);
        expect(applied[0].tags).to.deep.equal(['mas:x/y']);
    });

    it('throws when the fragment is missing', async () => {
        const c = client();
        c.getFragment = async () => null;
        try {
            await c.updateFragment('missing', { osi: 'x' });
            expect.fail('should reject');
        } catch (e) {
            expect(e.message).to.include('Fragment not found');
        }
    });
});
