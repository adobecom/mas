import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { MasRepository } from '../src/mas-repository.js';
import Store from '../src/store.js';
import { STAGED, COLLECTION_MODEL_PATH } from '../src/constants.js';

describe('MasRepository — staged tag auto-clear on publish', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
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
                        save: sandbox.stub().callsFake((fragment) => Promise.resolve({ ...fragment })),
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

        it('leaves the staged tag untouched when the publish call fails', async () => {
            const repo = makeRepo();
            repo.aem.sites.cf.fragments.publish = sandbox.stub().rejects(new Error('network down'));
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
            expect(saved.newTags).to.deep.equal(['mas:studio/other']);
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
