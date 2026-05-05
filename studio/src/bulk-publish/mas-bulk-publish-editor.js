import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { styles } from './mas-bulk-publish-editor.css.js';
import {
    QUICK_ACTION,
    BULK_PUBLISH_STATUS,
    BULK_PUBLISH_PROJECT_MODEL_ID,
    BULK_PUBLISH_PARENT_PATH,
    PAGE_NAMES,
} from '../constants.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { getFromFragmentCache } from '../mas-repository.js';
import '../mas-quick-actions.js';
import './mas-add-items-dialog.js';
import '../translation/mas-translation-languages.js';
import './mas-bulk-publish-items.js';
import './mas-bulk-publish-locales.js';
import './mas-bulk-publish-success-banner.js';
import './mas-bulk-publish-confirm-dialog.js';
import { SAVE_SVG, LINK_SVG, CLONE_SVG, PUBLISH_SVG, COPY_SVG, LOCK_SVG, DELETE_SVG } from './bulk-publish-icons.js';
import { generateCodeToUse, showToast, normalizeKey } from '../utils.js';

class MasBulkPublishEditor extends LitElement {
    static styles = styles;
    inEdit = new StoreController(this, Store.bulkPublishProjects.inEdit);

    static properties = {
        confirmOpen: { state: true },
        itemsSelectorOpen: { state: true },
        localesPickerOpen: { state: true },
    };

    #abortController = null;

    constructor() {
        super();
        this.confirmOpen = false;
        this.itemsSelectorOpen = false;
        this.localesPickerOpen = false;
    }

