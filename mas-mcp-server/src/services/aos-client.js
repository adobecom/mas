import { AuthManager } from './auth-manager.js';
import { DEFAULT_AOS_PARAMS } from '../config/constants.js';

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
     * Search for offers
     */
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

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`AOS search failed: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        return this.enrichOffersWithPlanType(data.data || []);
    }

    /**
     * Get offer by ID
     */
    async getOffer(offerId, country) {
        const authHeader = await this.authManager.getAuthHeader();

        const searchParams = {
            offer_ids: [offerId],
            country: country || 'US',
        };

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

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to get offer: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        const offers = this.enrichOffersWithPlanType(data.data || []);

        if (offers.length === 0) {
            throw new Error(`Offer ${offerId} not found`);
        }

        return offers[0];
    }

    /**
     * Create or retrieve offer selector
     */
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

    /**
     * Get offer selector by ID
     */
    async getOfferSelector(offerSelectorId, country) {
        const authHeader = await this.authManager.getAuthHeader();

        const url = `${this.baseUrl}/v3/offer-selectors/${offerSelectorId}?country=${country || 'US'}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'x-api-key': this.apiKey,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to get offer selector: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    }

    /**
     * Resolve offers from offer selector
     */
    async resolveOfferSelector(offerSelectorId, country) {
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
    }

    /**
     * Enrich offers with plan type
     */
    enrichOffersWithPlanType(offers) {
        return offers.map((offer) => ({
            ...offer,
            planType: this.calculatePlanType(offer.commitment, offer.term),
        }));
    }

    /**
     * Calculate plan type from commitment and term
     */
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

    /**
     * Get formatted price for offer selector
     */
    async getFormattedPrice(offerSelectorId, options) {
        return 'Price formatting requires WCS integration';
    }

    /**
     * Get checkout URL for offer selector
     */
    getCheckoutUrl(offerSelectorId, options) {
        const baseUrl = 'https://commerce.adobe.com/checkout';
        const params = new URLSearchParams({
            osi: offerSelectorId,
            ...options,
        });

        return `${baseUrl}?${params.toString()}`;
    }
}
