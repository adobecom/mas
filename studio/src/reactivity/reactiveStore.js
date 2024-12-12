export class ReactiveStore {
    value;
    #subscribers = [];

    constructor(initialValue) {
        this.value = initialValue;
    }

    get() {
        return this.value;
    }

    set(value) {
        // If primitive and equal, no need to update; 'notify' can be used instead if needed
        if (this.value !== Object(this.value) && this.value === value) return;
        this.value = value;
        this.notify();
    }

    update(fn) {
        this.value = fn(this.value);
        this.notify();
    }

    subscribe(fn) {
        if (this.#subscribers.includes(fn)) return;
        this.#subscribers.push(fn);
        fn(this.value);
    }

    unsubscribe(fn) {
        const indexOfFn = this.#subscribers.indexOf(fn);
        if (indexOfFn !== -1) this.#subscribers.splice(indexOfFn, 1);
    }

    notify() {
        for (const subscriber of this.#subscribers) {
            subscriber(this.value);
        }
    }
}

export function reactiveStore(initialValue) {
    return new ReactiveStore(initialValue);
}

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
