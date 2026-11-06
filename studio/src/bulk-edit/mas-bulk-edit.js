import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ColumnResizeController, columnResizeStyles } from '../common/column-resize-controller.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import router from '../router.js';
import { BULK_EDIT_STATUS, PAGE_NAMES } from '../constants.js';
import { showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import {
    buildBulkEditProjectPayload,
    isBulkEditProjectTitleTaken,
    isValidBulkEditProjectTitle,
    loadBulkEditProjects,
} from './bulk-edit-repository.js';
import { styles } from '../bulk-publish/mas-bulk-publish.css.js';
import {
    formatProjectDate,
    getProjectField,
    renderSkeletonRows,
    trackPendingProject,
    untrackPendingProject,
} from '../common/utils/project-list-utils.js';
import { renderEditorLink, renderRowLinkOverlay } from '../common/utils/editor-link.js';
import { filterBySearchQuery, handleSearchInput } from '../common/utils/selectable-list.js';
import '../bulk-publish/mas-bulk-publish-delete-dialog.js';
import '../bulk-publish/mas-bulk-publish-duplicate-dialog.js';

const STATUS_VARIANT = {
    [BULK_EDIT_STATUS.DRAFT]: { label: 'Draft', className: 'draft' },
    [BULK_EDIT_STATUS.LOCKED]: { label: 'Locked', className: 'locked' },
    [BULK_EDIT_STATUS.APPLYING]: { label: 'Applying', className: 'publishing' },
    [BULK_EDIT_STATUS.APPLIED]: { label: 'Applied', className: 'published' },
    [BULK_EDIT_STATUS.PARTIALLY_APPLIED]: { label: 'Partially applied', className: 'partial' },
    [BULK_EDIT_STATUS.FAILED]: { label: 'Failed', className: 'failed' },
    [BULK_EDIT_STATUS.REVERTING]: { label: 'Reverting', className: 'reverting' },
    [BULK_EDIT_STATUS.REVERTED]: { label: 'Reverted', className: 'reverted' },
};

const BULK_EDIT_COLUMNS = [
    { key: 'project', label: 'Project' },
    { key: 'created-by', label: 'Created by' },
    { key: 'last-modified', label: 'Last modified' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
];

class MasBulkEdit extends LitElement {
    static styles = [
        ...styles,
        columnResizeStyles(BULK_EDIT_COLUMNS, { match: 'index' }),
        css`
            sp-tabs {
                width: 100%;
            }

            sp-tab-panel {
                padding-top: 20px;
                width: 100%;
                box-sizing: border-box;
            }

            sp-tab-panel[selected] {
                display: block;
            }

            .project-toolbar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }

            .project-toolbar sp-search {
                flex: 0 1 350px;
                min-width: 160px;
                max-width: 100%;
                --mod-search-border-radius: 16px;
            }

            .result-count {
                font-size: 12px;
                color: var(--spectrum-gray-700, #505050);
                white-space: nowrap;
            }

            .project-toolbar sp-button {
                margin-left: auto;
            }
        `,
    ];

    columnResize = new ColumnResizeController(this);

    static properties = {
        deletePending: { state: true },
        duplicatePending: { state: true },
        duplicating: { state: true },
        searchQuery: { state: true },
    };

    filteredProjects = [];

    list = new StoreController(this, Store.bulkEditProjects.list.data);
    loading = new StoreController(this, Store.bulkEditProjects.list.loading);

    #abortController = null;

    constructor() {
        super();
        this.deletePending = null;
        this.duplicatePending = null;
        this.duplicating = false;
        this.searchQuery = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.#abortController = new AbortController();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#abortController?.abort();
    }

    willUpdate() {
        this.filteredProjects = filterBySearchQuery(this.list.value || [], this.searchQuery.trim(), (projectStore) => {
            return getProjectField(projectStore.get(), 'title', '') || 'Untitled project';
        });
    }

    handleSearch(event) {
        this.searchQuery = handleSearchInput(event);
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    onCreate() {
        Store.bulkEditProjects.projectId.set(null);
        Store.bulkEditProjects.inEdit.set(null);
        router.navigateToPage(PAGE_NAMES.BULK_EDIT_EDITOR)();
    }

    openProject(projectStore) {
        const id = projectStore?.get()?.id;
        if (!id) return;
        Store.bulkEditProjects.projectId.set(id);
        Store.bulkEditProjects.inEdit.set(null);
        router.navigateToPage(PAGE_NAMES.BULK_EDIT_EDITOR)();
    }

    openDeleteDialog(projectStore) {
        const title = getProjectField(projectStore.get(), 'title', 'Untitled project');
        this.deletePending = { projectStore, title };
    }

    handleDeleteCancel() {
        this.deletePending = null;
    }

    async handleDeleteConfirmed() {
        if (!this.deletePending) return;
        const { projectStore } = this.deletePending;
        this.deletePending = null;
        const ok = await this.repository.deleteFragment(projectStore.get());
        if (!ok) return;
        untrackPendingProject(Store.bulkEditProjects.list.data, projectStore.id);
        const current = Store.bulkEditProjects.list.data.get() ?? [];
        Store.bulkEditProjects.list.data.set(current.filter((s) => s !== projectStore));
    }

    openDuplicateDialog(projectStore) {
        const title = getProjectField(projectStore.get(), 'title', 'Untitled project');
        const proposedTitle = title.replace(/-((?:MWPW|DOTCOM)-\d+)$/, ' (Copy)-$1');
        this.duplicatePending = { projectStore, proposedTitle };
    }

    async handleDuplicateConfirmed(event) {
        if (this.duplicating) return;
        const { projectStore } = this.duplicatePending;
        const title = event.detail.title.trim();
        if (!isValidBulkEditProjectTitle(title)) {
            showToast('Title must follow the format [project title]-MWPW|DOTCOM-[Jira number].', 'negative');
            return;
        }
        const { signal } = this.#abortController;
        const payload = buildBulkEditProjectPayload({ title, status: BULK_EDIT_STATUS.DRAFT });
        this.duplicating = true;
        try {
            if (!(await loadBulkEditProjects(this.repository, this.#abortController))) return;
            if (isBulkEditProjectTitleTaken(title)) {
                showToast('A project with this title already exists.', 'negative');
                return;
            }
            const source = projectStore.get();
            const configurationFields = new Set([
                'searchTerm',
                'replaceTerm',
                'fieldNames',
                'items',
                'fragments',
                'collections',
                'placeholders',
                'locales',
            ]);
            payload.fields.push(...source.fields.filter((field) => configurationFields.has(field.name)));
            const raw = await this.repository.createFragment(payload, false);
            if (!raw) return;
            trackPendingProject(Store.bulkEditProjects.list.data, new FragmentStore(new Fragment(raw)));
            this.duplicatePending = null;
            if (!signal.aborted) this.openProject({ get: () => raw });
            showToast('Project duplicated successfully.', 'positive');
        } catch (err) {
            console.error('Failed to duplicate find and replace project:', err);
            showToast('Failed to duplicate the project.', 'negative');
        } finally {
            this.duplicating = false;
        }
    }

    renderStatus(status) {
        const variant = STATUS_VARIANT[status] ?? STATUS_VARIANT[BULK_EDIT_STATUS.DRAFT];
        return html`
            <span class="status-light ${variant.className}">
                <span class="status-dot" aria-hidden="true"></span>
                ${variant.label}
            </span>
        `;
    }

    renderActions(projectStore) {
        return html`
            <overlay-trigger placement="bottom-end" offset="4">
                <sp-action-button slot="trigger" quiet aria-label="More actions">
                    <sp-icon-more slot="icon"></sp-icon-more>
                </sp-action-button>
                <sp-popover slot="click-content">
                    <sp-menu>
                        <sp-menu-item @click=${() => this.openProject(projectStore)}>
                            <sp-icon-edit slot="icon"></sp-icon-edit>
                            Edit
                        </sp-menu-item>
                        <sp-menu-item disabled title="Revert will be available with find and replace execution.">
                            <sp-icon-undo slot="icon"></sp-icon-undo>
                            Revert
                        </sp-menu-item>
                        <sp-menu-item ?disabled=${this.duplicating} @click=${() => this.openDuplicateDialog(projectStore)}>
                            <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                            Duplicate
                        </sp-menu-item>
                        <sp-menu-item @click=${() => this.openDeleteDialog(projectStore)}>
                            <sp-icon-delete slot="icon"></sp-icon-delete>
                            Delete
                        </sp-menu-item>
                    </sp-menu>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    renderRow(projectStore) {
        const data = projectStore.get();
        const title = getProjectField(data, 'title', '') || 'Untitled project';
        const status = getProjectField(data, 'status', BULK_EDIT_STATUS.DRAFT) || BULK_EDIT_STATUS.DRAFT;
        const createdBy = data.created?.fullName ?? data.created?.by ?? '—';
        return html`
            <sp-table-row data-testid="project-row" @dblclick=${() => this.openProject(projectStore)}>
                ${renderRowLinkOverlay({ id: data.id }, { page: PAGE_NAMES.BULK_EDIT_EDITOR })}
                <sp-table-cell class="project-name"
                    >${renderEditorLink({ id: data.id }, title, { page: PAGE_NAMES.BULK_EDIT_EDITOR })}</sp-table-cell
                >
                <sp-table-cell>${createdBy}</sp-table-cell>
                <sp-table-cell>${formatProjectDate(data.modified?.at ?? data.created?.at)}</sp-table-cell>
                <sp-table-cell>${this.renderStatus(status)}</sp-table-cell>
                <sp-table-cell class="actions-cell" @click=${(e) => e.stopPropagation()}
                    >${this.renderActions(projectStore)}</sp-table-cell
                >
            </sp-table-row>
        `;
    }

    render() {
        const projects = this.filteredProjects;
        const isLoading = this.loading.value && !(this.list.value || []).length;
        const showEmpty = !isLoading && projects.length === 0;
        return html`
            <header>
                <h1>Bulk edits</h1>
            </header>
            ${this.duplicatePending
                ? html`<mas-bulk-publish-duplicate-dialog
                      open
                      .proposedTitle=${this.duplicatePending.proposedTitle}
                      @duplicate-confirmed=${this.handleDuplicateConfirmed}
                      @duplicate-cancelled=${() => {
                          if (!this.duplicating) this.duplicatePending = null;
                      }}
                  ></mas-bulk-publish-duplicate-dialog>`
                : nothing}
            ${this.deletePending
                ? html`<mas-bulk-publish-delete-dialog
                      open
                      .projectTitle=${this.deletePending.title}
                      @delete-confirmed=${this.handleDeleteConfirmed}
                      @delete-cancelled=${this.handleDeleteCancel}
                  ></mas-bulk-publish-delete-dialog>`
                : nothing}
            <sp-tabs quiet selected="find-and-replace" aria-label="Bulk edits">
                <sp-tab value="find-and-replace" label="Find and replace">Find and replace</sp-tab>
                <sp-tab value="update-offer" label="Update offer" disabled>Update offer</sp-tab>
                <sp-tab-panel value="find-and-replace">
                    <div class="project-toolbar">
                        <sp-search
                            size="m"
                            label="Search find and replace projects"
                            placeholder="Search"
                            data-testid="project-search"
                            .value=${this.searchQuery}
                            @input=${this.handleSearch}
                            @change=${this.handleSearch}
                        ></sp-search>
                        ${isLoading
                            ? nothing
                            : html`<span class="result-count" data-testid="result-count" role="status"
                                  >${projects.length} result(s)</span
                              >`}
                        <sp-button variant="accent" data-testid="create-btn" @click=${this.onCreate}>
                            <sp-icon-add slot="icon"></sp-icon-add>
                            Create project
                        </sp-button>
                    </div>
                    ${showEmpty
                        ? this.searchQuery.trim()
                            ? html`<p class="empty" data-testid="no-results">No projects match your search.</p>`
                            : html`<p class="empty" data-testid="empty">No find and replace projects yet.</p>`
                        : html`
                              <sp-table
                                  emphasized
                                  class="item-table"
                                  style=${styleMap(this.columnResize.tableStyle())}
                                  data-resized-columns=${ifDefined(this.columnResize.resizedColumns)}
                              >
                                  <sp-table-head>
                                      ${BULK_EDIT_COLUMNS.map(
                                          ({ key, label }) => html`
                                              <sp-table-head-cell>
                                                  ${label} ${this.columnResize.handle(key, label)}
                                              </sp-table-head-cell>
                                          `,
                                      )}
                                  </sp-table-head>
                                  <sp-table-body>
                                      ${isLoading ? renderSkeletonRows(5) : projects.map((p) => this.renderRow(p))}
                                  </sp-table-body>
                              </sp-table>
                          `}
                </sp-tab-panel>
            </sp-tabs>
        `;
    }
}

customElements.define('mas-bulk-edit', MasBulkEdit);
