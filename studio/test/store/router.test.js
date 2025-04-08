import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { PAGE_NAMES } from '../../src/constants.js';
import { initializeStoreFromUrl, linkStoreToHash } from '../../src/router.js';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';

describe('Router URL parameter handling', () => {
    let sandbox;
    let originalURLSearchParams;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalURLSearchParams = window.URLSearchParams;
    });

    afterEach(() => {
        sandbox.restore();
        window.URLSearchParams = originalURLSearchParams;
    });

    it('should initialize store from URL parameters', () => {
        const pageSetSpy = sandbox.spy(Store.page, 'set');
        const mockSearchParams = {
            get: sandbox.stub(),
            has: sandbox.stub(),
            entries: sandbox.stub().returns([]),
            delete: sandbox.stub(),
        };
        mockSearchParams.get.withArgs('page').returns('placeholders');
        mockSearchParams.has.withArgs('query').returns(false);
        window.URLSearchParams = sandbox.stub().returns(mockSearchParams);
        initializeStoreFromUrl();
        expect(pageSetSpy.calledWith(PAGE_NAMES.PLACEHOLDERS)).to.be.true;
    });

    it('should link store to hash parameters', () => {
        const mockHashParams = {
            has: sandbox.stub(),
            get: sandbox.stub(),
            set: sandbox.stub(),
            delete: sandbox.stub(),
            entries: sandbox.stub().returns([
                ['path', '/content/dam/test'],
                ['tags', '["tag1","tag2"]'],
            ]),
        };
        mockHashParams.has.withArgs('path').returns(true);
        mockHashParams.has.withArgs('tags').returns(true);
        mockHashParams.has.withArgs('query').returns(false);
        mockHashParams.has.withArgs('page').returns(false);
        mockHashParams.get.withArgs('path').returns('/content/dam/test');
        mockHashParams.get.withArgs('tags').returns('["tag1","tag2"]');
        window.URLSearchParams = sandbox.stub().returns(mockHashParams);
        sandbox.stub(window.history, 'replaceState');
        const testStore = new ReactiveStore({});
        linkStoreToHash(testStore, ['path', 'tags']);
        expect(testStore.get()).to.deep.include({
            path: '/content/dam/test',
            tags: ['tag1', 'tag2'],
        });
    });

    it('should update hash when store values change', () => {
        const mockHashParams = {
            has: sandbox.stub().returns(false),
            get: sandbox.stub(),
            set: sandbox.stub(),
            delete: sandbox.stub(),
            entries: sandbox.stub().returns([['test', 'updated']]),
            toString: sandbox.stub().returns('test=updated'),
        };
        window.URLSearchParams = sandbox.stub().returns(mockHashParams);
        const replaceStateStub = sandbox.stub(window.history, 'replaceState');
        const testStore = new ReactiveStore({ test: 'initial' });
        linkStoreToHash(testStore, 'test');
        testStore.set({ test: 'updated' });
        expect(replaceStateStub.called).to.be.true;
        expect(mockHashParams.set.called).to.be.true;
    });

    it('should set page parameter to content when query parameter exists', () => {
        const mockHashParams = {
            has: sandbox.stub(),
            get: sandbox.stub(),
            set: sandbox.stub(),
            delete: sandbox.stub(),
            entries: () => [['query', 'test-query']],
            toString: () => 'query=test-query',
        };
        mockHashParams.has.withArgs('query').returns(true);
        mockHashParams.has.withArgs('page').returns(false);
        
        window.URLSearchParams = sandbox.stub().returns(mockHashParams);
        sandbox.stub(window.history, 'replaceState');
        
        const testStore = new ReactiveStore({ query: null });
        testStore.subscribe = (callback) => {
            testStore.callback = callback;
            return () => {};
        };
        
        linkStoreToHash(testStore, ['query']);
        testStore.callback({ query: 'test-query' }, { query: null });
        
        expect(mockHashParams.set.calledWith('page', PAGE_NAMES.CONTENT)).to.be.true;
    });
});
