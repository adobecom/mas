import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import Store from '../src/store.js';
import router from '../src/router.js';
import { Fragment } from '../src/aem/fragment.js';
import { FragmentStore } from '../src/reactivity/fragment-store.js';
import '../src/baselines/mas-baselines.js';
import '../src/mas-confirm-dialog.js';

const FOLDER = '/content/dam/mas/sandbox/en_US/baselines';

const createBaseline = (
    id,
    { template = 'catalog', paCode, segment, productCode, status = 'PUBLISHED', modifiedBy = 'Jane' },
) =>
    new FragmentStore(
        new Fragment({
            id,
            title: id,
            status,
            path: [FOLDER, template, paCode, segment, 'baseline'].filter(Boolean).join('/'),
            tags: productCode ? [{ id: `mas:product_code/${productCode}` }] : [],
            modified: { fullName: modifiedBy },
            fields: [{ name: 'variant', values: [template] }],
        }),
    );

async function renderBaselines() {
    const el = document.createElement('mas-baselines');
    document.body.append(el);
    await el.updateComplete;
    return el;
}

const rowTexts = (el) =>
    [...el.shadowRoot.querySelectorAll('sp-table-body sp-table-row')].map((row) =>
        [...row.querySelectorAll('sp-table-cell')]
            .slice(0, 7)
            .map((cell) => (cell.querySelector('.title-clamp') ?? cell).textContent.trim()),
    );

