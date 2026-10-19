import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { BULK_EDIT_PROJECT_MODEL_ID, BULK_EDIT_STATUS, PAGE_NAMES, QUICK_ACTION } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Events from '../../src/events.js';
import { prepopulateFragmentCache, removeFromFragmentCache } from '../../src/mas-repository.js';
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

describe('mas-bulk-edit-editor', () => {
    let navigate;
    const connected = [];

    const connectEditor = (repo) => {
        const el = document.createElement('mas-bulk-edit-editor');
        stubRepository(el, repo);
        connected.push(el);
        return el;
    };

    beforeEach(() => {
        navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
    });

    afterEach(() => {
        for (const el of connected.splice(0)) el.disconnectedCallback();
        Store.bulkEditProjects.projectId.set(null);
        Store.bulkEditProjects.inEdit.set(null);
        Store.bulkEditProjects.list.data.set([]);
        sinon.restore();
    });

    it('renders an empty create form when no project id is set', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        expect(el.isNewProject).to.be.true;
        expect(el.shadowRoot.querySelector('h1').textContent).to.equal('Create bulk edits project');
        expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.true;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
    });

    it('exposes the title format hint as a labelled button with a focusable tooltip', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const info = el.shadowRoot.querySelector('[data-testid="title-info"]');
        expect(info.localName).to.equal('sp-action-button');
        expect(info.getAttribute('label')).to.equal('Project name format');
        expect(info.querySelector('sp-tooltip').hasAttribute('self-managed')).to.be.true;
    });

    it('enables save in quick actions once the title changes', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.handleTitleInput({ target: { value: 'Draft-MWPW-1' } });
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-quick-actions').disabled.has(QUICK_ACTION.SAVE)).to.be.false;
    });

    it('opens the delete dialog from the quick actions delete event', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        el.shadowRoot.querySelector('mas-quick-actions').dispatchEvent(new CustomEvent(QUICK_ACTION.DELETE));
        expect(el.deleteDialogOpen).to.be.true;
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

    it('blocks saving a title already used by another project', async () => {
        Store.bulkEditProjects.list.data.set([new FragmentStore(new Fragment({ ...rawProject('Taken-MWPW-1'), id: 'other' }))]);
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        const createFragment = sinon.stub();
        stubRepository(el, { createFragment });
        el.handleTitleInput({ target: { value: 'Taken-MWPW-1' } });
        await el.updateComplete;
        await el.save();
        expect(createFragment.called).to.be.false;
        expect(el.shadowRoot.querySelector('[data-testid="title-error"]').textContent).to.include('already exists');
    });

    it('flags a taken title once the project list finishes loading', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
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
        el.handleTitleInput({ target: { value: 'Spring sale' } });
        await el.updateComplete;
        await el.save();
        expect(createFragment.called).to.be.false;
        expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.true;
    });

    it('navigates back to the list after deleting', async () => {
        const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
        stubRepository(el, { deleteFragment: sinon.stub().resolves(true) });
        Store.bulkEditProjects.inEdit.set(new FragmentStore(new Fragment(rawProject())));
        await el.handleDeleteConfirmed();
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
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
        sinon.stub(document, 'querySelector').callThrough().withArgs('mas-repository').returns(repository);
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
            const label = el.shadowRoot.querySelector('sp-field-label');
            const input = el.shadowRoot.querySelector('[data-testid="title-input"]');
            expect(label.getAttribute('for')).to.equal(input.id);
            expect(label.textContent.trim()).to.equal('Project name');
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
            el.handleTitleInput({ target: { value: 'Spring sale' } });
            await el.updateComplete;
            const help = el.shadowRoot.querySelector('[data-testid="title-error"]');
            expect(help.getAttribute('slot')).to.equal('negative-help-text');
            expect(help.textContent).to.include('MWPW-[Jira number]');
        });

        it('does not mark a pristine title field as invalid', async () => {
            const el = await fixture(html`<mas-bulk-edit-editor></mas-bulk-edit-editor>`);
            expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.false;
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
