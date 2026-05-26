import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { BULK_PUBLISH_STATUS } from '../../src/constants.js';
import { startPublishing, startReverting } from '../../src/bulk-publish/bulk-publish-store.js';

function makeProject(overrides = {}) {
    const createdAt = new Date().toISOString();
    const fields = {
        snapshots: [JSON.stringify({ fragmentId: 'frag-rev', versionId: 'v-rev', wasPublished: true, createdAt })],
        status: BULK_PUBLISH_STATUS.PUBLISHED,
        title: 'Test Project',
        ...overrides,
    };
    return {
        id: 'proj-1',
        getFieldValue: (k) => fields[k],
        getFieldValues: (k) => fields[k] ?? [],
        setFieldValue: sinon.stub().callsFake((k, v) => {
            fields[k] = v;
        }),
    };
}

function makeRepo() {
    return { saveFragment: sinon.stub().resolves() };
}

function fetchOk(body) {
    return { ok: true, status: 200, json: async () => body };
}

function fetchErr(status = 500, body = {}) {
    return { ok: false, status, statusText: `Error ${status}`, json: async () => body };
}

describe('startPublishing()', () => {
    let fetchStub;
    let repo;
    const token = 'test-token';
    const ioBaseUrl = 'https://io.example';

    const snapshotEntry = JSON.stringify({
        fragmentId: 'frag-id',
        versionId: 'v1',
        wasPublished: true,
        createdAt: new Date().toISOString(),
    });

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        repo = makeRepo();
        fetchStub = sinon.stub(window, 'fetch').resolves(fetchOk({ entries: [snapshotEntry] }));
    });

    afterEach(() => fetchStub.restore());

    it('status sequence: PUBLISHING → PUBLISHED on success', async () => {
        const project = makeProject({ snapshots: [] });
        const publishFn = sinon.stub().resolves({ summary: { total: 1, published: 1 } });

        await startPublishing({ project, paths: ['/p'], locales: [], token, ioBaseUrl, publishFn, repository: repo });

        const statuses = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statuses[0]).to.equal(BULK_PUBLISH_STATUS.PUBLISHING);
        expect(statuses[statuses.length - 1]).to.equal(BULK_PUBLISH_STATUS.PUBLISHED);
    });

    it('status sequence: PUBLISHING → DRAFT when createSnapshotAction fails', async () => {
        fetchStub.resolves(fetchErr(500));
        const project = makeProject({ snapshots: [] });
        const publishFn = sinon.stub().resolves({});

        await startPublishing({ project, paths: ['/p'], locales: [], token, ioBaseUrl, publishFn, repository: repo });

        const statuses = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statuses[statuses.length - 1]).to.equal(BULK_PUBLISH_STATUS.DRAFT);
        expect(publishFn.called).to.equal(false);
    });

    it('status sequence: PUBLISHING → DRAFT when publishFn rejects', async () => {
        const project = makeProject({ snapshots: [] });
        const publishFn = sinon.stub().rejects(new Error('publish failed'));

        await startPublishing({ project, paths: ['/p'], locales: [], token, ioBaseUrl, publishFn, repository: repo }).catch(
            () => {},
        );

        const statuses = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statuses[statuses.length - 1]).to.equal(BULK_PUBLISH_STATUS.DRAFT);
        const errors = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'lastError');
        expect(errors[errors.length - 1].args[1]).to.equal('publish failed');
    });

    it('stores snapshot entries returned by createSnapshotAction in project.snapshots', async () => {
        const project = makeProject({ snapshots: [] });
        const publishFn = sinon.stub().resolves({});

        await startPublishing({ project, paths: ['/p'], locales: [], token, ioBaseUrl, publishFn, repository: repo });

        const snapshotCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'snapshots');
        expect(snapshotCalls.length).to.be.greaterThan(0);
        expect(snapshotCalls[0].args[1]).to.deep.equal([snapshotEntry]);
    });

    it('saveFragment called twice on success (start + end)', async () => {
        const project = makeProject({ snapshots: [] });
        const publishFn = sinon.stub().resolves({});

        await startPublishing({ project, paths: ['/p'], locales: [], token, ioBaseUrl, publishFn, repository: repo });

        expect(repo.saveFragment.callCount).to.equal(2);
    });

    it('removes project from publishing map after successful publish', async () => {
        const project = makeProject({ snapshots: [] });
        const publishFn = sinon.stub().resolves({});

        await startPublishing({ project, paths: ['/p'], locales: [], token, ioBaseUrl, publishFn, repository: repo });

        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });
});

