import { AEM } from '../aem/aem.js';
import { Fragment } from '../aem/fragment.js';
import { ROOT_PATH } from '../constants.js';
import { ReactiveStore } from '../reactivity/reactive-store.js';
import { showToast, normalizeKey } from '../utils.js';

const INDEX_REFERENCES_FIELD = 'entries';
const INDEX_NOT_FOUND_MESSAGES = ['404', 'Fragment not found'];
const OFFER_MAPPING_INDEX_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL29mZmVyLW1hcHBpbmctaW5kZXg=';
const OFFER_MAPPING_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL29mZmVyLW1hcHBpbmctZW50cnk=';
const FRAGMENT_SUFFIX_LENGTH = 4;
const FRAGMENT_NAME_COLLISION_LIMIT = 20;
export const DELETE_BLOCKED_STATUSES = ['PUBLISHED', 'MODIFIED'];

/**
 * Normalizes an offer-mapping entry fragment into a UI row record.
 * @param {import('../aem/fragment.js').Fragment} fragment
 * @returns {object}
 */
export const normalizeMappingFragment = (fragment) => ({
    id: fragment.id,
    sourceOffer: `${fragment.getFieldValue('sourceoffer') || ''}`,
    targetOffer: `${fragment.getFieldValue('targetoffer') || ''}`,
    geos: fragment.getFieldValues('geos') || [],
    modifiedBy: fragment.modified?.by || '',
    modifiedAt: fragment.modified?.at || '',
    status: fragment.status,
    path: fragment.path,
    fragment,
});

/**
 * Offer-mapping table state holder and mutator surface. Mirrors SettingsStore: a surface-scoped index
 * (`<root>/<surface>/offer-mapping/index`) whose entries are offer-mapping-entry fragments carrying a
 * sourceOffer, a targetOffer and geo tags. Language-independent — geo scoping lives on each entry.
 */
export class OfferMappingStore {
    rows = new ReactiveStore([]);
    loading = new ReactiveStore(false);
    error = new ReactiveStore(null);

    bucket = '';
    baseUrl = '';
    aem = null;

    #surface = '';
    #loadingSurface = '';
    #loadSurfacePromise = null;

    constructor(bucket = '', baseUrl = '') {
        this.bucket = bucket;
        this.baseUrl = baseUrl;
    }

    get surface() {
        return this.#surface;
    }

