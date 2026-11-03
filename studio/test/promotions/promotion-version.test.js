import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { PROMOTION_MODEL_ID } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import {
    withPromotionVersion,
    listPromotionHistory,
    restorePromotionHistory,
    clearPromotionHistoryRequests,
} from '../../src/promotions/promotion-version.js';

describe('Promotion version capture', () => {
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
        clearPromotionHistoryRequests();
        projects = Store.promotions.list.data.get();
        Store.promotions.list.data.set([new FragmentStore(new Fragment(project))]);
        meta = document.createElement('meta');
        meta.name = 'io-base-url';
        meta.content = 'https://studio.example/api';
        document.head.append(meta);
        sessionStorage.setItem('masAccessToken', 'test-token');
        fetchStub = sandbox
            .stub(window, 'fetch')
            .callsFake(async () => new Response(JSON.stringify({ event: { id: 'version' }, events: [{ id: 'version' }] })));
        repository = {
            aem: { sites: { cf: { fragments: { createVersion: sandbox.stub().resolves('before-version') } } } },
            loadPromotions: sandbox.stub().resolves(),
        };
    });

    afterEach(() => {
        clearPromotionHistoryRequests();
        sandbox.restore();
        meta.remove();
        sessionStorage.removeItem('masAccessToken');
        sessionStorage.removeItem('mas.pendingPromotionAudit');
        Store.promotions.list.data.set(projects);
    });

    it('captures native content before saving without preparing an audit intent', async () => {
        const write = sandbox.stub().callsFake(async () => {
            expect(repository.aem.sites.cf.fragments.createVersion.calledOnceWith(project.id)).to.be.true;
            expect(fetchStub.called).to.be.false;
            return { ...project, etag: '"saved"' };
        });

        await withPromotionVersion(repository, project, write);

        expect(fetchStub.calledOnce).to.be.true;
        const payload = JSON.parse(fetchStub.firstCall.args[1].body);
        expect(payload).to.include({
            projectId: project.id,
            targetId: project.id,
            beforeVersionId: 'before-version',
            completionEtag: '"saved"',
        });
        expect(payload).not.to.have.property('phase');
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
        expect(fetchStub.called).to.be.false;
    });

    it('does not overwrite content when its native before version cannot be captured', async () => {
        repository.aem.sites.cf.fragments.createVersion.rejects(new Error('AEM unavailable'));
        const write = sandbox.stub();
        let failure;
        try {
            await withPromotionVersion(repository, project, write);
        } catch (error) {
            failure = error;
        }

        expect(failure?.message).to.equal('AEM unavailable');
        expect(write.called).to.be.false;
    });

    it('warns explicitly if content was saved but the version catalog could not be updated', async () => {
        fetchStub.resolves(new Response(JSON.stringify({ error: 'Unavailable' }), { status: 503 }));
        const toast = sandbox.spy(Events.toast, 'emit');
        const saved = { ...project, etag: '"saved"' };

        expect(await withPromotionVersion(repository, project, sandbox.stub().resolves(saved))).to.equal(saved);

        expect(toast.calledWithMatch({ variant: 'warning' })).to.be.true;
        expect(sessionStorage.getItem('mas.pendingPromotionAudit')).to.be.null;
    });

    it('resolves a saved promo variation to its project', async () => {
        const variation = {
            id: 'variation',
            path: '/content/dam/mas/acom/en_US/promotions/launch/card',
            fields: [{ name: 'tags', values: ['mas:promotion/launch'] }],
        };

        await withPromotionVersion(repository, variation, sandbox.stub().resolves(variation));

        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.include({
            projectId: project.id,
            targetId: variation.id,
            beforeVersionId: 'before-version',
        });
    });

    it('loads version history through the configured endpoint', async () => {
        await listPromotionHistory(project.id, { query: 'Title' });

        expect(fetchStub.firstCall.args[0]).to.equal('https://studio.example/api/promo-history-list');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({ projectId: project.id, query: 'Title' });
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

        expect(fetchStub.callCount).to.equal(3);
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

        expect(JSON.parse(fetchStub.firstCall.args[1].body).projectId).to.equal(newProject.id);
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
});
