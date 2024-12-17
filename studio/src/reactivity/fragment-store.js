import { ReactiveStore } from './reactive-store.js';

export class FragmentStore extends ReactiveStore {
    set(value) {
        super.set(value);
        this.refreshAemFragment();
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
        this.value.discardChanges();
        this.notify();
        this.refreshAemFragment();
    }

    refreshAemFragment() {
        document
            .querySelector(`aem-fragment[fragment="${this.value.id}"]`)
            ?.refresh(false);
    }
}
