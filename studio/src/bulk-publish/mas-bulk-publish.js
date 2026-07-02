import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import router from '../router.js';
import { styles } from './mas-bulk-publish.css.js';
import { BULK_PUBLISH_STATUS, BULK_PUBLISH_PROJECT_MODEL_ID, PAGE_NAMES } from '../constants.js';
import { normalizeKey, showToast } from '../utils.js';
import { startReverting } from './bulk-publish-store.js';
import { PUBLISH_SVG } from './bulk-publish-icons.js';
import { getProjectField, getProjectFieldList, itemTypeFromPath } from './bulk-publish-utils.js';
import './mas-bulk-publish-duplicate-dialog.js';
import './mas-bulk-publish-delete-dialog.js';
import './mas-bulk-publish-revert-dialog.js';

const STATUS_VARIANT = {
    [BULK_PUBLISH_STATUS.DRAFT]: { label: 'Draft', className: 'draft' },
    [BULK_PUBLISH_STATUS.LOCKED]: { label: 'Locked', className: 'locked' },
    [BULK_PUBLISH_STATUS.PUBLISHING]: { label: 'Publishing', className: 'publishing' },
    [BULK_PUBLISH_STATUS.PUBLISHED]: { label: 'Published', className: 'published' },
    [BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED]: { label: 'Partially published', className: 'partial' },
    [BULK_PUBLISH_STATUS.FAILED]: { label: 'Failed', className: 'failed' },
    [BULK_PUBLISH_STATUS.REVERTING]: { label: 'Reverting', className: 'reverting' },
    [BULK_PUBLISH_STATUS.REVERTED]: { label: 'Reverted', className: 'reverted' },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
});

class MasBulkPublish extends LitElement {
    static styles = styles;

    static properties = {
        duplicatePending: { state: true },
        duplicating: { state: true },
        deletePending: { state: true },
        revertPending: { state: true },
    };

    list = new StoreController(this, Store.bulkPublishProjects.list.data);
    loading = new StoreController(this, Store.bulkPublishProjects.list.loading);

    constructor() {
        super();
        this.duplicatePending = null;
        this.duplicating = false;
        this.deletePending = null;
        this.revertPending = null;
    }

