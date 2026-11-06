import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { BULK_EDIT_PROJECT_MODEL_ID, BULK_EDIT_STATUS, PAGE_NAMES } from '../../src/constants.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import Events from '../../src/events.js';
import '../../src/bulk-edit/mas-bulk-edit.js';

const makeProjectStore = (overrides = {}) => {
    const data = { id: 'p1', title: 'Project', status: 'Draft', ...overrides };
    return { id: data.id, get: () => data };
};

describe('mas-bulk-edit (overview)', () => {
    beforeEach(() => {
        Store.bulkEditProjects.list.loading.set(false);
        Store.bulkEditProjects.list.data.removeMeta('pendingProjects');
    });

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
        expect(el.shadowRoot.querySelector('h1').textContent).to.equal('Find and replace');
        expect(el.shadowRoot.querySelector('[data-testid="create-btn"]').getAttribute('variant')).to.equal('accent');
    });

    it('offers Edit, Revert, Duplicate and Delete with Revert disabled for the UI-only release', async () => {
        Store.bulkEditProjects.list.data.set([makeProjectStore()]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        const actions = [...el.shadowRoot.querySelectorAll('sp-menu-item')];
        expect(actions.map((action) => action.textContent.trim())).to.deep.equal(['Edit', 'Revert', 'Duplicate', 'Delete']);
        expect(actions[1].hasAttribute('disabled')).to.be.true;
        expect(actions[1].title).to.include('find and replace execution');
        expect(actions[2].hasAttribute('disabled')).to.be.false;
    });

    it('proposes a duplicate name that preserves the required Jira suffix and supports cancellation', async () => {
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        el.openDuplicateDialog(makeProjectStore({ title: 'Spring sale-MWPW-123456' }));
        await el.updateComplete;
        const dialog = el.shadowRoot.querySelector('mas-bulk-publish-duplicate-dialog');
        expect(dialog.proposedTitle).to.equal('Spring sale (Copy)-MWPW-123456');
        dialog.dispatchEvent(new CustomEvent('duplicate-cancelled'));
        await el.updateComplete;
        expect(el.duplicatePending).to.be.null;
    });

    it('duplicates the configuration into a new Draft without copying execution results', async () => {
        const navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
        const fields = [
            { name: 'title', type: 'text', values: ['Spring sale-DOTCOM-123456'] },
            { name: 'status', type: 'text', values: [BULK_EDIT_STATUS.APPLIED] },
            { name: 'searchTerm', type: 'text', values: ['school'] },
            { name: 'replaceTerm', type: 'text', values: ['university'] },
            { name: 'fieldNames', type: 'text', multiple: true, values: ['description'] },
            { name: 'snapshots', type: 'text', multiple: true, values: ['previous execution'] },
            { name: 'lastResult', type: 'text', values: ['Applied'] },
        ];
        const source = new FragmentStore(new Fragment({ id: 'source', fields }));
        const createFragment = sinon.stub().callsFake(async (payload) => ({
            id: 'copy',
            path: `${payload.parentPath}/${payload.name}`,
            fields: payload.fields,
            model: { id: payload.modelId },
        }));
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', {
            value: { createFragment, searchFragmentList: sinon.stub().resolves([]) },
        });
        el.openDuplicateDialog(source);
        await el.handleDuplicateConfirmed({ detail: { title: 'Spring sale (Copy)-DOTCOM-123456' } });
        const payload = createFragment.firstCall.args[0];
        expect(payload.modelId).to.equal(BULK_EDIT_PROJECT_MODEL_ID);
        expect(payload.fields.find((field) => field.name === 'status').values).to.deep.equal([BULK_EDIT_STATUS.DRAFT]);
        expect(payload.fields.find((field) => field.name === 'searchTerm').values).to.deep.equal(['school']);
        expect(payload.fields.map((field) => field.name))
            .to.not.include('snapshots')
            .and.to.not.include('lastResult');
        expect(Store.bulkEditProjects.list.data.getMeta('pendingProjects').has('copy')).to.be.true;
        expect(Store.bulkEditProjects.projectId.get()).to.equal('copy');
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT_EDITOR)).to.be.true;
        expect(el.duplicating).to.be.false;
        expect(el.duplicatePending).to.be.null;
    });

    it('rejects invalid duplicate titles without closing the dialog or creating a fragment', async () => {
        const toast = sinon.stub(Events.toast, 'emit');
        const createFragment = sinon.stub();
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', { value: { createFragment } });
        el.openDuplicateDialog(makeProjectStore());
        await el.handleDuplicateConfirmed({ detail: { title: 'Invalid title' } });
        expect(createFragment.called).to.be.false;
        expect(el.duplicatePending).to.not.be.null;
        expect(toast.firstCall.args[0].variant).to.equal('negative');
    });

    it('rejects a duplicate title already indexed in the active surface', async () => {
        const toast = sinon.stub(Events.toast, 'emit');
        const createFragment = sinon.stub();
        const title = 'Taken-MWPW-1';
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', {
            value: {
                createFragment,
                searchFragmentList: sinon.stub().resolves([{ id: 'taken', fields: [{ name: 'title', values: [title] }] }]),
            },
        });
        el.openDuplicateDialog(makeProjectStore());
        await el.handleDuplicateConfirmed({ detail: { title } });
        expect(createFragment.called).to.be.false;
        expect(el.duplicatePending).to.not.be.null;
        expect(el.duplicating).to.be.false;
        expect(toast.firstCall.args[0].variant).to.equal('negative');
    });

    it('does not create a duplicate if loading the project list fails', async () => {
        const createFragment = sinon.stub();
        const processError = sinon.stub();
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', {
            value: { createFragment, processError, searchFragmentList: sinon.stub().rejects(new Error('Unavailable')) },
        });
        el.openDuplicateDialog(makeProjectStore());
        await el.handleDuplicateConfirmed({ detail: { title: 'Copy-MWPW-1' } });
        expect(createFragment.called).to.be.false;
        expect(processError.calledOnce).to.be.true;
        expect(el.duplicating).to.be.false;
    });

    it('keeps the duplicate dialog open and reports create failures', async () => {
        const toast = sinon.stub(Events.toast, 'emit');
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', {
            value: {
                searchFragmentList: sinon.stub().resolves([]),
                createFragment: sinon.stub().rejects(new Error('Create failed')),
            },
        });
        el.openDuplicateDialog(makeProjectStore({ fields: [] }));
        await el.handleDuplicateConfirmed({ detail: { title: 'Copy-MWPW-1' } });
        expect(el.duplicatePending).to.not.be.null;
        expect(el.duplicating).to.be.false;
        expect(toast.firstCall.args[0].variant).to.equal('negative');
    });

    it('prevents duplicate submissions and does not navigate after the overview is disconnected', async () => {
        const navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
        let resolveCreate;
        const createFragment = sinon.stub().callsFake(
            () =>
                new Promise((resolve) => {
                    resolveCreate = resolve;
                }),
        );
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        Object.defineProperty(el, 'repository', {
            value: { searchFragmentList: sinon.stub().resolves([]), createFragment },
        });
        el.openDuplicateDialog(makeProjectStore({ fields: [] }));
        const event = { detail: { title: 'Copy-MWPW-1' } };
        const first = el.handleDuplicateConfirmed(event);
        await waitUntil(() => createFragment.called);
        await el.handleDuplicateConfirmed(event);
        expect(createFragment.calledOnce).to.be.true;
        el.remove();
        const payload = createFragment.firstCall.args[0];
        resolveCreate({ id: 'copy', path: `${payload.parentPath}/${payload.name}`, fields: payload.fields });
        await first;
        expect(navigate.called).to.be.false;
        expect(Store.bulkEditProjects.list.data.getMeta('pendingProjects').has('copy')).to.be.true;
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

    it('keeps the loaded rows visible while the list refreshes', async () => {
        Store.bulkEditProjects.list.data.set([makeProjectStore({ id: 'a' })]);
        Store.bulkEditProjects.list.loading.set(true);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        expect(el.shadowRoot.querySelectorAll('[data-testid="project-row"]')).to.have.lengthOf(1);
        expect(el.shadowRoot.querySelector('.skeleton-table-cell')).to.not.exist;
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

    it('applies a resized width to the header and to the row cells', async () => {
        Store.bulkEditProjects.list.data.set([makeProjectStore()]);
        const el = await fixture(html`<mas-bulk-edit></mas-bulk-edit>`);
        const handle = el.shadowRoot.querySelector('.column-resize-handle[data-column="status"]');
        handle.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true, cancelable: true }),
        );
        await el.updateComplete;
        const width = `${el.columnResize.widths.get('status')}px`;
        expect(getComputedStyle(el.shadowRoot.querySelectorAll('sp-table-head-cell')[3]).width).to.equal(width);
        expect(getComputedStyle(el.shadowRoot.querySelectorAll('sp-table-cell')[3]).width).to.equal(width);
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
