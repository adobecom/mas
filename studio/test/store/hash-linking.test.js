import { expect } from '@esm-bundle/chai';
import Store, {
    linkStoreToHash,
    unlinkStoreFromHash,
} from '../../src/store.js';
import { oneEvent } from '@open-wc/testing-helpers/pure';

describe('Hash linking', () => {
    beforeEach(() => {
        document.location.hash = '';
    });

    afterEach(() => {
        unlinkStoreFromHash(Store.search);
        unlinkStoreFromHash(Store.filters);
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

    it('handles array values in hash', async () => {
        document.location.hash = 'tags=tag1,tag2,tag3';
        linkStoreToHash(Store.filters, ['tags'], { tags: [] });
        expect(Store.filters.get().tags).to.deep.equal([
            'tag1',
            'tag2',
            'tag3',
        ]);
    });

    it('handles empty array values in hash', async () => {
        document.location.hash = 'tags=';
        linkStoreToHash(Store.filters, ['tags'], { tags: [] });
        expect(Store.filters.get().tags).to.deep.equal([]);
    });

    it('serializes array values to hash', async () => {
        linkStoreToHash(Store.filters, ['locale', 'tags'], {
            locale: 'en_US',
            tags: [],
        });
        Store.filters.set((prev) => ({ ...prev, tags: ['tag1', 'tag2'] }));
        await oneEvent(window, 'hashchange');
        expect(document.location.hash.slice(1)).to.equal('tags=tag1%2Ctag2');
    });

    it('removes default array values from hash', async () => {
        document.location.hash = 'tags=tag1,tag2';
        linkStoreToHash(Store.filters, ['locale', 'tags'], {
            locale: 'en_US',
            tags: ['tag1', 'tag2'],
        });
        expect(Store.filters.get().tags).to.deep.equal(['tag1', 'tag2']);
        expect(document.location.hash).to.equal('');
    });
});
