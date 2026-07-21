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
    const logger = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };

    beforeEach(() => {
        publishChunkStub = sinon.stub();
        publishChunkStub.callsFake(async ({ chunk }) => chunk.map((path) => ({ path, status: 'published' })));
        core = proxyquire('../../src/bulk-publish/publish-core.js', {
            './publisher.js': { publishChunk: publishChunkStub },
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
});
