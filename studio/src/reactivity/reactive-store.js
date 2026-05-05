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
        // If primitive and equal, no need to update; 'notify' can be used instead if needed
        if (this.value !== Object(this.value) && this.value === newValue) return;
        const oldValue = structuredClone(this.value);
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

    // #region Meta

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

    // #endregion

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
