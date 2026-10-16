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
