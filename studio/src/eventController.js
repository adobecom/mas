import { LitElement } from 'lit';
import MasEvent from './masEvent.js';

export default class EventController {
    host;
    event;
    handler;

    /**
     *
     * @param {LitElement} host
     * @param {MasEvent} event
     * @param {Function} handler
     */
    constructor(host, event, handler) {
        this.event = event;
        this.handler = handler;
        (this.host = host).addController(this);
    }

    hostConnected() {
        this.event.subscribe(this.handler);
    }

    hostDisconnected() {
        this.event.unsubscribe(this.handler);
    }
}
