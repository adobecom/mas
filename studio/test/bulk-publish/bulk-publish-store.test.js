import { expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { BULK_PUBLISH_STATUS, PAGE_NAMES } from '../../src/constants.js';
import { startPublishing, startReverting, saveSnapshot, resetToDraft } from '../../src/bulk-publish/bulk-publish-store.js';

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
    let previousPage;

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        previousPage = Store.page.get();
        Store.page.set(PAGE_NAMES.PROMOTIONS);
        project = makeProject();
        repo = makeRepo(project);
        window.adobeIMS = { getProfile: async () => ({ email: 'user@example.com' }) };
    });

    afterEach(() => {
        delete window.adobeIMS;
        sinon.restore();
        Store.page.set(previousPage);
    });

    it('calls publishBulk with projectId and publishedBy', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 });
        expect(publishFn.calledOnce).to.equal(true);
        expect(publishFn.firstCall.args[0]).to.include({ projectId: 'proj-1', publishedBy: 'user@example.com' });
    });

    it('forwards includeVariations and includeCards to publishFn', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 5,
            includeVariations: true,
            includeCards: true,
        });
        expect(publishFn.firstCall.args[0]).to.include({ includeVariations: true, includeCards: true });
    });

    for (const publishReferences of [false, true, undefined]) {
        it(`preserves the reference publication policy when publishReferences is ${publishReferences}`, async () => {
            const publishFn = sinon.stub().resolves({ accepted: true });

            await startPublishing({
                project,
                token,
                ioBaseUrl,
                repository: repo,
                publishFn,
                pollIntervalMs: 1,
                maxPolls: 5,
                publishReferences,
            });

            expect(publishFn.firstCall.args[0].publishReferences).to.equal(publishReferences ?? true);
        });
    }

    it('calls repository.refreshFragment after successful publish', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 });
        expect(repo.refreshFragment.called).to.equal(true);
        expect(repo.refreshFragment.firstCall.args[0]).to.equal(project);
    });

    it('calls refreshFragment with skipPromoMerge:true and skipReferences:true during polling', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 });
        expect(repo.refreshFragment.firstCall.args[1]).to.deep.equal({ skipPromoMerge: true, skipReferences: true });
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

    it('returns alreadyPublishing when project is already in the publishing map', async () => {
        Store.bulkPublishProjects.publishing.set({ [project.id]: true });
        const publishFn = sinon.stub().resolves({ accepted: true });
        const result = await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn,
            pollIntervalMs: 1,
            maxPolls: 5,
        });
        expect(result).to.deep.equal({ alreadyPublishing: true });
        expect(publishFn.called).to.equal(false);
    });

    it('prevents double-dispatch when two calls start synchronously', async () => {
        const publishFn = sinon.stub().resolves({ accepted: true });
        const opts = { project, token, ioBaseUrl, repository: repo, publishFn, pollIntervalMs: 1, maxPolls: 5 };
        const [r1, r2] = await Promise.all([startPublishing(opts), startPublishing(opts)]);
        expect(publishFn.callCount).to.equal(1);
        expect([r1, r2].some((r) => r?.alreadyPublishing === true)).to.equal(true);
    });

    it('returns acceptance before terminal while retaining the shared project guard', async () => {
        let finish;
        const terminal = new Promise((resolve) => {
            finish = resolve;
        });
        repo.refreshFragment.callsFake(async () => {
            await terminal;
            project.setStatus(BULK_PUBLISH_STATUS.PUBLISHED);
        });
        const publishFn = sinon.stub().resolves({ accepted: true, activationId: 'activation-1' });
        const pending = startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn,
            waitForCompletion: false,
        });
        const result = await Promise.race([
            pending,
            new Promise((resolve) => setTimeout(() => resolve({ waiting: true }), 50)),
        ]);
        const guarded = Store.bulkPublishProjects.publishing.get()[project.id];
        const duplicate = await startPublishing({
            project: makeProject(project.id),
            token,
            ioBaseUrl,
            repository: repo,
            publishFn,
        });
        finish();
        await pending;
        await waitUntil(() => !Store.bulkPublishProjects.publishing.get()[project.id]);
        expect(result).to.deep.equal({ accepted: true, activationId: 'activation-1' });
        expect(guarded).to.equal(true);
        expect(duplicate).to.deep.equal({ alreadyPublishing: true });
        expect(publishFn.callCount).to.equal(1);
    });

    it('preserves the default terminal outcome', async () => {
        const outcome = await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn: sinon.stub().resolves({ accepted: true }),
        });
        expect(outcome).to.deep.equal({ status: BULK_PUBLISH_STATUS.PUBLISHED });
    });

    it('does not start a monitor for an unconfirmed acceptance response', async () => {
        let error;
        try {
            await startPublishing({
                project,
                token,
                ioBaseUrl,
                repository: repo,
                publishFn: sinon.stub().resolves({}),
                waitForCompletion: false,
            });
        } catch (cause) {
            error = cause;
        }
        expect(error.message).to.include('could not be confirmed');
        expect(repo.refreshFragment.called).to.be.false;
        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });

    it('reports background tracking failures without losing the accepted dispatch result', async () => {
        const failure = new Error('Project state unavailable');
        sinon.stub(project, 'get').throws(failure);
        const toast = sinon.stub(Events.toast, 'emit');
        const errorLog = sinon.stub(console, 'error');

        const result = await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn: sinon.stub().resolves({ accepted: true, activationId: 'accepted-activation' }),
            waitForCompletion: false,
        });
        await waitUntil(() => toast.calledOnce);

        expect(result).to.deep.equal({ accepted: true, activationId: 'accepted-activation' });
        expect(
            toast.calledWith({
                variant: 'negative',
                content: 'Could not track Bulk Publish proj-1. Check the project.',
            }),
        ).to.be.true;
        expect(errorLog.calledOnceWith('Failed to track Bulk Publish proj-1', failure)).to.be.true;
        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });

    for (const leaveDuringDispatch of [false, true]) {
        it(`suppresses timeout notifications after leaving ${leaveDuringDispatch ? 'during dispatch' : 'while tracking'} without removing the global guard early`, async () => {
            let release;
            const pause = new Promise((resolve) => {
                release = resolve;
            });
            const toast = sinon.stub(Events.toast, 'emit');
            repo.refreshFragment.resolves();
            const sleepFn = sinon.stub().returns(pause);
            const publishFn = sinon.stub().callsFake(async () => {
                if (leaveDuringDispatch) Store.page.set(PAGE_NAMES.PLACEHOLDERS);
                return { accepted: true };
            });
            await startPublishing({
                project,
                token,
                ioBaseUrl,
                repository: repo,
                publishFn,
                waitForCompletion: false,
                sleepFn,
                maxPolls: 1,
            });
            await waitUntil(() => sleepFn.calledOnce);
            if (!leaveDuringDispatch) Store.page.set(PAGE_NAMES.PLACEHOLDERS);
            expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.equal(true);
            const duplicate = await startPublishing({ project, token, ioBaseUrl, repository: repo, publishFn });
            expect(duplicate.alreadyPublishing).to.be.true;
            release();
            await waitUntil(() => !Store.bulkPublishProjects.publishing.get()[project.id]);
            await Promise.resolve();
            expect(toast.called).to.be.false;
        });
    }

    it('does not restore old notifications when the user returns to the origin page', async () => {
        let release;
        const pause = new Promise((resolve) => {
            release = resolve;
        });
        const toast = sinon.stub(Events.toast, 'emit');
        repo.refreshFragment.resolves();
        const sleepFn = sinon.stub().returns(pause);
        await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn: sinon.stub().resolves({ accepted: true }),
            waitForCompletion: false,
            sleepFn,
            maxPolls: 1,
        });
        await waitUntil(() => sleepFn.calledOnce);
        Store.page.set(PAGE_NAMES.PLACEHOLDERS);
        Store.page.set(PAGE_NAMES.PROMOTIONS);
        release();
        await waitUntil(() => !Store.bulkPublishProjects.publishing.get()[project.id]);
        await Promise.resolve();
        expect(toast.called).to.be.false;
    });

    it('releases route observers after the monitor finishes', async () => {
        const subscribe = sinon.spy(Store.page, 'subscribe');
        const unsubscribe = sinon.spy(Store.page, 'unsubscribe');
        await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn: sinon.stub().resolves({ accepted: true }),
            waitForCompletion: false,
        });
        await waitUntil(() => !Store.bulkPublishProjects.publishing.get()[project.id]);
        expect(subscribe.callCount).to.equal(1);
        expect(unsubscribe.calledWith(subscribe.firstCall.args[0])).to.be.true;
    });

    it('keeps timeout notifications on the origin page and releases all observers', async () => {
        repo.refreshFragment.resolves();
        const toast = sinon.stub(Events.toast, 'emit');
        const subscribe = sinon.spy(Store.promotions.promotionId, 'subscribe');
        const unsubscribe = sinon.spy(Store.promotions.promotionId, 'unsubscribe');
        await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn: sinon.stub().resolves({ accepted: true }),
            waitForCompletion: false,
            sleepFn: async () => {},
            maxPolls: 1,
        });
        await waitUntil(() => toast.calledOnce);
        expect(toast.firstCall.args[0].variant).to.equal('warning');
        expect(unsubscribe.calledWith(subscribe.firstCall.args[0])).to.be.true;
    });

    it('logs tracking errors after departure without showing a toast on another page', async () => {
        let release;
        const pending = new Promise((resolve) => {
            release = resolve;
        });
        repo.refreshFragment.callsFake(() => pending);
        const toast = sinon.stub(Events.toast, 'emit');
        const log = sinon.stub(console, 'error');
        sinon.stub(project, 'get').throws(new Error('Cannot read status'));
        await startPublishing({
            project,
            token,
            ioBaseUrl,
            repository: repo,
            publishFn: sinon.stub().resolves({ accepted: true }),
            waitForCompletion: false,
        });
        Store.page.set(PAGE_NAMES.PLACEHOLDERS);
        release();
        await waitUntil(() => log.calledOnce);
        expect(toast.called).to.be.false;
        expect(Store.bulkPublishProjects.publishing.get()[project.id]).to.be.undefined;
    });

    it('releases route observers when dispatch fails without starting a monitor', async () => {
        const subscribe = sinon.spy(Store.page, 'subscribe');
        const unsubscribe = sinon.spy(Store.page, 'unsubscribe');
        let failure;
        try {
            await startPublishing({
                project,
                token,
                ioBaseUrl,
                repository: repo,
                publishFn: sinon.stub().rejects(new Error('Dispatch failure')),
                waitForCompletion: false,
            });
        } catch (error) {
            failure = error;
        }
        expect(failure?.message).to.equal('Dispatch failure');
        expect(unsubscribe.calledWith(subscribe.firstCall.args[0])).to.be.true;
    });

    it('invalidates every parallel monitor without skipping other route subscribers', async () => {
        let release;
        const pause = new Promise((resolve) => {
            release = resolve;
        });
        const sleepFn = sinon.stub().returns(pause);
        const toast = sinon.stub(Events.toast, 'emit');
        repo.refreshFragment.resolves();
        for (const currentProject of [project, makeProject('proj-2')]) {
            await startPublishing({
                project: currentProject,
                token,
                ioBaseUrl,
                repository: repo,
                publishFn: sinon.stub().resolves({ accepted: true }),
                waitForCompletion: false,
                sleepFn,
                maxPolls: 1,
            });
        }
        await waitUntil(() => sleepFn.callCount === 2);
        const routeObserver = sinon.spy();
        Store.page.subscribe(routeObserver);
        try {
            Store.page.set(PAGE_NAMES.PLACEHOLDERS);
            expect(routeObserver.callCount).to.equal(2);
            release();
            await waitUntil(() => Object.keys(Store.bulkPublishProjects.publishing.get()).length === 0);
            await Promise.resolve();
            expect(toast.called).to.be.false;
        } finally {
            Store.page.unsubscribe(routeObserver);
        }
    });

    for (const store of [Store.promotions.promotionId, Store.bulkPublishProjects.projectId]) {
        it(`suppresses notifications after a ${store === Store.promotions.promotionId ? 'promotion' : 'bulk project'} change on the same page`, async () => {
            const previous = store.get();
            let release;
            const pause = new Promise((resolve) => {
                release = resolve;
            });
            const sleepFn = sinon.stub().returns(pause);
            repo.refreshFragment.resolves();
            const toast = sinon.stub(Events.toast, 'emit');
            try {
                await startPublishing({
                    project,
                    token,
                    ioBaseUrl,
                    repository: repo,
                    publishFn: sinon.stub().resolves({ accepted: true }),
                    waitForCompletion: false,
                    sleepFn,
                    maxPolls: 1,
                });
                await waitUntil(() => sleepFn.calledOnce);
                store.set('different-project');
                release();
                await waitUntil(() => !Store.bulkPublishProjects.publishing.get()[project.id]);
                await Promise.resolve();
                expect(toast.called).to.be.false;
            } finally {
                store.set(previous);
            }
        });
    }
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

    it('calls refreshFragment with skipPromoMerge:true after revert', async () => {
        const project = makeProject();
        await startReverting({ project, token, ioBaseUrl, repository: repo });
        expect(repo.refreshFragment.firstCall.args[1]).to.deep.equal({ skipPromoMerge: true });
    });

    it('returns the IO action result', async () => {
        const expected = { status: 'Reverted', failures: [], skipped: [] };
        fetchStub.resolves(fetchOk(expected));
        const project = makeProject();
        const result = await startReverting({ project, token, ioBaseUrl, repository: repo });
        expect(result).to.deep.equal(expected);
    });
});