    get #offerMappingPath() {
        return `${ROOT_PATH}/${this.#surface}/offer-mapping`;
    }

    get #indexPath() {
        return `${this.#offerMappingPath}/index`;
    }

    get #entryModelId() {
        return this.rows.get()[0]?.value.fragment?.model?.id || OFFER_MAPPING_ENTRY_MODEL_ID;
    }

    initAem(bucket = '', baseUrl = '') {
        if (bucket === this.bucket && baseUrl === this.baseUrl && this.aem) return;
        this.bucket = bucket;
        this.baseUrl = baseUrl;
        this.aem = new AEM(this.bucket, this.baseUrl);
    }

    setAem(aem) {
        this.aem = aem;
    }

    async ensureSurfaceLoaded(surface) {
        if (!surface) return;
        if (surface === this.#surface) return this.#loadSurfacePromise;
        return this.loadSurface(surface);
    }

    async loadSurface(surface) {
        const nextSurface = surface || '';
        if (nextSurface && this.#loadingSurface === nextSurface && this.#loadSurfacePromise) {
            return this.#loadSurfacePromise;
        }

        this.#surface = nextSurface;
        if (!nextSurface) {
            this.#loadingSurface = '';
            this.#loadSurfacePromise = null;
            this.error.set(null);
            this.setMappingFragments([]);
            return;
        }

        if (!this.aem) return;

        this.#loadingSurface = nextSurface;
        const offerMappingPath = `${ROOT_PATH}/${nextSurface}/offer-mapping`;
        const indexPath = `${offerMappingPath}/index`;
        const loadPromise = (async () => {
            this.loading.set(true);
            this.error.set(null);

            try {
                let indexFragment;
                try {
                    indexFragment = await this.aem.sites.cf.fragments.getByPath(indexPath, {
                        references: 'direct-hydrated',
                    });
                } catch (error) {
                    if (!INDEX_NOT_FOUND_MESSAGES.some((message) => error.message.includes(message))) {
                        throw error;
                    }
                    // No index authored yet for this surface: show an empty state. The index is created
                    // lazily on the first `createMapping` (see #addPathsToIndex) — viewing must not create
                    // or publish anything.
                    if (this.#surface !== nextSurface) return;
                    this.setMappingFragments([]);
                    return;
                }
                if (this.#surface !== nextSurface) return;
                this.setMappingFragments(indexFragment.references || []);
            } catch (error) {
                // A newer surface load has superseded this one — drop its (stale) failure state.
                if (this.#surface !== nextSurface) return;
                this.error.set('Failed to load offer mappings.');
                showToast('Failed to load offer mappings.', 'negative');
                this.setMappingFragments([]);
            } finally {
                // Only the still-current load resets shared loading state; a superseded one must not
                // clear the spinner the newer load turned on.
                if (this.#loadingSurface === nextSurface) {
                    this.#loadingSurface = '';
                }
                if (this.#surface === nextSurface) this.loading.set(false);
            }
        })();

        const wrappedPromise = loadPromise.finally(() => {
            if (this.#loadSurfacePromise === wrappedPromise) {
                this.#loadSurfacePromise = null;
            }
        });
        this.#loadSurfacePromise = wrappedPromise;
        return wrappedPromise;
    }

    setMappingFragments(references) {
        const currentRowsById = new Map(this.rows.get().map((rowStore) => [rowStore.value.id, rowStore]));
        const nextRows = [];

        for (const reference of references) {
            const fragment = new Fragment(reference);
            const record = normalizeMappingFragment(fragment);
            const existingStore = currentRowsById.get(fragment.id);
            if (existingStore) {
                existingStore.set({ ...existingStore.value, ...record });
                nextRows.push(existingStore);
            } else {
                nextRows.push(new ReactiveStore(record));
            }
        }

        this.rows.set(nextRows);
    }

    getRowStore(rowId) {
        return this.rows.get().find((rowStore) => rowStore.value.id === rowId) || null;
    }

    async createMapping({ sourceOffer = '', targetOffer = '', geos = [] } = {}) {
        let createdFragmentId = null;

        const created = await this.#runMutation(
            async () => {
                // Create the `offer-mapping` folder + index up front (the entry's parentPath must exist),
                // then the entry, then link it into the index.
                await this.#ensureIndexFragment();
                const fragmentName = await this.#resolveUniqueFragmentName(sourceOffer);
                const created = await this.aem.sites.cf.fragments.create({
                    name: fragmentName,
                    title: `${sourceOffer} → ${targetOffer}`.trim(),
                    description: '',
                    parentPath: this.#offerMappingPath,
                    modelId: this.#entryModelId,
                    fields: this.#buildEntryFields({ sourceOffer, targetOffer, geos }),
                });
                createdFragmentId = created.id;
                await this.#addPathsToIndex([created.path]);
            },
            'Offer mapping created.',
            'Failed to create offer mapping.',
            'positive',
        );
        if (!created) return null;
        return createdFragmentId;
    }

    async updateMapping(rowId, { sourceOffer, targetOffer, geos } = {}) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;

        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getById(rowId);
                const fields = structuredClone(fragment.fields);
                upsertField(fields, { name: 'sourceoffer', type: 'text', multiple: false, values: [`${sourceOffer ?? ''}`] });
                upsertField(fields, { name: 'targetoffer', type: 'text', multiple: false, values: [`${targetOffer ?? ''}`] });
                upsertField(fields, { name: 'geos', type: 'tag', multiple: true, values: geos || [] });

                await this.aem.sites.cf.fragments.save({
                    ...fragment,
                    title: `${sourceOffer ?? ''} → ${targetOffer ?? ''}`.trim(),
                    fields,
                });
            },
            'Offer mapping updated.',
            'Failed to update offer mapping.',
            'positive',
        );
    }

    async removeMapping(rowId) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        if (DELETE_BLOCKED_STATUSES.includes(row.status)) {
            showToast('Published or modified offer mappings cannot be deleted. Unpublish it first.', 'negative');
            return false;
        }

        return this.#runMutation(
            async () => {
                await this.#removePathsFromIndex([row.path]);
                const fragment = await this.aem.sites.cf.fragments.getById(rowId);
                await this.aem.sites.cf.fragments.delete(fragment);
            },
            'Offer mapping deleted.',
            'Failed to delete offer mapping.',
        );
    }

    async publishMapping(rowId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(rowId);
                await this.aem.sites.cf.fragments.publish(fragment);
                await this.#publishIndexFragment();
            },
            'Offer mapping has been successfully published.',
            'Failed to publish offer mapping.',
            'positive',
        );
    }

    async unpublishMapping(rowId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(rowId);
                await this.aem.sites.cf.fragments.unpublish(fragment);
            },
            'Offer mapping has been successfully unpublished.',
            'Failed to unpublish offer mapping.',
            'positive',
        );
    }

    destroy() {
        this.rows.set([]);
        this.loading.set(false);
        this.error.set(null);
        this.#surface = '';
        this.#loadingSurface = '';
        this.#loadSurfacePromise = null;
    }

    async #runMutation(operation, successMessage, errorMessage, successVariant = '') {
        this.loading.set(true);
        this.error.set(null);
        try {
            await operation();
            await this.loadSurface(this.#surface);
            showToast(successMessage, successVariant);
            return true;
        } catch (error) {
            this.error.set(errorMessage);
            showToast(errorMessage, 'negative');
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    #buildEntryFields({ sourceOffer, targetOffer, geos }) {
        return [
            { name: 'sourceoffer', type: 'text', multiple: false, values: [`${sourceOffer ?? ''}`] },
            { name: 'targetoffer', type: 'text', multiple: false, values: [`${targetOffer ?? ''}`] },
            { name: 'geos', type: 'tag', multiple: true, values: geos || [] },
        ];
    }

    // Ensures the `offer-mapping` folder + index fragment exist for the current surface (created and
    // published on demand — see #createIndexFragment). Used before the first entry is authored so its
    // parentPath resolves.
    async #ensureIndexFragment() {
        try {
            await this.aem.sites.cf.fragments.getByPath(this.#indexPath);
        } catch (error) {
            if (!INDEX_NOT_FOUND_MESSAGES.some((message) => error.message.includes(message))) {
                throw error;
            }
            await this.#createIndexFragment();
        }
    }

    async #addPathsToIndex(paths = []) {
        let indexData;
        try {
            indexData = await this.aem.sites.cf.fragments.getByPath(this.#indexPath);
        } catch (error) {
            if (!INDEX_NOT_FOUND_MESSAGES.some((message) => error.message.includes(message))) {
                throw error;
            }
            indexData = await this.#createIndexFragment();
        }
        const indexFragment = new Fragment(indexData);
        const entries = indexFragment.getFieldValues(INDEX_REFERENCES_FIELD);
        const nextEntries = [...entries];
        for (const path of paths) {
            if (nextEntries.includes(path)) continue;
            nextEntries.push(path);
        }
        if (nextEntries.length === entries.length) return;
        indexFragment.updateField(INDEX_REFERENCES_FIELD, nextEntries);
        await this.aem.sites.cf.fragments.save(indexFragment);
    }

    async #removePathsFromIndex(paths = []) {
        const indexFragment = new Fragment(await this.aem.sites.cf.fragments.getByPath(this.#indexPath));
        const entries = indexFragment.getFieldValues(INDEX_REFERENCES_FIELD);
        const nextEntries = entries.filter((entry) => !paths.includes(entry));
        if (nextEntries.length === entries.length) return;
        indexFragment.updateField(INDEX_REFERENCES_FIELD, nextEntries);
        await this.aem.sites.cf.fragments.save(indexFragment);
    }

    async #publishIndexFragment() {
        const indexFragment = await this.aem.sites.cf.fragments.getByPath(this.#indexPath);
        const indexWithEtag = await this.aem.sites.cf.fragments.getWithEtag(indexFragment.id);
        await this.aem.sites.cf.fragments.publish(indexWithEtag, []);
    }

    async #createIndexFragment(offerMappingPath = this.#offerMappingPath, indexPath = this.#indexPath) {
        const surfacePath = offerMappingPath.slice(0, offerMappingPath.lastIndexOf('/'));
        await this.aem.folders.create(surfacePath, 'offer-mapping', 'offer-mapping');
        await this.aem.wait(2000);
        let fragment;
        try {
            fragment = await this.aem.sites.cf.fragments.create({
                parentPath: offerMappingPath,
                modelId: OFFER_MAPPING_INDEX_MODEL_ID,
                name: 'index',
                title: 'Offer Mapping Index',
                description: '',
                fields: [{ name: 'entries', type: 'content-fragment', multiple: true, values: [] }],
            });
        } catch (error) {
            if (!`${error?.message || ''}`.includes('already exists')) throw error;
            return this.aem.sites.cf.fragments.getByPath(indexPath);
        }
        await this.aem.wait(2000);
        const withEtag = await this.aem.sites.cf.fragments.getWithEtag(fragment.id);
        await this.aem.sites.cf.fragments.publish(withEtag);
        return fragment;
    }

    #randomFragmentSuffix(length = FRAGMENT_SUFFIX_LENGTH) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let suffix = '';
        for (let index = 0; index < length; index += 1) {
            suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return suffix;
    }

    async #fragmentPathExists(path) {
        try {
            await this.aem.sites.cf.fragments.getByPath(path);
            return true;
        } catch (error) {
            if (INDEX_NOT_FOUND_MESSAGES.some((marker) => `${error?.message || ''}`.includes(marker))) {
                return false;
            }
            throw error;
        }
    }

    async #resolveUniqueFragmentName(sourceOffer) {
        const baseName = `mapping-${normalizeKey(`${sourceOffer || 'offer'}`) || 'offer'}`;
        let candidate = baseName;
        for (let attempt = 0; attempt <= FRAGMENT_NAME_COLLISION_LIMIT; attempt += 1) {
            const existingPath = `${this.#offerMappingPath}/${candidate}`;
            const exists = await this.#fragmentPathExists(existingPath);
            if (!exists) return candidate;
            candidate = `${baseName}-${this.#randomFragmentSuffix()}`;
        }
        throw new Error(`Unable to find available fragment name for ${baseName}`);
    }
}

const upsertField = (fields, field) => {
    const existingIndex = fields.findIndex((item) => item.name === field.name);
    if (existingIndex === -1) {
        fields.push(field);
        return;
    }
    fields[existingIndex] = { ...fields[existingIndex], ...field };
};
