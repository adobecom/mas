/**
 * WCS (Web Commerce Service) Client
 * Resolves offer selector IDs to offer details via the web_commerce_artifact endpoint
 */
export class WCSClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://www.adobe.com/web_commerce_artifact';
        this.apiKey = config.apiKey || 'wcms-commerce-ims-ro-user-milo';
        this.landscape = config.landscape || 'PUBLISHED';
    }

    /**
     * Resolve an offer selector ID to get offer details
     * @param {string} offerSelectorId - The offer selector ID to resolve
     * @param {Object} options - Resolution options
     * @param {string} options.country - Country code (default: 'US')
     * @param {string} options.language - Language code (default: 'en')
     * @param {string} options.promotionCode - Optional promotion code
     * @returns {Promise<Object>} Resolved offer details
     */
    async resolveOfferSelector(offerSelectorId, options = {}) {
        const { country = 'US', language = 'en', promotionCode } = options;

        const url = new URL(this.baseUrl);
        url.searchParams.set('offer_selector_ids', offerSelectorId);
        url.searchParams.set('country', country);
        url.searchParams.set('locale', `${language}_${country}`);
        url.searchParams.set('landscape', this.landscape);
        url.searchParams.set('api_key', this.apiKey);
        url.searchParams.set('language', 'MULT');

        if (promotionCode) {
            url.searchParams.set('promotion_code', promotionCode);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => response.statusText);
            throw new Error(`WCS request failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const offers = data.resolvedOffers || [];

        if (offers.length === 0) {
            throw new Error(`No offers found for offer selector: ${offerSelectorId}`);
        }

        return {
            offerSelectorId,
            offers: offers.map((offer) => this.enrichOffer(offer)),
            raw: data,
        };
    }

    /**
     * Enrich offer with computed fields
     */
    enrichOffer(offer) {
        return {
            ...offer,
            planType: this.calculatePlanType(offer.commitment, offer.term),
        };
    }

    /**
     * Calculate plan type from commitment and term
     */
    calculatePlanType(commitment, term) {
        if (commitment === 'YEAR' && term === 'MONTHLY') return 'ABM';
        if (commitment === 'YEAR' && term === 'ANNUAL') return 'PUF';
        if (commitment === 'MONTH' && term === 'MONTHLY') return 'M2M';
        if (commitment === 'PERPETUAL') return 'PERPETUAL';
        if (commitment === 'TERM_LICENSE' && term === 'P3Y') return 'P3Y';
        return 'UNKNOWN';
    }

    /**
     * Get checkout URL for an offer selector
     */
    getCheckoutUrl(offerSelectorId, options = {}) {
        const baseUrl = 'https://commerce.adobe.com/checkout';
        const params = new URLSearchParams({ osi: offerSelectorId, ...options });
        return `${baseUrl}?${params.toString()}`;
    }
}
