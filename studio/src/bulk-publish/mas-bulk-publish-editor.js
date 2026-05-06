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
import '../mas-add-items-dialog.js';
import '../translation/mas-translation-languages.js';
import './mas-bulk-publish-items.js';
import './mas-bulk-publish-locales.js';
import './mas-bulk-publish-success-banner.js';
import './mas-bulk-publish-confirm-dialog.js';
import './mas-bulk-publish-duplicate-dialog.js';
import { SAVE_SVG, CLONE_SVG, PUBLISH_SVG, COPY_SVG, LOCK_SVG, LOCK_OPEN_SVG, DELETE_SVG } from './bulk-publish-icons.js';
import { generateCodeToUse, showToast, normalizeKey } from '../utils.js';

class MasBulkPublishEditor extends LitElement {
    static styles = styles;
    inEdit = new StoreController(this, Store.bulkPublishProjects.inEdit);

    static properties = {
        confirmOpen: { state: true },
        duplicateOpen: { state: true },
        itemsSelectorOpen: { state: true },
        localesPickerOpen: { state: true },
        pendingActions: { state: true },
    };

    #abortController = null;
    #validateId = 0;

    constructor() {
        super();
        this.confirmOpen = false;
        this.duplicateOpen = false;
        this.itemsSelectorOpen = false;
        this.localesPickerOpen = false;
        this.pendingActions = new Set();
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
                    const store = new FragmentStore(new Fragment(fragment));
                    store.updateField('lastError', ['']);
                    Store.bulkPublishProjects.inEdit.set(store);
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
        this.#validateId++;
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

    get isLocked() {
        return this.status === BULK_PUBLISH_STATUS.LOCKED;
    }

    async #withPendingAction(action, fn) {
        this.pendingActions = new Set([...this.pendingActions, action]);
        try {
            await fn();
        } finally {
            const next = new Set(this.pendingActions);
            next.delete(action);
            this.pendingActions = next;
        }
    }

    get disabledActions() {
        if (this.isLocked) {
            return new Set([
                QUICK_ACTION.SAVE,
                QUICK_ACTION.DUPLICATE,
                QUICK_ACTION.PUBLISH,
                QUICK_ACTION.COPY,
                QUICK_ACTION.DELETE,
            ]);
        }
        const disabled = new Set();
        if (this.isNewProject) {
            disabled.add(QUICK_ACTION.DUPLICATE);
            disabled.add(QUICK_ACTION.LOCK);
        }
        if (!this.items.length) disabled.add(QUICK_ACTION.COPY);
        if (!this.hasValidItems || this.status !== BULK_PUBLISH_STATUS.DRAFT) {
            disabled.add(QUICK_ACTION.PUBLISH);
        }
        return disabled;
    }

