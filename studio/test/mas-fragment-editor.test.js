import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-editor.js';
import MasFragmentEditor from '../src/mas-fragment-editor.js';
import Store from '../src/store.js';
import { Fragment } from '../src/aem/fragment.js';
import generateFragmentStore from '../src/reactivity/source-fragment-store.js';
import { PAGE_NAMES, CARD_MODEL_PATH, ODIN_PREVIEW_ORIGIN } from '../src/constants.js';
import router from '../src/router.js';
import Events from '../src/events.js';
import { extractLocaleFromPath } from '../src/utils.js';
import { nothing } from 'lit';

describe('MasFragmentEditor', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
    });

    afterEach(() => {
        sandbox.restore();
    });

    function createEditor({ resolveHydratedParentFragment, getLocaleDefaultFragmentAsync } = {}) {
        const editor = new MasFragmentEditor();
        const repository = {
            resolveHydratedParentFragment: resolveHydratedParentFragment || sandbox.stub().resolves(null),
        };

        sandbox.stub(editor, 'repository').get(() => repository);

        editor.editorContextStore = {
            localeDefaultFragment: null,
            defaultLocaleId: null,
            parentFetchPromise: null,
            notify: sandbox.stub(),
            setParent(parentData) {
                if (!parentData) return;
                this.localeDefaultFragment = parentData;
                this.defaultLocaleId = parentData.id;
                this.parentFetchPromise = Promise.resolve(parentData);
                this.notify();
            },
            getLocaleDefaultFragmentAsync: getLocaleDefaultFragmentAsync || sandbox.stub().resolves(null),
        };

        return { editor, repository };
    }

    describe('grouped variation parent resolution', () => {
        it('polls grouped references every second for up to 15 seconds', async () => {
            const clock = sandbox.useFakeTimers();
            const resolveHydratedParentFragment = sandbox.stub().resolves(null);
            const { editor } = createEditor({ resolveHydratedParentFragment });

            const resultPromise = editor.pollGroupedVariationParentReference('/content/dam/mas/sandbox/en_US/pac/pzn/grouped');
            await clock.tickAsync(15000);
            const result = await resultPromise;

            expect(result).to.be.null;
            expect(resolveHydratedParentFragment.callCount).to.equal(16);
        });

        it('resolves parent when a grouped variation reference appears during polling', async () => {
            const clock = sandbox.useFakeTimers();
            const groupedPath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped';
            const parentData = { id: 'parent-fragment-id', path: '/content/dam/mas/sandbox/en_US/pac/default-fragment' };
            const resolveHydratedParentFragment = sandbox.stub();
            resolveHydratedParentFragment.onCall(0).resolves(null);
            resolveHydratedParentFragment.onCall(1).resolves(parentData);
            const { editor } = createEditor({ resolveHydratedParentFragment });

            const resultPromise = editor.pollGroupedVariationParentReference(groupedPath);
            await clock.tickAsync(1000);
            const result = await resultPromise;

            expect(result).to.deep.equal(parentData);
            expect(resolveHydratedParentFragment.callCount).to.equal(2);
            expect(resolveHydratedParentFragment.alwaysCalledWith(groupedPath)).to.be.true;
            expect(editor.editorContextStore.defaultLocaleId).to.equal('parent-fragment-id');
            expect(editor.editorContextStore.localeDefaultFragment).to.deep.equal(parentData);
        });

        it('sets orphan warning message when grouped variation remains unreferenced', async () => {
            const { editor } = createEditor();
            sandbox.stub(editor, 'pollGroupedVariationParentReference').resolves(null);

            const result = await editor.resolveVariationParentFragment('/content/dam/mas/sandbox/en_US/pac/pzn/grouped');

            expect(result).to.be.null;
            expect(editor.groupedVariationOrphanMessage).to.equal(
                'No default-locale fragment currently references this grouped variation. Inheritance cannot be resolved, and this fragment may be orphaned.',
            );
        });

        it('renders orphan grouped-variation state as a panel', () => {
            const { editor } = createEditor();
            editor.groupedVariationOrphanMessage =
                'No default-locale fragment currently references this grouped variation. Inheritance cannot be resolved, and this fragment may be orphaned.';

            const panel = editor.orphanGroupedVariationState;
            const markup = panel.strings.join('');

            expect(markup).to.include('orphan-grouped-variation-panel');
            expect(markup).to.include('Parent reference missing for this grouped variation.');
        });
    });

    it('renders loading state when no fragment', async () => {
        const el = await fixture(html`<mas-fragment-editor></mas-fragment-editor>`);
        expect(el.querySelector('#loading-state')).to.exist;
    });

    it('extracts locale from path', async () => {
        expect(extractLocaleFromPath('/content/dam/mas/surface/en_US/fragment')).to.equal('en_US');
    });

    it('does not derive variation dialog offerData from fragment path', () => {
        const el = document.createElement('mas-fragment-editor');
        const fragment = new Fragment({
            id: 'test-id',
            path: '/content/dam/mas/surface/en_US/pac/fragment',
            fields: [],
            references: [],
        });
        el.inEdit.value = { get: () => fragment };

        expect(el.variationDialogOfferData).to.be.undefined;
    });

    it('calculates preview attributes correctly', async () => {
        const fragment = new Fragment({
            id: 'test-id',
            fields: [
                { name: 'variant', values: ['plans'] },
                { name: 'size', values: ['wide'] },
                { name: 'cardName', values: ['Test Card'] },
            ],
        });
        const el = document.createElement('mas-fragment-editor');
        el.inEdit.value = { get: () => fragment };

        const mockMapping = { size: ['wide', 'standard'] };
        if (!customElements.get('merch-card')) {
            customElements.define(
                'merch-card',
                class extends HTMLElement {
                    static getFragmentMapping() {
                        return mockMapping;
                    }
                },
            );
        }

        const attrs = el.previewAttributes;
        expect(attrs.variant).to.equal('plans');
        expect(attrs.size).to.equal('wide');
        expect(attrs.name).to.equal('Test Card');
    });

    it('calculates preview CSS custom properties', async () => {
        const fragment = new Fragment({
            id: 'test-id',
            fields: [
                { name: 'backgroundColor', values: ['gray-100'] },
                { name: 'borderColor', values: ['transparent'] },
            ],
        });
        const el = document.createElement('mas-fragment-editor');
        el.inEdit.value = { get: () => fragment };

        const css = el.previewCSSCustomProperties;
        expect(css).to.contain('--merch-card-custom-background-color: var(--spectrum-gray-100)');
        expect(css).to.contain('--consonant-merch-card-border-color: transparent');
    });

    describe('initFragment', () => {
        let el;
        let mockRepo;
        let originalStoreState;

        const fragmentPath = (locale, slug) => `/content/dam/mas/s/${locale}/${slug}`;
        const createFragmentData = ({ id, locale = 'en_US', slug = 'fragment' } = {}) => ({
            id,
            path: fragmentPath(locale, slug),
            fields: [],
            references: [],
            model: { path: CARD_MODEL_PATH },
        });

        const createEditorContextStore = () => ({
            localeDefaultFragment: null,
            defaultLocaleId: null,
            parentFetchPromise: null,
            loadFragmentContext: sandbox.stub().resolves(),
            isVariation: sandbox.stub().returns(false),
            detectVariationFromPath: sandbox.stub().returns({ isVariation: false, defaultLocale: null }),
            setParent(parentData) {
                if (!parentData) return;
                this.localeDefaultFragment = parentData;
                this.defaultLocaleId = parentData.id;
                this.parentFetchPromise = Promise.resolve(parentData);
            },
            getLocaleDefaultFragmentAsync: sandbox.stub().resolves(null),
        });

        const disposePreviewStore = (store) => {
            store?.previewStore?.dispose?.();
        };

        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            mockRepo = {
                refreshFragment: sandbox.stub().resolves(),
                loadPreviewPlaceholders: sandbox.stub().resolves(),
                search: { value: { path: 'sandbox' } },
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub(),
                                getTranslations: sandbox.stub().resolves({ languageCopies: [] }),
                            },
                        },
                    },
                },
            };
            sandbox.stub(el, 'repository').get(() => mockRepo);
            sandbox.stub(el.reactiveController, 'updateStores');
            sandbox.stub(el, 'dispatchFragmentLoaded');
            sandbox.stub(el, 'updateTranslatedLocalesStore').resolves();
            el.editorContextStore = createEditorContextStore();

            originalStoreState = {
                listData: Store.fragments.list.data.get(),
                inEdit: Store.fragments.inEdit.get(),
                fragmentId: Store.fragmentEditor.fragmentId.get(),
                loading: Store.fragmentEditor.loading.get(),
                search: structuredClone(Store.search.get()),
                filters: structuredClone(Store.filters.get()),
                translatedLocales: Store.fragmentEditor.translatedLocales.get(),
                placeholdersPreview: Store.placeholders.previewByLocale.get(),
            };

            Store.fragments.list.data.value = [];
            Store.fragments.inEdit.value = null;
            Store.fragmentEditor.fragmentId.value = null;
            Store.fragmentEditor.loading.value = false;
            Store.search.value = {};
            Store.filters.value = { locale: 'en_US' };
            Store.fragmentEditor.translatedLocales.value = null;
            Store.placeholders.previewByLocale.value = {};
        });

        afterEach(() => {
            disposePreviewStore(Store.fragments.inEdit.get());
            Store.fragments.list.data.get().forEach((store) => disposePreviewStore(store));

            Store.fragments.list.data.value = originalStoreState.listData;
            Store.fragments.inEdit.value = originalStoreState.inEdit;
            Store.fragmentEditor.fragmentId.value = originalStoreState.fragmentId;
            Store.fragmentEditor.loading.value = originalStoreState.loading;
            Store.search.value = originalStoreState.search;
            Store.filters.value = originalStoreState.filters;
            Store.fragmentEditor.translatedLocales.value = originalStoreState.translatedLocales;
            Store.placeholders.previewByLocale.value = originalStoreState.placeholdersPreview;
        });

        it('returns early when no fragment ID exists', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');

            await el.initFragment();

            expect(consoleErrorStub.calledOnceWith('No fragment ID in store')).to.be.true;
            expect(mockRepo.aem.sites.cf.fragments.getById.called).to.be.false;
            expect(Store.fragmentEditor.loading.get()).to.equal(false);
            expect(el.initState).to.equal(MasFragmentEditor.INIT_STATE.IDLE);
        });

        it('reuses existing store and updates locale/filter state', async () => {
            const existingData = createFragmentData({ id: 'existing-id', locale: 'fr_FR', slug: 'existing' });
            const existingStore = generateFragmentStore(new Fragment(existingData));
            existingStore.previewStore.resolved = true;
            Store.fragments.list.data.value = [existingStore];
            Store.fragmentEditor.fragmentId.value = 'existing-id';

            await el.initFragment();

            expect(mockRepo.refreshFragment.calledOnce).to.be.true;
            expect(el.editorContextStore.loadFragmentContext.calledOnceWith('existing-id', existingData.path)).to.be.true;
            expect(el.inEdit.get()).to.equal(existingStore);
            expect(Store.search.get().region).to.equal('fr_FR');
            expect(el.updateTranslatedLocalesStore.calledOnceWith(false, existingData.path)).to.be.true;
            expect(el.initState).to.equal(MasFragmentEditor.INIT_STATE.READY);
            expect(Store.fragmentEditor.loading.get()).to.equal(false);
            expect(existingStore.previewStore.resolved).to.equal(false);
        });

        it('reattaches parent for existing variation when resolved parent changes', async () => {
            const oldParent = new Fragment(createFragmentData({ id: 'old-parent-id', locale: 'en_US', slug: 'default-old' }));
            const existingVariationData = createFragmentData({
                id: 'existing-variation-id',
                locale: 'fr_FR',
                slug: 'variation',
            });
            const existingStore = generateFragmentStore(new Fragment(existingVariationData), oldParent);
            const refreshPreviewSpy = sandbox.spy(existingStore.previewStore, 'refreshFrom');
            const newParentData = createFragmentData({ id: 'new-parent-id', locale: 'en_US', slug: 'default-new' });

            el.editorContextStore.isVariation.returns(true);
            sandbox.stub(el, 'resolveVariationParentFragment').resolves(newParentData);

            Store.fragments.list.data.value = [existingStore];
            Store.fragmentEditor.fragmentId.value = 'existing-variation-id';

            await el.initFragment();

            expect(el.resolveVariationParentFragment.calledOnceWith(existingVariationData.path)).to.be.true;
            expect(existingStore.parentFragment.id).to.equal('new-parent-id');
            expect(refreshPreviewSpy.calledOnce).to.be.true;
            expect(el.editorContextStore.localeDefaultFragment.id).to.equal('new-parent-id');
            expect(el.updateTranslatedLocalesStore.calledOnceWith(true, existingVariationData.path)).to.be.true;
        });

        it('initializes a new non-variation fragment and adds it to the list', async () => {
            const fragmentData = createFragmentData({ id: 'new-id', locale: 'en_US', slug: 'fresh' });
            mockRepo.aem.sites.cf.fragments.getById.resolves(fragmentData);
            Store.fragmentEditor.fragmentId.value = 'new-id';

            await el.initFragment();

            expect(mockRepo.loadPreviewPlaceholders.callCount).to.equal(2);
            expect(el.editorContextStore.loadFragmentContext.calledOnceWith('new-id', fragmentData.path)).to.be.true;
            expect(Store.fragments.list.data.get()).to.have.lengthOf(1);
            expect(Store.fragments.list.data.get()[0].id).to.equal('new-id');
            expect(el.inEdit.get().id).to.equal('new-id');
            expect(el.updateTranslatedLocalesStore.calledOnceWith(false, fragmentData.path)).to.be.true;
            expect(el.initState).to.equal(MasFragmentEditor.INIT_STATE.READY);
        });

        it('skips parent lookup when store skipVariationDetection flag is set', async () => {
            const fragmentData = createFragmentData({ id: 'variation-id', locale: 'fr_FR', slug: 'variation' });
            const fragment = new Fragment(fragmentData);
            const sourceStore = generateFragmentStore(fragment);
            sourceStore.skipVariationDetection = true;
            Store.fragments.list.data.set([sourceStore]);

            el.editorContextStore.isVariation.returns(true);
            const resolveParentStub = sandbox.stub(el, 'resolveVariationParentFragment').resolves(null);

            Store.fragmentEditor.fragmentId.value = 'variation-id';

            await el.initFragment();

            expect(resolveParentStub.called).to.be.false;
            expect(sourceStore.skipVariationDetection).to.equal(false);
            expect(el.inEdit.get().id).to.equal('variation-id');
            expect(el.updateTranslatedLocalesStore.calledOnceWith(true, fragmentData.path)).to.be.true;
        });

        it('reloads locale placeholders for variations when active locale differs', async () => {
            const fragmentData = createFragmentData({ id: 'variation-id', locale: 'fr_FR', slug: 'variation' });

            Store.filters.value = { locale: 'tr_TR' };
            mockRepo.aem.sites.cf.fragments.getById.resolves(fragmentData);
            el.editorContextStore.isVariation.returns(true);
            sandbox.stub(el, 'resolveVariationParentFragment').resolves(null);
            Store.fragmentEditor.fragmentId.value = 'variation-id';

            mockRepo.loadPreviewPlaceholders.callsFake(async () => {
                Store.placeholders.previewByLocale.set((prev) => ({ ...prev, fr_FR: { testDictionary: true } }));
            });

            await el.initFragment();

            expect(mockRepo.loadPreviewPlaceholders.callCount).to.equal(2);
            expect(Store.search.get().region).to.equal('fr_FR');
            expect(Store.previewDictionary()).to.deep.equal({ testDictionary: true });
        });

        it('reloads locale placeholders for cached variation when locale differs from Store.localeOrRegion()', async () => {
            const fragmentData = createFragmentData({ id: 'cached-var-id', locale: 'fr_FR', slug: 'variation' });
            const parentData = createFragmentData({ id: 'parent-id', locale: 'en_US', slug: 'default' });
            const sourceStore = generateFragmentStore(new Fragment(fragmentData), new Fragment(parentData));
            sandbox.spy(sourceStore, 'resolvePreviewFragment');

            mockRepo.loadPreviewPlaceholders.callsFake(async () => {
                Store.placeholders.previewByLocale.set((prev) => ({ ...prev, fr_FR: { fromCachedVariation: true } }));
            });

            el.editorContextStore.isVariation.returns(true);
            sandbox.stub(el, 'resolveVariationParentFragment').resolves(new Fragment(parentData));

            Store.filters.value = { locale: 'tr_TR' };
            Store.search.value = { path: 'sandbox' };
            Store.fragments.list.data.value = [sourceStore];
            Store.fragmentEditor.fragmentId.value = 'cached-var-id';

            await el.initFragment();

            expect(mockRepo.loadPreviewPlaceholders.callCount).to.equal(2);
            expect(Store.search.get().region).to.equal('fr_FR');
            expect(Store.previewDictionary()).to.deep.equal({ fromCachedVariation: true });
            expect(sourceStore.resolvePreviewFragment.calledOnce).to.be.true;
        });

        it('does not reload preview placeholders when cached variation locale matches Store.localeOrRegion()', async () => {
            const fragmentData = createFragmentData({ id: 'cached-var-id', locale: 'fr_FR', slug: 'variation' });
            const parentData = createFragmentData({ id: 'parent-id', locale: 'en_US', slug: 'default' });
            const sourceStore = generateFragmentStore(new Fragment(fragmentData), new Fragment(parentData));

            el.editorContextStore.isVariation.returns(true);
            sandbox.stub(el, 'resolveVariationParentFragment').resolves(new Fragment(parentData));

            Store.filters.value = { locale: 'fr_FR' };
            Store.search.value = { path: 'sandbox' };
            Store.fragments.list.data.value = [sourceStore];
            Store.fragmentEditor.fragmentId.value = 'cached-var-id';

            await el.initFragment();

            expect(mockRepo.loadPreviewPlaceholders.callCount).to.equal(1);
        });

        it('uses pending parent from create variation event when context is not ready', async () => {
            const parentData = createFragmentData({ id: 'parent-id', locale: 'en_US', slug: 'parent' });
            const variationData = createFragmentData({ id: 'new-variation-id', locale: 'fr_FR', slug: 'variation' });
            const parentFragment = new Fragment(parentData);

            mockRepo.aem.sites.cf.fragments.getById.resolves(variationData);
            el.editorContextStore.isVariation.returns(false);
            const resolveParentStub = sandbox.stub(el, 'resolveVariationParentFragment').resolves(null);
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor').resolves();

            el.handleFragmentCopied({
                detail: {
                    fragment: { id: 'new-variation-id', path: variationData.path },
                    parentFragment,
                },
            });

            expect(navigateSpy.calledOnceWith('new-variation-id')).to.be.true;

            Store.fragmentEditor.fragmentId.value = 'new-variation-id';
            await el.initFragment();

            expect(resolveParentStub.called).to.be.false;
            expect(Store.fragments.list.data.get()).to.have.lengthOf(0);
            expect(el.inEdit.get().parentFragment.id).to.equal('parent-id');
            expect(el.editorContextStore.localeDefaultFragment.id).to.equal('parent-id');
            expect(el.updateTranslatedLocalesStore.calledOnceWith(true, variationData.path)).to.be.true;
        });

        it('sets idle state when new fragment fetch fails', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            mockRepo.aem.sites.cf.fragments.getById.rejects(new Error('boom'));
            Store.fragmentEditor.fragmentId.value = 'broken-id';

            await el.initFragment();

            expect(consoleErrorStub.called).to.be.true;
            expect(el.updateTranslatedLocalesStore.called).to.be.false;
            expect(el.initState).to.equal(MasFragmentEditor.INIT_STATE.IDLE);
            expect(Store.fragmentEditor.loading.get()).to.equal(false);
        });
    });

    describe('translated locales fetching', () => {
        it('dedupes in-flight translation requests for the same fragment', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalFragmentId = Store.fragmentEditor.fragmentId.value;
            try {
                const deferred = {};
                const getTranslations = sandbox.stub().returns(
                    new Promise((resolve) => {
                        deferred.resolve = resolve;
                    }),
                );
                const mockRepo = {
                    aem: {
                        sites: {
                            cf: {
                                fragments: { getTranslations },
                            },
                        },
                    },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                Store.fragmentEditor.fragmentId.value = 'test-id';

                const firstCall = el.updateTranslatedLocalesStore(false);
                const secondCall = el.updateTranslatedLocalesStore(false);
                deferred.resolve({ languageCopies: [] });

                await Promise.all([firstCall, secondCall]);
                expect(getTranslations.calledOnceWith('test-id')).to.be.true;
            } finally {
                Store.fragmentEditor.fragmentId.value = originalFragmentId;
            }
        });

        it('adds fil_PH to locales when not in languageCopies and Odin preview returns OK', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            const fragmentPath = '/content/dam/mas/acom/en_US/my-fragment';
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [{ path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' }],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };

                const fetchStub = sandbox.stub(window, 'fetch').resolves({
                    ok: true,
                    json: () => Promise.resolve({ 'jcr:uuid': 'fil-ph-frag-id' }),
                });

                await el.updateTranslatedLocalesStore(false, fragmentPath);

                const locales = Store.fragmentEditor.translatedLocales.get();
                expect(locales).to.have.lengthOf(2);
                const filPh = locales.find((l) => l.locale === 'fil_PH');
                expect(filPh).to.deep.include({
                    locale: 'fil_PH',
                    id: 'fil-ph-frag-id',
                    path: '/content/dam/mas/acom/fil_PH/my-fragment',
                });
                expect(fetchStub.calledOnce).to.be.true;
                expect(fetchStub.firstCall.args[0]).to.equal(
                    `${ODIN_PREVIEW_ORIGIN}/content/dam/mas/acom/fil_PH/my-fragment.json`,
                );
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('does not fetch fil_PH when already in languageCopies', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [
                        { path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' },
                        { path: '/content/dam/mas/acom/fil_PH/my-fragment', id: 'fil-ph-id' },
                    ],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                const fetchStub = sandbox.stub(window, 'fetch');

                await el.updateTranslatedLocalesStore(false, '/content/dam/mas/acom/en_US/my-fragment');

                expect(Store.fragmentEditor.translatedLocales.get()).to.have.lengthOf(2);
                expect(fetchStub.called).to.be.false;
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('keeps locales from languageCopies when fil_PH fetch fails', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [{ path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' }],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                sandbox.stub(window, 'fetch').rejects(new Error('Network error'));

                await el.updateTranslatedLocalesStore(false, '/content/dam/mas/acom/en_US/my-fragment');

                const locales = Store.fragmentEditor.translatedLocales.get();
                expect(locales).to.have.lengthOf(1);
                expect(locales[0].locale).to.equal('en_US');
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('keeps locales from languageCopies when fil_PH URL returns not ok', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [{ path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' }],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                sandbox.stub(window, 'fetch').resolves({ ok: false });

                await el.updateTranslatedLocalesStore(false, '/content/dam/mas/acom/en_US/my-fragment');

                const locales = Store.fragmentEditor.translatedLocales.get();
                expect(locales).to.have.lengthOf(1);
                expect(locales[0].locale).to.equal('en_US');
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('does not fetch fil_PH when fragmentPath is not provided', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [{ path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' }],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                const fetchStub = sandbox.stub(window, 'fetch');

                await el.updateTranslatedLocalesStore(false);

                expect(Store.fragmentEditor.translatedLocales.get()).to.have.lengthOf(1);
                expect(fetchStub.called).to.be.false;
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('sets translatedLocales to null and warns when getTranslations throws', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            const warnStub = sandbox.stub(console, 'warn');
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().rejects(new Error('API error'));
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };

                await el.updateTranslatedLocalesStore(false, '/content/dam/mas/acom/en_US/my-fragment');

                expect(Store.fragmentEditor.translatedLocales.get()).to.be.null;
                expect(warnStub.calledOnce).to.be.true;
                expect(warnStub.firstCall.args[0]).to.include('Failed to fetch fragment translations');
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('does not set locales when fragmentId changes before getTranslations resolves', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            const originalFragmentId = Store.fragmentEditor.fragmentId.value;
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const deferred = {};
                const getTranslations = sandbox.stub().returns(
                    new Promise((resolve) => {
                        deferred.resolve = resolve;
                    }),
                );
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };

                const updatePromise = el.updateTranslatedLocalesStore(false, '/content/dam/mas/acom/en_US/my-fragment');
                Store.fragmentEditor.fragmentId.value = 'other-frag';
                deferred.resolve({
                    languageCopies: [{ path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' }],
                });

                await updatePromise;

                expect(Store.fragmentEditor.translatedLocales.get()).to.be.null;
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = originalFragmentId;
            }
        });

        it('adds fil_PH with id null when response json has no id', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = 'frag-1';
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [{ path: '/content/dam/mas/acom/en_US/my-fragment', id: 'frag-1' }],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                sandbox.stub(window, 'fetch').resolves({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await el.updateTranslatedLocalesStore(false, '/content/dam/mas/acom/en_US/my-fragment');

                const locales = Store.fragmentEditor.translatedLocales.get();
                const filPh = locales.find((l) => l.locale === 'fil_PH');
                expect(filPh).to.deep.include({ locale: 'fil_PH', id: null, path: '/content/dam/mas/acom/fil_PH/my-fragment' });
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });

        it('when current locale is fil_PH, fetches en_US path from Odin and getTranslations(enUsFragmentId) for languageCopies then adds fil_PH', async () => {
            const el = document.createElement('mas-fragment-editor');
            const originalTranslatedLocales = Store.fragmentEditor.translatedLocales.value;
            const filPhPath = '/content/dam/mas/acom/fil_PH/my-fragment';
            const filPhFragmentId = 'fil-ph-frag-id';
            const enUsFragmentId = 'en-us-frag-id';
            try {
                Store.fragmentEditor.translatedLocales.value = null;
                Store.fragmentEditor.fragmentId.value = filPhFragmentId;
                const getTranslations = sandbox.stub().resolves({
                    languageCopies: [
                        { path: '/content/dam/mas/acom/en_US/my-fragment', id: enUsFragmentId },
                        { path: '/content/dam/mas/acom/fr_FR/my-fragment', id: 'fr-frag-id' },
                    ],
                });
                const mockRepo = {
                    aem: { sites: { cf: { fragments: { getTranslations } } } },
                };
                sandbox.stub(el, 'repository').get(() => mockRepo);
                el.editorContextStore = { isVariation: sandbox.stub().returns(false) };
                const fetchStub = sandbox.stub(window, 'fetch').resolves({
                    ok: true,
                    json: () => Promise.resolve({ 'jcr:uuid': enUsFragmentId }),
                });

                await el.updateTranslatedLocalesStore(false, filPhPath);

                const locales = Store.fragmentEditor.translatedLocales.get();
                expect(locales).to.have.lengthOf(3);
                expect(getTranslations.calledOnceWith(enUsFragmentId)).to.be.true;
                expect(fetchStub.firstCall.args[0]).to.equal(
                    `${ODIN_PREVIEW_ORIGIN}/content/dam/mas/acom/en_US/my-fragment.json`,
                );
                const enUs = locales.find((l) => l.locale === 'en_US');
                expect(enUs).to.deep.include({
                    locale: 'en_US',
                    id: enUsFragmentId,
                    path: '/content/dam/mas/acom/en_US/my-fragment',
                });
                const filPh = locales.find((l) => l.locale === 'fil_PH');
                expect(filPh).to.deep.include({ locale: 'fil_PH', id: filPhFragmentId, path: filPhPath });
            } finally {
                Store.fragmentEditor.translatedLocales.value = originalTranslatedLocales;
                Store.fragmentEditor.fragmentId.value = null;
            }
        });
    });

    describe('discard changes', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            // Mock fragmentStore without functions that break structuredClone if possible,
            // or just mock the methods el uses.
            el.inEdit.value = {
                discardChanges: sandbox.stub(),
                get: () => ({}),
            };
        });

        it('confirms discard', async () => {
            const promptPromise = el.promptDiscardChanges();
            expect(el.showDiscardDialog).to.be.true;

            el.discardConfirmed();
            const result = await promptPromise;
            expect(result).to.be.true;
            expect(el.showDiscardDialog).to.be.false;
            expect(el.inEdit.value.discardChanges.calledOnce).to.be.true;
        });

        it('cancels discard', async () => {
            const promptPromise = el.promptDiscardChanges();
            el.cancelDiscard();
            const result = await promptPromise;
            expect(result).to.be.false;
            expect(el.showDiscardDialog).to.be.false;
        });
    });

    describe('delete fragment', () => {
        let el;
        let mockRepo;

        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            mockRepo = {
                deleteFragment: sandbox.stub().resolves(),
                deleteFragmentWithVariations: sandbox.stub().resolves(),
                removeFromParentVariations: sandbox.stub().resolves(),
            };
            sandbox.stub(el, 'repository').get(() => mockRepo);
            // Bypass structuredClone
            el.inEdit.value = {
                get: () => ({ id: 'test-id', path: '/path', getVariations: () => [] }),
            };
            sandbox.stub(Store.fragments.inEdit, 'set').callsFake((val) => {
                Store.fragments.inEdit.value = val;
            });
        });

        it('confirms delete for non-variation', async () => {
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);
            await el.confirmDelete();
            expect(mockRepo.deleteFragmentWithVariations.calledOnce).to.be.true;
        });

        it('confirms delete for variation', async () => {
            sandbox.stub(el.editorContextStore, 'isVariation').returns(true);
            sandbox.stub(el.editorContextStore, 'getLocaleDefaultFragmentAsync').resolves({ id: 'parent' });
            await el.confirmDelete();
            expect(mockRepo.removeFromParentVariations.calledOnce).to.be.true;
            expect(mockRepo.deleteFragment.calledOnce).to.be.true;
        });
    });

    describe('cloning', () => {
        let el;
        let mockRepo;

        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            mockRepo = { copyFragment: sandbox.stub().resolves() };
            sandbox.stub(el, 'repository').get(() => mockRepo);
            el.inEdit.value = {
                get: () => ({ id: 'test-id', model: { path: CARD_MODEL_PATH }, getFieldValue: () => 'osi' }),
            };
        });

        it('confirms clone', async () => {
            el.titleClone = 'New Title';
            await el.confirmClone();
            expect(mockRepo.copyFragment.calledWith('New Title')).to.be.true;
            expect(el.showCloneDialog).to.be.false;
        });
    });

    describe('updateFragment', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            el.inEdit.value = { updateField: sandbox.stub() };
        });

        it('updates field from target value', () => {
            const event = { target: { dataset: { field: 'title' }, value: 'New Title' } };
            el.updateFragment(event);
            expect(el.inEdit.value.updateField.calledWith('title', ['New Title'])).to.be.true;
        });

        it('updates field from target checked', () => {
            const event = { target: { dataset: { field: 'locReady' }, checked: true } };
            el.updateFragment(event);
            expect(el.inEdit.value.updateField.calledWith('locReady', [true])).to.be.true;
        });

        it('updates field from multiline value', () => {
            const event = { target: { dataset: { field: 'tags' }, value: 'tag1,tag2', multiline: true } };
            el.updateFragment(event);
            expect(el.inEdit.value.updateField.calledWith('tags', ['tag1', 'tag2'])).to.be.true;
        });
    });

    describe('dialog visibility', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            const fragment = new Fragment({ id: 'test-id', path: '/path' });
            el.inEdit.value = { get: () => fragment };
            // Mock Store.editor
            sandbox.stub(Store.editor, 'hasChanges').get(() => false);
        });

        it('shows and cancels delete dialog', () => {
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);
            el.deleteFragment();
            expect(el.showDeleteDialog).to.be.true;
            el.cancelDelete();
            expect(el.showDeleteDialog).to.be.false;
        });

        it('shows and cancels clone dialog', async () => {
            await el.showClone();
            expect(el.showCloneDialog).to.be.true;
            el.cancelClone();
            expect(el.showCloneDialog).to.be.false;
        });

        it('shows and cancels create variation dialog', () => {
            el.showCreateVariation();
            expect(el.showCreateVariationDialog).to.be.true;
            el.cancelCreateVariation();
            expect(el.showCreateVariationDialog).to.be.false;
        });
    });

    describe('utility functions', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
        });

        it('getFragmentEditorUrl returns correct URL', () => {
            const url = el.getFragmentEditorUrl('test-id');
            expect(url).to.equal('#page=fragment-editor&fragmentId=test-id');
        });

        it('goToTranslationEditor navigates to translation editor', async () => {
            const navigateSpy = sandbox.stub(router, 'navigateToTranslationEditor');
            Store.fragmentEditor.translatedLocales.set([{ locale: 'en_US', path: '/path/en_US/f' }]);
            await el.goToTranslationEditor();
            expect(navigateSpy.calledOnce).to.be.true;
            expect(navigateSpy.firstCall.args[0]).to.deep.equal({ targetLocale: 'en_US', fragmentPath: '/path/en_US/f' });
        });
    });

    describe('rendering helpers', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/s/en_US/f',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variant', values: ['plans'] }],
                tags: [],
            });
            el.inEdit.value = { get: () => fragment };
        });

        it('renders authorPath', async () => {
            const authorPath = el.authorPath;
            expect(authorPath.values[0]).to.contain('merch-card');
        });

        it('renders fragmentEditor', async () => {
            const editor = el.fragmentEditor;
            expect(editor).to.not.equal(nothing);
        });

        it('renders previewColumn', async () => {
            el.previewResolved = true;
            const preview = el.previewColumn;
            expect(preview).to.not.equal(nothing);
        });
    });

    describe('missing variation state', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            sandbox.stub(Store, 'localeOrRegion').returns('tr_TR');
            el.inEdit.value = {
                get: () => ({
                    id: 'test-id',
                    path: '/content/dam/mas/s/en_US/f',
                    listLocaleVariations: () => [],
                }),
            };
        });

        it('returns missing variation panel when locale mismatch and no variation exists', async () => {
            const state = el.missingVariationState;
            expect(state).to.not.be.null;
            // Check that the template contains the expected ID
            expect(state.strings.join('')).to.contain('id="missing-variation-panel"');
        });

        it('viewSourceFragment resets region and sets locale to en_US', () => {
            const searchSetSpy = sandbox.stub(Store.search, 'set');
            const filtersSetSpy = sandbox.stub(Store.filters, 'set');
            el.viewSourceFragment();
            expect(searchSetSpy.calledOnce).to.be.true;
            expect(filtersSetSpy.calledOnce).to.be.true;
            expect(filtersSetSpy.firstCall.args[0]({ locale: 'tr_TR' })).to.deep.equal({ locale: 'en_US' });
        });
    });

    describe('navigation', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            el.localeDefaultFragment = { id: 'parent-id', path: '/content/dam/mas/s/en_US/f' };
        });

        it('navigates to locale default fragment', async () => {
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            await el.navigateToLocaleDefaultFragment();
            expect(navigateSpy.calledWith('parent-id')).to.be.true;
        });

        it('navigates to variations table', async () => {
            const navigateSpy = sandbox.stub(router, 'navigateToVariationsTable');
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);
            el.inEdit.value = { get: () => ({ id: 'test-id' }) };
            el.navigateToVariationsTable();
            expect(navigateSpy.calledWith('test-id')).to.be.true;
        });
    });

    describe('additional rendering and logic', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/s/en_US/f',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variant', values: ['plans'] }],
                tags: [],
            });
            el.inEdit.value = { get: () => fragment };
        });

        it('updates clone fragment internal', () => {
            const event = { target: { value: 'New Clone Title' } };
            el.updateCloneFragmentInternal(event);
            expect(el.titleClone).to.equal('New Clone Title');
        });

        it('handles fragment copied', () => {
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            el.handleFragmentCopied({ detail: { fragment: { id: 'copied-id' } } });
            expect(navigateSpy.calledWith('copied-id')).to.be.true;
        });

        it('renders locale variation header', async () => {
            sandbox.stub(el.editorContextStore, 'isVariation').returns(true);
            const header = el.localeVariationHeader;
            expect(header).to.not.equal(nothing);
        });

        it('renders derived from container', async () => {
            el.localeDefaultFragment = { id: 'parent-id', path: '/content/dam/mas/s/en_US/f', title: 'Parent' };
            const container = el.derivedFromContainer;
            expect(container).to.not.equal(nothing);
        });

        it('renders preview skeleton', () => {
            const skeleton = el.previewSkeleton;
            expect(skeleton).to.not.equal(nothing);
        });
    });

    describe('relatedVariationsSection', () => {
        let el;
        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            sandbox.stub(el.editorContextStore, 'isVariation').returns(false);
            const fragment = new Fragment({ id: 'test-id' });
            sandbox.stub(fragment, 'getLocaleVariationCount').returns(2);
            sandbox.stub(fragment, 'getGroupedVariationCount').returns(2);
            sandbox.stub(fragment, 'getPromoVariationCount').returns(1);
            el.inEdit.value = { get: () => fragment };
        });

        it('renders variation counts', () => {
            const section = el.relatedVariationsSection;
            expect(section).to.not.equal(nothing);
        });
    });

    describe('previewBorderColorAttributes', () => {
        it('detects gradient border', () => {
            const fragment = new Fragment({
                fields: [{ name: 'borderColor', values: ['blue-gradient'] }],
            });
            const el = document.createElement('mas-fragment-editor');
            el.inEdit.value = { get: () => fragment };

            const attrs = el.previewBorderColorAttributes;
            expect(attrs.gradientBorder).to.be.true;
            expect(attrs.borderColor).to.equal('blue-gradient');
        });
    });
});
