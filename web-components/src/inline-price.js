import { STATE_FAILED, FF_DEFAULTS } from './constants.js';
import { createMasElement, MasElement } from './mas-element.js';
import { selectOffers, getService } from './utilities.js';
import { Defaults } from './defaults.js';

const INDIVIDUAL = 'INDIVIDUAL_COM';
const BUSINESS = 'TEAM_COM';
const STUDENT = 'INDIVIDUAL_EDU';
const UNIVERSITY = 'TEAM_EDU';
const PRICE_ERROR_SVG = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.99943 13.611C8.79185 13.6183 8.58959 13.5446 8.43548 13.4055C8.13818 13.0773 8.13818 12.5775 8.43548 12.2494C8.5879 12.1069 8.79083 12.0309 8.99946 12.0381C9.21217 12.0296 9.41876 12.1103 9.56918 12.2608C9.71504 12.4117 9.79342 12.6153 9.78641 12.8249C9.79755 13.0361 9.72378 13.2431 9.58148 13.3997C9.42526 13.5478 9.2144 13.6243 8.99943 13.611Z" fill="#D73220"/>
            <path d="M9 10.575C8.62734 10.575 8.325 10.2727 8.325 9.9V6.3C8.325 5.92735 8.62734 5.625 9 5.625C9.37265 5.625 9.675 5.92735 9.675 6.3V9.9C9.675 10.2727 9.37265 10.575 9 10.575Z" fill="#D73220"/>
            <path d="M15.0601 16.2H2.93993C2.21967 16.2 1.56928 15.8308 1.20058 15.2121C0.831873 14.5933 0.816051 13.8454 1.15883 13.2117L7.21889 2.00917C7.57309 1.35438 8.25557 0.947449 8.99999 0.947449C9.74442 0.947449 10.4269 1.35438 10.7811 2.00917L16.8412 13.2117C17.1839 13.8454 17.1681 14.5934 16.7994 15.2121C16.4307 15.8309 15.7803 16.2 15.0601 16.2ZM8.99999 2.29745C8.87914 2.29745 8.579 2.33173 8.40629 2.65077L2.34623 13.8533C2.18143 14.1583 2.30097 14.422 2.36029 14.5204C2.41918 14.6197 2.59364 14.85 2.93993 14.85H15.06C15.4063 14.85 15.5808 14.6197 15.6397 14.5204C15.699 14.422 15.8185 14.1583 15.6537 13.8533L9.5937 2.65077C9.421 2.33173 9.12085 2.29745 8.99999 2.29745Z" fill="#D73220"/>
        </svg>
