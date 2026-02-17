import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-editor.js';
import MasFragmentEditor from '../src/mas-fragment-editor.js';
import Store from '../src/store.js';
import { Fragment } from '../src/aem/fragment.js';
import { FragmentStore } from '../src/reactivity/fragment-store.js';
import { PAGE_NAMES, CARD_MODEL_PATH } from '../src/constants.js';
import router from '../src/router.js';
import Events from '../src/events.js';
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
        const el = document.createElement('mas-fragment-editor');
        expect(el.extractLocaleFromPath('/content/dam/mas/surface/en_US/fragment')).to.equal('en_US');
    });

    it('derives variation dialog offerData from fragment path', () => {
        const el = document.createElement('mas-fragment-editor');
        const fragment = new Fragment({
            id: 'test-id',
            path: '/content/dam/mas/surface/en_US/pac/fragment',
            fields: [],
            references: [],
        });
        el.inEdit.value = { get: () => fragment };

        expect(el.variationDialogOfferData).to.deep.equal({ productArrangementCode: 'pac' });
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

        beforeEach(() => {
            el = document.createElement('mas-fragment-editor');
            mockRepo = {
                refreshFragment: sandbox.stub().resolves(),
                loadPreviewPlaceholders: sandbox.stub().resolves(),
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

            // Mock Store.set to avoid structuredClone errors with class instances
            sandbox.stub(Store.fragments.inEdit, 'set').callsFake((val) => {
                Store.fragments.inEdit.value = val;
            });
        });

        it('initializes with existing store', async () => {
            const fragment = new Fragment({ id: 'test-id', path: '/content/dam/mas/s/en_US/f' });
            const fragmentStore = new FragmentStore(fragment);
            // Ensure previewStore exists to avoid ReactiveController errors
            fragmentStore.previewStore = { subscribe: sandbox.stub(), unsubscribe: sandbox.stub() };

            Store.fragments.list.data.value = [fragmentStore];
            Store.fragmentEditor.fragmentId.value = 'test-id';

            await el.initFragment();

            expect(mockRepo.refreshFragment.calledOnce).to.be.true;
            expect(el.inEdit.get()).to.equal(fragmentStore);
            expect(el.initState).to.equal('ready');
        });

        it('initializes with new fragment', async () => {
            const fragmentData = {
                id: 'new-id',
                path: '/content/dam/mas/s/en_US/f',
                fields: [],
                model: { path: CARD_MODEL_PATH },
            };
            mockRepo.aem.sites.cf.fragments.getById.resolves(fragmentData);
            Store.fragments.list.data.value = [];
            Store.fragmentEditor.fragmentId.value = 'new-id';

            await el.initFragment();

            expect(el.inEdit.get().id).to.equal('new-id');
            expect(el.initState).to.equal('ready');
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
            const fragment = new Fragment({ id: 'test-id' });
            sandbox.stub(fragment, 'getLocaleVariationCount').returns(2);
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
