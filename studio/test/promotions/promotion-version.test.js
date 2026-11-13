import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { PROMOTION_MODEL_ID } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { MasRepository } from '../../src/mas-repository.js';
import MasFragmentEditor from '../../src/mas-fragment-editor.js';
import router from '../../src/router.js';
import {
    withPromotionVersion,
    savePromotionVersion,
    listPromotionHistory,
    restorePromotionHistory,
    clearPromotionHistoryRequests,
    recoverPromotionHistory,
} from '../../src/promotions/promotion-version.js';
import {
    createPromotionFragment,
    deletePromotionFragment,
    duplicatePromotionProject,
    forceDeletePromoVariation,
    savePromotionFragment,
} from '../../src/promotions/promotions-repository.js';

describe('Promotion version capture', () => {
    let sandbox;
    let meta;
    let projects;
    let fetchStub;
    let repository;
    let profile;
    let users;
    const project = {
        id: 'project',
        path: '/content/dam/mas/promotions/launch',
        model: { id: PROMOTION_MODEL_ID },
        fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
    };
    const queued = () =>
        Object.keys(localStorage)
            .filter((key) => key.startsWith('mas.promotion-history.'))
            .map((key) => ({ key, ...JSON.parse(localStorage.getItem(key)) }));

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        profile = Store.profile.get();
        users = Store.users.get();
        Store.profile.set({ email: 'author@example.com' });
        Store.users.set([{ userPrincipalName: 'author@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        clearPromotionHistoryRequests();
        projects = Store.promotions.list.data.get();
        Store.promotions.list.data.set([new FragmentStore(new Fragment(project))]);
        meta = document.createElement('meta');
        meta.name = 'io-base-url';
        meta.content = 'https://studio.example/api';
        document.head.append(meta);
        sessionStorage.setItem('masAccessToken', 'test-token');
        fetchStub = sandbox.stub(window, 'fetch').callsFake(
            async () =>
                new Response(
                    JSON.stringify({
                        beforeVersionId: 'before-version',
                        event: { id: 'version' },
                        events: [{ id: 'version' }],
                    }),
                ),
        );
        repository = {
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            createVersion: sandbox.stub().resolves('before-version'),
                            getVersions: sandbox.stub().resolves({ items: [] }),
                            getVersion: sandbox.stub().resolves(project),
                            getById: sandbox.stub().resolves(project),
                        },
                    },
                },
            },
            loadPromotions: sandbox.stub().resolves(),
        };
    });

    afterEach(async () => {
        fetchStub
            .withArgs(sinon.match((url) => url.endsWith('/history-list')))
            .callsFake(async () => new Response(JSON.stringify({ events: [] })));
        await listPromotionHistory(project.id);
        for (const { key } of queued()) localStorage.removeItem(key);
        Store.profile.set(profile);
        Store.users.set(users);
        clearPromotionHistoryRequests();
        sandbox.restore();
        meta.remove();
        sessionStorage.removeItem('masAccessToken');
        sessionStorage.removeItem('mas.pendingPromotionAudit');
        Store.promotions.list.data.set(projects);
    });

    it('persists completion before returning Save and removes it only after confirmation', async () => {
        let finish;
        fetchStub.callsFake(async (url, options) => {
            if (JSON.parse(options.body).phase) return new Response(JSON.stringify({ etag: '"before"' }));
            return new Promise((resolve) => {
                finish = resolve;
            });
        });
        const saved = { ...project, etag: '"saved"' };

        expect(await withPromotionVersion(repository, project, sandbox.stub().resolves(saved))).to.equal(saved);
        await waitUntil(() => finish);
        try {
            expect(queued()).to.have.length(1);
            expect(queued()[0].payload).to.include({ targetId: project.id, completionEtag: '"saved"' });
            expect(JSON.stringify(queued())).not.to.include('test-token');
        } finally {
            finish(new Response(JSON.stringify({ event: { id: 'version' } })));
        }
        await waitUntil(() => queued().length === 0);
    });

    it('recovers persisted failed completions on opening History with the original idempotency key', async () => {
        fetchStub.callsFake(async () => new Response('Unavailable', { status: 503 }));
        await savePromotionVersion(repository, project);
        await waitUntil(() => queued().length === 1);
        fetchStub
            .withArgs(sinon.match((url) => url.endsWith('/history-list')))
            .callsFake(async () => new Response(JSON.stringify({ events: [] })));
        await listPromotionHistory(project.id);
        const [pending] = queued();
        fetchStub.callsFake(async () => new Response(JSON.stringify({ event: { id: 'recorded' } })));

        await recoverPromotionHistory(project.id);
        await waitUntil(() => queued().length === 0);

        expect(JSON.parse(fetchStub.lastCall.args[1].body).requestId).to.equal(pending.payload.requestId);
    });

    it('retains failed history without periodic recovery, repeated notifications or retries when browsing', async () => {
        const toast = sandbox.spy(Events.toast, 'emit');
        const timers = sandbox.spy(window, 'setTimeout');
        fetchStub.callsFake(
            async (url) =>
                new Response(JSON.stringify(url.endsWith('/history-list') ? { events: [] } : { error: 'Not found' }), {
                    status: url.endsWith('/history-list') ? 200 : 404,
                }),
        );
        await savePromotionVersion(repository, project);
        await listPromotionHistory(project.id);
        const [pending] = queued();
        fetchStub.resetHistory();

        for (let attempt = 0; attempt < 3; attempt += 1) {
            Store.profile.notify();
            Store.users.notify();
            window.dispatchEvent(new Event('online'));
            await listPromotionHistory(project.id);
        }

        const recordings = fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'));
        expect(recordings).to.have.length(0);
        expect(queued()).to.have.length(1);
        expect(queued()[0].payload).to.deep.equal(pending.payload);
        expect(timers.getCalls().some((call) => call.args[1] === 60000)).to.be.false;
        expect(toast.called).to.be.false;
    });

    it('removes a pending entry when History recovery succeeds without notifying the author', async () => {
        const toast = sandbox.spy(Events.toast, 'emit');
        fetchStub.callsFake(
            async (url) =>
                new Response(JSON.stringify(url.endsWith('/history-list') ? { events: [] } : { error: 'Not found' }), {
                    status: url.endsWith('/history-list') ? 200 : 404,
                }),
        );
        await savePromotionVersion(repository, project);
        await listPromotionHistory(project.id);
        const [pending] = queued();
        fetchStub.callsFake(async () => new Response(JSON.stringify({ event: { id: 'recorded' } })));
        fetchStub.resetHistory();

        await recoverPromotionHistory(project.id);

        expect(queued()).to.have.length(0);
        expect(fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'))).to.have.length(1);
        expect(JSON.parse(fetchStub.firstCall.args[1].body).requestId).to.equal(pending.payload.requestId);
        expect(toast.called).to.be.false;
    });

    it('limits each History recovery round to three transient attempts with the original request ID', async () => {
        fetchStub.callsFake(
            async (url) =>
                new Response(JSON.stringify(url.endsWith('/history-list') ? { events: [] } : { error: 'Unavailable' }), {
                    status: url.endsWith('/history-list') ? 200 : 503,
                }),
        );
        const toast = sandbox.spy(Events.toast, 'emit');
        await savePromotionVersion(repository, project);
        await listPromotionHistory(project.id);
        const [pending] = queued();
        fetchStub.resetHistory();

        await recoverPromotionHistory(project.id);

        const recordings = fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'));
        expect(recordings).to.have.length(3);
        expect(recordings.map((call) => JSON.parse(call.args[1].body).requestId)).to.deep.equal(
            Array(3).fill(pending.payload.requestId),
        );
        expect(queued()).to.have.length(1);
        expect(toast.called).to.be.false;
    });

    it('recovers only the project whose History was opened', async () => {
        fetchStub.callsFake(
            async (url) =>
                new Response(JSON.stringify(url.endsWith('/history-list') ? { events: [] } : { error: 'Not found' }), {
                    status: url.endsWith('/history-list') ? 200 : 404,
                }),
        );
        await savePromotionVersion(repository, project);
        await savePromotionVersion(repository, { ...project, id: 'another-project' });
        await listPromotionHistory(project.id);
        fetchStub.callsFake(async () => new Response(JSON.stringify({ event: { id: 'recovered' } })));
        fetchStub.resetHistory();

        await recoverPromotionHistory(project.id);

        expect(fetchStub.calledOnce).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body).rootId).to.equal(project.id);
        expect(queued().map((entry) => entry.payload.projectId)).to.deep.equal(['another-project']);
    });

    it('does not block history reads while recovering a pending entry', async () => {
        fetchStub.callsFake(
            async (url) =>
                new Response(JSON.stringify(url.endsWith('/history-list') ? { events: [] } : { error: 'Not found' }), {
                    status: url.endsWith('/history-list') ? 200 : 404,
                }),
        );
        await savePromotionVersion(repository, project);
        await listPromotionHistory(project.id);
        let finish;
        fetchStub.callsFake(async (url) => {
            if (url.endsWith('/history-list')) return new Response(JSON.stringify({ events: [] }));
            return new Promise((resolve) => {
                finish = resolve;
            });
        });
        const recovery = recoverPromotionHistory(project.id);
        await waitUntil(() => finish);
        let loaded = false;
        const listing = listPromotionHistory(project.id).then(() => {
            loaded = true;
        });
        try {
            await waitUntil(() => loaded);
        } finally {
            finish(new Response(JSON.stringify({ event: { id: 'recovered' } })));
            await recovery;
            await listing;
        }
    });

    it('records a metadata-only save notice when preparation fails', async () => {
        fetchStub.callsFake(async (url, options) => {
            const payload = JSON.parse(options.body);
            return payload.phase
                ? new Response('Unavailable', { status: 503 })
                : new Response(JSON.stringify({ event: { id: 'notice', snapshotUnavailable: true } }));
        });
        const saved = { ...project, etag: '"saved"' };

        expect(await withPromotionVersion(repository, project, sandbox.stub().resolves(saved))).to.equal(saved);
        await listPromotionHistory(project.id);

        const completion = fetchStub.getCalls().find((call) => {
            const payload = JSON.parse(call.args[1].body);
            return call.args[0].endsWith('/history-record') && !payload.phase;
        });
        expect(completion).to.exist;
        expect(JSON.parse(completion.args[1].body)).to.include({ action: 'save', metadataOnly: true });
    });

    it('confirms a save notice after a snapshot conflict without replacing its ETag or request ID', async () => {
        fetchStub.callsFake(async (url, options) => {
            const payload = JSON.parse(options.body);
            return payload.metadataOnly
                ? new Response(JSON.stringify({ event: { id: 'notice', snapshotUnavailable: true } }))
                : new Response('Changed', { status: 409 });
        });
        const toast = sandbox.spy(Events.toast, 'emit');

        await savePromotionVersion(repository, { ...project, etag: '"saved"' });
        await waitUntil(() => queued().length === 0);

        const original = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.include({
            metadataOnly: true,
            requestId: original.requestId,
            completionEtag: '"saved"',
        });
        expect(toast.calledWithMatch({ variant: 'warning', content: sinon.match('cannot be restored') })).to.be.true;
    });

    it('replays pending entries only for the original account and I/O environment', async () => {
        fetchStub.callsFake(async () => new Response('Forbidden', { status: 403 }));
        const errors = sandbox.spy(console, 'error');
        await savePromotionVersion(repository, project);
        await waitUntil(() => errors.calledWithMatch('Promotion history recording failed'));
        const [pending] = queued();
        fetchStub.resetHistory();

        Store.profile.set({ email: 'another@example.com' });
        Store.users.set([{ userPrincipalName: 'another@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        await recoverPromotionHistory(project.id);
        expect(fetchStub.called).to.be.false;
        meta.content = 'https://other.example/api';
        Store.profile.set({ email: 'author@example.com' });
        Store.users.set([{ userPrincipalName: 'author@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        await recoverPromotionHistory(project.id);
        expect(fetchStub.called).to.be.false;
        expect(queued()).to.have.length(1);

        fetchStub.callsFake(async () => new Response(JSON.stringify({ event: { id: 'recovered' } })));
        meta.content = 'https://studio.example/api';
        await recoverPromotionHistory(project.id);
        await waitUntil(() => queued().length === 0);

        expect(fetchStub.calledOnce).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body).requestId).to.equal(pending.payload.requestId);
    });

    it('does not replay persisted history while the author lacks promotion permission', async () => {
        fetchStub.callsFake(async () => new Response('Forbidden', { status: 403 }));
        const errors = sandbox.spy(console, 'error');
        await savePromotionVersion(repository, project);
        await waitUntil(() => errors.calledWithMatch('Promotion history recording failed'));
        fetchStub.resetHistory();

        Store.users.set([]);
        await recoverPromotionHistory(project.id);

        expect(fetchStub.called).to.be.false;
        expect(queued()).to.have.length(1);
        fetchStub.callsFake(async () => new Response(JSON.stringify({ event: { id: 'recovered' } })));
        Store.users.set([{ userPrincipalName: 'author@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        await recoverPromotionHistory(project.id);
        await waitUntil(() => queued().length === 0);
    });

    it('keeps an in-flight save queued for its original account when the session changes', async () => {
        let finish;
        const saved = { ...project, etag: '"saved"' };
        const saving = withPromotionVersion(
            repository,
            project,
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                }),
        );
        await waitUntil(() => finish);
        Store.profile.set({ email: 'another@example.com' });
        Store.users.set([{ userPrincipalName: 'another@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);

        finish(saved);
        expect(await saving).to.equal(saved);
        await listPromotionHistory(project.id);

        expect(queued()).to.have.length(1);
        expect(queued()[0].key).to.include('author%40example.com');
        expect(fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'))).to.have.length(1);
        Store.profile.set({ email: 'author@example.com' });
        Store.users.set([{ userPrincipalName: 'author@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        await recoverPromotionHistory(project.id);
        await waitUntil(() => queued().length === 0);
    });

    it('does not start a write under a different account after preparation finishes', async () => {
        let finish;
        fetchStub.callsFake(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                }),
        );
        const write = sandbox.stub().resolves(project);
        const outcome = withPromotionVersion(repository, project, write).then(
            () => null,
            (error) => error,
        );
        await waitUntil(() => finish);
        Store.profile.set({ email: 'another@example.com' });
        Store.users.set([{ userPrincipalName: 'another@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);

        finish(new Response(JSON.stringify({ etag: '"before"' })));
        const error = await outcome;

        expect(error.message).to.include('Sign-in changed');
        expect(write.called).to.be.false;
        expect(queued()).to.have.length(0);
    });

    it('warns without replaying malformed persisted history', async () => {
        const owner = JSON.stringify(['https://studio.example/api', 'author@example.com']);
        localStorage.setItem(`mas.promotion-history.${encodeURIComponent(owner)}.broken`, 'null');
        const toast = sandbox.spy(Events.toast, 'emit');

        await recoverPromotionHistory(project.id);

        expect(fetchStub.called).to.be.false;
        expect(toast.calledWithMatch({ variant: 'warning', content: sinon.match('could not be recovered') })).to.be.true;
    });

    it('does not fail Save when browser storage is full and warns that recovery is unavailable', async () => {
        sandbox.stub(Storage.prototype, 'setItem').throws(new DOMException('Storage full', 'QuotaExceededError'));
        const toast = sandbox.spy(Events.toast, 'emit');

        expect(await withPromotionVersion(repository, project, sandbox.stub().resolves(project))).to.equal(project);
        await listPromotionHistory(project.id);

        expect(toast.calledWithMatch({ variant: 'warning', content: sinon.match('Closing this tab') })).to.be.true;
        expect(fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'))).to.have.length(2);
    });

    it('records project creation through the promotion model after the repository finishes', async () => {
        const payload = { ...project, id: undefined };
        repository.createFragment = sandbox.stub().callsFake(async () => {
            expect(fetchStub.called).to.be.false;
            return project;
        });

        expect(await createPromotionFragment(repository, payload, false)).to.equal(project);
        await listPromotionHistory(project.id);

        expect(repository.createFragment.calledOnceWithExactly(payload, false)).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ action: 'create', targetId: project.id });
    });

    it('captures the previous project version before delegating the save to the repository', async () => {
        const store = new FragmentStore(new Fragment(project));
        const options = { withToast: false, refetchEtag: false };
        repository.saveFragment = sandbox.stub().callsFake(async () => {
            expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ phase: 'prepare', action: 'save' });
            return { ...project, etag: '"saved"' };
        });

        await savePromotionFragment(repository, store, options);
        await listPromotionHistory(project.id);

        expect(repository.saveFragment.calledOnceWithExactly(store, options)).to.be.true;
        expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.include({
            action: 'save',
            completionEtag: '"saved"',
        });
        expect(JSON.parse(fetchStub.secondCall.args[1].body).requestId).to.equal(
            JSON.parse(fetchStub.firstCall.args[1].body).requestId,
        );
        expect(JSON.parse(fetchStub.secondCall.args[1].body)).not.to.have.property('beforeVersionId');
    });

    it('records promo variation saves through the promotion model against their project', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };
        repository.saveFragment = sandbox.stub().callsFake(async () => {
            expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ phase: 'prepare', targetId: variation.id });
            return variation;
        });

        await savePromotionFragment(repository, new FragmentStore(new Fragment(variation)));
        await listPromotionHistory(project.id);

        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({
            rootId: project.id,
            targetId: variation.id,
            phase: 'prepare',
        });
    });

    it('binds the native save to the revision captured by server preparation', async () => {
        fetchStub
            .onFirstCall()
            .resolves(new Response(JSON.stringify({ beforeVersionId: 'server-before', etag: '"prepared"' })));
        const store = new FragmentStore(new Fragment(project));
        repository.saveFragment = sandbox.stub().resolves({ ...project, etag: '"saved"' });

        await savePromotionFragment(repository, store, { withToast: false });

        expect(
            repository.saveFragment.calledOnceWithExactly(store, {
                withToast: false,
                refetchEtag: false,
                expectedEtag: '"prepared"',
            }),
        ).to.be.true;
    });

    it('records a save notice instead of discarding a stale native save result as unchanged', async () => {
        const intended = { ...project, title: 'Saved title', etag: '"before"' };
        const stale = { ...project, title: 'Before', etag: '"before"' };
        const write = sandbox.stub().resolves(stale);
        fetchStub.callsFake(async (url, options) => {
            const payload = JSON.parse(options.body);
            if (payload.phase) return new Response(JSON.stringify({ etag: '"before"' }));
            return new Response(
                JSON.stringify(
                    payload.metadataOnly ? { event: { id: 'notice', snapshotUnavailable: true } } : { unchanged: true },
                ),
            );
        });

        expect(await withPromotionVersion(repository, intended, write)).to.equal(stale);
        await listPromotionHistory(project.id);

        const completion = JSON.parse(fetchStub.secondCall.args[1].body);
        expect(completion).to.include({ action: 'save', metadataOnly: true, completionEtag: '"before"' });
        expect(completion.requestId).to.equal(JSON.parse(fetchStub.firstCall.args[1].body).requestId);
        expect(write.calledOnce).to.be.true;
    });

    it('checks the submitted values before the repository refreshes the edited fragment in place', async () => {
        const intended = { ...project, fields: [{ name: 'title', values: ['Saved'] }] };
        fetchStub.onFirstCall().resolves(new Response(JSON.stringify({ etag: '"before"' })));
        const write = sandbox.stub().callsFake(async () => {
            intended.fields[0].values[0] = 'Before';
            intended.etag = '"before"';
            return intended;
        });

        await withPromotionVersion(repository, intended, write);
        await listPromotionHistory(project.id);

        expect(JSON.parse(fetchStub.secondCall.args[1].body).metadataOnly).to.be.true;
    });

    it('keeps a genuine no-op save eligible for the server unchanged response', async () => {
        const fragment = { ...project, etag: '"same"' };
        fetchStub.callsFake(
            async (url, options) =>
                new Response(JSON.stringify(JSON.parse(options.body).phase ? { etag: '"same"' } : { unchanged: true })),
        );

        await withPromotionVersion(repository, fragment, sandbox.stub().resolves(structuredClone(fragment)));
        await listPromotionHistory(project.id);

        expect(JSON.parse(fetchStub.secondCall.args[1].body)).not.to.have.property('metadataOnly');
        expect(queued()).to.have.length(0);
    });

    it('keeps normal snapshot recording when Save returns a new revision', async () => {
        fetchStub.onFirstCall().resolves(new Response(JSON.stringify({ etag: '"before"' })));
        const saved = { ...project, etag: '"after"' };

        await withPromotionVersion(repository, project, sandbox.stub().resolves(saved));
        await listPromotionHistory(project.id);

        expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.include({ completionEtag: '"after"' });
        expect(JSON.parse(fetchStub.secondCall.args[1].body)).not.to.have.property('metadataOnly');
    });

    it('detects an unconfirmed tag-only save without storing the submitted content in the outbox', async () => {
        const intended = {
            ...project,
            etag: '"before"',
            tags: [{ id: 'mas:old' }],
            newTags: ['mas:new'],
        };
        fetchStub.onFirstCall().resolves(new Response(JSON.stringify({ etag: '"before"' })));
        const saved = { ...intended, newTags: undefined };

        await withPromotionVersion(repository, intended, sandbox.stub().resolves(saved));
        await listPromotionHistory(project.id);

        const completion = JSON.parse(fetchStub.secondCall.args[1].body);
        expect(completion.metadataOnly).to.be.true;
        expect(completion).not.to.have.any.keys('fields', 'title', 'tags', 'newTags');
    });

    it('does not save against inconsistent before revisions across matching projects', async () => {
        Store.promotions.list.data.set([
            new FragmentStore(new Fragment(project)),
            new FragmentStore(new Fragment({ ...project, id: 'other-project' })),
        ]);
        fetchStub.callsFake(async (url, options) => {
            const payload = JSON.parse(options.body);
            return new Response(JSON.stringify({ etag: payload.rootId === project.id ? '"first"' : '"changed"' }));
        });
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };
        const write = sandbox.stub().resolves(variation);
        let failure;

        try {
            await withPromotionVersion(repository, variation, write);
        } catch (error) {
            failure = error;
        }

        expect(failure.message).to.equal('Fragment changed while preparing history. Reload before saving.');
        expect(write.called).to.be.false;
    });

    it('keeps ordinary fragment saves free of promotion version requests', async () => {
        const ordinary = { id: 'ordinary', path: '/content/dam/mas/acom/en_US/card' };
        repository.saveFragment = sandbox.stub().resolves(ordinary);

        expect(await savePromotionFragment(repository, new FragmentStore(new Fragment(ordinary)))).to.equal(ordinary);

        expect(repository.aem.sites.cf.fragments.createVersion.called).to.be.false;
        expect(fetchStub.called).to.be.false;
    });

    for (const operation of ['create', 'save']) {
        it(`does not record a version when the repository returns a failed ${operation}`, async () => {
            const toast = sandbox.spy(Events.toast, 'emit');
            repository[`${operation}Fragment`] = sandbox.stub().resolves(false);

            const result =
                operation === 'create'
                    ? await createPromotionFragment(repository, { ...project, id: undefined })
                    : await savePromotionFragment(repository, new FragmentStore(new Fragment(project)));
            await listPromotionHistory(project.id);

            expect(result).to.be.false;
            expect(
                fetchStub
                    .getCalls()
                    .some(
                        (call) => JSON.parse(call.args[1].body).phase !== 'prepare' && call.args[0].endsWith('/history-record'),
                    ),
            ).to.be.false;
            expect(toast.called).to.be.false;
        });
    }

    it('records duplicated project creation through the promotion model', async () => {
        repository.aem.tags = { create: sandbox.stub().resolves() };
        repository.getPromotionsPath = () => '/content/dam/mas/promotions';
        repository.createFragment = sandbox.stub().resolves(project);

        await duplicatePromotionProject(repository, new Fragment(project), { title: 'Launch copy' });
        await listPromotionHistory(project.id);

        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ action: 'create', targetId: project.id });
    });

    it('prepares the before version on the server and never sends a client-selected version', async () => {
        const write = sandbox.stub().callsFake(async () => {
            expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ phase: 'prepare', action: 'save' });
            return { ...project, etag: '"saved"' };
        });

        await withPromotionVersion(repository, project, write);

        expect(fetchStub.calledTwice).to.be.true;
        const payload = JSON.parse(fetchStub.secondCall.args[1].body);
        expect(payload).to.include({
            scopeType: 'promotion',
            rootId: project.id,
            targetId: project.id,
            completionEtag: '"saved"',
        });
        expect(payload).not.to.have.property('beforeVersionId');
        expect(payload).not.to.have.property('phase');
        expect(payload).not.to.have.property('projectId');
        expect(repository.aem.sites.cf.fragments.createVersion.called).to.be.false;
    });

    it('retries failed preparation with the same request ID before writing content', async () => {
        fetchStub.onFirstCall().resolves(new Response('Unavailable', { status: 503 }));
        const write = sandbox.stub().callsFake(async () => {
            expect(fetchStub.callCount).to.equal(2);
            return project;
        });

        await withPromotionVersion(repository, project, write);

        expect(JSON.parse(fetchStub.firstCall.args[1].body).requestId).to.equal(
            JSON.parse(fetchStub.secondCall.args[1].body).requestId,
        );
        expect(write.calledOnce).to.be.true;
    });

    it('records a new project only after its content is created', async () => {
        const write = sandbox.stub().resolves(project);

        expect(await withPromotionVersion(repository, { ...project, id: undefined }, write)).to.equal(project);

        expect(repository.aem.sites.cf.fragments.createVersion.called).to.be.false;
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ action: 'create', targetId: project.id });
    });

    it('does not version an ordinary fragment', async () => {
        const ordinary = { id: 'ordinary', path: '/content/dam/mas/acom/en_US/card' };
        const write = sandbox.stub().resolves(ordinary);

        expect(await withPromotionVersion(repository, ordinary, write)).to.equal(ordinary);

        expect(fetchStub.called).to.be.false;
        expect(repository.aem.sites.cf.fragments.createVersion.called).to.be.false;
    });

    it('does not record a version when the AEM save fails', async () => {
        let failure;
        try {
            await withPromotionVersion(repository, project, sandbox.stub().rejects(new Error('Save failed')));
        } catch (error) {
            failure = error;
        }

        expect(failure.message).to.equal('Save failed');
        expect(fetchStub.calledOnce).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body).phase).to.equal('prepare');
    });

    it('keeps a save queued without a toast when preparation and fallback exhaust retries', async () => {
        fetchStub.callsFake(async () => new Response('Unavailable', { status: 503 }));
        const write = sandbox.stub().resolves(project);
        const toast = sandbox.spy(Events.toast, 'emit');
        const errors = sandbox.spy(console, 'error');

        expect(await withPromotionVersion(repository, project, write)).to.equal(project);
        await waitUntil(() => errors.calledWithMatch('Promotion history recording failed'));
        expect(write.calledOnce).to.be.true;
        expect(fetchStub.callCount).to.equal(6);
        expect(queued()).to.have.length(1);
        expect(toast.called).to.be.false;
    });

    it('finishes Save while history recording is still pending', async () => {
        let complete;
        fetchStub.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        let finished = false;
        const saving = withPromotionVersion(repository, project, sandbox.stub().resolves(project)).then((saved) => {
            finished = true;
            return saved;
        });

        await waitUntil(() => complete);
        const finishedBeforeRecording = finished;
        complete(new Response(JSON.stringify({ event: { id: 'version' } })));
        expect(await saving).to.equal(project);
        expect(finishedBeforeRecording).to.be.true;
    });

    it('finishes project creation while history recording is still pending', async () => {
        let complete;
        fetchStub.onFirstCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        let finished = false;
        const creating = createPromotionFragment(
            { ...repository, createFragment: sandbox.stub().resolves(project) },
            { ...project, id: undefined },
        ).then((created) => {
            finished = true;
            return created;
        });

        await waitUntil(() => complete);
        const finishedBeforeRecording = finished;
        complete(new Response(JSON.stringify({ event: { id: 'version' } })));

        expect(await creating).to.equal(project);
        expect(finishedBeforeRecording).to.be.true;
    });

    it('waits for creation history before saving the newly created fragment', async () => {
        let complete;
        fetchStub.onFirstCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        repository.createFragment = sandbox.stub().resolves(project);
        repository.saveFragment = sandbox.stub().resolves(project);
        await createPromotionFragment(repository, { ...project, id: undefined });
        await waitUntil(() => complete);

        const saving = savePromotionFragment(repository, new FragmentStore(new Fragment(project)));
        await new Promise((resolve) => setTimeout(resolve, 0));
        const preparedBeforeRecording = fetchStub.callCount > 1;
        complete(new Response(JSON.stringify({ event: { id: 'created' } })));
        await saving;

        expect(preparedBeforeRecording).to.be.false;
        expect(repository.saveFragment.calledOnce).to.be.true;
    });

    it('keeps a second save behind history even when queued before the first write finishes', async () => {
        let finishWrite;
        let finishRecording;
        fetchStub.onSecondCall().callsFake(() => new Promise((resolve) => (finishRecording = resolve)));
        const first = withPromotionVersion(repository, project, () => new Promise((resolve) => (finishWrite = resolve)));
        await waitUntil(() => finishWrite);
        const write = sandbox.stub().resolves(project);
        const second = withPromotionVersion(repository, project, write);

        finishWrite(project);
        await waitUntil(() => finishRecording);
        const wroteBeforeRecording = write.called;
        finishRecording(new Response(JSON.stringify({ event: { id: 'first' } })));
        await Promise.all([first, second]);

        expect(wroteBeforeRecording).to.be.false;
        expect(write.calledOnce).to.be.true;
    });

    it('waits for the previous capture before saving the same fragment again', async () => {
        let complete;
        fetchStub.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        const first = withPromotionVersion(repository, project, sandbox.stub().resolves({ ...project, etag: '"first"' }));
        await waitUntil(() => complete);
        const write = sandbox.stub().resolves({ ...project, etag: '"second"' });

        const second = withPromotionVersion(repository, project, write);
        await new Promise((resolve) => setTimeout(resolve, 0));
        const wroteBeforeCapture = write.called;
        complete(new Response(JSON.stringify({ event: { id: 'first' } })));
        await Promise.all([first, second]);
        await listPromotionHistory(project.id);

        expect(wroteBeforeCapture).to.be.false;
        expect(write.calledOnce).to.be.true;
    });

    it('waits for pending capture before loading the current version history', async () => {
        let complete;
        fetchStub.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        const saving = withPromotionVersion(repository, project, sandbox.stub().resolves(project));
        await waitUntil(() => complete);

        const listing = listPromotionHistory(project.id);
        await new Promise((resolve) => setTimeout(resolve, 0));
        const readBeforeCapture = fetchStub.getCalls().some((call) => call.args[0].endsWith('/history-list'));
        complete(new Response(JSON.stringify({ event: { id: 'version' } })));
        await Promise.all([saving, listing]);

        expect(readBeforeCapture).to.be.false;
        expect(fetchStub.lastCall.args[0]).to.equal('https://studio.example/api/history-list');
    });

    it('does not prevent the next queued save when the preceding content write fails', async () => {
        let rejectWrite;
        const failedSave = withPromotionVersion(
            repository,
            project,
            () => new Promise((resolve, reject) => (rejectWrite = reject)),
        ).catch((error) => error);
        await waitUntil(() => rejectWrite);
        const nextWrite = sandbox.stub().resolves(project);
        const nextSave = withPromotionVersion(repository, project, nextWrite);

        rejectWrite(new Error('Save failed'));

        expect((await failedSave).message).to.equal('Save failed');
        expect(await nextSave).to.equal(project);
        expect(nextWrite.calledOnce).to.be.true;
    });

    it('still loads existing history after a pending content write fails', async () => {
        let rejectWrite;
        const failedSave = withPromotionVersion(
            repository,
            project,
            () => new Promise((resolve, reject) => (rejectWrite = reject)),
        ).catch((error) => error);
        await waitUntil(() => rejectWrite);
        const listing = listPromotionHistory(project.id);

        rejectWrite(new Error('Save failed'));
        await failedSave;

        expect((await listing).events).to.have.length(1);
    });

    it('records duplicated variations against their known project without competing list reloads', async () => {
        Store.promotions.list.data.set([]);
        const variation = {
            id: 'first-variation',
            path: '/content/dam/mas/acom/en_US/promotions/copy/card',
        };
        const toast = sandbox.spy(Events.toast, 'emit');

        await Promise.all([
            savePromotionVersion(repository, variation, { projectId: 'copied-project' }),
            savePromotionVersion(repository, { ...variation, id: 'second-variation' }, { projectId: 'copied-project' }),
        ]);

        expect(repository.loadPromotions.called).to.be.false;
        expect(fetchStub.getCalls().map((call) => JSON.parse(call.args[1].body).rootId)).to.deep.equal([
            'copied-project',
            'copied-project',
        ]);
        expect(toast.called).to.be.false;
    });

    it('skips version capture for authors without a promotion group', async () => {
        Store.users.set([{ userPrincipalName: 'author@example.com', groups: ['GRP-ODIN-MAS-ACOM-EDITORS'] }]);
        const variation = { id: 'variation', path: '/content/dam/mas/acom/en_US/promotions/launch/card' };
        const toast = sandbox.spy(Events.toast, 'emit');

        expect(await withPromotionVersion(repository, variation, sandbox.stub().resolves(variation))).to.equal(variation);

        expect(repository.aem.sites.cf.fragments.createVersion.called).to.be.false;
        expect(fetchStub.called).to.be.false;
        expect(toast.called).to.be.false;
    });

    it('does not inspect promotion data when the author is outside the promotion groups', async () => {
        Store.users.set([]);
        const write = sandbox.stub().resolves(false);

        expect(await withPromotionVersion(repository, undefined, write)).to.be.false;
        expect(write.calledOnce).to.be.true;
        expect(fetchStub.called).to.be.false;
    });

    it('does not record variation creation for authors without a promotion group', async () => {
        Store.users.set([]);
        const toast = sandbox.spy(Events.toast, 'emit');

        await savePromotionVersion(repository, project);

        expect(fetchStub.called).to.be.false;
        expect(repository.loadPromotions.called).to.be.false;
        expect(toast.called).to.be.false;
    });

    it('logs failed history recording without showing a toast after saving content', async () => {
        fetchStub.callsFake(async () => new Response(JSON.stringify({ error: 'Unavailable' }), { status: 503 }));
        const toast = sandbox.spy(Events.toast, 'emit');
        const errors = sandbox.spy(console, 'error');
        const saved = { ...project, etag: '"saved"' };

        expect(await withPromotionVersion(repository, project, sandbox.stub().resolves(saved))).to.equal(saved);
        await waitUntil(() => errors.calledWithMatch('Promotion history recording failed'));

        expect(toast.called).to.be.false;
        expect(sessionStorage.getItem('mas.pendingPromotionAudit')).to.be.null;
    });

    it('retries transient recording failures without changing the idempotency key', async () => {
        fetchStub.onFirstCall().resolves(new Response('Bad gateway', { status: 502 }));

        await savePromotionVersion(repository, project);
        await waitUntil(() => queued().length === 0);

        expect(fetchStub.callCount).to.equal(2);
        expect(JSON.parse(fetchStub.firstCall.args[1].body).requestId).to.equal(
            JSON.parse(fetchStub.secondCall.args[1].body).requestId,
        );
    });

    it('preserves the saved completion ETag when falling back after a conflict', async () => {
        fetchStub.callsFake(async () => new Response(JSON.stringify({ error: 'Changed' }), { status: 409 }));
        const toast = sandbox.spy(Events.toast, 'emit');
        const errors = sandbox.spy(console, 'error');

        await savePromotionVersion(repository, { ...project, etag: '"saved"' });
        await waitUntil(() => errors.calledWithMatch('Promotion history recording failed'));

        expect(fetchStub.calledTwice).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body).completionEtag).to.equal('"saved"');
        expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.include({ completionEtag: '"saved"', metadataOnly: true });
        expect(toast.called).to.be.false;
    });

    it('continues recording other matching projects after one project fails', async () => {
        Store.promotions.list.data.set([
            new FragmentStore(new Fragment(project)),
            new FragmentStore(new Fragment({ ...project, id: 'other-project' })),
        ]);
        fetchStub.callsFake(async (url, options) => {
            if (url.endsWith('/history-list')) return new Response(JSON.stringify({ events: [] }));
            const payload = JSON.parse(options.body);
            return payload.rootId === project.id
                ? new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
                : new Response(JSON.stringify({ event: { id: 'other-event' } }));
        });
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };

        await savePromotionVersion(repository, variation);
        await listPromotionHistory(project.id);

        expect(
            fetchStub
                .getCalls()
                .filter((call) => call.args[0].endsWith('/history-record'))
                .map((call) => JSON.parse(call.args[1].body).rootId),
        ).to.deep.equal([project.id, 'other-project']);
    });

    it('records a deletion only after the promo variation has been deleted', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };
        const write = sandbox.stub().callsFake(async () => {
            expect(fetchStub.calledOnce).to.be.true;
            expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ phase: 'prepare', action: 'delete' });
            return true;
        });

        expect(await withPromotionVersion(repository, variation, write, { action: 'delete' })).to.be.true;

        const prepared = JSON.parse(fetchStub.firstCall.args[1].body);
        const completed = JSON.parse(fetchStub.secondCall.args[1].body);
        expect(completed).to.include({ action: 'delete', targetId: variation.id, requestId: prepared.requestId });
        expect(completed).not.to.have.property('beforeVersionId');
    });

    it('does not record a deletion when the underlying delete fails', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };

        expect(await withPromotionVersion(repository, variation, sandbox.stub().resolves(false), { action: 'delete' })).to.be
            .false;

        expect(fetchStub.calledOnce).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body).phase).to.equal('prepare');
    });

    it('does not add project deletion to the promo variation deletion scope', async () => {
        const write = sandbox.stub().resolves(true);

        expect(await withPromotionVersion(repository, project, write, { action: 'delete' })).to.be.true;

        expect(fetchStub.called).to.be.false;
    });

    it('records cascading deletion using the verified variation ID resolved from its path', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };
        repository.aem.sites.cf.fragments.getByPath = sandbox.stub().resolves(variation);
        repository.aem.sites.cf.fragments.forceDelete = sandbox.stub().callsFake(async () => {
            expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ action: 'delete', phase: 'prepare' });
        });

        await forceDeletePromoVariation(repository, variation.path);

        expect(repository.aem.sites.cf.fragments.forceDelete.calledOnceWithExactly({ path: variation.path })).to.be.true;
        expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.include({ action: 'delete', targetId: variation.id });
    });

    it('still force deletes when the fragment lookup for history fails and warns about missing history', async () => {
        const path = '/content/dam/mas/acom/en_US/promotions/launch/card';
        const toast = sandbox.spy(Events.toast, 'emit');
        repository.aem.sites.cf.fragments.getByPath = sandbox.stub().rejects(new Error('Lookup unavailable'));
        repository.aem.sites.cf.fragments.forceDelete = sandbox.stub().resolves();

        expect(await forceDeletePromoVariation(repository, path)).to.be.true;

        expect(repository.aem.sites.cf.fragments.forceDelete.calledOnceWithExactly({ path })).to.be.true;
        expect(toast.calledWithMatch({ variant: 'warning', content: sinon.match('missing from') })).to.be.true;
        expect(fetchStub.called).to.be.false;
    });

    it('preserves the force delete error when history lookup also fails', async () => {
        const path = '/content/dam/mas/acom/en_US/promotions/launch/card';
        const deleteError = new Error('Deletion forbidden');
        const toast = sandbox.spy(Events.toast, 'emit');
        repository.aem.sites.cf.fragments.getByPath = sandbox.stub().rejects(new Error('Lookup unavailable'));
        repository.aem.sites.cf.fragments.forceDelete = sandbox.stub().rejects(deleteError);
        let failure;

        try {
            await forceDeletePromoVariation(repository, path);
        } catch (error) {
            failure = error;
        }

        expect(failure).to.equal(deleteError);
        expect(repository.aem.sites.cf.fragments.forceDelete.calledOnceWithExactly({ path })).to.be.true;
        expect(toast.called).to.be.false;
    });

    it('does not block direct deletion when history preparations return different fragment revisions', async () => {
        Store.promotions.list.data.set([
            new FragmentStore(new Fragment(project)),
            new FragmentStore(new Fragment({ ...project, id: 'other-project' })),
        ]);
        fetchStub.callsFake(async (url, options) => {
            const payload = JSON.parse(options.body);
            return new Response(JSON.stringify({ etag: payload.rootId === project.id ? '"first"' : '"changed"' }));
        });
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };
        const result = { deleted: true, failedVariations: [] };
        const remove = sandbox.stub().resolves(result);

        expect(await deletePromotionFragment(repository, variation, remove)).to.equal(result);
        await listPromotionHistory(project.id);

        expect(remove.calledOnce).to.be.true;
        const records = fetchStub
            .getCalls()
            .filter((call) => call.args[0].endsWith('/history-record'))
            .map((call) => JSON.parse(call.args[1].body));
        expect(records.filter((record) => record.action === 'delete' && !record.phase)).to.have.length(2);
    });

    it('keeps direct shared repository deletion free of promotion versioning', async () => {
        const variation = {
            id: 'variation',
            title: 'Promo card',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };
        const sharedRepository = Object.assign(Object.create(MasRepository.prototype), repository);
        sharedRepository.operation = { set: sandbox.stub() };
        sharedRepository.refreshVariationParentInList = sandbox.stub().resolves();
        sharedRepository.aem.sites.cf.fragments.getWithEtag = sandbox.stub().resolves(variation);
        sharedRepository.aem.sites.cf.fragments.delete = sandbox.stub().resolves();

        expect(await sharedRepository.deleteFragment(variation, { startToast: false, endToast: false })).to.be.true;

        expect(sharedRepository.aem.sites.cf.fragments.delete.calledOnceWithExactly(variation)).to.be.true;
        expect(fetchStub.called).to.be.false;
    });

    for (const isVariation of [true, false]) {
        it(`records direct editor deletion when variation context is ${isVariation}`, async () => {
            Store.users.set([{ userPrincipalName: 'author@example.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
            const fragment = new Fragment({
                id: 'variation',
                path: '/content/dam/mas/acom/en_US/promotions/launch/card',
                fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
            });
            const editor = new MasFragmentEditor();
            editor.inEdit = { get: () => new FragmentStore(fragment) };
            editor.editorContextStore = {
                isVariation: () => isVariation,
                getLocaleDefaultFragmentAsync: async () => ({ id: 'default' }),
            };
            const method = isVariation ? 'deleteVariationFragment' : 'deleteFragmentWithVariations';
            repository[method] = sandbox
                .stub()
                .resolves(isVariation ? { deleted: true, failedVariations: [] } : { success: true, failedVariations: [] });
            sandbox.stub(editor, 'repository').get(() => repository);
            sandbox.stub(Store.fragments.inEdit, 'set');
            sandbox.stub(Store.viewMode, 'set');
            sandbox.stub(router, 'navigateToPage').returns(sandbox.stub().resolves());

            await editor.confirmDelete();
            await listPromotionHistory(project.id);

            const records = fetchStub
                .getCalls()
                .filter((call) => call.args[0].endsWith('/history-record'))
                .map((call) => JSON.parse(call.args[1].body));
            expect(records).to.have.length(2);
            expect(records[0]).to.include({ action: 'delete', phase: 'prepare', targetId: fragment.id });
            expect(records[1]).to.include({ action: 'delete', targetId: fragment.id, requestId: records[0].requestId });
            expect(repository[method].calledOnce).to.be.true;
        });
    }

    for (const result of [
        { deleted: false, failedVariations: [] },
        { success: false, failedVariations: [] },
    ]) {
        it(`does not record failed direct deletion reported by ${Object.keys(result)[0]}`, async () => {
            const fragment = {
                id: 'variation',
                path: '/content/dam/mas/acom/en_US/promotions/launch/card',
                fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
            };

            expect(await deletePromotionFragment(repository, fragment, sandbox.stub().resolves(result))).to.equal(result);
            await listPromotionHistory(project.id);

            const records = fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'));
            expect(records).to.have.length(1);
            expect(JSON.parse(records[0].args[1].body)).to.include({ action: 'delete', phase: 'prepare' });
        });
    }

    it('records one deletion when the direct delete falls back to native force delete', async () => {
        const fragment = new Fragment({
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        });
        const sharedRepository = Object.assign(Object.create(MasRepository.prototype), repository);
        sandbox.stub(sharedRepository, 'deleteFragment').resolves(false);
        sharedRepository.aem.sites.cf.fragments.forceDelete = sandbox.stub().resolves();
        sharedRepository.aem.sites.cf.fragments.getByPath = sandbox.stub().resolves(fragment);

        const result = await deletePromotionFragment(sharedRepository, fragment, () =>
            sharedRepository.deleteFragmentWithVariations(fragment, []),
        );
        await listPromotionHistory(project.id);

        expect(result.success).to.be.true;
        expect(sharedRepository.aem.sites.cf.fragments.forceDelete.calledOnceWithExactly({ path: fragment.path })).to.be.true;
        expect(sharedRepository.aem.sites.cf.fragments.getByPath.called).to.be.false;
        const records = fetchStub
            .getCalls()
            .filter((call) => call.args[0].endsWith('/history-record'))
            .map((call) => JSON.parse(call.args[1].body));
        expect(records).to.have.length(2);
        expect(records[1]).to.include({ action: 'delete', requestId: records[0].requestId });
    });

    it('keeps ordinary cascade deletion free of promotion lookups and history', async () => {
        const path = '/content/dam/mas/acom/en_US/card/ar';
        repository.aem.sites.cf.fragments.forceDelete = sandbox.stub().resolves();
        repository.aem.sites.cf.fragments.getByPath = sandbox.stub();

        await forceDeletePromoVariation(repository, path);

        expect(repository.aem.sites.cf.fragments.forceDelete.calledOnceWithExactly({ path })).to.be.true;
        expect(repository.aem.sites.cf.fragments.getByPath.called).to.be.false;
        expect(fetchStub.called).to.be.false;
    });

    it('resolves a saved promo variation to its project', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };

        await withPromotionVersion(repository, variation, sandbox.stub().resolves(variation));

        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({
            scopeType: 'promotion',
            rootId: project.id,
            targetId: variation.id,
            phase: 'prepare',
        });
    });

    it('loads version history through the configured endpoint', async () => {
        await listPromotionHistory(project.id, { query: 'Title' });

        expect(fetchStub.firstCall.args[0]).to.equal('https://studio.example/api/history-list');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            scopeType: 'promotion',
            rootId: project.id,
            query: 'Title',
        });
    });

    it('sets a bounded timeout on history requests', async () => {
        const timeout = sandbox.spy(AbortSignal, 'timeout');

        await listPromotionHistory(project.id);

        expect(timeout.calledOnceWithExactly(15000)).to.be.true;
        expect(fetchStub.firstCall.args[1].signal).to.be.instanceOf(AbortSignal);
    });

    it('retries timed-out recording with the same request ID and a fresh signal', async () => {
        fetchStub.onFirstCall().rejects(new DOMException('Timed out', 'TimeoutError'));

        await savePromotionVersion(repository, project);
        await waitUntil(() => queued().length === 0);

        expect(fetchStub.calledTwice).to.be.true;
        expect(fetchStub.firstCall.args[1].signal).not.to.equal(fetchStub.secondCall.args[1].signal);
        expect(fetchStub.secondCall.args[1].keepalive).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal(JSON.parse(fetchStub.secondCall.args[1].body));
    });

    it('allows the restore request to use its server-side write budget', async () => {
        const timeout = sandbox.spy(AbortSignal, 'timeout');

        await restorePromotionHistory(project.id, 'version', { selections: [] });

        expect(timeout.calledOnceWithExactly(55000)).to.be.true;
    });

    it('reports an HTML gateway error without leaking the JSON parser failure', async () => {
        fetchStub.resolves(new Response('<html>Bad gateway</html>', { status: 502 }));
        let failure;

        try {
            await listPromotionHistory(project.id);
        } catch (error) {
            failure = error;
        }

        expect(failure.status).to.equal(502);
        expect(failure.message).to.equal('Promotion version request failed (502).');
    });

    it('reports invalid successful JSON as a history service error', async () => {
        fetchStub.resolves(new Response('<html>Not JSON</html>'));
        let failure;

        try {
            await listPromotionHistory(project.id);
        } catch (error) {
            failure = error;
        }

        expect(failure.message).to.equal('Promotion version service returned an invalid response.');
    });

    it('fetches fresh history after an earlier request completes', async () => {
        const page = await listPromotionHistory(project.id);
        page.events.length = 0;
        const latest = { events: [{ id: 'latest-version' }] };
        fetchStub.callsFake(async () => new Response(JSON.stringify(latest)));

        expect(await listPromotionHistory(project.id)).to.deep.equal(latest);
        expect(fetchStub.callCount).to.equal(2);
    });

    it('deduplicates identical history requests already in flight', async () => {
        let complete;
        fetchStub.callsFake(() => new Promise((resolve) => (complete = resolve)));

        const first = listPromotionHistory(project.id, { limit: 10 });
        const second = listPromotionHistory(project.id, { limit: 10 });
        complete(new Response(JSON.stringify({ events: [{ id: 'version' }] })));
        const pages = await Promise.all([first, second]);

        expect(fetchStub.callCount).to.equal(1);
        expect(pages[0]).to.deep.equal(pages[1]);
        expect(pages[0]).not.to.equal(pages[1]);
    });

    it('isolates pending requests by project and filters while normalizing filter order', async () => {
        const completions = [];
        fetchStub.callsFake(() => new Promise((resolve) => completions.push(resolve)));
        const requests = [
            listPromotionHistory(project.id, { limit: 10, query: 'Title' }),
            listPromotionHistory(project.id, { query: 'Title', limit: 10 }),
            listPromotionHistory('other-project', { limit: 10, query: 'Title' }),
            listPromotionHistory(project.id, { limit: 10, query: 'Other' }),
        ];

        expect(fetchStub.callCount).to.equal(3);
        for (const complete of completions) complete(new Response(JSON.stringify({ events: [] })));
        await Promise.all(requests);
    });

    it('isolates pending history when the endpoint, token, AEM environment or profile changes', async () => {
        const aem = document.createElement('div');
        aem.setAttribute('base-url', 'https://first-author.example');
        const querySelector = document.querySelector.bind(document);
        sandbox
            .stub(document, 'querySelector')
            .callsFake((selector) => (selector === 'mas-repository' ? aem : querySelector(selector)));
        const profile = Store.profile.get();
        const completions = [];
        fetchStub.callsFake(() => new Promise((resolve) => completions.push(resolve)));
        try {
            const requests = [listPromotionHistory(project.id)];
            meta.content = 'https://other.example/api';
            requests.push(listPromotionHistory(project.id));
            sessionStorage.setItem('masAccessToken', 'other-session');
            requests.push(listPromotionHistory(project.id));
            aem.setAttribute('base-url', 'https://second-author.example');
            requests.push(listPromotionHistory(project.id));
            Store.profile.set({ id: 'other-user' });
            requests.push(listPromotionHistory(project.id));

            expect(fetchStub.callCount).to.equal(5);
            for (const complete of completions) complete(new Response(JSON.stringify({ events: [] })));
            await Promise.all(requests);
        } finally {
            Store.profile.set(profile);
        }
    });

    it('does not reuse an in-flight history request after a fragment save', async () => {
        let complete;
        fetchStub.onFirstCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        const pending = listPromotionHistory(project.id);

        Events.fragmentSaved.emit();
        await listPromotionHistory(project.id);

        expect(fetchStub.callCount).to.equal(2);
        complete(new Response(JSON.stringify({ events: [] })));
        await pending;
    });

    it('does not remove a newer pending request when an older session request completes', async () => {
        const completions = [];
        fetchStub.callsFake(() => new Promise((resolve) => completions.push(resolve)));
        const previous = listPromotionHistory(project.id);
        const profile = Store.profile.get();
        try {
            Store.profile.set({ id: 'new-session-user' });
            const current = listPromotionHistory(project.id);
            completions[0](new Response(JSON.stringify({ events: [{ id: 'old-session' }] })));
            await previous;
            const duplicate = listPromotionHistory(project.id);

            expect(fetchStub.callCount).to.equal(2);
            completions[1](new Response(JSON.stringify({ events: [{ id: 'new-session' }] })));
            const pages = await Promise.all([current, duplicate]);
            expect(pages[1].events[0].id).to.equal('new-session');
        } finally {
            Store.profile.set(profile);
        }
    });

    it('invalidates pending history after saving promotion content', async () => {
        let complete;
        fetchStub.onFirstCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        const pending = listPromotionHistory(project.id);

        await withPromotionVersion(repository, project, sandbox.stub().resolves(project));
        await listPromotionHistory(project.id);

        expect(fetchStub.callCount).to.equal(4);
        complete(new Response(JSON.stringify({ events: [] })));
        await pending;
    });

    it('invalidates pending history even when restore fails after changing content', async () => {
        let complete;
        fetchStub.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        let pending;
        fetchStub.onFirstCall().callsFake(async () => {
            pending = listPromotionHistory(project.id);
            return new Response(JSON.stringify({ error: 'Capture failed' }), { status: 503 });
        });

        try {
            await restorePromotionHistory(project.id, 'version', { selections: [] });
        } catch (error) {
            expect(error.status).to.equal(503);
        }

        await listPromotionHistory(project.id);
        expect(fetchStub.callCount).to.equal(3);
        complete(new Response(JSON.stringify({ events: [] })));
        await pending;
    });

    it('invalidates history requested during a restore', async () => {
        let complete;
        fetchStub.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        let pending;
        fetchStub.onFirstCall().callsFake(async () => {
            pending = listPromotionHistory(project.id);
            return new Response(JSON.stringify({ event: { id: 'restored' } }));
        });

        await restorePromotionHistory(project.id, 'version', { selections: [] });
        await listPromotionHistory(project.id);

        expect(fetchStub.callCount).to.equal(3);
        complete(new Response(JSON.stringify({ events: [] })));
        await pending;
    });

    it('allows retrying failed history requests', async () => {
        fetchStub.onFirstCall().resolves(new Response(JSON.stringify({ error: 'Unavailable' }), { status: 503 }));

        let failure;
        try {
            await listPromotionHistory(project.id);
        } catch (error) {
            failure = error;
        }
        expect(failure.status).to.equal(503);
        expect((await listPromotionHistory(project.id)).events).to.have.length(1);
        expect(fetchStub.callCount).to.equal(2);
    });

    it('reloads projects when a newly duplicated variation is not in the current project list', async () => {
        const newProject = { ...project, id: 'new-project', fields: [{ name: 'tags', values: ['mas:promotion/copy'] }] };
        repository.loadPromotions.callsFake(async () => {
            Store.promotions.list.data.set([new FragmentStore(new Fragment(newProject))]);
        });
        const variation = {
            id: 'new-variation',
            path: '/content/dam/mas/acom/en_US/promotions/copy/card',
            fields: [{ name: 'tags', values: ['mas:promotion/copy'] }],
        };

        await withPromotionVersion(repository, variation, sandbox.stub().resolves(variation));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(JSON.parse(fetchStub.firstCall.args[1].body).rootId).to.equal(newProject.id);
    });

    it('keeps actionable partial restore details on errors', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify({ error: 'Version capture failed', versionPending: true, restored: ['variation'] }), {
                status: 503,
            }),
        );
        let failure;
        try {
            await restorePromotionHistory(project.id, 'version', { selections: [] });
        } catch (error) {
            failure = error;
        }

        expect(failure.status).to.equal(503);
        expect(failure.details).to.include({ versionPending: true });
        expect(failure.details.restored).to.deep.equal(['variation']);
    });

    it('recovers persisted completions on History access after reopening Studio', async () => {
        fetchStub.callsFake(async () => new Response('Forbidden', { status: 403 }));
        const errors = sandbox.spy(console, 'error');
        await savePromotionVersion(repository, project);
        await waitUntil(() => errors.calledWithMatch('Promotion history recording failed'));
        const [pending] = queued();
        fetchStub.resetHistory();
        fetchStub.callsFake(async () => new Response(JSON.stringify({ event: { id: 'recovered' } })));

        const reopened = await import('../../src/promotions/promotion-version.js?recovery-test');
        expect(fetchStub.called).to.be.false;
        await reopened.recoverPromotionHistory(project.id);
        await waitUntil(() => queued().length === 0);

        expect(fetchStub.calledOnce).to.be.true;
        expect(JSON.parse(fetchStub.firstCall.args[1].body).requestId).to.equal(pending.payload.requestId);
    });

    it('does not recover pending entries on startup, profile updates or reconnection', async () => {
        const owner = JSON.stringify(['https://studio.example/api', 'author@example.com']);
        const payload = { projectId: project.id, targetId: project.id, requestId: 'pending', action: 'create' };
        const key = `mas.promotion-history.${encodeURIComponent(owner)}.${encodeURIComponent(JSON.stringify([project.id, payload.requestId]))}`;
        localStorage.setItem(key, JSON.stringify({ payload, createdAt: Date.now() }));
        fetchStub.callsFake(
            async (url) =>
                new Response(JSON.stringify(url.endsWith('/history-list') ? { events: [] } : { error: 'Not found' }), {
                    status: url.endsWith('/history-list') ? 200 : 404,
                }),
        );
        await import('../../src/promotions/promotion-version.js?single-recovery-test');
        Store.profile.notify();
        Store.users.notify();
        window.dispatchEvent(new Event('online'));
        await listPromotionHistory(project.id);

        expect(fetchStub.getCalls().filter((call) => call.args[0].endsWith('/history-record'))).to.have.length(0);
        expect(queued()).to.have.length(1);
    });
});