    onCreate() {
        this.dispatchEvent(new CustomEvent('create-project', { bubbles: true, composed: true }));
        Store.bulkPublishProjects.projectId.set(null);
        Store.bulkPublishProjects.inEdit.set({
            id: null,
            getFieldValue: (k) => ({ status: BULK_PUBLISH_STATUS.DRAFT, urls: '', locales: [], title: '' })[k],
            setFieldValue: () => {},
        });
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR)();
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    openProject(projectStore) {
        const id = projectStore?.get()?.id;
        if (!id) return;
        Store.bulkPublishProjects.projectId.set(id);
        Store.bulkPublishProjects.inEdit.set(null);
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR)();
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
        if (ok) {
            const current = Store.bulkPublishProjects.list.data.get() ?? [];
            Store.bulkPublishProjects.list.data.set(current.filter((s) => s !== projectStore));
        }
    }

    openRevertDialog(projectStore) {
        const title = getProjectField(projectStore.get(), 'title', 'Untitled project');
        this.revertPending = { projectStore, title };
    }

    handleRevertCancel() {
        this.revertPending = null;
    }

    async handleRevertConfirmed() {
        const { projectStore } = this.revertPending;
        this.revertPending = null;
        const token = window.adobeIMS?.getAccessToken()?.token;
        const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
        await startReverting({ project: projectStore, token, ioBaseUrl, repository: this.repository });
        const status = getProjectField(projectStore.get(), 'status', '');
        if (status === BULK_PUBLISH_STATUS.REVERTED) {
            showToast('Project reverted successfully.', 'positive');
        } else {
            showToast('Revert failed. Check project for details.', 'negative');
        }
    }

    openDuplicateDialog(projectStore) {
        const srcTitle = getProjectField(projectStore.get(), 'title', 'Untitled project');
        this.duplicatePending = { projectStore, proposedTitle: `${srcTitle} (Copy)` };
    }

    handleDuplicateCancel() {
        this.duplicatePending = null;
    }

    async handleDuplicateConfirmed(e) {
        const { projectStore } = this.duplicatePending;
        this.duplicatePending = null;
        const data = projectStore.get();
        const surface = Store.search.get()?.path?.split('/').filter(Boolean)[0]?.toLowerCase() ?? 'sandbox';
        const title = e.detail.title;
        const items = getProjectField(data, 'items', '[]');
        const fragments = getProjectFieldList(data, 'fragments');
        const locales = getProjectFieldList(data, 'locales');
        this.duplicating = true;
        try {
            const payload = {
                title,
                name: normalizeKey(title),
                modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
                parentPath: this.repository.getBulkPublishParentPath(surface),
                fields: [
                    { name: 'title', type: 'text', values: [title] },
                    { name: 'status', type: 'text', values: [BULK_PUBLISH_STATUS.DRAFT] },
                    { name: 'urls', type: 'text', values: [''] },
                    { name: 'items', type: 'text', values: [items] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: fragments },
                    { name: 'locales', type: 'text', multiple: true, values: locales },
                ],
            };
            const raw = await this.repository.createFragment(payload, false);
            if (!raw) throw new Error('Create returned empty response');
            Store.bulkPublishProjects.projectId.set(raw.id);
            Store.bulkPublishProjects.inEdit.set(null);
            router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR)();
        } catch (err) {
            console.error('Failed to duplicate bulk publish project:', err);
            showToast('Failed to duplicate the project.', 'negative');
        } finally {
            this.duplicating = false;
        }
    }

    parseItems(rawItems) {
        if (!rawItems) return [];
        try {
            return JSON.parse(rawItems);
        } catch {
            return [];
        }
    }

    countByType(items) {
        const counts = { fragment: 0, collection: 0, placeholder: 0 };
        for (const item of items) {
            if (!item || item.status !== 'valid') continue;
            const type = item.type ?? 'fragment';
            const bucket = counts[type] !== undefined ? type : 'fragment';
            counts[bucket] += 1;
        }
        return counts;
    }

    formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        return DATE_FORMATTER.format(date);
    }

    statusVariant(status) {
        return STATUS_VARIANT[status] ?? STATUS_VARIANT[BULK_PUBLISH_STATUS.DRAFT];
    }

    renderStatus(status) {
        const variant = this.statusVariant(status);
        return html`
            <span class="status-light ${variant.className}">
                <span class="status-dot" aria-hidden="true"></span>
                ${variant.label}
            </span>
        `;
    }

    renderActions(projectStore) {
        const status = getProjectField(projectStore.get(), 'status', BULK_PUBLISH_STATUS.DRAFT);
        const isPublished = status === BULK_PUBLISH_STATUS.PUBLISHED;
        const canRevert = status === BULK_PUBLISH_STATUS.PUBLISHED || status === BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED;
        const isPublishing = status === BULK_PUBLISH_STATUS.PUBLISHING;
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
                        ${!isPublished
                            ? html`<sp-menu-item @click=${() => this.openProject(projectStore)}>
                                  ${PUBLISH_SVG} Publish
                              </sp-menu-item>`
                            : nothing}
                        ${canRevert
                            ? html`<sp-menu-item @click=${() => this.openRevertDialog(projectStore)}>
                                  <sp-icon-undo slot="icon"></sp-icon-undo>
                                  Revert
                              </sp-menu-item>`
                            : nothing}
                        <sp-menu-item @click=${() => this.openDuplicateDialog(projectStore)}>
                            <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                            Duplicate
                        </sp-menu-item>
                        <sp-menu-item ?disabled=${isPublishing} @click=${() => this.openDeleteDialog(projectStore)}>
                            <sp-icon-delete slot="icon"></sp-icon-delete>
                            Delete
                        </sp-menu-item>
                    </sp-menu>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    renderSkeletonRows() {
        return Array.from(
            { length: 5 },
            (_, i) => html`
                <sp-table-row key=${i}>
                    ${Array.from(
                        { length: 8 },
                        () => html`<sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>`,
                    )}
                </sp-table-row>
            `,
        );
    }

    projectItems(data) {
        const items = this.parseItems(getProjectField(data, 'items'));
        if (items.length) return items;
        return getProjectFieldList(data, 'fragments').map((path) => ({
            path,
            status: 'valid',
            type: itemTypeFromPath(path),
        }));
    }

    renderRow(projectStore) {
        const data = projectStore.get();
        const counts = this.countByType(this.projectItems(data));
        const title = getProjectField(data, 'title', '');
        const status = getProjectField(data, 'status', BULK_PUBLISH_STATUS.DRAFT);
        const createdBy = data.created?.fullName ?? data.created?.by ?? '—';
        const scheduledAt = getProjectField(data, 'publishedAt');
        const isDisabled = status === BULK_PUBLISH_STATUS.PUBLISHING;
        return html`
            <sp-table-row
                data-testid="project-row"
                class=${isDisabled ? 'disabled' : ''}
                @dblclick=${() => this.openProject(projectStore)}
            >
                <sp-table-cell class="project-name">${title || 'Untitled project'}</sp-table-cell>
                <sp-table-cell class="center">${counts.fragment}</sp-table-cell>
                <sp-table-cell class="center">${counts.collection}</sp-table-cell>
                <sp-table-cell class="center">${counts.placeholder}</sp-table-cell>
                <sp-table-cell>${createdBy}</sp-table-cell>
                <sp-table-cell>${this.formatDate(scheduledAt)}</sp-table-cell>
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
                    <h1>Bulk publish</h1>
                    <sp-button variant="accent" data-testid="create-btn" @click=${this.onCreate}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create project
                    </sp-button>
                </div>
                <sp-divider size="s"></sp-divider>
            </header>
            ${this.duplicatePending
                ? html`<mas-bulk-publish-duplicate-dialog
                      open
                      .proposedTitle=${this.duplicatePending.proposedTitle}
                      @duplicate-confirmed=${this.handleDuplicateConfirmed}
                      @duplicate-cancelled=${this.handleDuplicateCancel}
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
            ${this.revertPending
                ? html`<mas-bulk-publish-revert-dialog
                      open
                      .projectTitle=${this.revertPending.title}
                      @revert-confirmed=${this.handleRevertConfirmed}
                      @revert-cancelled=${this.handleRevertCancel}
                  ></mas-bulk-publish-revert-dialog>`
                : nothing}
            ${this.duplicating
                ? html`<div class="duplicating-overlay">
                      <sp-progress-circle label="Duplicating project" indeterminate size="l"></sp-progress-circle>
                  </div>`
                : nothing}
            ${showEmpty
                ? html`<p class="empty" data-testid="empty">No bulk publish projects yet.</p>`
                : html`
                      <sp-table emphasized class="item-table">
                          <sp-table-head>
                              <sp-table-head-cell>Project</sp-table-head-cell>
                              <sp-table-head-cell class="center">Fragment</sp-table-head-cell>
                              <sp-table-head-cell class="center">Collection</sp-table-head-cell>
                              <sp-table-head-cell class="center">Placeholder</sp-table-head-cell>
                              <sp-table-head-cell>Created by</sp-table-head-cell>
                              <sp-table-head-cell>Scheduled publish date</sp-table-head-cell>
                              <sp-table-head-cell>Status</sp-table-head-cell>
                              <sp-table-head-cell class="center">Actions</sp-table-head-cell>
                          </sp-table-head>
                          <sp-table-body>
                              ${isLoading ? this.renderSkeletonRows() : projects.map((p) => this.renderRow(p))}
                          </sp-table-body>
                      </sp-table>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish', MasBulkPublish);
