const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('project.js', () => {
    let mod;
    let getFragmentWithEtagStub;
    let putToOdinStub;

    function makeFragment(fields) {
        return { id: 'proj-1', title: 'My Project', description: '', fields };
    }

    beforeEach(() => {
        getFragmentWithEtagStub = sinon.stub();
        putToOdinStub = sinon.stub().resolves({ success: true });

        mod = proxyquire('../../src/bulk-publish/project.js', {
            '../common.js': {
                getFragmentWithEtag: getFragmentWithEtagStub,
                putToOdin: putToOdinStub,
                getValue: require('../../src/common.js').getValue,
                getValues: require('../../src/common.js').getValues,
                parseOdinHttpStatus: require('../../src/common.js').parseOdinHttpStatus,
            },
        });
    });

    afterEach(() => sinon.restore());

    describe('getProjectPaths()', () => {
        it('returns paths from fragments field (new format)', () => {
            const fragment = makeFragment([
                { name: 'fragments', values: ['/content/dam/mas/a/en_US/card1', '/content/dam/mas/a/en_US/card2'] },
            ]);
            expect(mod.getProjectPaths(fragment)).to.deep.equal([
                '/content/dam/mas/a/en_US/card1',
                '/content/dam/mas/a/en_US/card2',
            ]);
        });

        it('falls back to items JSON field when fragments is empty (legacy format)', () => {
            const items = [
                { path: '/content/dam/mas/a/en_US/card1', status: 'valid' },
                { path: '/content/dam/mas/a/en_US/card2', status: 'valid' },
                { path: '/content/dam/mas/a/en_US/card3', status: 'invalid' },
            ];
            const fragment = makeFragment([
                { name: 'fragments', values: [] },
                { name: 'items', values: [JSON.stringify(items)] },
            ]);
            expect(mod.getProjectPaths(fragment)).to.deep.equal([
                '/content/dam/mas/a/en_US/card1',
                '/content/dam/mas/a/en_US/card2',
            ]);
        });

        it('filters out items without a path in legacy format', () => {
            const items = [{ path: '/content/dam/mas/a/en_US/card1', status: 'valid' }, { status: 'valid' }];
            const fragment = makeFragment([{ name: 'items', values: [JSON.stringify(items)] }]);
            expect(mod.getProjectPaths(fragment)).to.deep.equal(['/content/dam/mas/a/en_US/card1']);
        });

        it('returns empty array when both fragments and items are absent', () => {
            const fragment = makeFragment([{ name: 'title', values: ['Test'] }]);
            expect(mod.getProjectPaths(fragment)).to.deep.equal([]);
        });

        it('returns empty array when items JSON is malformed', () => {
            const fragment = makeFragment([{ name: 'items', values: ['not valid json'] }]);
            expect(mod.getProjectPaths(fragment)).to.deep.equal([]);
        });
    });

    describe('getProjectLocales()', () => {
        it('returns values from locales field', () => {
            const fragment = makeFragment([{ name: 'locales', values: ['fr_FR', 'de_DE'] }]);
            expect(mod.getProjectLocales(fragment)).to.deep.equal(['fr_FR', 'de_DE']);
        });

        it('returns empty array when locales field is absent', () => {
            const fragment = makeFragment([]);
            expect(mod.getProjectLocales(fragment)).to.deep.equal([]);
        });
    });

    describe('getProjectTitle()', () => {
        it('returns the title field value', () => {
            const fragment = makeFragment([{ name: 'title', values: ['My Campaign'] }]);
            expect(mod.getProjectTitle(fragment)).to.equal('My Campaign');
        });

        it('returns empty string when title field is absent', () => {
            const fragment = makeFragment([]);
            expect(mod.getProjectTitle(fragment)).to.equal('');
        });
    });

    describe('getProjectSnapshots()', () => {
        it('returns serialized snapshot entries from snapshots field', () => {
            const entry = JSON.stringify({
                fragmentId: 'f1',
                versionId: 'v1',
                wasPublished: true,
                createdAt: '2025-01-01T00:00:00.000Z',
            });
            const fragment = makeFragment([{ name: 'snapshots', values: [entry] }]);
            expect(mod.getProjectSnapshots(fragment)).to.deep.equal([entry]);
        });

        it('returns empty array when snapshots field is absent', () => {
            const fragment = makeFragment([]);
            expect(mod.getProjectSnapshots(fragment)).to.deep.equal([]);
        });
    });

    describe('updateProjectFragment()', () => {
        it('reads fragment, merges field updates, and calls putToOdin', async () => {
            const fragment = makeFragment([
                { name: 'status', type: 'text', values: ['Draft'] },
                { name: 'lastError', type: 'text', values: [''] },
            ]);
            getFragmentWithEtagStub.resolves({ fragment, etag: '"etag-1"' });

            await mod.updateProjectFragment('https://odin.example', 'proj-1', 'token', {
                status: 'Publishing',
                lastError: '',
            });

            expect(putToOdinStub.calledOnce).to.be.true;
            const [, id, , payload] = putToOdinStub.firstCall.args;
            expect(id).to.equal('proj-1');
            const statusField = payload.fields.find((f) => f.name === 'status');
            expect(statusField.values).to.deep.equal(['Publishing']);
            expect(payload.etag).to.equal('"etag-1"');
        });

        it('adds new fields not present in the original fragment', async () => {
            const fragment = makeFragment([{ name: 'status', type: 'text', values: ['Draft'] }]);
            getFragmentWithEtagStub.resolves({ fragment, etag: '"e"' });

            await mod.updateProjectFragment('https://odin.example', 'proj-1', 'token', {
                snapshots: ['entry1', 'entry2'],
                publishedAt: '2025-01-01T00:00:00.000Z',
            });

            const { fields } = putToOdinStub.firstCall.args[3];
            const snapshotsField = fields.find((f) => f.name === 'snapshots');
            expect(snapshotsField.values).to.deep.equal(['entry1', 'entry2']);
            const publishedAtField = fields.find((f) => f.name === 'publishedAt');
            expect(publishedAtField.values).to.deep.equal(['2025-01-01T00:00:00.000Z']);
        });

        it('retries on 412 with fresh ETag and succeeds', async () => {
            const fragment = makeFragment([{ name: 'status', type: 'text', values: ['Draft'] }]);
            getFragmentWithEtagStub.resolves({ fragment, etag: '"etag-fresh"' });
            const err412 = new Error('PUT /fragments/proj-1 failed with status 412: Precondition Failed');
            err412.status = 412;
            putToOdinStub.onFirstCall().rejects(err412);
            putToOdinStub.onSecondCall().resolves({ success: true });

            await mod.updateProjectFragment('https://odin.example', 'proj-1', 'token', { status: 'Published' });

            expect(putToOdinStub.calledTwice).to.be.true;
            expect(getFragmentWithEtagStub.calledTwice).to.be.true;
        });

        it('retries on 412 when error has no .status property but message contains the status code', async () => {
            const fragment = makeFragment([{ name: 'status', type: 'text', values: ['Draft'] }]);
            getFragmentWithEtagStub.resolves({ fragment, etag: '"etag-fresh"' });
            const err412 = new Error('PUT /fragments/proj-1 failed with status 412: Precondition Failed');
            // No .status property — matches what fetchOdin actually throws
            putToOdinStub.onFirstCall().rejects(err412);
            putToOdinStub.onSecondCall().resolves({ success: true });

            await mod.updateProjectFragment('https://odin.example', 'proj-1', 'token', { status: 'Published' });

            expect(putToOdinStub.calledTwice).to.be.true;
            expect(getFragmentWithEtagStub.calledTwice).to.be.true;
        });

        it('throws immediately on non-412/500 errors without retry', async () => {
            const fragment = makeFragment([{ name: 'status', type: 'text', values: ['Draft'] }]);
            getFragmentWithEtagStub.resolves({ fragment, etag: '"e"' });
            const err400 = new Error('PUT /fragments/proj-1 failed with status 400: Bad Request');
            err400.status = 400;
            putToOdinStub.rejects(err400);

            let threw = false;
            try {
                await mod.updateProjectFragment('https://odin.example', 'proj-1', 'token', { status: 'Published' });
            } catch (err) {
                threw = true;
                expect(err.message).to.include('400');
            }
            expect(threw).to.be.true;
            expect(putToOdinStub.calledOnce).to.be.true;
        });
    });
});
