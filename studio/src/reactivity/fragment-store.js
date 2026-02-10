import { COLLECTION_MODEL_PATH } from '../constants.js';
import { ReactiveStore } from './reactive-store.js';

export class FragmentStore extends ReactiveStore {
    loading = false;
    #refreshDebounceTimer = null;

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

    /**
     * Updates a field's values.
     * For variations: pass parentFragment to auto-reset to inherited when values match parent.
     * @param {string} name - The field name to update
     * @param {Array} value - The new values
     * @param {Fragment|null} [parentFragment] - The parent fragment (for variations)
     * @returns {boolean|'reset'} - true if updated, false if no change, 'reset' if reset to parent
     */
    updateField(name, value, parentFragment = null) {
        const result = this.value.updateField(name, value, parentFragment);
        if (result) {
            this.notify();
            this.refreshAemFragment();
        }
        return result;
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
