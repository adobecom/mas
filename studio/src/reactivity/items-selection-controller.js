import { LitElement } from 'lit';
import { getItemsSelectionStore } from '../common/items-selection-store.js';

/**
 * Captures the active items-selection-store slice at hostConnected, so consumers
 * read the slice that was active when they connected instead of racing a live
 * read of the mutable global against ancestors-first disconnectedCallback teardown.
 */
export default class ItemsSelectionController {
    host;
    value;

    /**
     * @param {LitElement} host
     * @param {{ allowUnset?: boolean }} [options]
     */
    constructor(host, { allowUnset = false } = {}) {
        this.allowUnset = allowUnset;
        this.value = null;
        (this.host = host).addController(this);
    }

    hostConnected() {
        // Capture on connect: fields initialized in the constructor can
        // predate the owning editor's push, so the value isn't ready until here.
        this.value = getItemsSelectionStore({ allowUnset: this.allowUnset });
    }

    // Deliberately does NOT clear on hostDisconnected -- teardown code in the
    // host must still see the store it was bound to.
}
