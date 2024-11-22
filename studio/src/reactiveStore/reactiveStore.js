export class ReactiveStore {
    #value;
    #subscribers = [];

    constructor(initialValue) {
        this.#value = initialValue;
    }

    get() {
        return this.#value;
    }

    set(value) {
        this.#value = value;
        this.#notify();
    }

    update(fn) {
        this.#value = fn(this.#value);
        this.#notify();
    }

    subscribe(fn) {
        if (this.#subscribers.includes(fn)) return;
        this.#subscribers.push(fn);
    }

    unsubscribe(fn) {
        const indexOfFn = this.#subscribers.indexOf(fn);
        if (indexOfFn !== -1) this.#subscribers.splice(indexOfFn, 1);
    }

    #notify() {
        for (const subscriber of this.#subscribers) {
            subscriber(this.#value);
        }
    }
}

export function reactiveStore(initialValue) {
    return new ReactiveStore(initialValue);
}