    async connectedCallback() {
        super.connectedCallback();
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;
        const projectId = Store.bulkPublishProjects.projectId.get();
        if (projectId) {
            try {
                let fragment = await getFromFragmentCache(projectId);
                if (signal.aborted) return;
                if (!fragment) {
                    fragment = await this.repository.getFragmentById(projectId);
                }
                if (signal.aborted) return;
                if (fragment) {
                    Store.bulkPublishProjects.inEdit.set(new FragmentStore(new Fragment(fragment)));
                    await this.updateComplete;
                    if (this.urls && !this.items.length) this.validate();
                }
            } catch {
                if (!signal.aborted) {
                    Store.bulkPublishProjects.inEdit.set(null);
                }
            }
        } else {
            const fields = { status: BULK_PUBLISH_STATUS.DRAFT, urls: '', items: '[]', locales: [], title: '' };
            Store.bulkPublishProjects.inEdit.set({
                id: null,
                getFieldValue: (k) => fields[k],
                setFieldValue: (k, v) => {
                    fields[k] = v;
                },
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#abortController?.abort();
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get project() {
        return this.inEdit.value;
    }

    get items() {
        const raw = this.getField('items');
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    getField(name) {
        if (this.isNewProject) return this.project?.getFieldValue(name);
        return this.project?.value?.getFieldValue(name);
    }

    getFields(name) {
        if (this.isNewProject) return this.project?.getFieldValue(name) ?? [];
        return this.project?.value?.getFieldValues(name) ?? [];
    }

    get status() {
        return this.getField('status') ?? BULK_PUBLISH_STATUS.DRAFT;
    }

    get urls() {
        return this.getField('urls') ?? '';
    }

    get urlLines() {
        return this.urls
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
    }

    get locales() {
        return this.getFields('locales');
    }

    get title() {
        return this.getField('title') ?? '';
    }

    get hasValidItems() {
        return this.items.some((i) => i.status === 'valid');
    }

    get isNewProject() {
        return !this.project?.id;
    }

    get disabledActions() {
        const disabled = new Set([QUICK_ACTION.LINK, QUICK_ACTION.DUPLICATE, QUICK_ACTION.COPY, QUICK_ACTION.LOCK]);
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

    setProjectField(name, value) {
        if (this.isNewProject) {
            this.project.setFieldValue(name, value);
        } else {
            this.project.updateField(name, [value]);
        }
    }

    handleTitleChange(e) {
        this.setProjectField('title', e.target.value);
        this.requestUpdate();
    }

    handleUrlsChange(e) {
        this.setProjectField('urls', e.detail);
        this.requestUpdate();
    }

    handleUrlRemove(e) {
        const urlToRemove = e.detail;
        const updated = this.urlLines.filter((l) => l !== urlToRemove).join('\n');
        this.setProjectField('urls', updated);
        const updatedItems = this.items.filter((i) => i.url !== urlToRemove);
        this.setProjectField('items', JSON.stringify(updatedItems));
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
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        if (this.repository?.searchFragments) this.repository.searchFragments();
        if (this.repository?.loadPlaceholders) this.repository.loadPlaceholders();
        if (this.repository?.loadAllCollections) this.repository.loadAllCollections();
        this.itemsSelectorOpen = true;
    }

    closeItemsSelector() {
        this.itemsSelectorOpen = false;
    }

    async confirmItemsSelector() {
        const selected = [
            ...Store.translationProjects.selectedCards.get(),
            ...Store.translationProjects.selectedCollections.get(),
            ...Store.translationProjects.selectedPlaceholders.get(),
        ];
        const merged = Array.from(new Set([...this.urlLines, ...selected])).join('\n');
        this.setProjectField('urls', merged);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
        this.itemsSelectorOpen = false;
        await this.validate();
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
        if (this.isNewProject) {
            this.project.setFieldValue('locales', [...selected]);
        } else {
            this.project.updateField('locales', selected);
        }
        this.localesPickerOpen = false;
    }

    async saveBulkProject() {
        const surface = Store.search.get()?.path;
        try {
            if (this.isNewProject) {
                const parentPath = `${BULK_PUBLISH_PARENT_PATH}/${surface}`;
                const title = this.title || 'Untitled bulk publish project';
                const payload = {
                    title,
                    name: normalizeKey(title),
                    modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
                    parentPath,
                    fields: [
                        { name: 'title', type: 'text', values: [title] },
                        { name: 'status', type: 'text', values: [this.status] },
                        { name: 'urls', type: 'text', values: [this.urls] },
                        { name: 'items', type: 'text', values: [this.getField('items') ?? '[]'] },
                        { name: 'locales', type: 'text', multiple: true, values: this.locales },
                    ],
                };
                const raw = await this.repository.createFragment(payload, false);
                if (!raw) throw new Error('Create returned empty response');
                const fragment = new Fragment(raw);
                const store = new FragmentStore(fragment);
                Store.bulkPublishProjects.inEdit.set(store);
                showToast('Project created successfully.', 'positive');
            } else {
                const fields = {
                    title: this.title,
                    status: this.status,
                    urls: this.urls,
                    items: this.getField('items') ?? '[]',
                };
                for (const [name, value] of Object.entries(fields)) {
                    this.project.updateField(name, [value]);
                }
                this.project.updateField('locales', this.locales);
                await this.repository.saveFragment(this.project, false);
                showToast('Project saved successfully.', 'positive');
            }
        } catch (err) {
            console.error('Failed to save bulk publish project:', err);
            showToast('Failed to save the project.', 'negative');
        }
    }

    async deleteBulkProject() {
        if (this.isNewProject) {
            Store.bulkPublishProjects.inEdit.set(null);
            return;
        }
        try {
            await this.repository.deleteFragment(this.project.value);
            Store.bulkPublishProjects.inEdit.set(null);
        } catch (err) {
            console.error('Failed to delete bulk publish project:', err);
            showToast('Failed to delete the project.', 'negative');
        }
    }

    async validate() {
        const { parseStudioUrl, parseAemPath } = await import('./url-to-path.js');
        const urls = this.urlLines;
        const existingItems = this.items;

        const newPending = urls.map((raw) => ({ url: raw, status: 'pending' }));
        this.setProjectField('items', JSON.stringify([...existingItems, ...newPending]));
        this.setProjectField('urls', '');
        this.requestUpdate();

        const surface = Store.search.get()?.path;
        const results = [...newPending];
        await Promise.all(
            urls.map(async (raw, i) => {
                const byId = parseStudioUrl(raw);
                const byPath = byId ? null : parseAemPath(raw);
                if (!byId && !byPath) {
                    results[i] = { url: raw, status: 'error', reason: 'invalid-url' };
                    this.setProjectField('items', JSON.stringify([...existingItems, ...results]));
                    this.requestUpdate();
                    return;
                }
                try {
                    const rawFragment = byId
                        ? await this.repository.getFragmentById(byId.fragmentId)
                        : await this.repository.aem.sites.cf.fragments.getByPath(byPath.path);
                    const fragment = new Fragment(rawFragment);
                    const { authorPath, href } = generateCodeToUse(fragment, surface, PAGE_NAMES.CONTENT) || {};
                    results[i] = {
                        url: raw,
                        fragmentId: fragment.id,
                        path: fragment.path,
                        authorPath: authorPath || null,
                        href: href || null,
                        status: 'valid',
                    };
                } catch (err) {
                    results[i] = {
                        url: raw,
                        ...(byId ? { fragmentId: byId.fragmentId } : { path: byPath.path }),
                        status: 'error',
                        reason: err?.response?.status === 404 ? 'not-found' : 'error',
                    };
                }
                this.setProjectField('items', JSON.stringify([...existingItems, ...results]));
                this.requestUpdate();
            }),
        );
        return [...existingItems, ...results];
    }

    async publish() {
        if (this.isNewProject) await this.saveBulkProject();
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
                      .publishedAt=${this.getField('publishedAt')}
                      .publishedBy=${this.getField('publishedBy')}
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
                @validate-items=${this.validate}
                @add-by-search=${this.openItemsSelector}
                @url-remove=${this.handleUrlRemove}
            ></mas-bulk-publish-items>
            <mas-bulk-publish-locales
                .locales=${this.locales}
                @edit-locales=${this.openLocalesPicker}
            ></mas-bulk-publish-locales>
            <mas-quick-actions
                drag-handle-style="bar"
                .actions=${[
                    QUICK_ACTION.SAVE,
                    QUICK_ACTION.LINK,
                    QUICK_ACTION.DUPLICATE,
                    QUICK_ACTION.PUBLISH,
                    QUICK_ACTION.COPY,
                    QUICK_ACTION.LOCK,
                    QUICK_ACTION.DELETE,
                ]}
                .iconOverrides=${{
                    [QUICK_ACTION.SAVE]: { svg: SAVE_SVG, title: 'Save' },
                    [QUICK_ACTION.LINK]: { svg: LINK_SVG, title: 'Link' },
                    [QUICK_ACTION.DUPLICATE]: { svg: CLONE_SVG, title: 'Duplicate' },
                    [QUICK_ACTION.PUBLISH]: { svg: PUBLISH_SVG, title: 'Publish' },
                    [QUICK_ACTION.COPY]: { svg: COPY_SVG, title: 'Copy' },
                    [QUICK_ACTION.LOCK]: { svg: LOCK_SVG, title: 'Lock' },
                    [QUICK_ACTION.DELETE]: { svg: DELETE_SVG, title: 'Delete', className: 'delete-action' },
                }}
                .disabled=${this.disabledActions}
                @save=${this.saveBulkProject}
                @publish=${this.handlePublish}
                @delete=${this.deleteBulkProject}
            ></mas-quick-actions>
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${this.title}
                .itemCount=${this.items.filter((i) => i.status === 'valid').length}
                .open=${this.confirmOpen}
                @publish-confirmed=${this.handleConfirmPublish}
                @publish-cancelled=${this.handleConfirmCancel}
            ></mas-bulk-publish-confirm-dialog>
            ${this.itemsSelectorOpen
                ? html`<mas-add-items-dialog
                      open
                      .targetStore=${Store.bulkPublishProjects}
                      @confirm=${this.confirmItemsSelector}
                      @cancel=${this.closeItemsSelector}
                  ></mas-add-items-dialog>`
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
