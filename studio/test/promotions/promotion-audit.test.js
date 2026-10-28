import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { PROMOTION_MODEL_ID } from '../../src/constants.js';
import {
    withPromotionAudit,
    retryPendingPromotionAudits,
    listPromotionHistory,
    createPromotionBackup,
    restorePromotionHistory,
    recordPromotionHistory,
} from '../../src/promotions/promotion-audit.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';

describe('promotion write audit capture', () => {
    let sandbox;
    let meta;
    let projects;
    let fetchStub;
    let repository;
    const project = {
        id: 'project',
        path: '/content/dam/mas/promotions/launch',
        model: { id: PROMOTION_MODEL_ID },
        fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        projects = Store.promotions.list.data.get();
        Store.promotions.list.data.set([new FragmentStore(new Fragment(project))]);
        meta = document.createElement('meta');
        meta.name = 'io-base-url';
        meta.content = 'https://studio.example/api';
        document.head.append(meta);
        sessionStorage.setItem('masAccessToken', 'test-token');
        fetchStub = sandbox.stub(window, 'fetch').callsFake(async (url, options) => {
            const payload = JSON.parse(options.body);
            return new Response(
                JSON.stringify(payload.phase === 'prepare' ? { intentId: 'intent' } : { event: { id: 'event' } }),
            );
        });
        repository = {
            loadPromotions: sandbox.stub().resolves(),
            getPromotionsPath: sandbox.stub().returns('/content/dam/mas/promotions'),
            searchFragmentList: sandbox.stub().resolves([]),
        };
    });

    afterEach(() => {
        sandbox.restore();
        meta.remove();
        sessionStorage.removeItem('masAccessToken');
        sessionStorage.removeItem('mas.pendingPromotionAudit');
        Store.promotions.list.data.set(projects);
    });

    it('leaves non-promotion writes untouched', async () => {
        const write = sandbox.stub().resolves('saved');
        expect(await withPromotionAudit(repository, 'save', { path: '/content/dam/mas/acom/en_US/card' }, write)).to.equal(
            'saved',
        );
        expect(fetchStub.called).to.be.false;
    });

    it('finds shared-fragment projects without triggering promotion loading side effects', async () => {
        const shared = { id: 'shared', path: '/content/dam/mas/acom/en_US/shared' };
        Store.promotions.list.data.set([]);
        repository.searchFragmentList.resolves([
            { ...project, fields: [...project.fields, { name: 'fragments', values: [shared.path] }] },
        ]);
        const write = sandbox.stub().resolves(shared);

        await withPromotionAudit(repository, 'save', shared, write);

        expect(repository.loadPromotions.called).to.be.false;
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ projectId: project.id, targetId: shared.id });
        expect(write.calledOnce).to.be.true;
    });

    it('does not mask an unconfirmed duplicate with an audit of its source', async () => {
        let failure;
        try {
            await withPromotionAudit(repository, 'duplicate', project, sandbox.stub().resolves(null));
        } catch (error) {
            failure = error;
        }

        expect(failure?.message).to.include('could not be confirmed');
        expect(fetchStub.called).to.be.false;
    });

    it('prepares before saving and completes only after success', async () => {
        const write = sandbox.stub().callsFake(async () => {
            expect(JSON.parse(fetchStub.firstCall.args[1].body).phase).to.equal('prepare');
            return { ...project, etag: '"new"' };
        });
        await withPromotionAudit(repository, 'save', project, write);
        expect(fetchStub.callCount).to.equal(2);
        const completion = JSON.parse(fetchStub.secondCall.args[1].body);
        expect(completion).to.include({ phase: 'complete', projectId: 'project', intentId: 'intent' });
    });

    for (const modelField of ['model', 'modelId']) {
        it(`audits promo code saves with an unpadded ${modelField}`, async () => {
            const modelId = PROMOTION_MODEL_ID.replace(/=+$/, '');
            const target = {
                ...project,
                ...(modelField === 'model' ? { model: { id: modelId } } : { modelId }),
                fields: [...project.fields, { name: 'promoCode', values: ['NEWCODE'] }],
            };
            const write = sandbox.stub().callsFake(async () => {
                expect(fetchStub.callCount).to.equal(1);
                expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({
                    phase: 'prepare',
                    action: 'save',
                    projectId: project.id,
                });
                return target;
            });

            expect(await withPromotionAudit(repository, 'save', target, write)).to.equal(target);

            expect(write.calledOnce).to.be.true;
            expect(fetchStub.callCount).to.equal(2);
            expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.include({
                phase: 'complete',
                projectId: project.id,
                intentId: 'intent',
            });
        });
    }

    it('does not emit a completed entry when the mutation fails', async () => {
        try {
            await withPromotionAudit(repository, 'delete', project, sandbox.stub().rejects(new Error('Forbidden')));
        } catch (error) {
            expect(error.message).to.equal('Forbidden');
        }
        expect(fetchStub.callCount).to.equal(1);
    });

    it('records creation against the new project id', async () => {
        await withPromotionAudit(repository, 'create', { modelId: PROMOTION_MODEL_ID }, sandbox.stub().resolves(project));
        expect(JSON.parse(fetchStub.firstCall.args[1].body).projectId).to.equal('project');
    });

    it('audits publishing without automatically creating a project backup', async () => {
        const write = sandbox.stub().callsFake(async () => {
            expect(JSON.parse(fetchStub.firstCall.args[1].body).phase).to.equal('prepare');
        });
        await withPromotionAudit(repository, 'publish', project, write);
        expect(fetchStub.getCalls().every((call) => call.args[0].endsWith('/promo-history-record'))).to.be.true;
        expect(fetchStub.callCount).to.equal(2);
    });

    it('audits a shared fragment for each project that directly references it', async () => {
        const shared = { id: 'shared', path: '/content/dam/mas/acom/en_US/shared' };
        Store.promotions.list.data.set(
            ['first', 'second'].map(
                (id) =>
                    new FragmentStore(
                        new Fragment({
                            ...project,
                            id,
                            fields: [...project.fields, { name: 'fragments', values: [shared.path] }],
                        }),
                    ),
            ),
        );
        const write = sandbox.stub().resolves(shared);

        await withPromotionAudit(repository, 'save', shared, write);

        expect(write.calledOnce).to.be.true;
        const prepares = fetchStub
            .getCalls()
            .map((call) => JSON.parse(call.args[1].body))
            .filter((payload) => payload.phase === 'prepare');
        expect(prepares.map(({ projectId }) => projectId)).to.deep.equal(['first', 'second']);
        expect(fetchStub.callCount).to.equal(4);
    });

    it('queues a failed project creation audit for retry without creating versions', async () => {
        fetchStub.onFirstCall().resolves(new Response(JSON.stringify({ error: 'Unavailable' }), { status: 503 }));

        await withPromotionAudit(repository, 'create', { modelId: PROMOTION_MODEL_ID }, sandbox.stub().resolves(project));

        const [pending] = JSON.parse(sessionStorage.getItem('mas.pendingPromotionAudit'));
        expect(pending).to.include({ projectId: project.id, targetId: project.id, action: 'create' });
        expect(pending).not.to.have.property('fields');
        await retryPendingPromotionAudits();
        expect(JSON.parse(fetchStub.secondCall.args[1].body).requestId).to.equal(pending.requestId);
        expect(JSON.parse(sessionStorage.getItem('mas.pendingPromotionAudit'))).to.deep.equal([]);
    });

    it('prepares every target in a batch once and executes the batch once', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            tags: [{ id: 'mas:promotion/launch' }],
        };
        const write = sandbox.stub().resolves();
        await withPromotionAudit(repository, 'unpublish', [project, variation], write);
        expect(write.calledOnce).to.be.true;
        const prepares = fetchStub.getCalls().filter((call) => JSON.parse(call.args[1].body).phase === 'prepare');
        expect(prepares).to.have.length(2);
    });

    it('blocks the mutation when no durable audit intent can be recorded', async () => {
        fetchStub.callsFake(async () => new Response(JSON.stringify({ error: 'History unavailable' }), { status: 503 }));
        const write = sandbox.stub().resolves();
        try {
            await withPromotionAudit(repository, 'save', project, write);
        } catch (error) {
            expect(error.message).to.equal('History unavailable');
        }
        expect(write.called).to.be.false;
    });

    it('retries failed completions with the same request id without retaining content', async () => {
        fetchStub.onSecondCall().resolves(new Response(JSON.stringify({ error: 'Unavailable' }), { status: 503 }));
        await withPromotionAudit(repository, 'save', project, sandbox.stub().resolves(project));
        const [pending] = JSON.parse(sessionStorage.getItem('mas.pendingPromotionAudit'));
        expect(pending.intentId).to.equal('intent');
        expect(pending).not.to.have.property('fields');
        expect(pending).not.to.have.property('token');
        await retryPendingPromotionAudits();
        expect(JSON.parse(fetchStub.thirdCall.args[1].body).requestId).to.equal(pending.requestId);
        expect(JSON.parse(sessionStorage.getItem('mas.pendingPromotionAudit'))).to.deep.equal([]);
    });

    it('records project duplication as duplicate rather than create', async () => {
        await withPromotionAudit(
            repository,
            'create',
            { modelId: PROMOTION_MODEL_ID, auditAction: 'duplicate' },
            sandbox.stub().resolves(project),
        );
        expect(JSON.parse(fetchStub.firstCall.args[1].body).action).to.equal('duplicate');
    });

    it('records a generic duplicate against its new target instead of the source', async () => {
        const copy = { ...project, id: 'copy', path: '/content/dam/mas/promotions/copy' };
        await withPromotionAudit(repository, 'duplicate', project, sandbox.stub().resolves(copy));
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({
            action: 'duplicate',
            projectId: 'copy',
            targetId: 'copy',
            targetPath: copy.path,
        });
    });
});

