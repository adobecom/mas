import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EditorContextStore } from '../../src/reactivity/editor-context-store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Store from '../../src/store.js';

describe('Reactivity Stores', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('EditorContextStore', () => {
        let store;
        let originalQuerySelector;

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
            document.querySelector = originalQuerySelector;
            if (store) {
                store = null;
            }
        });

        describe('Constructor and Initialization', () => {
            it('should initialize with correct default values', () => {
                store = new EditorContextStore(null);
                expect(store.get()).to.be.null;
                expect(store.localeDefaultFragment).to.be.null;
                expect(store.defaultLocaleId).to.be.null;
            });

            it('should initialize with provided initial value', () => {
                const initialValue = { test: 'value' };
                store = new EditorContextStore(initialValue);
                expect(store.get()).to.deep.equal(initialValue);
            });
        });

        describe('loadFragmentContext', () => {
            it('should return early when no search path', async () => {
                sandbox.restore();
                sandbox = sinon.createSandbox();
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

            it('does not flag a promo variation as a locale variation when its locale has no known default', async () => {
                store = new EditorContextStore(null);
                sandbox.stub(Store, 'surface').returns('sandbox');
                const getByPathStub = sandbox.stub().rejects(new Error('not found'));
                document.querySelector = (selector) => {
                    if (selector === 'mas-repository')
                        return { aem: { sites: { cf: { fragments: { getByPath: getByPathStub } } } } };
                    return originalQuerySelector.call(document, selector);
                };
                const fragmentPath = '/content/dam/mas/sandbox/fil_PH/promotions/cyber-monday/card';

                await store.loadFragmentContext('test-id', fragmentPath);

                expect(store.isPromoVariationByPath).to.be.true;
                expect(store.isVariationByPath).to.be.false;
                expect(store.expectedDefaultLocale).to.be.null;
            });

            it('flags a promo variation as a locale variation when its locale is a known regional variant of a default locale', async () => {
                store = new EditorContextStore(null);
                sandbox.stub(Store, 'surface').returns('sandbox');
                const getByPathStub = sandbox.stub().rejects(new Error('not found'));
                document.querySelector = (selector) => {
                    if (selector === 'mas-repository')
                        return { aem: { sites: { cf: { fragments: { getByPath: getByPathStub } } } } };
                    return originalQuerySelector.call(document, selector);
                };
                const fragmentPath = '/content/dam/mas/sandbox/zh_HK/promotions/cyber-monday/card';

                await store.loadFragmentContext('test-id', fragmentPath);

                expect(store.isPromoVariationByPath).to.be.true;
                expect(store.isVariationByPath).to.be.true;
                expect(store.expectedDefaultLocale).to.equal('zh_TW');
            });
        });

        describe('Locale Default Fragment Methods', () => {
            beforeEach(() => {
                store = new EditorContextStore(null);
            });

            it('should manage locale default fragment correctly', () => {
                expect(store.getLocaleDefaultFragment()).to.be.null;
                store.localeDefaultFragment = mockLocaleDefaultFragment;
                expect(store.getLocaleDefaultFragment()).to.deep.equal(mockLocaleDefaultFragment);
            });

            it('should manage default locale ID correctly', () => {
                expect(store.getDefaultLocaleId()).to.be.null;
                store.defaultLocaleId = 'parent-fragment-id';
                expect(store.getDefaultLocaleId()).to.equal('parent-fragment-id');
            });

            it('should correctly identify variations', () => {
                store.defaultLocaleId = 'parent-fragment-id';
                expect(store.isVariation('different-id')).to.be.true;
                expect(store.isVariation('parent-fragment-id')).to.be.false;

                store.defaultLocaleId = null;
                expect(store.isVariation('any-id')).to.not.be.ok;
            });

            it('should always treat a promo variation as a variation, regardless of its path locale', () => {
                store.isPromoVariationByPath = true;

                store.isVariationByPath = false;
                expect(store.isVariation('promo-fragment-id')).to.be.true;

                store.isVariationByPath = true;
                expect(store.isVariation('promo-fragment-id')).to.be.true;
            });
        });

        describe('isLocaleVariation', () => {
            beforeEach(() => {
                store = new EditorContextStore(null);
            });

            it('delegates to isVariation for non-promo fragments', () => {
                store.defaultLocaleId = 'parent-fragment-id';
                expect(store.isLocaleVariation('different-id')).to.be.true;
                expect(store.isLocaleVariation('parent-fragment-id')).to.be.false;
            });

            it('treats a promo variation as a locale variation only when its own path locale differs from the surface default', () => {
                store.isPromoVariationByPath = true;

                store.isVariationByPath = false;
                expect(store.isLocaleVariation('promo-fragment-id')).to.be.false;

                store.isVariationByPath = true;
                expect(store.isLocaleVariation('promo-fragment-id')).to.be.true;
            });

            it('ignores the field-inheritance defaultLocaleId when deciding promo variation locale state', () => {
                store.isPromoVariationByPath = true;
                store.isVariationByPath = false;
                store.defaultLocaleId = 'unrelated-base-card-id';

                expect(store.isLocaleVariation('promo-fragment-id')).to.be.false;
            });
        });

        describe('isFragmentTranslatable', () => {
            beforeEach(() => {
                store = new EditorContextStore(null);
            });

            it('is translatable for a regular default-locale fragment', () => {
                expect(store.isFragmentTranslatable).to.be.true;
            });

            it('is not translatable for a locale-variation fragment', () => {
                store.isVariationByPath = true;
                expect(store.isFragmentTranslatable).to.be.false;
            });

            it('is translatable for a grouped variation regardless of path locale', () => {
                store.isVariationByPath = true;
                store.isGroupedVariationByPath = true;
                expect(store.isFragmentTranslatable).to.be.true;
            });

            it('is translatable for a promo variation at the default locale', () => {
                store.isPromoVariationByPath = true;
                store.isVariationByPath = false;
                expect(store.isFragmentTranslatable).to.be.true;
            });

            it('is not translatable for a promo variation at a non-default locale', () => {
                store.isPromoVariationByPath = true;
                store.isVariationByPath = true;
                expect(store.isFragmentTranslatable).to.be.false;
            });
        });

        describe('detectVariationFromPath', () => {
            it('should detect variation from path', () => {
                store = new EditorContextStore(null);
                sandbox.stub(Store, 'surface').returns('acom');

                // fr_CA is a variation of fr_FR for acom
                const result = store.detectVariationFromPath('/content/dam/mas/acom/fr_CA/fragment');
                expect(result.isVariation).to.be.true;
                expect(result.defaultLocale).to.equal('fr_FR');
                expect(result.pathLocale).to.equal('fr_CA');
            });

            it('should return false for non-variation path', () => {
                store = new EditorContextStore(null);
                sandbox.stub(Store, 'surface').returns('acom');

                const result = store.detectVariationFromPath('/content/dam/mas/acom/en_US/fragment');
                expect(result.isVariation).to.be.false;
            });

            it('should treat zh_HK as a regional variation of zh_TW', () => {
                store = new EditorContextStore(null);
                sandbox.stub(Store, 'surface').returns('sandbox');

                const result = store.detectVariationFromPath('/content/dam/mas/sandbox/zh_HK/fragment');
                expect(result.isVariation).to.be.true;
                expect(result.defaultLocale).to.equal('zh_TW');
                expect(result.pathLocale).to.equal('zh_HK');
            });
        });

        describe('Async Operations', () => {
            it('should wait for parent fetch promise in getLocaleDefaultFragmentAsync', async () => {
                store = new EditorContextStore(null);
                const mockData = { id: 'parent' };
                store.parentFetchPromise = Promise.resolve(mockData);
                store.localeDefaultFragment = mockData;

                const result = await store.getLocaleDefaultFragmentAsync();
                expect(result).to.equal(mockData);
            });

            it('should fetch parent fragment by path', async () => {
                store = new EditorContextStore(null);
                const mockData = { id: 'parent-id' };
                const getByPathStub = sandbox.stub().resolves(mockData);
                const mockAem = { sites: { cf: { fragments: { getByPath: getByPathStub } } } };

                document.querySelector = (selector) => {
                    if (selector === 'mas-repository') return { aem: mockAem };
                    return originalQuerySelector.call(document, selector);
                };

                store.fetchParentByPath('/content/dam/mas/acom/fr_FR/f', 'en_US', 'fr_FR');
                const result = await store.getLocaleDefaultFragmentAsync();

                expect(getByPathStub.calledWith('/content/dam/mas/acom/en_US/f')).to.be.true;
                expect(result).to.equal(mockData);
                expect(store.defaultLocaleId).to.equal('parent-id');
            });

            it('should fetch promo variation parent from path without getById', async () => {
                store = new EditorContextStore(null);
                const promoFragmentPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/cards/my-card';
                const parentData = {
                    id: 'default-id',
                    path: '/content/dam/mas/sandbox/en_US/cards/my-card',
                };
                const getByIdStub = sandbox.stub();
                const getByPathStub = sandbox.stub().resolves(parentData);
                const promoAem = { sites: { cf: { fragments: { getById: getByIdStub, getByPath: getByPathStub } } } };

                document.querySelector = (selector) => {
                    if (selector === 'mas-repository') return { aem: promoAem };
                    return originalQuerySelector.call(document, selector);
                };

                store.fetchParentForPromoVariation(promoFragmentPath);
                const result = await store.getLocaleDefaultFragmentAsync();

                expect(getByIdStub.called).to.be.false;
                expect(getByPathStub.calledOnceWith('/content/dam/mas/sandbox/en_US/cards/my-card')).to.be.true;
                expect(result).to.deep.equal(parentData);
                expect(store.defaultLocaleId).to.equal('default-id');
            });
        });

        describe('reset', () => {
            it('should clear all state', () => {
                store = new EditorContextStore({ initial: 'value' });
                store.localeDefaultFragment = mockLocaleDefaultFragment;
                store.defaultLocaleId = 'parent-fragment-id';
                store.isVariationByPath = true;
                store.isPromoVariationByPath = true;

                store.reset();

                expect(store.localeDefaultFragment).to.be.null;
                expect(store.defaultLocaleId).to.be.null;
                expect(store.isVariationByPath).to.be.false;
                expect(store.isPromoVariationByPath).to.be.false;
                expect(store.get()).to.be.null;
            });
        });

        describe('Subscription', () => {
            it('should notify subscribers with new and old values', () => {
                store = new EditorContextStore({ old: 'value' });
                const subscriber = sandbox.spy();

                store.subscribe(subscriber);
                store.set({ new: 'value' });

                expect(subscriber.callCount).to.be.greaterThan(1);
                expect(subscriber.lastCall.args[0]).to.deep.equal({ new: 'value' });
            });
        });
    });

    describe('FragmentStore', () => {
        let fragment;
        let store;

        beforeEach(() => {
            fragment = new Fragment({
                id: 'test-id',
                fields: [{ name: 'title', values: ['initial'] }],
            });
            store = new FragmentStore(fragment);
        });

        it('should manage fragment state correctly', () => {
            expect(store.id).to.equal('test-id');

            const notifySpy = sandbox.spy(store, 'notify');
            store.setLoading(true);
            expect(store.loading).to.be.true;
            expect(notifySpy.calledOnce).to.be.true;
        });

        it('should update field and notify', () => {
            const notifySpy = sandbox.spy(store, 'notify');
            store.updateField('title', ['updated']);
            expect(fragment.getFieldValue('title')).to.equal('updated');
            expect(notifySpy.calledOnce).to.be.true;
        });

        it('should discard changes and notify', () => {
            store.updateField('title', ['updated']);
            const notifySpy = sandbox.spy(store, 'notify');
            store.discardChanges();
            expect(fragment.getFieldValue('title')).to.equal('initial');
            expect(notifySpy.calledOnce).to.be.true;
        });

        it('should identify collection correctly', () => {
            expect(store.isCollection).to.be.false;
            const collectionFragment = new Fragment({
                model: { path: '/conf/mas/settings/dam/cfm/models/collection' },
            });
            const collectionStore = new FragmentStore(collectionFragment);
            expect(collectionStore.isCollection).to.be.true;
        });

        it('should update field internal and notify', () => {
            const notifySpy = sandbox.spy(store, 'notify');
            store.updateFieldInternal('title', 'internal-update');
            expect(fragment.title).to.equal('internal-update');
            expect(notifySpy.calledOnce).to.be.true;
        });

        it('should reset field to parent and notify', () => {
            const parent = new Fragment({
                fields: [{ name: 'title', values: ['parent-title'] }],
            });
            fragment.parentFragment = parent;
            store.updateField('title', ['overridden'], parent);

            const notifySpy = sandbox.spy(store, 'notify');
            const success = store.resetFieldToParent('title');

            expect(success).to.be.true;
            expect(fragment.getField('title')).to.be.undefined;
            expect(fragment.getEffectiveFieldValue('title', parent, true)).to.equal('parent-title');
            expect(notifySpy.calledOnce).to.be.true;
        });
    });
});
