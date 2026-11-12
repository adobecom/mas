import {
    CLASS_NAME_FAILED,
    CLASS_NAME_PENDING,
    CLASS_NAME_RESOLVED,
    EVENT_TYPE_FAILED,
    EVENT_TYPE_RESOLVED,
    STATE_FAILED,
    STATE_PENDING,
    STATE_RESOLVED,
} from './constants.js';
import { setImmediate, getService } from './utilities.js';
import { Log } from './log.js';
import { MasError } from './mas-error.js';

const StateClassName = {
    [STATE_FAILED]: CLASS_NAME_FAILED,
    [STATE_PENDING]: CLASS_NAME_PENDING,
    [STATE_RESOLVED]: CLASS_NAME_RESOLVED,
};

const StateEventType = {
    [STATE_FAILED]: EVENT_TYPE_FAILED,
    [STATE_RESOLVED]: EVENT_TYPE_RESOLVED,
};

export class MasElement {
    #service;
    changes = new Map();
    connected = false;
    error = undefined;
    log = Log.module('mas-element');
    options = undefined;
    promises = [];
    state = STATE_PENDING;
    timer = null;
    value = undefined;
    version = 0;
    wrapperElement;

    constructor(wrapperElement) {
        this.wrapperElement = wrapperElement;
    }

    update() {
        for (const [state, className] of Object.entries(StateClassName)) {
            this.wrapperElement.classList.toggle(
                className,
                state === this.state,
            );
        }
    }

    /**
     * Settles the `onceSettled` promises of a resolved or failed placeholder
     * and dispatches the event of its state.
     */
    notify() {
        const { error, state, wrapperElement } = this;
        if (state === STATE_RESOLVED || state === STATE_FAILED) {
            for (const { resolve, reject } of this.promises) {
                if (state === STATE_RESOLVED) resolve(wrapperElement);
                else reject(error);
            }
            this.promises = [];
        }
        wrapperElement.dispatchEvent(
            new CustomEvent(StateEventType[state], {
                bubbles: true,
                composed: true,
                detail:
                    error instanceof MasError
                        ? { message: error.message, ...error.context }
                        : error,
            }),
        );
    }

    /**
     * Adds name/value of the updated attribute to the `changes` map,
     * requests placeholder update.
     */
    attributeChangedCallback(name, _, value) {
        this.changes.set(name, value);
        // Initiate update of the placeholder
        this.requestUpdate();
    }

    /** Requests a forced update of the placeholder. */
    connectedCallback() {
        this.#service = getService();
        this.requestUpdate(true);
    }

    /** Logs the disconnection of a connected placeholder. */
    disconnectedCallback() {
        if (this.connected) {
            this.connected = false;
            this.log.debug('Disconnected:', { element: this.wrapperElement });
        }
    }

    /**
     * Returns a promise resolving to this placeholder
     * when its value is resolved or rejected.
     * If placeholder is not pending for completion of an async operation
     * the returned promise is already resolved or rejected.
     */
    onceSettled() {
        const { error, promises, state } = this;
        if (STATE_RESOLVED === state)
            return Promise.resolve(this.wrapperElement);
        if (STATE_FAILED === state) return Promise.reject(error);
        return new Promise((resolve, reject) => {
            promises.push({ resolve, reject });
        });
    }

    /**
     * Sets component state to "RESOLVED".
     * Updates its class list and stored value, notifies observers and fires "RESOLVED" event.
     */
    toggleResolved(version, value, options) {
        // skip obsolete asyncs
        if (version !== this.version) return false;
        if (options !== undefined) this.options = options;
        this.state = STATE_RESOLVED;
        this.value = value;
        this.update();
        this.log.debug('Resolved:', { element: this.wrapperElement, value });
        // Allow calling code to perform sync updates of this element
        // before notifying observers about state change
        setImmediate(() => this.notify());
        return true;
    }

    /**
     * Sets component state to "FAILED".
     * Updates its class list and stored error, notifies observers and fires "FAILED" event.
     */
    toggleFailed(version, error, options) {
        // Skip obsolete asyncs
        if (version !== this.version) return false;
        if (options !== undefined) this.options = options;
        this.error = error;
        this.state = STATE_FAILED;
        this.update();
        const wcName = this.wrapperElement.getAttribute('is');
        this.log.error(`${wcName}: Failed to render: ${error.message}`, {
            element: this.wrapperElement,
            ...error.context,
            ...this.#service?.duration,
        });
        setImmediate(() => this.notify());
        return true;
    }

    /**
     * Sets component state to "PENDING".
     * Increments its version, updates CSS classes, notifies observers and fires "PENDING" event.
     */
    togglePending(options) {
        this.version++;
        if (options) this.options = options;
        this.state = STATE_PENDING;
        this.update();
        this.log.debug('Pending:', {
            osi: this.wrapperElement.options?.wcsOsi,
        });
        return this.version;
    }

    /**
     * Queues task to update this component.
     * Skips rendering if update is not forced and no changes were accumulated since the previous update.
     * Calls `render` method to perform the update.
     * Restores previous state of the component if the `render` method returned `false`.
     */
    requestUpdate(force = false) {
        if (!this.wrapperElement.isConnected || !getService()) return;
        // Batch consecutive updates
        if (this.timer) return;
        // Save current state to restore it if needed
        const { error, options, state, value, version } = this;
        // Inform `onceSettled` that `render` can follow soon
        this.state = STATE_PENDING;
        this.timer = setImmediate(async () => {
            this.timer = null;
            let changes = null;
            // Gather list of changes triggered the update
            if (this.changes.size) {
                changes = Object.fromEntries(this.changes);
                this.changes.clear();
            }
            this.log.debug(this.connected ? 'Updated:' : 'Connected:', {
                element: this.wrapperElement,
                changes,
            });
            this.connected = true;
            if (changes || force) {
                try {
                    const result = await this.wrapperElement.render?.();
                    // Restore previous state if `render` has returned `false`
                    if (
                        result === false &&
                        this.state === STATE_PENDING &&
                        this.version === version
                    ) {
                        this.state = state;
                        this.error = error;
                        this.value = value;
                        // Update CSS and notify observers/listeners
                        this.update();
                        this.notify();
                    }
                } catch (error) {
                    this.toggleFailed(this.version, error, options);
                }
            }
        });
    }
}

/**
 * Deletes the null, undefined and empty (string or array) values of `dataset`.
 * Returns `dataset` object.
 */
function cleanupDataset(dataset = {}) {
    for (const [key, value] of Object.entries(dataset)) {
        if (value == null || value.length === 0) delete dataset[key];
    }
    return dataset;
}

/**
 * Returns custom HTML element constructed by the `Class` argument.
 * Populates element dataset from `dataset` object, omitting empty values.
 */
export function createMasElement(Class, dataset = {}) {
    const { tag, is } = Class;
    // Create custom DOM element
    const element = document.createElement(tag, { is });
    element.setAttribute('is', is);
    Object.assign(element.dataset, cleanupDataset(dataset));
    return element;
}

/**
 * Updates element dataset from `dataset` object, omitting empty values.
 * @param {HTMLElement} element
 * @param {Record<string, any>} dataset
 */
export function updateMasElement(element, dataset = {}) {
    if (element instanceof HTMLElement) {
        Object.assign(element.dataset, cleanupDataset(dataset));
        return element;
    }
    return null;
}
