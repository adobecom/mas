const DEFAULT_AOS_PARAMS = {
    buyingProgram: 'RETAIL',
    merchant: 'ADOBE',
    salesChannel: 'DIRECT',
};

/**
 * AOS (Adobe Offer System) Client
 * Handles offer search, retrieval, and offer selector operations
 */
export class AOSClient {
    constructor(authManager, config) {
        this.authManager = authManager;
        this.baseUrl = config.baseUrl || 'https://aos.adobe.io';
        this.apiKey = config.apiKey;
        this.landscape = config.landscape || 'PUBLISHED';
        this.environment = config.environment || 'PRODUCTION';
    }

    /**
     * Search offers via the legacy GET /offers endpoint that AOS actually
     * honours for product-arrangement-code lookups. The v3 POST path is
     * undocumented for arbitrary searches and silently returns empty when
     * service_providers/environment/landscape aren't set, so we mirror the
     * working pattern from mas-ost (src/utils/aos-client.js): GET, snake_case
     * query string, environment=PROD, landscape=PUBLISHED, comma-joined
     * arrangement_code, service_providers=PRICING.
     *
     * Returns an empty array on 404 and on missing-data so callers can render
     * a clean "no offers" state without failing the request.
     */
    async searchOffers(params) {
        const authHeader = await this.authManager.getAuthHeader();

        const arrangementCodes = Array.isArray(params.arrangementCode)
            ? params.arrangementCode.join(',')
            : params.arrangementCode;
        const pricePoint = Array.isArray(params.pricePoint) ? params.pricePoint.join(',') : params.pricePoint;

        const queryParams = {
            arrangement_code: arrangementCodes,
            buying_program: DEFAULT_AOS_PARAMS.buyingProgram,
            commitment: params.commitment,
            country: params.country || 'US',
            customer_segment: params.customerSegment,
            language: params.language || 'MULT',
            market_segment: params.marketSegment,
            merchant: DEFAULT_AOS_PARAMS.merchant,
            offer_type: params.offerType,
            price_point: pricePoint,
            sales_channel: DEFAULT_AOS_PARAMS.salesChannel,
            service_providers: 'PRICING',
            term: params.term,
            api_key: this.apiKey,
            environment: 'PROD',
            landscape: 'PUBLISHED',
            page: '0',
            page_size: '1000',
        };

        const filtered = {};
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined && value !== null && value !== '') {
                filtered[key] = String(value);
            }
        }
        const url = `${this.baseUrl}/offers?${new URLSearchParams(filtered).toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'X-Api-Key': this.apiKey,
                'x-api-key': this.apiKey,
            },
        });

        if (response.status === 404) {
            return [];
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`AOS search failed: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        return this.enrichOffersWithPlanType(list);
    }

    async getOffer(offerId, country) {
        const authHeader = await this.authManager.getAuthHeader();

        // AOS's legacy GET /offers is the shape OST's browser client uses
        // successfully. It requires a specific query signature: environment=PROD
        // (not PRODUCTION), plus buying_program/merchant/sales_channel/
        // service_providers to narrow the response. We query by offer_id
        // directly and iterate (landscape × country) for coverage. The v3
        // POST /v3/offers path is kept as a fallback for offers not in the
        // legacy index.
        const countries = ['US', country, 'CA', 'IN', 'GB', 'DE', 'FR', 'JP', 'AU'].filter(
            (c, i, arr) => c && arr.indexOf(c) === i,
        );
        const landscapes = ['PUBLISHED', 'DRAFT'];

        let lastError = null;
        let lastStatus = 0;

        // Attempt 1: legacy GET — AOS expects environment=PROD, with the
        // buying_program/merchant/sales_channel/service_providers quartet
        // that OST's aos-client passes.
        for (const landscape of landscapes) {
            for (const c of countries) {
                const params = new URLSearchParams({
                    offer_id: offerId,
                    buying_program: 'RETAIL',
                    country: c,
                    language: 'MULT',
                    merchant: 'ADOBE',
                    sales_channel: 'DIRECT',
                    service_providers: 'PRICING',
                    api_key: this.apiKey,
                    environment: 'PROD',
                    landscape,
                    page: '0',
                    page_size: '100',
                });
                const url = `${this.baseUrl}/offers?${params.toString()}`;
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            Authorization: authHeader,
                            'X-Api-Key': this.apiKey,
                            'x-api-key': this.apiKey,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const list = Array.isArray(data) ? data : data?.data || [];
                        // Exact match only — AOS ignores unknown offer_id
                        // filters and returns an unfiltered list, so taking
                        // list[0] would fabricate a wrong answer.
                        const match = list.find((o) => o.offer_id === offerId);
                        if (match) return this.enrichOffersWithPlanType([match])[0];
                    } else {
                        lastStatus = response.status;
                        if (response.status !== 404) {
                            lastError = await response.json().catch(() => ({ message: response.statusText }));
                        }
                    }
                } catch (err) {
                    lastError = err;
                }
            }
        }

        // Attempt 2: v3 POST as a fallback.
        for (const c of countries) {
            const searchParams = {
                offer_ids: [offerId],
                country: c,
            };
            try {
                const response = await fetch(`${this.baseUrl}/v3/offers`, {
                    method: 'POST',
                    headers: {
                        Authorization: authHeader,
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                    },
                    body: JSON.stringify(searchParams),
                });
                if (response.ok) {
                    const data = await response.json();
                    const offers = this.enrichOffersWithPlanType(data.data || []);
                    if (offers.length) return offers[0];
                } else if (response.status !== 404) {
                    lastError = await response.json().catch(() => ({ message: response.statusText }));
                }
            } catch (err) {
                lastError = err;
            }
        }

        console.error('[AOS] getOffer failed', { offerId, lastStatus, lastError: JSON.stringify(lastError) });
        throw new Error(`Failed to get offer: ${lastError?.message || `Offer ${offerId} not found`}`);
    }

    async createOfferSelector(offerParams) {
        const authHeader = await this.authManager.getAuthHeader();

        const params = {
            ...DEFAULT_AOS_PARAMS,
            ...offerParams,
            market_segments: [offerParams.market_segment],
        };

        delete params.market_segment;

        const url = `${this.baseUrl}/v3/offer-selectors`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to create offer selector: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        return { id: data.data.id };
    }

    async resolveOfferSelector(offerSelectorId, country) {
        // AOS has no GET-selector-by-id route (`/offer_selectors/{id}` and
        // `/v3/offer-selectors/{id}` both 404 at the proxy). The supported way
        // to resolve an OSI is the same GET /offers endpoint used for search,
        // filtered by offer_selector_ids — it returns the full offer set with
        // merchandising copy, arrangement code, and pricing in one call.
        const authHeader = await this.authManager.getAuthHeader();
        const params = new URLSearchParams({
            offer_selector_ids: offerSelectorId,
            country: country || 'US',
            locale: 'en_US',
            service_providers: 'MERCHANDISING,PRODUCT_ARRANGEMENT_V2,PRICING',
            api_key: this.apiKey,
        });
        const url = `${this.baseUrl}/offers?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'X-Api-Key': this.apiKey,
                'x-api-key': this.apiKey,
            },
        });

        if (response.status === 404) {
            return [];
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to resolve offer selector: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        const offers = Array.isArray(data) ? data : data?.data || [];
        if (offers.length === 0) {
            // OST occasionally populates data-wcs-osi with a 32-char hex
            // Offer ID instead of a selector ID (draft/unindexed offers).
            // If the OSI query matched nothing and the ID has the canonical
            // Offer ID form, fall back to a direct offer lookup.
            if (/^[0-9A-F]{32}$/.test(offerSelectorId)) {
                const offer = await this.getOffer(offerSelectorId, country).catch(() => null);
                if (offer) return [offer];
            }
            return [];
        }
        return this.enrichOffersWithPlanType(offers);
    }

    enrichOffersWithPlanType(offers) {
        return offers.map((offer) => ({
            ...offer,
            planType: this.calculatePlanType(offer.commitment, offer.term),
        }));
    }

    calculatePlanType(commitment, term) {
        if (commitment === 'YEAR' && term === 'MONTHLY') {
            return 'ABM';
        }
        if (commitment === 'YEAR' && term === 'ANNUAL') {
            return 'PUF';
        }
        if (commitment === 'MONTH' && term === 'MONTHLY') {
            return 'M2M';
        }
        if (commitment === 'PERPETUAL') {
            return 'PERPETUAL';
        }
        if (commitment === 'TERM_LICENSE' && term === 'P3Y') {
            return 'P3Y';
        }
        return 'UNKNOWN';
    }

    getCheckoutUrl(offerSelectorId, options = {}) {
        const baseUrl = 'https://commerce.adobe.com/checkout';
        const params = new URLSearchParams({
            osi: offerSelectorId,
            ...options,
        });

        return `${baseUrl}?${params.toString()}`;
    }
}
