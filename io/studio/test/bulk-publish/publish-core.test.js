const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/publish-core.js — publishResolved', () => {
    let core;
    let publishChunkStub;
    const logger = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };

    beforeEach(() => {
        publishChunkStub = sinon.stub();
        core = proxyquire('../../src/bulk-publish/publish-core.js', {
            './publisher.js': { publishChunk: publishChunkStub },
        });
    });

    afterEach(() => sinon.restore());

    it('groups paths by locale, chunks, publishes, and returns flat details', async () => {
        publishChunkStub.callsFake(async ({ chunk }) => chunk.map((path) => ({ path, status: 'published' })));

        const resolved = ['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/es_MX/a'];
        const details = await core.publishResolved(resolved, 'https://odin', 'token', logger);

        expect(details).to.have.length(2);
        expect(details.every((d) => d.status === 'published')).to.be.true;
        expect(publishChunkStub.callCount).to.equal(2);
    });
});

describe('bulk-publish/publish-core.js — publishDictionaryIndexes', () => {
    let core;
    let publishChunkStub;
    let fetchFragmentByPathStub;
    const logger = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };

    beforeEach(() => {
        publishChunkStub = sinon.stub();
        publishChunkStub.callsFake(async ({ chunk }) => chunk.map((path) => ({ path, status: 'published' })));
        fetchFragmentByPathStub = sinon.stub().resolves({ fragment: null, status: 404 });
        core = proxyquire('../../src/bulk-publish/publish-core.js', {
            './publisher.js': { publishChunk: publishChunkStub },
            '../common.js': {
                fetchFragmentByPath: fetchFragmentByPathStub,
                processBatchWithConcurrency: (items, batchSize, processor) => Promise.all(items.map(processor)),
            },
        });
    });

    afterEach(() => sinon.restore());

    it('publishes one index per dictionary locale with no reference publishing', async () => {
        const details = [
            { path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' },
            { path: '/content/dam/mas/acom/en_US/dictionary/buy-now', status: 'published' },
            { path: '/content/dam/mas/acom/fr_FR/dictionary/free', status: 'published' },
        ];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        const publishedPaths = results.map((r) => r.path).sort();
        expect(publishedPaths).to.deep.equal([
            '/content/dam/mas/acom/en_US/dictionary/index',
            '/content/dam/mas/acom/fr_FR/dictionary/index',
        ]);
        for (const call of publishChunkStub.getCalls()) {
            expect(call.args[0].filterReferencesByStatus).to.deep.equal([]);
        }
    });

    it('derives no index from failed or non-dictionary details', async () => {
        const details = [
            { path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/en_US/some-card', status: 'published' },
        ];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        expect(results).to.deep.equal([]);
        expect(publishChunkStub).to.not.have.been.called;
    });

    it('does not republish an index already published in the same run', async () => {
        const details = [
            { path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' },
            { path: '/content/dam/mas/acom/en_US/dictionary/index', status: 'published' },
        ];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        expect(results).to.deep.equal([]);
        expect(publishChunkStub).to.not.have.been.called;
    });

    it('skips an index that is already published with no pending changes', async () => {
        fetchFragmentByPathStub.resolves({ fragment: { status: 'PUBLISHED' }, status: 200 });
        const details = [{ path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' }];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        expect(results).to.deep.equal([
            { path: '/content/dam/mas/acom/en_US/dictionary/index', status: 'skipped', reason: 'already-published' },
        ]);
        expect(publishChunkStub).to.not.have.been.called;
    });

    it('publishes an index whose status is MODIFIED', async () => {
        fetchFragmentByPathStub.resolves({ fragment: { status: 'MODIFIED' }, status: 200 });
        const details = [{ path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' }];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        expect(results).to.deep.equal([{ path: '/content/dam/mas/acom/en_US/dictionary/index', status: 'published' }]);
    });

    it('publishes when the index status cannot be determined', async () => {
        fetchFragmentByPathStub.resolves({ fragment: null, status: 404 });
        const details = [{ path: '/content/dam/mas/acom/fr_FR/dictionary/free', status: 'published' }];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        expect(results).to.deep.equal([{ path: '/content/dam/mas/acom/fr_FR/dictionary/index', status: 'published' }]);
    });

    it('skips published indexes while publishing the rest', async () => {
        fetchFragmentByPathStub.callsFake(async (endpoint, path) => {
            if (path.includes('/en_US/')) return { fragment: { status: 'PUBLISHED' }, status: 200 };
            return { fragment: { status: 'MODIFIED' }, status: 200 };
        });
        const details = [
            { path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' },
            { path: '/content/dam/mas/acom/fr_FR/dictionary/free', status: 'published' },
        ];

        const results = await core.publishDictionaryIndexes(details, 'https://odin', 'token', logger);

        const byStatus = Object.fromEntries(results.map((r) => [r.path, r.status]));
        expect(byStatus).to.deep.equal({
            '/content/dam/mas/acom/en_US/dictionary/index': 'skipped',
            '/content/dam/mas/acom/fr_FR/dictionary/index': 'published',
        });
        expect(publishChunkStub.getCalls().flatMap((c) => c.args[0].chunk)).to.deep.equal([
            '/content/dam/mas/acom/fr_FR/dictionary/index',
        ]);
    });
});
