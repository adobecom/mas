import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { BULK_PUBLISH_STATUS } from '../../src/constants.js';
import { startPublishing, startReverting } from '../../src/bulk-publish/bulk-publish-store.js';

function makeProject(id = 'proj-1') {
    let status = BULK_PUBLISH_STATUS.PUBLISHING;
    return {
        id,
        get: () => ({ fields: [{ name: 'status', values: [status] }] }),
        refreshFrom: sinon.stub(),
        setStatus(s) {
            status = s;
        },
    };
}

function makeRepo(project) {
    return {
        refreshFragment: sinon.stub().callsFake(async () => {
            project?.setStatus(BULK_PUBLISH_STATUS.PUBLISHED);
        }),
    };
}

function fetchOk(body) {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('startPublishing()', () => {
    let repo;
    let project;
    const token = 'test-token';
    const ioBaseUrl = 'https://io.example';

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        project = makeProject();
        repo = makeRepo(project);
        window.adobeIMS = { getProfile: async () => ({ email: 'user@example.com' }) };
    });

    afterEach(() => {
        delete window.adobeIMS;
        sinon.restore();
    });

    it('calls publishBulk with projectId and publishedBy', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 });
        expect(publishFn.calledOnce).to.equal(true);
        expect(publishFn.firstCall.args[0]).to.include({ projectId: 'proj-1', publishedBy: 'user@example.com' });
    });

    it('calls repository.refreshFragment after successful publish', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 });
        expect(repo.refreshFragment.called).to.equal(true);
        expect(repo.refreshFragment.firstCall.args[0]).to.equal(project);
    });

    it('removes project from publishing map after completion', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 });
        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });

    it('removes project from publishing map even when publishFn throws', async () => {
        const publishFn = sinon.stub().rejects(new Error('publish failed'));
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 }).catch(
            () => {},
        );
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
        fetchStub = sinon.stub(window, 'fetch').resolves(fetchOk({ status: 'Reverted', failures: [], skipped: [] }));
    });

    afterEach(() => sinon.restore());

    it('calls revertAction with projectId', async () => {
        const project = makeProject();
        await startReverting({ project, token, ioBaseUrl, repository: repo });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.include('/bulk-revert');
        expect(JSON.parse(init.body).projectId).to.equal('proj-1');
    });

    it('calls repository.refreshFragment after revert', async () => {
        const project = makeProject();
        await startReverting({ project, token, ioBaseUrl, repository: repo });
        expect(repo.refreshFragment.calledOnce).to.equal(true);
        expect(repo.refreshFragment.firstCall.args[0]).to.equal(project);
    });

    it('returns the IO action result', async () => {
        const expected = { status: 'Reverted', failures: [], skipped: [] };
        fetchStub.resolves(fetchOk(expected));
        const project = makeProject();
        const result = await startReverting({ project, token, ioBaseUrl, repository: repo });
        expect(result).to.deep.equal(expected);
    });
});

describe('startPublishing (async dispatch + poll)', () => {
    let repo, project;
    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        let status = BULK_PUBLISH_STATUS.PUBLISHING;
        project = {
            id: 'p1',
            get: () => ({ fields: [{ name: 'status', values: [status] }] }),
            refreshFrom: sinon.stub(),
        };
        repo = {
            refreshFragment: sinon.stub().callsFake(async () => {
                status = BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED;
            }),
        };
        window.adobeIMS = { getProfile: async () => ({ email: 'u@x.com' }) };
    });

    afterEach(() => {
        sinon.restore();
        delete window.adobeIMS;
    });

    it('dispatches then polls refreshFragment until status leaves Publishing', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true, activationId: 'a1' });
        await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 5,
        });
        expect(publishFn.calledOnce).to.equal(true);
        expect(publishFn.firstCall.args[0]).to.include({ projectId: 'p1', publishedBy: 'u@x.com' });
        expect(repo.refreshFragment.called).to.equal(true);
    });

    it('keeps polling while status is still Draft after dispatch', async () => {
        let calls = 0;
        let status = BULK_PUBLISH_STATUS.DRAFT;
        project = {
            id: 'p1',
            get: () => ({ fields: [{ name: 'status', values: [status] }] }),
            refreshFrom: sinon.stub(),
        };
        repo = {
            refreshFragment: sinon.stub().callsFake(async () => {
                calls += 1;
                if (calls === 2) status = BULK_PUBLISH_STATUS.PUBLISHING;
                if (calls === 4) status = BULK_PUBLISH_STATUS.PUBLISHED;
            }),
        };
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 10,
        });
        expect(repo.refreshFragment.callCount).to.equal(4);
        expect(status).to.equal(BULK_PUBLISH_STATUS.PUBLISHED);
    });

    it('stops polling on a Failed terminal status', async () => {
        let calls = 0;
        let status = BULK_PUBLISH_STATUS.DRAFT;
        project = {
            id: 'p1',
            get: () => ({ fields: [{ name: 'status', values: [status] }] }),
            refreshFrom: sinon.stub(),
        };
        repo = {
            refreshFragment: sinon.stub().callsFake(async () => {
                calls += 1;
                if (calls === 3) status = BULK_PUBLISH_STATUS.FAILED;
            }),
        };
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 10,
        });
        expect(repo.refreshFragment.callCount).to.equal(3);
    });

    it('clears the publishing flag after completion', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 5,
        });
        expect(Store.bulkPublishProjects.publishing.get()['p1']).to.be.undefined;
    });

    it('reports timedOut when status never leaves a non-terminal state', async () => {
        const status = BULK_PUBLISH_STATUS.PUBLISHING;
        project = {
            id: 'p1',
            get: () => ({ fields: [{ name: 'status', values: [status] }] }),
            refreshFrom: sinon.stub(),
        };
        repo = { refreshFragment: sinon.stub().resolves() };
        const publishFn = sinon.stub().resolves({ accepted: true });
        const result = await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 3,
        });
        expect(result).to.deep.equal({ timedOut: true });
    });

    it('reports the terminal status when polling completes in time', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        const result = await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 5,
        });
        expect(result).to.deep.equal({ status: BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED });
    });

    it('backs off between polls instead of using a fixed interval', async () => {
        const status = BULK_PUBLISH_STATUS.PUBLISHING;
        project = {
            id: 'p1',
            get: () => ({ fields: [{ name: 'status', values: [status] }] }),
            refreshFrom: sinon.stub(),
        };
        repo = { refreshFragment: sinon.stub().resolves() };
        const delays = [];
        const sleepFn = (ms) => {
            delays.push(ms);
            return Promise.resolve();
        };
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({
            project,
            token: 't',
            ioBaseUrl: 'x',
            repository: repo,
            publishFn,
            pollIntervalMs: 2000,
            maxPolls: 5,
            sleepFn,
        });
        expect(delays.length).to.be.greaterThan(1);
        expect(delays[1]).to.be.greaterThan(delays[0]);
    });
});
