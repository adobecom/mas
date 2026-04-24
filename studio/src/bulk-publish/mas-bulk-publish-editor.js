import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { styles } from './mas-bulk-publish-editor.css.js';
import { QUICK_ACTION, BULK_PUBLISH_STATUS } from '../constants.js';
import '../mas-quick-actions.js';
import './mas-bulk-publish-items.js';
import './mas-bulk-publish-locales.js';
import './mas-bulk-publish-success-banner.js';
import './mas-bulk-publish-confirm-dialog.js';

class MasBulkPublishEditor extends LitElement {
    static styles = styles;
    inEdit = new StoreController(this, Store.bulkPublishProjects.inEdit);

    static properties = {
        confirmOpen: { state: true },
    };

    constructor() {
        super();
        this.confirmOpen = false;
    }

    get project() {
        return this.inEdit.value;
    }

    get items() {
        const raw = this.project?.getFieldValue('items');
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    get status() {
        return this.project?.getFieldValue('status') ?? BULK_PUBLISH_STATUS.DRAFT;
    }

    get urls() {
        return this.project?.getFieldValue('urls') ?? '';
    }

    get locales() {
        return this.project?.getFieldValue('locales') ?? [];
    }

    get hasValidItems() {
        return this.items.some((i) => i.status === 'valid');
    }

    get disabledActions() {
        const disabled = new Set();
        if (!this.urls.trim()) disabled.add(QUICK_ACTION.VALIDATE);
        if (!this.hasValidItems || this.status !== BULK_PUBLISH_STATUS.DRAFT) {
            disabled.add(QUICK_ACTION.PUBLISH);
        }
        return disabled;
    }

    handlePublish() {
        this.confirmOpen = true;
    }

    handleConfirmCancel() {
        this.confirmOpen = false;
    }

    handleConfirmPublish() {
        this.confirmOpen = false;
        // T17 will dispatch a publish-start event here
    }

    render() {
        if (!this.project) return html`<p>Loading…</p>`;
        const published = this.status === BULK_PUBLISH_STATUS.PUBLISHED;
        return html`
            <header>
                <h1>Bulk publish project</h1>
                ${published ? html`<sp-button variant="secondary">Download report</sp-button>` : nothing}
            </header>
            ${published
                ? html`<mas-bulk-publish-success-banner
                      .publishedAt=${this.project.getFieldValue('publishedAt')}
                      .publishedBy=${this.project.getFieldValue('publishedBy')}
                  ></mas-bulk-publish-success-banner>`
                : nothing}
            <section class="card">
                <h3>General info</h3>
                <sp-textfield label="Title" .value=${this.project.getFieldValue('title') ?? ''}></sp-textfield>
            </section>
            <mas-bulk-publish-items class="card" .items=${this.items} .urls=${this.urls}></mas-bulk-publish-items>
            <mas-bulk-publish-locales class="card" .locales=${this.locales}></mas-bulk-publish-locales>
            <mas-quick-actions
                .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.VALIDATE, QUICK_ACTION.PUBLISH, QUICK_ACTION.DELETE]}
                .disabled=${this.disabledActions}
                @publish=${this.handlePublish}
            ></mas-quick-actions>
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${this.project.getFieldValue('title') ?? ''}
                .itemCount=${this.items.filter((i) => i.status === 'valid').length}
                .open=${this.confirmOpen}
                @publish-confirmed=${this.handleConfirmPublish}
                @publish-cancelled=${this.handleConfirmCancel}
            ></mas-bulk-publish-confirm-dialog>
        `;
    }
}

customElements.define('mas-bulk-publish-editor', MasBulkPublishEditor);
