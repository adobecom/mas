import { LitElement, html } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import router from '../router.js';
import { styles } from './mas-bulk-publish.css.js';
import { BULK_PUBLISH_STATUS, PAGE_NAMES } from '../constants.js';

const STATUS_VARIANT = {
    [BULK_PUBLISH_STATUS.DRAFT]: { label: 'Draft', className: 'draft' },
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

class MasBulkPublish extends LitElement {
    static styles = styles;

    list = new StoreController(this, Store.bulkPublishProjects.list.data);

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

    openProject(projectStore) {
        const id = projectStore?.get()?.id;
        if (!id) return;
        Store.bulkPublishProjects.projectId.set(id);
        Store.bulkPublishProjects.inEdit.set(projectStore.get());
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR)();
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
            if (counts[type] !== undefined) counts[type] += 1;
            else counts.fragment += 1;
        }
        return counts;
    }

    formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        return DATE_FORMATTER.format(date).replace(',', ',');
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
                        <sp-menu-item disabled>
                            <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                            Duplicate
                        </sp-menu-item>
                        <sp-menu-item disabled>
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
        const counts = this.countByType(this.parseItems(data.getFieldValue?.('items') ?? data.items));
        const title = data.getFieldValue?.('title') ?? data.title ?? '';
        const status = data.getFieldValue?.('status') ?? data.status ?? BULK_PUBLISH_STATUS.DRAFT;
        const createdBy = data.created?.fullName ?? data.created?.by ?? '—';
        const scheduledAt = data.getFieldValue?.('publishedAt') ?? data.publishedAt;
        const isDisabled = status === BULK_PUBLISH_STATUS.PUBLISHING;
        return html`
            <tr data-testid="project-row" class=${isDisabled ? 'disabled' : ''}>
                <td class="project-name">${title || 'Untitled project'}</td>
                <td class="numeric">${counts.fragment}</td>
                <td class="numeric">${counts.collection}</td>
                <td class="numeric">${counts.placeholder}</td>
                <td>${createdBy}</td>
                <td>${this.formatDate(scheduledAt)}</td>
                <td>${this.renderStatus(status)}</td>
                <td class="actions-cell">${this.renderActions(projectStore)}</td>
            </tr>
        `;
    }

    render() {
        const projects = this.list.value || [];
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
            ${projects.length === 0
                ? html`<p class="empty" data-testid="empty">No bulk publish projects yet.</p>`
                : html`
                      <table>
                          <thead>
                              <tr>
                                  <th>Project</th>
                                  <th>Fragment</th>
                                  <th>Collection</th>
                                  <th>Placeholder</th>
                                  <th>Created by</th>
                                  <th>Scheduled publish date</th>
                                  <th>Status</th>
                                  <th class="center">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${projects.map((p) => this.renderRow(p))}
                          </tbody>
                      </table>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish', MasBulkPublish);
