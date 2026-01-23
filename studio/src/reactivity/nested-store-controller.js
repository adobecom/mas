import { ReactiveStore } from './reactive-store.js';

/**
 * Controller for nested ReactiveStore subscriptions.
 * Subscribes to both the outer store and the inner store it contains.
 * Useful when Store.x holds a ReactiveStore, and you need to react to changes in both.
 */
export default class NestedStoreController {
    host;
    outerStore;
    #innerStore = null;
    #boundUpdate;

    /**
     * @param {import('lit').LitElement} host
     * @param {ReactiveStore} outerStore - Store that contains another ReactiveStore as its value
     */
    constructor(host, outerStore) {
        this.outerStore = outerStore;
        this.#boundUpdate = this.#requestUpdate.bind(this);
        (this.host = host).addController(this);
    }

    get value() {
        return this.#innerStore?.get() ?? null;
    }

    hostConnected() {
        this.outerStore.subscribe(this.#onOuterChange);
    }

    hostDisconnected() {
        this.outerStore.unsubscribe(this.#onOuterChange);
        this.#unsubscribeInner();
    }

    #onOuterChange = (newInnerStore) => {
        if (newInnerStore === this.#innerStore) return;
        this.#unsubscribeInner();
        this.#innerStore = newInnerStore;
        if (this.#innerStore) {
            this.#innerStore.subscribe(this.#boundUpdate);
        }
        this.host.requestUpdate();
    };

    #unsubscribeInner() {
        if (this.#innerStore) {
            this.#innerStore.unsubscribe(this.#boundUpdate);
            this.#innerStore = null;
        }
    }

    #requestUpdate() {
        this.host.requestUpdate();
    }
}
