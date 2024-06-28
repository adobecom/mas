import {
    createPlaceholder,
    definePlaceholder,
    selectPlaceholders,
    updatePlaceholder,
} from './placeholder.js';
import { selectOffers, useService } from './utilities.js';
import { GeoMap } from './settings';
import { Defaults } from './defaults';

const INDIVIDUAL = 'INDIVIDUAL_COM';
const BUSINESS = 'TEAM_COM';
const STUDENT = 'INDIVIDUAL_EDU';
const UNIVERSITY = 'TEAM_EDU';

// countries where tax is displayed for all segments by default
const DISPLAY_ALL_TAX_COUNTRIES = [GeoMap.uk, GeoMap.au, GeoMap.fr, GeoMap.at, GeoMap.be_en, GeoMap.be_fr, GeoMap.be_nl, GeoMap.bg, GeoMap.ch_de, GeoMap.ch_fr, GeoMap.ch_it,
    GeoMap.cz, GeoMap.de, GeoMap.dk, GeoMap.ee, GeoMap.eg_ar, GeoMap.eg_en, GeoMap.es, GeoMap.fi, GeoMap.fr, GeoMap.gr_el, GeoMap.gr_en, GeoMap.hu, GeoMap.ie, GeoMap.it, GeoMap.lu_de,
    GeoMap.lu_en, GeoMap.lu_fr, GeoMap.nl, GeoMap.no, GeoMap.pl, GeoMap.pt, GeoMap.ro, GeoMap.se, GeoMap.si, GeoMap.sk, GeoMap.tr, GeoMap.ua, GeoMap.id_en, GeoMap.id_id,
    GeoMap.in_en, GeoMap.in_hi, GeoMap.jp, GeoMap.my_en, GeoMap.my_ms, GeoMap.nz, GeoMap.th_en, GeoMap.th_th];
// countries where tax is displayed for some segments only by default
const DISPLAY_TAX_MAP = {
    [INDIVIDUAL]: [GeoMap.za, GeoMap.lt, GeoMap.lv, GeoMap.ng, GeoMap.sa_ar, GeoMap.sa_en, GeoMap.za, GeoMap.sg, GeoMap.kr],
    [BUSINESS]: [GeoMap.za, GeoMap.lt, GeoMap.lv, GeoMap.ng, GeoMap.za, GeoMap.co, GeoMap.kr],
    [STUDENT]: [GeoMap.lt, GeoMap.lv, GeoMap.sa_en, GeoMap.sea],
    [UNIVERSITY]: [GeoMap.sea, GeoMap.kr],
};

// For most countries where tax label is displayed the tax is included for Individuals and Students
// and excluded for Business and Universities. This is the map of TaxExclusive values for other countries
const TAX_EXCLUDED_MAP = {
    [GeoMap.za]: [false, false, Defaults.forceTaxExclusive, Defaults.forceTaxExclusive],
    [GeoMap.at]: [false, false, false, true],
    [GeoMap.ng]: [false, false, Defaults.forceTaxExclusive, Defaults.forceTaxExclusive],
    [GeoMap.au]: [false, false, false, false],
    [GeoMap.jp]: [false, false, false, false],
    [GeoMap.nz]: [false, false, false, false],
    [GeoMap.th_en]: [false, false, false, false],
    [GeoMap.th_th]: [false, false, false, false],
};
const TAX_EXCLUDED_MAP_INDEX = [INDIVIDUAL, BUSINESS, STUDENT, UNIVERSITY];
const TAX_EXCLUDED_MAP_OTHER = {
    [INDIVIDUAL]: false,
    [BUSINESS]: true,
    [STUDENT]: false,
    [UNIVERSITY]: true,
};

/**
 * Resolves the default value for forceTaxExclusive for the provided geo info and segments.
 * @param {string} country - uppercase country code e.g. US, AT, MX
 * @param {string} language - lowercase language code e.g. en, de, es
 * @param {string} customerSegment - customer segment: INDIVIDUAL or TEAM
 * @param {string} marketSegment - market segment: COM or EDU
 * @returns {boolean} true if price will be displayed without tax, otherwise false (default)
 */
const resolveTaxExclusive = (country, language, customerSegment, marketSegment) => {
    const locale = `${country}_${language}`;
    const segment = `${customerSegment}_${marketSegment}`;
    const val = TAX_EXCLUDED_MAP[locale];
    if (val) {
        const index = TAX_EXCLUDED_MAP_INDEX.indexOf(segment);
        return val[index];
    }

    return TAX_EXCLUDED_MAP_OTHER[segment];
}

/**
 * Resolves the default value of displayTax property, for the provided geo info and segments.
 * @param {string} country - uppercase country code e.g. US, AT, MX
 * @param {string} language - lowercase language code e.g. en, de, es
 * @param {string} customerSegment - customer segment: INDIVIDUAL or TEAM
 * @param {string} marketSegment - market segment: COM or EDU
 * @returns {boolean} true if tax label will be displayed, otherwise false (default)
 */
const resolveDisplayTaxForGeoAndSegment = (country, language, customerSegment, marketSegment) => {
    const locale = `${country}_${language}`;
    if (DISPLAY_ALL_TAX_COUNTRIES.includes(country)
        || DISPLAY_ALL_TAX_COUNTRIES.includes(locale)) {
        return true;
    }

    const segmentConfig = DISPLAY_TAX_MAP[`${customerSegment}_${marketSegment}`];
    if (!segmentConfig) {
        return Defaults.displayTax;
    }

    if (segmentConfig.includes(country) || segmentConfig.includes(locale)) {
        return true;
    }

    return Defaults.displayTax;
}

