import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { MasRepository } from '../src/mas-repository.js';
import { Fragment } from '../src/aem/fragment.js';
import { MasReferenceDiagnosisDialog } from '../src/publish/mas-reference-diagnosis-dialog.js';
import Store from '../src/store.js';
import Events from '../src/events.js';
import { STAGED, COLLECTION_MODEL_PATH, OPERATIONS } from '../src/constants.js';
import { AEM, buildFragmentSavePayload } from '../src/aem/aem.js';

describe('MasRepository — staged tag auto-clear on publish', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(MasReferenceDiagnosisDialog, 'confirmFor').resolves(true);
        sandbox.stub(Events.toast, 'emit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    const makeRepo = () => {
        const repo = new MasRepository();
        repo.operation = { set: sandbox.stub() };
        repo.aem = {
            sites: {
                cf: {
                    fragments: {
                        publish: sandbox.stub().resolves(),
                        publishFragments: sandbox.stub().resolves(),
                        save: sandbox.stub().callsFake((fragment) =>
                            Promise.resolve({
                                ...fragment,
                                tags: fragment.newTags?.map((id) => ({ id })) ?? fragment.tags,
                            }),
                        ),
                    },
                },
            },
        };
        sandbox.stub(repo, 'processError');
        return repo;
    };

    const stagedCardFragment = (overrides = {}) => ({
        id: 'card-1',
        path: '/content/dam/mas/sandbox/en_US/card-1',
        etag: 'etag-1',
        title: 'Card 1',
        fields: [{ name: 'tags', type: 'tag', multiple: true, values: [STAGED.TAG, 'other-tag'] }],
        ...overrides,
    });

    const nonStagedCardFragment = (overrides = {}) => ({
        id: 'card-2',
        path: '/content/dam/mas/sandbox/en_US/card-2',
        etag: 'etag-2',
        title: 'Card 2',
        fields: [{ name: 'tags', type: 'tag', multiple: true, values: ['other-tag'] }],
        ...overrides,
    });

    const stagedCollectionFragment = (overrides = {}) => ({
        id: 'coll-1',
        path: '/content/dam/mas/sandbox/en_US/collection-1',
        etag: 'etag-1',
        title: 'Collection 1',
        model: { path: COLLECTION_MODEL_PATH },
        tags: [
            { id: STAGED.TAG, title: 'Staged' },
            { id: 'mas:studio/other', title: 'Other' },
        ],
        ...overrides,
    });

    describe('publishFragment (single publish, used by both editor UI paths)', () => {
        it('skips reference diagnosis only when explicitly requested for internal publishing', async () => {
            const repo = makeRepo();
            MasReferenceDiagnosisDialog.confirmFor.resolves(false);

            const result = await repo.publishFragment(nonStagedCardFragment(), { skipReferenceDiagnosis: true }, false);

            expect(result).to.be.true;
            expect(MasReferenceDiagnosisDialog.confirmFor.called).to.be.false;
            expect(repo.aem.sites.cf.fragments.publish.calledOnce).to.be.true;
        });

        it('does not publish or clear staged tags when reference diagnosis is cancelled', async () => {
            const repo = makeRepo();
            const fragment = stagedCardFragment();
            let decide;
            MasReferenceDiagnosisDialog.confirmFor.returns(new Promise((resolve) => (decide = resolve)));

            const publishing = repo.publishFragment(fragment, {}, false);
            const startedBeforeDecision = repo.operation.set.called;
            decide(false);
            const result = await publishing;

            expect(result).to.be.false;
            expect(startedBeforeDecision).to.be.false;
            expect(repo.operation.set.calledWith(OPERATIONS.PUBLISH)).to.be.false;
            expect(repo.aem.sites.cf.fragments.publish.called).to.be.false;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(fragment.fields[0].values).to.deep.equal([STAGED.TAG, 'other-tag']);
        });

        it('does not open a second diagnosis while a publish attempt is being confirmed', async () => {
            const repo = makeRepo();
            let decide;
            MasReferenceDiagnosisDialog.confirmFor.onFirstCall().returns(new Promise((resolve) => (decide = resolve)));
            MasReferenceDiagnosisDialog.confirmFor.onSecondCall().resolves(false);

            const firstPublish = repo.publishFragment(nonStagedCardFragment());
            const secondPublish = await repo.bulkPublishFragments(['card-2']);
            decide(false);
            await firstPublish;

            expect(secondPublish).to.be.false;
            expect(MasReferenceDiagnosisDialog.confirmFor.calledOnce).to.be.true;
        });

        it('clears and persists the staged tag after a successful publish', async () => {
            const repo = makeRepo();
            const fragment = stagedCardFragment();

            const result = await repo.publishFragment(fragment);

            expect(result).to.be.true;
            expect(repo.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            const saved = repo.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(saved.isStaged).to.be.false;
            expect(saved.getField('tags').values).to.deep.equal(['other-tag']);
        });

        it('does not save or mutate anything when the fragment is not staged', async () => {
            const repo = makeRepo();
            const fragment = nonStagedCardFragment();

            const result = await repo.publishFragment(fragment);

            expect(result).to.be.true;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(fragment.fields[0].values).to.deep.equal(['other-tag']);
        });

        it('keeps a successful publish successful when post-publish cleanup has no confirmed saved fragment', async () => {
            const repo = makeRepo();
            repo.aem.sites.cf.fragments.save.resolves(null);

            const result = await repo.publishFragment(stagedCardFragment());

            expect(result).to.be.true;
            expect(repo.aem.sites.cf.fragments.publish.calledOnce).to.be.true;
            expect(repo.aem.sites.cf.fragments.save.calledOnce).to.be.true;
        });

        it('leaves the staged tag untouched when the publish call fails', async () => {
            const repo = makeRepo();
            repo.aem.sites.cf.fragments.publish = sandbox.stub().rejects(new Error('network down'));
            repo.clearStagedTag = sandbox.stub().resolves();
            const fragment = stagedCardFragment();

            const result = await repo.publishFragment(fragment);

            expect(result).to.be.false;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(fragment.fields[0].values).to.deep.equal([STAGED.TAG, 'other-tag']);
        });

        it('clears the staged tag on a collection-model fragment (native tags representation)', async () => {
            const repo = makeRepo();
            const fragment = stagedCollectionFragment();

            const result = await repo.publishFragment(fragment);

            expect(result).to.be.true;
            expect(repo.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            const saved = repo.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(saved.isStaged).to.be.false;
            expect(saved.tags.map((tag) => tag.id)).to.deep.equal(['mas:studio/other']);
        });
    });

    describe('clearStagedTag with an expected revision', () => {
        function useSaveTransport(repo, raw, { afterSave } = {}) {
            const aem = new AEM('test', 'https://author.example');
            const current = structuredClone(raw);
            const fetch = sandbox.stub(window, 'fetch').callsFake(async (url, options = {}) => {
                if (url.endsWith('/tags')) {
                    if (options.method === 'DELETE') current.tags = [];
                    if (options.method === 'PUT') {
                        current.tags = JSON.parse(options.body).tags.map((id) => ({ id, title: id }));
                    }
                    return new Response(JSON.stringify({ tags: current.tags }), { headers: { Etag: current.etag } });
                }
                if (options.method === 'PUT') {
                    expect(options.headers['If-Match']).to.equal(raw.etag);
                    Object.assign(current, JSON.parse(options.body), { etag: 'saved-revision' });
                    if (afterSave) Object.assign(current, afterSave);
                    return new Response('{}');
                }
                return new Response(JSON.stringify(current), { headers: { Etag: current.etag } });
            });
            repo.aem = aem;
            return { fetch, getSaved: () => current };
        }

        it('uses the same normalized payload as the actual AEM reference save', async () => {
            const raw = stagedCardFragment({
                fields: [
                    { name: 'tags', type: 'tag', multiple: true, values: [STAGED.TAG] },
                    { name: 'references', type: 'content-fragment', multiple: true, values: ['', null, '/content/card'] },
                    { name: 'text', values: [''] },
                ],
            });
            const repo = makeRepo();
            const transport = useSaveTransport(repo, raw);
            const fragment = new Fragment(raw);

            await repo.clearStagedTag(fragment, { expectedEtag: raw.etag });

            expect(fragment.getField('references').values).to.deep.equal(['/content/card']);
            const put = transport.fetch.getCalls().find(({ args }) => args[1].method === 'PUT' && !args[0].endsWith('/tags'));
            expect(JSON.parse(put.args[1].body)).to.deep.equal(JSON.parse(JSON.stringify(buildFragmentSavePayload(fragment))));
            expect(fragment.getField('text').values).to.deep.equal(['']);
        });

        for (const remaining of [[], ['mas:studio/other']]) {
            it(`accepts the native tags actually applied when ${remaining.length} tags remain`, async () => {
                const raw = stagedCardFragment({
                    tags: [{ id: STAGED.TAG }, ...remaining.map((id) => ({ id }))],
                    fields: [{ name: 'tags', type: 'tag', multiple: true, values: [STAGED.TAG, ...remaining] }],
                });
                const repo = makeRepo();
                const transport = useSaveTransport(repo, raw);
                const fragment = new Fragment(raw);

                await repo.clearStagedTag(fragment, { expectedEtag: raw.etag });

                expect(fragment.tags.map(({ id }) => id)).to.deep.equal(remaining);
                expect(fragment.isStaged).to.be.false;
                expect(transport.getSaved().etag).to.equal('saved-revision');
            });
        }

        it('accepts an AEM empty description default without claiming a concurrent edit', async () => {
            const raw = stagedCardFragment();
            const repo = makeRepo();
            useSaveTransport(repo, raw, { afterSave: { description: '' } });

            await repo.clearStagedTag(new Fragment(raw), { expectedEtag: raw.etag });
        });

        it('still rejects another authors revision returned after a successful PUT', async () => {
            const raw = stagedCardFragment();
            const repo = makeRepo();
            useSaveTransport(repo, raw, { afterSave: { title: 'Concurrent edit', etag: 'another-revision' } });
            let failure;

            try {
                await repo.clearStagedTag(new Fragment(raw), { expectedEtag: raw.etag });
            } catch (error) {
                failure = error;
            }

            expect(failure?.message).to.include('changed');
        });

        for (const failedMethod of ['GET', 'DELETE', 'PUT']) {
            it(`surfaces a failed native-tag ${failedMethod} instead of reporting save success`, async () => {
                const raw = stagedCardFragment({
                    tags: [{ id: STAGED.TAG }],
                    fields: [{ name: 'tags', type: 'tag', multiple: true, values: [STAGED.TAG] }],
                });
                const repo = makeRepo();
                const transport = useSaveTransport(repo, raw);
                transport.fetch.callsFake(async (url, options = {}) => {
                    if (url.endsWith('/tags') && options.method === failedMethod) return new Response('{}', { status: 403 });
                    if (url.endsWith('/tags')) return new Response('{}', { headers: { Etag: 'tag-revision' } });
                    if (options.method === 'PUT') {
                        return new Response('{}');
                    }
                    return new Response(JSON.stringify({ ...raw, etag: 'new-revision' }), {
                        headers: { Etag: 'new-revision' },
                    });
                });
                if (failedMethod === 'PUT') raw.fields[0].values.push('other-tag');
                let failure;

                try {
                    await repo.clearStagedTag(new Fragment(raw), { expectedEtag: raw.etag });
                } catch (error) {
                    failure = error;
                }

                expect(failure?.message).to.include('403');
            });
        }

        it('does not write native tags when their revision cannot be confirmed', async () => {
            const repo = makeRepo();
            const fetch = sandbox.stub(window, 'fetch').resolves(new Response('{}'));
            const aem = new AEM('test', 'https://author.example');
            let failure;

            try {
                await aem.saveTags({ id: 'card-1', newTags: [] });
            } catch (error) {
                failure = error;
            }

            expect(failure?.message).to.include('revision');
            expect(fetch.callCount).to.equal(1);
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
        });

        for (const failingRequest of ['read', 'write']) {
            it(`surfaces native-tag ${failingRequest} network errors`, async () => {
                const fetch = sandbox.stub(window, 'fetch');
                if (failingRequest === 'write') {
                    fetch.onFirstCall().resolves(new Response('{}', { headers: { Etag: 'tags-revision' } }));
                    fetch.onSecondCall().rejects(new Error('Connection lost'));
                } else {
                    fetch.rejects(new Error('Connection lost'));
                }
                const aem = new AEM('test', 'https://author.example');
                let failure;
                try {
                    await aem.saveTags({ id: 'card-1', newTags: [] });
                } catch (error) {
                    failure = error;
                }
                expect(failure?.message).to.include('Connection lost');
            });
        }

        for (const change of ['id', 'path', 'etag']) {
            it(`rejects an unconfirmed saved ${change}`, async () => {
                const repo = makeRepo();
                repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => ({
                    ...fragment,
                    tags: fragment.newTags.map((id) => ({ id })),
                    [change]: change === 'etag' ? null : 'another-fragment',
                }));
                let failure;

                try {
                    await repo.clearStagedTag(stagedCardFragment(), { expectedEtag: 'etag-1' });
                } catch (error) {
                    failure = error;
                }

                expect(failure?.message).to.include('changed');
            });
        }

        it('saves the supplied revision without borrowing a newer ETag', async () => {
            const repo = makeRepo();

            await repo.clearStagedTag(stagedCardFragment(), { expectedEtag: 'expected-revision' });

            const [fragment, options] = repo.aem.sites.cf.fragments.save.firstCall.args;
            expect(fragment.etag).to.equal('expected-revision');
            expect(options.refetchEtag).to.be.false;
        });

        it('propagates save conflicts so a pre-publish operation cannot continue', async () => {
            const repo = makeRepo();
            const conflict = new Error('Fragment was modified by another user');
            repo.aem.sites.cf.fragments.save.rejects(conflict);
            let failure;

            try {
                await repo.clearStagedTag(stagedCardFragment(), { expectedEtag: 'etag-1' });
            } catch (error) {
                failure = error;
            }

            expect(failure).to.equal(conflict);
        });

        for (const [change, modify] of [
            ['title', () => ({ title: 'Concurrent title' })],
            ['description', () => ({ description: 'Concurrent description' })],
            ['field values', (fragment) => ({ fields: [{ ...fragment.fields[0], values: ['concurrent-tag'] }] })],
            [
                'added fields',
                (fragment) => ({ fields: [...fragment.fields, { name: 'title', values: ['Concurrent content'] }] }),
            ],
            ['native tags', () => ({ tags: [{ id: 'mas:concurrent-tag', title: 'Concurrent tag' }] })],
        ]) {
            it(`rejects a readback containing concurrent changes to ${change}`, async () => {
                const repo = makeRepo();
                repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => ({
                    ...fragment,
                    ...modify(fragment),
                    etag: 'etag-3',
                }));
                let failure;

                try {
                    await repo.clearStagedTag(stagedCardFragment(), { expectedEtag: 'etag-1' });
                } catch (error) {
                    failure = error;
                }

                expect(failure?.message).to.include('changed');
            });
        }

        it('propagates an unconfirmed save instead of continuing pre-publish work', async () => {
            const repo = makeRepo();
            repo.aem.sites.cf.fragments.save.resolves(null);
            let failure;

            try {
                await repo.clearStagedTag(stagedCardFragment(), { expectedEtag: 'etag-1' });
            } catch (error) {
                failure = error;
            }

            expect(failure?.message).to.include('Could not confirm');
        });

        it('retains the revision from its own staged-tag save', async () => {
            const repo = makeRepo();
            const fragment = new Fragment(stagedCardFragment());
            repo.aem.sites.cf.fragments.save.callsFake(async (saved) => ({
                ...saved,
                tags: saved.newTags.map((id) => ({ id })),
                etag: 'etag-2',
            }));

            await repo.clearStagedTag(fragment, { expectedEtag: fragment.etag });

            expect(fragment.etag).to.equal('etag-2');
            expect(fragment.isStaged).to.be.false;
        });

        it('preserves the existing post-publish refresh policy when no revision is supplied', async () => {
            const repo = makeRepo();

            await repo.clearStagedTag(stagedCardFragment());

            expect(repo.aem.sites.cf.fragments.save.firstCall.args[1].refetchEtag).to.be.true;
        });
    });

    describe('bulkPublishFragments (multi-select publish)', () => {
        let originalStoreData;

        afterEach(() => {
            Store.fragments.list.data = originalStoreData;
        });

        const setListStores = (fragments) => {
            originalStoreData = Store.fragments.list.data;
            Store.fragments.list.data = {
                get: () => fragments.map((fragment) => ({ get: () => fragment })),
            };
        };

        it('does not publish or clear staged tags when bulk reference diagnosis is cancelled', async () => {
            const repo = makeRepo();
            const staged = stagedCardFragment();
            setListStores([staged]);
            let decide;
            MasReferenceDiagnosisDialog.confirmFor.returns(new Promise((resolve) => (decide = resolve)));

            const publishing = repo.bulkPublishFragments([staged.id]);
            const startedBeforeDecision = repo.operation.set.called;
            const notifiedBeforeDecision = Events.toast.emit.called;
            decide(false);
            const result = await publishing;

            expect(result).to.be.false;
            expect(startedBeforeDecision).to.be.false;
            expect(notifiedBeforeDecision).to.be.false;
            expect(Events.toast.emit.called).to.be.false;
            expect(repo.operation.set.calledWith(OPERATIONS.PUBLISH)).to.be.false;
            expect(repo.aem.sites.cf.fragments.publishFragments.called).to.be.false;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(staged.fields[0].values).to.deep.equal([STAGED.TAG, 'other-tag']);
        });

        it('clears the staged tag once for each successfully published staged fragment', async () => {
            const repo = makeRepo();
            sandbox.stub(repo, 'refreshFragment').resolves();
            const staged1 = stagedCardFragment({ id: 'card-1' });
            const staged2 = stagedCardFragment({ id: 'card-3' });
            setListStores([staged1, staged2]);

            const result = await repo.bulkPublishFragments(['card-1', 'card-3'], { withToast: false });

            expect(result).to.be.true;
            expect(repo.aem.sites.cf.fragments.save.calledTwice).to.be.true;
            const saveCalls = repo.aem.sites.cf.fragments.save.getCalls();
            const savedTagsValues = saveCalls.map((call) => call.args[0].getField('tags').values);
            expect(savedTagsValues).to.deep.equal([['other-tag'], ['other-tag']]);
        });

        it('skips fragments that are not staged within a mixed batch', async () => {
            const repo = makeRepo();
            sandbox.stub(repo, 'refreshFragment').resolves();
            const staged = stagedCardFragment({ id: 'card-1' });
            const notStaged = nonStagedCardFragment({ id: 'card-2' });
            setListStores([staged, notStaged]);

            await repo.bulkPublishFragments(['card-1', 'card-2'], { withToast: false });

            expect(repo.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            expect(repo.aem.sites.cf.fragments.save.firstCall.args[0].id).to.equal('card-1');
        });

        it('leaves staged tags untouched when the bulk publish call itself fails', async () => {
            const repo = makeRepo();
            repo.aem.sites.cf.fragments.publishFragments = sandbox.stub().rejects(new Error('network down'));
            sandbox.stub(repo, 'refreshFragment').resolves();
            sandbox.stub(repo, 'clearStagedTag').resolves();
            const staged1 = stagedCardFragment({ id: 'card-1' });
            const staged2 = stagedCardFragment({ id: 'card-3' });
            setListStores([staged1, staged2]);

            const result = await repo.bulkPublishFragments(['card-1', 'card-3'], { withToast: false });

            expect(result).to.be.false;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(staged1.fields[0].values).to.deep.equal([STAGED.TAG, 'other-tag']);
            expect(staged2.fields[0].values).to.deep.equal([STAGED.TAG, 'other-tag']);
        });
    });
});
