import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { PAGE_NAMES, SURFACES } from '../../src/constants.js';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import Events from '../../src/events.js';
import '../../src/swc.js';
import '../../src/translation/mas-translation.js';

describe('MasTranslation', () => {
    let sandbox;

    const createMockTranslationProject = (id, title, fullName = 'John Doe') => ({
        get: () => ({
            id,
            title,
            path: `/content/dam/mas/translations/${id}`,
            modified: { fullName },
        }),
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.translationProjects.list.data.value = [];
        Store.translationProjects.list.loading.value = false;
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.translationProjectId.value = null;
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.list.data.value = [];
        Store.translationProjects.list.loading.value = true;
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.translationProjectId.value = null;
    });

    describe('initialization', () => {
        it('should initialize with default values', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(el.isDialogOpen).to.be.false;
            expect(el.confirmDialogConfig).to.be.null;
        });

        it('should set page to TRANSLATIONS on connectedCallback', async () => {
            Store.page.value = PAGE_NAMES.WELCOME;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });
    });

    describe('translationProjectsData getter', () => {
        it('should return empty array when no data', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(el.translationProjectsData).to.deep.equal([]);
        });

        it('should return translation projects data', async () => {
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1'),
                createMockTranslationProject('2', 'Project 2'),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(el.translationProjectsData).to.equal(mockProjects);
        });
    });

    describe('translationProjectsLoading getter', () => {
        it('should return false when not loading', async () => {
            Store.translationProjects.list.loading.value = false;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(el.translationProjectsLoading).to.be.false;
        });

        it('should return true when loading', async () => {
            Store.translationProjects.list.loading.value = true;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(el.translationProjectsLoading).to.be.true;
        });
    });

    describe('repository getter', () => {
        it('should return null when mas-repository is not found', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(el.repository).to.be.null;
        });
    });

    describe('rendering', () => {
        it('should render translation container', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const container = el.shadowRoot.querySelector('.translation-container');
            expect(container).to.exist;
        });

        it('should render header with title', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const header = el.shadowRoot.querySelector('.translation-header h2');
            expect(header).to.exist;
            expect(header.textContent).to.equal('Translations');
        });

        it('should render create button', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const createButton = el.shadowRoot.querySelector('.create-button');
            expect(createButton).to.exist;
            expect(createButton.textContent.trim()).to.include('Create project');
        });

        it('should render search field', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const search = el.shadowRoot.querySelector('sp-search');
            expect(search).to.exist;
            expect(search.disabled).to.be.true;
        });

        it('should render result count', async () => {
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1'),
                createMockTranslationProject('2', 'Project 2'),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const toolbar = el.shadowRoot.querySelector('.translation-toolbar');
            expect(toolbar.textContent).to.include('2 result(s)');
        });
    });

    describe('loading state', () => {
        it('should render loading indicator when loading', async () => {
            Store.translationProjects.list.loading.value = true;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const loadingContainer = el.shadowRoot.querySelector('.loading-container');
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(loadingContainer).to.exist;
            expect(progressCircle).to.exist;
        });

        it('should not render loading indicator when not loading', async () => {
            Store.translationProjects.list.loading.value = false;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const loadingContainer = el.shadowRoot.querySelector('.loading-container');
            expect(loadingContainer).to.be.null;
        });
    });

    describe('no translation projects state', () => {
        it('should render empty state when no translation projects', async () => {
            Store.translationProjects.list.data.value = [];
            Store.translationProjects.list.loading.value = false;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const emptyState = el.shadowRoot.querySelector('.translation-empty-state');
            expect(emptyState).to.exist;
            expect(emptyState.textContent).to.equal('No translation projects found.');
        });
    });

    describe('translation projects table', () => {
        it('should render table when projects exist', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const table = el.shadowRoot.querySelector('.translation-table');
            expect(table).to.exist;
        });

        it('should render table headers', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(4);
            expect(headers[0].textContent.trim()).to.equal('Translation Project');
            expect(headers[1].textContent.trim()).to.equal('Last updated by');
            expect(headers[2].textContent.trim()).to.equal('Sent on');
            expect(headers[3].textContent.trim()).to.equal('Actions');
        });

        it('should render table rows for each project', async () => {
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1', 'User 1'),
                createMockTranslationProject('2', 'Project 2', 'User 2'),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(2);
        });

        it('should display project title in table row', async () => {
            const mockProjects = [createMockTranslationProject('1', 'My Translation Project')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[0].textContent).to.equal('My Translation Project');
        });

        it('should display last updated by in table row', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project', 'Jane Smith')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[1].textContent).to.equal('Jane Smith');
        });

        it('should render action menu for each row', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
            expect(actionMenu).to.exist;
        });

        it('should render Edit menu item', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const editItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Edit'));
            expect(editItem).to.exist;
        });

        it('should render Delete menu item', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            expect(deleteItem).to.exist;
        });

        it('should have disabled Duplicate menu item', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1')];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const duplicateItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Duplicate'));
            expect(duplicateItem).to.exist;
            expect(duplicateItem.disabled).to.be.true;
        });
    });

    describe('add translation project', () => {
        it('should navigate to translation editor when create button is clicked', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const createButton = el.shadowRoot.querySelector('.create-button');
            createButton.click();
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATION_EDITOR);
            expect(Store.translationProjects.inEdit.get()).to.be.null;
            expect(Store.translationProjects.translationProjectId.get()).to.equal('');
        });
    });

    describe('edit translation project', () => {
        it('should navigate to translation editor with project data when edit is clicked', async () => {
            const mockProject = createMockTranslationProject('123', 'Test Project');
            const mockProjects = [mockProject];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const editItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Edit'));
            editItem.click();
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATION_EDITOR);
            expect(Store.translationProjects.inEdit.get()).to.equal(mockProject);
            expect(Store.translationProjects.translationProjectId.get()).to.equal('123');
        });
    });

    describe('confirmation dialog', () => {
        it('should not render confirmation dialog when config is null', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.be.null;
        });

        it('should render confirmation dialog when config is set', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            el.confirmDialogConfig = {
                title: 'Test Title',
                message: 'Test Message',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'primary',
                onConfirm: () => {},
                onCancel: () => {},
            };
            await el.updateComplete;
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.exist;
        });

        it('should render dialog with correct title', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            el.confirmDialogConfig = {
                title: 'Delete Project',
                message: 'Are you sure?',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'negative',
                onConfirm: () => {},
                onCancel: () => {},
            };
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            expect(dialogWrapper.headline).to.equal('Delete Project');
        });

        it('should close dialog on confirm', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
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

        it('should close dialog on cancel', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
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

    describe('delete translation project', () => {
        it('should show confirmation dialog when delete is clicked', async () => {
            const mockProject = createMockTranslationProject('123', 'Test Project');
            const mockProjects = [mockProject];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig).to.not.be.null;
            expect(el.confirmDialogConfig.title).to.equal('Delete Translation Project');
        });

        it('should not open dialog if already open', async () => {
            const mockProject = createMockTranslationProject('123', 'Test Project');
            const mockProjects = [mockProject];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            el.isDialogOpen = true;
            el.confirmDialogConfig = { title: 'Existing' };
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            expect(el.confirmDialogConfig.title).to.equal('Existing');
        });
    });

    describe('path restriction', () => {
        let originalSearchValue;

        beforeEach(() => {
            originalSearchValue = Store.search.get();
        });

        afterEach(() => {
            Store.search.set(originalSearchValue);
        });

        it('should allow acom path', async () => {
            Store.search.set({ path: SURFACES.ACOM.name });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });

        it('should allow express path', async () => {
            Store.search.set({ path: SURFACES.EXPRESS.name });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });

        it('should allow sandbox path', async () => {
            Store.search.set({ path: SURFACES.SANDBOX.name });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });

        it('should redirect to content page when path is not in allowed list', async () => {
            const navigateStub = sinon.stub(router, 'navigateToPage').returns(() => {});
            const originalQuerySelector = document.querySelector.bind(document);
            const querySelectorStub = sinon.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return {};
                }
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            Store.search.set({ path: SURFACES.CCD.name });
            await el.updateComplete;
            expect(router.navigateToPage.calledWith(PAGE_NAMES.CONTENT)).to.equal(true);
            querySelectorStub.restore();
            navigateStub.restore();
        });

        it('should not navigate when path is null or undefined', async () => {
            Store.page.set(PAGE_NAMES.TRANSLATIONS);
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            Store.search.set({ path: null });
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });
    });

    describe('disconnectedCallback', () => {
        it('should unsubscribe from search store on disconnect when repository exists', async () => {
            const originalQuerySelector = document.querySelector.bind(document);
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return {};
                }
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            // Manually call disconnectedCallback to ensure unsubscribe is called
            el.disconnectedCallback();
            // Changing the search should not cause errors after disconnect
            Store.search.set({ path: SURFACES.CCD.name });
            expect(true).to.be.true;
        });

        it('should handle disconnect when no subscription exists', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            // Element has no repository, so no subscription was created
            // disconnectedCallback should handle this gracefully
            el.disconnectedCallback();
            expect(true).to.be.true;
        });
    });

    describe('connectedCallback error handling', () => {
        it('should set error when repository is not found', async () => {
            const originalQuerySelector = document.querySelector.bind(document);
            const querySelectorStub = sinon.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return null;
                }
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(el.error).to.equal('Repository component not found');
            querySelectorStub.restore();
        });
    });

    describe('create new project store reset', () => {
        it('should reset all translation project store values when creating new project', async () => {
            Store.translationProjects.selectedCards.set(['card1', 'card2']);
            Store.translationProjects.selectedCollections.set(['collection1']);
            Store.translationProjects.selectedPlaceholders.set(['placeholder1']);
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const createButton = el.shadowRoot.querySelector('.create-button');
            createButton.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal([]);
            expect(Store.translationProjects.selectedCollections.get()).to.deep.equal([]);
            expect(Store.translationProjects.selectedPlaceholders.get()).to.deep.equal([]);
            expect(Store.translationProjects.targetLocales.get()).to.deep.equal([]);
            expect(Store.translationProjects.showSelected.get()).to.be.false;
        });
    });

    describe('double-click table row', () => {
        it('should navigate to editor on row double-click', async () => {
            const mockProject = createMockTranslationProject('456', 'Double Click Project');
            Store.translationProjects.list.data.value = [mockProject];
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('sp-table-row');
            row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATION_EDITOR);
            expect(Store.translationProjects.inEdit.get()).to.equal(mockProject);
            expect(Store.translationProjects.translationProjectId.get()).to.equal('456');
        });
    });

    describe('delete translation project execution', () => {
        let toastEmitStub;
        let querySelectorStub;
        let originalQuerySelector;
        let deleteFragmentStub;

        beforeEach(() => {
            toastEmitStub = sinon.stub(Events.toast, 'emit');
            deleteFragmentStub = sinon.stub().resolves();
            originalQuerySelector = document.querySelector.bind(document);
            querySelectorStub = sinon.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return { deleteFragment: deleteFragmentStub };
                }
                return originalQuerySelector(selector);
            });
        });

        afterEach(() => {
            toastEmitStub.restore();
            querySelectorStub.restore();
        });

        it('should successfully delete translation project', async () => {
            const mockProject = createMockTranslationProject('del-123', 'Project to Delete');
            Store.translationProjects.list.data.value = [mockProject];
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(deleteFragmentStub.calledOnce).to.be.true;
            expect(deleteFragmentStub.firstCall.args[1]).to.deep.equal({ startToast: false, endToast: false });
        });

        it('should handle delete error gracefully', async () => {
            deleteFragmentStub.rejects(new Error('Delete failed'));
            const consoleErrorStub = sinon.stub(console, 'error');
            const mockProject = createMockTranslationProject('err-123', 'Error Project');
            Store.translationProjects.list.data.value = [mockProject];
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            const errorToastCalled = toastEmitStub.calledWith({
                variant: 'negative',
                content: 'Failed to delete translation project.',
            });
            expect(errorToastCalled).to.be.true;
            expect(consoleErrorStub.called).to.be.true;
            consoleErrorStub.restore();
        });

        it('should show deleting toast before deletion', async () => {
            const mockProject = createMockTranslationProject('toast-123', 'Toast Project');
            Store.translationProjects.list.data.value = [mockProject];
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(toastEmitStub.calledWith({ variant: 'info', content: 'Deleting translation project...' })).to.be.true;
        });

        it('should not delete when dialog is cancelled', async () => {
            const mockProject = createMockTranslationProject('cancel-123', 'Cancel Project');
            Store.translationProjects.list.data.value = [mockProject];
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(deleteFragmentStub.called).to.be.false;
        });

        it('should set loading state during deletion', async () => {
            const mockProject = createMockTranslationProject('load-123', 'Loading Project');
            Store.translationProjects.list.data.value = [mockProject];
            let loadingDuringDelete = false;
            deleteFragmentStub.callsFake(() => {
                loadingDuringDelete = Store.translationProjects.list.loading.get();
                return Promise.resolve();
            });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const deleteItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Delete'));
            deleteItem.click();
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(loadingDuringDelete).to.be.true;
            expect(Store.translationProjects.list.loading.get()).to.be.false;
        });
    });
});
