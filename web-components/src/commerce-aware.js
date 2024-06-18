import { AsyncControl } from './async-control.js';
import { EVENT_TYPE_READY, TAG_NAME_SERVICE } from './constants.js';
import { getCommonAncestor } from './utils.js';

export const UNKNOWN_PLAN_TYPE = 'UNKNOWN';

/**
 * Groups commerce placeholders inside the `conteiner` element
 * into `offer` objects, by their subsription plan type.
 * @param {Commerce.Placeholder[]} placeholders
 * @param {Element} container
 * @param {{
 *  filterOffer?: Commerce.filterOffer;
 *  filterPlaceholder?: Commerce.filterPlaceholder;
 * }} filters
 */
async function makeOffers(container, filters, placeholders) {
    /** @type {Commerce.Offers} */
    const offers = new Map();
    // Note: all placeholders are awaited in parallel
    await Promise.allSettled(
        placeholders.map((placeholder) => placeholder.onceSettled())
    );
    let i = 0;
    for (const placeholder of placeholders) {
        if (!filters.filterPlaceholder(placeholder, i++)) continue;
        const wcsOffers = placeholder?.value ?? [];
        // Note: `UNKNOWN_PLAN_TYPE` - special group for failed commerce placeholders, perhaps should be ignored in render
        for (const { planType = UNKNOWN_PLAN_TYPE } of wcsOffers) {
            // Use group for this plan type, create if needed
            const group = offers.get(planType) ?? {
                checkoutLinks: [],
                inlinePrices: [],
                planType,
                get container() {
                    const { checkoutLinks, inlinePrices } = group;
                    const candidate = getCommonAncestor(
                        ...checkoutLinks,
                        ...inlinePrices
                    );
                    if (
                        candidate?.compareDocumentPosition(container) &
                        Node.DOCUMENT_POSITION_CONTAINS
                    ) {
                        return candidate;
                    }
                    return undefined;
                },
            };
            // Classify placeholder
            if (placeholder.isCheckoutLink) {
                group.checkoutLinks.push(placeholder);
            } else if (placeholder.isInlinePrice) {
                group.inlinePrices.push(placeholder);
            }
            offers.set(planType, group);
        }
    }
    i = 0;
    for (const offer of offers.values()) {
        if (!filters.filterOffer(offer, i++)) {
            offers.delete(offer.planType);
        }
    }
    return offers;
}

/**
 * Notifies the provided `callback` every time the commerce service is initialised,
 * providing currently active instance of the service.
 * @param {(commerce: Commerce.Instance) => void} callback
 * @param {{ once?: boolean; }} options
 * @returns {() => void}
 * A function to unsubscribe from notifications.
 */
export function discoverService(callback, { once = false } = {}) {
    const { head } = document;
    let latest = null;
    function discover() {
        /** @type { Commerce.Instance } */
        const current = head.querySelector(TAG_NAME_SERVICE);
        if (current === latest) return;
        latest = current;
        if (current) callback(current);
    }
    head.addEventListener(EVENT_TYPE_READY, discover, { once });
    window.setTimeout(discover);
    return () => head.removeEventListener(EVENT_TYPE_READY, discover);
}

/**
 * Lit mixin for web components requiring active instance of the commerce service.
 * Creates `commerce`, `log` and `offers` properties on the enhanced component.
 * @param {Commerce.ComponentConstructor} Component - Component constructor.
 * @param {string} tagName - Tag name of the component.
 * @example
 * class MyElement extends CommerceAware(LitElement, 'my-element') {}
 */
