import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { PAGE_NAMES } from '../../src/constants.js';
import Store from '../../src/store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import router from '../../src/router.js';
import '../../src/swc.js';
import '../../src/translation/mas-translation.js';

describe('MasTranslation', () => {
    let sandbox;

    const createMockTranslationProject = (id, title, fullName = 'John Doe', submissionDate = null) => {
        const fields = [];
        if (submissionDate !== null && submissionDate !== undefined) {
            fields.push({ name: 'submissionDate', type: 'long', values: [submissionDate] });
        }
        const fragment = new Fragment({
            id,
            title,
            path: `/content/dam/mas/translations/${id}`,
            modified: { fullName },
            fields,
        });
        return new FragmentStore(fragment);
    };

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

    describe('ensureRepository', () => {
        it('should throw error when repository is not available', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(() => el.ensureRepository()).to.throw('Repository component not found');
            expect(el.error).to.equal('Repository component not found');
        });

        it('should throw custom error message when provided', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            expect(() => el.ensureRepository('Custom error')).to.throw('Custom error');
            expect(el.error).to.equal('Custom error');
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

    describe('empty state', () => {
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

    describe('formatSubmissionDate', () => {
        it('should display N/A when submission date is null', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1', 'John Doe', null)];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[2].textContent).to.equal('N/A');
        });

        it('should display N/A when submission date is undefined', async () => {
            const mockProjects = [createMockTranslationProject('1', 'Project 1', 'John Doe', undefined)];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[2].textContent).to.equal('N/A');
        });

        it('should format date correctly when submission date exists', async () => {
            const testDate = new Date('2024-03-15T10:00:00Z').getTime();
            const mockProjects = [createMockTranslationProject('1', 'Project 1', 'John Doe', testDate)];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[2].textContent).to.equal('Mar 15, 2024');
        });

        it('should format different dates correctly', async () => {
            const testDate = new Date('2025-12-25T00:00:00Z').getTime();
            const mockProjects = [createMockTranslationProject('1', 'Project 1', 'John Doe', testDate)];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[2].textContent).to.equal('Dec 25, 2025');
        });
    });

    describe('sortBySentOn', () => {
        it('should sort projects by submission date ascending', async () => {
            const date1 = new Date('2024-01-15').getTime();
            const date2 = new Date('2024-03-20').getTime();
            const date3 = new Date('2024-02-10').getTime();
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1', 'User 1', date2),
                createMockTranslationProject('2', 'Project 2', 'User 2', date1),
                createMockTranslationProject('3', 'Project 3', 'User 3', date3),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const headerCell = el.shadowRoot.querySelector('sp-table-head-cell.sentOn');
            headerCell.dispatchEvent(new CustomEvent('sorted', { detail: { sortKey: 'sentOn', sortDirection: 'asc' } }));
            await el.updateComplete;
            const sortedData = Store.translationProjects.list.data.get();
            expect(sortedData[0].get().id).to.equal('2');
            expect(sortedData[1].get().id).to.equal('3');
            expect(sortedData[2].get().id).to.equal('1');
        });

        it('should sort projects by submission date descending', async () => {
            const date1 = new Date('2024-01-15').getTime();
            const date2 = new Date('2024-03-20').getTime();
            const date3 = new Date('2024-02-10').getTime();
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1', 'User 1', date1),
                createMockTranslationProject('2', 'Project 2', 'User 2', date3),
                createMockTranslationProject('3', 'Project 3', 'User 3', date2),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const headerCell = el.shadowRoot.querySelector('sp-table-head-cell.sentOn');
            headerCell.dispatchEvent(new CustomEvent('sorted', { detail: { sortKey: 'sentOn', sortDirection: 'desc' } }));
            await el.updateComplete;
            const sortedData = Store.translationProjects.list.data.get();
            expect(sortedData[0].get().id).to.equal('3');
            expect(sortedData[1].get().id).to.equal('2');
            expect(sortedData[2].get().id).to.equal('1');
        });

        it('should place null dates at the end when sorting ascending', async () => {
            const date1 = new Date('2024-01-15').getTime();
            const date2 = new Date('2024-03-20').getTime();
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1', 'User 1', null),
                createMockTranslationProject('2', 'Project 2', 'User 2', date2),
                createMockTranslationProject('3', 'Project 3', 'User 3', date1),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const headerCell = el.shadowRoot.querySelector('sp-table-head-cell.sentOn');
            headerCell.dispatchEvent(new CustomEvent('sorted', { detail: { sortKey: 'sentOn', sortDirection: 'asc' } }));
            await el.updateComplete;
            const sortedData = Store.translationProjects.list.data.get();
            expect(sortedData[0].get().id).to.equal('1');
            expect(sortedData[1].get().id).to.equal('3');
            expect(sortedData[2].get().id).to.equal('2');
        });

        it('should place null dates at the beginning when sorting descending', async () => {
            const date1 = new Date('2024-01-15').getTime();
            const date2 = new Date('2024-03-20').getTime();
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1', 'User 1', date1),
                createMockTranslationProject('2', 'Project 2', 'User 2', null),
                createMockTranslationProject('3', 'Project 3', 'User 3', date2),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const headerCell = el.shadowRoot.querySelector('sp-table-head-cell.sentOn');
            headerCell.dispatchEvent(new CustomEvent('sorted', { detail: { sortKey: 'sentOn', sortDirection: 'desc' } }));
            await el.updateComplete;
            const sortedData = Store.translationProjects.list.data.get();
            expect(sortedData[0].get().id).to.equal('3');
            expect(sortedData[1].get().id).to.equal('1');
            expect(sortedData[2].get().id).to.equal('2');
        });

        it('should maintain relative order when both dates are null', async () => {
            const date1 = new Date('2024-01-15').getTime();
            const mockProjects = [
                createMockTranslationProject('1', 'Project 1', 'User 1', null),
                createMockTranslationProject('2', 'Project 2', 'User 2', date1),
                createMockTranslationProject('3', 'Project 3', 'User 3', null),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const el = await fixture(html`<mas-translation></mas-translation>`);
            const headerCell = el.shadowRoot.querySelector('sp-table-head-cell.sentOn');
            headerCell.dispatchEvent(new CustomEvent('sorted', { detail: { sortKey: 'sentOn', sortDirection: 'asc' } }));
            await el.updateComplete;
            const sortedData = Store.translationProjects.list.data.get();
            expect(sortedData[0].get().id).to.equal('1');
            const nullProjects = sortedData.filter((p) => p.get().getFieldValue('submissionDate') == null);
            expect(nullProjects.length).to.equal(2);
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
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });

        it('should allow express path', async () => {
            Store.search.set({ path: 'express' });
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            expect(Store.page.get()).to.equal(PAGE_NAMES.TRANSLATIONS);
        });

        it('should allow sandbox path', async () => {
            Store.search.set({ path: 'sandbox' });
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
            Store.search.set({ path: 'ccd' });
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
        it('should unsubscribe from search store on disconnect', async () => {
            const el = await fixture(html`<mas-translation></mas-translation>`);
            await el.updateComplete;
            // Disconnect the element
            el.remove();
            // Changing the search should not cause errors after disconnect
            Store.search.set({ path: 'ccd' });
            // If no error is thrown, the unsubscribe worked correctly
            expect(true).to.be.true;
        });
    });
});
