import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Router } from '../src/router.js';
import Store from '../src/store.js';
import { PAGE_NAMES } from '../src/constants.js';
import { FragmentStore } from '../src/reactivity/fragment-store.js';
import { Fragment } from '../src/aem/fragment.js';

describe('Router', () => {
    let sandbox;
    let router;
    let mockLocation;
    let originalPageValue;
    let originalFragmentsInEdit;
    let originalTranslationProjectsInEdit;
    let originalSelectedCards;
    let originalSelectedCollections;
    let originalSelectedPlaceholders;
    let originalTargetLocales;

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

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockLocation = {
            hash: '',
        };
        router = new Router(mockLocation);
        originalPageValue = Store.page.value;
        originalFragmentsInEdit = Store.fragments.inEdit.get();
        originalTranslationProjectsInEdit = Store.translationProjects.inEdit.get();
        originalSelectedCards = Store.translationProjects.selectedCards.value;
        originalSelectedCollections = Store.translationProjects.selectedCollections.value;
        originalSelectedPlaceholders = Store.translationProjects.selectedPlaceholders.value;
        originalTargetLocales = Store.translationProjects.targetLocales.value;
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
        Store.translationProjects.inEdit.set(originalTranslationProjectsInEdit);
        Store.translationProjects.selectedCards.set(originalSelectedCards);
        Store.translationProjects.selectedCollections.set(originalSelectedCollections);
        Store.translationProjects.selectedPlaceholders.set(originalSelectedPlaceholders);
        Store.translationProjects.targetLocales.set(originalTargetLocales);
        document.querySelectorAll('mas-fragment-editor, mas-translation-editor').forEach((el) => el.remove());
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

        it('should clear translation project data when leaving translation editor', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.translationProjectId.set('test-id');
            Store.translationProjects.inEdit.set(createTranslationProjectStore(false));
            await router.navigateToPage(PAGE_NAMES.CONTENT)();
            expect(Store.translationProjects.translationProjectId.get()).to.be.null;
            expect(Store.translationProjects.inEdit.get()).to.be.null;
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
});
