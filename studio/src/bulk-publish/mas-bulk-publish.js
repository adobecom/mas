import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import router from '../router.js';
import { styles } from './mas-bulk-publish.css.js';
import { BULK_PUBLISH_STATUS, BULK_PUBLISH_PARENT_PATH, BULK_PUBLISH_PROJECT_MODEL_ID, PAGE_NAMES } from '../constants.js';
import { normalizeKey, showToast } from '../utils.js';
import './mas-bulk-publish-duplicate-dialog.js';
import './mas-bulk-publish-delete-dialog.js';

const STATUS_VARIANT = {
    [BULK_PUBLISH_STATUS.DRAFT]: { label: 'Draft', className: 'draft' },
    [BULK_PUBLISH_STATUS.LOCKED]: { label: 'Locked', className: 'locked' },
    [BULK_PUBLISH_STATUS.PUBLISHING]: { label: 'Publishing', className: 'publishing' },
    [BULK_PUBLISH_STATUS.PUBLISHED]: { label: 'Published', className: 'published' },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
});

function getProjectField(data, name, fallback) {
    return data.getFieldValue?.(name) ?? data[name] ?? fallback;
}

function getProjectFieldList(data, name) {
    return data.getFieldValues?.(name) ?? data[name] ?? [];
}

class MasBulkPublish extends LitElement {
    static styles = styles;

    static properties = {
        duplicatePending: { state: true },
        duplicating: { state: true },
        deletePending: { state: true },
    };

    list = new StoreController(this, Store.bulkPublishProjects.list.data);
    loading = new StoreController(this, Store.bulkPublishProjects.list.loading);

    constructor() {
        super();
        this.duplicatePending = null;
        this.duplicating = false;
        this.deletePending = null;
    }

    onCreate() {
        this.dispatchEvent(new CustomEvent('create-project', { bubbles: true, composed: true }));
        Store.bulkPublishProjects.projectId.set(null);
        Store.bulkPublishProjects.inEdit.set({
            id: null,
            getFieldValue: (k) => ({ status: BULK_PUBLISH_STATUS.DRAFT, urls: '', items: '[]', locales: [], title: '' })[k],
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
        const locales = getProjectFieldList(data, 'locales');
        this.duplicating = true;
        try {
            const payload = {
                title,
                name: normalizeKey(title),
                modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
                parentPath: `${BULK_PUBLISH_PARENT_PATH}/${surface}`,
                fields: [
                    { name: 'title', type: 'text', values: [title] },
                    { name: 'status', type: 'text', values: [BULK_PUBLISH_STATUS.DRAFT] },
                    { name: 'urls', type: 'text', values: [''] },
                    { name: 'items', type: 'text', values: [items] },
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
                <tr class="skeleton-row" key=${i}>
                    ${Array.from({ length: 8 }, () => html`<td><div class="skeleton-element skeleton-table-cell"></div></td>`)}
                </tr>
            `,
        );
    }

    renderRow(projectStore) {
        const data = projectStore.get();
        const counts = this.countByType(this.parseItems(getProjectField(data, 'items')));
        const title = getProjectField(data, 'title', '');
        const status = getProjectField(data, 'status', BULK_PUBLISH_STATUS.DRAFT);
        const createdBy = data.created?.fullName ?? data.created?.by ?? '—';
        const scheduledAt = getProjectField(data, 'publishedAt');
        const isDisabled = status === BULK_PUBLISH_STATUS.PUBLISHING;
        return html`
            <tr data-testid="project-row" class=${isDisabled ? 'disabled' : ''}>
                <td class="project-name">${title || 'Untitled project'}</td>
                <td class="center">${counts.fragment}</td>
                <td class="center">${counts.collection}</td>
                <td class="center">${counts.placeholder}</td>
                <td>${createdBy}</td>
                <td>${this.formatDate(scheduledAt)}</td>
                <td>${this.renderStatus(status)}</td>
                <td class="actions-cell">${this.renderActions(projectStore)}</td>
            </tr>
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
            ${this.duplicating
                ? html`<div class="duplicating-overlay">
                      <sp-progress-circle label="Duplicating project" indeterminate size="l"></sp-progress-circle>
                  </div>`
                : nothing}
            ${showEmpty
                ? html`<p class="empty" data-testid="empty">No bulk publish projects yet.</p>`
                : html`
                      <table>
                          <thead>
                              <tr>
                                  <th>Project</th>
                                  <th class="center">Fragment</th>
                                  <th class="center">Collection</th>
                                  <th class="center">Placeholder</th>
                                  <th>Created by</th>
                                  <th>Scheduled publish date</th>
                                  <th>Status</th>
                                  <th class="center">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${isLoading ? this.renderSkeletonRows() : projects.map((p) => this.renderRow(p))}
                          </tbody>
                      </table>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish', MasBulkPublish);
