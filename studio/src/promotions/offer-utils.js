import { ADOBE_PRODUCTS } from '../constants/adobe-products.js';

const PRODUCT_ICON_BASE_URL = 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg';

function formatOfferTagTitle(value) {
    if (value == null || value === '') return '';
    return String(value).toUpperCase();
}

/**
 * Builds mas tag entries from an OST offer payload.
 * @param {object} offer
 * @param {string} [productArrangementCode]
 * @returns {Array<{ id: string, title: string }>}
 */
export function buildOfferTags(offer, productArrangementCode) {
    const tags = [];
    const addTag = (category, value, displayValue) => {
        if (value == null || value === '') return;
        const normalized = String(value).toLowerCase();
        tags.push({
            id: `mas:${category}/${normalized}`,
            title: displayValue ?? formatOfferTagTitle(value),
        });
    };

    const arrangement = offer?.productArrangement ?? offer?.product_arrangement;
    const productCode = offer?.product_code ?? offer?.productCode ?? arrangement?.productCode ?? arrangement?.product_code;
    const productName =
        offer?.product_name ?? offer?.productName ?? arrangement?.productFamily ?? arrangement?.product_family ?? productCode;
    addTag('product_code', productCode, productName);
    addTag('product_arrangement', productArrangementCode, productArrangementCode);
    addTag('offer_type', offer?.offer_type ?? offer?.offerType);
    addTag('plan_type', offer?.planType ?? offer?.plan_type);
    addTag('customer_segment', offer?.customer_segment ?? offer?.customerSegment);
    const marketSegment = Array.isArray(offer?.market_segments)
        ? offer.market_segments[0]
        : (offer?.market_segments ?? offer?.market_segment ?? offer?.marketSegments?.[0] ?? offer?.marketSegment);
    addTag('market_segment', marketSegment);

    return tags;
}

/**
 * Resolves a mnemonic icon URL from an OST offer payload.
 * @param {object} offer
 * @returns {string|undefined}
 */
export function resolveOfferMnemonicIconUrl(offer) {
    if (offer?.icon) return offer.icon;
    if (offer?.productIcon) return offer.productIcon;

    const arrangement = offer?.productArrangement ?? offer?.product_arrangement;
    const code = String(
        offer?.product_code ?? offer?.productCode ?? arrangement?.productCode ?? arrangement?.product_code ?? '',
    ).toLowerCase();

    if (code) {
        const byId = ADOBE_PRODUCTS.find((product) => product.id === code || product.id.replace(/-/g, '') === code);
        if (byId) return `${PRODUCT_ICON_BASE_URL}/${byId.id}.svg`;

        const compactCode = code.replace(/[^a-z0-9]/g, '');
        const byCode = ADOBE_PRODUCTS.find((product) => product.name.toLowerCase().replace(/[^a-z0-9]/g, '') === compactCode);
        if (byCode) return `${PRODUCT_ICON_BASE_URL}/${byCode.id}.svg`;
    }

    const productName = String(
        offer?.product_name ?? offer?.productName ?? arrangement?.productFamily ?? arrangement?.product_family ?? '',
    )
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    if (productName) {
        const byProductName = ADOBE_PRODUCTS.find(
            (product) => product.name.toLowerCase().replace(/[^a-z0-9]/g, '') === productName,
        );
        if (byProductName) return `${PRODUCT_ICON_BASE_URL}/${byProductName.id}.svg`;
    }

    return undefined;
}
