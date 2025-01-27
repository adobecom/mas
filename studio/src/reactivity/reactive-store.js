export class ReactiveStore {
    value;
    /** @type {(value: any) => any} */
    validator;
    #subscribers = [];
    /** @type {Record<string, any>} - Contains any relevant store additional data */
    #meta = {};

    /**
     * @param {any} initialValue
     * @param {(value: any) => any} validator
     */
    constructor(initialValue, validator) {
        this.validator = validator;
        this.value = this.validate(initialValue);
    }

    get() {
        return this.value;
    }

    set(value) {
        // If primitive and equal, no need to update; 'notify' can be used instead if needed
        if (this.value !== Object(this.value) && this.value === value) return;
        this.value = this.validate(value);
        this.notify();
    }

    /**
     * @param {(value: any) => any} fn
     */
    update(fn) {
        this.value = this.validate(fn(this.value));
        this.notify();
    }

    /**
     * @param {(value: any) => void} fn
     */
    subscribe(fn) {
        if (this.#subscribers.includes(fn)) return;
        this.#subscribers.push(fn);
        fn(this.value);
    }

    /**
     * @param {(value: any) => void} fn
     */
    unsubscribe(fn) {
        const indexOfFn = this.#subscribers.indexOf(fn);
        if (indexOfFn !== -1) this.#subscribers.splice(indexOfFn, 1);
    }

    notify() {
        for (const subscriber of this.#subscribers) {
            subscriber(this.value);
        }
    }

    validate(value) {
        if (this.validator) return this.validator(value);
        return value;
    }

    hasMeta(key) {
        return Object.hasOwn(this.#meta, key);
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
}
