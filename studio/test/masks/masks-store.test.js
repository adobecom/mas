import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Fragment } from '../../src/aem/fragment.js';
import { MasksStore } from '../../src/masks/masks-store.js';

const CARD_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';

function createAemMock(overrides = {}) {
    const fragments = {
        search: async function* () {
            yield [
                { id: 'm1', title: 'Mask One', path: '/content/dam/mas/acom/en_US/masks/m1', fields: [] },
                { id: 'm2', title: 'Mask Two', path: '/content/dam/mas/acom/en_US/masks/m2', fields: [] },
            ];
        },
        create: sinon.stub().resolves({ id: 'new-id', path: '/content/dam/mas/acom/en_US/masks/promo' }),
        getById: sinon.stub().callsFake(async (id) => ({ id, title: 'Loaded', path: 'p', fields: [] })),
        save: sinon.stub().callsFake(async (fragment) => ({ ...fragment })),
        delete: sinon.stub().resolves(),
        ...overrides.fragments,
    };
    return {
        sites: { cf: { fragments } },
        folders: { create: sinon.stub().resolves() },
        wait: sinon.stub().resolves(),
        saveTags: sinon.stub().resolves(),
        ...overrides,
    };
}

describe('MasksStore', () => {
    let store;

    beforeEach(() => {
        store = new MasksStore();
    });

    it('builds the masks folder path and tag id', () => {
        store.loadSurface('acom', 'en_US'); // sets surface/locale (no aem -> empty)
        expect(store.folderPath()).to.equal('/content/dam/mas/acom/en_US/masks');
        expect(store.maskTagId('Black Friday')).to.equal('mas:masks/acom/black-friday');
    });

    it('lists card fragments under the surface/locale masks folder', async () => {
        const aem = createAemMock();
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');
        const list = store.list.get();
        expect(list).to.have.length(2);
        expect(list[0]).to.be.instanceOf(Fragment);
        expect(list[0].title).to.equal('Mask One');
        expect(store.loading.get()).to.equal(false);
    });

    it('clears the list when surface or locale is missing', async () => {
        store.setAem(createAemMock());
        await store.loadSurface('', 'en_US');
        expect(store.list.get()).to.deep.equal([]);
    });

    it('records an error when listing fails', async () => {
        const aem = createAemMock({
            fragments: {
                search: async function* () {
                    throw new Error('boom');
                },
            },
        });
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');
        expect(store.error.get()).to.equal('Failed to load masks.');
        expect(store.list.get()).to.deep.equal([]);
    });

    it('creates a mask card fragment and assigns its identifying tag', async () => {
        const aem = createAemMock();
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');

        const id = await store.createMask({ name: 'Promo', title: 'Promo mask', fields: [] });

        expect(id).to.equal('new-id');
        const createArgs = aem.sites.cf.fragments.create.firstCall.args[0];
        expect(createArgs).to.include({
            name: 'promo',
            parentPath: '/content/dam/mas/acom/en_US/masks',
            modelId: CARD_MODEL_ID,
        });
        const tagged = aem.saveTags.firstCall.args[0];
        expect(tagged.newTags).to.deep.equal(['mas:masks/acom/promo']);
    });

    it('saves edits to an existing mask directly (no offer required)', async () => {
        const aem = createAemMock();
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');

        const fragment = new Fragment({ id: 'm1', title: 'Edited', path: 'p', fields: [], model: { path: '' } });
        const saved = await store.saveMask(fragment);

        expect(aem.sites.cf.fragments.save.calledOnce).to.equal(true);
        expect(saved).to.not.equal(false);
    });

    it('rejects saving a fragment that is not a card model', async () => {
        const aem = createAemMock();
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');

        const fragment = new Fragment({
            id: 'm1',
            title: 'X',
            path: 'p',
            fields: [],
            model: { path: '/conf/mas/settings/dam/cfm/models/collection' },
        });
        const result = await store.saveMask(fragment);

        expect(result).to.equal(false);
        expect(aem.sites.cf.fragments.save.called).to.equal(false);
        expect(store.error.get()).to.equal('Failed to save mask.');
    });

    it('resolves a mask by node name under the surface/locale masks folder', async () => {
        const aem = createAemMock({
            fragments: {
                getByPath: sinon
                    .stub()
                    .resolves({ id: 'm1', title: 'Promo', path: '/content/dam/mas/acom/en_US/masks/promo', fields: [] }),
            },
        });
        store.setAem(aem);
        const fragment = await store.loadMaskByName('promo', 'acom', 'en_US');
        expect(fragment).to.be.instanceOf(Fragment);
        expect(fragment.id).to.equal('m1');
        expect(aem.sites.cf.fragments.getByPath.calledWith('/content/dam/mas/acom/en_US/masks/promo')).to.equal(true);
    });

    it('returns null when a mask name cannot be resolved', async () => {
        const aem = createAemMock({
            fragments: { getByPath: sinon.stub().rejects(new Error('Fragment not found')) },
        });
        store.setAem(aem);
        expect(await store.loadMaskByName('missing', 'acom', 'en_US')).to.equal(null);
    });

    it('publishes a mask and returns the refreshed fragment', async () => {
        const published = { id: 'pub-id', title: 'Published', path: 'p', fields: [] };
        const aem = createAemMock({
            fragments: {
                ...createAemMock().sites.cf.fragments,
                getWithEtag: sinon.stub().resolves({ id: 'pub-id', etag: 'e' }),
                publish: sinon.stub().resolves(),
                getById: sinon.stub().resolves(published),
            },
        });
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');

        const result = await store.publishMask('pub-id');
        expect(aem.sites.cf.fragments.getWithEtag.calledWith('pub-id')).to.equal(true);
        expect(aem.sites.cf.fragments.publish.calledOnce).to.equal(true);
        expect(result).to.deep.equal(published);
        expect(store.loading.get()).to.equal(false);
    });

    it('returns false and records an error when publishing fails', async () => {
        const aem = createAemMock({
            fragments: {
                ...createAemMock().sites.cf.fragments,
                getWithEtag: sinon.stub().rejects(new Error('network error')),
            },
        });
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');

        const result = await store.publishMask('bad-id');
        expect(result).to.equal(false);
        expect(store.error.get()).to.equal('Failed to publish mask.');
        expect(store.loading.get()).to.equal(false);
    });

    it('deletes a mask via id', async () => {
        const aem = createAemMock();
        store.setAem(aem);
        await store.loadSurface('acom', 'en_US');

        const ok = await store.deleteMask('m1');
        expect(ok).to.equal(true);
        expect(aem.sites.cf.fragments.getById.calledWith('m1')).to.equal(true);
        expect(aem.sites.cf.fragments.delete.calledOnce).to.equal(true);
    });

    it('destroy resets state', () => {
        store.list.set([1, 2]);
        store.fragmentId.set('x');
        store.destroy();
        expect(store.list.get()).to.deep.equal([]);
        expect(store.fragmentId.get()).to.equal(null);
    });
});
