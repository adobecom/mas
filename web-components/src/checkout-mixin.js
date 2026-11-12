import {
    applyPageLocaleToCheckoutUrl,
    get3in1ClientId,
    is3in1Modal,
    isOpen3in1Modal,
} from './buildCheckoutUrl.js';
import {
    AUP_CHECKOUT_CLIENT_IDS,
    PROMO_CONTEXT_CANCEL_VALUE,
    STATE_PENDING,
    STATE_RESOLVED,
} from './constants.js';
import {
    createMasElement,
    MasElement,
    updateMasElement,
} from './mas-element.js';
import { getService } from './utilities.js';
import { selectOffers } from '../../price/src/offers.js';
import { isPromotionActive } from '../../price/src/price/utilities.js';

export const CLASS_NAME_DOWNLOAD = 'download';
export const CLASS_NAME_UPGRADE = 'upgrade';

const OBSERVED_ATTRIBUTES = [
    'data-checkout-workflow',
    'data-checkout-workflow-step',
    'data-extra-options',
    'data-ims-country',
    'data-perpetual',
    'data-promotion-code',
    'data-quantity',
    'data-template',
    'data-wcs-osi',
    'data-entitlement',
    'data-upgrade',
    'data-modal',
];
// Checkout options kept in the dataset of a checkout element.
const DATASET_OPTIONS = [
    'checkoutMarketSegment',
    'checkoutWorkflow',
    'checkoutWorkflowStep',
    'entitlement',
    'upgrade',
    'modal',
    'perpetual',
    'promotionCode',
    'quantity',
    'wcsOsi',
];
const SEGMENTS = { e: 'EDU', t: 'TEAM' };

let aupCheckoutPending = false;
const connectedCheckoutElements = new Set();

export function refreshCheckoutLinks() {
    for (const element of connectedCheckoutElements) {
        element.updateCheckoutUrl();
    }
}

/**
 * @typedef {Object} AupHandlerContext
 * @property {'open' | 'close'} type
 * @property {HTMLAnchorElement | HTMLButtonElement} element
 */

/**
 * @typedef {Object} CheckoutAction
 * @property {string} [url]
 * @property {string} [text]
 * @property {string} [className]
 * @property {(event: MouseEvent) => unknown} [handler]
 * @property {(context: AupHandlerContext) => void} [aupHandler]
 */

const pick = (options, keys) =>
    Object.fromEntries(keys.map((key) => [key, options[key]]));

const isModifiedClick = (e) =>
    e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

/** The client AUP opens a checkout in: 3-in-1 modals have their own clients. */
export const getAupClientId = ({ checkoutClientId, modal }) =>
    is3in1Modal(modal)
        ? get3in1ClientId(checkoutClientId, modal)
        : checkoutClientId;

export function isAupCheckoutSupported(offers, options, hasUpgradeAction) {
    return (
        AUP_CHECKOUT_CLIENT_IDS.has(getAupClientId(options)) &&
        offers.length > 0 &&
        !hasUpgradeAction &&
        !options.perpetual &&
        !offers.some(({ commitment }) => commitment === 'PERPETUAL')
    );
}

function notifyAupHandler(element, handler, type) {
    if (!handler) return;
    try {
        handler({ type, element });
    } catch (error) {
        element.masElement.log.error(
            `AUP checkout ${type} handler failed`,
            error,
        );
    }
}

export function createCheckoutElement(Class, options, innerHTML) {
    const service = getService();
    if (!service) return null;
    const dataset = pick(service.collectCheckoutOptions(options), [
        ...DATASET_OPTIONS,
        'extraOptions',
        'analyticsId',
    ]);
    // collectCheckoutOptions drops the code cancelling the page promotion
    if (options.promotionCode === PROMO_CONTEXT_CANCEL_VALUE) {
        dataset.promotionCode = PROMO_CONTEXT_CANCEL_VALUE;
    }
    const element = createMasElement(Class, dataset);
    if (innerHTML)
        element.innerHTML = `<span style="pointer-events: none;">${innerHTML}</span>`;
    return element;
}

