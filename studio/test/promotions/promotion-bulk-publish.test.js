import { expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, STAGED } from '../../src/constants.js';
import { AEM } from '../../src/aem/aem.js';
import { MasRepository } from '../../src/mas-repository.js';
import { getPromotionPublishPlan, publishPromotionProject } from '../../src/promotions/promotion-publish-utils.js';
import { makeSearchStub } from '../helpers/aem-tag-fetch.js';

describe('promotion Bulk Publish integration', () => {
    let sandbox;
    let repository;
    let promotion;
    let plan;
    let meta;
    let fetchStub;
    let previousToken;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        previousToken = sessionStorage.getItem('masAccessToken');
        sessionStorage.setItem('masAccessToken', 'test-token');
        meta = document.createElement('meta');
        meta.name = 'io-base-url';
        meta.content = 'https://io.example';
        document.head.append(meta);
        Store.bulkPublishProjects.publishing.set({});
        promotion = { id: 'promotion-1', title: 'Sale', path: '/content/dam/mas/promotions/sale', etag: '"1"', fields: [] };
        plan = {
            promotionId: promotion.id,
            targetCount: 2,
            warnings: [],
            groups: ['acom', 'acom-cc'].map((surface) => ({
                surface,
                variations: [
                    {
                        id: `variation-${surface}`,
                        path: `/content/dam/mas/${surface}/en_US/promotions/sale/card`,
                        status: 'MODIFIED',
                        etag: '"1"',
                        fields: [],
                        model: { path: COLLECTION_MODEL_PATH },
                    },
                ],
            })),
        };
        const fragments = {
            getWithEtag: sandbox.stub().callsFake(async (id) => {
                if (id === promotion.id) return promotion;
                return plan.groups.flatMap((group) => group.variations).find((variation) => variation.id === id);
            }),
            publish: sandbox.stub().resolves({ items: [{ path: promotion.path, status: 'SUCCESS_TRIGGERED' }] }),
            publishFragments: sandbox.stub(),
            create: sandbox.stub().callsFake(async (payload) => ({
                ...payload,
                id: `project-${payload.parentPath.split('/').at(-2)}`,
                path: `${payload.parentPath}/${payload.name}`,
                status: 'DRAFT',
            })),
        };
        repository = {
            aem: { baseUrl: 'https://author.example', sites: { cf: { fragments } } },
            getBulkPublishParentPath: (surface) => `/content/dam/mas/${surface}/bulk-publish-projects`,
            operation: { set: sandbox.stub() },
            clearStagedTag: sandbox.stub().resolves(),
            refreshFragment: sandbox.stub().callsFake(async (store) => {
                const raw = store.get();
                store.refreshFrom({
                    ...raw,
                    fields: raw.fields.map((field) => (field.name === 'status' ? { ...field, values: ['Published'] } : field)),
                });
            }),
        };
        fetchStub = sandbox
            .stub(window, 'fetch')
            .resolves(new Response(JSON.stringify({ accepted: true, activationId: 'activation-1' }), { status: 202 }));
        fetchStub.callsFake(
            async () => new Response(JSON.stringify({ accepted: true, activationId: 'activation-1' }), { status: 202 }),
        );
    });

    afterEach(async () => {
        await waitUntil(() => Object.keys(Store.bulkPublishProjects.publishing.get()).length === 0);
        meta.remove();
        if (previousToken === null) sessionStorage.removeItem('masAccessToken');
        else sessionStorage.setItem('masAccessToken', previousToken);
        sandbox.restore();
    });

    it('creates every surface before publishing the promotion and dispatching each actual project ID', async () => {
        const result = await publishPromotionProject(repository, promotion, { plan });
        const { create, publish, publishFragments } = repository.aem.sites.cf.fragments;
        expect(create.callCount).to.equal(2);
        expect(create.secondCall.calledBefore(publish.firstCall)).to.be.true;
        expect(publish.firstCall.calledBefore(fetchStub.firstCall)).to.be.true;
        expect(result.promotion.status).to.equal('accepted');
        expect(result.projects.map((project) => project.dispatchStatus)).to.deep.equal(['accepted', 'accepted']);
        expect(fetchStub.getCalls().map(({ args }) => JSON.parse(args[1].body).projectId)).to.deep.equal([
            'project-acom',
            'project-acom-cc',
        ]);
        expect(publishFragments.called).to.be.false;
    });

    it('preserves explicit surface paths, collection metadata and a shared title timestamp', async () => {
        await publishPromotionProject(repository, promotion, { plan });
        const payloads = repository.aem.sites.cf.fragments.create.getCalls().map(({ args }) => args[0]);
        expect(payloads[0].title).to.equal(payloads[1].title);
        for (const [index, payload] of payloads.entries()) {
            const fields = Object.fromEntries(payload.fields.map((field) => [field.name, field.values]));
            expect(fields.fragments).to.deep.equal([plan.groups[index].variations[0].path]);
            expect(fields.locales).to.deep.equal([]);
            expect(fields.status).to.deep.equal(['Draft']);
            expect(JSON.parse(fields.items[0])).to.deep.equal([
                {
                    path: fields.fragments[0],
                    type: 'collection',
                    status: 'valid',
                },
            ]);
        }
    });

    it('disables reference publication in every promotion Bulk Publish request', async () => {
        await publishPromotionProject(repository, promotion, { plan });

        expect(fetchStub.getCalls().map(({ args }) => JSON.parse(args[1].body).publishReferences)).to.deep.equal([
            false,
            false,
        ]);
    });

    for (const concurrentEdit of [false, true]) {
        it(
            concurrentEdit
                ? 'rejects a staged-save conflict without overwriting newer variation content'
                : 'clears staged tags using the latest variation body and its matching ETag',
            async () => {
                const variation = plan.groups[0].variations[0];
                variation.model.path = CARD_MODEL_PATH;
                variation.fields = [
                    { name: 'tags', type: 'tag', multiple: true, values: [STAGED.TAG] },
                    { name: 'cardTitle', type: 'text', multiple: false, values: ['OLD CONTENT'] },
                ];
                let latest = {
                    ...structuredClone(variation),
                    etag: '"2"',
                    fields: [structuredClone(variation.fields[0]), { ...variation.fields[1], values: ['NEW SAVED CONTENT'] }],
                };
                const aem = new AEM('test', repository.aem.baseUrl);
                sandbox.stub(aem, 'getFragmentWithEtag').callsFake(async () => structuredClone(latest));
                sandbox.stub(aem, 'saveTags').resolves();
                sandbox.stub(aem, 'pollUpdatedFragment').callsFake(async () => structuredClone(latest));
                repository.aem.sites.cf.fragments.getWithEtag.withArgs(variation.id).callsFake(async () => {
                    const snapshot = structuredClone(latest);
                    if (concurrentEdit) {
                        latest = {
                            ...latest,
                            etag: '"concurrent"',
                            fields: latest.fields.map((field) =>
                                field.name === 'cardTitle' ? { ...field, values: ['NEWER CONCURRENT CONTENT'] } : field,
                            ),
                        };
                    }
                    return snapshot;
                });
                repository.aem.sites.cf.fragments.save = aem.saveFragment.bind(aem);
                repository.clearStagedTag = MasRepository.prototype.clearStagedTag.bind(repository);
                repository.processError = sandbox.stub();
                fetchStub.callsFake(async (url, options) => {
                    if (options.method === 'PUT') {
                        if (options.headers['If-Match'] !== latest.etag) return new Response('{}', { status: 412 });
                        latest = { ...latest, ...JSON.parse(options.body), etag: '"3"' };
                        return new Response('{}', { status: 200 });
                    }
                    return new Response(JSON.stringify({ accepted: true }), { status: 202 });
                });

                const result = await publishPromotionProject(repository, promotion, { plan });

                expect(result.promotion.status).to.equal(concurrentEdit ? 'not-started' : 'accepted');
                expect(latest.fields.find((field) => field.name === 'cardTitle').values).to.deep.equal([
                    concurrentEdit ? 'NEWER CONCURRENT CONTENT' : 'NEW SAVED CONTENT',
                ]);
                expect(latest.fields.find((field) => field.name === 'tags').values).to.deep.equal(
                    concurrentEdit ? [STAGED.TAG] : [],
                );
                if (concurrentEdit) expect(fetchStub.calledWith('https://io.example/bulk-publish')).to.be.false;
                const put = fetchStub.getCalls().find(({ args }) => args[1].method === 'PUT');
                expect(put.args[1].headers['If-Match']).to.equal('"2"');
                expect(aem.getFragmentWithEtag.called).to.be.false;
            },
        );
    }

    it('keeps content-invalid variations in the project', async () => {
        plan.groups[0].variations[0].validationStatus = [{ message: 'Invalid content' }];
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.projects).to.have.lengthOf(2);
        expect(
            repository.aem.sites.cf.fragments.create.firstCall.args[0].fields.find((field) => field.name === 'fragments')
                .values,
        ).to.deep.equal([plan.groups[0].variations[0].path]);
    });

    it('stops without staged changes or publishing if any project cannot be created or read back', async () => {
        repository.aem.sites.cf.fragments.create.onSecondCall().rejects(new Error('Readback failed'));
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.projects).to.have.lengthOf(1);
        expect(result.projects[0].id).to.equal('project-acom');
        expect(result.promotion.status).to.equal('not-started');
        expect(result.error).to.include('Readback failed');
        expect(repository.aem.sites.cf.fragments.publish.called).to.be.false;
        expect(repository.clearStagedTag.called).to.be.false;
        expect(fetchStub.called).to.be.false;
    });

    for (const [status, expected] of [
        ['ERROR_INVALID', 'failed'],
        ['UNRECOGNIZED', 'unknown'],
    ]) {
        it(`does not dispatch variations when the promotion item returns ${status}`, async () => {
            repository.aem.sites.cf.fragments.publish.resolves({ items: [{ path: promotion.path, status }] });
            const result = await publishPromotionProject(repository, promotion, { plan });
            expect(result.promotion.status).to.equal(expected);
            expect(result.projects).to.have.lengthOf(2);
            expect(fetchStub.called).to.be.false;
        });
    }

    it('reports an absent promotion response item as unknown without dispatching', async () => {
        repository.aem.sites.cf.fragments.publish.resolves({ items: [] });
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.promotion.status).to.equal('unknown');
        expect(fetchStub.called).to.be.false;
    });

    it('publishes only the promotion when the checkbox is unchecked', async () => {
        const result = await publishPromotionProject(repository, promotion, { plan, publishVariations: false });
        expect(result.promotion.status).to.equal('accepted');
        expect(result.projects).to.deep.equal([]);
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
        expect(fetchStub.called).to.be.false;
    });

    it('does not create projects when discovery really has no targets', async () => {
        const result = await publishPromotionProject(repository, promotion, { plan: { ...plan, targetCount: 0, groups: [] } });
        expect(result.promotion.status).to.equal('accepted');
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
    });

    it('reports a dispatch failure per surface without undoing accepted work or replaying requests', async () => {
        fetchStub.onFirstCall().resolves(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.promotion.status).to.equal('accepted');
        expect(result.projects.map((project) => project.dispatchStatus)).to.deep.equal(['failed', 'accepted']);
        expect(fetchStub.callCount).to.equal(2);
    });

    it('rejects missing IO configuration before creating a project', async () => {
        meta.remove();
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.error).to.include('ioBaseUrl');
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
        expect(repository.aem.sites.cf.fragments.publish.called).to.be.false;
    });

    it('can publish only the promotion without Bulk Publish configuration', async () => {
        meta.remove();
        const result = await publishPromotionProject(repository, promotion, { plan, publishVariations: false });
        expect(result.promotion.status).to.equal('accepted');
        expect(fetchStub.called).to.be.false;
    });

    it('does not create projects when the promotion has changed since confirmation', async () => {
        repository.aem.sites.cf.fragments.getWithEtag.resolves({ ...promotion, etag: '"2"' });
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.error).to.include('has changed');
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
    });

    it('stops before project creation if the promotion revision cannot be confirmed', async () => {
        repository.aem.sites.cf.fragments.getWithEtag.resolves({ ...promotion, etag: null });

        const result = await publishPromotionProject(repository, promotion, { plan });

        expect(result.error).to.include('revision');
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
    });

    it('does not publish when a fresh variation has no revision', async () => {
        const variation = plan.groups[0].variations[0];
        repository.aem.sites.cf.fragments.getWithEtag.withArgs(variation.id).resolves({ ...variation, etag: null });

        const result = await publishPromotionProject(repository, promotion, { plan });

        expect(result.error).to.include('latest revision');
        expect(repository.aem.sites.cf.fragments.publish.called).to.be.false;
        expect(fetchStub.called).to.be.false;
    });

    it('uses only the promotion revision produced by its own staged-tag save', async () => {
        repository.clearStagedTag.callsFake(async (fragment) => {
            if (fragment.id === promotion.id) fragment.etag = '"own-stage-save"';
        });

        await publishPromotionProject(repository, promotion, { plan });

        expect(repository.aem.sites.cf.fragments.publish.firstCall.args[0].etag).to.equal('"own-stage-save"');
        expect(
            repository.aem.sites.cf.fragments.getWithEtag.getCalls().filter(({ args }) => args[0] === promotion.id),
        ).to.have.lengthOf(1);
    });

    it('cannot publish a different promotion revision after project creation', async () => {
        let serverRevision = '"1"';
        const { getWithEtag, create } = repository.aem.sites.cf.fragments;
        getWithEtag.withArgs(promotion.id).callsFake(async () => ({ ...promotion, etag: serverRevision }));
        create.onSecondCall().callsFake(async (payload) => {
            serverRevision = '"2"';
            return {
                ...payload,
                id: 'project-acom-cc',
                path: `${payload.parentPath}/${payload.name}`,
                status: 'DRAFT',
            };
        });
        const aem = new AEM('test', repository.aem.baseUrl);
        repository.aem.sites.cf.fragments.publish = aem.publishFragment.bind(aem);
        fetchStub.callsFake(async (url, options) => {
            if (url === aem.cfPublishUrl) {
                if (options.headers['If-Match'] !== serverRevision) return new Response('{}', { status: 412 });
                return new Response(JSON.stringify({ items: [{ path: promotion.path, status: 'SUCCESS_TRIGGERED' }] }));
            }
            return new Response(JSON.stringify({ accepted: true }), { status: 202 });
        });

        const result = await publishPromotionProject(repository, promotion, { plan });

        expect(result.promotion.status).not.to.equal('accepted');
        expect(result.error).to.include('412');
        expect(fetchStub.calledWith('https://io.example/bulk-publish')).to.be.false;
        expect(fetchStub.firstCall.args[1].headers['If-Match']).to.equal('"1"');
    });

    it('does not replay a promotion request whose response was lost', async () => {
        repository.aem.sites.cf.fragments.publish.rejects(new Error('Response lost'));
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.promotion.status).to.equal('unknown');
        expect(result.projects).to.have.lengthOf(2);
        expect(repository.aem.sites.cf.fragments.publish.callCount).to.equal(1);
        expect(fetchStub.called).to.be.false;
    });

    it('does not invent a project link or publish after a malformed creation response', async () => {
        repository.aem.sites.cf.fragments.create.resolves({ fields: [] });
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.projects).to.deep.equal([]);
        expect(result.error).to.include('Could not confirm');
        expect(repository.aem.sites.cf.fragments.publish.called).to.be.false;
    });

    it('does not replay a dispatch response without confirmed acceptance', async () => {
        plan.groups = [plan.groups[0]];
        fetchStub.callsFake(async () => new Response('{}', { status: 202 }));
        const result = await publishPromotionProject(repository, promotion, { plan });
        expect(result.projects[0].dispatchStatus).to.equal('unknown');
        expect(fetchStub.callCount).to.equal(1);
    });

    it('discovers grouped and MODIFIED variations without filtering validation errors', async () => {
        const path = '/content/dam/mas/acom/en_US/promotions/sale/card';
        repository.aem.sites.cf.fragments.search = makeSearchStub(sandbox, {
            '/content/dam/mas/acom/en_US/promotions/sale': [
                { id: 'one', path, status: 'MODIFIED', validationStatus: [{ message: 'Invalid content' }] },
                { id: 'published', path: `${path}-published`, status: 'PUBLISHED' },
            ],
            [`${path}/pzn`]: [{ id: 'grouped', path: `${path}/pzn/group-1`, status: 'DRAFT' }],
        });
        const result = await getPromotionPublishPlan(repository.aem, {
            ...promotion,
            tags: [{ id: 'mas:promotion/sale' }],
            getFieldValues: () => ['/content/dam/mas/acom/en_US/card'],
        });
        expect(result.targetCount).to.equal(2);
        expect(result.groups[0].variations.map((variation) => variation.id)).to.deep.equal(['one', 'grouped']);
        expect(result.warnings).to.deep.equal([{ path, message: 'Invalid content' }]);
    });

    it('propagates discovery errors rather than treating them as no targets', async () => {
        repository.aem.sites.cf.fragments.search = sandbox.stub().throws(new Error('Discovery failed'));
        let error;
        try {
            await getPromotionPublishPlan(repository.aem, {
                ...promotion,
                tags: [{ id: 'mas:promotion/sale' }],
                getFieldValues: () => ['/content/dam/mas/acom/en_US/card'],
            });
        } catch (cause) {
            error = cause;
        }
        expect(error?.message).to.equal('Discovery failed');
    });
});
