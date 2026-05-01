import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { styles } from './mas-bulk-publish-editor.css.js';
import { QUICK_ACTION, BULK_PUBLISH_STATUS } from '../constants.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { getFromFragmentCache } from '../mas-repository.js';
import '../mas-quick-actions.js';
import '../translation/mas-items-selector.js';
import '../translation/mas-translation-languages.js';
import './mas-bulk-publish-items.js';
import './mas-bulk-publish-locales.js';
import './mas-bulk-publish-success-banner.js';
import './mas-bulk-publish-confirm-dialog.js';

class MasBulkPublishEditor extends LitElement {
    static styles = styles;
    inEdit = new StoreController(this, Store.bulkPublishProjects.inEdit);

    static properties = {
        confirmOpen: { state: true },
        itemsSelectorOpen: { state: true },
        localesPickerOpen: { state: true },
    };

    constructor() {
        super();
        this.confirmOpen = false;
        this.itemsSelectorOpen = false;
        this.localesPickerOpen = false;
    }

    async connectedCallback() {
        super.connectedCallback();
        if (this.project) return;
        const projectId = Store.bulkPublishProjects.projectId.get();
        if (projectId) {
            try {
                let fragment = await getFromFragmentCache(projectId);
                if (!fragment) {
                    fragment = await this.repository.getFragmentById(projectId);
                }
                if (fragment) {
                    Store.bulkPublishProjects.inEdit.set(new FragmentStore(new Fragment(fragment)));
                }
            } catch {
                Store.bulkPublishProjects.inEdit.set(null);
            }
        } else {
            Store.bulkPublishProjects.inEdit.set({
                id: null,
                getFieldValue: (k) => ({ status: BULK_PUBLISH_STATUS.DRAFT, urls: '', items: '[]', locales: [], title: '' })[k],
                setFieldValue: () => {},
            });
        }
    }

    get repository() {
        return document.querySelector('mas-repository');
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

    get title() {
        return this.project?.getFieldValue('title') ?? '';
    }

    get hasValidItems() {
        return this.items.some((i) => i.status === 'valid');
    }

    get isNewProject() {
        return !this.project?.id;
    }

    get disabledActions() {
        const disabled = new Set([QUICK_ACTION.DUPLICATE, QUICK_ACTION.COPY, QUICK_ACTION.LOCK]);
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
        this.publish();
    }

    handleTitleChange(e) {
        this.project?.setFieldValue('title', e.target.value);
        this.requestUpdate();
    }

    handleUrlsChange(e) {
        this.project?.setFieldValue('urls', e.detail);
        this.requestUpdate();
    }

    handleUrlRemove(e) {
        const urlToRemove = e.detail;
        const updated = this.urls
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l && l !== urlToRemove)
            .join('\n');
        this.project?.setFieldValue('urls', updated);
        const updatedItems = this.items.filter((i) => i.url !== urlToRemove);
        this.project?.setFieldValue('items', JSON.stringify(updatedItems));
        this.requestUpdate();
    }

    ensureSurface() {
        const current = Store.search.get()?.path;
        if (!current) {
            Store.search.set((prev) => ({ ...prev, path: 'sandbox' }));
        }
    }

    openItemsSelector() {
        this.ensureSurface();
        if (this.repository?.searchFragments) this.repository.searchFragments();
        if (this.repository?.loadPlaceholders) this.repository.loadPlaceholders();
        this.itemsSelectorOpen = true;
    }

    closeItemsSelector() {
        this.itemsSelectorOpen = false;
    }

