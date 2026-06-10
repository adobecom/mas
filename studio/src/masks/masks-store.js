import { AEM } from '../aem/aem.js';
import { Fragment } from '../aem/fragment.js';
import { CARD_MODEL_PATH, MAS_MASKS_PREFIX, MASKS_FOLDER, ROOT_PATH, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { ReactiveStore } from '../reactivity/reactive-store.js';
import { showToast, normalizeKey } from '../utils.js';

const CARD_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'];
const FOLDER_NOT_FOUND_MESSAGES = ['404', 'not found', 'Fragment not found'];

/**
 * Per-surface/locale holder for "masks": plain card fragments stored under
 * `<surface>/<locale>/masks`, each tagged in the masks namespace with a tag whose node name
 * equals the fragment node name (the identifier the io `mask` param resolves by path).
 */
export class MasksStore {
    list = new ReactiveStore([]);
    loading = new ReactiveStore(false);
    error = new ReactiveStore(null);
    fragmentId = new ReactiveStore(null);
    creating = new ReactiveStore(false);
    editing = new ReactiveStore(null);
    // Mask node name reflected in the URL (`maskName`) for deep-linking the editor.
    editingName = new ReactiveStore('');

    bucket = '';
    baseUrl = '';
    aem = null;

    #surface = '';
    #locale = '';
    #loadingKey = '';
    #loadPromise = null;

    constructor(bucket = '', baseUrl = '') {
        this.bucket = bucket;
        this.baseUrl = baseUrl;
    }

    get surface() {
        return this.#surface;
    }

    get locale() {
        return this.#locale;
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

    folderPath(surface = this.#surface, locale = this.#locale) {
        return `${ROOT_PATH}/${surface}/${locale}/${MASKS_FOLDER}`;
    }

    /** Tag id whose leaf equals the mask fragment node name; the io `mask` param resolves it by path. */
    maskTagId(name, surface = this.#surface) {
        return `${MAS_MASKS_PREFIX}${surface}/${normalizeKey(name)}`;
    }

    async ensureLoaded(surface, locale) {
        const key = `${surface || ''}:${locale || ''}`;
        if (key === this.#loadingKey && this.#loadPromise) return this.#loadPromise;
        return this.loadSurface(surface, locale);
    }

    async loadSurface(surface, locale) {
        this.#surface = surface || '';
        this.#locale = locale || '';
        if (!this.#surface || !this.#locale || !this.aem) {
            this.#loadingKey = '';
            this.list.set([]);
            return;
        }
        this.#loadingKey = `${this.#surface}:${this.#locale}`;
        this.loading.set(true);
        this.error.set(null);
        this.#loadPromise = (async () => {
            try {
                const fragments = [];
                for await (const batch of this.aem.sites.cf.fragments.search(
                    { path: this.folderPath(), modelIds: [CARD_MODEL_ID] },
                    50,
                )) {
                    fragments.push(...batch);
                }
                this.list.set(fragments.map((data) => new Fragment(data)));
            } catch (error) {
                this.error.set('Failed to load masks.');
                showToast('Failed to load masks.', 'negative');
                this.list.set([]);
            } finally {
                this.loading.set(false);
            }
        })();
        return this.#loadPromise;
    }

    async #ensureFolder() {
        try {
            await this.aem.folders.create(`${ROOT_PATH}/${this.#surface}/${this.#locale}`, MASKS_FOLDER, MASKS_FOLDER);
            await this.aem.wait(1000);
        } catch (error) {
            if (!`${error?.message || ''}`.includes('already exists')) throw error;
        }
    }

    /**
     * Creates a mask card fragment and assigns its identifying masks-namespace tag.
     * @returns {Promise<string|null>} the created fragment id, or null on failure.
     */
    async createMask({ name, title, description = '', fields = [] }) {
        const fragmentName = normalizeKey(name);
        this.loading.set(true);
        this.error.set(null);
        try {
            await this.#ensureFolder();
            const created = await this.aem.sites.cf.fragments.create({
                name: fragmentName,
                title: title || name,
                description,
                parentPath: this.folderPath(),
                modelId: CARD_MODEL_ID,
                fields,
            });
            const latest = await this.aem.sites.cf.fragments.getById(created.id);
            latest.newTags = [this.maskTagId(fragmentName)];
            await this.aem.saveTags(latest);
            await this.loadSurface(this.#surface, this.#locale);
            showToast('Mask created.', 'positive');
            return created.id;
        } catch (error) {
            this.error.set('Failed to create mask.');
            showToast('Failed to create mask.', 'negative');
            return null;
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Persists field edits to an existing mask. Saves directly (not via repository.saveFragment,
     * which requires an offer/osi for card fragments — masks have none).
     */
    async saveMask(fragment) {
        this.loading.set(true);
        this.error.set(null);
        try {
            if (fragment.model?.path && fragment.model.path !== CARD_MODEL_PATH) {
                throw new Error('Masks must use the card model.');
            }
            const saved = await this.aem.sites.cf.fragments.save(fragment);
            await this.loadSurface(this.#surface, this.#locale);
            showToast('Mask saved.', 'positive');
            return saved;
        } catch (error) {
            this.error.set('Failed to save mask.');
            showToast('Failed to save mask.', 'negative');
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    /** Resolves a mask fragment by its node name under <surface>/<locale>/masks (used for deep-links). */
    async loadMaskByName(name, surface, locale) {
        if (!this.aem || !name || !surface || !locale) return null;
        const path = `${ROOT_PATH}/${surface}/${locale}/${MASKS_FOLDER}/${name}`;
        try {
            return new Fragment(await this.aem.sites.cf.fragments.getByPath(path));
        } catch (error) {
            return null;
        }
    }

    async publishMask(id) {
        this.loading.set(true);
        this.error.set(null);
        try {
            const fragment = await this.aem.sites.cf.fragments.getWithEtag(id);
            await this.aem.sites.cf.fragments.publish(fragment);
            const fresh = await this.aem.sites.cf.fragments.getById(id);
            showToast('Mask published.', 'positive');
            return fresh;
        } catch (error) {
            this.error.set('Failed to publish mask.');
            showToast('Failed to publish mask.', 'negative');
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteMask(id) {
        this.loading.set(true);
        this.error.set(null);
        try {
            const fragment = await this.aem.sites.cf.fragments.getById(id);
            await this.aem.sites.cf.fragments.delete(fragment);
            await this.loadSurface(this.#surface, this.#locale);
            showToast('Mask deleted.', 'positive');
            return true;
        } catch (error) {
            this.error.set('Failed to delete mask.');
            showToast('Failed to delete mask.', 'negative');
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    destroy() {
        this.list.set([]);
        this.loading.set(false);
        this.error.set(null);
        this.fragmentId.set(null);
        this.creating.set(false);
        this.editing.set(null);
        this.editingName.set('');
        this.#surface = '';
        this.#locale = '';
        this.#loadingKey = '';
        this.#loadPromise = null;
    }
}
