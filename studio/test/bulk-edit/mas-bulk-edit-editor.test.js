import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { BULK_EDIT_PROJECT_MODEL_ID, BULK_EDIT_STATUS, PAGE_NAMES, QUICK_ACTION } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { __tagCacheStores } from '../../src/aem/tag-cache.js';
import Events from '../../src/events.js';
import { prepopulateFragmentCache, removeFromFragmentCache } from '../../src/mas-repository.js';
import {
    getBulkEditProjectsPath,
    isBulkEditProjectTitleTaken,
    loadBulkEditProjects,
} from '../../src/bulk-edit/bulk-edit-repository.js';
import { buildSearchRow } from '../../src/bulk-edit/bulk-edit-search.js';
import '@adobecom/mas';
import '../../src/bulk-edit/mas-bulk-edit-editor.js';

const rawProject = (title = 'Existing') => ({
    id: 'p1',
    path: '/content/dam/mas/sandbox/bulk-edit-projects/existing',
    fields: [
        { name: 'title', type: 'text', values: [title] },
        { name: 'status', type: 'text', values: [BULK_EDIT_STATUS.DRAFT] },
    ],
});

const stubRepository = (el, repo) =>
    Object.defineProperty(el, 'repository', {
        value: { searchFragmentList: sinon.stub().resolves([]), processError: sinon.stub(), ...repo },
    });

const setSearchCheckbox = async (el, selector, checked) => {
    const checkbox = el.shadowRoot.querySelector(selector);
    checkbox.checked = checked;
    checkbox.dispatchEvent(new Event('change'));
    await el.updateComplete;
};

const openNamingDialog = async (el) => {
    el.hasChanges = true;
    el.openSaveDialog();
    await el.updateComplete;
};