export function CommerceAware(Component, tagName) {
    // TODO: `name` arg can be replaced with a call to `CustomElementRegistry.getName` method in the future
    // SEE: https://caniuse.com/mdn-api_customelementregistry_getname
    return class CommerceAware extends Component {
        /**
         * Notifies connected components about state changes.
         */
        #control = new AsyncControl(this, {
            cssPrefix: tagName,
            eventPrefix: tagName,
        });
        /** @type {Commerce.Instance | undefined} */
        #commerce;
        /** @type {() => void} */
        #dispose;
        /** @type {Commerce.Log.Instance | undefined} */
        #log;
        /** @type {Commerce.Offers | undefined} */
        #offers;
        /**
         * Preselected offer type, if any.
         * @type { any }
         */
        #preselected;
        /**
         * The currently selected offer, if any.
         * @type { Commerce.Offer | undefined }
         */
        #selected;

        /**
         * Sets selected offer and notifies subscribers.
         * @param { string | Commerce.Offer } value
         */
        #updateSelected(value) {
            const { offers } = this;
            if (!offers) return;
            const selected = offers.get(value) ?? offers.get(value?.planType);
            if (selected === this.#selected) return;
            const old = this.#selected;
            this.#selected = selected;
            this.requestUpdate('selected', old);
            /* c8 ignore start */
            this.log?.debug('Selected:', {
                selected: this.selected?.planType,
                element: this,
            });
            /* c8 ignore stop */
        }

        /**
         * Returns the currently active instance of commerce service.
         */
        get commerce() {
            return this.#commerce;
        }

        /**
         * Returns an instance of async control class,
         * used to notify observers abour state changes.
         */
        get control() {
            return this.#control;
        }

        /**
         * Returns an instance of logger, associated with this component.
         */
        get log() {
            return this.#log;
        }

        /**
         * Returns offers found during the latest call to the `discoverOffers` method,
         * grouped by their plan type.
         */
        get offers() {
            return this.#offers;
        }

        /**
         * Returns a promise resolving when this panel has all data to render the offers,
         * or rejecting with the error occured during offer resolution.
         */
        get resolveComplete() {
            return this.#control.promise;
        }

        /**
         * Returns the currently selected selected offer object, if any.
         * @returns { Commerce.Offer | undefined }
         */
        get selected() {
            return this.#selected;
        }

        /**
         * Allows programmatic control of the selected offer.
         * Accepts either plan type as a string
         * or an offer object and uses its plan type to select among known offers.
         * If the given plan type cannot be found,
         * selects the first offer,following the document order.
         * @param { string | Commerce.Offer } value
         */
        set selected(value) {
            this.#preselected = value;
            this.#updateSelected(value);
        }

        connectedCallback() {
            super.connectedCallback();
            this.#dispose = discoverService((commerce) => {
                const old = [this.#commerce, this.#log, this.#offers];
                this.#commerce = commerce;
                this.#log = commerce.Log.module(tagName);
                this.#offers = undefined;
                this.#log.debug('Connected:', { element: this });
                this.requestUpdate('commerce', old[0]);
                this.requestUpdate('log', old[1]);
                this.requestUpdate('offers', old[2]);
            });
        }

        disconnectedCallback() {
            this.#log.debug('Disconnected:', { element: this });
            super.disconnectedCallback();
            this.#dispose?.();
        }

        /**
         * Overridable method to filter offers discoverable for this component.
         * By default, accepts all offers.
         * @param {Commerce.Offer} offer
         * @param {number} index
         */
        filterOffer(offer, index) {
            return true;
        }

        /**
         * Overridable method to filter placeholders discoverable for this component.
         * By default, accepts all placeholders.
         * @param {Commerce.Placeholder} placeholder
         * @param {number} index
         */
        filterPlaceholder(placeholder, index) {
            return true;
        }

        /**
         * Finds all commerce placeholders inside the `container` and groups them into offer objects.
         * A web page offer normally includes `checkout-link` and `inline-price` components
         * having same plan type and surrounded with some descriptive text.
         * @param { Element } container
         */
        async discoverOffers(container) {
            this.#control.init();
            const placeholders = [];
            const { commerce } = this;
            if (commerce) {
                const { CheckoutLink, InlinePrice } = commerce;
                placeholders.push(
                    ...CheckoutLink.getCheckoutLinks(container),
                    ...InlinePrice.getInlinePrices(container)
                );
                this.log.debug('Discovering offers:', {
                    container,
                    element: this,
                });
            }
            const old = this.#offers;
            try {
                const offers = await makeOffers(container, this, placeholders);
                this.#offers = offers;
                this.requestUpdate('offers', old);
                this.#updateSelected(this.#preselected);
            } catch (error) {
                this.#control.reject(error);
            }
        }
    };
}
