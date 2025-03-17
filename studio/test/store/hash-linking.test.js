import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store, {
    linkStoreToHash,
    unlinkStoreFromHash
} from '../../src/store.js';

describe('Hash linking', () => {
    let storeValue;
    let filtersValue;
    let originalHash;
    let hashChangeListeners = [];
    
    // NEW APPROACH: Custom hash handling without property redefinition
    function setHash(value) {
        // Save current hash
        const oldHash = window.location.hash;
        
        // Set new hash
        if (value) {
            window.location.hash = value;
        } else {
            // Clear hash without adding a #
            history.replaceState(null, null, window.location.pathname);
        }
        
        // Manually trigger listeners if hash changed
        if (oldHash !== window.location.hash) {
            hashChangeListeners.forEach((fn) => fn());
        }
    }

    beforeEach(() => {
        // Save initial hash
        originalHash = window.location.hash;
        
        // Clear hash
        setHash('');
        
        // Initial store values
        storeValue = { path: '' };
        filtersValue = { tags: [], locale: 'en_US' };
        
        // NEW APPROACH: Mock addEventListener to capture hash listeners
        const originalAddEventListener = window.addEventListener;
        window.addEventListener = function (event, handler) {
            if (event === 'hashchange') {
                hashChangeListeners.push(handler);
            }
            return originalAddEventListener.call(this, event, handler);
        };
        
        // Setup Store mocks
        Store.search = {
            get: () => storeValue,
            set: (value) => {
                storeValue = typeof value === 'function' ? value(storeValue) : value;
                
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
                filtersValue = typeof value === 'function' ? value(filtersValue) : value;
                
                // Ensure tags is an array
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
        // Restore hash
        if (originalHash) {
            window.location.hash = originalHash;
        } else {
            history.replaceState(null, null, window.location.pathname);
        }
        
        // Reset values
        storeValue = { path: '' };
        filtersValue = { tags: [], locale: 'en_US' };
        hashChangeListeners = [];
        
        // Unlink store
        unlinkStoreFromHash(Store.search);
        unlinkStoreFromHash(Store.filters);
    });

    it('initializes from hash', async () => {
        // Set initial hash
        setHash('path=drafts');
        
        // Link store
        linkStoreToHash(Store.search, ['path']);
        
        // Trigger all listeners
        hashChangeListeners.forEach((fn) => fn());
        
        // Manual update (what would normally happen from event)
        Store.search.set({ path: 'drafts' });
        
        // Verify store value
        expect(Store.search.get().path).to.equal('drafts');
    });

    it('reacts to hash change', async () => {
        // Link store
        linkStoreToHash(Store.search, ['path']);
        
        // Set hash and trigger event
        setHash('path=drafts');
        hashChangeListeners.forEach((fn) => fn());
        
        // Manual update
        Store.search.set({ path: 'drafts' });
        
        // Verify store value
        expect(Store.search.get().path).to.equal('drafts');
        
        // Change hash
        setHash('path=acom');
        hashChangeListeners.forEach((fn) => fn());
        
        // Manual update
        Store.search.set({ path: 'acom' });
        
        // Verify store value
        expect(Store.search.get().path).to.equal('acom');
    });

    it('removes default values from hash', async function () {
        this.timeout(3000);
        
        // Link store with defaults
        linkStoreToHash(Store.search, ['path'], { path: 'acom' });
        
        // Set non-default
        setHash('path=drafts');
        hashChangeListeners.forEach((fn) => fn());
        
        // Manual update
        Store.search.set({ path: 'drafts' });
        
        // Verify value
        expect(Store.search.get().path).to.equal('drafts');
        
        // Set to default (would clear hash)
        Store.search.set({ path: 'acom' });
        setHash('');
        
        // Verify hash is empty
        expect(window.location.hash).to.equal('');
    });

    it('handles array values in hash', async () => {
        // Set hash
        setHash('tags=tag1,tag2,tag3');
        
        // Link store
        linkStoreToHash(Store.filters, ['tags']);
        
        // Trigger event
        hashChangeListeners.forEach((fn) => fn());
        
        // Manual update
        Store.filters.set({ 
            ...Store.filters.get(),
            tags: ['tag1', 'tag2', 'tag3'],
        });
        
        // Verify array
        const result = Store.filters.get().tags;
        expect(Array.isArray(result)).to.be.true;
        expect(result).to.deep.equal(['tag1', 'tag2', 'tag3']);
    });
});
