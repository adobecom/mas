import { isOfferId, isOfferSelectorId } from '../utils/offer-utils.js';
import { getOfferSelector, getOfferById } from '../utils/aos-client.js';
import { store } from '../store/ost-store.js';

export class SearchController {
    host;
    query = '';
    resultType = '';
    debounceTimer = null;

    constructor(host) {
        this.host = host;
        host.addController(this);
    }

    hostConnected() {}

    hostDisconnected() {
        clearTimeout(this.debounceTimer);
    }

    detectType(value) {
        if (isOfferId(value)) return 'offer';
        if (isOfferSelectorId(value)) return 'osi';
        return 'product';
    }

    handleInput(value) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.query = value;
            this.resultType = this.detectType(value);
            store.setSearch(value, this.resultType);
            this.host.requestUpdate();

            if (this.resultType === 'osi') {
                this.resolveOsi(value);
            } else if (this.resultType === 'offer') {
                this.resolveOfferId(value);
            }
        }, 250);
    }

    async resolveOsi(osi) {
        try {
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
            };
            const result = await getOfferSelector(osi, config);
            const code = result?.product_arrangement_code
                || result?.arrangement_code;
            if (code) {
                this.selectProductByCode(code);
                store.setOsi(osi);
            }
        } catch {
            /* OSI resolution failed */
        }
    }

    async resolveOfferId(offerId) {
        try {
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
                environment: store.environment,
                landscape: store.landscape,
            };
            const offers = await getOfferById(offerId, store.country, config);
            const offer = Array.isArray(offers) ? offers[0] : null;
            const code = offer?.product_arrangement_code;
            if (code) {
                store.setSearch(code, 'product');
                store.setAosParams({
                    customerSegment: offer.customer_segment,
                    marketSegment: Array.isArray(offer.market_segments)
                        ? offer.market_segments[0]
                        : offer.market_segment,
                    offerType: offer.offer_type,
                    commitment: offer.commitment,
                    term: offer.term,
                });
                this.selectProductByCode(code);
            }
        } catch {
            /* offer ID resolution failed */
        }
    }

    selectProductByCode(code) {
        const products = store.allProducts;
        for (const entry of products) {
            const product = Array.isArray(entry) ? entry[1] : entry;
            const productCode = product.arrangement_code || product.code || '';
            if (productCode === code) {
                store.setProduct(product);
                store.setAosParams({ arrangementCode: code });
                return;
            }
        }
    }
}
