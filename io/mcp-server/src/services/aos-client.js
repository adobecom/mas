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

    async searchOffers(params) {
        const authHeader = await this.authManager.getAuthHeader();

        const searchParams = {
            ...DEFAULT_AOS_PARAMS,
        };

        if (params.arrangementCode) {
            searchParams.product_arrangement_code = [params.arrangementCode];
        }

        if (params.commitment) {
            searchParams.commitment = params.commitment;
        }

        if (params.term) {
            searchParams.term = params.term;
        }

        if (params.customerSegment) {
            searchParams.customer_segment = params.customerSegment;
        }

        if (params.marketSegment) {
            searchParams.market_segment = params.marketSegment;
        }

        if (params.offerType) {
            searchParams.offer_type = params.offerType;
        }

        if (params.country) {
            searchParams.country = params.country;
        }

        if (params.language) {
            searchParams.language = params.language;
        }

        if (params.pricePoint) {
            searchParams.price_point = [params.pricePoint];
        }

        searchParams.country = params.country || 'US';

        const url = `${this.baseUrl}/v3/offers`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
            },
            body: JSON.stringify(searchParams),
        });

        if (response.status === 404) {
            return [];
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`AOS search failed: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        return this.enrichOffersWithPlanType(data.data || []);
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
                        const match = list.find((o) => o.offer_id === offerId) || list[0];
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

    async getOfferSelector(offerSelectorId, country) {
        // AOS GET for an OSI has two accepted path shapes depending on the
        // deployment: `/offer_selectors/{id}` (legacy, underscore path — used
        // by the MAS OST browser client) and `/v3/offer-selectors/{id}`
        // (v3 API, hyphenated). The same aos.adobe.io host serves both but
        // not all OSIs are indexed on both endpoints, so we try legacy first
        // (it's the shape that works for the OSIs our UI surfaces). We also
        // iterate (landscape × country) to cover DRAFT + PUBLISHED across
        // storefronts. Stops on first 200; propagates non-404 errors.
        const authHeader = await this.authManager.getAuthHeader();
        const encodedId = encodeURIComponent(offerSelectorId);

        const countryAttempts = [null];
        const countryCandidates = [country, 'US', 'CA', 'IN', 'GB', 'DE', 'FR', 'JP', 'AU', 'ES', 'IT', 'NL', 'BR', 'MX'];
        const seenCountry = new Set();
        for (const c of countryCandidates) {
            if (!c || seenCountry.has(c)) continue;
            seenCountry.add(c);
            countryAttempts.push(c);
        }

        const landscapeAttempts = [null, 'PUBLISHED', 'DRAFT'];
        const pathShapes = [`${this.baseUrl}/offer_selectors/${encodedId}`, `${this.baseUrl}/v3/offer-selectors/${encodedId}`];

        let lastStatus = 0;
        let lastError = null;
        const tried = [];
        for (const pathBase of pathShapes) {
            for (const landscape of landscapeAttempts) {
                for (const countryCode of countryAttempts) {
                    const params = new URLSearchParams({ api_key: this.apiKey });
                    if (countryCode) params.set('country', countryCode);
                    if (landscape) params.set('landscape', landscape);
                    const url = `${pathBase}?${params.toString()}`;
                    let response;
                    try {
                        response = await fetch(url, {
                            method: 'GET',
                            headers: {
                                Authorization: authHeader,
                                'X-Api-Key': this.apiKey,
                                'x-api-key': this.apiKey,
                            },
                        });
                    } catch (err) {
                        lastError = err;
                        tried.push(
                            `${pathBase.includes('/v3/') ? 'v3' : 'legacy'}/${landscape || '-'}/${countryCode || '-'}:net`,
                        );
                        continue;
                    }
                    if (response.ok) {
                        const data = await response.json();
                        return data.data || data;
                    }
                    lastStatus = response.status;
                    lastError = await response.json().catch(async () => {
                        const text = await response.text().catch(() => response.statusText);
                        return { message: text };
                    });
                    tried.push(
                        `${pathBase.includes('/v3/') ? 'v3' : 'legacy'}/${landscape || '-'}/${countryCode || '-'}:${response.status}`,
                    );
                    if (response.status !== 404) {
                        throw new Error(`Failed to get offer selector: ${lastError.message || response.statusText}`);
                    }
                }
            }
        }
        console.error(`[AOS] OSI ${offerSelectorId} not found. Attempts:`, tried.join(', '));
        console.error('[AOS] last error body:', JSON.stringify(lastError));
        const msg = lastError?.message || (lastStatus === 404 ? 'Not Found' : 'Unknown error');
        throw new Error(`Failed to get offer selector: ${msg}`);
    }

    async resolveOfferSelector(offerSelectorId, country) {
        try {
            const selector = await this.getOfferSelector(offerSelectorId, country);
            const offers = await this.searchOffers({
                arrangementCode: selector.product_arrangement_code,
                commitment: selector.commitment,
                term: selector.term,
                customerSegment: selector.customer_segment,
                marketSegment: selector.market_segment,
                offerType: selector.offer_type,
                country: country || 'US',
            });
            return offers;
        } catch (err) {
            // OST occasionally populates data-wcs-osi with a 32-char hex
            // Offer ID instead of a selector ID (draft/unindexed offers). If
            // the selector lookup 404s across every shape and the ID matches
            // the canonical Offer ID form, fall back to getOffer.
            const isOfferIdShape = /^[0-9A-F]{32}$/.test(offerSelectorId);
            const is404 = /not found/i.test(err?.message || '');
            if (!isOfferIdShape || !is404) throw err;
            const offer = await this.getOffer(offerSelectorId, country);
            return [offer];
        }
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
