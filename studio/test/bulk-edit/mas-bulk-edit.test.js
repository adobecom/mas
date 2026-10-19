import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';
import '../../src/bulk-edit/mas-bulk-edit.js';

const makeProjectStore = (overrides = {}) => {
    const data = { id: 'p1', title: 'Project', status: 'Draft', ...overrides };
    return { id: data.id, get: () => data };
};

describe('mas-bulk-edit (overview)', () => {
    afterEach(() => {
        Store.bulkEditProjects.list.data.set([]);
        Store.bulkEditProjects.list.loading.set(false);
        Store.bulkEditProjects.projectId.set(null);
        Store.bulkEditProjects.inEdit.set(null);
        sinon.restore();
    });

    it('renders empty state when list is empty', async () => {
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        expect(el.shadowRoot.querySelector('[data-testid="empty"]')).to.exist;
    });

    it('renders one row per project', async () => {
        Store.bulkEditProjects.list.data.set([makeProjectStore({ id: 'a' }), makeProjectStore({ id: 'b' })]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        expect(el.shadowRoot.querySelectorAll('[data-testid="project-row"]')).to.have.lengthOf(2);
    });

    it('renders skeleton rows while loading', async () => {
        Store.bulkEditProjects.list.loading.set(true);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        expect(el.shadowRoot.querySelector('[data-testid="empty"]')).to.not.exist;
        expect(el.shadowRoot.querySelectorAll('.skeleton-table-cell').length).to.be.greaterThan(0);
    });

    it('defaults status to Draft when missing', async () => {
        Store.bulkEditProjects.list.data.set([makeProjectStore({ status: undefined })]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        expect(el.shadowRoot.querySelector('.status-light').textContent.trim()).to.equal('Draft');
    });

    it('opens the editor for a new project on Create project', async () => {
        const navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
        Store.bulkEditProjects.projectId.set('old');
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.shadowRoot.querySelector('[data-testid="create-btn"]').click();
        expect(Store.bulkEditProjects.projectId.get()).to.be.null;
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT_EDITOR)).to.be.true;
    });

    it('renders editor links to the bulk edit editor', async () => {
        Store.bulkEditProjects.list.data.set([makeProjectStore({ id: 'be-1' })]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        const link = el.shadowRoot.querySelector('[data-testid="project-row"] a.fragment-editor-link');
        const params = new URLSearchParams(new URL(link.href).hash.slice(1));
        expect(params.get('page')).to.equal(PAGE_NAMES.BULK_EDIT_EDITOR);
        expect(params.get('bulkEditProjectId')).to.equal('be-1');
    });

    it('resolves the repository from the document', async () => {
        const repository = {};
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        sinon.stub(document, 'querySelector').callThrough().withArgs('mas-repository').returns(repository);
        expect(el.repository).to.equal(repository);
    });

    it('opens an existing project in the editor', async () => {
        const navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
        Store.bulkEditProjects.inEdit.set({ stale: true });
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.openProject(makeProjectStore({ id: 'be-2' }));
        expect(Store.bulkEditProjects.projectId.get()).to.equal('be-2');
        expect(Store.bulkEditProjects.inEdit.get()).to.be.null;
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT_EDITOR)).to.be.true;
    });

    it('does not open a project without an id', async () => {
        const navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.openProject(makeProjectStore({ id: undefined }));
        expect(Store.bulkEditProjects.projectId.get()).to.be.null;
        expect(navigate.called).to.be.false;
    });

    it('opens a project on row double click', async () => {
        sinon.stub(router, 'navigateToPage').returns(() => {});
        Store.bulkEditProjects.list.data.set([makeProjectStore({ id: 'be-3' })]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.shadowRoot.querySelector('[data-testid="project-row"]').dispatchEvent(new MouseEvent('dblclick'));
        expect(Store.bulkEditProjects.projectId.get()).to.equal('be-3');
    });

    it('renders the title fallback, creator fallbacks and status labels', async () => {
        Store.bulkEditProjects.list.data.set([
            makeProjectStore({ id: 'a', title: '', status: '', created: { fullName: 'Jane Doe' } }),
            makeProjectStore({ id: 'b', status: 'Applied', created: { by: 'jdoe@adobe.com' } }),
            makeProjectStore({ id: 'c', status: 'Unknown' }),
        ]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        const rows = [...el.shadowRoot.querySelectorAll('[data-testid="project-row"]')];
        const cellText = (row, index) => row.querySelectorAll('sp-table-cell')[index].textContent.trim();
        expect(cellText(rows[0], 0)).to.equal('Untitled project');
        expect(rows.map((row) => cellText(row, 1))).to.deep.equal(['Jane Doe', 'jdoe@adobe.com', '—']);
        expect(rows.map((row) => cellText(row, 3))).to.deep.equal(['Draft', 'Applied', 'Draft']);
    });

    it('renders the last modified date, falling back to the created date', async () => {
        Store.bulkEditProjects.list.data.set([
            makeProjectStore({ id: 'a', modified: { at: '2024-03-01T10:00:00Z' }, created: { at: '2024-01-01T10:00:00Z' } }),
            makeProjectStore({ id: 'b', created: { at: '2024-01-01T10:00:00Z' } }),
            makeProjectStore({ id: 'c' }),
        ]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        const dates = [...el.shadowRoot.querySelectorAll('[data-testid="project-row"]')].map((row) =>
            row.querySelectorAll('sp-table-cell')[2].textContent.trim(),
        );
        expect(dates[0]).to.include('Mar 1, 2024');
        expect(dates[1]).to.include('Jan 1, 2024');
        expect(dates[2]).to.equal('—');
    });

    it('renders the empty state when the list is unset', async () => {
        Store.bulkEditProjects.list.data.set(null);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        expect(el.shadowRoot.querySelector('[data-testid="empty"]')).to.exist;
    });

    it('shows the delete dialog with the project title', async () => {
        const project = makeProjectStore({ title: 'Spring sale-MWPW-1' });
        Store.bulkEditProjects.list.data.set([project]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.openDeleteDialog(project);
        await el.updateComplete;
        const dialog = el.shadowRoot.querySelector('mas-bulk-publish-delete-dialog');
        expect(dialog).to.exist;
        expect(dialog.projectTitle).to.equal('Spring sale-MWPW-1');
    });

    it('closes the delete dialog when deletion is cancelled', async () => {
        const project = makeProjectStore();
        Store.bulkEditProjects.list.data.set([project]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.openDeleteDialog(project);
        await el.updateComplete;
        el.shadowRoot.querySelector('mas-bulk-publish-delete-dialog').dispatchEvent(new CustomEvent('delete-cancelled'));
        await el.updateComplete;
        expect(el.deletePending).to.be.null;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-delete-dialog')).to.not.exist;
        expect(Store.bulkEditProjects.list.data.get()).to.deep.equal([project]);
    });

    it('ignores a delete confirmation when no deletion is pending', async () => {
        const deleteFragment = sinon.stub();
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', { value: { deleteFragment } });
        await el.handleDeleteConfirmed();
        expect(deleteFragment.called).to.be.false;
    });

    it('keeps the project in the list when delete fails', async () => {
        const project = makeProjectStore();
        Store.bulkEditProjects.list.data.set([project]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', { value: { deleteFragment: sinon.stub().resolves(false) } });
        el.openDeleteDialog(project);
        await el.handleDeleteConfirmed();
        expect(Store.bulkEditProjects.list.data.get()).to.deep.equal([project]);
    });

    it('handles an unset list after a successful delete', async () => {
        const project = makeProjectStore();
        Store.bulkEditProjects.list.data.set([project]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        const deleteFragment = sinon.stub().callsFake(async () => {
            Store.bulkEditProjects.list.data.set(null);
            return true;
        });
        Object.defineProperty(el, 'repository', { value: { deleteFragment } });
        el.openDeleteDialog(project);
        await el.handleDeleteConfirmed();
        expect(Store.bulkEditProjects.list.data.get()).to.deep.equal([]);
    });

    it('removes the project from the list after confirmed delete', async () => {
        const project = makeProjectStore();
        Store.bulkEditProjects.list.data.set([project]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', { value: { deleteFragment: sinon.stub().resolves(true) } });
        el.openDeleteDialog(project);
        await el.handleDeleteConfirmed();
        expect(Store.bulkEditProjects.list.data.get()).to.deep.equal([]);
    });
});
