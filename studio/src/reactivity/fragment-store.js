import { COLLECTION_MODEL_PATH } from '../constants.js';
import { ReactiveStore } from './reactive-store.js';

export class FragmentStore extends ReactiveStore {
    static ESSENTIAL_PROPS = [
        'path',
        'id',
        'etag',
        'model',
        'title',
        'description',
        'status',
        'created',
        'modified',
        'published',
        'tags',
        'references',
    ];

    static essentialPropsCache = new Map();

    loading = false;
    #refreshDebounceTimer = null;
    #storedEssentialProps = {};

    captureEssentialProps(source) {
        const fragmentId = source?.id;
        if (!fragmentId) return;

        const cachedProps = FragmentStore.essentialPropsCache.get(fragmentId) || {};

        for (const prop of FragmentStore.ESSENTIAL_PROPS) {
            if (source && prop in source && source[prop] !== undefined) {
                this.#storedEssentialProps[prop] = source[prop];
                cachedProps[prop] = source[prop];
            } else if (cachedProps[prop] !== undefined) {
                this.#storedEssentialProps[prop] = cachedProps[prop];
            }
        }

        FragmentStore.essentialPropsCache.set(fragmentId, cachedProps);
    }

    restoreEssentialProps() {
        for (const prop of FragmentStore.ESSENTIAL_PROPS) {
            if (prop in this.#storedEssentialProps && (this.value[prop] === undefined || this.value[prop] === null)) {
                this.value[prop] = this.#storedEssentialProps[prop];
            }
        }
    }

    getStoredEssentialProp(prop) {
        return this.#storedEssentialProps[prop];
    }

    set(value) {
        super.set(value);
        this.refreshAemFragment();
    }

    get id() {
        return this.value.id;
    }

    setLoading(loading = false) {
        this.loading = loading;
        this.notify();
    }

    updateField(name, value) {
        this.value.updateField(name, value);
        this.notify();
        this.refreshAemFragment();
    }

    updateFieldInternal(name, value) {
        this.value.updateFieldInternal(name, value);
        this.notify();
        this.refreshAemFragment();
    }

    refreshFrom(value) {
        this.value.refreshFrom(value);
        this.notify();
    }

    discardChanges() {
        this.value.discardChanges();
        this.notify();
        this.refreshAemFragment();
    }

    resetFieldToParent(fieldName, parentValues = []) {
        const success = this.value.resetFieldToParent(fieldName);
        if (success) {
            this.notify();
            this.refreshAemFragment();
        }
        return success;
    }

    refreshAemFragment() {
        clearTimeout(this.#refreshDebounceTimer);
        this.#refreshDebounceTimer = setTimeout(() => {
            document.querySelector(`aem-fragment[fragment="${this.value.id}"]`)?.refresh(false);
        }, 100);
    }

    get isCollection() {
        return this.value?.model?.path === COLLECTION_MODEL_PATH;
    }
}