    confirmItemsSelector() {
        const selected = Store.bulkPublishProjects.selectedCards.get();
        const studioBase = `${window.location.origin}/studio.html`;
        const urlLines = selected
            .map((card) => {
                const id = card?.getFieldValue?.('id') ?? card?.id;
                if (!id) return null;
                return `${studioBase}#content-type=merch-card&page=content&path=sandbox&query=${id}`;
            })
            .filter(Boolean);
        const existing = this.urls
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...urlLines])).join('\n');
        this.project?.setFieldValue('urls', merged);
        this.itemsSelectorOpen = false;
        this.requestUpdate();
    }

    openLocalesPicker() {
        this.ensureSurface();
        Store.bulkPublishProjects.targetLocales.set([...this.locales]);
        this.localesPickerOpen = true;
    }

    closeLocalesPicker() {
        this.localesPickerOpen = false;
    }

    confirmLocalesPicker() {
        const selected = Store.bulkPublishProjects.targetLocales.get();
        this.project?.setFieldValue('locales', [...selected]);
        this.localesPickerOpen = false;
        this.requestUpdate();
    }

    async validate() {
        const { parseStudioUrl } = await import('./url-to-path.js');
        const urls = this.urls
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        const results = await Promise.all(
            urls.map(async (raw) => {
                const parsed = parseStudioUrl(raw);
                if (!parsed) {
                    return { url: raw, status: 'error', reason: 'invalid-url' };
                }
                try {
                    const fragment = await this.repository.getFragmentById(parsed.fragmentId);
                    return {
                        url: raw,
                        fragmentId: parsed.fragmentId,
                        path: fragment.path,
                        status: 'valid',
                    };
                } catch (err) {
                    return {
                        url: raw,
                        fragmentId: parsed.fragmentId,
                        status: 'error',
                        reason: err?.response?.status === 404 ? 'not-found' : 'error',
                    };
                }
            }),
        );
        this.project.setFieldValue('items', JSON.stringify(results));
        this.requestUpdate();
        return results;
    }

    async publish() {
        const { startPublishing } = await import('./bulk-publish-store.js');
        const { publishBulk } = await import('./bulk-publish-client.js');
        const paths = this.items.filter((i) => i.status === 'valid').map((i) => i.path);
        const token = window.adobeIMS?.getAccessToken()?.token;
        const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
        await startPublishing({
            project: this.project,
            paths,
            locales: this.locales,
            token,
            ioBaseUrl,
            publishFn: publishBulk,
            repository: this.repository,
        });
    }

    render() {
        if (!this.project) return html`<p>Loading…</p>`;
        const published = this.status === BULK_PUBLISH_STATUS.PUBLISHED;
        const titleText = this.isNewProject ? 'Create bulk publish project' : 'Bulk publish project';
        return html`
            <header>
                <h1>${titleText}</h1>
                <sp-button variant="secondary" treatment="outline" size="m" ?disabled=${!published}>
                    <sp-icon-download slot="icon"></sp-icon-download>
                    Download report
                </sp-button>
            </header>
            ${published
                ? html`<mas-bulk-publish-success-banner
                      .publishedAt=${this.project.getFieldValue('publishedAt')}
                      .publishedBy=${this.project.getFieldValue('publishedBy')}
                  ></mas-bulk-publish-success-banner>`
                : nothing}
            <section class="card">
                <h3>General info</h3>
                <div class="field-group">
                    <label class="field-label">Title <span class="required">*</span></label>
                    <sp-textfield
                        placeholder="Enter title"
                        .value=${this.title}
                        @input=${this.handleTitleChange}
                    ></sp-textfield>
                </div>
            </section>
            <mas-bulk-publish-items
                .items=${this.items}
                .urls=${this.urls}
                @urls-change=${this.handleUrlsChange}
                @add-by-search=${this.openItemsSelector}
                @url-remove=${this.handleUrlRemove}
            ></mas-bulk-publish-items>
            <mas-bulk-publish-locales
                .locales=${this.locales}
                @edit-locales=${this.openLocalesPicker}
            ></mas-bulk-publish-locales>
            <mas-quick-actions
                .actions=${[
                    QUICK_ACTION.SAVE,
                    QUICK_ACTION.VALIDATE,
                    QUICK_ACTION.DUPLICATE,
                    QUICK_ACTION.PUBLISH,
                    QUICK_ACTION.COPY,
                    QUICK_ACTION.LOCK,
                    QUICK_ACTION.DELETE,
                ]}
                .disabled=${this.disabledActions}
                @save=${() => this.repository?.saveFragment?.(this.project)}
                @validate=${() => this.validate()}
                @publish=${this.handlePublish}
                @delete=${() => this.repository?.deleteFragment?.(this.project)}
            ></mas-quick-actions>
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${this.title}
                .itemCount=${this.items.filter((i) => i.status === 'valid').length}
                .open=${this.confirmOpen}
                @publish-confirmed=${this.handleConfirmPublish}
                @publish-cancelled=${this.handleConfirmCancel}
            ></mas-bulk-publish-confirm-dialog>
            ${this.itemsSelectorOpen
                ? html`<sp-dialog-wrapper
                      class="add-items-dialog"
                      open
                      mode="modal"
                      size="l"
                      headline="Add by search"
                      cancel-label="Cancel"
                      confirm-label="Add selected items"
                      underlay
                      no-divider
                      @confirm=${this.confirmItemsSelector}
                      @cancel=${this.closeItemsSelector}
                      @close=${this.closeItemsSelector}
                  >
                      <mas-items-selector hide-selected-toggle .targetStore=${Store.bulkPublishProjects}></mas-items-selector>
                  </sp-dialog-wrapper>`
                : nothing}
            ${this.localesPickerOpen
                ? html`<sp-dialog-wrapper
                      class="add-locales-dialog"
                      open
                      mode="modal"
                      size="l"
                      headline="Select locales"
                      cancel-label="Cancel"
                      confirm-label="Continue"
                      underlay
                      no-divider
                      @confirm=${this.confirmLocalesPicker}
                      @cancel=${this.closeLocalesPicker}
                      @close=${this.closeLocalesPicker}
                  >
                      <mas-translation-languages .targetStore=${Store.bulkPublishProjects}></mas-translation-languages>
                  </sp-dialog-wrapper>`
                : nothing}
        `;
    }
}

customElements.define('mas-bulk-publish-editor', MasBulkPublishEditor);
