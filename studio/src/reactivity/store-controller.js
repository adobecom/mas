import { LitElement } from 'lit';
import { ReactiveStore } from './reactive-store.js';

export default class StoreController {
    host;
    store;

    value;

    /**
     * @param {LitElement} host
     * @param {ReactiveStore} store
     */
    constructor(host, store) {
        this.store = store;
        this.value = store.get();
        this.updateValue = this.updateValue.bind(this);
        (this.host = host).addController(this);
    }

    hostConnected() {
        this.store.subscribe(this.updateValue);
    }

    hostDisconnected() {
        this.store.unsubscribe(this.updateValue);
    }

    updateValue(newValue) {
        this.value = newValue;
        this.host.requestUpdate();
    }
}
