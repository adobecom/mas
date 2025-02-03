import { LitElement } from 'lit';
import { ReactiveStore } from './reactive-store.js';

/**
 * This controllers only tracks the stores and request an update on the host when any of the stores change.
 */
export default class ReactiveController {
    host;
    stores;

    /**
     *
     * @param {LitElement} host
     * @param {ReactiveStore[]} stores
     */
    constructor(host, stores) {
        this.stores = stores;
        this.requestUpdate = this.requestUpdate.bind(this);
        (this.host = host).addController(this);
    }

    requestUpdate() {
        this.host.requestUpdate();
    }

    hostConnected() {
        for (const store of this.stores) {
            store.subscribe(this.requestUpdate);
        }
    }

    hostDisconnected() {
        for (const store of this.stores) {
            store.unsubscribe(this.requestUpdate);
        }
    }
}
