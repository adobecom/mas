import { COLLECTION_MODEL_PATH } from '../constants.js';
import { ReactiveStore } from './reactive-store.js';

export class FragmentStore extends ReactiveStore {
    loading = false;

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

    refreshAemFragment() {
        document.querySelector(`aem-fragment[fragment="${this.value.id}"]`)?.refresh(false);
    }

    get isCollection() {
        return this.value?.model?.path === COLLECTION_MODEL_PATH;
    }
}
