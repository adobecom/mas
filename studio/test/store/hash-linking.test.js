import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { linkStoreToHash, unlinkStoreFromHash } from '../../src/router.js';
describe('Hash linking', () => {
    let storeValue;
    let filtersValue;
    let originalHash;
    let hashChangeListeners = [];

    function setHash(value) {
        const oldHash = window.location.hash;
        if (value) {
            window.location.hash = value;
        } else {
            history.replaceState(null, null, window.location.pathname);
        }
        if (oldHash !== window.location.hash) {
            hashChangeListeners.forEach((fn) => fn());
        }
    }

    beforeEach(() => {
        originalHash = window.location.hash;
        setHash('');
        storeValue = { path: '' };
        filtersValue = { tags: [], locale: 'en_US' };
        const originalAddEventListener = window.addEventListener;
        window.addEventListener = function (event, handler) {
            if (event === 'hashchange') {
                hashChangeListeners.push(handler);
            }
            return originalAddEventListener.call(this, event, handler);
        };

        Store.search = {
            get: () => storeValue,
            set: (value) => {
                storeValue =
                    typeof value === 'function' ? value(storeValue) : value;

                return storeValue;
            },
            subscribe: sinon.stub().returns({ unsubscribe: sinon.stub() }),
            getMeta: (key) => (key === 'default-path' ? 'acom' : null),
            setMeta: sinon.stub(),
            removeMeta: sinon.stub(),
        };

        Store.filters = {
            get: () => filtersValue,
            set: (value) => {
                filtersValue =
                    typeof value === 'function' ? value(filtersValue) : value;
                if (filtersValue.tags && !Array.isArray(filtersValue.tags)) {
                    filtersValue.tags = filtersValue.tags
                        ? filtersValue.tags.split(',')
                        : [];
                }
                return filtersValue;
            },
            subscribe: sinon.stub().returns({ unsubscribe: sinon.stub() }),
            getMeta: sinon.stub().returns(null),
            setMeta: sinon.stub(),
            removeMeta: sinon.stub(),
        };
    });

    afterEach(() => {
        if (originalHash) {
            window.location.hash = originalHash;
        } else {
            history.replaceState(null, null, window.location.pathname);
        }

        storeValue = { path: '' };
        filtersValue = { tags: [], locale: 'en_US' };
        hashChangeListeners = [];
        unlinkStoreFromHash(Store.search);
        unlinkStoreFromHash(Store.filters);
    });

    it('initializes from hash', async () => {
        setHash('path=drafts');
        linkStoreToHash(Store.search, ['path']);
        hashChangeListeners.forEach((fn) => fn());
        Store.search.set({ path: 'drafts' });
        expect(Store.search.get().path).to.equal('drafts');
    });

    it('reacts to hash change', async () => {
        linkStoreToHash(Store.search, ['path']);
        setHash('path=drafts');
        hashChangeListeners.forEach((fn) => fn());
        Store.search.set({ path: 'drafts' });
        expect(Store.search.get().path).to.equal('drafts');
        setHash('path=acom');
        hashChangeListeners.forEach((fn) => fn());
        Store.search.set({ path: 'acom' });
        expect(Store.search.get().path).to.equal('acom');
    });

    it('removes default values from hash', async function () {
        this.timeout(3000);
        linkStoreToHash(Store.search, ['path'], { path: 'acom' });
        setHash('path=drafts');
        hashChangeListeners.forEach((fn) => fn());
        Store.search.set({ path: 'drafts' });
        expect(Store.search.get().path).to.equal('drafts');
        Store.search.set({ path: 'acom' });
        setHash('');
        expect(window.location.hash).to.equal('');
    });

    it('handles array values in hash', async () => {
        setHash('tags=tag1,tag2,tag3');
        linkStoreToHash(Store.filters, ['tags']);
        hashChangeListeners.forEach((fn) => fn());
        Store.filters.set({
            ...Store.filters.get(),
            tags: ['tag1', 'tag2', 'tag3'],
        });
        const result = Store.filters.get().tags;
        expect(Array.isArray(result)).to.be.true;
        expect(result).to.deep.equal(['tag1', 'tag2', 'tag3']);
    });
});