describe('startReverting()', () => {
    let fetchStub;
    let repo;
    const token = 'test-token';
    const ioBaseUrl = 'https://io.example';

    beforeEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        repo = makeRepo();
        fetchStub = sinon.stub(window, 'fetch').resolves(fetchOk({ failures: [], skipped: [] }));
    });

    afterEach(() => fetchStub.restore());

    it('status sequence: REVERTING → REVERTED on success', async () => {
        const project = makeProject();

        await startReverting({ project, token, ioBaseUrl, repository: repo });

        const statuses = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statuses[0]).to.equal(BULK_PUBLISH_STATUS.REVERTING);
        expect(statuses[statuses.length - 1]).to.equal(BULK_PUBLISH_STATUS.REVERTED);
    });

    it('status PUBLISHED with REVERT-prefixed lastError when failures returned', async () => {
        fetchStub.resolves(fetchOk({ failures: [{ path: '/p', error: 'restore failed' }], skipped: [] }));
        const project = makeProject();

        await startReverting({ project, token, ioBaseUrl, repository: repo });

        const statuses = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statuses[statuses.length - 1]).to.equal(BULK_PUBLISH_STATUS.PUBLISHED);
        const errors = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'lastError');
        expect(errors[errors.length - 1].args[1]).to.include('REVERT:\n');
        expect(errors[errors.length - 1].args[1]).to.include('/p: restore failed');
    });

    it('status PUBLISHED with error when snapshot is empty (no fetch call)', async () => {
        const project = makeProject({ snapshots: [] });

        await startReverting({ project, token, ioBaseUrl, repository: repo });

        const statuses = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statuses[statuses.length - 1]).to.equal(BULK_PUBLISH_STATUS.PUBLISHED);
        const errors = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'lastError');
        expect(errors[errors.length - 1].args[1]).to.include('REVERT:\n');
        expect(fetchStub.called).to.equal(false);
    });

    it('removes skipped fragment entries from project.snapshots', async () => {
        const createdAt = new Date().toISOString();
        const project = makeProject({
            snapshots: [
                JSON.stringify({ fragmentId: 'frag-keep', versionId: 'v1', wasPublished: true, createdAt }),
                JSON.stringify({ fragmentId: 'frag-deleted', versionId: 'v2', wasPublished: false, createdAt }),
            ],
        });
        fetchStub.resolves(fetchOk({ failures: [], skipped: ['frag-deleted'] }));

        await startReverting({ project, token, ioBaseUrl, repository: repo });

        const snapshotCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'snapshots');
        expect(snapshotCalls.length).to.equal(1);
        const remaining = snapshotCalls[0].args[1];
        expect(remaining).to.have.length(1);
        expect(JSON.parse(remaining[0]).fragmentId).to.equal('frag-keep');
    });

    it('does not modify project.snapshots when no fragments are skipped', async () => {
        const project = makeProject();

        await startReverting({ project, token, ioBaseUrl, repository: repo });

        const snapshotCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'snapshots');
        expect(snapshotCalls.length).to.equal(0);
    });

    it('saveFragment called at least twice (start + end)', async () => {
        const project = makeProject();

        await startReverting({ project, token, ioBaseUrl, repository: repo });

        expect(repo.saveFragment.callCount).to.be.greaterThanOrEqual(2);
    });
});
