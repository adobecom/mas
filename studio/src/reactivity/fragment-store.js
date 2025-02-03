import { debounce } from '../utils.js';
import { ReactiveStore } from './reactive-store.js';

export class FragmentStore extends ReactiveStore {
    loading = false;

    constructor(value) {
        super(value);
        this.refreshAemFragment = debounce(
            this.refreshAemFragment.bind(this),
            50,
        );
    }

    set(value) {
        super.set(value);
        this.refreshAemFragment();
    }

    setLoading(loading = false) {
        this.loading = loading;
        this.notify();
    }

    update(fn) {
        super.update(fn);
        this.refreshAemFragment();
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
        this.refreshAemFragment();
    }

    discardChanges() {
        if (!this.value) return;
        this.value.discardChanges();
        this.notify();
        this.refreshAemFragment();
    }

    refreshAemFragment() {
        if (!this.value) return;
        document
            .querySelector(`aem-fragment[fragment="${this.value.id}"]`)
            ?.refresh(false);
    }
}
