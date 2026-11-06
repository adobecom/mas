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
        findText: { state: true },
        replaceText: { state: true },
        searchIn: { state: true },
        matchCase: { state: true },
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
        this.findText = '';
        this.replaceText = '';
        this.searchIn = 'everywhere';
        this.matchCase = false;
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
            return 'Title must follow the format [project title]-MWPW|DOTCOM-[Jira number], e.g. Spring sale-DOTCOM-123456.';
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

    get searchForm() {
        return html`
            <div class="search-row">
                <div class="field">
                    <sp-field-label for="find-text">Find</sp-field-label>
                    <sp-textfield
                        id="find-text"
                        placeholder="Enter word or phrase"
                        .value=${this.findText}
                        @input=${(event) => (this.findText = event.target.value)}
                    ></sp-textfield>
                    <sp-checkbox .checked=${this.matchCase} @change=${(event) => (this.matchCase = event.target.checked)}
                        >Match case</sp-checkbox
                    >
                </div>
                <div class="field">
                    <sp-field-label for="search-in">Search in</sp-field-label>
                    <sp-picker
                        id="search-in"
                        label="Search in"
                        .value=${this.searchIn}
                        @change=${(event) => (this.searchIn = event.target.value)}
                    >
                        <sp-menu-item value="everywhere">Everywhere</sp-menu-item>
                    </sp-picker>
                </div>
                <span class="replace-arrow" aria-hidden="true">&#8594;</span>
                <div class="field">
                    <sp-field-label for="replace-text">Replace</sp-field-label>
                    <sp-textfield
                        id="replace-text"
                        placeholder="Enter word or phrase"
                        .value=${this.replaceText}
                        @input=${(event) => (this.replaceText = event.target.value)}
                    ></sp-textfield>
                </div>
                <div class="file-actions">
                    <sp-button variant="secondary" disabled>
                        <sp-icon-upload-to-cloud slot="icon"></sp-icon-upload-to-cloud>
                        Upload file
                    </sp-button>
                    <sp-button variant="secondary" disabled>
                        <sp-icon-download slot="icon"></sp-icon-download>
                        Download report
                    </sp-button>
                </div>
            </div>
            <sp-help-text class="preview-notice">
                UI preview only: search, replacement, and file actions are not available yet. Only the project name is saved.
            </sp-help-text>
        `;
    }

    get fragmentsTable() {
        return html`
            <section class="fragments-table" aria-label="Fragments">
                <sp-table>
                    <sp-table-head>
                        <sp-table-head-cell>Offer</sp-table-head-cell>
                        <sp-table-head-cell>Fragment title</sp-table-head-cell>
                        <sp-table-head-cell>Offer ID</sp-table-head-cell>
                        <sp-table-head-cell>Offer type</sp-table-head-cell>
                        <sp-table-head-cell>Path</sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body></sp-table-body>
                </sp-table>
                <sp-illustrated-message>
                    <sp-icon-cloud size="xxl"></sp-icon-cloud>
                    <h2 slot="heading">${this.findText ? 'Search is not available yet' : 'No search queries entered yet'}</h2>
                    <p slot="description">
                        ${this.findText
                            ? 'Fragment search and selection will be available in the next step.'
                            : 'Enter a word or phrase in the fields above to find matching fragments once search is available.'}
                    </p>
                </sp-illustrated-message>
            </section>
        `;
    }

    render() {
        if (this.loading) return html`<sp-progress-circle label="Loading project" indeterminate></sp-progress-circle>`;
        if (this.loadFailed) return this.loadErrorView;
        return html`
            <sp-action-button quiet class="back-link" @click=${() => router.navigateToPage(PAGE_NAMES.BULK_EDIT)()}>
                &#8592; All find and replace projects
            </sp-action-button>
            <header>
                <h1>${this.isNewProject ? 'Create new find and replace project' : 'Edit find and replace project'}</h1>
                <sp-status-light variant="neutral">${this.project?.get().getFieldValue('status') || 'Draft'}</sp-status-light>
            </header>
            <div class="card">
                <div class="label-row">
                    <sp-field-label for="project-title">Project name</sp-field-label>
                    <sp-action-button quiet label="Project name format" data-testid="title-info">
                        <sp-icon-info slot="icon"></sp-icon-info>
                        <sp-tooltip self-managed placement="top">Format: [project title]-MWPW|DOTCOM-[Jira number]</sp-tooltip>
                    </sp-action-button>
                </div>
                <sp-textfield
                    id="project-title"
                    data-testid="title-input"
                    placeholder="Project title-DOTCOM-123456"
                    .value=${this.projectTitle}
                    ?disabled=${this.saving}
                    ?invalid=${this.hasChanges && !!this.titleError}
                    @input=${this.handleTitleInput}
                >
                    <sp-help-text slot="negative-help-text" data-testid="title-error">${this.titleError}</sp-help-text>
                </sp-textfield>
                ${this.searchForm}
            </div>
            ${this.fragmentsTable}
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