    async #handleCopy() {
        const text = this.items.map((i) => i.href ?? i.url).join('\n');
        await navigator.clipboard.writeText(text);
        showToast('Items copied to clipboard.', 'positive');
    }

    async #handleLock() {
        await this.#withPendingAction(QUICK_ACTION.LOCK, async () => {
            const locking = !this.isLocked;
            const prevStatus = this.status;
            const nextStatus = locking ? BULK_PUBLISH_STATUS.LOCKED : BULK_PUBLISH_STATUS.DRAFT;
            try {
                this.project.updateField('status', [nextStatus]);
                const saved = await this.repository.saveFragment(this.project, false);
                if (!saved) {
                    this.project.updateField('status', [prevStatus]);
                    showToast('Failed to lock/unlock project.', 'negative');
                    return;
                }
                showToast(locking ? 'Project locked.' : 'Project unlocked.', 'positive');
            } catch (err) {
                this.project.updateField('status', [prevStatus]);
                console.error('Failed to lock/unlock project:', err);
                showToast('Failed to lock/unlock project.', 'negative');
            }
        });
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
        if (this.isLocked) return;
        this.setProjectField('title', e.target.value);
        this.requestUpdate();
    }

    handleUrlsChange(e) {
        if (this.isLocked) return;
        this.setProjectField('urls', e.detail);
        this.requestUpdate();
    }

    handleUrlRemove(e) {
        if (this.isLocked) return;
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
        if (this.isLocked) return;
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
        if (this.isLocked) return;
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
        await this.#withPendingAction(QUICK_ACTION.SAVE, async () => {
            this.ensureSurface();
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
                    const saved = await this.repository.saveFragment(this.project, false);
                    if (!saved) throw new Error('Save returned empty response');
                    showToast('Project saved successfully.', 'positive');
                }
            } catch (err) {
                console.error('Failed to save bulk publish project:', err);
                showToast('Failed to save the project.', 'negative');
            }
        });
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

    handleDuplicate() {
        this.duplicateOpen = true;
    }

    handleDuplicateCancel() {
        this.duplicateOpen = false;
    }

    async handleDuplicateConfirmed(e) {
        this.duplicateOpen = false;
        this.ensureSurface();
        const surface = Store.search.get()?.path;
        const title = e.detail.title;
        await this.#withPendingAction(QUICK_ACTION.DUPLICATE, async () => {
            try {
                const parentPath = `${BULK_PUBLISH_PARENT_PATH}/${surface}`;
                const payload = {
                    title,
                    name: normalizeKey(title),
                    modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
                    parentPath,
                    fields: [
                        { name: 'title', type: 'text', values: [title] },
                        { name: 'status', type: 'text', values: [BULK_PUBLISH_STATUS.DRAFT] },
                        { name: 'urls', type: 'text', values: [''] },
                        { name: 'items', type: 'text', values: [this.getField('items') ?? '[]'] },
                        { name: 'locales', type: 'text', multiple: true, values: this.locales },
                    ],
                };
                const raw = await this.repository.createFragment(payload, false);
                if (!raw) throw new Error('Create returned empty response');
                const fragment = new Fragment(raw);
                const store = new FragmentStore(fragment);
                Store.bulkPublishProjects.inEdit.set(store);
                showToast('Project duplicated successfully.', 'positive');
            } catch (err) {
                console.error('Failed to duplicate bulk publish project:', err);
                showToast('Failed to duplicate the project.', 'negative');
            }
        });
    }

    async validate() {
        const runId = ++this.#validateId;
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
                } else {
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
                }
                if (runId !== this.#validateId) return;
                this.setProjectField('items', JSON.stringify([...existingItems, ...results]));
                this.requestUpdate();
            }),
        );
        if (runId !== this.#validateId) return [];
        return [...existingItems, ...results];
    }

    async publish() {
        await this.#withPendingAction(QUICK_ACTION.PUBLISH, async () => {
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
        });
    }

    render() {
        if (!this.project) return html`<p>Loading…</p>`;
        const published = this.status === BULK_PUBLISH_STATUS.PUBLISHED;
        const lastError = this.status === BULK_PUBLISH_STATUS.DRAFT ? (this.getField('lastError') ?? '') : '';
        const titleText = this.isNewProject ? 'Create bulk publish project' : 'Bulk publish project';
        return html`
            ${this.pendingActions.size
                ? html`<div class="loading-overlay">
                      <sp-progress-circle size="l" indeterminate></sp-progress-circle>
                  </div>`
                : nothing}
            <header>
                <h1>${titleText}</h1>
            </header>
            ${published || lastError
                ? html`<mas-bulk-publish-success-banner
                      .publishedAt=${this.getField('publishedAt') ?? ''}
                      .publishedBy=${this.getField('publishedBy') ?? ''}
                      .error=${lastError}
                  ></mas-bulk-publish-success-banner>`
                : nothing}
            <section class="card">
                <h3>General info</h3>
                <div class="field-group">
                    <label class="field-label">Title <span class="required">*</span></label>
                    <sp-textfield
                        placeholder="Enter title"
                        .value=${this.title}
                        ?disabled=${this.isLocked}
                        @input=${this.handleTitleChange}
                    ></sp-textfield>
                </div>
            </section>
            <mas-bulk-publish-items
                .items=${this.items}
                .urls=${this.urls}
                ?disabled=${this.isLocked}
                @urls-change=${this.handleUrlsChange}
                @validate-items=${this.validate}
                @add-by-search=${this.openItemsSelector}
                @url-remove=${this.handleUrlRemove}
            ></mas-bulk-publish-items>
            <mas-bulk-publish-locales
                .locales=${this.locales}
                ?disabled=${this.isLocked}
                @edit-locales=${this.openLocalesPicker}
            ></mas-bulk-publish-locales>
            <mas-quick-actions
                drag-handle-style="bar"
                .actions=${[
                    QUICK_ACTION.SAVE,
                    QUICK_ACTION.DUPLICATE,
                    QUICK_ACTION.PUBLISH,
                    QUICK_ACTION.COPY,
                    QUICK_ACTION.LOCK,
                    QUICK_ACTION.DELETE,
                ]}
                .iconOverrides=${{
                    [QUICK_ACTION.SAVE]: { icon: SAVE_SVG, title: 'Save' },
                    [QUICK_ACTION.DUPLICATE]: { icon: CLONE_SVG, title: 'Duplicate' },
                    [QUICK_ACTION.PUBLISH]: { icon: PUBLISH_SVG, title: 'Publish' },
                    [QUICK_ACTION.COPY]: { icon: COPY_SVG, title: 'Copy' },
                    [QUICK_ACTION.LOCK]: {
                        icon: this.isLocked ? LOCK_OPEN_SVG : LOCK_SVG,
                        title: this.isLocked ? 'Unlock' : 'Lock',
                    },
                    [QUICK_ACTION.DELETE]: { icon: DELETE_SVG, title: 'Delete', className: 'delete-action' },
                }}
                .disabled=${this.disabledActions}
                @save=${this.saveBulkProject}
                @duplicate=${this.handleDuplicate}
                @copy=${this.#handleCopy}
                @lock=${this.#handleLock}
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
            <mas-bulk-publish-duplicate-dialog
                .proposedTitle=${`${this.title} (Copy)`}
                .open=${this.duplicateOpen}
                @duplicate-confirmed=${this.handleDuplicateConfirmed}
                @duplicate-cancelled=${this.handleDuplicateCancel}
            ></mas-bulk-publish-duplicate-dialog>
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
