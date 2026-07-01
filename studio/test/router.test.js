import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Router, promoHashIsSearchSync, translationHashIsSearchSync, orderHashParamEntries } from '../src/router.js';
import Store from '../src/store.js';
import { PAGE_NAMES, COLLECTION_MODEL_PATH, COMPARE_CHART_FIELD } from '../src/constants.js';
import { FragmentStore } from '../src/reactivity/fragment-store.js';
import { ReactiveStore } from '../src/reactivity/reactive-store.js';
import { Fragment } from '../src/aem/fragment.js';
import { Promotion } from '../src/aem/promotion.js';

describe('Router', () => {
    let sandbox;
    let router;
    let mockLocation;
    let originalPageValue;
    let originalFragmentsInEdit;
    let originalFragmentsList;
    let originalTranslationProjectsInEdit;
    let originalSelectedCards;
    let originalSelectedCollections;
    let originalSelectedPlaceholders;
    let originalTargetLocales;
    let originalSearch;
    let originalFilters;
    let originalViewMode;
    let originalFragmentEditorLoading;
    let originalFragmentEditorId;
    let originalSettingsCreating;
    let originalSettingsFragmentId;
    let originalProfile;
    let originalUsers;
    let originalUsersLoadedMeta;

    const createMockFragment = (hasChanges = false) => {
        const fragment = new Fragment({ id: 'test-id', fields: [] });
        fragment.hasChanges = hasChanges;
        const store = new FragmentStore(fragment);
        return store;
    };

    const createTranslationProjectStore = (hasChanges = false, fieldValues = {}) => {
        const fragment = new Fragment({
            id: 'test-translation-id',
            fields: [
                { name: 'fragments', values: fieldValues.fragments || [] },
                { name: 'placeholders', values: fieldValues.placeholders || [] },
                { name: 'collections', values: fieldValues.collections || [] },
                { name: 'targetLocales', values: fieldValues.targetLocales || [] },
            ],
        });
        fragment.hasChanges = hasChanges;
        const store = new FragmentStore(fragment);
        return store;
    };

    const createPromotionInEditStore = ({ hasChanges = false, fragments = [], collectionsValues } = {}) => {
        const fields = [
            { name: 'title', type: 'text', values: ['T'] },
            { name: 'promoCode', type: 'text', values: ['X'] },
            { name: 'startDate', type: 'date-time', values: ['2024-01-01T00:00:00.000Z'] },
            { name: 'endDate', type: 'date-time', values: ['2024-12-31T23:59:59.999Z'] },
            { name: 'tags', type: 'tag', values: [] },
            { name: 'surfaces', type: 'text', values: [] },
            { name: 'fragments', type: 'text', values: fragments },
        ];
        if (collectionsValues !== undefined) {
            fields.push({ name: 'collections', type: 'text', values: collectionsValues });
        }
        const promotion = new Promotion({
            id: 'promo-router',
            etag: 'e',
            model: { id: 'promotion-model' },
            path: '/content/dam/mas/promotions/router',
            title: 'T',
            description: '',
            status: 'DRAFT',
            created: { by: 'u', fullName: 'U', at: '2024-01-01T00:00:00.000Z' },
            modified: { by: 'u', fullName: 'U', at: '2024-01-02T00:00:00.000Z' },
            fields,
            tags: [],
        });
        promotion.hasChanges = hasChanges;
        return new FragmentStore(promotion);
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockLocation = {
            hash: '',
        };
        router = new Router(mockLocation);
        originalPageValue = Store.page.value;
        originalFragmentsInEdit = Store.fragments.inEdit.get();
        originalFragmentsList = Store.fragments.list.data.get();
        originalTranslationProjectsInEdit = Store.translationProjects.inEdit.get();
        originalSelectedCards = Store.translationProjects.selectedCards.value;
        originalSelectedCollections = Store.translationProjects.selectedCollections.value;
        originalSelectedPlaceholders = Store.translationProjects.selectedPlaceholders.value;
        originalTargetLocales = Store.translationProjects.targetLocales.value;
        originalSearch = structuredClone(Store.search.get());
        originalFilters = structuredClone(Store.filters.get());
        originalViewMode = Store.viewMode.get();
        originalFragmentEditorLoading = Store.fragmentEditor.loading.get();
        originalFragmentEditorId = Store.fragmentEditor.fragmentId.get();
        originalSettingsCreating = Store.settings.creating.get();
        originalSettingsFragmentId = Store.settings.fragmentId.get();
        originalProfile = structuredClone(Store.profile.get());
        originalUsers = structuredClone(Store.users.get());
        originalUsersLoadedMeta = Store.users.getMeta('loaded');
        Store.users.setMeta('loaded', true);
        Store.fragments.inEdit.set(null);
        Store.translationProjects.inEdit.set(null);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
        Store.translationProjects.targetLocales.set([]);
    });

    afterEach(() => {
        sandbox.restore();
        Store.page.value = originalPageValue;
        Store.fragments.inEdit.set(originalFragmentsInEdit);
        Store.fragments.list.data.set(originalFragmentsList);
        Store.translationProjects.inEdit.set(originalTranslationProjectsInEdit);
        Store.translationProjects.selectedCards.set(originalSelectedCards);
        Store.translationProjects.selectedCollections.set(originalSelectedCollections);
        Store.translationProjects.selectedPlaceholders.set(originalSelectedPlaceholders);
        Store.translationProjects.targetLocales.set(originalTargetLocales);
        Store.search.set(originalSearch);
        Store.filters.set(originalFilters);
        Store.viewMode.set(originalViewMode);
        Store.fragmentEditor.loading.set(originalFragmentEditorLoading);
        Store.fragmentEditor.fragmentId.set(originalFragmentEditorId);
        Store.settings.creating.set(originalSettingsCreating);
        Store.settings.fragmentId.set(originalSettingsFragmentId);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
        document
            .querySelectorAll('mas-fragment-editor, mas-translation-editor, mas-settings, mas-promotions-editor')
            .forEach((el) => el.remove());
    });

    describe('getActiveEditor', () => {
        it('should return null editor and false flags for non-editor pages', () => {
            Store.page.value = PAGE_NAMES.WELCOME;
            const result = router.getActiveEditor();
            expect(result.editor).to.be.null;
            expect(result.hasChanges).to.be.false;
            expect(result.shouldCheckUnsavedChanges).to.be.false;
        });

        it('should return fragment editor when on fragment editor page', () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(false));
            const mockEditor = document.createElement('mas-fragment-editor');
            mockEditor.isLoading = false;
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.false;
            expect(result.shouldCheckUnsavedChanges).to.be.false;
        });

        it('should return hasChanges true when fragment has unsaved changes', () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            const mockEditor = document.createElement('mas-fragment-editor');
            mockEditor.isLoading = false;
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.true;
            expect(result.shouldCheckUnsavedChanges).to.be.true;
        });

        it('should return shouldCheckUnsavedChanges true when fragment editor has changes even while loading', () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            Store.fragmentEditor.loading.set(true);
            const mockEditor = document.createElement('mas-fragment-editor');
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.true;
            expect(result.shouldCheckUnsavedChanges).to.be.true;
            Store.fragmentEditor.loading.set(false);
        });

        it('should return translation editor when on translation editor page', () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false));
            const mockEditor = document.createElement('mas-translation-editor');
            mockEditor.isLoading = false;
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.false;
            expect(result.shouldCheckUnsavedChanges).to.be.false;
        });

        it('should return hasChanges true when translation project has unsaved changes', () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(createTranslationProjectStore(true));
            const mockEditor = document.createElement('mas-translation-editor');
            mockEditor.isLoading = false;
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.true;
            expect(result.shouldCheckUnsavedChanges).to.be.true;
        });

        it('should return shouldCheckUnsavedChanges false when translation editor is loading', () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(createTranslationProjectStore(true));
            const mockEditor = document.createElement('mas-translation-editor');
            mockEditor.isLoading = true;
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.true;
            expect(result.shouldCheckUnsavedChanges).to.be.false;
        });

        it('should handle missing translation project inEdit gracefully', () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(null);
            const mockEditor = document.createElement('mas-translation-editor');
            mockEditor.isLoading = false;
            document.body.appendChild(mockEditor);
            const result = router.getActiveEditor();
            expect(result.editor).to.equal(mockEditor);
            expect(result.hasChanges).to.be.false;
            expect(result.shouldCheckUnsavedChanges).to.be.false;
        });

        it('should handle null editor element on fragment editor page', () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            const result = router.getActiveEditor();
            expect(result.editor).to.be.null;
            expect(result.hasChanges).to.be.null;
            expect(result.shouldCheckUnsavedChanges).to.be.null;
        });

        it('should handle null editor element on translation editor page', () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(createTranslationProjectStore(true));
            const result = router.getActiveEditor();
            expect(result.editor).to.be.null;
            expect(result.hasChanges).to.be.null;
            expect(result.shouldCheckUnsavedChanges).to.be.null;
        });

        describe('promotions editor page', () => {
            let originalPromotionsInEdit;
            let originalPromotionsSelectedCards;
            let originalPromotionsSelectedCollections;

            beforeEach(() => {
                Store.page.value = PAGE_NAMES.PROMOTIONS_EDITOR;
                originalPromotionsInEdit = Store.promotions.inEdit.get();
                originalPromotionsSelectedCards = [...(Store.promotions.selectedCards.value || [])];
                originalPromotionsSelectedCollections = [...(Store.promotions.selectedCollections.value || [])];
            });

            afterEach(() => {
                Store.promotions.inEdit.set(originalPromotionsInEdit);
                Store.promotions.selectedCards.set(originalPromotionsSelectedCards);
                Store.promotions.selectedCollections.set(originalPromotionsSelectedCollections);
                document.querySelectorAll('mas-promotions-editor').forEach((el) => el.remove());
            });

            it('returns promotions editor metadata when dirty and not loadingPromotion', () => {
                const editor = document.createElement('mas-promotions-editor');
                editor.loadingPromotion = false;
                document.body.appendChild(editor);
                Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: true }));
                const result = router.getActiveEditor();
                expect(result.editor).to.equal(editor);
                expect(result.hasChanges).to.be.true;
                expect(result.shouldCheckUnsavedChanges).to.be.true;
            });

            it('returns shouldCheckUnsavedChanges false while loadingPromotion even if dirty', () => {
                const editor = document.createElement('mas-promotions-editor');
                editor.loadingPromotion = true;
                document.body.appendChild(editor);
                Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: true }));
                const result = router.getActiveEditor();
                expect(result.editor).to.equal(editor);
                expect(result.hasChanges).to.be.true;
                expect(result.shouldCheckUnsavedChanges).to.be.false;
            });

            it('returns null hasChanges when editor element is missing', () => {
                Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: true }));
                const result = router.getActiveEditor();
                expect(result.editor).to.be.null;
                expect(result.hasChanges).to.be.null;
                expect(result.shouldCheckUnsavedChanges).to.be.null;
            });
        });
    });

    describe('translationEditorHasUnsavedChanges', () => {
        it('should return false when inEdit is null', () => {
            Store.translationProjects.inEdit.set(null);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.false;
        });

        it('should return true when inEdit.hasChanges is true', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(true));
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return true when selectedCards length differs from saved fragments', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { fragments: ['card1'] }));
            Store.translationProjects.selectedCards.set(['card1', 'card2']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return true when selectedCollections length differs from saved collections', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { collections: [] }));
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set(['col1']);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return true when selectedPlaceholders length differs from saved placeholders', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { placeholders: ['ph1', 'ph2'] }));
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set(['ph1']);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return true when targetLocales length differs from saved targetLocales', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { targetLocales: [] }));
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set(['de_DE']);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return true when set sizes differ due to duplicates in current values', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { fragments: ['card1', 'card2'] }));
            Store.translationProjects.selectedCards.set(['card1', 'card1']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return true when an item in current set is not in saved set', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { fragments: ['card1', 'card2'] }));
            Store.translationProjects.selectedCards.set(['card1', 'card3']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should return false when all values match saved data', () => {
            Store.translationProjects.inEdit.set(
                createTranslationProjectStore(false, {
                    fragments: ['card1', 'card2'],
                    collections: ['col1'],
                    placeholders: ['ph1'],
                    targetLocales: ['de_DE', 'fr_FR'],
                }),
            );
            Store.translationProjects.selectedCards.set(['card1', 'card2']);
            Store.translationProjects.selectedCollections.set(['col1']);
            Store.translationProjects.selectedPlaceholders.set(['ph1']);
            Store.translationProjects.targetLocales.set(['de_DE', 'fr_FR']);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.false;
        });

        it('should return false when all values are empty and match', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false));
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.false;
        });

        it('should handle null/undefined current values gracefully', () => {
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false, { fragments: ['card1'] }));
            Store.translationProjects.selectedCards.value = null;
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });

        it('should detect changes in multiple fields simultaneously', () => {
            Store.translationProjects.inEdit.set(
                createTranslationProjectStore(false, {
                    fragments: ['card1'],
                    collections: ['col1'],
                    placeholders: [],
                    targetLocales: ['en_US'],
                }),
            );
            Store.translationProjects.selectedCards.set(['card1', 'card2']); // Changed
            Store.translationProjects.selectedCollections.set(['col1']);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set(['en_US']);
            const result = router.translationEditorHasUnsavedChanges();
            expect(result).to.be.true;
        });
    });

    describe('navigateToPage', () => {
        it('should not navigate if already on the target page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const pageSetSpy = sandbox.spy(Store.page, 'set');
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(pageSetSpy.called).to.be.false;
        });

        it('should navigate directly when no unsaved changes', async () => {
            Store.page.value = PAGE_NAMES.WELCOME;
            Store.fragments.inEdit.set(null);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.page.value).to.equal(PAGE_NAMES.CONTENT);
        });

        it('should check for unsaved changes when on fragment editor', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            const mockEditor = {
                isLoading: false,
                promptDiscardChanges: sandbox.stub().resolves(true),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(Store.page.value).to.equal(PAGE_NAMES.CONTENT);
        });

        it('should not navigate when user cancels discard on fragment editor', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            const mockEditor = {
                isLoading: false,
                promptDiscardChanges: sandbox.stub().resolves(false),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(Store.page.value).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
        });

        it('should check for unsaved changes when on translation editor', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(createTranslationProjectStore(true));
            const mockEditor = {
                isLoading: false,
                promptDiscardChanges: sandbox.stub().resolves(true),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-translation-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(Store.page.value).to.equal(PAGE_NAMES.CONTENT);
        });

        it('should not navigate when user cancels discard on translation editor', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.inEdit.set(createTranslationProjectStore(true));
            const mockEditor = {
                isLoading: false,
                promptDiscardChanges: sandbox.stub().resolves(false),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-translation-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(Store.page.value).to.equal(PAGE_NAMES.TRANSLATION_EDITOR);
        });

        it('should prompt for unsaved changes even when editor is loading', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            Store.fragmentEditor.loading.set(true);
            const mockEditor = {
                promptDiscardChanges: sandbox.stub().resolves(true),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(Store.page.value).to.equal(PAGE_NAMES.CONTENT);
            Store.fragmentEditor.loading.set(false);
        });

        it('should clear fragmentId when leaving fragment editor', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(null);
            Store.fragmentEditor.fragmentId.set('test-id');
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.fragmentEditor.fragmentId.get()).to.be.null;
        });

        it('should reset regional variation locale to parent default when leaving fragment editor for content', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(null);
            Store.search.set({ ...Store.search.get(), path: 'sandbox' });
            Store.filters.set((prev) => ({ ...prev, locale: 'en_BE' }));
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.filters.value.locale).to.equal('en_US');
        });

        it('should clear translation project data when leaving translation editor', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.translationProjectId.set('test-id');
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false));
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.translationProjects.translationProjectId.get()).to.be.null;
            expect(Store.translationProjects.inEdit.get()).to.be.null;
        });

        it('clears promotion editor state when navigating away from promotions editor', async () => {
            Store.page.value = PAGE_NAMES.PROMOTIONS_EDITOR;
            Store.promotions.promotionId.set('promo-1');
            Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: true }));
            Store.promotions.showSelected.set(true);
            Store.promotions.selectedCards.set(['/a']);
            Store.promotions.selectedCollections.set(['/b']);
            Store.promotions.selectedPlaceholders.set(['/p']);
            const mockEditor = {
                loadingPromotion: false,
                promptDiscardChanges: sandbox.stub().resolves(true),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-promotions-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(Store.promotions.promotionId.get()).to.equal(null);
            expect(Store.promotions.inEdit.get()).to.equal(null);
            expect(Store.promotions.showSelected.get()).to.equal(false);
            expect(Store.promotions.selectedCards.value).to.deep.equal([]);
            expect(Store.promotions.selectedCollections.value).to.deep.equal([]);
            expect(Store.promotions.selectedPlaceholders.value).to.deep.equal([]);
            expect(Store.page.value).to.equal(PAGE_NAMES.CONTENT);
        });

        it('preserves promotion editor context when navigating to fragment editor', async () => {
            Store.page.value = PAGE_NAMES.PROMOTIONS_EDITOR;
            Store.promotions.promotionId.set('promo-1');
            Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: false }));
            const mockEditor = {
                loadingPromotion: false,
                promptDiscardChanges: sandbox.stub().resolves(true),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-promotions-editor').returns(mockEditor);
            await router.navigateToFragmentEditor('fragment-1');
            expect(Store.promotions.promotionId.get()).to.equal('promo-1');
            expect(Store.promotions.inEdit.get()).to.not.equal(null);
            expect(Store.page.value).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
        });

        it('clears promotion context when navigating from fragment editor to content', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragmentEditor.fragmentId.set('fragment-1');
            Store.promotions.promotionId.set('promo-1');
            Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: false }));
            const mockEditor = {
                promptDiscardChanges: sandbox.stub().resolves(true),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.promotions.promotionId.get()).to.equal(null);
            expect(Store.promotions.inEdit.get()).to.equal(null);
            expect(Store.page.value).to.equal(PAGE_NAMES.CONTENT);
        });
    });

    describe('linkStoreToHash with translationProjectId', () => {
        let originalTranslationProjectId;

        beforeEach(() => {
            originalTranslationProjectId = Store.translationProjects.translationProjectId.get();
        });

        afterEach(() => {
            Store.translationProjects.translationProjectId.set(originalTranslationProjectId);
        });

        it('should sync translationProjectId from hash to store on start', () => {
            mockLocation.hash = '#translationProjectId=test-project-123';
            router.start();
            expect(Store.translationProjects.translationProjectId.get()).to.equal('test-project-123');
        });

        it('should update hash when translationProjectId store changes', async () => {
            mockLocation.hash = '';
            router.start();
            Store.translationProjects.translationProjectId.set('new-project-456');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.include('translationProjectId=new-project-456');
        });

        it('should remove translationProjectId from hash when store is set to null', async () => {
            mockLocation.hash = '#translationProjectId=test-project-123';
            router.start();
            Store.translationProjects.translationProjectId.set(null);
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.not.include('translationProjectId');
        });

        it('should preserve translationProjectId alongside other hash params', async () => {
            mockLocation.hash = '#page=content&path=/content/dam/test';
            router.start();
            Store.translationProjects.translationProjectId.set('project-789');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.include('translationProjectId=project-789');
            expect(mockLocation.hash).to.include('page=content');
            expect(mockLocation.hash).to.include('path=');
        });
    });

    describe('locale and region hash params', () => {
        it('should sync region from store to hash', async () => {
            mockLocation.hash = '#page=fragment-editor&path=sandbox';
            router.start();
            Store.search.set((prev) => ({ ...prev, path: 'sandbox', region: 'en_BE' }));
            Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.include('region=en_BE');
        });

        it('should remove region from hash when cleared', async () => {
            mockLocation.hash = '#page=fragment-editor&path=sandbox&region=en_BE';
            router.start();
            Store.search.set((prev) => ({ ...prev, path: 'sandbox', region: null }));
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.not.include('region=');
        });

        it('should move regional locale from locale param to region on start', async () => {
            mockLocation.hash = '#fragmentId=test-id&locale=en_BE&page=fragment-editor&path=sandbox';
            router.start();
            expect(Store.filters.value.locale).to.equal('en_US');
            expect(Store.search.value.region).to.equal('en_BE');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.include('region=en_BE');
            expect(mockLocation.hash).to.not.include('locale=en_BE');
        });

        it('should sync locale to hash when not default', async () => {
            mockLocation.hash = '#fragmentId=test-id&page=fragment-editor&path=sandbox';
            router.start();
            Store.filters.set((prev) => ({ ...prev, locale: 'fr_FR' }));
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.include('locale=fr_FR');
        });

        it('should keep locale and region together for grouped preview', async () => {
            mockLocation.hash = '#fragmentId=test-id&page=fragment-editor&path=sandbox';
            router.start();
            Store.filters.set((prev) => ({ ...prev, locale: 'fr_FR' }));
            Store.search.set((prev) => ({ ...prev, path: 'sandbox', region: 'fr_CA' }));
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.match(/locale=fr_FR&region=fr_CA/);
        });

        it('should place region after locale without moving locale from alphabetical position', () => {
            const keys = orderHashParamEntries([
                ['fragmentId', 'test-id'],
                ['page', 'fragment-editor'],
                ['path', 'sandbox'],
                ['locale', 'fr_FR'],
                ['region', 'fr_CA'],
            ]).map(([key]) => key);
            expect(keys).to.deep.equal(['fragmentId', 'locale', 'region', 'page', 'path']);
        });
    });

    describe('navigateToVariationsTable', () => {
        it('should navigate to variations table', async () => {
            await router.navigateToVariationsTable('test-id');
            expect(Store.search.get().query).to.equal('test-id');
            expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
            expect(Store.renderMode.get()).to.equal('table');
        });

        it('should error if no fragmentId provided', async () => {
            const consoleSpy = sandbox.stub(console, 'error');
            await router.navigateToVariationsTable(null);
            expect(consoleSpy.calledWith('Fragment ID is required for navigation')).to.be.true;
        });
    });

    describe('navigateToFragmentEditor', () => {
        it('should navigate to fragment editor', async () => {
            await router.navigateToFragmentEditor('test-id');
            expect(Store.fragmentEditor.fragmentId.get()).to.equal('test-id');
            expect(Store.page.get()).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
            expect(Store.viewMode.get()).to.equal('editing');
        });

        it('should set locale if provided', async () => {
            Store.filters.value = { locale: 'en_US' };
            await router.navigateToFragmentEditor('test-id', { locale: 'fr_FR' });
            expect(Store.search.get().region).to.equal('fr_FR');
        });

        it('should navigate compare chart collections to the full-page fragment editor', async () => {
            const fragment = new Fragment({
                id: 'compare-chart-id',
                model: { path: COLLECTION_MODEL_PATH },
                fields: [{ name: COMPARE_CHART_FIELD, values: ['<mas-compare-chart></mas-compare-chart>'] }],
            });
            Store.fragments.list.data.set([new FragmentStore(fragment)]);

            await router.navigateToFragmentEditor('compare-chart-id');

            expect(Store.fragmentEditor.fragmentId.get()).to.equal('compare-chart-id');
            expect(Store.page.get()).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
            expect(Store.viewMode.get()).to.equal('editing');
        });

        it('should use editor-panel for a collection with an empty compareChart field', async () => {
            Store.page.set(PAGE_NAMES.CONTENT);
            const collectionStore = new FragmentStore(
                new Fragment({
                    id: 'empty-compare-chart-collection-id',
                    model: { path: COLLECTION_MODEL_PATH },
                    fields: [{ name: COMPARE_CHART_FIELD, values: [''] }],
                }),
            );
            const mockEditorPanel = {
                editFragment: sandbox.stub().resolves(),
            };
            sandbox.stub(document, 'querySelector').withArgs('editor-panel').returns(mockEditorPanel);

            await router.navigateToFragmentEditor('empty-compare-chart-collection-id', {
                fragmentStore: collectionStore,
            });

            expect(mockEditorPanel.editFragment.calledOnceWith(collectionStore)).to.be.true;
            expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
        });

        it('should use editor-panel for a provided collection fragment store', async () => {
            Store.page.set(PAGE_NAMES.CONTENT);
            const collectionStore = new FragmentStore(
                new Fragment({
                    id: 'collection-variation-id',
                    model: { path: COLLECTION_MODEL_PATH },
                    fields: [],
                }),
            );
            const mockEditorPanel = {
                editFragment: sandbox.stub().resolves(),
            };
            sandbox.stub(document, 'querySelector').withArgs('editor-panel').returns(mockEditorPanel);

            await router.navigateToFragmentEditor('collection-variation-id', { fragmentStore: collectionStore });

            expect(mockEditorPanel.editFragment.calledOnceWith(collectionStore)).to.be.true;
            expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
            expect(Store.viewMode.get()).to.equal('editing');
        });

        it('should open full-page editor for collection when viewPage is true', async () => {
            Store.page.set(PAGE_NAMES.CONTENT);
            const collectionStore = new FragmentStore(
                new Fragment({
                    id: 'new-collection-variation-id',
                    model: { path: COLLECTION_MODEL_PATH },
                    fields: [],
                }),
            );
            const mockEditorPanel = {
                editFragment: sandbox.stub().resolves(),
            };
            sandbox.stub(document, 'querySelector').withArgs('editor-panel').returns(mockEditorPanel);

            await router.navigateToFragmentEditor('new-collection-variation-id', {
                fragmentStore: collectionStore,
                locale: 'fr_FR',
                viewPage: true,
            });

            expect(mockEditorPanel.editFragment.called).to.be.false;
            expect(Store.fragmentEditor.fragmentId.get()).to.equal('new-collection-variation-id');
            expect(Store.page.get()).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
            expect(Store.search.get().region).to.equal('fr_FR');
        });
    });

    describe('navigateToTranslationEditor', () => {
        it('should navigate to translation editor', async () => {
            await router.navigateToTranslationEditor();
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATION_EDITOR);
        });

        it('should set prefill data if provided', async () => {
            await router.navigateToTranslationEditor({ targetLocale: 'de_DE', fragmentPath: '/path' });
            expect(Store.translationProjects.prefill.get()).to.deep.equal({
                targetLocale: 'de_DE',
                fragmentPath: '/path',
                isCollection: false,
            });
        });

        it('should set isCollection in prefill when true', async () => {
            await router.navigateToTranslationEditor({
                targetLocale: 'de_DE',
                fragmentPath: '/path',
                isCollection: true,
            });
            expect(Store.translationProjects.prefill.get()).to.deep.equal({
                targetLocale: 'de_DE',
                fragmentPath: '/path',
                isCollection: true,
            });
        });
    });

    describe('isNavigating flag', () => {
        it('should set isNavigating to true during navigation', async () => {
            Store.page.value = PAGE_NAMES.WELCOME;
            Store.fragments.inEdit.set(null);
            let wasNavigating = false;
            const originalSet = Store.page.set;
            Store.page.set = (value) => {
                wasNavigating = router.isNavigating;
                originalSet.call(Store.page, value);
            };
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(wasNavigating).to.be.true;
            expect(router.isNavigating).to.be.false;
            Store.page.set = originalSet;
        });

        it('should reset isNavigating to false after navigation completes', async () => {
            Store.page.value = PAGE_NAMES.WELCOME;
            Store.fragments.inEdit.set(null);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(router.isNavigating).to.be.false;
        });

        it('should reset isNavigating to false if navigation is cancelled', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.set(createMockFragment(true));
            const mockEditor = {
                isLoading: false,
                promptDiscardChanges: sandbox.stub().resolves(false),
            };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(router.isNavigating).to.be.false;
        });
    });

    describe('settings route and editor branches', () => {
        it('should return settings editor metadata on settings page', () => {
            Store.page.value = PAGE_NAMES.SETTINGS;
            const settingsEditor = document.createElement('mas-settings');
            settingsEditor.hasUnsavedChanges = true;
            document.body.appendChild(settingsEditor);

            const result = router.getActiveEditor();
            expect(result.editor).to.equal(settingsEditor);
            expect(result.hasChanges).to.equal(true);
            expect(result.shouldCheckUnsavedChanges).to.equal(true);
        });

        it('should return settings editor metadata on settings-editor page', () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            const settingsEditor = document.createElement('mas-settings');
            settingsEditor.hasUnsavedChanges = false;
            document.body.appendChild(settingsEditor);

            const result = router.getActiveEditor();
            expect(result.editor).to.equal(settingsEditor);
            expect(result.hasChanges).to.equal(false);
            expect(result.shouldCheckUnsavedChanges).to.equal(false);
        });

        it('should clear settings route state when returning from settings-editor to settings', async () => {
            Store.profile.set({ email: 'power@adobe.com' });
            Store.users.set([{ userPrincipalName: 'power@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
            Store.search.set({ ...Store.search.get(), path: 'acom' });
            Store.page.set(PAGE_NAMES.SETTINGS_EDITOR);
            Store.settings.creating.set(true);
            Store.settings.fragmentId.set('setting-id');

            await router.navigateToPage(PAGE_NAMES.SETTINGS)();
            expect(Store.page.get()).to.equal(PAGE_NAMES.SETTINGS);
            expect(Store.settings.creating.get()).to.equal(false);
            expect(Store.settings.fragmentId.get()).to.equal(null);
        });

        it('should clear settings route state when leaving settings pages', async () => {
            Store.page.set(PAGE_NAMES.SETTINGS);
            Store.settings.creating.set(true);
            Store.settings.fragmentId.set('setting-id');

            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
            expect(Store.settings.creating.get()).to.equal(false);
            expect(Store.settings.fragmentId.get()).to.equal(null);
        });

        it('should block unauthorized settings page navigation', async () => {
            Store.page.set(PAGE_NAMES.WELCOME);
            Store.profile.set({});
            Store.users.set([]);
            Store.settings.creating.set(true);
            Store.settings.fragmentId.set('setting-id');

            await router.navigateToPage(PAGE_NAMES.SETTINGS)();
            expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
            expect(Store.settings.creating.get()).to.equal(false);
            expect(Store.settings.fragmentId.get()).to.equal(null);
        });
    });

    describe('masks route and editor branches', () => {
        let originalMasksCreating;
        let originalMasksFragmentId;

        beforeEach(() => {
            originalMasksCreating = Store.masks.creating.get();
            originalMasksFragmentId = Store.masks.fragmentId.get();
        });

        afterEach(() => {
            Store.masks.creating.set(originalMasksCreating);
            Store.masks.fragmentId.set(originalMasksFragmentId);
        });

        it('normalizes masks-editor to masks on start when no maskName and not creating', async () => {
            mockLocation.hash = '#page=masks-editor&path=acom';
            router.start();
            expect(Store.page.get()).to.equal(PAGE_NAMES.MASKS);
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockLocation.hash).to.include('page=masks');
            expect(mockLocation.hash).to.not.include('page=masks-editor');
        });

        it('keeps masks-editor on start when maskName is present', () => {
            mockLocation.hash = '#page=masks-editor&path=acom&maskName=promo';
            router.start();
            expect(Store.page.get()).to.equal(PAGE_NAMES.MASKS_EDITOR);
        });

        it('keeps masks-editor on start when creating is true', () => {
            Store.masks.creating.set(true);
            mockLocation.hash = '#page=masks-editor&path=acom';
            router.start();
            expect(Store.page.get()).to.equal(PAGE_NAMES.MASKS_EDITOR);
        });

        it('should block unauthorized masks page navigation and redirect to welcome', async () => {
            Store.page.set(PAGE_NAMES.WELCOME);
            Store.profile.set({});
            Store.users.set([]);
            Store.masks.creating.set(true);
            Store.masks.fragmentId.set('mask-id');

            await router.navigateToPage(PAGE_NAMES.MASKS)();
            expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
            expect(Store.masks.creating.get()).to.equal(false);
            expect(Store.masks.fragmentId.get()).to.equal(null);
        });
    });

    describe('promoHashIsSearchSync', () => {
        it('returns true when only query is added on promotions-editor', () => {
            const prev = '#page=promotions-editor&path=sandbox';
            const next = '#page=promotions-editor&path=sandbox&query=a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            expect(promoHashIsSearchSync(prev, next)).to.be.true;
        });

        it('returns true when path and query change but page and promotionId stay', () => {
            const prev = '#page=promotions-editor&path=sandbox';
            const next = '#page=promotions-editor&path=nala&query=uuid';
            expect(promoHashIsSearchSync(prev, next)).to.be.true;
        });

        it('returns false when leaving promotions-editor', () => {
            const prev = '#page=promotions-editor&path=sandbox';
            const next = '#page=content&path=sandbox';
            expect(promoHashIsSearchSync(prev, next)).to.be.false;
        });

        it('returns false when promotionId changes', () => {
            const prev = '#page=promotions-editor&promotionId=a&path=sandbox';
            const next = '#page=promotions-editor&promotionId=b&path=sandbox&query=x';
            expect(promoHashIsSearchSync(prev, next)).to.be.false;
        });

        it('returns true when only tags change on promotions-editor', () => {
            const prev = '#page=promotions-editor&path=sandbox';
            const next = '#page=promotions-editor&path=sandbox&tags=mas:product_code/ffsa';
            expect(promoHashIsSearchSync(prev, next)).to.be.true;
        });

        it('returns true when tags are removed after closing the promotion item picker', () => {
            const prev = '#page=promotions-editor&path=sandbox&tags=mas:product_code/ffsa';
            const next = '#page=promotions-editor&path=sandbox';
            expect(promoHashIsSearchSync(prev, next)).to.be.true;
        });
    });

    describe('translationHashIsSearchSync', () => {
        it('returns true when item-picker search params change on translation-editor', () => {
            const prev = '#page=translation-editor&translationProjectId=p1&path=sandbox';
            const next = '#page=translation-editor&translationProjectId=p1&path=nala&query=uuid&region=de_DE';
            expect(translationHashIsSearchSync(prev, next)).to.be.true;
        });

        it('returns false when leaving the translation editor', () => {
            const prev = '#page=translation-editor&translationProjectId=p1&path=sandbox';
            const next = '#page=content&path=sandbox';
            expect(translationHashIsSearchSync(prev, next)).to.be.false;
        });

        it('returns false when translationProjectId changes', () => {
            const prev = '#page=translation-editor&translationProjectId=p1&path=sandbox';
            const next = '#page=translation-editor&translationProjectId=p2&path=sandbox&query=x';
            expect(translationHashIsSearchSync(prev, next)).to.be.false;
        });
    });

    describe('promotionsEditorHasUnsavedChanges', () => {
        let originalPromotionsInEdit;
        let originalPromotionsSelectedCards;
        let originalPromotionsSelectedCollections;
        beforeEach(() => {
            originalPromotionsInEdit = Store.promotions.inEdit.get();
            originalPromotionsSelectedCards = [...(Store.promotions.selectedCards.value || [])];
            originalPromotionsSelectedCollections = [...(Store.promotions.selectedCollections.value || [])];
            Store.promotions.inEdit.set(null);
            Store.promotions.selectedCards.set([]);
            Store.promotions.selectedCollections.set([]);
        });

        afterEach(() => {
            Store.promotions.inEdit.set(originalPromotionsInEdit);
            Store.promotions.selectedCards.set(originalPromotionsSelectedCards);
            Store.promotions.selectedCollections.set(originalPromotionsSelectedCollections);
        });

        it('returns false when there is no promotion in edit', () => {
            expect(router.promotionsEditorHasUnsavedChanges()).to.be.false;
        });

        it('returns true when promotion hasChanges is true', () => {
            Store.promotions.inEdit.set(createPromotionInEditStore({ hasChanges: true }));
            expect(router.promotionsEditorHasUnsavedChanges()).to.be.true;
        });

        it('returns false when merged card and collection selection matches saved fragments only', () => {
            Store.promotions.inEdit.set(createPromotionInEditStore({ fragments: ['/a', '/b'], hasChanges: false }));
            Store.promotions.selectedCards.set(['/a']);
            Store.promotions.selectedCollections.set(['/b']);
            expect(router.promotionsEditorHasUnsavedChanges()).to.be.false;
        });

        it('returns true when current selection has paths not in saved merged set', () => {
            Store.promotions.inEdit.set(createPromotionInEditStore({ fragments: ['/a'], hasChanges: false }));
            Store.promotions.selectedCards.set(['/a', '/extra']);
            Store.promotions.selectedCollections.set([]);
            expect(router.promotionsEditorHasUnsavedChanges()).to.be.true;
        });

        it('returns false when legacy collections field merges with fragments for comparison', () => {
            Store.promotions.inEdit.set(
                createPromotionInEditStore({
                    fragments: ['/a'],
                    collectionsValues: ['/c'],
                    hasChanges: false,
                }),
            );
            Store.promotions.selectedCards.set(['/a']);
            Store.promotions.selectedCollections.set(['/c']);
            expect(router.promotionsEditorHasUnsavedChanges()).to.be.false;
        });

        it('returns false when store includes failed-fetch fallback paths from saved fragments', () => {
            const resolved = '/content/dam/mas/promotions/test-items/resolved-card-fragment';
            const fetchFailed = '/content/dam/mas/promotions/test-items/fetch-failed-card-fragment';

            Store.promotions.inEdit.set(createPromotionInEditStore({ fragments: [resolved, fetchFailed], hasChanges: false }));
            Store.promotions.selectedCards.set([resolved, fetchFailed]);
            Store.promotions.selectedCollections.set([]);
            expect(router.promotionsEditorHasUnsavedChanges()).to.be.false;
        });
    });
});
