import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { startPublishing, startReverting } from '../../src/bulk-publish/bulk-publish-store.js';

function makeProject(id = 'proj-1') {
    return { id };
}

function makeRepo() {
    return { refreshFragment: sinon.stub().resolves() };
}

function fetchOk(body) {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

function fetchErr(status = 500) {
    return new Response(JSON.stringify({ error: `Error ${status}` }), { status });
}

describe('startPublishing()', () => {
    let fetchStub;
    let repo;
    const token = 'test-token';
    const ioBaseUrl = 'https://io.example';

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        repo = makeRepo();
        fetchStub = sinon.stub(window, 'fetch').resolves(
            fetchOk({ status: 'Published', summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] }),
        );
        sinon.stub(window, 'adobeIMS').value({ getProfile: async () => ({ email: 'user@example.com' }) });
    });

    afterEach(() => sinon.restore());

    it('calls publishBulk with projectId and publishedBy', async () => {
        const project = makeProject();
        await startPublishing({ project, token, ioBaseUrl, repository: repo });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.include('/bulk-publish');
        const body = JSON.parse(init.body);
        expect(body.projectId).to.equal('proj-1');
        expect(body.publishedBy).to.equal('user@example.com');
    });

    it('calls repository.refreshFragment after successful publish', async () => {
        const project = makeProject();
        await startPublishing({ project, token, ioBaseUrl, repository: repo });
        expect(repo.refreshFragment.calledOnce).to.equal(true);
        expect(repo.refreshFragment.firstCall.args[0]).to.equal(project);
    });

    it('removes project from publishing map after completion', async () => {
        const project = makeProject();
        await startPublishing({ project, token, ioBaseUrl, repository: repo });
        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });

    it('removes project from publishing map even when publishBulk throws', async () => {
        fetchStub.resolves(fetchErr(500));
        const project = makeProject();
        await startPublishing({ project, token, ioBaseUrl, repository: repo }).catch(() => {});
        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });

    it('returns the IO action result', async () => {
        const expected = { status: 'Published', summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] };
        fetchStub.resolves(fetchOk(expected));
        const project = makeProject();
        const result = await startPublishing({ project, token, ioBaseUrl, repository: repo });
        expect(result).to.deep.equal(expected);
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
        fetchStub = sinon.stub(window, 'fetch').resolves(
            fetchOk({ status: 'Reverted', failures: [], skipped: [] }),
        );
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