/**
 * Resolves default values of displayTax and forceTaxExclusive, based on provided geo info and segments extracted from offers object.
 * These values will be used when the query parameters "tax" and "exclusive" are not set in the merch link, and in OST for initial
 * values for checkboxes "Tax label" and "Include tax".
 * @param {string} country - uppercase country code e.g. US, AT, MX
 * @param {string} language - lowercase language code e.g. en, de, es
 * @param {string} customerSegment - customer segment: INDIVIDUAL or TEAM
 * @param {string} marketSegment - market segment: COM or EDU
 * @returns {Promise<{displayTax: boolean, forceTaxExclusive: boolean}>} A promise with boolean properties displayTax and forceTaxExclusive
 */
export const resolvePriceTaxFlags = async (country, language, customerSegment, marketSegment) => {
    const displayTax = resolveDisplayTaxForGeoAndSegment(country, language, customerSegment, marketSegment);
    return {
        displayTax,
        forceTaxExclusive: displayTax ? resolveTaxExclusive(country, language, customerSegment, marketSegment) : Defaults.forceTaxExclusive
    };
}

/** @type {Commerce.Price.PlaceholderConstructor} */
export class HTMLPriceSpanElement extends HTMLSpanElement {
    static is = 'inline-price';
    static tag = 'span';
    static get observedAttributes() {
        return [
            'data-display-old-price',
            'data-display-per-unit',
            'data-display-recurrence',
            'data-display-tax',
            'data-perpetual',
            'data-promotion-code',
            'data-force-tax-exclusive',
            'data-template',
            'data-wcs-osi',
        ];
    }

    /** @type {Commerce.Price.PlaceholderConstructor["createInlinePrice"]} */
    static createInlinePrice(options) {
        const service = useService();
        if (!service) return null;
        const {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        } = service.collectPriceOptions(options);
        /** @type {Commerce.Price.Placeholder} */
        // @ts-ignore
        const element = createPlaceholder(HTMLPriceSpanElement, {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        });
        return element;
    }

    // TODO: consider moving this function to the `web-components` package
    /** @type {Commerce.Price.PlaceholderConstructor["getInlinePrices"]} */
    static getInlinePrices(container) {
        /** @type {Commerce.Price.Placeholder[]} */
        // @ts-ignore
        const elements = selectPlaceholders(HTMLPriceSpanElement, container);
        return elements;
    }

    get isInlinePrice() {
        return true;
    }

    /**
     * Returns `this`, typed as Placeholder mixin.
     * @type {Commerce.Price.Placeholder}
     */
    get placeholder() {
        // @ts-ignore
        return this;
    }

    /**
     * Resolves associated osi via Wcs and renders price offer.
     * @param {Record<string, any>} overrides
     */
    async render(overrides = {}) {
        if (!this.isConnected) return false;
        const service = useService();
        if (!service) return false;
        const options = service.collectPriceOptions(
            overrides,
            this.placeholder
        );
        if (!options.wcsOsi.length) return false;

        if (!this.placeholder.dataset.displayTax || !this.placeholder.dataset.forceTaxExclusive) {
            const [offerSelectors] = await service.resolveOfferSelectors(options);
            const offers = selectOffers(await offerSelectors, options);
            if (offers?.length) {
                const { country, language } = options;
                const offer = offers[0];
                const [marketSegment = ''] = offer.marketSegments;

                // set default value for displayTax and forceTaxExclusive if not set neither in OST nor in merch link
                const flags = await resolvePriceTaxFlags(country, language, offer.customerSegment, marketSegment);
                if (!this.placeholder.dataset.displayTax) {
                    options.displayTax = flags?.displayTax || options.displayTax;
                }
                if (!this.placeholder.dataset.forceTaxExclusive) {
                    options.forceTaxExclusive = flags?.forceTaxExclusive || options.forceTaxExclusive;
                }
            }
        }

        const version = this.placeholder.togglePending(options);
        this.innerHTML = '';
        const [promise] = service.resolveOfferSelectors(options);
        return this.renderOffers(
            selectOffers(await promise, options),
            options,
            version
        );
    }

    // TODO: can be extended to accept array of offers and compute subtotal price
    /**
     * Renders price offer as HTML of this component
     * using consonant price template functions
     * from package `@dexter/tacocat-consonant-templates`.
     * @param {Commerce.Wcs.Offer[]} offers
     * @param {Record<string, any>} overrides
     * Optional object with properties to use as overrides
     * over those collected from dataset of this component.
     */
    renderOffers(offers, overrides = {}, version = undefined) {
        if (!this.isConnected) return;
        const service = useService();
        if (!service) return false;
        const options = service.collectPriceOptions({
            ...this.dataset,
            ...overrides,
        });
        version ??= this.placeholder.togglePending(options);
        if (offers.length) {
            if (this.placeholder.toggleResolved(version, offers, options)) {
                this.innerHTML = service.buildPriceHTML(offers, options);
                return true;
            }
        } else {
            const error = new Error(`Not provided: ${options?.wcsOsi ?? '-'}`);
            if (this.placeholder.toggleFailed(version, error, options)) {
                this.innerHTML = '';
                return true;
            }
        }
        return false;
    }

    updateOptions(options) {
        const service = useService();
        if (!service) return false;
        const {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        } = service.collectPriceOptions(options);
        updatePlaceholder(this, {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        });
        return true;
    }
}

export const InlinePrice = definePlaceholder(HTMLPriceSpanElement);