describe('promotion history client', () => {
    let sandbox;
    let meta;
    let fetchStub;
    let previousToken;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        meta = document.createElement('meta');
        meta.name = 'io-base-url';
        meta.content = 'https://studio.example/api';
        document.head.append(meta);
        previousToken = sessionStorage.getItem('masAccessToken');
        sessionStorage.setItem('masAccessToken', 'test-token');
        fetchStub = sandbox.stub(window, 'fetch').callsFake(async () => new Response(JSON.stringify({ events: [] })));
    });

    afterEach(() => {
        sandbox.restore();
        meta.remove();
        if (previousToken === null) sessionStorage.removeItem('masAccessToken');
        else sessionStorage.setItem('masAccessToken', previousToken);
    });

    it('loads history with server filters and pagination', async () => {
        await listPromotionHistory('project', { user: 'author', from: '2026-10-01', cursor: 'next' });
        expect(fetchStub.firstCall.args[0]).to.equal('https://studio.example/api/promo-history-list');
        const options = fetchStub.firstCall.args[1];
        expect(JSON.parse(options.body)).to.include({ projectId: 'project', user: 'author', cursor: 'next' });
        expect(options.headers.Authorization).to.equal('Bearer test-token');
    });

    it('includes an idempotency key when creating backups', async () => {
        await createPromotionBackup('project', 'Before launch');
        const payload = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(payload.label).to.equal('Before launch');
        expect(payload.requestId).to.be.a('string').and.not.empty;
    });

    it('passes the original expected revisions to restore', async () => {
        const options = {
            selections: [{ fragmentId: 'fragment', fields: ['promoCode'] }],
            expected: [{ fragmentId: 'fragment', etag: '"one"' }],
        };
        await restorePromotionHistory('project', 'event', options);
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({ projectId: 'project', eventId: 'event' });
        expect(JSON.parse(fetchStub.firstCall.args[1].body).expected).to.deep.equal(options.expected);
    });

    it('keeps the supplied request id for audit retries', async () => {
        await recordPromotionHistory({ projectId: 'project', phase: 'complete', intentId: 'intent', requestId: 'request' });
        expect(JSON.parse(fetchStub.firstCall.args[1].body).requestId).to.equal('request');
    });

    it('surfaces conflicts instead of returning success', async () => {
        fetchStub.callsFake(async () => new Response(JSON.stringify({ error: 'Changed by another user.' }), { status: 409 }));
        let failure;
        try {
            await restorePromotionHistory('project', 'event', { expected: [] });
        } catch (error) {
            failure = error;
        }
        expect(failure?.message).to.equal('Changed by another user.');
        expect(failure?.status).to.equal(409);
    });

    it('rejects missing configuration before sending a request', async () => {
        meta.remove();
        let failure;
        try {
            await listPromotionHistory('project');
        } catch (error) {
            failure = error;
        }
        expect(failure?.message).to.contain('I/O');
        expect(fetchStub.called).to.be.false;
    });
});
