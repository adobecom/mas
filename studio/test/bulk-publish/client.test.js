import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { publishBulk, revertAction, checkModificationsAction, BulkPublishError } from '../../src/bulk-publish/bulk-publish-client.js';

describe('publishBulk', () => {
    let fetchStub;
    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });
    afterEach(() => fetchStub.restore());

    it('POSTs to the bulk-publish endpoint with projectId and bearer token', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify({ status: 'Published', summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        await publishBulk({ ioBaseUrl: 'https://io.example', projectId: 'proj-1', token: 'abc' });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.equal('https://io.example/bulk-publish');
        expect(init.method).to.equal('POST');
        expect(init.headers.Authorization).to.equal('Bearer abc');
        expect(init.headers['Content-Type']).to.equal('application/json');
        const body = JSON.parse(init.body);
        expect(body.projectId).to.equal('proj-1');
    });

    it('includes publishedBy when provided', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify({ status: 'Published' }), { status: 200, headers: { 'content-type': 'application/json' } }),
        );
        await publishBulk({ ioBaseUrl: 'https://io.example', projectId: 'proj-1', publishedBy: 'user@example.com', token: 'abc' });
        const body = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(body.publishedBy).to.equal('user@example.com');
    });

    it('resolves with the parsed response body on 200', async () => {
        const body = { status: 'Published', summary: { total: 2, published: 2, skipped: 0, failed: 0 }, details: [] };
        fetchStub.resolves(
            new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
        );
        const result = await publishBulk({ ioBaseUrl: 'https://io.example', projectId: 'proj-1', token: 't' });
        expect(result).to.deep.equal(body);
    });

    it('rejects with BulkPublishError on non-2xx response', async () => {
        fetchStub.resolves(new Response(JSON.stringify({ error: 'bad request' }), { status: 400 }));
        try {
            await publishBulk({ ioBaseUrl: 'https://io.example', projectId: 'proj-1', token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(err.status).to.equal(400);
        }
    });

    it('rejects immediately when projectId is missing', async () => {
        try {
            await publishBulk({ ioBaseUrl: 'https://io.example', token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(fetchStub.called).to.equal(false);
        }
    });

    it('rejects when fetch itself throws', async () => {
        fetchStub.rejects(new Error('network'));
        try {
            await publishBulk({ ioBaseUrl: 'https://io.example', projectId: 'proj-1', token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(err.message).to.equal('network');
        }
    });
});

describe('revertAction', () => {
    let fetchStub;
    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });
    afterEach(() => fetchStub.restore());

    it('POSTs to bulk-revert with projectId', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify({ status: 'Reverted', failures: [], skipped: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        await revertAction({ ioBaseUrl: 'https://io.example', projectId: 'proj-1', token: 'tok' });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.equal('https://io.example/bulk-revert');
        expect(JSON.parse(init.body).projectId).to.equal('proj-1');
    });

    it('rejects immediately when projectId is missing', async () => {
        try {
            await revertAction({ ioBaseUrl: 'https://io.example', token: 't' });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(fetchStub.called).to.equal(false);
        }
    });
});

describe('checkModificationsAction', () => {
    let fetchStub;
    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });
    afterEach(() => fetchStub.restore());

    it('POSTs entries to the check-modifications endpoint', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify([{ fragmentId: 'f1', modified: false }]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        const entries = [JSON.stringify({ fragmentId: 'f1', versionId: 'v1', wasPublished: true, createdAt: new Date().toISOString() })];
        await checkModificationsAction({ ioBaseUrl: 'https://io.example', entries, token: 'tok' });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.equal('https://io.example/bulk-check-modifications');
        expect(JSON.parse(init.body).entries).to.deep.equal(entries);
    });
});