export function CheckoutMixin(Base) {
    return class CheckoutBase extends Base {
        static observedAttributes = OBSERVED_ATTRIBUTES;

        masElement = new MasElement(this);

        // true while render waits for its offers, it reads data-ims-country after
        #imsCountryPending = false;

        // Loads the AUP checkout on hover or focus, so the click does not wait
        // for it. Never on page load: it is only needed after an interaction.
        #prefetchAupCheckout = () => {
            if (window.aupsdk && this.#usesAup()) {
                // a failed prefetch is retried, and logged, on click
                import('./aup-checkout.js').catch(() => {});
            }
        };

        attributeChangedCallback(name, oldValue, value) {
            // the pending render reads the new IMS country, rendering again would repeat it
            if (
                name === 'data-ims-country' &&
                this.#imsCountryPending &&
                this.masElement.state === STATE_PENDING
            ) {
                return;
            }
            this.masElement.attributeChangedCallback(name, oldValue, value);
        }

        connectedCallback() {
            this.masElement.connectedCallback();
            connectedCheckoutElements.add(this);
            this.#listen('addEventListener');
            this.updateCheckoutUrl();
        }

        disconnectedCallback() {
            this.masElement.disconnectedCallback();
            connectedCheckoutElements.delete(this);
            this.#listen('removeEventListener');
        }

        #listen(method) {
            this[method]('click', this.clickHandler);
            this[method]('auxclick', this.handleAupModifiedClick);
            this[method]('pointerenter', this.#prefetchAupCheckout);
            this[method]('focusin', this.#prefetchAupCheckout);
        }

        onceSettled() {
            return this.masElement.onceSettled();
        }

        get value() {
            return this.masElement.value;
        }

        get options() {
            return this.masElement.options;
        }

        get marketSegment() {
            const value =
                this.options?.ms ?? this.value?.[0]?.marketSegments?.[0];
            return SEGMENTS[value] ?? value;
        }

        get customerSegment() {
            const value = this.options?.cs ?? this.value?.[0]?.customerSegment;
            return SEGMENTS[value] ?? value;
        }

        get is3in1Modal() {
            return is3in1Modal(this.getAttribute('data-modal'));
        }

        get isOpen3in1Modal() {
            return isOpen3in1Modal(this.getAttribute('data-modal'));
        }

        requestUpdate(force = false) {
            return this.masElement.requestUpdate(force);
        }

        async render(overrides = {}) {
            const service = getService();
            const { dataset, masElement } = this;
            if (!dataset.imsCountry) {
                service.imsCountryPromise.then((country) => {
                    if (country) dataset.imsCountry = country;
                });
            }
            const options = service.collectCheckoutOptions(overrides, this);
            if (!options.wcsOsi.length) return false;
            const extraOptions = JSON.parse(options.extraOptions ?? '{}');
            const version = masElement.togglePending(options);
            this.setCheckoutUrl('');
            this.#imsCountryPending = true;
            const offers = (
                await Promise.all(service.resolveOfferSelectors(options))
            ).flatMap((offer) => selectOffers(offer, options));
            this.#imsCountryPending = false;
            const { promotion } = offers.find((offer) => offer.promotion) ?? {};
            if (
                options.promotionCode &&
                !isPromotionActive(
                    promotion,
                    promotion?.displaySummary?.instant,
                    options.quantity[0],
                )
            ) {
                delete options.promotionCode;
            }
            options.country = dataset.imsCountry || options.country;
            const checkoutAction = await service.buildCheckoutAction?.(
                offers,
                { ...extraOptions, ...options },
                this,
            );
            return this.#renderOffers(
                offers,
                { ...extraOptions, ...options },
                checkoutAction,
                version,
            );
        }

        /**
         * Renders checkout link href for provided offers into this component.
         * @param {Commerce.Wcs.Offer[]} offers
         * @param {Commerce.Checkout.Options} options
         * @param {Commerce.Checkout.AnyOptions} overrides
         * @param {CheckoutAction} checkoutAction
         * @param {number} version
         */
        renderOffers(
            offers,
            options,
            overrides = {},
            checkoutAction = undefined,
            version = undefined,
        ) {
            options = {
                ...JSON.parse(this.dataset.extraOptions ?? '{}'),
                ...options,
                ...overrides,
            };
            return this.#renderOffers(
                offers,
                options,
                checkoutAction,
                version ?? this.masElement.togglePending(options),
            );
        }

        #renderOffers(offers, options, checkoutAction, version) {
            const { classList, masElement } = this;
            if (version !== masElement.version) return;
            const { url, text, className, handler, aupHandler } =
                checkoutAction ?? {};
            // an action resolves the element, even without offers
            if (checkoutAction || offers.length) {
                masElement.toggleResolved(version, offers, options);
            }
            if (!offers.length) {
                masElement.toggleFailed(
                    version,
                    new Error(`Not provided: ${options.wcsOsi ?? '-'}`),
                    options,
                );
            }
            this.checkoutActionHandler = handler?.bind(this);
            this.aupHandler = aupHandler?.bind(this);
            classList.remove(CLASS_NAME_DOWNLOAD, CLASS_NAME_UPGRADE);
            if (text) this.firstElementChild.innerHTML = text;
            if (className) classList.add(...className.split(' '));
            let { checkoutUrl } = this;
            if (!offers.length) {
                checkoutUrl = '#';
            } else if (
                !classList.contains(CLASS_NAME_DOWNLOAD) &&
                !classList.contains(CLASS_NAME_UPGRADE)
            ) {
                checkoutUrl =
                    options.modal === 'true'
                        ? '#'
                        : getService().buildCheckoutURL(offers, options);
            } else if (handler) {
                // A 3-in-1 modal builds its iframe from href, so it keeps
                // the real checkout URL instead of '#'.
                checkoutUrl = this.isOpen3in1Modal
                    ? getService().buildCheckoutURL(offers, options)
                    : '#';
            } else if (url) {
                checkoutUrl = applyPageLocaleToCheckoutUrl(url);
            }
            this.setCheckoutUrl(checkoutUrl);
            return true;
        }

        setCheckoutUrl(value) {
            this.checkoutUrl = value;
            this.updateCheckoutUrl();
        }

        #usesAup(aupSelect = getService()?.settings?.aupSelect) {
            return (
                aupSelect &&
                this.checkoutUrl &&
                this.masElement.state === STATE_RESOLVED &&
                !this.classList.contains(CLASS_NAME_DOWNLOAD) &&
                !this.hasAttribute('download') &&
                (!this.target || this.target === '_self') &&
                isAupCheckoutSupported(
                    this.value,
                    this.options,
                    this.classList.contains(CLASS_NAME_UPGRADE),
                )
            );
        }

        /** An AUP checkout gets '#' as href, so the browser does not navigate. */
        updateCheckoutUrl(aupSelect) {
            if (this.checkoutUrl === undefined) return;
            const useAup = this.#usesAup(aupSelect);
            this.setAttribute(
                this.isCheckoutLink ? 'href' : 'data-href',
                useAup ? '#' : this.checkoutUrl,
            );
            return useAup;
        }

        handleAupModifiedClick(e) {
            if (!isModifiedClick(e) || !this.updateCheckoutUrl()) return false;
            e.preventDefault();
            return true;
        }

        handleAupCheckout(e) {
            if (this.handleAupModifiedClick(e)) return true;
            this.updateCheckoutUrl(false);
            // Native checkout needs its destination until the click's default action runs.
            setTimeout(() => this.updateCheckoutUrl(), 0);
            const sdk = window.aupsdk;
            if (
                e.defaultPrevented ||
                isModifiedClick(e) ||
                !sdk?.getOrchestratorContext ||
                !this.#usesAup()
            ) {
                return false;
            }
            this.updateCheckoutUrl();
            e.preventDefault();
            if (aupCheckoutPending) return true;
            aupCheckoutPending = true;
            this.aupCheckoutPromise = this.#checkoutWithAup(e, sdk).finally(
                () => {
                    aupCheckoutPending = false;
                },
            );
            return true;
        }

        // Uses the CTA as clicked: it can render again while AUP is open.
        async #checkoutWithAup(event, sdk) {
            const {
                aupHandler,
                checkoutActionHandler,
                checkoutUrl,
                masElement: { log },
                value,
            } = this;
            const card = this.closest('merch-card');
            const id = this.getAttribute('data-modal-id');
            const options = {
                ...this.options,
                cs: this.customerSegment,
                ms: this.marketSegment,
            };
            let aup;
            let cart;
            let handled = false;
            notifyAupHandler(this, aupHandler, 'open');
            try {
                aup = await import('./aup-checkout.js');
                handled = await aup.launchAupCheckout(
                    sdk,
                    value,
                    options,
                    card && id
                        ? (items) => {
                              cart = items;
                          }
                        : undefined,
                );
            } catch (error) {
                log.error('AUP checkout launch failed', error);
            }
            notifyAupHandler(this, aupHandler, 'close');
            if (handled) {
                if (cart) aup.syncAupCart(this, card, id, value, cart);
                return;
            }
            try {
                if (checkoutActionHandler) await checkoutActionHandler(event);
                else if (checkoutUrl) window.location.href = checkoutUrl;
            } catch (error) {
                log.error('AUP checkout fallback failed', error);
            }
        }

        clickHandler(e) {
            if (this.handleAupCheckout(e)) return;
            if (this.checkoutActionHandler) this.checkoutActionHandler(e);
            // a link navigates by itself
            else if (!this.isCheckoutLink && this.href) {
                window.location.href = this.href;
            }
        }

        updateOptions(options = {}) {
            updateMasElement(
                this,
                pick(
                    getService().collectCheckoutOptions(options),
                    DATASET_OPTIONS,
                ),
            );
            return true;
        }
    };
}
