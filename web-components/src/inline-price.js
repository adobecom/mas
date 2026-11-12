import {
    STATE_FAILED,
    FF_DEFAULTS,
    FF_ANNUAL_PRICE,
    ERROR_MESSAGE_OFFER_NOT_FOUND,
} from './constants.js';
import { createMasElement, MasElement } from './mas-element.js';
import { getService } from './utilities.js';
import { selectOffers, sumOffers } from '../../price/src/index.js';
import {
    formatLiteral,
    renderSpan,
    toLocale,
} from '../../price/src/price/template.js';
import { createLog, Log } from './log.js';
import { Defaults } from './defaults.js';

const literalLog = createLog('ConsonantTemplates/price');
const offerLog = Log.module('utilities');

// Countries that display the tax label by default, for every segment.
const TAX_LABEL_COUNTRIES = new Set(
    `AM AT AU AZ BE BG BH CH CL CO CZ DE DK EE EG ES FI FR GB GE GH GR HU ID IE
    IN IT JP KE KG KR KZ LT LU LV MD MU MX MY NG NL NO NZ OM PE PH PL PT RO SA
    SE SG SI SK TH TJ TR TW TZ UA UZ VN ZA`.split(/\s+/),
);
// Where the tax label shows, TEAM prices exclude tax, except in these countries,
// where every COM/EDU segment includes it, and in MU, where every one excludes it.
const TAX_INCLUSIVE_COUNTRIES = new Set('AU JP NG NZ PE TH ZA'.split(' '));
const SEGMENTS = ['INDIVIDUAL_COM', 'TEAM_COM', 'INDIVIDUAL_EDU', 'TEAM_EDU'];

/**
 * Resolves default values of displayTax and forceTaxExclusive, based on provided geo info and segments extracted from offers object.
 * These values will be used when the query parameters "tax" and "exclusive" are not set in the merch link, and in OST for initial
 * values for checkboxes "Tax label" and "Include tax".
 * @param {string} country - uppercase country code e.g. US, AT, MX
 * @param {string} language - lowercase language code e.g. en, de, es; tax defaults do not depend on it
 * @param {string} customerSegment - customer segment: INDIVIDUAL or TEAM
 * @param {string} marketSegment - market segment: COM or EDU
 * @returns {Promise<{displayTax: boolean, forceTaxExclusive: boolean | undefined}>} A promise with boolean properties
 * displayTax and forceTaxExclusive; forceTaxExclusive is undefined for an unknown segment in an exception country
 */
export const resolvePriceTaxFlags = async (
    country,
    language,
    customerSegment,
    marketSegment,
) => {
    const displayTax = TAX_LABEL_COUNTRIES.has(country);
    if (!displayTax) {
        return {
            displayTax: Defaults.displayTax,
            forceTaxExclusive: Defaults.forceTaxExclusive,
        };
    }
    const segment = `${customerSegment}_${marketSegment}`;
    const known = SEGMENTS.includes(segment);
    let forceTaxExclusive = known && segment.startsWith('TEAM');
    if (country === 'MU' || TAX_INCLUSIVE_COUNTRIES.has(country)) {
        forceTaxExclusive = known ? country === 'MU' : undefined;
    }
    return { displayTax, forceTaxExclusive };
};

/**
 * Picks the offers to render from the WCS offers resolved for a price's OSIs: selects one offer
 * per OSI, applies the FF_DEFAULTS per-unit and tax defaults and the annual-price flag to
 * `options` (mutated), then combines the offers. Shared by `InlinePrice.render` and the
 * server-side agent action so both price an offer the same way.
 * @param {Offer[][]} resolvedOfferArrays - WCS offers, one array per OSI
 * @param {Record<string, any>} options - settings merged with `priceOptions`; mutated
 * @param {Record<string, any>} priceOptions - options set explicitly on the price
 * @param {Record<string, boolean>} featureFlags - commerce service feature flags
 * @returns {Promise<Offer[]>} the single offer to render, as an array
 */
