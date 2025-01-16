import { getHashParam, getHashParams, setHashParams } from '../utils.js';
import { ReactiveStore } from './reactive-store.js';

/** TODO Implement typed params (Number, Date, Array, etc.) */

export class HashLinkedStore extends ReactiveStore {
    #params;
    #isPrimitive = false;

    /**
     * @param {string | string[]} params A list of hash parameters that will be be synched with this store's value
     * @param {any} initialValue
     * @param {(value: any) => any | ((value: any) => any)[]} modifiers
     */
    constructor(params, initialValue, modifiers) {
        super(initialValue, modifiers);
        if (!Array.isArray(params)) {
            this.#isPrimitive = true;
            this.#params = [params];
            if (!this.value) {
                const hashValue = getHashParam(params);
                if (hashValue) this.value = this.modify(hashValue);
            }
        } else {
            this.#params = Array.from(params);
            const hashValue = {};
            for (const param of this.#params) {
                if (this.value && this.value[param]) {
                    hashValue[param] = this.value[param];
                    continue;
                }
                const paramHashValue = getHashParam(param);
                hashValue[param] = paramHashValue || '';
            }
            this.value = this.modify(hashValue);
        }
        this.#writeHash();
        window.addEventListener('hashchange', this.#readHash.bind(this));
    }

    set(value) {
        super.set(value);
        this.#writeHash();
    }

    update(fn) {
        super.update(fn);
        this.#writeHash();
    }

    #readHash() {
        let hasChanges = false;
        if (this.#isPrimitive) {
            const hashValue = getHashParam(this.#params[0]);
            if (hashValue !== this.value) {
                hasChanges = true;
                this.value = this.modify(hashValue);
            }
        } else {
            const hashValue = {};
            for (const param of this.#params) {
                hashValue[param] = getHashParam(param);
                if (hashValue[param] !== this.value[param]) {
                    hasChanges = true;
                }
            }
            this.value = this.modify(hashValue);
        }
        if (hasChanges) this.notify();
    }

    #writeHash() {
        const params = getHashParams();
        const value = this.#isPrimitive
            ? { [this.#params[0]]: this.value }
            : this.value;
        setHashParams(params, value);
        window.location.hash = params.toString();
    }
}