describe('MasBaselines', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.baselines.list.data.set([]);
        Store.baselines.list.loading.set(false);
    });

    afterEach(() => {
        sandbox.restore();
        for (const el of document.querySelectorAll('mas-baselines')) {
            el.remove();
        }
        Store.baselines.list.data.set([]);
        Store.baselines.list.loading.set(true);
        Store.confirmDialogOptions.set(null);
    });

    it('renders the Baselines page heading', async () => {
        const el = await renderBaselines();

        expect(el.shadowRoot.querySelector('h1').textContent).to.equal('Baselines');
    });

    it('renders the create dialog only while it is open', async () => {
        const el = await renderBaselines();
        expect(el.shadowRoot.querySelector('mas-create-dialog')).to.not.exist;

        el.createDialogOpen = true;
        await el.updateComplete;
        const dialog = el.shadowRoot.querySelector('mas-create-dialog');
        expect(dialog.getAttribute('type')).to.equal('baseline');

        dialog.dispatchEvent(new CustomEvent('close'));
        await el.updateComplete;

        expect(el.createDialogOpen).to.be.false;
        expect(el.shadowRoot.querySelector('mas-create-dialog')).to.not.exist;
    });

    it('renders an enabled Create Baseline button', async () => {
        const el = await renderBaselines();
        const button = el.shadowRoot.querySelector('sp-button');

        expect(button.textContent.trim()).to.equal('Create Baseline');
        expect(button.hasAttribute('disabled')).to.be.false;
    });

    it('renders the baseline table columns', async () => {
        Store.baselines.list.data.set([createBaseline('a', { paCode: 'pa' })]);
        const el = await renderBaselines();

        expect([...el.shadowRoot.querySelectorAll('sp-table-head-cell')].map((cell) => cell.textContent.trim())).to.deep.equal([
            'Title',
            'Product code',
            'Product arrangement code',
            'Market segment',
            'Template',
            'Status',
            'Last modified by',
            'Actions',
            'Preview',
        ]);
    });

    it('renders one row per baseline', async () => {
        Store.baselines.list.data.set([
            createBaseline('a', { paCode: 'ccsn_direct_individual', segment: 'edu', productCode: 'ccsn' }),
        ]);
        const el = await renderBaselines();

        expect(rowTexts(el)).to.deep.equal([['a', 'CCSN', 'ccsn_direct_individual', 'EDU', 'catalog', 'Published', 'Jane']]);
        expect(el.shadowRoot.textContent).to.include('1 result(s)');
    });

    it('renders skeleton rows while the first load is in progress', async () => {
        Store.baselines.list.loading.set(true);
        const el = await renderBaselines();

        expect(el.shadowRoot.querySelectorAll('sp-table-body .skeleton-element').length).to.be.greaterThan(0);
    });

    it('renders an empty state when there are no baselines', async () => {
        const el = await renderBaselines();

        expect(el.shadowRoot.querySelector('.baselines-empty-state').textContent).to.equal('No baselines found.');
    });

    it('filters baselines by the search query', async () => {
        Store.baselines.list.data.set([
            createBaseline('a', { paCode: 'ccsn_direct_individual' }),
            createBaseline('b', { paCode: 'phsp_direct_individual' }),
        ]);
        const el = await renderBaselines();

        el.searchQuery = 'PHSP';
        await el.updateComplete;

        expect(rowTexts(el).map(([, , paCode]) => paCode)).to.deep.equal(['phsp_direct_individual']);
    });

    it('makes only the title column sortable', async () => {
        Store.baselines.list.data.set([createBaseline('a', { paCode: 'pa' })]);
        const el = await renderBaselines();

        expect(
            [...el.shadowRoot.querySelectorAll('sp-table-head-cell[sortable]')].map((cell) => cell.textContent.trim()),
        ).to.deep.equal(['Title']);
    });

    it('sorts baselines by title ascending by default', async () => {
        Store.baselines.list.data.set([
            createBaseline('Beta', { paCode: 'pa1' }),
            createBaseline('gamma', { paCode: 'pa2' }),
            createBaseline('Alpha', { paCode: 'pa3' }),
        ]);
        const el = await renderBaselines();

        expect(el.shadowRoot.querySelector('sp-table-head-cell.title').getAttribute('sort-direction')).to.equal('asc');
        expect(rowTexts(el).map(([title]) => title)).to.deep.equal(['Alpha', 'Beta', 'gamma']);
    });

    it('sorts baselines by title', async () => {
        Store.baselines.list.data.set([
            createBaseline('Beta', { paCode: 'pa1' }),
            createBaseline('gamma', { paCode: 'pa2' }),
            createBaseline('Alpha', { paCode: 'pa3' }),
        ]);
        const el = await renderBaselines();

        el.shadowRoot
            .querySelector('sp-table-head-cell.title')
            .dispatchEvent(new CustomEvent('sorted', { bubbles: true, detail: { sortKey: 'title', sortDirection: 'desc' } }));
        await el.updateComplete;

        expect(rowTexts(el).map(([title]) => title)).to.deep.equal(['gamma', 'Beta', 'Alpha']);
    });

    it('opens the fragment editor from the Edit action', async () => {
        const navigate = sandbox.stub(router, 'navigateToFragmentEditor');
        Store.baselines.list.data.set([createBaseline('a', { paCode: 'pa' })]);
        const el = await renderBaselines();

        el.shadowRoot.querySelector('sp-table-cell.actions sp-menu-item').click();

        expect(navigate.calledOnceWith('a', { locale: 'en_US' })).to.be.true;
    });

    it('deletes a baseline after confirmation', async () => {
        const confirmDialog = document.createElement('mas-confirm-dialog');
        document.body.append(confirmDialog);
        const deleteFragment = sandbox.stub().resolves(true);
        const baseline = createBaseline('a', { paCode: 'pa' });
        Store.baselines.list.data.set([baseline]);
        const el = await renderBaselines();
        Object.defineProperty(el, 'repository', { value: { deleteFragment } });

        el.shadowRoot.querySelectorAll('sp-table-cell.actions sp-menu-item')[1].click();
        await confirmDialog.updateComplete;
        confirmDialog.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
        await waitUntil(() => !Store.baselines.list.data.get().length);

        expect(deleteFragment.calledOnceWith(baseline.get())).to.be.true;
        confirmDialog.remove();
    });

    it('keeps the baseline when the deletion is cancelled', async () => {
        const confirmDialog = document.createElement('mas-confirm-dialog');
        document.body.append(confirmDialog);
        const deleteFragment = sandbox.stub().resolves(true);
        Store.baselines.list.data.set([createBaseline('a', { paCode: 'pa' })]);
        const el = await renderBaselines();
        Object.defineProperty(el, 'repository', { value: { deleteFragment } });

        el.shadowRoot.querySelectorAll('sp-table-cell.actions sp-menu-item')[1].click();
        await confirmDialog.updateComplete;
        confirmDialog.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('cancel'));
        await confirmDialog.updateComplete;

        expect(deleteFragment.called).to.be.false;
        expect(Store.baselines.list.data.get()).to.have.length(1);
        confirmDialog.remove();
    });

    it('opens the card preview on hover', async () => {
        Store.baselines.list.data.set([createBaseline('a', { paCode: 'pa' })]);
        const el = await renderBaselines();
        const previewCell = el.shadowRoot.querySelector('sp-table-cell.preview');

        previewCell.dispatchEvent(new MouseEvent('mouseover'));
        expect(Store.preview.get().id).to.equal('a');

        previewCell.dispatchEvent(new MouseEvent('mouseout'));
        expect(Store.preview.get().id).to.be.null;
    });
});
