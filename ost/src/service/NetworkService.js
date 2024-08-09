import { computePlanType } from '../utils/Utils.js';

export class NetworkService {
    constructor(accessToken, apiKey) {
        this.accessToken = accessToken;
        this.apiKey = apiKey;
    }

    // In the long run, we should get rid of loadScript approach and load the list of products 
    // from Sharepoint or Odin and have proper CORS support and use fetch
    loadScript(src) {
        return new Promise((resolve, reject) => {
            let script = document.querySelector(`head > script[src="${src}"]`);
            if (!script) {
                const { head } = document;
                script = document.createElement('script');
                script.setAttribute('src', src);
                script.setAttribute('type', 'text/javascript');
                head.append(script);
            }

            const onScriptLoad = () => {
                script.removeEventListener('load', onScriptLoad);
                script.removeEventListener('error', onScriptError);
                resolve(script);
            };

            const onScriptError = () => {
                script.removeEventListener('load', onScriptLoad);
                script.removeEventListener('error', onScriptError);
                reject(new Error(`error loading script: ${src}`));
            };

            script.addEventListener('load', onScriptLoad);
            script.addEventListener('error', onScriptError);
        });
    }

    async fetchProducts() {
        const PRODUCTS_ENDPOINT =
            'https://www.stage.adobe.com/special/tacocat/products.js';

        if (window?.tacocat?.products) {
            return Object.entries(window.tacocat.products);
        }

        const script = await this.loadScript(PRODUCTS_ENDPOINT);
        if (script) {
            return Object.entries(window.tacocat.products);
        } else {
            throw new Error(`error loading script: ${PRODUCTS_ENDPOINT}`);
        }
    }

    async fetchCountries() {
        const COUNTRIES_ENDPOINT =
            'https://countries-stage.adobe.io/v2/countries?api_key=dexter-commerce-offers';

        try {
            const response = await fetch(COUNTRIES_ENDPOINT);
            const data = await response.json();
            let result = data.map((obj) => {
                const id = obj['iso2-code'];
                return { id, name: id };
            });
            return result;
        } catch (error) {
            console.error('Error fetching countries', error);
        }
    }

    async fetchPaginatedOffers(allProducts, landscape, locale, page = 0) {
        const KEY = {
            PA: 'product_arrangement_code',
        };
        const [, country] = locale.split('_');
        const OFFERS_ENDPOINT = `https://aos.adobe.io/offers?country=${country}&merchant=ADOBE&service_providers=MERCHANDISING&locale=${locale}&api_key=YOUR_API_KEY&landscape=${landscape}&page_size=100&page=${page}`;

        try {
            const response = await fetch(OFFERS_ENDPOINT);
            if (!response.ok) {
                throw new Error(
                    `Network response failed with status: ${response.statusText}`,
                );
            }

            let offers;
            try {
                offers = await response.json();
            } catch (error) {
                throw new Error(
                    'Failed to parse JSON response, error is: ' + error.message,
                );
            }

            console.log(`received ${landscape} - ${page}`);
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
                        p.planTypes[computePlanType(offer)] = true;
                        p.customerSegments[offer.customer_segment] = true;
                        offer.market_segments.forEach(
                            (s) => (p.marketSegments[s] = true)
                        );
                    }
                }
                return await this.fetchPaginatedOffers(
                    allProducts,
                    landscape,
                    locale,
                    ++page,
                );
            } else {
                console.log(
                    `collected ${
                        Object.entries(allProducts[landscape]).length
                    } products for ${landscape}`,
                );
            }
        } catch (error) {
            console.error(`Failed to fetch paginated offers: ${error.message}`);
            throw error;
        }
    }
}
