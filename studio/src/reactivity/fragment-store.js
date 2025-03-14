import { ReactiveStore } from './reactive-store.js';

export class FragmentStore extends ReactiveStore {
    loading = false;

    set(value) {
        super.set(value);
        this.notify();
    }

    setLoading(loading = false) {
        this.loading = loading;
        this.notify();
    }

    updateField(name, value) {
        this.value.updateField(name, value);
        this.notify();
    }

    updateFieldInternal(name, value) {
        this.value.updateFieldInternal(name, value);
        this.notify();
    }

    refreshFrom(value) {
        this.value.refreshFrom(value);
        this.notify();
    }

    discardChanges() {
        if (!this.value) return;
        this.value.discardChanges();
        this.notify();
    }
}
