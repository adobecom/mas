import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { html } from 'lit';
import { fixture, fixtureCleanup, aTimeout } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { TranslationProject } from '../../src/translation/translation-project.js';
import { QUICK_ACTION, PAGE_NAMES } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/translation/mas-translation-editor.js';
import router from '../../src/router.js';

describe('MasTranslationEditor', () => {
    let sandbox;

    const createMockTranslationProject = (id, title, items = [], targetLocales = []) => {
        return new TranslationProject({
            id,
            title,
            fields: [
                { name: 'title', type: 'text', multiple: false, values: [title] },
                { name: 'status', type: 'text', multiple: false, values: [] },
                { name: 'items', type: 'content-fragment', multiple: true, values: items },
                { name: 'targetLocales', type: 'text', multiple: true, values: targetLocales },
                { name: 'submissionDate', type: 'date-time', multiple: false, values: [] },
            ],
        });
    };

    const createMockFragmentStore = (id, title, items = [], targetLocales = []) => {
        const project = createMockTranslationProject(id, title, items, targetLocales);
        return new FragmentStore(project);
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.translationProjectId.value = null;
        Store.translationProjects.showSelected.value = false;
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.translationProjectId.value = null;
        Store.translationProjects.showSelected.value = false;
    });

    describe('initialization', () => {
        it('should initialize with default values', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.isLoading).to.be.false;
            expect(el.isDialogOpen).to.be.false;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isSelectedFilesOpen).to.be.false;
            expect(el.isSelectedLangsOpen).to.be.false;
            expect(el.isOverlayOpen).to.be.false;
        });

        it('should initialize as new translation project when no translationProjectId', async () => {
            Store.translationProjects.translationProjectId.value = null;
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.isNewTranslationProject).to.be.true;
            expect(el.showSelectedEmptyState).to.be.true;
            expect(el.showLangSelectedEmptyState).to.be.true;
        });

        it('should have default disabled actions', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.DISCARD)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.DUPLICATE)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.LOC)).to.be.true;
        });

        it.skip('should load existing translation project when translationProjectId is set', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project', ['item1', 'item2']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.isNewTranslationProject).to.be.false;
            expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.false;
        });
    });

    describe('getters', () => {
        it('repository getter should return null when mas-repository is not found', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.repository).to.be.null;
        });

        it('translationProject getter should return store value', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.translationProject.id).to.equal('123');
            expect(el.translationProject.getFieldValue('title')).to.equal('Test Project');
        });

        it('translationProjectStore getter should return store from Store', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.translationProjectStore.get().id).to.equal('123');
        });
    });

    describe('rendering', () => {
        it('should render breadcrumb navigation', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const breadcrumb = el.shadowRoot.querySelector('.translation-editor-breadcrumb');
            expect(breadcrumb).to.exist;
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems.length).to.equal(2);
            expect(breadcrumbItems[0].textContent).to.equal('Translations');
        });

        it('should render Create new project title when new', async () => {
            Store.translationProjects.translationProjectId.value = null;
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const header = el.shadowRoot.querySelector('.header h1');
            expect(header.textContent).to.equal('Create new project');
        });

        it('should render Edit project title when editing', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const header = el.shadowRoot.querySelector('.header h1');
            expect(header.textContent).to.equal('Edit project');
        });

        it('should render loading indicator when loading', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isLoading = true;
            await el.updateComplete;
            const loadingContainer = el.shadowRoot.querySelector('.loading-container');
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(loadingContainer).to.exist;
            expect(progressCircle).to.exist;
        });

        it('should render General Info section', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const generalInfo = el.shadowRoot.querySelector('.general-info');
            expect(generalInfo).to.exist;
            const titleField = el.shadowRoot.querySelector('#title');
            expect(titleField).to.exist;
        });

        it('should render empty state for files when no files selected', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const emptyState = el.shadowRoot.querySelector('.files-empty-state');
            expect(emptyState).to.exist;
            expect(emptyState.textContent).to.include('Add files');
            const langEmptyState = el.shadowRoot.querySelector('.languages-empty-state');
            expect(langEmptyState).to.exist;
            expect(langEmptyState.textContent).to.include('Add languages');
        });

        it('should render mas-quick-actions component', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quickActions).to.exist;
        });
    });

    describe('title field interaction', () => {
        it.skip('should display title value from translation project', async () => {
            const mockStore = createMockFragmentStore('123', 'My Test Title');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            expect(titleField.value).to.equal('My Test Title');
        });

        it.skip('should update store when title field changes', async () => {
            const mockStore = createMockFragmentStore('123', 'Original Title');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'Updated Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
            expect(el.disabledActions.has(QUICK_ACTION.DISCARD)).to.be.false;
        });
    });

    describe('confirmation dialog', () => {
        it('should not render dialog when confirmDialogConfig is null', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.be.null;
        });

        it('should render dialog when confirmDialogConfig is set', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.confirmDialogConfig = {
                title: 'Test Title',
                message: 'Test Message',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'primary',
                onConfirm: () => {},
                onCancel: () => {},
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.exist;
        });

        it('should close dialog and call onConfirm when confirmed', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            let confirmed = false;
            el.confirmDialogConfig = {
                title: 'Test',
                message: 'Test',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'primary',
                onConfirm: () => {
                    confirmed = true;
                },
                onCancel: () => {},
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(confirmed).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
        });

        it('should close dialog and call onCancel when canceled', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            let cancelled = false;
            el.confirmDialogConfig = {
                title: 'Test',
                message: 'Test',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'primary',
                onConfirm: () => {},
                onCancel: () => {
                    cancelled = true;
                },
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            expect(cancelled).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
        });
    });

    describe('promptDiscardChanges', () => {
        it('should return true when no changes and no selected files', async () => {
            const mockProject = createMockTranslationProject('123', 'Test');
            mockProject.hasChanges = false;
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.value = mockStore;
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const result = await el.promptDiscardChanges();
            expect(result).to.be.true;
        });

        it('should show dialog when there are changes', async () => {
            const mockProject = createMockTranslationProject('123', 'Test', ['item1']);
            mockProject.hasChanges = true;
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const promptPromise = el.promptDiscardChanges();
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig).to.not.be.null;
            expect(el.confirmDialogConfig.title).to.equal('Discard Changes');
            // Confirm the dialog to resolve the promise
            el.confirmDialogConfig.onConfirm();
            const result = await promptPromise;
            expect(result).to.be.true;
        });
    });

    describe('breadcrumb navigation', () => {
        it('should navigate to translations page when breadcrumb is clicked', async () => {
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const breadcrumbItem = el.shadowRoot.querySelector('sp-breadcrumb-item');
            breadcrumbItem.click();
            await el.updateComplete;
            expect(navigateStub.calledWith(PAGE_NAMES.TRANSLATIONS)).to.be.true;
        });
    });

    describe('createSnapshot', () => {
        it.skip('should set isOverlayOpen to true', async () => {
            const mockStore = createMockFragmentStore('123', 'Test', ['item1', 'item2']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            el.createSnapshot();
            expect(el.isOverlayOpen).to.be.true;
        });

        it.skip('should create snapshot of selected files', async () => {
            const mockStore = createMockFragmentStore('123', 'Test', ['item1', 'item2'], ['lang1', 'lang2', 'lang3']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            el.createSnapshot();
            expect(el.selectedFilesSnapshot.size).to.equal(2);
            expect(el.selectedFilesSnapshot.has('item1')).to.be.true;
            expect(el.selectedFilesSnapshot.has('item2')).to.be.true;
            el.createLangSnapshot();
            expect(el.selectedLangs.length).to.equal(3);
            expect(el.selectedLangs.includes('lang1')).to.be.true;
            expect(el.selectedLangs.includes('lang2')).to.be.true;
            expect(el.selectedLangs.includes('lang3')).to.be.true;
        });
    });

    describe('selected files section', () => {
        it.skip('should show file count in header', async () => {
            const mockStore = createMockFragmentStore('123', 'Test', ['item1', 'item2', 'item3'], ['lang1', 'lang2']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = false;
            el.showLangSelectedEmptyState = false;
            await el.updateComplete;
            const header = el.shadowRoot.querySelector('.selected-files-header h2');
            expect(header.textContent).to.include('3');
            const langHeader = el.shadowRoot.querySelector('.selected-langs-header h2');
            expect(langHeader.textContent).to.include('2');
        });

        it.skip('should toggle selected files visibility', async () => {
            const mockStore = createMockFragmentStore('123', 'Test', ['item1']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = false;
            await el.updateComplete;
            expect(el.isSelectedFilesOpen).to.be.false;
            const toggleBtn = el.shadowRoot.querySelector('.selected-files .toggle-btn');
            toggleBtn.click();
            await el.updateComplete;
            expect(el.isSelectedFilesOpen).to.be.true;
        });

        it.skip('should toggle selected languages visibility', async () => {
            const mockStore = createMockFragmentStore('123', 'Test', [], ['lang1', 'lang2']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = false;
            await el.updateComplete;
            expect(el.isSelectedLangsOpen).to.be.false;
            const toggleBtn = el.shadowRoot.querySelector('.selected-langs .toggle-btn');
            toggleBtn.click();
            await el.updateComplete;
            expect(el.isSelectedLangsOpen).to.be.true;
            const langList = el.shadowRoot.querySelector('.selected-langs-list');
            expect(langList.textContent.trim()).to.equal('lang1, lang2');
        });

        it.skip('should render mas-select-fragments-table when expanded', async () => {
            const mockStore = createMockFragmentStore('123', 'Test', ['item1']);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = false;
            el.isSelectedFilesOpen = true;
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('mas-select-fragments-table');
            expect(table).to.exist;
        });
    });

    describe('add files dialog', () => {
        it('should render add files dialog in overlay trigger', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('overlay-trigger');
            expect(overlayTrigger).to.exist;
            const dialogWrapper = el.shadowRoot.querySelector('.add-files-dialog');
            expect(dialogWrapper).to.exist;
        });
    });

    describe('add languages dialog', () => {
        it('should render add languages dialog in overlay trigger', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('overlay-trigger');
            expect(overlayTrigger).to.exist;
            const dialogWrapper = el.shadowRoot.querySelector('.add-langs-dialog');
            expect(dialogWrapper).to.exist;
        });

        it('should render mas-translation-langs when overlay is open', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const translationFiles = el.shadowRoot.querySelector('mas-translation-langs');
            expect(translationFiles).to.exist;
        });
    });

    describe('quick actions', () => {
        it('should pass disabled actions to mas-quick-actions', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quickActions.disabled).to.equal(el.disabledActions);
        });

        it.skip('should enable DELETE action when editing existing project', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.false;
        });

        it.skip('should enable SAVE and DISCARD when field is updated', async () => {
            const mockStore = createMockFragmentStore('123', 'Test');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'New Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
            expect(el.disabledActions.has(QUICK_ACTION.DISCARD)).to.be.false;
        });
    });

    describe('discard changes', () => {
        it.skip('should show dialog when discarding with unsaved changes', async () => {
            const mockProject = createMockTranslationProject('123', 'Test');
            mockProject.hasChanges = true;
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('discard', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig.title).to.equal('Confirm Discard');
        });
    });

    describe('delete translation project', () => {
        it.skip('should show confirmation dialog when delete is triggered', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig.title).to.equal('Delete Translation Project');
        });

        it.skip('should not open dialog if already open', async () => {
            const mockStore = createMockFragmentStore('123', 'Test Project');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isDialogOpen = true;
            el.confirmDialogConfig = { title: 'Existing' };
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.confirmDialogConfig.title).to.equal('Existing');
        });
    });

    describe('breadcrumb text', () => {
        it('should show Create new project in breadcrumb for new project', async () => {
            Store.translationProjects.translationProjectId.value = null;
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems[1].textContent).to.equal('Create new project');
        });

        it('should show Edit project in breadcrumb for existing project', async () => {
            const mockStore = createMockFragmentStore('123', 'Test');
            Store.translationProjects.inEdit.value = mockStore;
            Store.translationProjects.translationProjectId.value = '123';
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems[1].textContent).to.equal('Edit project');
        });
    });
});
