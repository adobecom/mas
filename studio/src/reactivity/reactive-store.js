export class ReactiveStore {
    value;
    #subscribers = [];
    /** @type {Record<string, any>} - Contains any relevant store additional data */
    #meta;

    constructor(initialValue) {
        this.value = initialValue;
        this.#meta = {};
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

    equals(value) {
        return this.value === value;
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

    getMeta(key) {
        return this.#meta[key] || null;
    }

    setMeta(key, value) {
        this.#meta[key] = value;
    }

    removeMeta(key) {
        delete this.#meta[key];
    }

    toString() {
        return this.value;
    }
}

export function reactiveStore(initialValue) {
    return new ReactiveStore(initialValue);
}
