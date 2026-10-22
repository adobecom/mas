import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import { styles } from './mas-bulk-edit-editor.css.js';
import StoreController from '../reactivity/store-controller.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { Fragment } from '../aem/fragment.js';
import router from '../router.js';
import { BULK_EDIT_PROJECT_MODEL_ID, BULK_EDIT_STATUS, PAGE_NAMES, QUICK_ACTION } from '../constants.js';
import { showToast } from '../utils.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { getFromFragmentCache } from '../mas-repository.js';
import { trackPendingProject, untrackPendingProject } from '../common/utils/project-list-utils.js';
import {
    buildBulkEditProjectPayload,
    isBulkEditProjectTitleTaken,
    isValidBulkEditProjectTitle,
    loadBulkEditProjects,
} from './bulk-edit-repository.js';
import { SAVE_SVG, DELETE_SVG } from '../bulk-publish/bulk-publish-icons.js';
import '../bulk-publish/mas-bulk-publish-delete-dialog.js';
import '../mas-quick-actions.js';

const TITLE_TAKEN_MESSAGE = 'A project with this title already exists.';

class MasBulkEditEditor extends LitElement {
    static styles = styles;

    static properties = {
        projectTitle: { state: true },
        hasChanges: { state: true },
        loading: { state: true },
        loadFailed: { state: true },
        saving: { state: true },
        deleteDialogOpen: { state: true },
    };

    inEdit = new StoreController(this, Store.bulkEditProjects.inEdit);
    projects = new StoreController(this, Store.bulkEditProjects.list.data);