export async function resolvePriceOffers(
    resolvedOfferArrays,
    options,
    priceOptions,
    featureFlags = {},
) {
    const select = () =>
        resolvedOfferArrays.map((offers) => selectOffers(offers, options)[0]);
    let offers = select();
    // An OSI that WCS resolved to zero offers fails like the live fetch does.
    if (offers.includes(undefined)) {
        throw new Error(ERROR_MESSAGE_OFFER_NOT_FOUND);
    }
    if (featureFlags[FF_DEFAULTS] || options[FF_DEFAULTS]) {
        // Combined offers keep the first offer's segments.
        const [{ customerSegment, marketSegments }] = offers;
        if (priceOptions.displayPerUnit === undefined) {
            options.displayPerUnit = customerSegment !== 'INDIVIDUAL';
        }
        // Neither OST nor the merch link set them: default from geo and segment.
        if (
            priceOptions.displayTax === undefined ||
            priceOptions.forceTaxExclusive === undefined
        ) {
            const [marketSegment = ''] = marketSegments;
            const flags = await resolvePriceTaxFlags(
                options.country,
                options.language,
                customerSegment,
                marketSegment,
            );
            if (priceOptions.displayTax === undefined) {
                options.displayTax = flags.displayTax || options.displayTax;
            }
            if (priceOptions.forceTaxExclusive === undefined) {
                options.forceTaxExclusive =
                    flags.forceTaxExclusive || options.forceTaxExclusive;
            }
            if (options.forceTaxExclusive) offers = select();
        }
    } else if (priceOptions.displayOldPrice === undefined) {
        options.displayOldPrice = true;
    }

    if (featureFlags[FF_ANNUAL_PRICE] && options.displayAnnual !== false) {
        options.displayAnnual = true;
    }

    // Dual-OSI discount: use individual prices for cross-offer percentage
    if (options.template === 'discount' && offers.length === 2) {
        const [discountedOffer, referenceOffer] = offers;
        return [
            {
                ...discountedOffer,
                // Price computed here → drop stale WCS priceInfo.
                priceInfo: undefined,
                priceDetails: {
                    ...discountedOffer.priceDetails,
                    priceWithoutDiscount: referenceOffer.priceDetails?.price,
                },
            },
        ];
    }

    return [sumOffers(offers, { logger: offerLog })];
}

/**
 * Renders the localizable "no price available" fallback shown in the price slot when WCS
 * resolves an OSI to zero offers (200 OK, empty array) on the public side.
 * @param {Record<string, any>} options - the render options in scope for this offer
 * @returns {string} markup for the fallback span
 */
const renderPriceUnavailable = ({ country, language, literals = {} }) =>
    renderSpan(
        'price-unavailable',
        formatLiteral(
            literals,
            toLocale(language, country),
            'priceUnavailableLabel',
            {},
            literalLog,
        ),
    );

// Options `createInlinePrice` writes to the element's dataset, in this order.
const DATASET_OPTIONS = [
    'displayOldPrice',
    'displayPerUnit',
    'displayRecurrence',
    'displayTax',
    'displayPlanType',
    'displayAnnual',
    'forceTaxExclusive',
    'perpetual',
    'promotionCode',
    'quantity',
    'alternativePrice',
    'template',
    'wcsOsi',
];

export class InlinePrice extends (globalThis.HTMLSpanElement ?? class {}) {
    static is = 'inline-price';
    static tag = 'span';
    static get observedAttributes() {
        return [
            'data-display-old-price',
            'data-display-per-unit',
            'data-display-recurrence',
            'data-display-tax',
            'data-display-plan-type',
            'data-display-annual',
            'data-perpetual',
            'data-promotion-code',
            'data-force-tax-exclusive',
            'data-template',
            'data-wcs-osi',
            'data-quantity',
        ];
    }

    static createInlinePrice(options) {
        const service = getService();
        if (!service) return null;
        const collected = service.collectPriceOptions(options);
        return createMasElement(
            InlinePrice,
            Object.fromEntries(
                DATASET_OPTIONS.map((key) => [key, collected[key]]),
            ),
        );
    }

    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    get isInlinePrice() {
        return true;
    }

    masElement = new MasElement(this);

    attributeChangedCallback(name, _, value) {
        this.masElement.attributeChangedCallback(name, _, value);
    }

