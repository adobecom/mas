import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { publishBulk, BulkPublishError } from '../../src/bulk-publish/bulk-publish-client.js';

describe('publishBulk', () => {
    let fetchStub;
    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });
    afterEach(() => fetchStub.restore());

    it('POSTs to the bulk-publish endpoint with bearer token and body', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify({ summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        await publishBulk({
            ioBaseUrl: 'https://io.example',
            paths: ['/content/dam/mas/a/en_US/card'],
            locales: ['fr_FR'],
            token: 'abc',
        });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.equal('https://io.example/bulk-publish');
        expect(init.method).to.equal('POST');
        expect(init.headers.Authorization).to.equal('Bearer abc');
        expect(init.headers['Content-Type']).to.equal('application/json');
        expect(JSON.parse(init.body)).to.deep.equal({
            paths: ['/content/dam/mas/a/en_US/card'],
            locales: ['fr_FR'],
        });
    });

    it('resolves with the parsed response body on 200', async () => {
        const body = {
            summary: { total: 2, published: 2, skipped: 0, failed: 0 },
            details: [{ path: '/a', status: 'published' }],
        };
        fetchStub.resolves(
            new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
        );
        const result = await publishBulk({ ioBaseUrl: 'https://io.example', paths: ['/a'], token: 't' });
        expect(result).to.deep.equal(body);
    });

    it('rejects with BulkPublishError on non-2xx response', async () => {
        fetchStub.resolves(new Response(JSON.stringify({ error: 'bad path' }), { status: 400 }));
        try {
            await publishBulk({ ioBaseUrl: 'https://io.example', paths: ['/bad'], token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(err.status).to.equal(400);
            expect(err.message).to.include('bad path');
        }
    });

    it('rejects when fetch itself throws', async () => {
        fetchStub.rejects(new Error('network'));
        try {
            await publishBulk({ ioBaseUrl: 'https://io.example', paths: ['/a'], token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(err.message).to.equal('network');
        }
    });

    it('rejects immediately when paths is empty', async () => {
        try {
            await publishBulk({ ioBaseUrl: 'https://io.example', paths: [], token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(fetchStub.called).to.equal(false);
        }
    });
});