    #abortController = null;
    constructor() {
        super();
        this.projectTitle = '';
        this.hasChanges = false;
        this.loading = false;
        this.loadFailed = false;
        this.saving = false;
        this.deleteDialogOpen = false;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get project() {
        return this.inEdit.value;
    }

    get isNewProject() {
        return !this.project;
    }

    async connectedCallback() {
        super.connectedCallback();
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;
        const projectId = Store.bulkEditProjects.projectId.get();
        if (!projectId) {
            Store.bulkEditProjects.inEdit.set(null);
            return;
        }
        this.loading = true;
        try {
            const fragment = (await getFromFragmentCache(projectId)) ?? (await this.repository.getFragmentById(projectId));
            if (signal.aborted) return;
            if (fragment.model?.id !== BULK_EDIT_PROJECT_MODEL_ID)
                throw new Error(`Fragment ${projectId} is not a bulk edit project`);
            const store = new FragmentStore(new Fragment(fragment));
            Store.bulkEditProjects.inEdit.set(store);
            this.projectTitle = store.get().getFieldValue('title') ?? '';
        } catch (err) {
            if (signal.aborted) return;
            console.error('Failed to load bulk edit project:', err);
            this.loadFailed = true;
        } finally {
            if (!signal.aborted) this.loading = false;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#abortController?.abort();
        Store.bulkEditProjects.inEdit.set(null);
    }

    handleTitleInput(event) {
        this.projectTitle = event.target.value;
        this.hasChanges = true;
    }

    get titleError() {
        const title = this.projectTitle.trim();
        if (!isValidBulkEditProjectTitle(title)) {
            return 'Title must follow the format [project title]-MWPW-[Jira number], e.g. Spring sale-MWPW-123456.';
        }
        if (isBulkEditProjectTitleTaken(title, this.project?.get().id)) return TITLE_TAKEN_MESSAGE;
        return null;
    }

    async save() {
        if (this.titleError) return;
        const { signal } = this.#abortController;
        this.saving = true;
        try {
            const title = this.projectTitle.trim();
            const loaded = await loadBulkEditProjects(this.repository, this.#abortController);
            if (!loaded) return;
            if (isBulkEditProjectTitleTaken(title, this.project?.get().id)) {
                showToast(TITLE_TAKEN_MESSAGE, 'negative');
                return;
            }
            if (this.isNewProject) {
                const raw = await this.repository.createFragment(
                    buildBulkEditProjectPayload({ title, status: BULK_EDIT_STATUS.DRAFT }),
                    false,
                );
                if (!raw) return;
                const store = new FragmentStore(new Fragment(raw));
                trackPendingProject(Store.bulkEditProjects.list.data, store);
                if (signal.aborted) {
                    showToast(`Project "${title}" was created.`, 'positive');
                    return;
                }
                Store.bulkEditProjects.inEdit.set(store);
                Store.bulkEditProjects.projectId.set(raw.id);
            } else {
                this.project.updateField('title', [title]);
                const saved = await this.repository.saveFragment(this.project, {
                    withToast: false,
                    refetchEtag: false,
                    errorMessage: 'Failed to save the project.',
                });
                if (!saved || signal.aborted) return;
            }
            this.projectTitle = title;
            this.hasChanges = false;
            showToast('Project saved successfully.', 'positive');
        } catch (err) {
            console.error('Failed to save bulk edit project:', err);
            const isConflict = err.message?.includes(': 409');
            showToast(isConflict ? TITLE_TAKEN_MESSAGE : 'Failed to save the project.', 'negative');
        } finally {
            this.saving = false;
        }
    }

    async handleDeleteConfirmed() {
        this.deleteDialogOpen = false;
        if (!this.isNewProject) {
            const ok = await this.repository.deleteFragment(this.project.get());
            if (!ok) return;
            untrackPendingProject(Store.bulkEditProjects.list.data, this.project.id);
        }
        this.hasChanges = false;
        Store.bulkEditProjects.projectId.set(null);
        router.navigateToPage(PAGE_NAMES.BULK_EDIT)();
    }

    async promptDiscardChanges() {
        if (!this.hasChanges) return true;
        return confirmation({
            title: 'Unsaved changes',
            content: 'You have unsaved changes. Leave anyway?',
            confirmLabel: 'Discard',
            cancelLabel: 'Stay',
            variant: 'confirmation',
        });
    }

    get deleteDialog() {
        if (!this.deleteDialogOpen) return nothing;
        return html`<mas-bulk-publish-delete-dialog
            open
            .projectTitle=${this.projectTitle || 'Untitled project'}
            @delete-confirmed=${this.handleDeleteConfirmed}
            @delete-cancelled=${() => (this.deleteDialogOpen = false)}
        ></mas-bulk-publish-delete-dialog>`;
    }

    get disabledActions() {
        const disabled = new Set();
        if (this.saving || !this.hasChanges || this.titleError) disabled.add(QUICK_ACTION.SAVE);
        if (this.saving || this.isNewProject) disabled.add(QUICK_ACTION.DELETE);
        return disabled;
    }

    get loadErrorView() {
        return html`<div class="card" data-testid="load-error">
            <p>This project could not be loaded. It may have been deleted or the link is invalid.</p>
            <sp-button
                variant="secondary"
                @click=${() => {
                    Store.bulkEditProjects.projectId.set(null);
                    router.navigateToPage(PAGE_NAMES.BULK_EDIT)();
                }}
                >Back to projects</sp-button
            >
        </div>`;
    }

    render() {
        if (this.loading) return html`<sp-progress-circle label="Loading project" indeterminate></sp-progress-circle>`;
        if (this.loadFailed) return this.loadErrorView;
        return html`
            <header>
                <h1>${this.isNewProject ? 'Create bulk edits project' : 'Edit project'}</h1>
            </header>
            <div class="card">
                <div class="label-row">
                    <sp-field-label for="project-title">Project name</sp-field-label>
                    <sp-action-button quiet label="Project name format" data-testid="title-info">
                        <sp-icon-info slot="icon"></sp-icon-info>
                        <sp-tooltip self-managed placement="top">Format: [project title]-MWPW-[Jira number]</sp-tooltip>
                    </sp-action-button>
                </div>
                <sp-textfield
                    id="project-title"
                    data-testid="title-input"
                    placeholder="Project title-MWPW-123456"
                    .value=${this.projectTitle}
                    ?disabled=${this.saving}
                    ?invalid=${this.hasChanges && !!this.titleError}
                    @input=${this.handleTitleInput}
                >
                    <sp-help-text slot="negative-help-text" data-testid="title-error">${this.titleError}</sp-help-text>
                </sp-textfield>
            </div>
            <mas-quick-actions
                drag-handle-style="bar"
                .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.DELETE]}
                .iconOverrides=${{
                    [QUICK_ACTION.SAVE]: { icon: SAVE_SVG, title: 'Save' },
                    [QUICK_ACTION.DELETE]: { icon: DELETE_SVG, title: 'Delete', className: 'delete-action' },
                }}
                .disabled=${this.disabledActions}
                @save=${this.save}
                @delete=${() => (this.deleteDialogOpen = true)}
            ></mas-quick-actions>
            ${this.deleteDialog}
        `;
    }
}

customElements.define('mas-bulk-edit-editor', MasBulkEditEditor);
