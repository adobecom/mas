const AOS_BASE_URLS = {
    PRODUCTION: 'https://aos.adobe.io',
    STAGE: 'https://aos-stage.adobe.io',
    LOCAL: 'http://localhost:3001',
};

function getBaseUrl(env, baseUrl) {
    if (baseUrl) return baseUrl;
    return AOS_BASE_URLS[env] || AOS_BASE_URLS.STAGE;
}

function buildHeaders({ accessToken, apiKey }) {
    const headers = {};
    if (apiKey) headers['X-Api-Key'] = apiKey;
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
}

function toSearchParams(params) {
    const filtered = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            filtered[key] = typeof value === 'boolean' ? String(value) : value;
        }
    }
    return new URLSearchParams(filtered).toString();
}

export async function searchOffers(params, config) {
    const {
        arrangementCode,
        buyingProgram,
        commitment,
        country,
        customerSegment,
        language,
        marketSegment,
        merchant,
        offerType,
        pricePoint,
        salesChannel,
        serviceProviders,
        term,
    } = params;

    const {
        accessToken,
        apiKey,
        baseUrl,
        env = 'PRODUCTION',
        environment = 'PRODUCTION',
        landscape = 'PUBLISHED',
        pageSize = 20,
        page = 0,
    } = config;

    const queryParams = {
        arrangement_code: Array.isArray(arrangementCode)
            ? arrangementCode.join(',')
            : arrangementCode,
        buying_program: buyingProgram,
        commitment,
        country,
        customer_segment: customerSegment,
        language,
        market_segment: marketSegment,
        merchant,
        offer_type: offerType,
        price_point: Array.isArray(pricePoint)
            ? pricePoint.join(',')
            : pricePoint,
        sales_channel: salesChannel,
        service_providers: Array.isArray(serviceProviders)
            ? serviceProviders.join(',')
            : serviceProviders,
        term,
        api_key: apiKey,
        environment,
        landscape,
        page,
        page_size: pageSize,
    };

    const base = getBaseUrl(env, baseUrl);
    const url = `${base}/offers?${toSearchParams(queryParams)}`;

    const response = await fetch(url, {
        headers: buildHeaders({ accessToken, apiKey }),
        mode: 'cors',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `AOS searchOffers failed (${response.status}): ${message}`,
        );
    }

    const json = await response.json();
    return { data: json };
}

export async function getOfferById(offerId, country, config) {
    const {
        accessToken,
        apiKey,
        baseUrl,
        env = 'PRODUCTION',
        environment = 'PRODUCTION',
        landscape = 'PUBLISHED',
    } = config;

    const base = getBaseUrl(env, baseUrl);
    const queryParams = {
        offer_id: offerId,
        country,
        api_key: apiKey,
        environment,
        landscape,
    };
    const url = `${base}/offers?${toSearchParams(queryParams)}`;

    const response = await fetch(url, {
        headers: buildHeaders({ accessToken, apiKey }),
        mode: 'cors',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `AOS getOfferById failed (${response.status}): ${message}`,
        );
    }

    return response.json();
}

export async function getOfferSelector(id, config) {
    const {
        accessToken,
        apiKey,
        baseUrl,
        env = 'PRODUCTION',
    } = config;

    const base = getBaseUrl(env, baseUrl);
    const queryParams = { api_key: apiKey };
    const url = `${base}/offer_selectors/${encodeURIComponent(id)}?${toSearchParams(queryParams)}`;

    const response = await fetch(url, {
        headers: buildHeaders({ accessToken, apiKey }),
        mode: 'cors',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `AOS getOfferSelector failed (${response.status}): ${message}`,
        );
    }

    return response.json();
}

export async function resolveOfferSelector(offer, config) {
    if (offer.offer_type?.startsWith('fake-')) return offer.offer_type;
    const params = {
        product_arrangement_code: offer.product_arrangement_code,
        buying_program: offer.buying_program,
        commitment: offer.commitment,
        term: offer.term,
        customer_segment: offer.customer_segment,
        market_segment: Array.isArray(offer.market_segments)
            ? offer.market_segments[0]
            : offer.market_segments,
        sales_channel: offer.sales_channel,
        offer_type: offer.offer_type,
        price_point: offer.price_point,
        merchant: offer.merchant,
    };
    const { data: { id } } = await createOfferSelector(params, config);
    return id;
}

export async function createOfferSelector(params, config) {
    const {
        accessToken,
        apiKey,
        baseUrl,
        env = 'PRODUCTION',
    } = config;

    const base = getBaseUrl(env, baseUrl);
    const queryParams = { api_key: apiKey };
    const url = `${base}/offer_selectors?${toSearchParams(queryParams)}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            ...buildHeaders({ accessToken, apiKey }),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        mode: 'cors',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `AOS createOfferSelector failed (${response.status}): ${message}`,
        );
    }

    const json = await response.json();
    return { data: json };
}
