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

    /**
     * Fetch one offer by id.
     *
     * AOS does not filter by offer id on GET /offers. Measured 2026-09-02:
     * offer_id, offer_ids and offer_selector_ids are all ignored and the
     * endpoint answers with an unfiltered page, while POST /v3/offers is a 404.
     * arrangement_code is honoured, and asking by it returned 15 rows for one
     * product containing the wanted offer.
     *
     * So pass an arrangementCode whenever the caller has one: it turns a scan
     * of whatever AOS felt like returning into a real lookup. Without it we can
     * only page through the unfiltered list and hope the offer is on it, which
     * is why this used to report "not found" for offers that plainly exist.
     */
    async getOffer(offerId, country, { arrangementCode } = {}) {
        const authHeader = await this.authManager.getAuthHeader();

        const countries = ['US', country, 'CA', 'IN', 'GB', 'DE', 'FR', 'JP', 'AU'].filter(
            (c, i, arr) => c && arr.indexOf(c) === i,
        );
        const landscapes = ['PUBLISHED', 'DRAFT'];

        let lastError = null;
        let lastStatus = 0;
        let sawAnyOffer = false;

        for (const landscape of landscapes) {
            for (const c of countries) {
                const query = {
                    country: c,
                    api_key: this.apiKey,
                    environment: 'PROD',
                    landscape,
                    page: '0',
                    page_size: '100',
                };
                // Only narrow by something AOS honours. Do NOT add
                // buying_program/merchant/sales_channel here: those belong to
                // searchOffers, and on a lookup they excluded every offer
                // outside RETAIL and DIRECT.
                if (arrangementCode) {
                    query.arrangement_code = arrangementCode;
                    query.service_providers = 'PRICING';
                } else {
                    query.offer_id = offerId;
                }

                const url = `${this.baseUrl}/offers?${new URLSearchParams(query).toString()}`;
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
                        if (list.length) sawAnyOffer = true;
                        // Exact match only. Without an arrangement code this
                        // list is whatever AOS returned rather than a filtered
                        // result, so taking list[0] would fabricate an answer.
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

        console.error('[AOS] getOffer failed', {
            offerId,
            arrangementCode: arrangementCode ?? null,
            lastStatus,
            lastError: JSON.stringify(lastError),
        });
        if (!arrangementCode && sawAnyOffer) {
            // Be explicit that this was a scan, not a lookup, so the next
            // reader does not conclude the offer is missing from AOS.
            throw new Error(
                `Failed to get offer: AOS does not filter by offer id, and ${offerId} was not in the unfiltered results. ` +
                    'Retry with the product arrangement code.',
            );
        }
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
        let offers = Array.isArray(data) ? data : data?.data || [];

        // AOS ignores an offer_selector_ids filter it does not recognise and
        // answers with an unfiltered page, the same way it does for offer_id.
        // Verified against the live service: a mistyped OSI and the literal
        // string "THIS_IS_NOT_A_REAL_OSI_AT_ALL_1234567890xyz" both returned
        // the same 20 offers across 19 products. Callers read offers[0], so
        // that silently became a Creative Cloud EDU Team card for someone
        // asking about Firefly.
        //
        // The offers name no selector, so coherence is the only signal we have:
        // a selector resolves offers for ONE product arrangement (its base,
        // trial and term variants). Spanning several means the filter was
        // dropped. Answer empty — callers already handle that, and a wrong
        // offer here becomes a wrong card.
        if (offers.length > 1) {
            const products = new Set(offers.map((o) => o?.product_arrangement_code).filter(Boolean));
            if (products.size > 1) {
                offers = [];
            }
        }

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
