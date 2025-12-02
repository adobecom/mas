import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EditorContextStore } from '../../src/reactivity/editor-context-store.js';
import Store from '../../src/store.js';
import { delay } from '../utils.js';

describe('EditorContextStore', () => {
    let sandbox;
    let store;
    let previewFragmentForEditorStub;
    let originalQuerySelector;

    const mockFragmentBody = {
        id: 'test-fragment-id',
        path: '/content/dam/mas/commerce/en_US/test-fragment',
        fields: [{ name: 'title', values: ['Test Title'] }],
    };

    const mockParentFragment = {
        id: 'parent-fragment-id',
        path: '/content/dam/mas/commerce/en_US/parent-fragment',
        fields: [],
    };

    const mockSuccessResponse = {
        status: 200,
        body: mockFragmentBody,
        fragmentsIds: {
            'default-locale-id': 'parent-fragment-id',
        },
    };

    const mockAem = {
        sites: {
            cf: {
                fragments: {
                    getById: sinon.stub().resolves(mockParentFragment),
                },
            },
        },
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        sandbox.stub(Store.search, 'value').get(() => ({ path: '/content/dam/mas/sandbox' }));
        sandbox.stub(Store.filters, 'value').get(() => ({ locale: 'en_US' }));

        originalQuerySelector = document.querySelector;
        document.querySelector = (selector) => {
            if (selector === 'mas-repository') {
                return { aem: mockAem };
            }
            return originalQuerySelector.call(document, selector);
        };

        mockAem.sites.cf.fragments.getById.resetHistory();
    });

    afterEach(() => {
        sandbox.restore();
        document.querySelector = originalQuerySelector;
        if (store) {
            store = null;
        }
    });

    describe('Constructor', () => {
        it('should initialize with null value', () => {
            store = new EditorContextStore(null);
            expect(store.get()).to.be.null;
        });

        it('should initialize with provided initial value', () => {
            const initialValue = { test: 'value' };
            store = new EditorContextStore(initialValue);
            expect(store.get()).to.deep.equal(initialValue);
        });

        it('should initialize loading as false', () => {
            store = new EditorContextStore(null);
            expect(store.loading).to.be.false;
        });

        it('should initialize parentFragment as null', () => {
            store = new EditorContextStore(null);
            expect(store.parentFragment).to.be.null;
        });
    });

    describe('loadFragmentContext', () => {
        it('should return early when no search path', async () => {
            sandbox.restore();
            sandbox.stub(Store.search, 'value').get(() => ({ path: '' }));
            sandbox.stub(Store.filters, 'value').get(() => ({ locale: 'en_US' }));

            store = new EditorContextStore(null);
            const result = await store.loadFragmentContext('test-id');

            expect(result).to.deep.equal({ status: 0, body: null });
        });

        it('should set loading to true during fetch', async () => {
            store = new EditorContextStore(null);

            let loadingDuringFetch = false;
            const originalLoading = Object.getOwnPropertyDescriptor(store, 'loading');

            const loadPromise = store.loadFragmentContext('test-id').catch(() => {});

            await delay(10);
            loadingDuringFetch = store.loading;

            expect(loadingDuringFetch).to.be.true;
        });

        it('should set loading to false after fetch completes', async () => {
            store = new EditorContextStore(null);

            try {
                await store.loadFragmentContext('test-id');
            } catch (e) {}

            expect(store.loading).to.be.false;
        });
    });

    describe('Parent Fragment Methods', () => {
        beforeEach(() => {
            store = new EditorContextStore(null);
        });

        it('getParentFragment should return the parent fragment', () => {
            store.parentFragment = mockParentFragment;
            expect(store.getParentFragment()).to.deep.equal(mockParentFragment);
        });

        it('getParentFragment should return null when no parent', () => {
            store.parentFragment = null;
            expect(store.getParentFragment()).to.be.null;
        });

        it('getParentId should return parent ID when parent exists', () => {
            store.parentFragment = mockParentFragment;
            expect(store.getParentId()).to.equal('parent-fragment-id');
        });

        it('getParentId should return null when no parent', () => {
            store.parentFragment = null;
            expect(store.getParentId()).to.be.null;
        });

        it('hasParent should return true when parent exists', () => {
            store.parentFragment = mockParentFragment;
            expect(store.hasParent()).to.be.true;
        });

        it('hasParent should return false when no parent', () => {
            store.parentFragment = null;
            expect(store.hasParent()).to.be.false;
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            store = new EditorContextStore({ initial: 'value' });
            store.parentFragment = mockParentFragment;
        });

        it('should clear parentFragment', () => {
            store.reset();
            expect(store.parentFragment).to.be.null;
        });

        it('should set value to null', () => {
            store.reset();
            expect(store.get()).to.be.null;
        });
    });

    describe('Subscription', () => {
        it('should notify subscribers when value changes', () => {
            store = new EditorContextStore(null);
            const subscriber = sandbox.spy();

            store.subscribe(subscriber);
            store.set({ new: 'value' });

            expect(subscriber.callCount).to.be.greaterThan(1);
        });

        it('should pass new and old values to subscriber', () => {
            store = new EditorContextStore({ old: 'value' });
            const subscriber = sandbox.spy();

            store.subscribe(subscriber);
            store.set({ new: 'value' });

            const lastCall = subscriber.lastCall;
            expect(lastCall.args[0]).to.deep.equal({ new: 'value' });
        });
    });
});