`;

// countries where tax is displayed for all segments by default
const DISPLAY_ALL_TAX_COUNTRIES = [
    'GB_en',
    'AU_en',
    'FR_fr',
    'AT_de',
    'BE_en',
    'BE_fr',
    'BE_nl',
    'BG_bg',
    'CH_de',
    'CH_fr',
    'CH_it',
    'CZ_cs',
    'DE_de',
    'DK_da',
    'EE_et',
    'EG_ar',
    'EG_en',
    'ES_es',
    'FI_fi',
    'GR_el',
    'GR_en',
    'HU_hu',
    'IE_en',
    'IT_it',
    'LU_de',
    'LU_en',
    'LU_fr',
    'NL_nl',
    'NO_nb',
    'PL_pl',
    'PT_pt',
    'RO_ro',
    'SE_sv',
    'SI_sl',
    'SK_sk',
    'TR_tr',
    'UA_uk',
    'ID_en',
    'ID_in',
    'IN_en',
    'IN_hi',
    'JP_ja',
    'MY_en',
    'MY_ms',
    'NZ_en',
    'TH_en',
    'TH_th',
];

// countries where tax is displayed for some segments only by default
const DISPLAY_TAX_MAP = {
    [INDIVIDUAL]: [
        'MU_en',
        'LT_lt',
        'LV_lv',
        'NG_en',
        'SA_ar',
        'SA_en',
        'SG_en',
        'KR_ko',
    ],
    [BUSINESS]: ['MU_en', 'LT_lt', 'LV_lv', 'NG_en', 'CO_es', 'KR_ko'],
    [STUDENT]: ['LT_lt', 'LV_lv', 'SA_en', 'SG_en'],
    [UNIVERSITY]: ['SG_en', 'KR_ko'],
};

// For most countries where tax label is displayed the tax is included for Individuals and Students
// and excluded for Business and Universities. This is the map of TaxExclusive values for other countries
const TAX_EXCLUDED_MAP = {
    ['MU_en']: [false, false, false, false],
    ['NG_en']: [false, false, false, false],
    ['AU_en']: [false, false, false, false],
    ['JP_ja']: [false, false, false, false],
    ['NZ_en']: [false, false, false, false],
    ['TH_en']: [false, false, false, false],
    ['TH_th']: [false, false, false, false],
    ['CO_es']: [false, true, false, false],
    ['AT_de']: [false, false, false, true],
    ['SG_en']: [false, false, false, true],
};
const TAX_EXCLUDED_MAP_INDEX = [INDIVIDUAL, BUSINESS, STUDENT, UNIVERSITY];
const defaultTaxExcluded = (segment) =>
    [BUSINESS, UNIVERSITY].includes(segment);

/**
 * Resolves the default value for forceTaxExclusive for the provided geo info and segments.
 * @param {string} country - uppercase country code e.g. US, AT, MX
 * @param {string} language - lowercase language code e.g. en, de, es
 * @param {string} customerSegment - customer segment: INDIVIDUAL or TEAM
 * @param {string} marketSegment - market segment: COM or EDU
 * @returns {boolean} true if price will be displayed without tax, otherwise false (default)
 */
const resolveTaxExclusive = (
    country,
    language,
    customerSegment,
    marketSegment,
) => {
    const locale = `${country}_${language}`;
    const segment = `${customerSegment}_${marketSegment}`;
    const val = TAX_EXCLUDED_MAP[locale];
    if (val) {
        const index = TAX_EXCLUDED_MAP_INDEX.indexOf(segment);
        return val[index];
    }

    return defaultTaxExcluded(segment);
};

/**
 * Resolves the default value of displayTax property, for the provided geo info and segments.
 * @param {string} country - uppercase country code e.g. US, AT, MX
 * @param {string} language - lowercase language code e.g. en, de, es
 * @param {string} customerSegment - customer segment: INDIVIDUAL or TEAM
 * @param {string} marketSegment - market segment: COM or EDU
 * @returns {boolean} true if tax label will be displayed, otherwise false (default)
 */
const resolveDisplayTaxForGeoAndSegment = (
    country,
    language,
    customerSegment,
    marketSegment,
) => {
    const locale = `${country}_${language}`;
    if (
        DISPLAY_ALL_TAX_COUNTRIES.includes(country) ||
        DISPLAY_ALL_TAX_COUNTRIES.includes(locale)
    ) {
        return true;
    }

    const segmentConfig =
        DISPLAY_TAX_MAP[`${customerSegment}_${marketSegment}`];
    if (!segmentConfig) {
        return Defaults.displayTax;
    }

    if (segmentConfig.includes(country) || segmentConfig.includes(locale)) {
        return true;
    }

    return Defaults.displayTax;
};

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
export const resolvePriceTaxFlags = async (
    country,
    language,
    customerSegment,
    marketSegment,
) => {
    const displayTax = resolveDisplayTaxForGeoAndSegment(
        country,
        language,
        customerSegment,
        marketSegment,
    );
    return {
        displayTax,
        forceTaxExclusive: displayTax
            ? resolveTaxExclusive(
                  country,
                  language,
                  customerSegment,
                  marketSegment,
              )
            : Defaults.forceTaxExclusive,
    };
};

export class InlinePrice extends HTMLSpanElement {
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
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const service = getService();
        if (!service) return null;
        const {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            displayPlanType,
            displayAnnual,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            alternativePrice,
            template,
            wcsOsi,
        } = service.collectPriceOptions(options);
        const element = createMasElement(InlinePrice, {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            displayPlanType,
            displayAnnual,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            alternativePrice,
            template,
            wcsOsi,
        });
        return element;
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
        // eslint-disable-next-line react-hooks/rules-of-hooks
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
            const [offerSelectors] =
                await service.resolveOfferSelectors(options);
            let offers = selectOffers(await offerSelectors, options);
            let [offer] = offers;

            if (service.featureFlags[FF_DEFAULTS] || options[FF_DEFAULTS]) {
                if (priceOptions.displayPerUnit === undefined) {
                    options.displayPerUnit =
                        offer.customerSegment !== 'INDIVIDUAL';
                }
                // if displayTax or forceTaxExclusive is not set, we need to resolve the values based on the geo and segment
                if (
                    priceOptions.displayTax === undefined ||
                    priceOptions.forceTaxExclusive === undefined
                ) {
                    const { country, language } = options;
                    const [marketSegment = ''] = offer.marketSegments;
                    // set default value for displayTax and forceTaxExclusive if not set neither in OST nor in merch link
                    const flags = await resolvePriceTaxFlags(
                        country,
                        language,
                        offer.customerSegment,
                        marketSegment,
                    );
                    if (priceOptions.displayTax === undefined) {
                        options.displayTax =
                            flags?.displayTax || options.displayTax;
                    }
                    if (priceOptions.forceTaxExclusive === undefined) {
                        options.forceTaxExclusive =
                            flags?.forceTaxExclusive ||
                            options.forceTaxExclusive;
                    }
                    if (options.forceTaxExclusive) {
                        offers = selectOffers(offers, options);
                    }
                }
            } else {
                if (priceOptions.displayOldPrice === undefined) {
                    options.displayOldPrice = true;
                }
            }
            return this.renderOffers(offers, options, version);
        } catch (error) {
            this.innerHTML = `
            ${PRICE_ERROR_SVG}
        <div class="price-error-content">
            <span class="price-error-title heading-xs">Price unavailable</span>
        </div>
    `;
            throw error;
        }
    }

    // TODO: can be extended to accept array of offers and compute subtotal price
    /**
     * Renders price offer as HTML of this component
     * using consonant price template functions
     * @param {Offer[]} offers
     * @param {Record<string, any>} options
     * @param {number} version
     */
    renderOffers(offers, options, version = undefined) {
        if (!this.isConnected) return;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const service = getService();
        if (!service) return false;
        version ??= this.masElement.togglePending();
        if (offers.length) {
            if (this.masElement.toggleResolved(version, offers, options)) {
                this.innerHTML = service.buildPriceHTML(offers, this.options);

                // Adding logic for options.alternativePrice to add <sr-only>Alternatively at</sr-only>
                const parentEl = this.closest('p, h3, div');
                if (
                    !parentEl ||
                    !parentEl.querySelector(
                        'span[data-template="strikethrough"]',
                    ) ||
                    parentEl.querySelector('.alt-aria-label')
                )
                    return true;
                const inlinePrices = parentEl?.querySelectorAll(
                    'span[is="inline-price"]',
                );
                if (
                    inlinePrices.length > 1 &&
                    inlinePrices.length ===
                        parentEl.querySelectorAll(
                            'span[data-template="strikethrough"]',
                        ).length *
                            2
                ) {
                    inlinePrices.forEach((price) => {
                        if (
                            price.dataset.template !== 'strikethrough' &&
                            price.options &&
                            !price.options.alternativePrice &&
                            !price.isFailed
                        ) {
                            price.options.alternativePrice = true;
                            price.innerHTML = service.buildPriceHTML(
                                offers,
                                price.options,
                            );
                        }
                    });
                }
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

// Define custom DOM element
if (!window.customElements.get(InlinePrice.is)) {
    window.customElements.define(InlinePrice.is, InlinePrice, {
        extends: InlinePrice.tag,
    });
}
