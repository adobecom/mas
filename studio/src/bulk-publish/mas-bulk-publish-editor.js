import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import router from '../router.js';
import { styles } from './mas-bulk-publish-editor.css.js';
import {
    QUICK_ACTION,
    BULK_PUBLISH_STATUS,
    BULK_PUBLISH_PROJECT_MODEL_ID,
    PAGE_NAMES,
    STATUS_PUBLISHED,
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
import {
    SAVE_SVG,
    CLONE_SVG,
    PUBLISH_SVG,
    COPY_SVG,
    LOCK_SVG,
    LOCK_OPEN_SVG,
    DELETE_SVG,
    REVERT_SVG,
} from './bulk-publish-icons.js';
import { generateCodeToUse, showToast, normalizeKey } from '../utils.js';
import { buildItemsMetadata, itemTypeFromFragment, itemTypeFromPath } from './bulk-publish-utils.js';
import './mas-bulk-publish-revert-dialog.js';

const PUBLISH_BLOCKED_REASON = {
    UNSAVED: 'Project must be saved before publishing',
    ALREADY_PUBLISHED: 'Project is already published',
    ALL_ITEMS_PUBLISHED: 'All items are already published',
};

const ENRICH_CONCURRENCY = 8;

export function publishToast(outcome, status) {
    if (outcome?.timedOut) return { message: 'Still publishing — check back later.', variant: 'info' };
    if (status === BULK_PUBLISH_STATUS.PUBLISHED) return { message: 'Project published successfully.', variant: 'positive' };
    return null;
}

async function mapWithConcurrency(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

function buildProjectPayload({ parentPath, title, status, urls, fragments, locales, items }) {
    return {
        title,
        name: normalizeKey(title),
        modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
        parentPath,
        fields: [
            { name: 'title', type: 'text', values: [title] },
            { name: 'status', type: 'text', values: [status] },
            { name: 'urls', type: 'text', values: [urls] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: fragments },
            { name: 'locales', type: 'text', multiple: true, values: locales },
            { name: 'items', type: 'text', values: [items] },
        ],
    };
}

class MasBulkPublishEditor extends LitElement {
    static styles = styles;
    inEdit = new StoreController(this, Store.bulkPublishProjects.inEdit);

    static properties = {
        confirmOpen: { state: true },
        duplicateOpen: { state: true },
        itemsSelectorOpen: { state: true },
        localesPickerOpen: { state: true },
        pendingActions: { state: true },
        hasChanges: { state: true },
        discardDialogOpen: { state: true },
        modifications: { state: true },
        revertDialogOpen: { state: true },
        localItems: { state: true },
    };

    #abortController = null;
    #validateId = 0;
    #discardResolve = null;
    #loadingItems = false;
    #currentProjectId = null;
    #projectStoreController = new ReactiveController(this, []);
    #subscribedProject = null;

    constructor() {
        super();
        this.confirmOpen = false;
        this.duplicateOpen = false;
        this.itemsSelectorOpen = false;
        this.localesPickerOpen = false;
        this.pendingActions = new Set();
        this.hasChanges = false;
        this.discardDialogOpen = false;
        this.modifications = null;
        this.revertDialogOpen = false;
        this.localItems = null;
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
                    this.hasChanges = false;
                    await this.updateComplete;
                    if (this.urls && !this.items.length) this.validate();
                    else if (this.items.length) this.reEnrichItems();
                    else this.#loadItemDetails();
                }
            } catch {
                if (!signal.aborted) {
                    Store.bulkPublishProjects.inEdit.set(null);
                }
            }
        } else {
            const fields = { status: BULK_PUBLISH_STATUS.DRAFT, urls: '', locales: [], title: '' };
            Store.bulkPublishProjects.inEdit.set({
                id: null,
                getFieldValue: (k) => fields[k],
                getFieldValues: (k) => fields[k] ?? [],
                setFieldValue: (k, v) => {
                    fields[k] = v;
                },
            });
        }
    }

    async #loadItemDetails() {
        const paths = this.getFields('fragments');
        if (!paths.length || this.localItems !== null || this.#loadingItems) return;
        this.#loadingItems = true;
        try {
            const surface = Store.search.get()?.path;
            const { signal } = this.#abortController;
            const CONCURRENCY = 5;
            const items = new Array(paths.length).fill(null);
            for (let i = 0; i < paths.length; i += CONCURRENCY) {
                if (signal.aborted) return;
                const batch = paths.slice(i, i + CONCURRENCY);
                const results = await Promise.all(
                    batch.map(async (path) => {
                        try {
                            const rawFragment = await this.repository.aem.sites.cf.fragments.getByPath(path);
                            const fragment = new Fragment(rawFragment);
                            const { authorPath, href } = generateCodeToUse(fragment, surface, PAGE_NAMES.CONTENT) || {};
                            return {
                                url: path,
                                fragmentId: fragment.id,
                                path: fragment.path,
                                authorPath: authorPath || null,
                                href: href || null,
                                status: 'valid',
                                alreadyPublished: fragment.status === STATUS_PUBLISHED,
                            };
                        } catch {
                            return { url: path, path, status: 'valid' };
                        }
                    }),
                );
                results.forEach((result, j) => {
                    items[i + j] = result;
                });
            }
            if (signal.aborted || this.localItems !== null) return;
            this.localItems = items;
        } finally {
            this.#loadingItems = false;
        }
    }

    updated() {
        const project = this.project;
        const newId = project?.id ?? null;
        if (newId !== this.#currentProjectId) {
            this.localItems = null;
            this.#currentProjectId = newId;
        }
        if (project !== this.#subscribedProject) {
            this.#subscribedProject = project;
            const stores = project?.subscribe ? [project] : [];
            this.#projectStoreController.updateStores(stores);
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

    get token() {
        return window.adobeIMS?.getAccessToken()?.token;
    }

    get ioBaseUrl() {
        return document.querySelector('meta[name="io-base-url"]')?.content;
    }

    get project() {
        return this.inEdit.value;
    }

    get items() {
        if (this.localItems !== null) return this.localItems;
        const savedItems = this.#parsedItemsMetadata();
        const paths = this.getFields('fragments');
        if (paths.length) {
            const typeByPath = new Map(savedItems.map((item) => [item.path, item.type]));
            return paths.map((path) => ({
                path,
                url: path,
                status: 'valid',
                type: typeByPath.get(path) ?? itemTypeFromPath(path),
            }));
        }
        return savedItems;
    }

    #parsedItemsMetadata() {
        const raw = this.getField('items');
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    setFragments(paths) {
        if (this.isNewProject) {
            this.project.setFieldValue('fragments', paths);
        } else {
            this.project.updateField('fragments', paths);
        }
        this.hasChanges = true;
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

    get lastResult() {
        const raw = this.getField('lastResult');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
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

    get allAlreadyPublished() {
        if (this.status === BULK_PUBLISH_STATUS.PUBLISHED) return true;
        if (this.locales.length > 0) return false;
        const valid = this.items.filter((i) => i.status === 'valid');
        return valid.length > 0 && valid.every((i) => i.alreadyPublished);
    }

    get publishBlockedReason() {
        if (this.isNewProject) return PUBLISH_BLOCKED_REASON.UNSAVED;
        if (this.status === BULK_PUBLISH_STATUS.PUBLISHED) return PUBLISH_BLOCKED_REASON.ALREADY_PUBLISHED;
        if (!this.hasValidItems) return '';
        if (this.allAlreadyPublished) return PUBLISH_BLOCKED_REASON.ALL_ITEMS_PUBLISHED;
        return '';
    }

    get isNewProject() {
        return !this.project?.id;
    }

    get isLocked() {
        return this.status === BULK_PUBLISH_STATUS.LOCKED;
    }

    get isPublished() {
        return this.status === BULK_PUBLISH_STATUS.PUBLISHED;
    }

    get canRevert() {
        return this.status === BULK_PUBLISH_STATUS.PUBLISHED || this.status === BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED;
    }

    get isPublishing() {
        return this.status === BULK_PUBLISH_STATUS.PUBLISHING;
    }

    get canStartPublishing() {
        return !this.hasChanges;
    }

    get isReadonly() {
        return this.isLocked || this.isPublished || this.isPublishing;
    }

    async #withPendingAction(action, fn) {
        this.pendingActions = new Set([...this.pendingActions, action]);
        try {
            return await fn();
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
                QUICK_ACTION.REVERT,
                QUICK_ACTION.DELETE,
            ]);
        }
        if (this.isPublishing) {
            const disabled = new Set([
                QUICK_ACTION.SAVE,
                QUICK_ACTION.DUPLICATE,
                QUICK_ACTION.PUBLISH,
                QUICK_ACTION.LOCK,
                QUICK_ACTION.DELETE,
            ]);
            if (!this.getFields('snapshots').length) {
                disabled.add(QUICK_ACTION.REVERT);
            }
            return disabled;
        }
        if (this.isPublished) {
            return new Set([QUICK_ACTION.SAVE, QUICK_ACTION.PUBLISH]);
        }
        const disabled = new Set();
        if (this.isNewProject) {
            disabled.add(QUICK_ACTION.DUPLICATE);
            disabled.add(QUICK_ACTION.LOCK);
        } else if (!this.hasChanges) {
            disabled.add(QUICK_ACTION.SAVE);
        }
        if (!this.canRevert) disabled.add(QUICK_ACTION.REVERT);
        if (!this.items.length) disabled.add(QUICK_ACTION.COPY);
        if (!this.hasValidItems || this.publishBlockedReason || this.status === BULK_PUBLISH_STATUS.PUBLISHING) {
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

    handleConfirmPublish(e) {
        this.confirmOpen = false;
        const { includeVariations = false, includeCards = false } = e?.detail ?? {};
        this.publish(includeVariations, includeCards);
    }

    setProjectField(name, value) {
        if (this.isNewProject) {
            this.project.setFieldValue(name, value);
        } else {
            this.project.updateField(name, [value]);
        }
        this.hasChanges = true;
    }

    handleTitleChange(e) {
        if (this.isReadonly) return;
        this.setProjectField('title', e.target.value);
        this.requestUpdate();
    }

    handleUrlsChange(e) {
        if (this.isReadonly) return;
        this.setProjectField('urls', e.detail);
        this.requestUpdate();
    }

    handleUrlRemove(e) {
        if (this.isReadonly) return;
        const urlToRemove = e.detail;
        const updated = this.urlLines.filter((l) => l !== urlToRemove).join('\n');
        this.setProjectField('urls', updated);
        const updatedItems = this.items.filter((i) => i.url !== urlToRemove);
        this.localItems = updatedItems;
        const validPaths = updatedItems.filter((i) => i.status === 'valid' && i.path).map((i) => i.path);
        this.setFragments(validPaths);
        this.requestUpdate();
    }

    handleRemoveAll() {
        if (this.isReadonly) return;
        this.setProjectField('urls', '');
        this.localItems = [];
        this.setFragments([]);
        this.requestUpdate();
    }

    ensureSurface() {
        const current = Store.search.get()?.path;
        if (!current) {
            Store.search.set((prev) => ({ ...prev, path: 'sandbox' }));
        }
    }

    openItemsSelector() {
        if (this.isReadonly) return;
        this.ensureSurface();
        Store.bulkPublishProjects.allCards.set([]);
        Store.bulkPublishProjects.displayCards.set([]);
        if (this.repository?.searchFragments) this.repository.searchFragments();
        if (this.repository?.loadPlaceholders) this.repository.loadPlaceholders();
        if (this.repository?.loadAllCollections) this.repository.loadAllCollections();
        this.itemsSelectorOpen = true;
    }

    closeItemsSelector() {
        this.itemsSelectorOpen = false;
    }

    async confirmItemsSelector() {
        const projects = Store.bulkPublishProjects;
        const selected = [
            ...projects.selectedCards.get(),
            ...projects.selectedCollections.get(),
            ...projects.selectedPlaceholders.get(),
        ];
        const existing = new Set(this.items.flatMap((i) => [i.path, i.url].filter(Boolean)));
        const deduped = selected.filter((p) => !existing.has(p));
        const skipped = selected.length - deduped.length;
        if (skipped > 0) {
            showToast(
                skipped === 1 ? 'Item already exists in the project' : `${skipped} items already exist in the project`,
                'negative',
            );
        }
        const merged = Array.from(new Set([...this.urlLines, ...deduped])).join('\n');
        this.setProjectField('urls', merged);
        projects.selectedCards.set([]);
        projects.selectedCollections.set([]);
        projects.selectedPlaceholders.set([]);
        this.itemsSelectorOpen = false;
        await this.validate();
    }

    openLocalesPicker() {
        if (this.isReadonly) return;
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
        this.hasChanges = true;
        this.localesPickerOpen = false;
    }

    async promptDiscardChanges() {
        if (!this.hasChanges) return true;
        return new Promise((resolve) => {
            this.#discardResolve = resolve;
            this.discardDialogOpen = true;
        });
    }

    #confirmDiscard() {
        this.discardDialogOpen = false;
        this.#discardResolve?.(true);
        this.#discardResolve = null;
    }

    #cancelDiscard() {
        this.discardDialogOpen = false;
        this.#discardResolve?.(false);
        this.#discardResolve = null;
    }

    async saveBulkProject() {
        await this.#withPendingAction(QUICK_ACTION.SAVE, async () => {
            this.ensureSurface();
            const surface = Store.search.get()?.path;
            try {
                if (this.isNewProject) {
                    const title = this.title || 'Untitled bulk publish project';
                    const validPaths = this.items.filter((i) => i.status === 'valid' && i.path).map((i) => i.path);
                    const payload = buildProjectPayload({
                        parentPath: this.repository.getBulkPublishParentPath(surface),
                        title,
                        status: this.status,
                        urls: this.urls,
                        fragments: validPaths,
                        locales: this.locales,
                        items: buildItemsMetadata(this.items),
                    });
                    const raw = await this.repository.createFragment(payload, false);
                    if (!raw) throw new Error('Create returned empty response');
                    Store.bulkPublishProjects.inEdit.set(new FragmentStore(new Fragment(raw)));
                    this.hasChanges = false;
                    showToast('Project created successfully.', 'positive');
                } else {
                    const savedStatus = this.status === BULK_PUBLISH_STATUS.PUBLISHED ? BULK_PUBLISH_STATUS.DRAFT : this.status;
                    const fields = {
                        title: this.title,
                        status: savedStatus,
                        urls: this.urls,
                    };
                    for (const [name, value] of Object.entries(fields)) {
                        this.project.updateField(name, [value]);
                    }
                    const validPaths = this.items.filter((i) => i.status === 'valid' && i.path).map((i) => i.path);
                    this.project.updateField('items', [buildItemsMetadata(this.items)]);
                    this.project.updateField('fragments', validPaths);
                    this.project.updateField('locales', this.locales);
                    const saved = await this.repository.saveFragment(this.project, false);
                    if (!saved) throw new Error('Save returned empty response');
                    this.hasChanges = false;
                    showToast('Project saved successfully.', 'positive');
                }
            } catch (err) {
                console.error('Failed to save bulk publish project:', err);
                showToast('Failed to save the project.', 'negative');
            }
        });
    }

    async deleteBulkProject() {
        if (!this.isNewProject) {
            try {
                await this.repository.deleteFragment(this.project.value);
            } catch (err) {
                console.error('Failed to delete bulk publish project:', err);
                showToast('Failed to delete the project.', 'negative');
                return;
            }
        }
        Store.bulkPublishProjects.inEdit.set(null);
        Store.bulkPublishProjects.projectId.set(null);
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
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
                const validPaths = this.items.filter((i) => i.status === 'valid' && i.path).map((i) => i.path);
                const payload = buildProjectPayload({
                    parentPath: this.repository.getBulkPublishParentPath(surface),
                    title,
                    status: BULK_PUBLISH_STATUS.DRAFT,
                    urls: '',
                    fragments: validPaths,
                    locales: this.locales,
                    items: buildItemsMetadata(this.items),
                });
                const raw = await this.repository.createFragment(payload, false);
                if (!raw) throw new Error('Create returned empty response');
                Store.bulkPublishProjects.inEdit.set(new FragmentStore(new Fragment(raw)));
                showToast('Project duplicated successfully.', 'positive');
            } catch (err) {
                console.error('Failed to duplicate bulk publish project:', err);
                showToast('Failed to duplicate the project.', 'negative');
            }
        });
    }

    async reEnrichItems() {
        const items = this.items;
        if (!items.some((i) => i.path && !i.authorPath)) return;
        const runId = ++this.#validateId;
        const surface = Store.search.get()?.path;
        const enrich = async (item) => {
            if (item.authorPath || !item.path) return item;
            try {
                const rawFragment = item.fragmentId
                    ? await this.repository.getFragmentById(item.fragmentId)
                    : await this.repository.aem.sites.cf.fragments.getByPath(item.path);
                const fragment = new Fragment(rawFragment);
                const { authorPath, href } = generateCodeToUse(fragment, surface, PAGE_NAMES.CONTENT) || {};
                return {
                    ...item,
                    fragmentId: fragment.id || item.fragmentId,
                    authorPath: authorPath || item.authorPath || null,
                    locale: fragment.locale || item.locale || null,
                    href: href || item.href || null,
                };
            } catch {
                return item;
            }
        };
        const enriched = await mapWithConcurrency(items, ENRICH_CONCURRENCY, enrich);
        if (runId !== this.#validateId) return;
        this.localItems = enriched;
        this.requestUpdate();
    }

    async validate() {
        const runId = ++this.#validateId;
        const { parseStudioUrl, parseAemPath } = await import('./url-to-path.js');
        const existingItems = this.items;
        const existingUrls = new Set(existingItems.map((i) => i.url).filter(Boolean));
        const existingPaths = new Set(existingItems.map((i) => i.path).filter(Boolean));
        const existingIds = new Set(existingItems.map((i) => i.fragmentId).filter(Boolean));
        const urls = this.urlLines.filter((raw) => !existingUrls.has(raw));

        const newPending = urls.map((raw) => ({ url: raw, status: 'pending' }));
        this.localItems = [...existingItems, ...newPending];
        this.hasChanges = true;
        this.setProjectField('urls', '');
        this.requestUpdate();

        const surface = Store.search.get()?.path;
        const results = [...newPending];
        let duplicateCount = 0;
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
                        if (existingIds.has(fragment.id) || existingPaths.has(fragment.path)) {
                            results[i] = null;
                            duplicateCount++;
                        } else {
                            existingIds.add(fragment.id);
                            const { authorPath, href } = generateCodeToUse(fragment, surface, PAGE_NAMES.CONTENT) || {};
                            results[i] = {
                                url: raw,
                                fragmentId: fragment.id,
                                path: fragment.path,
                                type: itemTypeFromFragment(fragment),
                                authorPath: authorPath || null,
                                locale: fragment.locale || null,
                                href: href || null,
                                status: 'valid',
                                alreadyPublished: fragment.status === STATUS_PUBLISHED,
                            };
                        }
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
                const filtered = results.filter(Boolean);
                this.localItems = [...existingItems, ...filtered];
                const validPaths = this.localItems.filter((i) => i.status === 'valid' && i.path).map((i) => i.path);
                this.setFragments(validPaths);
                this.requestUpdate();
            }),
        );
        if (runId !== this.#validateId) return [];
        if (duplicateCount > 0) {
            showToast(
                duplicateCount === 1
                    ? 'Item already exists in the project'
                    : `${duplicateCount} items already exist in the project`,
                'negative',
            );
        }
        const filtered = results.filter(Boolean);
        return [...existingItems, ...filtered];
    }

    async handleCheckModifications() {
        const entries = this.getFields('snapshots');
        if (!entries.length) {
            showToast('No snapshot available to compare.', 'negative');
            return;
        }
        await this.#withPendingAction(QUICK_ACTION.CHECK_MODIFICATIONS, async () => {
            try {
                const { checkModificationsAction } = await import('./bulk-publish-client.js');
                const results = await checkModificationsAction({ ioBaseUrl: this.ioBaseUrl, entries, token: this.token });
                this.modifications = new Map(results.map(({ path, modified }) => [path, modified]));

                const modifiedCount = results.filter((r) => r.modified === true).length;
                if (modifiedCount > 0) {
                    showToast(`${modifiedCount} item${modifiedCount !== 1 ? 's' : ''} modified since last publish.`, 'info');
                } else {
                    showToast('No modifications found.', 'positive');
                }
            } catch (err) {
                console.error('Failed to check modifications:', err);
                showToast('Failed to check modifications.', 'negative');
            }
        });
    }

    handleRevert() {
        this.revertDialogOpen = true;
    }

    handleRevertCancel() {
        this.revertDialogOpen = false;
    }

    async handleRevertConfirmed() {
        this.revertDialogOpen = false;
        const { startReverting } = await import('./bulk-publish-store.js');
        try {
            await this.#withPendingAction(QUICK_ACTION.REVERT, async () => {
                await startReverting({
                    project: this.project,
                    token: this.token,
                    ioBaseUrl: this.ioBaseUrl,
                    repository: this.repository,
                });
            });
            this.requestUpdate();
            if (this.status === BULK_PUBLISH_STATUS.REVERTED) {
                showToast('Project reverted successfully.', 'positive');
            }
        } catch (err) {
            showToast(err.message || 'Failed to revert the project.', 'negative');
        }
    }

    async publish(includeVariations = false, includeCards = false) {
        if (this.hasChanges) await this.saveBulkProject();
        if (!this.canStartPublishing) return;
        try {
            const outcome = await this.#withPendingAction(QUICK_ACTION.PUBLISH, async () => {
                const { startPublishing } = await import('./bulk-publish-store.js');
                return startPublishing({
                    project: this.project,
                    token: this.token,
                    ioBaseUrl: this.ioBaseUrl,
                    repository: this.repository,
                    includeVariations,
                    includeCards,
                });
            });
            this.requestUpdate();
            const toast = publishToast(outcome, this.status);
            if (toast) showToast(toast.message, toast.variant);
        } catch (err) {
            showToast(err.message || 'Failed to publish the project.', 'negative');
        }
    }

    render() {
        if (!this.project) return html`<p>Loading…</p>`;
        const published = this.status === BULK_PUBLISH_STATUS.PUBLISHED;
        const partial = this.status === BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED;
        const failed = this.status === BULK_PUBLISH_STATUS.FAILED;
        const draftError = this.status === BULK_PUBLISH_STATUS.DRAFT || published ? (this.getField('lastError') ?? '') : '';
        const lastError = failed ? this.getField('lastError') || 'Publish failed' : draftError;
        const result = partial ? this.lastResult : null;
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
            ${this.isPublishing
                ? html`<mas-bulk-publish-success-banner variant="publishing"></mas-bulk-publish-success-banner>`
                : nothing}
            ${published || partial || lastError
                ? html`<mas-bulk-publish-success-banner
                      .publishedAt=${this.getField('publishedAt') ?? ''}
                      .publishedBy=${this.getField('publishedBy') ?? ''}
                      .error=${lastError}
                      .result=${result}
                  ></mas-bulk-publish-success-banner>`
                : nothing}
            <section class="card">
                <h3>General info</h3>
                <div class="field-group">
                    <label class="field-label">Title <span class="required">*</span></label>
                    <sp-textfield
                        placeholder="Enter title"
                        .value=${this.title}
                        ?disabled=${this.isLocked || this.isPublished}
                        @input=${this.handleTitleChange}
                    ></sp-textfield>
                </div>
            </section>
            <mas-bulk-publish-items
                .items=${this.items}
                .urls=${this.urls}
                .isPublished=${this.isPublished}
                .modifications=${this.modifications}
                ?disabled=${this.isLocked || this.isPublished}
                @urls-change=${this.handleUrlsChange}
                @validate-items=${this.validate}
                @add-by-search=${this.openItemsSelector}
                @url-remove=${this.handleUrlRemove}
                @remove-all=${this.handleRemoveAll}
                @check-modifications=${this.handleCheckModifications}
            ></mas-bulk-publish-items>
            <mas-bulk-publish-locales
                .locales=${this.locales}
                ?disabled=${this.isLocked || this.isPublished}
                @edit-locales=${this.openLocalesPicker}
            ></mas-bulk-publish-locales>
            <mas-quick-actions
                drag-handle-style="bar"
                .actions=${[
                    QUICK_ACTION.SAVE,
                    QUICK_ACTION.DUPLICATE,
                    QUICK_ACTION.PUBLISH,
                    QUICK_ACTION.COPY,
                    QUICK_ACTION.REVERT,
                    QUICK_ACTION.LOCK,
                    QUICK_ACTION.DELETE,
                ]}
                .iconOverrides=${{
                    [QUICK_ACTION.SAVE]: { icon: SAVE_SVG, title: 'Save' },
                    [QUICK_ACTION.DUPLICATE]: { icon: CLONE_SVG, title: 'Duplicate' },
                    [QUICK_ACTION.PUBLISH]: { icon: PUBLISH_SVG, title: this.publishBlockedReason || 'Publish' },
                    [QUICK_ACTION.COPY]: { icon: COPY_SVG, title: 'Copy' },
                    [QUICK_ACTION.REVERT]: { icon: REVERT_SVG, title: 'Revert' },
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
                @revert=${this.handleRevert}
                @delete=${this.deleteBulkProject}
            ></mas-quick-actions>
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${this.title}
                .validCount=${this.items.filter((i) => i.status === 'valid').length}
                .skippedCount=${this.items.filter((i) => i.status !== 'valid').length}
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
                      <mas-translation-languages
                          .targetStore=${Store.bulkPublishProjects}
                          include-source
                          include-regional
                      ></mas-translation-languages>
                  </sp-dialog-wrapper>`
                : nothing}
            ${this.discardDialogOpen
                ? html`<sp-dialog-wrapper
                      open
                      mode="modal"
                      headline="Unsaved changes"
                      cancel-label="Stay"
                      confirm-label="Discard"
                      underlay
                      no-divider
                      @confirm=${this.#confirmDiscard}
                      @cancel=${this.#cancelDiscard}
                      @close=${this.#cancelDiscard}
                  >
                      <p>You have unsaved changes. Leave anyway?</p>
                  </sp-dialog-wrapper>`
                : nothing}
            <mas-bulk-publish-revert-dialog
                .projectTitle=${this.title}
                .open=${this.revertDialogOpen}
                @revert-confirmed=${this.handleRevertConfirmed}
                @revert-cancelled=${this.handleRevertCancel}
            ></mas-bulk-publish-revert-dialog>
        `;
    }
}

customElements.define('mas-bulk-publish-editor', MasBulkPublishEditor);
