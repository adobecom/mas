import { expect } from '@esm-bundle/chai';
import Store, {
    linkStoreToHash,
    unlinkStoreFromHash,
} from '../../src/store.js';
import { oneEvent } from '@open-wc/testing-helpers/pure';

describe('Hash linking', () => {
    afterEach(() => {
        unlinkStoreFromHash(Store.search);
    });

    it('initializes from hash', async () => {
        document.location.hash = 'path=drafts';
        linkStoreToHash(Store.search, ['path']);
        expect(Store.search.get().path).to.equal('drafts');
    });

    it('reacts to hash change', async () => {
        document.location.hash = 'path=drafts';
        linkStoreToHash(Store.search, ['path']);
        expect(Store.search.get().path).to.equal('drafts');
        document.location.hash = 'path=acom';
        await oneEvent(window, 'hashchange');
        expect(Store.search.get().path).to.equal('acom');
    });

    it('removes default values from hash', async () => {
        document.location.hash = 'path=drafts';
        linkStoreToHash(Store.search, ['path'], { path: 'acom' });
        expect(Store.search.get().path).to.equal('drafts');
        Store.search.set((prev) => ({ ...prev, path: 'acom' }));
        await oneEvent(window, 'hashchange');
        expect(document.location.hash).to.equal('');
    });

    it('clears default values from initial hash', async () => {
        document.location.hash = 'path=drafts';
        linkStoreToHash(Store.search, ['path'], { path: 'drafts' });
        expect(Store.search.get().path).to.equal('drafts');
        expect(document.location.hash).to.equal('');
    });

    it('unlinks from hash', async () => {
        document.location.hash = 'path=drafts';
        linkStoreToHash(Store.search, ['path']);
        expect(Store.search.get().path).to.equal('drafts');
        unlinkStoreFromHash(Store.search);
        document.location.hash = 'path=acom';
        await oneEvent(window, 'hashchange');
        expect(Store.search.get().path).to.equal('drafts');
    });
});
