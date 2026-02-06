import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EditorContextStore } from '../../src/reactivity/editor-context-store.js';
import Store from '../../src/store.js';
import { delay } from '../utils.js';

describe('EditorContextStore', () => {
    let sandbox;
    let store;
    let originalQuerySelector;

    const mockFragmentBody = {
        id: 'test-fragment-id',
        path: '/content/dam/mas/commerce/en_US/test-fragment',
        fields: [{ name: 'title', values: ['Test Title'] }],
    };

    const mockLocaleDefaultFragment = {
        id: 'parent-fragment-id',
        path: '/content/dam/mas/commerce/en_US/parent-fragment',
        fields: [],
    };

    const mockAem = {
        sites: {
            cf: {
                fragments: {
                    getById: sinon.stub().resolves(mockLocaleDefaultFragment),
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

        it('should initialize loading as true', () => {
            store = new EditorContextStore(null);
            expect(store.loading).to.be.true;
        });

        it('should initialize localeDefaultFragment as null', () => {
            store = new EditorContextStore(null);
            expect(store.localeDefaultFragment).to.be.null;
        });

        it('should initialize defaultLocaleId as null', () => {
            store = new EditorContextStore(null);
            expect(store.defaultLocaleId).to.be.null;
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

        it('should set loading to false after fetch completes', async () => {
            store = new EditorContextStore(null);

            try {
                await store.loadFragmentContext('test-id');
            } catch (e) {}

            expect(store.loading).to.be.false;
        });
    });

    describe('Locale Default Fragment Methods', () => {
        beforeEach(() => {
            store = new EditorContextStore(null);
        });

        it('getLocaleDefaultFragment should return the locale default fragment', () => {
            store.localeDefaultFragment = mockLocaleDefaultFragment;
            expect(store.getLocaleDefaultFragment()).to.deep.equal(mockLocaleDefaultFragment);
        });

        it('getLocaleDefaultFragment should return null when no locale default fragment', () => {
            store.localeDefaultFragment = null;
            expect(store.getLocaleDefaultFragment()).to.be.null;
        });

        it('getDefaultLocaleId should return default locale ID when set', () => {
            store.defaultLocaleId = 'parent-fragment-id';
            expect(store.getDefaultLocaleId()).to.equal('parent-fragment-id');
        });

        it('getDefaultLocaleId should return null when not set', () => {
            store.defaultLocaleId = null;
            expect(store.getDefaultLocaleId()).to.be.null;
        });

        it('isVariation should return true when defaultLocaleId differs from fragmentId', () => {
            store.defaultLocaleId = 'parent-fragment-id';
            expect(store.isVariation('different-id')).to.be.true;
        });

        it('isVariation should return false when defaultLocaleId equals fragmentId', () => {
            store.defaultLocaleId = 'same-id';
            expect(store.isVariation('same-id')).to.be.false;
        });

        it('isVariation should return falsy value when no defaultLocaleId', () => {
            store.defaultLocaleId = null;
            expect(store.isVariation('any-id')).to.not.be.ok;
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            store = new EditorContextStore({ initial: 'value' });
            store.localeDefaultFragment = mockLocaleDefaultFragment;
            store.defaultLocaleId = 'parent-fragment-id';
        });

        it('should clear localeDefaultFragment', () => {
            store.reset();
            expect(store.localeDefaultFragment).to.be.null;
        });

        it('should clear defaultLocaleId', () => {
            store.reset();
            expect(store.defaultLocaleId).to.be.null;
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
