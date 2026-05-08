import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { BULK_PUBLISH_STATUS } from '../../src/constants.js';
import '../../src/bulk-publish/mas-bulk-publish.js';

describe('mas-bulk-publish (overview)', () => {
    afterEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        Store.bulkPublishProjects.list.loading.set(false);
    });

    it('renders empty state when list is empty', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="empty"]')).to.exist;
    });

    it('renders one row per project', async () => {
        Store.bulkPublishProjects.list.data.set([
            { id: 'a', get: () => ({ id: 'a', title: 'A', status: 'Draft' }) },
            { id: 'b', get: () => ({ id: 'b', title: 'B', status: 'Published' }) },
        ]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const rows = el.shadowRoot.querySelectorAll('[data-testid="project-row"]');
        expect(rows).to.have.lengthOf(2);
    });

    it('dispatches create-project when CTA clicked', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="create-btn"]').click());
        const ev = await oneEvent(el, 'create-project');
        expect(ev).to.exist;
    });
});

function makeProjectStore(data = {}) {
    const defaults = {
        id: 'proj-1',
        title: 'Test Project',
        status: BULK_PUBLISH_STATUS.DRAFT,
        items: '[]',
        locales: [],
        created: { fullName: 'Jane Doe' },
        publishedAt: null,
    };
    const merged = { ...defaults, ...data };
    return {
        get: () => ({
            ...merged,
            getFieldValue: (k) => merged[k],
            getFieldValues: (k) => (Array.isArray(merged[k]) ? merged[k] : merged[k] !== undefined ? [merged[k]] : []),
        }),
    };
}