describe('mas-bulk-edit-editor', () => {
    let navigate;
    let repositoryQuery;
    let previousTagCache;
    const connected = [];

    const connectEditor = (repo) => {
        const el = document.createElement('mas-bulk-edit-editor');
        stubRepository(el, repo);
        connected.push(el);
        return el;
    };

    beforeEach(() => {
        previousTagCache = __tagCacheStores.data.get('/content/cq:tags/mas');
        __tagCacheStores.data.set('/content/cq:tags/mas', new Map());
        navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
        repositoryQuery = sinon.stub(document, 'querySelector').callThrough();
        repositoryQuery.withArgs('mas-repository').returns({
            searchFragmentList: sinon.stub().resolves([]),
            processError: sinon.stub(),
        });
    });

    afterEach(() => {
        for (const el of connected.splice(0)) el.disconnectedCallback();
        Store.bulkEditProjects.projectId.set(null);
        Store.bulkEditProjects.inEdit.set(null);
        Store.bulkEditProjects.list.data.set([]);
        Store.bulkEditProjects.list.data.removeMeta('pendingProjects');
        if (previousTagCache) __tagCacheStores.data.set('/content/cq:tags/mas', previousTagCache);
        else __tagCacheStores.data.delete('/content/cq:tags/mas');
        sinon.restore();
    });

    it('renders an empty create form when no project id is set', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        expect(el.isNewProject).to.be.true;
        expect(el.shadowRoot.querySelector('h1').textContent).to.equal('Create new find and replace project');
        expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.true;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
        expect(el.shadowRoot.querySelector('[data-testid="title-input"]')).to.be.null;
        expect(el.shadowRoot.querySelector('sp-overlay')).to.be.null;
    });

    it('renders the design controls and an empty fragments table without running a search', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        expect(el.shadowRoot.querySelector('#find-text')).to.exist;
        expect(el.shadowRoot.querySelector('#replace-text')).to.exist;
        expect(el.shadowRoot.querySelector('#search-in').textContent).to.include('Everywhere');
        expect(el.shadowRoot.querySelector('sp-checkbox').checked).to.be.false;
        expect(el.shadowRoot.querySelector('sp-illustrated-message h2').textContent).to.equal('No search queries entered yet');
        expect([...el.shadowRoot.querySelectorAll('sp-table-head-cell')].map((cell) => cell.textContent.trim())).to.deep.equal([
            '',
            '',
            'Offer',
            'Fragment title',
            'Offer ID',
            'Badge',
            'Button label',
            'Callout text',
            'Fragment description',
            'Promo text',
            'Subtitle',
            'Tags',
            'Offer type',
            'Production description',
            'Status',
        ]);
        expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(0);
        expect(
            [...el.shadowRoot.querySelectorAll('.file-actions sp-button')].every((button) => button.hasAttribute('disabled')),
        ).to.be.true;
    });

    it('lists Everywhere above a divider and all nine checked fields in design order', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const popover = el.shadowRoot.querySelector('.search-in-popover');
        expect([...popover.children].map((child) => child.localName)).to.deep.equal([
            'sp-checkbox',
            'sp-divider',
            'sp-field-group',
        ]);
        const fields = [...popover.querySelectorAll('sp-field-group sp-checkbox')];
        expect(fields.map((field) => field.textContent.trim())).to.deep.equal([
            'Badge',
            'Button labels',
            'Callout text',
            'Fragment description',
            'Fragment title',
            'Product description',
            'Promo text',
            'Subtitle',
            'Tags',
        ]);
        expect([...popover.querySelectorAll('sp-checkbox')].every((field) => field.checked)).to.be.true;
        expect(el.searchEverywhere).to.be.true;
    });

    it('clears every field when Everywhere is unchecked, then permits multiple individual fields', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await setSearchCheckbox(el, '[data-testid="search-everywhere"]', false);
        expect(el.searchFields).to.deep.equal([]);
        expect(el.searchInLabel).to.equal('Select fields');
        expect([...el.shadowRoot.querySelectorAll('.search-in-popover sp-checkbox')].every((field) => !field.checked)).to.be
            .true;
        await setSearchCheckbox(el, 'sp-checkbox[value="badge"]', true);
        expect(el.searchInLabel).to.equal('Badge');
        await setSearchCheckbox(el, 'sp-checkbox[value="ctas"]', true);
        expect(el.searchFields).to.deep.equal(['badge', 'ctas']);
        expect(el.searchInLabel).to.equal('2 fields selected');
        expect(el.searchEverywhere).to.be.false;
        expect(el.hasChanges).to.be.true;
    });

    it('unchecks Everywhere when one field is deselected and restores all fields when Everywhere is checked', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await setSearchCheckbox(el, 'sp-checkbox[value="tags"]', false);
        expect(el.searchFields).to.have.lengthOf(8);
        expect(el.searchEverywhere).to.be.false;
        expect(el.shadowRoot.querySelector('[data-testid="search-everywhere"]').checked).to.be.false;
        await setSearchCheckbox(el, '[data-testid="search-everywhere"]', true);
        expect(el.searchFields).to.have.lengthOf(9);
        expect(el.searchInLabel).to.equal('Everywhere');
        expect([...el.shadowRoot.querySelectorAll('.search-in-popover sp-checkbox')].every((field) => field.checked)).to.be
            .true;
    });

    it('selects Everywhere automatically when the last unchecked field is selected', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await setSearchCheckbox(el, 'sp-checkbox[value="subtitle"]', false);
        await setSearchCheckbox(el, 'sp-checkbox[value="subtitle"]', true);
        expect(el.searchEverywhere).to.be.true;
        expect(el.searchInLabel).to.equal('Everywhere');
    });

    it('enables project save on form edits but requires Enter to search', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const find = el.shadowRoot.querySelector('#find-text');
        find.value = 'school';
        find.dispatchEvent(new Event('input'));
        const replace = el.shadowRoot.querySelector('#replace-text');
        replace.value = 'university';
        replace.dispatchEvent(new Event('input'));
        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        await el.updateComplete;
        expect(el.findText).to.equal('school');
        expect(el.replaceText).to.equal('university');
        expect(el.matchCase).to.be.true;
        expect(el.hasChanges).to.be.true;
        expect(el.shadowRoot.querySelector('sp-illustrated-message h2').textContent).to.equal('Press Enter to find fragments');
        expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(0);
        expect(el.shadowRoot.querySelector('.preview-notice').textContent.replace(/\s+/g, ' ')).to.include(
            'Save preserves your search settings',
        );
    });

    it('returns to all projects using the back button', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.shadowRoot.querySelector('.back-link').click();
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('exposes the title format hint as a labelled button with a focusable tooltip', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await openNamingDialog(el);
        const info = el.shadowRoot.querySelector('[data-testid="title-info"]');
        expect(info.localName).to.equal('sp-action-button');
        expect(info.getAttribute('label')).to.equal('Project name format');
        expect(info.querySelector('sp-tooltip').hasAttribute('self-managed')).to.be.true;
    });

    it('enables save in quick actions when Find changes without requiring a title', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.findText = 'school';
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-quick-actions').disabled.has(QUICK_ACTION.SAVE)).to.be.false;
    });

    it('opens Save edits from the quick action without creating a project', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const createFragment = sinon.stub();
        stubRepository(el, { createFragment });
        el.replaceText = 'university';
        await el.updateComplete;
        el.shadowRoot.querySelector('mas-quick-actions').dispatchEvent(new CustomEvent(QUICK_ACTION.SAVE));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper').headline).to.equal('Save edits');
        expect(el.shadowRoot.querySelector('[data-testid="title-input"]').value).to.equal('');
        expect(el.shadowRoot.querySelector('[data-testid="confirm-save"]').disabled).to.be.true;
        expect(createFragment.called).to.be.false;
    });

    it('prefills the saved name and cancels without renaming or losing form edits', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject('Existing-MWPW-1'))));
        el.findText = 'school';
        await el.updateComplete;
        el.openSaveDialog();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="title-input"]').value).to.equal('Existing-MWPW-1');
        el.handleTitleInput({ target: { value: 'Renamed-MWPW-1' } });
        el.shadowRoot.querySelector('.save-dialog-actions sp-button').click();
        await el.updateComplete;
        expect(el.saveDialogOpen).to.be.false;
        expect(el.project.get().getFieldValue('title')).to.equal('Existing-MWPW-1');
        expect(el.findText).to.equal('school');
        expect(el.hasChanges).to.be.true;
        el.openSaveDialog();
        expect(el.projectTitle).to.equal('Existing-MWPW-1');
    });

    it('ignores a nested overlay closing but dismisses Save edits when its own overlay closes', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await openNamingDialog(el);
        const overlay = el.shadowRoot.querySelector('sp-overlay');
        overlay.querySelector('sp-textfield').dispatchEvent(new Event('sp-closed', { bubbles: true }));
        expect(el.saveDialogOpen).to.be.true;
        overlay.dispatchEvent(new Event('sp-closed'));
        expect(el.saveDialogOpen).to.be.false;
        expect(el.hasChanges).to.be.true;
    });

    it('opens the delete dialog from the quick actions delete event', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.shadowRoot.querySelector('mas-quick-actions').dispatchEvent(new CustomEvent(QUICK_ACTION.DELETE));
        expect(el.deleteDialogOpen).to.be.true;
    });

    for (const [property, value] of [
        ['findText', 'school'],
        ['replaceText', 'university'],
        ['searchFields', ['badge']],
        ['matchCase', true],
        ['resultFilters', { tagPaths: {}, tags: [], statuses: ['DRAFT'], locales: [] }],
        ['selectedFragments', new Map([['locale-child', { id: 'locale-child', path: '/content/dam/mas/acom/en_AU/offer' }]])],
    ]) {
        it(`enables Save for ${property} and disables it again when the edit is undone`, async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            const original = el[property];
            el[property] = value;
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
            el[property] = original;
            await el.updateComplete;
            expect(el.hasChanges).to.be.false;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
        });
    }

    it('does not dirty the project when results arrive or variation display changes', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.searchResults = [
            buildSearchRow({ id: 'parent', path: '/content/dam/mas/acom/en_US/offer', title: 'Offer', fields: [] }),
        ];
        el.expandedRows = new Set(['parent']);
        el.variationStates = new Map([
            ['parent', { tab: 'locale', loading: false, rows: { locale: [], promotion: [], grouped: [] } }],
        ]);
        await el.updateComplete;
        expect(el.hasChanges).to.be.false;
    });

    it('round-trips the form and hidden selections and immediately searches with saved settings on reopen', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        let persisted;
        const createFragment = sinon.stub().callsFake(async (payload) => {
            persisted = {
                id: 'saved-config',
                path: `${payload.parentPath}/${payload.name}`,
                model: { id: payload.modelId },
                fields: payload.fields,
            };
            return persisted;
        });
        stubRepository(el, { createFragment });
        el.findText = 'school';
        el.replaceText = 'university';
        el.searchFields = ['badge', 'ctas'];
        el.matchCase = true;
        el.resultFilters = {
            tagPaths: { product: ['/content/cq:tags/mas/product_code/photoshop'] },
            tags: ['mas:product_code/photoshop'],
            statuses: ['PUBLISHED'],
            locales: ['en_AU'],
        };
        const selection = [
            { id: 'parent', path: '/content/dam/mas/acom/en_US/offer' },
            { id: 'child', path: '/content/dam/mas/acom/en_AU/offer' },
        ];
        el.updateSelection(new Map(selection.map((fragment) => [fragment.id, fragment])));
        await el.updateComplete;
        el.openSaveDialog();
        el.handleTitleInput({ target: { value: 'School-MWPW-191345' } });
        await el.save();
        expect(el.hasChanges).to.be.false;
        expect(el.saveDialogOpen).to.be.false;
        const project = el.project.get();
        expect(project.getFieldValue('searchTerm')).to.equal('school');
        expect(project.getFieldValue('replaceTerm')).to.equal('university');
        expect(project.getFieldValues('fieldNames')).to.deep.equal(['badge', 'ctas']);
        expect(project.getFieldValues('fragments')).to.deep.equal(selection.map(({ path }) => path));
        expect(JSON.parse(project.getFieldValue('items'))).to.deep.equal({
            matchCase: true,
            resultFilters: el.resultFilters,
            selection,
        });
        const searchFragmentPages = sinon.stub().callsFake(async function* () {
            yield [{ ...selection[0], title: 'School offer', fields: [{ name: 'badge', values: ['school'] }] }];
        });
        const reopened = connectEditor({ getFragmentById: sinon.stub().resolves(persisted), searchFragmentPages });
        await reopened.connectedCallback();
        await reopened.updateComplete;
        expect(reopened.findText).to.equal('school');
        expect(reopened.replaceText).to.equal('university');
        expect(reopened.searchFields).to.deep.equal(['badge', 'ctas']);
        expect(reopened.matchCase).to.be.true;
        expect(reopened.resultFilters).to.deep.equal(el.resultFilters);
        expect([...reopened.selectedFragments.values()]).to.deep.equal(selection);
        expect(reopened.hasChanges).to.be.false;
        expect(reopened.searchedQuery).to.equal('school');
        expect(searchFragmentPages.calledOnce).to.be.true;
        expect(searchFragmentPages.firstCall.args[0]).to.include({ query: 'school' });
        expect(searchFragmentPages.firstCall.args[0].tags).to.deep.equal(el.resultFilters.tags);
        expect(searchFragmentPages.firstCall.args[0].status).to.deep.equal(el.resultFilters.statuses);
        expect(reopened.searchResults.map(({ id }) => id)).to.deep.equal(['parent']);
    });

    it('shows the editor while its saved search is pending without dirtying the project', async () => {
        const projectId = 'opening-search';
        Store.bulkEditProjects.projectId.set(projectId);
        let resolvePage;
        const next = sinon.stub();
        next.onFirstCall().returns(new Promise((resolve) => (resolvePage = resolve)));
        next.onSecondCall().resolves({ done: true });
        const el = connectEditor({
            getFragmentById: sinon.stub().resolves({
                ...rawProject('School-MWPW-1'),
                id: projectId,
                model: { id: BULK_EDIT_PROJECT_MODEL_ID },
                fields: [...rawProject('School-MWPW-1').fields, { name: 'searchTerm', values: ['school'] }],
            }),
            searchFragmentPages: sinon.stub().returns({ next }),
        });
        const opening = el.connectedCallback();
        await waitUntil(() => resolvePage);
        await el.updateComplete;
        expect(el.loading).to.be.false;
        expect(el.searching).to.be.true;
        expect(el.searchedQuery).to.equal('school');
        expect(el.hasChanges).to.be.false;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
        resolvePage({ value: [], done: false });
        await opening;
        expect(el.searching).to.be.false;
        expect(el.hasChanges).to.be.false;
    });

    it('reports an automatic search failure as a retryable search error, not a project load failure', async () => {
        Store.bulkEditProjects.projectId.set('opening-search-error');
        const error = new Error('Search unavailable');
        const el = connectEditor({
            getFragmentById: sinon.stub().resolves({
                ...rawProject('School-MWPW-1'),
                id: 'opening-search-error',
                model: { id: BULK_EDIT_PROJECT_MODEL_ID },
                fields: [...rawProject('School-MWPW-1').fields, { name: 'searchTerm', values: ['school'] }],
            }),
            searchFragmentPages: sinon.stub().callsFake(async function* () {
                throw error;
            }),
        });
        await el.connectedCallback();
        expect(el.loadFailed).to.be.false;
        expect(el.fragmentsFailed).to.be.true;
        expect(el.hasChanges).to.be.false;
        expect(el.repository.processError.calledOnceWithExactly(error, 'Could not load fragments for text search.')).to.be.true;
    });

    it('saves configuration with the existing name and clears previously saved selections and scopes', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const original = new FragmentStore(
            new Fragment({
                ...rawProject('Existing-MWPW-1'),
                fields: [
                    ...rawProject('Existing-MWPW-1').fields,
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: ['/old-selection'] },
                    { name: 'fieldNames', type: 'text', multiple: true, values: ['badge'] },
                ],
            }),
        );
        Store.bulkEditProjects.inEdit.set(original);
        const saveFragment = sinon.stub().callsFake(async (draft) => {
            expect(original.get().getFieldValues('fragments')).to.deep.equal(['/old-selection']);
            expect(draft.get().getFieldValues('fragments')).to.deep.equal([]);
            expect(draft.get().getFieldValues('fieldNames')).to.deep.equal([]);
            return true;
        });
        stubRepository(el, { saveFragment });
        el.searchFields = [];
        await el.updateComplete;
        el.openSaveDialog();
        await el.save();
        expect(saveFragment.calledOnce).to.be.true;
        expect(original.get().getFieldValue('title')).to.equal('Existing-MWPW-1');
        expect(original.get().getFieldValues('fragments')).to.deep.equal([]);
        expect(el.hasChanges).to.be.false;
    });

    it('preserves edits made after dismissing an in-flight save and ignores duplicate submissions', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        let resolve;
        const createFragment = sinon.stub().callsFake(
            (payload) =>
                new Promise((done) => {
                    resolve = () => done({ ...rawProject(payload.title), fields: payload.fields });
                }),
        );
        stubRepository(el, { createFragment });
        el.findText = 'school';
        await el.updateComplete;
        el.openSaveDialog();
        el.handleTitleInput({ target: { value: 'School-MWPW-1' } });
        const saving = el.save();
        await waitUntil(() => createFragment.called);
        await el.save();
        expect(createFragment.calledOnce).to.be.true;
        el.closeSaveDialog();
        el.findText = 'college';
        await el.updateComplete;
        resolve();
        await saving;
        await el.updateComplete;
        expect(el.project.get().getFieldValue('searchTerm')).to.equal('school');
        expect(el.findText).to.equal('college');
        expect(el.hasChanges).to.be.true;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
    });

    it('creates a draft project on save and stores its id', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const createFragment = sinon.stub().resolves(rawProject('New one-MWPW-123456'));
        stubRepository(el, { createFragment });
        el.handleTitleInput({ target: { value: 'New one-MWPW-123456' } });
        await el.save();
        const [payload] = createFragment.firstCall.args;
        expect(payload.title).to.equal('New one-MWPW-123456');
        expect(payload.fields.find((f) => f.name === 'status').values).to.deep.equal([BULK_EDIT_STATUS.DRAFT]);
        expect(payload.parentPath).to.match(/^\/content\/dam\/mas\/bulk-edit-projects\/[^/]+$/);
        expect(Store.bulkEditProjects.projectId.get()).to.equal('p1');
        expect(el.hasChanges).to.be.false;
    });

    it('updates the title of an existing project on save', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const saveFragment = sinon.stub().resolves(true);
        stubRepository(el, { saveFragment });
        Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
        el.handleTitleInput({ target: { value: 'Renamed-MWPW-42' } });
        await el.save();
        expect(saveFragment.calledOnce).to.be.true;
        expect(el.project.get().getFieldValue('title')).to.equal('Renamed-MWPW-42');
    });

    it('disables the title field while saving', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await openNamingDialog(el);
        let resolve;
        const createFragment = sinon.stub().callsFake(() => new Promise((r) => (resolve = r)));
        stubRepository(el, { createFragment });
        el.handleTitleInput({ target: { value: 'New one-MWPW-123456' } });
        const saving = el.save();
        await waitUntil(() => createFragment.called);
        await el.updateComplete;
        const input = el.shadowRoot.querySelector('[data-testid="title-input"]');
        expect(input.hasAttribute('disabled')).to.be.true;
        expect(el.shadowRoot.querySelector('.save-dialog-actions sp-button').disabled).to.be.true;
        expect(el.shadowRoot.querySelector('[data-testid="confirm-save"]').disabled).to.be.true;
        const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
        input.dispatchEvent(escape);
        expect(escape.defaultPrevented).to.be.true;
        expect(el.saveDialogOpen).to.be.true;
        resolve(rawProject('New one-MWPW-123456'));
        await saving;
        await el.updateComplete;
        expect(el.saveDialogOpen).to.be.false;
    });

    it('blocks saving a title already used by another project', async () => {
        Store.bulkEditProjects.list.data.set([new FragmentStore(new Fragment({ ...rawProject('Taken-MWPW-1'), id: 'other' }))]);
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const createFragment = sinon.stub();
        stubRepository(el, { createFragment });
        await openNamingDialog(el);
        el.handleTitleInput({ target: { value: 'Taken-MWPW-1' } });
        await el.updateComplete;
        await el.save();
        expect(createFragment.called).to.be.false;
        expect(el.shadowRoot.querySelector('[data-testid="title-error"]').textContent).to.include('already exists');
    });

    it('flags a taken title once the project list finishes loading', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        await openNamingDialog(el);
        el.handleTitleInput({ target: { value: 'Taken-MWPW-1' } });
        await el.updateComplete;
        Store.bulkEditProjects.list.data.set([new FragmentStore(new Fragment({ ...rawProject('Taken-MWPW-1'), id: 'other' }))]);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="title-error"]').textContent).to.include('already exists');
        expect(el.shadowRoot.querySelector('mas-quick-actions').disabled.has(QUICK_ACTION.SAVE)).to.be.true;
    });

    it('does not save and flags the field when the title format is invalid', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const createFragment = sinon.stub();
        stubRepository(el, { createFragment });
        await openNamingDialog(el);
        el.handleTitleInput({ target: { value: 'Spring sale' } });
        await el.updateComplete;
        await el.save();
        expect(createFragment.called).to.be.false;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
        expect(el.shadowRoot.querySelector('[data-testid="title-input"]').hasAttribute('invalid')).to.be.true;
    });

    it('navigates back to the list after deleting', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        stubRepository(el, { deleteFragment: sinon.stub().resolves(true) });
        Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
        await el.handleDeleteConfirmed();
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('shares one store between the editor and the list for a created project', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const created = { ...rawProject('New one-MWPW-123456'), path: `${getBulkEditProjectsPath()}/new-one-mwpw-123456` };
        stubRepository(el, { createFragment: sinon.stub().resolves(created), saveFragment: sinon.stub().resolves(true) });
        el.handleTitleInput({ target: { value: 'New one-MWPW-123456' } });
        await el.save();
        await loadBulkEditProjects(el.repository);
        const [listed] = Store.bulkEditProjects.list.data.get();
        expect(listed).to.equal(el.project);

        el.handleTitleInput({ target: { value: 'Renamed-MWPW-123456' } });
        await el.save();
        expect(listed.get().getFieldValue('title')).to.equal('Renamed-MWPW-123456');
        expect(isBulkEditProjectTitleTaken('New one-MWPW-123456')).to.be.false;
    });

    it('loads a fragment with the bulk edit project model', async () => {
        Store.bulkEditProjects.projectId.set('p1');
        const el = connectEditor({
            getFragmentById: sinon.stub().resolves({ ...rawProject(), model: { id: BULK_EDIT_PROJECT_MODEL_ID } }),
        });
        await el.connectedCallback();
        expect(el.project.get().id).to.equal('p1');
        expect(el.projectTitle).to.equal('Existing');
    });

    it('defaults the title to an empty string when the loaded project has none', async () => {
        Store.bulkEditProjects.projectId.set('p1');
        const el = connectEditor({
            getFragmentById: sinon.stub().resolves({ id: 'p1', fields: [], model: { id: BULK_EDIT_PROJECT_MODEL_ID } }),
        });
        await el.connectedCallback();
        expect(el.project.get().id).to.equal('p1');
        expect(el.projectTitle).to.equal('');
    });

    it('resolves the repository from the document', async () => {
        const repository = {};
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        repositoryQuery.withArgs('mas-repository').returns(repository);
        expect(el.repository).to.equal(repository);
    });

    it('loads a cached project without fetching it from the repository', async () => {
        const projectId = 'cached-project';
        await prepopulateFragmentCache(projectId, {
            ...rawProject(),
            id: projectId,
            model: { id: BULK_EDIT_PROJECT_MODEL_ID },
        });
        Store.bulkEditProjects.projectId.set(projectId);
        const getFragmentById = sinon.stub();
        const el = connectEditor({ getFragmentById });

        try {
            await el.connectedCallback();
            expect(el.project.get().id).to.equal(projectId);
            expect(getFragmentById.called).to.be.false;
        } finally {
            await removeFromFragmentCache(projectId);
        }
    });

    it('refuses to load a fragment that is not a bulk edit project', async () => {
        Store.bulkEditProjects.projectId.set('card1');
        sinon.stub(console, 'error');
        const el = connectEditor({
            getFragmentById: sinon.stub().resolves({ ...rawProject(), id: 'card1', model: { id: 'card-model' } }),
        });
        await el.connectedCallback();
        expect(el.project).to.be.null;
        expect(el.loadFailed).to.be.true;
    });

    it('shows a load error instead of the create form when the project cannot be loaded', async () => {
        Store.bulkEditProjects.projectId.set('missing');
        sinon.stub(console, 'error');
        const el = connectEditor({ getFragmentById: sinon.stub().rejects(new Error('404')) });
        await el.connectedCallback();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="load-error"]')).to.exist;
        expect(el.shadowRoot.querySelector('sp-textfield')).to.be.null;
        expect(el.shadowRoot.querySelector('mas-quick-actions')).to.be.null;
    });

    it('returns to the project list from the load error view', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        Store.bulkEditProjects.projectId.set('missing');
        el.loadFailed = true;
        await el.updateComplete;
        el.shadowRoot.querySelector('[data-testid="load-error"] sp-button').click();
        expect(Store.bulkEditProjects.projectId.get()).to.be.null;
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('resolves discard prompt immediately when there are no changes', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        expect(await el.promptDiscardChanges()).to.be.true;
        expect(Store.confirmDialogOptions.get()).to.be.null;
    });

    it('asks the global confirm dialog when there are unsaved changes', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.hasChanges = true;
        el.promptDiscardChanges();
        expect(Store.confirmDialogOptions.get().title).to.equal('Unsaved changes');
        Store.confirmDialogOptions.set(null);
    });

    describe('error handling', () => {
        let toast;

        beforeEach(() => {
            toast = sinon.stub(Events.toast, 'emit');
            sinon.stub(console, 'error');
        });

        const editorWithTitle = async (repo, title = 'New one-MWPW-123456') => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            stubRepository(el, repo);
            await openNamingDialog(el);
            el.handleTitleInput({ target: { value: title } });
            return el;
        };

        it('shows no extra toast and keeps changes when create returns an empty response', async () => {
            const el = await editorWithTitle({ createFragment: sinon.stub().resolves(null) });
            await el.save();
            expect(toast.called).to.be.false;
            expect(Store.bulkEditProjects.projectId.get()).to.be.null;
            expect(el.hasChanges).to.be.true;
            expect(el.saving).to.be.false;
            expect(el.saveDialogOpen).to.be.true;
        });

        it('reports a title conflict when create fails with 409', async () => {
            const el = await editorWithTitle({
                createFragment: sinon.stub().rejects(new Error('Failed to create fragment: 409')),
            });
            await el.save();
            expect(toast.calledWithMatch({ variant: 'negative', content: 'A project with this title already exists.' })).to.be
                .true;
            expect(el.hasChanges).to.be.true;
        });

        it('blocks renaming to a title another project took after the list was loaded', async () => {
            const searchFragmentList = sinon.stub().resolves([{ ...rawProject('Taken-MWPW-1'), id: 'other' }]);
            const saveFragment = sinon.stub().resolves(true);
            const el = await editorWithTitle({ searchFragmentList, saveFragment }, 'Taken-MWPW-1');
            Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
            await el.save();
            expect(searchFragmentList.firstCall.args[0].path).to.match(/^\/content\/dam\/mas\/bulk-edit-projects\/[^/]+$/);
            expect(saveFragment.called).to.be.false;
            expect(toast.calledWithMatch({ variant: 'negative', content: 'A project with this title already exists.' })).to.be
                .true;
            expect(el.hasChanges).to.be.true;
            expect(el.saving).to.be.false;
            expect(el.project.get().getFieldValue('title')).to.equal('Existing');
            expect(el.saveDialogOpen).to.be.true;
        });

        it('blocks creating a project whose title another project took after the list was loaded', async () => {
            const createFragment = sinon.stub();
            const el = await editorWithTitle(
                {
                    searchFragmentList: sinon.stub().resolves([{ ...rawProject('Taken-MWPW-1'), id: 'other' }]),
                    createFragment,
                },
                'Taken-MWPW-1',
            );
            await el.save();
            expect(createFragment.called).to.be.false;
            expect(toast.calledWithMatch({ variant: 'negative', content: 'A project with this title already exists.' })).to.be
                .true;
        });

        it('stops saving when reloading the project list fails', async () => {
            const error = new Error('Network down');
            const createFragment = sinon.stub();
            const el = await editorWithTitle({ searchFragmentList: sinon.stub().rejects(error), createFragment });
            await el.save();
            expect(el.repository.processError.calledWith(error, 'Could not load bulk edit projects.')).to.be.true;
            expect(createFragment.called).to.be.false;
            expect(toast.called).to.be.false;
            expect(el.hasChanges).to.be.true;
            expect(el.saving).to.be.false;
        });

        it('cancels the project list reload when the editor is disconnected', async () => {
            const createFragment = sinon.stub();
            const searchFragmentList = sinon
                .stub()
                .callsFake(
                    (options, limit, controller) =>
                        new Promise((resolve, reject) =>
                            controller.signal.addEventListener('abort', () =>
                                reject(new DOMException('aborted', 'AbortError')),
                            ),
                        ),
                );
            const el = await editorWithTitle({ searchFragmentList, createFragment });
            const saving = el.save();
            await waitUntil(() => searchFragmentList.called);
            el.disconnectedCallback();
            await saving;
            expect(el.repository.processError.called).to.be.false;
            expect(createFragment.called).to.be.false;
            expect(toast.called).to.be.false;
        });

        it('shows a generic failure toast when create rejects', async () => {
            const el = await editorWithTitle({ createFragment: sinon.stub().rejects(new Error('Network down')) });
            await el.save();
            expect(toast.calledWithMatch({ variant: 'negative', content: 'Failed to save the project.' })).to.be.true;
            expect(el.saving).to.be.false;
        });

        it('keeps changes and skips the success toast when saving an existing project fails', async () => {
            const saveFragment = sinon.stub().resolves(false);
            const el = await editorWithTitle({ saveFragment }, 'Renamed-MWPW-42');
            Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
            await el.save();
            expect(saveFragment.calledOnce).to.be.true;
            expect(toast.calledWithMatch({ variant: 'positive' })).to.be.false;
            expect(el.hasChanges).to.be.true;
            expect(el.saving).to.be.false;
            expect(el.project.get().getFieldValue('title')).to.equal('Existing');
            expect(el.saveDialogOpen).to.be.true;
        });

        it('stays on the editor when deleting fails', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            stubRepository(el, { deleteFragment: sinon.stub().resolves(false) });
            Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
            Store.bulkEditProjects.projectId.set('p1');
            await el.handleDeleteConfirmed();
            expect(navigate.called).to.be.false;
            expect(Store.bulkEditProjects.projectId.get()).to.equal('p1');
        });

        it('ignores a load that resolves after the editor is disconnected', async () => {
            Store.bulkEditProjects.projectId.set('p1');
            let resolve;
            const el = connectEditor({ getFragmentById: () => new Promise((r) => (resolve = r)) });
            const loading = el.connectedCallback();
            await Promise.resolve();
            await Promise.resolve();
            el.disconnectedCallback();
            resolve({ ...rawProject(), model: { id: BULK_EDIT_PROJECT_MODEL_ID } });
            await loading;
            expect(el.project).to.be.null;
            expect(el.projectTitle).to.equal('');
        });

        it('ignores a load failure after the editor is disconnected', async () => {
            Store.bulkEditProjects.projectId.set('p1');
            let reject;
            const el = connectEditor({ getFragmentById: () => new Promise((r, j) => (reject = j)) });
            const loading = el.connectedCallback();
            await Promise.resolve();
            await Promise.resolve();
            el.disconnectedCallback();
            reject(new Error('aborted'));
            await loading;
            expect(el.loadFailed).to.be.false;
        });

        it('confirms a created project with a toast but does not publish it after the editor is disconnected', async () => {
            let resolve;
            const createFragment = sinon.stub().callsFake(() => new Promise((r) => (resolve = r)));
            const el = connectEditor({ createFragment });
            await el.connectedCallback();
            el.handleTitleInput({ target: { value: 'New one-MWPW-123456' } });
            const saving = el.save();
            await waitUntil(() => createFragment.called);
            el.disconnectedCallback();
            const projectB = new FragmentStore(new Fragment({ ...rawProject('Project B-MWPW-2'), id: 'p2' }));
            Store.bulkEditProjects.projectId.set('p2');
            Store.bulkEditProjects.inEdit.set(projectB);
            resolve(rawProject('New one-MWPW-123456'));
            await saving;
            expect(Store.bulkEditProjects.projectId.get()).to.equal('p2');
            expect(Store.bulkEditProjects.inEdit.get()).to.equal(projectB);
            expect(toast.calledOnceWithMatch({ variant: 'positive', content: 'Project "New one-MWPW-123456" was created.' })).to
                .be.true;
        });
    });

    it('deletes an unsaved project without calling the repository', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const deleteFragment = sinon.stub();
        stubRepository(el, { deleteFragment });
        await el.handleDeleteConfirmed();
        expect(deleteFragment.called).to.be.false;
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('closes the delete dialog when deletion is cancelled', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.deleteDialogOpen = true;
        await el.updateComplete;
        el.shadowRoot.querySelector('mas-bulk-publish-delete-dialog').dispatchEvent(new CustomEvent('delete-cancelled'));
        await el.updateComplete;
        expect(el.deleteDialogOpen).to.be.false;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-delete-dialog')).to.be.null;
    });

    it('disables save and delete while a save is in flight', async () => {
        Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.handleTitleInput({ target: { value: 'Renamed-MWPW-42' } });
        el.saving = true;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
        expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.true;
    });

    describe('accessibility', () => {
        it('associates the field label with the title input', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            await openNamingDialog(el);
            const label = el.shadowRoot.querySelector('sp-field-label[for="project-title"]');
            const input = el.shadowRoot.querySelector('[data-testid="title-input"]');
            expect(label.getAttribute('for')).to.equal(input.id);
            expect(label.textContent.trim()).to.equal('Title');
        });

        it('renders a single level-one heading', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            expect(el.shadowRoot.querySelectorAll('h1')).to.have.length(1);
        });

        it('gives the loading indicator an accessible label', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            el.loading = true;
            await el.updateComplete;
            const progress = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progress.getAttribute('label')).to.equal('Loading project');
            expect(progress.hasAttribute('indeterminate')).to.be.true;
        });

        it('exposes the title error through the negative help text slot', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            await openNamingDialog(el);
            el.handleTitleInput({ target: { value: 'Spring sale' } });
            await el.updateComplete;
            const help = el.shadowRoot.querySelector('[data-testid="title-error"]');
            expect(help.getAttribute('slot')).to.equal('negative-help-text');
            expect(help.textContent).to.include('MWPW|DOTCOM-[Jira number]');
        });

        it('does not mark a pristine title field as invalid', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            await openNamingDialog(el);
            expect(el.shadowRoot.querySelector('[data-testid="title-input"]').hasAttribute('invalid')).to.be.false;
        });

        it('offers a keyboard-reachable button to recover from a load error', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            el.loadFailed = true;
            await el.updateComplete;
            const button = el.shadowRoot.querySelector('[data-testid="load-error"] sp-button');
            expect(button.textContent.trim()).to.equal('Back to projects');
        });
    });
});
