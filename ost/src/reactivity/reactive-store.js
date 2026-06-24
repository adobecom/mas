// Copied from studio/src/reactivity/reactive-store.js to keep the new OST in
// the same reactive pattern as Studio without crossing the npm workspace
// boundary. Promotion to a shared package is tracked in MWPW-195989.
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

    /**
     * Store setter by value or an update function
     * @param {any | (value: any) => any} value
     */
    set(value) {
        let newValue = value;
        if (typeof value === 'function') newValue = value(this.value);
        newValue = this.validate(newValue);
        if (this.value !== Object(this.value) && this.value === newValue) return;
        let oldValue;
        try {
            oldValue = structuredClone(this.value);
        } catch {
            oldValue = this.value;
        }
        this.value = newValue;
        this.notify(oldValue);
    }

    /**
     * @param {(value: any, oldValue: any) => void} fn
     */
    subscribe(fn) {
        if (this.#subscribers.includes(fn)) return;
        this.#subscribers.push(fn);
        fn(this.value, this.value);
    }

    /**
     * @param {(value: any, oldValue: any) => void} fn
     */
    unsubscribe(fn) {
        const indexOfFn = this.#subscribers.indexOf(fn);
        if (indexOfFn !== -1) this.#subscribers.splice(indexOfFn, 1);
    }

    notify(oldValue) {
        for (const subscriber of this.#subscribers) {
            subscriber(this.value, oldValue);
        }
    }

    validate(value) {
        if (this.validator) return this.validator(value);
        return value;
    }

    /**
     * @param {(value: any) => any} validator
     */
    registerValidator(validator) {
        this.validator = validator;
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

    toString() {
        return this.value;
    }

    /**
     * @param {any} value
     * @returns {boolean}
     */
    equals(value) {
        return this.value === value;
    }
}