describe('mas-bulk-publish (methods)', () => {
    let sandbox;
    let navigateStub;
    let repositoryEl;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        navigateStub = sandbox.stub().returns(() => Promise.resolve());
        sandbox.stub(router, 'navigateToPage').callsFake(navigateStub);

        repositoryEl = document.createElement('mas-repository');
        document.body.appendChild(repositoryEl);
    });

    afterEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        Store.bulkPublishProjects.list.loading.set(false);
        Store.bulkPublishProjects.projectId.set(null);
        Store.bulkPublishProjects.inEdit.set(null);
        repositoryEl.remove();
        sandbox.restore();
    });

    it('openProject sets projectId and navigates to editor', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const ps = makeProjectStore({ id: 'abc-123' });
        el.openProject(ps);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal('abc-123');
        expect(navigateStub.calledOnce).to.equal(true);
    });

    it('openProject does nothing when projectStore has no id', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const ps = makeProjectStore({ id: null });
        el.openProject(ps);
        expect(navigateStub.called).to.equal(false);
    });

    it('openDuplicateDialog sets duplicatePending with proposed title', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const ps = makeProjectStore({ title: 'Holiday Sale' });
        el.openDuplicateDialog(ps);
        expect(el.duplicatePending).to.exist;
        expect(el.duplicatePending.proposedTitle).to.equal('Holiday Sale (Copy)');
        expect(el.duplicatePending.projectStore).to.equal(ps);
    });

    it('handleDuplicateCancel clears duplicatePending', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        el.duplicatePending = { projectStore: makeProjectStore(), proposedTitle: 'X (Copy)' };
        el.handleDuplicateCancel();
        expect(el.duplicatePending).to.be.null;
    });

    it('handleDuplicateConfirmed sets projectId and navigates to editor', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;

        const ps = makeProjectStore({ title: 'Original', items: '[]', locales: [] });
        el.duplicatePending = { projectStore: ps, proposedTitle: 'Original (Copy)' };

        const rawFragment = { id: 'new-id', path: '/content/dam/mas/new', fields: [], status: 'Draft' };
        repositoryEl.createFragment = sandbox.stub().resolves(rawFragment);
        Store.search.set({ path: 'sandbox' });

        await el.handleDuplicateConfirmed({ detail: { title: 'My Copy' } });

        expect(repositoryEl.createFragment.calledOnce).to.equal(true);
        const [payload] = repositoryEl.createFragment.firstCall.args;
        expect(payload.title).to.equal('My Copy');
        expect(Store.bulkPublishProjects.projectId.get()).to.equal('new-id');
        expect(Store.bulkPublishProjects.inEdit.get()).to.be.null;
        expect(navigateStub.calledOnce).to.equal(true);
        expect(el.duplicating).to.equal(false);
    });

    it('handleDuplicateConfirmed passes locales as array to createFragment', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;

        const ps = makeProjectStore({ title: 'Original', items: '[]', locales: ['en_US', 'fr_FR'] });
        el.duplicatePending = { projectStore: ps, proposedTitle: 'Original (Copy)' };

        const rawFragment = { id: 'new-id', path: '/content/dam/mas/new', fields: [], status: 'Draft' };
        repositoryEl.createFragment = sandbox.stub().resolves(rawFragment);
        Store.search.set({ path: 'sandbox' });

        await el.handleDuplicateConfirmed({ detail: { title: 'My Copy' } });

        const [payload] = repositoryEl.createFragment.firstCall.args;
        const localesField = payload.fields.find((f) => f.name === 'locales');
        expect(localesField.values).to.deep.equal(['en_US', 'fr_FR']);
    });

    it('handleDeleteConfirmed removes project from list', async () => {
        const ps = makeProjectStore({ title: 'To Delete' });
        Store.bulkPublishProjects.list.data.set([ps]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;

        repositoryEl.deleteFragment = sandbox.stub().resolves(true);
        el.deletePending = { projectStore: ps, title: 'To Delete' };

        await el.handleDeleteConfirmed();

        expect(repositoryEl.deleteFragment.calledOnce).to.equal(true);
        expect(Store.bulkPublishProjects.list.data.get()).to.deep.equal([]);
    });

    it('handleDeleteCancel clears deletePending without deleting', async () => {
        const ps = makeProjectStore({ title: 'Keep Me' });
        Store.bulkPublishProjects.list.data.set([ps]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;

        repositoryEl.deleteFragment = sandbox.stub().resolves(true);
        el.deletePending = { projectStore: ps, title: 'Keep Me' };
        el.handleDeleteCancel();

        expect(repositoryEl.deleteFragment.called).to.equal(false);
        expect(el.deletePending).to.equal(null);
        expect(Store.bulkPublishProjects.list.data.get()).to.have.lengthOf(1);
    });

    it('openDeleteDialog sets deletePending with title', async () => {
        const ps = makeProjectStore({ title: 'My Project' });
        Store.bulkPublishProjects.list.data.set([ps]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;

        el.openDeleteDialog(ps);

        expect(el.deletePending).to.deep.include({ title: 'My Project' });
        expect(el.deletePending.projectStore).to.equal(ps);
    });

    it('duplicatePending banner renders when set', async () => {
        Store.bulkPublishProjects.list.data.set([makeProjectStore()]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        el.duplicatePending = { projectStore: makeProjectStore(), proposedTitle: 'X (Copy)' };
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-duplicate-dialog')).to.exist;
    });
});

describe('mas-bulk-publish (pure methods)', () => {
    let el;

    before(async () => {
        el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
    });

    describe('parseItems', () => {
        it('returns [] for null', () => {
            expect(el.parseItems(null)).to.deep.equal([]);
        });

        it('returns [] for invalid JSON', () => {
            expect(el.parseItems('not-json')).to.deep.equal([]);
        });

        it('returns parsed array for valid JSON', () => {
            const items = [{ url: 'a', status: 'valid', type: 'fragment' }];
            expect(el.parseItems(JSON.stringify(items))).to.deep.equal(items);
        });
    });

    describe('countByType', () => {
        it('counts valid items by type', () => {
            const items = [
                { status: 'valid', type: 'fragment' },
                { status: 'valid', type: 'collection' },
                { status: 'valid', type: 'placeholder' },
                { status: 'valid', type: 'fragment' },
            ];
            expect(el.countByType(items)).to.deep.equal({ fragment: 2, collection: 1, placeholder: 1 });
        });

        it('skips items that are not valid', () => {
            const items = [
                { status: 'error', type: 'fragment' },
                { status: 'valid', type: 'fragment' },
            ];
            expect(el.countByType(items)).to.deep.equal({ fragment: 1, collection: 0, placeholder: 0 });
        });

        it('falls back to fragment for unknown type', () => {
            const items = [{ status: 'valid', type: 'unknown' }];
            expect(el.countByType(items)).to.deep.equal({ fragment: 1, collection: 0, placeholder: 0 });
        });
    });

    describe('formatDate', () => {
        it('returns — for null', () => {
            expect(el.formatDate(null)).to.equal('—');
        });

        it('returns — for invalid date string', () => {
            expect(el.formatDate('not-a-date')).to.equal('—');
        });

        it('returns formatted string for valid date', () => {
            const result = el.formatDate('2026-01-15T10:00:00Z');
            expect(result).to.be.a('string');
            expect(result).to.include('2026');
        });
    });

    describe('statusVariant', () => {
        it('returns correct variant for Draft', () => {
            expect(el.statusVariant(BULK_PUBLISH_STATUS.DRAFT).className).to.equal('draft');
        });

        it('returns correct variant for Published', () => {
            expect(el.statusVariant(BULK_PUBLISH_STATUS.PUBLISHED).className).to.equal('published');
        });

        it('returns correct variant for Publishing', () => {
            expect(el.statusVariant(BULK_PUBLISH_STATUS.PUBLISHING).className).to.equal('publishing');
        });

        it('returns correct variant for Locked', () => {
            expect(el.statusVariant(BULK_PUBLISH_STATUS.LOCKED).className).to.equal('locked');
        });

        it('falls back to Draft for unknown status', () => {
            expect(el.statusVariant('Bogus').className).to.equal('draft');
        });
    });

    describe('renderStatus', () => {
        it('returns a template result containing the status class', () => {
            const result = el.renderStatus(BULK_PUBLISH_STATUS.PUBLISHED);
            const str = result.strings.join('');
            expect(str).to.include('status-light');
        });
    });
});

describe('mas-bulk-publish (render)', () => {
    afterEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        Store.bulkPublishProjects.list.loading.set(false);
    });

    it('renders skeleton rows when loading', async () => {
        Store.bulkPublishProjects.list.loading.set(true);
        Store.bulkPublishProjects.list.data.set([makeProjectStore()]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const skeletons = el.shadowRoot.querySelectorAll('.skeleton-row');
        expect(skeletons.length).to.be.greaterThan(0);
    });

    it('renderRow includes project title in the rendered table row', async () => {
        Store.bulkPublishProjects.list.data.set([makeProjectStore({ title: 'Black Friday' })]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const row = el.shadowRoot.querySelector('[data-testid="project-row"]');
        expect(row.textContent).to.include('Black Friday');
    });

    it('renderActions renders inside a row with menu items', async () => {
        Store.bulkPublishProjects.list.data.set([makeProjectStore()]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const row = el.shadowRoot.querySelector('[data-testid="project-row"]');
        expect(row.querySelector('sp-action-button')).to.exist;
    });
});
