import {
    dispatchAsyncEvent,
    makeCssClassName,
    makeEventTypeName,
} from './utils.js';

const FAILED = 'failed';
const PENDING = 'pending';
const RESOLVED = 'resolved';

/**
 * Notifies observers about results of asynchronous operations that
 * can be performed by a component from time to time.
 * An async component can be in one of these states:
 * - `pending` - the component is waiting for the async operation to complete;
 * - `resolved` - the async operation has completed successfully;
 * - `failed` - the async operation has failed.
 * This helper toggles state-reflecting CSS classes and emits state events,
 * prefixed for distinguity between various component types.
 */
export class AsyncControl {
    /**
     * The latest value or error collected from a controlled async operation.
     * @type {Commerce.EventDetail}
     */
    #detail = {};
    /**
     * Control options.
     * @type {{
     *  cssClassNames?: Record<string, string>;
     *  eventOptions?: EventInit;
     *  eventTypeNames?: Record<string, string>;
     * }}
     */
    #options = {};
    /**
     * Current state.
     * @type {string}
     */
    #state;
    /**
     * The controlled web component.
     */
    #target;

    /**
     * Creates a new instance of control, pending for an async operation.
     * @param {Element} target - Target element to control.
     * @param {{
     *  cssPrefix?: string;
     *  eventOptions?: EventInit;
     *  eventPrefix?: string;
     * }} options - Notification options:
     * - `cssPrefix`: prepended to the state CSS class names, toggled on the controlled component;
     * - `eventOptions`: settings for custom events, dispatched by this control;
     * - `eventPrefix`: prepended to the state event names, dispatched on the controlled component.
     */
    constructor(target, { cssPrefix, eventOptions = {}, eventPrefix } = {}) {
        this.#target = target;
        const options = this.#options;
        options.cssClassNames = {};
        options.eventOptions = eventOptions;
        options.eventTypeNames = {};
        for (const state of [FAILED, PENDING, RESOLVED]) {
            options.cssClassNames[state] = makeCssClassName(cssPrefix, state);
            options.eventTypeNames[state] = makeEventTypeName(
                eventPrefix,
                state
            );
        }
        this.init();
    }

    /**
     * Notifies observers about current state of the component by
     * setting CSS state class and dispatching event.
     */
    #notify() {
        const [
            detail,
            { cssClassNames, eventOptions, eventTypeNames },
            state,
            target,
        ] = [this.#detail, this.#options, this.#state, this.#target];
        [FAILED, PENDING, RESOLVED].forEach((key) => {
            target.classList.toggle(cssClassNames[key], key === state);
        });
        dispatchAsyncEvent(target, eventTypeNames[state], {
            ...eventOptions,
            detail,
        });
    }

    /**
     * Gets the latest rejection error.
     * @returns {Error | undefined}
     */
    get error() {
        return this.#detail.error;
    }

    get options() {
        return this.#options;
    }

    /**
     * Returns the promise pending for completion of the currently active async operation.
     * If no operation is active at the moment, returns settled promise.
     * @returns {Promise}
     */
    get promise() {
        return new Promise((resolve, reject) => {
            this.subscribe(resolve, reject);
        });
    }

    /**
     * Returns the current state of the object.
     * @returns {string}
     */
    get state() {
        return this.#state;
    }

    /**
     * Signals start of a new asynchronous operation.
     * @return `false` if this control is already in "pending" state, otherwise `true`.
     */
    init() {
        if (this.#state !== PENDING) {
            this.#state = PENDING;
            this.#notify();
            return true;
        }
        return false;
    }

    /**
     * Signals success of an asynchronous operation and stores its `value`.
     * @param {Error} error
     * @return `false` if this control is not in "pending" state, otherwise `true`.
     */
    reject(error) {
        if (this.#state !== PENDING) return false;
        this.#detail.error = error;
        this.#state = FAILED;
        this.#notify();
        return true;
    }

    /**
     * Signals  success of the asynchronous operation and stores its `value`.
     * If provided argument is a promise, waits for its resolution.
     * @param {any} [value]
     * @return `false` if this control is not in "pending" state, otherwise `true`.
     */
    async resolve(value) {
        if (this.#state !== PENDING) return false;
        this.#detail.value = value == null ? undefined : await value;
        this.#state = RESOLVED;
        this.#notify();
        return true;
    }

    /**
     * Registers the `resolved` and optional `rejected` callbacks
     * to be notified about state changes.
     * @param {Commerce.resolved} resolved
     * @param {Commerce.failed} failed
     * @param {boolean} once
     * @return {() => void}
     */
    subscribe(resolved, failed = () => {}, once = false) {
        const [detail, { eventTypeNames }, state, target] = [
            this.#detail,
            this.#options,
            this.#state,
            this.#target,
        ];
        if (RESOLVED === state) {
            resolved(detail.value, target);
            return () => {};
        }
        if (FAILED === state) {
            failed?.(detail.error, target);
            return () => {};
        }
        const options = once ? { once: true } : undefined;
        const onFailed = (event) => failed(detail.error, event.target);
        const onResolved = (event) => resolved(detail.value, event.target);
        target.addEventListener(eventTypeNames[FAILED], onFailed, options);
        target.addEventListener(eventTypeNames[RESOLVED], onResolved, options);
        return () => {
            target.removeEventListener(eventTypeNames[FAILED], onFailed);
            target.removeEventListener(eventTypeNames[RESOLVED], onResolved);
        };
    }

    static FAILED = FAILED;
    static PENDING = PENDING;
    static RESOLVED = RESOLVED;
}
