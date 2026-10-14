import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import router from '../router.js';
import { BULK_EDIT_STATUS, PAGE_NAMES } from '../constants.js';
import { styles } from '../bulk-publish/mas-bulk-publish.css.js';
import { formatProjectDate, getProjectField, renderSkeletonRows } from '../common/utils/project-list-utils.js';
import { renderEditorLink, renderRowLinkOverlay } from '../common/utils/editor-link.js';
import '../bulk-publish/mas-bulk-publish-delete-dialog.js';

class MasBulkEdit extends LitElement {
    static styles = styles;

    static properties = {
        deletePending: { state: true },
    };

    list = new StoreController(this, Store.bulkEditProjects.list.data);
    loading = new StoreController(this, Store.bulkEditProjects.list.loading);

    constructor() {
        super();
        this.deletePending = null;
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
        const { projectStore } = this.deletePending;
        this.deletePending = null;
        const ok = await this.repository.deleteFragment(projectStore.get());
        if (!ok) return;
        const current = Store.bulkEditProjects.list.data.get() ?? [];
        Store.bulkEditProjects.list.data.set(current.filter((s) => s !== projectStore));
    }

    renderStatus(status) {
        return html`
            <span class="status-light ${status.toLowerCase()}">
                <span class="status-dot" aria-hidden="true"></span>
                ${status}
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
        const projects = this.list.value || [];
        const isLoading = this.loading.value;
        const showEmpty = !isLoading && projects.length === 0;
        return html`
            <header>
                <div class="header-row">
                    <h1>Bulk edits</h1>
                    <sp-button variant="accent" data-testid="create-btn" @click=${this.onCreate}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create project
                    </sp-button>
                </div>
                <sp-divider size="s"></sp-divider>
            </header>
            ${this.deletePending
                ? html`<mas-bulk-publish-delete-dialog
                      open
                      .projectTitle=${this.deletePending.title}
                      @delete-confirmed=${this.handleDeleteConfirmed}
                      @delete-cancelled=${this.handleDeleteCancel}
                  ></mas-bulk-publish-delete-dialog>`
                : nothing}
            ${showEmpty
                ? html`<p class="empty" data-testid="empty">No bulk edit projects yet.</p>`
                : html`
                      <sp-table emphasized class="item-table">
                          <sp-table-head>
                              <sp-table-head-cell>Project</sp-table-head-cell>
                              <sp-table-head-cell>Created by</sp-table-head-cell>
                              <sp-table-head-cell>Last modified</sp-table-head-cell>
                              <sp-table-head-cell>Status</sp-table-head-cell>
                              <sp-table-head-cell>Actions</sp-table-head-cell>
                          </sp-table-head>
                          <sp-table-body>
                              ${isLoading ? renderSkeletonRows(5) : projects.map((p) => this.renderRow(p))}
                          </sp-table-body>
                      </sp-table>
                  `}
        `;
    }
}

customElements.define('mas-bulk-edit', MasBulkEdit);
