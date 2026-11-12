import { MasElement } from './mas-element.js';
import { getPromoTermsUrl } from './promo-terms.js';
import { getService } from './utilities.js';

/**
 * Universal Promo Terms Link
 */
export class UptLink extends HTMLAnchorElement {
    static is = 'upt-link';
    static tag = 'a';
    static observedAttributes = [
        'data-wcs-osi',
        'data-promotion-code',
        'data-ims-country',
    ];

    masElement = new MasElement(this);

    // set by render, the IMS country does not change the promo terms URL
    #imsCountry;

    get isUptLink() {
        return true;
    }

    constructor() {
        super();
        this.setAttribute('is', UptLink.is);
    }

    /**
     * @param {string} osi
     * @param {string} promotionCode
     */
    initializeWcsData(osi, promotionCode) {
        this.setAttribute('data-wcs-osi', osi);
        if (promotionCode)
            this.setAttribute('data-promotion-code', promotionCode);
    }

    attributeChangedCallback(name, oldValue, value) {
        if (name === 'data-ims-country' && value === this.#imsCountry) return;
        this.masElement.attributeChangedCallback(name, oldValue, value);
    }

    connectedCallback() {
        this.masElement.connectedCallback();
    }

    disconnectedCallback() {
        this.masElement.disconnectedCallback();
    }

    requestUpdate(force = false) {
        this.masElement.requestUpdate(force);
    }

    onceSettled() {
        return this.masElement.onceSettled();
    }

    async render() {
        const service = getService();
        const { dataset, masElement } = this;
        if (!dataset.imsCountry) {
            service.imsCountryPromise.then((country) => {
                if (!country) return;
                this.#imsCountry = country;
                dataset.imsCountry = country;
            });
        }
        const options = service.collectCheckoutOptions({}, this);
        const version = masElement.togglePending(options);
        if (!options.wcsOsi.length) {
            masElement.toggleFailed(
                version,
                new Error(`Missing 'data-wcs-osi' attribute on upt-link.`),
                options,
            );
            return false;
        }
        try {
            const [[offer]] = await Promise.all(
                service.resolveOfferSelectors(options),
            );
            const { country, language, env } = options;
            this.href = getPromoTermsUrl({
                env,
                language,
                country,
                offerId: offer.offerId,
                promotionCode: this.getAttribute('data-promotion-code'),
            });
            masElement.toggleResolved(version, offer, options);
        } catch (error) {
            masElement.toggleFailed(
                version,
                new Error(
                    `Could not resolve offer selectors for id: ${options.wcsOsi}.`,
                    { cause: error },
                ),
                options,
            );
        }
    }

    /**
     * @param {HTMLElement} element
     */
    static createFrom(element) {
        const uptLink = new UptLink();
        for (const { name, value } of element.attributes) {
            if (name === 'is') continue;
            if (name === 'class' && value.includes('upt-link'))
                uptLink.setAttribute(
                    'class',
                    value.replace('upt-link', '').trim(),
                );
            else uptLink.setAttribute(name, value);
        }
        uptLink.innerHTML = element.innerHTML;
        uptLink.setAttribute('tabindex', 0);
        return uptLink;
    }
}

if (!customElements.get(UptLink.is)) {
    customElements.define(UptLink.is, UptLink, { extends: UptLink.tag });
}