    connectedCallback() {
        this.masElement.connectedCallback();
        this.addEventListener('click', this.handleClick);
    }

    disconnectedCallback() {
        this.masElement.disconnectedCallback();
        this.removeEventListener('click', this.handleClick);
    }

    handleClick(event) {
        /* c8 ignore next 4 */
        if (event.target === this) return;
        // re-dispatch click event from the price element
        event.stopImmediatePropagation();
        this.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            }),
        );
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

    get isFailed() {
        return this.masElement.state === STATE_FAILED;
    }

    requestUpdate(force = false) {
        return this.masElement.requestUpdate(force);
    }

    /**
     * Resolves associated osi via Wcs and renders price offer.
     * @param {Record<string, any>} overrides
     */
    async render(overrides = {}) {
        if (!this.isConnected) return false;
        const service = getService();
        if (!service) return false;
        const priceOptions = service.collectPriceOptions(overrides, this);
        const options = {
            ...service.settings,
            ...priceOptions,
        };
        if (!options.wcsOsi.length) return false;
        try {
            const version = this.masElement.togglePending({});
            this.innerHTML = '';
            // Resolve all OSI promises - if any fails, Promise.all rejects
            const resolvedOfferArrays = await Promise.all(
                service.resolveOfferSelectors(options),
            );
            const offers = await resolvePriceOffers(
                resolvedOfferArrays,
                options,
                priceOptions,
                service.featureFlags,
            );
            return this.renderOffers(offers, options, version);
        } catch (error) {
            // WCS finding no offer at all (200 OK, empty array) still errors/logs like any
            // other failure (below, via toggleFailed) - Studio/preview keeps today's blank
            // placeholder-failed treatment so authors see something is broken, but a genuine
            // public visitor gets a graceful, localized message instead of a blank price.
            this.innerHTML =
                error.message === ERROR_MESSAGE_OFFER_NOT_FOUND &&
                !service.settings.preview
                    ? renderPriceUnavailable(options)
                    : '';
            throw error;
        }
    }

    /**
     * Renders price offer as HTML of this component
     * using consonant price template functions
     * @param {Offer[]} offers
     * @param {Record<string, any>} options
     * @param {number} version
     */
    renderOffers(offers, options, version = undefined) {
        if (!this.isConnected) return;
        const service = getService();
        if (!service) return false;
        version ??= this.masElement.togglePending();
        if (offers.length) {
            if (this.masElement.toggleResolved(version, offers, options)) {
                this.innerHTML = service.buildPriceHTML(offers, this.options);
                renderAlternativePrices(this, offers, service);
                return true;
            }
        } else {
            const error = new Error(
                `Not provided: ${this.options?.wcsOsi ?? '-'}`,
            );
            if (this.masElement.toggleFailed(version, error, this.options)) {
                this.innerHTML = '';
                return true;
            }
        }
        /* c8 ignore next 1 */
        return false;
    }
}

/**
 * Once the regular prices next to strikethrough prices have rendered, renders them again as
 * alternative prices (with their "Alternatively at" label), using the offers just rendered.
 */
function renderAlternativePrices(inlinePrice, offers, service) {
    const parent = inlinePrice.closest('p, h3, div');
    const strikethroughs = parent?.querySelectorAll(
        'span[data-template="strikethrough"]',
    );
    if (!strikethroughs?.length || parent.querySelector('.alt-aria-label'))
        return;
    const prices = parent.querySelectorAll(
        'span[is="inline-price"]:not([data-template="legal"])',
    );
    if (prices.length !== strikethroughs.length * 2) return;
    for (const price of prices) {
        if (
            price.dataset.template !== 'strikethrough' &&
            price.options &&
            !price.options.alternativePrice &&
            !price.isFailed
        ) {
            price.options.alternativePrice = true;
            price.innerHTML = service.buildPriceHTML(offers, price.options);
        }
    }
}

// Define custom DOM element
if (
    globalThis.customElements &&
    !globalThis.customElements.get(InlinePrice.is)
) {
    globalThis.customElements.define(InlinePrice.is, InlinePrice, {
        extends: InlinePrice.tag,
    });
}
