// Copied from studio/src/reactivity/reactive-controller.js — see
// reactive-store.js header for the rationale.
import { LitElement } from 'lit';
import { ReactiveStore } from './reactive-store.js';

/**
 * Monitors multiple stores and requests an update on the host when any change.
 */
export default class ReactiveController {
    host;
    stores;
    callback;

    /**
     * @param {LitElement} host
     * @param {ReactiveStore[]} stores
     */
    constructor(host, stores = [], callback) {
        this.stores = stores;
        this.callback = callback;
        this.requestUpdate = this.requestUpdate.bind(this);
        (this.host = host).addController(this);
    }

    requestUpdate() {
        this.host.requestUpdate();
        if (this.callback) {
            const callback = this.callback.bind(this.host);
            callback();
        }
    }

    #register() {
        for (const store of this.stores) {
            store.subscribe(this.requestUpdate);
        }
    }

    hostConnected() {
        this.#register();
    }

    #unregister() {
        for (const store of this.stores) {
            store.unsubscribe(this.requestUpdate);
        }
    }

    hostDisconnected() {
        this.#unregister();
    }

    updateStores(stores) {
        this.#unregister();
        this.stores = stores;
        this.#register();
    }
}
