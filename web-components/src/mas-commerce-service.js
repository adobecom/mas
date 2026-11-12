import { Checkout } from './checkout.js';
import { refreshCheckoutLinks } from './checkout-mixin.js';
import {
    EVENT_TYPE_READY,
    FF_ANNUAL_PRICE,
    FF_DEFAULTS,
    SELECTOR_MAS_ELEMENT,
    TAG_NAME_SERVICE,
} from './constants.js';
import { Defaults } from './defaults.js';
import { Ims } from './ims.js';
import { resolvePriceTaxFlags } from './inline-price.js';
import { updateConfig as updateLanaConfig } from './lana.js';
import { getPriceLiterals } from './literals.js';
import { Log } from './log.js';
import { Price } from './price.js';
import { getAupSelect, getSettings } from './settings.js';
import { createParameterReader } from './utilities.js';
import { printMeasure } from './utils.js';
import { Wcs } from './wcs.js';

export { TAG_NAME_SERVICE };

const MARK_START = 'mas-commerce-service:start';
const MEASURE_READY = 'mas-commerce-service:ready';
const ROOT_ATTRIBUTES = ['locale', 'country', 'language', 'preview', 'instant'];
const COMMERCE_ATTRIBUTES = [
    'checkout-workflow-step',
    'force-tax-exclusive',
    'checkout-client-id',
    'allow-override',
    'wcs-api-key',
];
const MAS_REQUEST = /(\/fragment\?|web_commerce_artifact)/;

const isOn = (value) => ['on', 'true', true].includes(value);

const toCamelCase = (name) =>
    name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

/** Returns a provider registration function, which returns the unregistration function. */
const registry = (providers) => (provider) => {
    providers.add(provider);
    return () => providers.delete(provider);
};

/**
 * web component to provide commerce and fragment service to consumers.
 *
 * @attr {string} aup-select - routes checkout links through the AUP SDK. Can be set after
 * activation (e.g. once Target has settled): the service re-resolves `settings.aupSelect`
 * and refreshes the connected checkout links. URL parameter and metadata still take precedence.
 */
export class MasCommerceService extends HTMLElement {
    static observedAttributes = ['aup-select'];

    lastLoggingTime = 0;
    #featureFlags;
    #measure;

    get #config() {
        const env = this.getAttribute('env') ?? 'prod';
        const config = {
            commerce: { env },
            hostEnv: { name: env },
            lana: {
                tags: this.getAttribute('lana-tags'),
                sampleRate: parseInt(
                    this.getAttribute('lana-sample-rate') ?? 1,
                    10,
                ),
                isProdDomain: env === 'prod',
            },
            masIOUrl: this.getAttribute('mas-io-url'),
        };
        for (const name of ROOT_ATTRIBUTES) {
            const value = this.getAttribute(name);
            if (value) config[name] = value;
        }
        for (const name of COMMERCE_ATTRIBUTES) {
            const value = this.getAttribute(name);
            if (value != null) config.commerce[toCamelCase(name)] = value;
        }
        return config;
    }

    async registerCheckoutAction(action) {
        if (typeof action !== 'function') return;
        this.buildCheckoutAction = async (offers, options, el) =>
            (await action(offers, options, this.imsSignedInPromise, el)) ||
            null;
    }

    get featureFlags() {
        if (!this.#featureFlags) {
            const read = createParameterReader();
            const isFlagOn = (name) =>
                isOn(this.getAttribute(`data-${name}`) || read(name));
            this.#featureFlags = {
                [FF_DEFAULTS]: isFlagOn(FF_DEFAULTS),
                [FF_ANNUAL_PRICE]: isFlagOn(FF_ANNUAL_PRICE),
            };
        }
        return this.#featureFlags;
    }

    activate() {
        const config = this.#config;
        const settings = getSettings(config, this);
        updateLanaConfig({ ...config.lana, country: settings.country });
        const log = Log.init(config.hostEnv).module('service');
        log.debug('Activating:', config);
        const literals = { price: getPriceLiterals(settings) };
        const providers = { checkout: new Set(), price: new Set() };
        const startup = { literals, providers, settings };
        Object.assign(this, {
            ...Checkout(startup),
            ...Price(startup),
            ...Wcs(startup),
            Log,
            log: Log,
            defaults: Defaults,
            providers: {
                checkout: registry(providers.checkout),
                price: registry(providers.price),
                has: (provider) =>
                    providers.price.has(provider) ||
                    providers.checkout.has(provider),
            },
            resolvePriceTaxFlags,
            settings,
        });
        // accessors, so the IMS promises are only created when read
        Object.defineProperties(this, Object.getOwnPropertyDescriptors(Ims()));
        log.debug('Activated:', { literals, settings });
        performance.mark(MEASURE_READY);
        this.#measure = performance.measure(MEASURE_READY, MARK_START);
        this.dispatchEvent(
            new CustomEvent(EVENT_TYPE_READY, { bubbles: true, detail: this }),
        );
        setTimeout(() => this.logFailedRequests(), 10000);
    }

    connectedCallback() {
        performance.mark(MARK_START);
        this.activate();
    }

    // Target can set aup-select after the service is active. Settings are
    // read at activation, so a late value updates them and the checkout links.
    attributeChangedCallback() {
        if (!this.settings) return;
        const aupSelect = getAupSelect(this);
        if (aupSelect === this.settings.aupSelect) return;
        this.settings.aupSelect = aupSelect;
        refreshCheckoutLinks();
        this.log.debug('Refreshed checkout links');
    }

    flushWcsCache() {
        this.flushWcsCacheInternal();
        this.log.debug('Flushed WCS cache');
    }

    isPreview() {
        return isOn(this.getAttribute('preview'));
    }

    refreshOffers() {
        this.flushWcsCacheInternal();
        for (const el of document.querySelectorAll(SELECTOR_MAS_ELEMENT)) {
            el.requestUpdate(true);
        }
        this.log.debug('Refreshed WCS offers');
        this.logFailedRequests();
    }

    refreshFragments() {
        this.flushWcsCacheInternal();
        customElements.get('aem-fragment')?.cache.clear();
        for (const el of document.querySelectorAll('aem-fragment')) {
            el.refresh(false);
        }
        this.log.debug('Refreshed AEM fragments');
        this.logFailedRequests();
    }

    get duration() {
        return {
            'mas-commerce-service:measure': printMeasure(this.#measure),
        };
    }

    /**
     * Logs the network requests that failed since the previous call (zero
     * transfer size and duration without status, or a 4xx/5xx status), when
     * one of them is an AEM fragment or a WCS commerce artifact request.
     */
    logFailedRequests() {
        const failedUrls = new Set();
        for (const {
            name,
            startTime,
            transferSize,
            duration,
            responseStatus,
        } of performance.getEntriesByType('resource')) {
            if (
                startTime > this.lastLoggingTime &&
                ((transferSize === 0 &&
                    duration === 0 &&
                    responseStatus < 200) ||
                    responseStatus >= 400)
            ) {
                failedUrls.add(name);
            }
        }
        if ([...failedUrls].some((url) => MAS_REQUEST.test(url))) {
            this.log.error('Failed requests:', {
                failedUrls: [...failedUrls],
                ...this.duration,
            });
        }
        this.lastLoggingTime = performance.now();
    }
}

// Register service component
if (!window.customElements.get(TAG_NAME_SERVICE)) {
    window.customElements.define(TAG_NAME_SERVICE, MasCommerceService);
}
