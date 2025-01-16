export class ReactiveStore {
    value;
    /** @type {((value: any) => any)[]} */
    modifiers = [];
    #subscribers = [];
    /** @type {Record<string, any>} - Contains any relevant store additional data */
    #meta;

    /**
     * @param {any} initialValue
     * @param {(value: any) => any | ((value: any) => any)[]} modifiers
     */
    constructor(initialValue, modifiers) {
        if (modifiers)
            this.modifiers.push(
                ...(Array.isArray(modifiers) ? modifiers : [modifiers]),
            );
        this.value = this.modify(initialValue);
        this.#meta = {};
    }

    get() {
        return this.value;
    }

    set(value) {
        // If primitive and equal, no need to update; 'notify' can be used instead if needed
        if (this.value !== Object(this.value) && this.value === value) return;
        this.value = this.modify(value);
        this.notify();
    }

    /**
     * @param {(value: any) => any} fn
     */
    update(fn) {
        this.value = this.modify(fn(this.value));
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

    modify(value) {
        let modifiedValue = value;
        for (const modifier of this.modifiers) {
            modifiedValue = modifier(modifiedValue);
        }
        return modifiedValue;
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
