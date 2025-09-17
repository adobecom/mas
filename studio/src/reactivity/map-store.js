import { ReactiveStore } from './reactive-store.js';

export class MapStore extends ReactiveStore {
    keyProp;
    #additionSubscribers = [];

    /**
     * @param {Array} initialValue
     * @param {(value: any) => any} validator
     * @param {string} keyProp
     */
    constructor(initialValue, validator, keyProp = 'id') {
        super(new Map(), validator);
        this.keyProp = keyProp;
        if (initialValue) {
            for (const item in initialValue) {
                this.value.set(item[this.keyProp], item);
            }
        }
    }

    get(key) {
        if (!key) return super.get();
        return this.value.get(key);
    }

    has(key) {
        return this.value.has(key);
    }

    add(values) {
        const internalValues = Array.isArray(values) ? values : [values];
        for (const item of internalValues) {
            this.value.set(item[this.keyProp], item);
        }
        this.notify();
        this.notifyAddition(internalValues);
    }

    remove(key) {
        this.value.delete(key);
        this.notify();
    }

    clear() {
        this.value.clear();
        this.notify();
    }

    /**
     * @param {(value: any, oldValue: any) => void} fn
     */
    subscribeToAddition(fn) {
        if (this.#additionSubscribers.includes(fn)) return;
        this.#additionSubscribers.push(fn);
    }

    /**
     * @param {(value: any, oldValue: any) => void} fn
     */
    unsubscribeFromAddition(fn) {
        const indexOfFn = this.#additionSubscribers.indexOf(fn);
        if (indexOfFn !== -1) this.#additionSubscribers.splice(indexOfFn, 1);
    }

    notifyAddition(values) {
        for (const subscriber of this.#additionSubscribers) {
            subscriber(values);
        }
    }
}
