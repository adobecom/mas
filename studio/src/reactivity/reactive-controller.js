import { LitElement } from 'lit';
import { ReactiveStore } from './reactive-store.js';

/**
 * This controller monitors the stores and requests an update on the host whenever any of the stores change.
 */
export default class ReactiveController {
    host;
    stores;
    callback;

    /**
     *
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
            if (!store) continue;
            store.subscribe(this.requestUpdate);
        }
    }

    hostConnected() {
        this.#register();
    }

    #unregister() {
        for (const store of this.stores) {
            if (!store) continue;
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
