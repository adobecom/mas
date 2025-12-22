import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { html } from 'lit';
import { fixture, aTimeout } from '@open-wc/testing-helpers/pure';
import Store from '../src/store.js';
import { FragmentStore } from '../src/reactivity/fragment-store.js';
import { TranslationProject } from '../src/translation/translation-project.js';
import { QUICK_ACTION } from '../src/constants.js';
import '../src/swc.js';
import '../src/mas-translation-editor.js';
import { PAGE_NAMES } from '../src/constants.js';
import { spTheme } from './utils.js';

describe('MasTranslationEditor', () => {
    let sandbox;
    let mockRepository;
    let originalInEdit;
    let originalTranslationProjectId;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalInEdit = Store.translationProjects.inEdit.get();
        originalTranslationProjectId = Store.translationProjects.translationProjectId.get();
        Store.translationProjects.inEdit.set(null);
        Store.translationProjects.translationProjectId.set(null);
        mockRepository = {
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub(),
                            create: sandbox.stub(),
                            save: sandbox.stub(),
                            delete: sandbox.stub(),
                        },
                    },
                },
            },
            getTranslationsPath: sandbox.stub().returns('/content/dam/mas/translations'),
            createFragment: sandbox.stub(),
            saveFragment: sandbox.stub(),
            deleteFragment: sandbox.stub(),
        };
    });

    afterEach(() => {
        sandbox.restore();
        Store.translationProjects.inEdit.set(originalInEdit);
        Store.translationProjects.translationProjectId.set(originalTranslationProjectId);
        document.querySelectorAll('mas-repository').forEach((el) => el.remove());
    });

    const createMockTranslationProject = (overrides = {}) => {
        return new TranslationProject({
            id: 'test-project-id',
            title: 'Test Project',
            fields: [{ name: 'title', type: 'text', values: ['Test Project'] }],
            ...overrides,
        });
    };

    const createMockFragmentStore = (project) => {
        const store = new FragmentStore(project);
        sandbox.stub(store, 'updateField').callsFake((name, value) => {
            const field = project.fields.find((f) => f.name === name);
            if (field) {
                field.values = value;
            }
            project.hasChanges = true;
        });
        sandbox.stub(store, 'discardChanges').callsFake(() => {
            project.hasChanges = false;
        });
        return store;
    };

    const setupMockRepository = () => {
        const repoElement = document.createElement('div');
        repoElement.setAttribute('is', 'mas-repository');
        Object.assign(repoElement, mockRepository);
        const originalQuerySelector = document.querySelector.bind(document);
        sandbox.stub(document, 'querySelector').callsFake((selector) => {
            if (selector === 'mas-repository') {
                return repoElement;
            }
            return originalQuerySelector(selector);
        });
        return repoElement;
    };

    describe('default properties', () => {
        it('should initialize with default values', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            expect(el.isLoading).to.be.false;
            expect(el.isNewTranslationProject).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
            expect(el.disabledActions).to.be.instanceOf(Set);
            expect(el.disabledActions.has('save')).to.be.true;
            expect(el.disabledActions.has('delete')).to.be.true;
        });

        it('should have correct initial disabled actions', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const expectedDisabled = ['save', 'discard', 'delete', 'duplicate', 'publish', 'cancel', 'copy', 'lock'];
            expectedDisabled.forEach((action) => {
                expect(el.disabledActions.has(action)).to.be.true;
            });
        });
    });

    describe('connectedCallback', () => {
        it('should initialize new translation project when no id is present', async () => {
            Store.translationProjects.translationProjectId.set(null);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            expect(el.isNewTranslationProject).to.be.true;
            expect(el.fragmentStore).to.exist;
            expect(el.fragment).to.exist;
            expect(el.fragment.fields).to.have.lengthOf(1);
            expect(el.fragment.fields[0].name).to.equal('title');
        });

        it('should load existing translation project when id is present', async () => {
            const mockProject = createMockTranslationProject();
            setupMockRepository();
            mockRepository.aem.sites.cf.fragments.getById.resolves({
                id: 'test-project-id',
                title: 'Test Project',
                fields: [{ name: 'title', type: 'text', values: ['Test Project'] }],
            });
            Store.translationProjects.translationProjectId.set('test-project-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await aTimeout(100);
            expect(el.isNewTranslationProject).to.be.false;
            expect(mockRepository.aem.sites.cf.fragments.getById.calledWith('test-project-id')).to.be.true;
        });

        it('should enable delete action when editing existing project', async () => {
            const mockProject = createMockTranslationProject();
            setupMockRepository();
            mockRepository.aem.sites.cf.fragments.getById.resolves({
                id: 'test-project-id',
                title: 'Test Project',
                fields: [{ name: 'title', type: 'text', values: ['Test Project'] }],
            });
            Store.translationProjects.translationProjectId.set('test-project-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await aTimeout(100);
            expect(el.disabledActions.has('delete')).to.be.false;
        });
    });

    describe('fragment getter', () => {
        it('should return null when fragmentStore is not set', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            Store.translationProjects.inEdit.set(null);
            expect(el.fragment).to.be.undefined;
        });

        it('should return fragment from store when set', async () => {
            const mockProject = createMockTranslationProject();
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.translationProjectId.set('test-project-id');
            Store.translationProjects.inEdit.set(mockStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await el.updateComplete;
            expect(el.fragment.id).to.equal(mockProject.id);
            expect(el.fragment.title).to.equal(mockProject.title);
        });
    });

    describe('repository getter', () => {
        it('should return mas-repository element from document', async () => {
            const repoElement = setupMockRepository();
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            expect(el.repository).to.equal(repoElement);
        });
    });

    describe('translationStatus getter', () => {
        it('should return correct status message', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            expect(el.translationStatus).to.equal(
                'All required languages have been preselected for this project. They are mandatory and cannot be changed.',
            );
        });
    });

    describe('render', () => {
        it('should render breadcrumbs', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const breadcrumbs = el.shadowRoot.querySelector('sp-breadcrumbs');
            expect(breadcrumbs).to.exist;
        });

        it('should render "Create new project" header when isNewTranslationProject is true', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const header = el.shadowRoot.querySelector('.header h1');
            expect(header.textContent).to.equal('Create new project');
        });

        it('should render "Edit project" header when editing existing project', async () => {
            const mockProject = createMockTranslationProject();
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            Store.translationProjects.translationProjectId.set('test-project-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            el.isNewTranslationProject = false;
            await el.updateComplete;
            const header = el.shadowRoot.querySelector('.header h1');
            expect(header.textContent).to.equal('Edit project');
        });

        it('should render loading spinner when isLoading is true', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            el.isLoading = true;
            await el.updateComplete;
            const spinner = el.shadowRoot.querySelector('sp-progress-circle');
            expect(spinner).to.exist;
        });

        it('should render form when not loading', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const form = el.shadowRoot.querySelector('.translation-editor-form');
            expect(form).to.exist;
        });

        it('should render title text field', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const titleField = el.shadowRoot.querySelector('sp-textfield#title');
            expect(titleField).to.exist;
            expect(titleField.dataset.field).to.equal('title');
        });

        it('should render translation languages section', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const languagesSection = el.shadowRoot.querySelector('.form-field h2');
            const sectionHeaders = el.shadowRoot.querySelectorAll('.form-field h2');
            const headersArray = Array.from(sectionHeaders);
            const hasLanguagesHeader = headersArray.some((h) => h.textContent === 'Translation languages');
            expect(hasLanguagesHeader).to.be.true;
        });

        it('should render select files section', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const selectFilesSection = el.shadowRoot.querySelector('.select-files');
            expect(selectFilesSection).to.exist;
        });

        it('should render mas-quick-actions component', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quickActions).to.exist;
            expect(quickActions.actions).to.deep.equal([
                QUICK_ACTION.SAVE,
                QUICK_ACTION.DUPLICATE,
                QUICK_ACTION.PUBLISH,
                QUICK_ACTION.CANCEL,
                QUICK_ACTION.COPY,
                QUICK_ACTION.LOCK,
                QUICK_ACTION.DISCARD,
                QUICK_ACTION.DELETE,
            ]);
        });
    });

    describe('confirm dialog', () => {
        it('should not render confirm dialog when confirmDialogConfig is null', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.not.exist;
        });

        it('should render confirm dialog when confirmDialogConfig is set', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            el.confirmDialogConfig = {
                title: 'Test Title',
                message: 'Test Message',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => {},
                onCancel: () => {},
            };
            await el.updateComplete;
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.exist;
            const dialogWrapper = dialog.querySelector('sp-dialog-wrapper');
            expect(dialogWrapper).to.exist;
            expect(dialogWrapper.headline).to.equal('Test Title');
        });

        it('should close dialog and call onConfirm when confirm is clicked', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const onConfirmSpy = sandbox.spy();
            el.confirmDialogConfig = {
                title: 'Test Title',
                message: 'Test Message',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: onConfirmSpy,
                onCancel: () => {},
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new Event('confirm'));
            await el.updateComplete;
            expect(onConfirmSpy.calledOnce).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
        });

        it('should close dialog and call onCancel when cancel is clicked', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const onCancelSpy = sandbox.spy();
            el.confirmDialogConfig = {
                title: 'Test Title',
                message: 'Test Message',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => {},
                onCancel: onCancelSpy,
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new Event('cancel'));
            await el.updateComplete;
            expect(onCancelSpy.calledOnce).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
        });
    });

    describe('add files dialog', () => {
        it('should render add files overlay trigger', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const overlayTrigger = el.shadowRoot.querySelector('overlay-trigger#add-files-overlay');
            expect(overlayTrigger).to.exist;
        });

        it('should render add files dialog wrapper', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const dialogWrapper = el.shadowRoot.querySelector(
                'overlay-trigger#add-files-overlay sp-dialog-wrapper[slot="click-content"]',
            );
            expect(dialogWrapper).to.exist;
            expect(dialogWrapper.getAttribute('headline')).to.equal('Select files');
        });
    });

    describe('fragment update handling', () => {
        it('should enable save and discard actions on fragment update', async () => {
            const mockProject = createMockTranslationProject();
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const titleField = el.shadowRoot.querySelector('sp-textfield#title');
            titleField.value = 'New Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.disabledActions.has('save')).to.be.false;
            expect(el.disabledActions.has('discard')).to.be.false;
        });
    });

    describe('disabledActions updates', () => {
        it('should correctly add actions to disabled set', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            expect(el.disabledActions.has('save')).to.be.true;
        });

        it('should correctly remove actions from disabled set', async () => {
            const mockProject = createMockTranslationProject();
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            Store.translationProjects.translationProjectId.set('test-project-id');
            setupMockRepository();
            mockRepository.aem.sites.cf.fragments.getById.resolves({
                id: 'test-project-id',
                title: 'Test Project',
                fields: [{ name: 'title', type: 'text', values: ['Test Project'] }],
            });
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await aTimeout(100);
            expect(el.disabledActions.has('delete')).to.be.false;
        });
    });

    describe('error handling', () => {
        it('should handle error when loading translation project fails', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            setupMockRepository();
            mockRepository.aem.sites.cf.fragments.getById.rejects(new Error('Load failed'));
            Store.translationProjects.translationProjectId.set('test-project-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await aTimeout(100);
            expect(consoleErrorStub.called).to.be.true;
            expect(el.isLoading).to.be.false;
        });
    });

    describe('storeController', () => {
        it('should initialize storeController after connectedCallback', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            expect(el.storeController).to.exist;
        });
    });

    describe('form field display', () => {
        it('should display title value from fragment', async () => {
            const mockProject = createMockTranslationProject();
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.translationProjectId.set('test-project-id');
            Store.translationProjects.inEdit.set(mockStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await el.updateComplete;
            await aTimeout(50);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('sp-textfield#title');
            expect(titleField.getAttribute('value')).to.equal('Test Project');
        });
    });

    describe('breadcrumb navigation', () => {
        it('should have Translations breadcrumb item with click handler', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems[0]).to.exist;
            expect(breadcrumbItems[0].textContent).to.equal('Translations');
        });

        it('should show "Create new project" in breadcrumb for new project', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems[1].textContent).to.equal('Create new project');
        });

        it('should show "Edit project" in breadcrumb when editing', async () => {
            const mockProject = createMockTranslationProject();
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            el.isNewTranslationProject = false;
            await el.updateComplete;
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems[1].textContent).to.equal('Edit project');
        });
    });

    describe('form sections', () => {
        it('should render General Info section', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const generalInfoSection = el.shadowRoot.querySelector('.general-info');
            expect(generalInfoSection).to.exist;
            const heading = generalInfoSection.querySelector('h2');
            expect(heading.textContent).to.equal('General Info');
        });

        it('should render required label for title field', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const fieldLabel = el.shadowRoot.querySelector('sp-field-label[for="title"]');
            expect(fieldLabel).to.exist;
            expect(fieldLabel.hasAttribute('required')).to.be.true;
        });

        it('should render Add files button with icon', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const addFilesSection = el.shadowRoot.querySelector('.files-empty-state');
            expect(addFilesSection).to.exist;
            const addButton = addFilesSection.querySelector('sp-button');
            expect(addButton).to.exist;
            expect(addButton.hasAttribute('icon-only')).to.be.true;
            const icon = addButton.querySelector('sp-icon-add');
            expect(icon).to.exist;
        });
    });

    describe('promptDiscardChanges', () => {
        it('should return true when fragment has no changes', async () => {
            const mockProject = createMockTranslationProject();
            mockProject.hasChanges = false;
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const result = await el.promptDiscardChanges();
            expect(result).to.be.true;
        });

        it('should return true when fragment is null', async () => {
            Store.translationProjects.inEdit.set(null);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            el.inEdit.set(null);
            const result = await el.promptDiscardChanges();
            expect(result).to.be.true;
        });

        it('should show dialog when fragment has changes', async () => {
            const mockProject = createMockTranslationProject();
            mockProject.hasChanges = true;
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            Store.translationProjects.translationProjectId.set('test-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await el.updateComplete;
            el.fragmentStore.get().hasChanges = true;
            const promptPromise = el.promptDiscardChanges();
            await new Promise((resolve) => setTimeout(resolve, 10));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig).to.not.be.null;
            expect(el.confirmDialogConfig.title).to.equal('Discard Changes');
            expect(el.confirmDialogConfig.message).to.equal(
                'You have unsaved changes. Are you sure you want to leave this page?',
            );
            el.confirmDialogConfig.onConfirm();
            const result = await promptPromise;
            expect(result).to.be.true;
        });

        it('should return false when user cancels discard dialog', async () => {
            const mockProject = createMockTranslationProject();
            mockProject.hasChanges = true;
            const mockStore = new FragmentStore(mockProject);
            Store.translationProjects.inEdit.set(mockStore);
            Store.translationProjects.translationProjectId.set('test-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            await el.updateComplete;
            el.fragmentStore.get().hasChanges = true;
            const promptPromise = el.promptDiscardChanges();
            await new Promise((resolve) => setTimeout(resolve, 10));
            await el.updateComplete;
            el.confirmDialogConfig.onCancel();
            const result = await promptPromise;
            expect(result).to.be.false;
        });
    });

    describe('breadcrumb click navigation', () => {
        it('should navigate to translations page when breadcrumb is clicked', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`, {
                parentNode: spTheme(),
            });
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            const translationsBreadcrumb = breadcrumbItems[0];
            expect(translationsBreadcrumb).to.exist;
            expect(translationsBreadcrumb.textContent).to.equal('Translations');
            translationsBreadcrumb.dispatchEvent(new Event('click'));
            expect(Store.page.value).to.equal(PAGE_NAMES.TRANSLATIONS);
        });
    });
});
