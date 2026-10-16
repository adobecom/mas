const AOS_BASE = 'https://aos.adobe.io';
const WCS_BASE = 'https://www.adobe.com/web_commerce_artifact';
const AOS_API_KEY = 'aos';
const WCS_API_KEY = 'wcms-commerce-ims-ro-user-milo';
const TIMEOUT_MS = 5000;

const REQUIRED_PARAMS = ['offerID', 'country', 'locale'];

function normalizeLocale(locale) {
    const [lang, region] = locale.replace('-', '_').split('_');
    return region ? `${lang.toLowerCase()}_${region.toUpperCase()}` : lang.toLowerCase();
}

function decodeHtmlEntities(str) {
    if (!str) return str;
    return str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

async function timeoutFetch(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}

async function getAosOffer(offerID, country, locale) {
    const url = new URL(`${AOS_BASE}/offers/${offerID}`);
    url.searchParams.set('service_providers', 'MERCHANDISING,PRICING');
    url.searchParams.set('locale', locale);
    url.searchParams.set('country', country);
    url.searchParams.set('api_key', AOS_API_KEY);
    const response = await timeoutFetch(url.toString());
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
}

async function getOsi(aosOffer, accessToken) {
    const body = {
        product_arrangement_code: aosOffer.product_arrangement_code,
        buying_program: aosOffer.buying_program,
        commitment: aosOffer.commitment,
        term: aosOffer.term,
        customer_segment: aosOffer.customer_segment,
        market_segment: Array.isArray(aosOffer.market_segments)
            ? aosOffer.market_segments[0]
            : aosOffer.market_segments,
        sales_channel: aosOffer.sales_channel,
        offer_type: aosOffer.offer_type,
        price_point: aosOffer.price_point,
        merchant: aosOffer.merchant,
    };
    const response = await timeoutFetch(`${AOS_BASE}/offer_selectors?api_key=${AOS_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.id ?? null;
}

async function getWcsOffer(osi, country, locale, promotionCode) {
    const url = new URL(WCS_BASE);
    url.searchParams.set('offer_selector_ids', osi);
    url.searchParams.set('country', country);
    url.searchParams.set('locale', locale);
    url.searchParams.set('landscape', 'PUBLISHED');
    url.searchParams.set('api_key', WCS_API_KEY);
    url.searchParams.set('language', country === 'GB' ? 'en' : 'MULT');
    if (promotionCode) url.searchParams.set('promotion_code', promotionCode);
    const response = await timeoutFetch(url.toString());
    if (!response.ok) return null;
    const data = await response.json();
    return data?.resolvedOffers?.[0] ?? null;
}

function buildCartUrl(offerId, country, locale, productArrangementCode, marketSegment, offerType, customerSegment, promotionCode) {
    const lang = locale.split(/[-_]/)[0];
    const url = new URL('https://commerce.adobe.com/store/recommendation');
    url.searchParams.set('items[0][id]', offerId);
    url.searchParams.set('items[0][q]', '1');
    url.searchParams.set('cli', 'creative');
    url.searchParams.set('co', country);
    url.searchParams.set('lang', lang);
    if (marketSegment) url.searchParams.set('ms', marketSegment);
    if (offerType) url.searchParams.set('ot', offerType);
    if (customerSegment) url.searchParams.set('cs', customerSegment);
    url.searchParams.set('pa', productArrangementCode);
    if (promotionCode) url.searchParams.set('apc', promotionCode);
    url.searchParams.set('rrItems[0][id]', offerId);
    url.searchParams.set('rrItems[0][q]', '1');
    return url.toString();
}

export async function main(params) {
    const missing = REQUIRED_PARAMS.filter((p) => !params[p]);
    if (missing.length) {
        return { statusCode: 400, body: { error: `Missing required parameters: ${missing.join(', ')}` } };
    }

    const accessToken = params.AOS_ACCESS_TOKEN ?? process.env.AOS_ACCESS_TOKEN;
    if (!accessToken) {
        return { statusCode: 500, body: { error: 'AOS_ACCESS_TOKEN not configured' } };
    }

    const { offerID, country, promotionCode } = params;
    const locale = normalizeLocale(params.locale);

    const aosOffer = await getAosOffer(offerID, country, locale);
    if (!aosOffer) {
        return { statusCode: 404, body: { error: 'Offer not found' } };
    }

    const osi = await getOsi(aosOffer, accessToken);
    if (!osi) {
        return { statusCode: 404, body: { error: 'No offer selector found' } };
    }

    const wcsOffer = await getWcsOffer(osi, country, locale, promotionCode);
    if (!wcsOffer) {
        return { statusCode: 404, body: { error: 'No pricing data found' } };
    }

    const { offerId, priceDetails, priceInfo, promotion, offerType, customerSegment, marketSegments, productArrangementCode } = wcsOffer;

    const hasPromo = !!priceDetails?.priceWithoutDiscount;
    const regularPriceRaw = hasPromo ? priceDetails.priceWithoutDiscount : (priceDetails?.price ?? 0);
    const discountedPriceRaw = hasPromo ? priceDetails.price : 0;
    const percentOff = hasPromo && regularPriceRaw > 0
        ? Math.round((regularPriceRaw - discountedPriceRaw) / regularPriceRaw * 100)
        : 0;

    const regularPrice = decodeHtmlEntities(priceInfo?.priceWithoutDiscount ?? priceInfo?.price ?? null);
    const discountedPrice = hasPromo ? decodeHtmlEntities(priceInfo?.price ?? null) : null;
    const resolvedPromoCode = promotionCode ?? promotion?.promotionCode ?? null;

    return {
        statusCode: 200,
        body: {
            productName: aosOffer?.merchandising?.copy?.name ?? null,
            percentOff,
            strikethroughPrice: regularPrice,
            destinationUrl: buildCartUrl(
                offerId,
                country,
                locale,
                productArrangementCode,
                marketSegments?.[0],
                offerType,
                customerSegment,
                resolvedPromoCode,
            ),
            regularPrice,
            discountedPrice,
            currency: aosOffer?.pricing?.currency?.code ?? null,
            offerStartDate: promotion?.start ?? null,
            offerEndDate: promotion?.end ?? null,
            offerType: offerType ?? null,
            promoType: promotion?.promotionCode ?? promotionCode ?? null,
        },
    };
}