describe('resetToDraft()', () => {
    let fetchStub;
    let repo;
    const token = 'test-token';
    const ioBaseUrl = 'https://io.example';

    beforeEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        repo = makeRepo();
        fetchStub = sinon.stub(window, 'fetch').resolves(fetchOk({ status: 'Draft' }));
    });

    afterEach(() => sinon.restore());

    it('calls the reset action with projectId', async () => {
        const project = makeProject();
        await resetToDraft({ project, token, ioBaseUrl, repository: repo });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.include('/bulk-publish-reset');
        expect(JSON.parse(init.body).projectId).to.equal('proj-1');
    });

    it('refreshes the fragment so the row leaves Publishing', async () => {
        const project = makeProject();
        await resetToDraft({ project, token, ioBaseUrl, repository: repo });
        expect(repo.refreshFragment.calledOnce).to.equal(true);
        expect(repo.refreshFragment.firstCall.args[0]).to.equal(project);
    });

    it('returns the IO action result', async () => {
        const expected = { status: 'Draft' };
        fetchStub.resolves(fetchOk(expected));
        const project = makeProject();
        const result = await resetToDraft({ project, token, ioBaseUrl, repository: repo });
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

describe('saveSnapshot()', () => {
    let saveSnapshotActionStub;

    beforeEach(() => {
        saveSnapshotActionStub = sinon.stub().resolves({ entries: [] });
    });

    afterEach(() => sinon.restore());

    it('calls saveSnapshotFn with projectId, token, ioBaseUrl', async () => {
        const project = { id: 'proj-123' };
        await saveSnapshot({
            project,
            token: 'tok',
            ioBaseUrl: 'https://io.example',
            saveSnapshotFn: saveSnapshotActionStub,
        });

        expect(saveSnapshotActionStub.calledOnce).to.equal(true);
        const args = saveSnapshotActionStub.firstCall.args[0];
        expect(args.projectId).to.equal('proj-123');
        expect(args.token).to.equal('tok');
        expect(args.ioBaseUrl).to.equal('https://io.example');
    });

    it('does nothing when project has no id (new unsaved project)', async () => {
        const project = { id: null };
        await saveSnapshot({ project, token: 'tok', ioBaseUrl: 'https://io.example', saveSnapshotFn: saveSnapshotActionStub });
        expect(saveSnapshotActionStub.called).to.equal(false);
    });
});
