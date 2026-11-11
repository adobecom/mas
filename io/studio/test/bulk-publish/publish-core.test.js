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

    it('logs per-locale chunk events when publishing indexes', async () => {
        const localLogger = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };
        const details = [{ path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' }];

        await core.publishDictionaryIndexes(details, 'https://odin', 'token', localLogger);

        const events = localLogger.info.getCalls().map((call) => JSON.parse(call.args[0]));
        expect(events.some((e) => e.event === 'chunk-start' && e.locale === 'en_US')).to.be.true;
        expect(events.some((e) => e.event === 'chunk-result' && e.locale === 'en_US')).to.be.true;
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

describe('bulk-publish/publish-core.js — clearStagedTagsAfterPublish', () => {
    const STAGED = 'mas:studio/internal/staged';
    const CARD = '/content/dam/mas/acom/en_US/card';
    const FR_CARD = '/content/dam/mas/acom/fr_FR/card';
    const logger = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };
    let core;
    let stubs;

    beforeEach(() => {
        stubs = {
            fetchFragmentByPath: sinon.stub(),
            patchToOdin: sinon.stub().resolves({ success: true }),
            fetchOdin: sinon.stub().resolves({ headers: { get: () => 'tag-etag' } }),
        };
        core = proxyquire('../../src/bulk-publish/publish-core.js', {
            '../common.js': {
                ...stubs,
                getValues: (fragment, name) => {
                    const index = fragment.fields.findIndex((f) => f.name === name);
                    return index === -1 ? null : { values: fragment.fields[index].values, path: `/fields/${index}` };
                },
                processBatchWithConcurrency: (items, batchSize, processor) => Promise.all(items.map(processor)),
            },
        });
    });

    afterEach(() => sinon.restore());

    const card = (tags) => ({
        id: 'id-1',
        etag: 'e1',
        fields: [
            { name: 'x', values: [] },
            { name: 'tags', values: tags },
        ],
    });
    const collection = (tags) => ({
        id: 'col-1',
        model: { path: '/conf/mas/settings/dam/cfm/models/collection' },
        tags,
        fields: [],
    });

    it('clears the staged tag from a published card and keeps the other tags in order', async () => {
        stubs.fetchFragmentByPath.resolves({ fragment: card(['mas:a', STAGED, 'mas:b']), status: 200 });

        const failures = await core.clearStagedTagsAfterPublish(
            [{ path: CARD, status: 'published' }],
            'https://odin',
            't',
            logger,
        );

        expect(failures).to.deep.equal([]);
        expect(stubs.patchToOdin).to.have.been.calledOnceWith(
            'https://odin',
            'id-1',
            't',
            [{ op: 'replace', path: '/fields/1/values', value: ['mas:a', 'mas:b'] }],
            'e1',
        );
    });

    it('clears the staged tag from a published collection', async () => {
        stubs.fetchFragmentByPath.resolves({ fragment: collection([{ id: STAGED }, { id: 'mas:a' }]), status: 200 });

        await core.clearStagedTagsAfterPublish([{ path: CARD, status: 'published' }], 'https://odin', 't', logger);

        const put = stubs.fetchOdin.getCalls().find((c) => c.args[3]?.method === 'PUT');
        expect(put.args[1]).to.equal('/adobe/sites/cf/fragments/col-1/tags');
        expect(JSON.parse(put.args[3].body)).to.deep.equal({ tags: ['mas:a'] });
        expect(put.args[3].etag).to.equal('tag-etag');
    });

    it('deletes the collection tags when the staged tag was the only one', async () => {
        stubs.fetchFragmentByPath.resolves({ fragment: collection([{ id: STAGED }]), status: 200 });

        await core.clearStagedTagsAfterPublish([{ path: CARD, status: 'published' }], 'https://odin', 't', logger);

        expect(stubs.fetchOdin.getCalls().some((c) => c.args[3]?.method === 'DELETE')).to.be.true;
    });

    it('does not save fragments without the staged tag', async () => {
        stubs.fetchFragmentByPath.resolves({ fragment: card(['mas:a']), status: 200 });

        await core.clearStagedTagsAfterPublish([{ path: CARD, status: 'published' }], 'https://odin', 't', logger);

        expect(stubs.patchToOdin).to.not.have.been.called;
        expect(stubs.fetchOdin).to.not.have.been.called;
    });

    it('clears locale copies and variations, but skips failed details and dictionary paths', async () => {
        stubs.fetchFragmentByPath.callsFake(async () => ({ fragment: card([STAGED]), status: 200 }));
        const variation = '/content/dam/mas/acom/en_US/pzn/card-pzn';
        const details = [
            { path: CARD, status: 'published' },
            { path: FR_CARD, status: 'published' },
            { path: variation, status: 'published' },
            { path: '/content/dam/mas/acom/en_US/failed', status: 'failed' },
            { path: '/content/dam/mas/acom/en_US/dictionary/free', status: 'published' },
        ];

        await core.clearStagedTagsAfterPublish(details, 'https://odin', 't', logger);

        expect(stubs.fetchFragmentByPath.getCalls().map((c) => c.args[1])).to.deep.equal([CARD, FR_CARD, variation]);
        expect(stubs.patchToOdin).to.have.been.calledThrice;
    });

    it('reports failures without throwing', async () => {
        stubs.fetchFragmentByPath.onFirstCall().resolves({ fragment: null, status: 404 });
        stubs.fetchFragmentByPath.onSecondCall().resolves({ fragment: card([STAGED]), status: 200 });
        stubs.patchToOdin.resolves({ success: false, error: 'boom' });
        const details = [
            { path: CARD, status: 'published' },
            { path: FR_CARD, status: 'published' },
        ];

        const failures = await core.clearStagedTagsAfterPublish(details, 'https://odin', 't', logger);

        expect(failures).to.deep.equal([
            { path: CARD, reason: 'staged-clear-failed', error: 'fetch 404' },
            { path: FR_CARD, reason: 'staged-clear-failed', error: 'boom' },
        ]);
    });
});
