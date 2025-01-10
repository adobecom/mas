import fs from 'fs';
import fetch from 'node-fetch';
const offersEndpoint = (country, locale, landscape, page) =>
    `${process.env.AOS_URL}?country=${country}&merchant=ADOBE&service_providers=MERCHANDISING&locale=${locale}&api_key=${process.env.AOS_API_KEY}&landscape=${landscape}&page_size=100&page=${page}`;
const ABM = 'ABM';
const PUF = 'PUF';
const M2M = 'M2M';
const PERPETUAL = 'PERPETUAL';
const P3Y = 'P3Y';
const COMMITMENT_YEAR = 'YEAR';
const COMMITMENT_MONTH = 'MONTH';
const COMMITMENT_TERM_LICENSE = 'TERM_LICENSE';
const TERM_ANNUAL = 'ANNUAL';
const TERM_MONTHLY = 'MONTHLY';

const getPlanType = ({ commitment, term }) => {
    switch (commitment) {
        case undefined:
            return errorValueNotOffer;
        case '':
            return '';
        case COMMITMENT_YEAR:
            return term === TERM_MONTHLY
                ? ABM
                : term === TERM_ANNUAL
                  ? PUF
                  : '';
        case COMMITMENT_MONTH:
            return term === TERM_MONTHLY ? M2M : '';
        case PERPETUAL:
            return PERPETUAL;
        case COMMITMENT_TERM_LICENSE:
            return term === P3Y ? P3Y : '';
        default:
            return '';
    }
};

const KEY = {
    PA: 'product_arrangement_code',
};

const paginatedOffers = (allProducts, landscape, locale, page = 0) => {
    const [, country] = locale.split('_');
    return fetch(offersEndpoint(country, locale, landscape, page))
        .then((response) => response.json())
        .then((offers) => {
            console.log(`received ${landscape} - ${page}}`);
            if (offers && offers.length > 0) {
                const products = allProducts[landscape];
                for (const offer of offers) {
                    if (offer.term || offer.commitment === 'PERPETUAL') {
                        const pa = offer[KEY.PA];
                        let p = products[pa];
                        if (!p) {
                            p = products[pa] = {
                                name: offer.merchandising?.copy?.name,
                                arrangement_code: pa,
                                icon: offer.merchandising?.assets?.icons?.svg,
                                planTypes: {},
                                customerSegments: {},
                                marketSegments: {},
                            };
                        }
                        p.planTypes[getPlanType(offer)] = true;
                        p.customerSegments[offer.customer_segment] = true;
                        offer.market_segments.forEach(
                            (s) => (p.marketSegments[s] = true),
                        );
                    }
                }
                return paginatedOffers(allProducts, landscape, locale, ++page);
            } else {
                console.log(
                    `collected ${
                        Object.entries(allProducts[landscape]).length
                    } products for ${landscape}`,
                );
            }
        });
};

export default function getProductScript() {
    const options = [
        { locale: 'en_US', landscape: 'DRAFT' },
        { locale: 'en_US', landscape: 'PUBLISHED' },
        { locale: 'en_CA', landscape: 'DRAFT' },
        { locale: 'en_CA', landscape: 'PUBLISHED' },
    ];
    const allProducts = { DRAFT: {}, PUBLISHED: {} };
    const promises = options.map((option) => {
        console.log(
            `fetching ${option.landscape} products for locale: ${option.locale}`,
        );
        return paginatedOffers(allProducts, option.landscape, option.locale);
    });
    Promise.all(promises).then(() => {
        console.log('fetched all AOS responses, assembling...');
        const combinedProducts = allProducts.PUBLISHED;
        Object.keys(allProducts.DRAFT).forEach((pa) => {
            const draftOffer = allProducts.DRAFT[pa];
            if (!combinedProducts[pa]) {
                console.log(`found ${pa} to be draft`);
                combinedProducts[pa] = {
                    ...draftOffer,
                    draft: true,
                };
            } // merge planTypes, customerSegments and marketSegments for published and draft offers
            else if (
                JSON.stringify(combinedProducts[pa]) !==
                JSON.stringify(draftOffer)
            ) {
                console.log(
                    `found ${pa} to be draft, but there is already a published offer with the same PA.`,
                );
                combinedProducts[pa].planTypes = {
                    ...combinedProducts[pa].planTypes,
                    ...draftOffer.planTypes,
                };
                combinedProducts[pa].customerSegments = {
                    ...combinedProducts[pa].customerSegments,
                    ...draftOffer.customerSegments,
                };
                combinedProducts[pa].marketSegments = {
                    ...combinedProducts[pa].marketSegments,
                    ...draftOffer.marketSegments,
                };
            }
        });
        //write to file
        fs.writeFileSync(
            'studio/ost/products.js',
            `window.tacocat = window.tacocat || {};
            window.tacocat.products = ${JSON.stringify(combinedProducts, null, 2)};`,
        );
    });
}
