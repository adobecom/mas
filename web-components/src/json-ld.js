function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

function getPageUrl(pageUrl) {
    return pageUrl.split('?')[0];
}

function getBillingDuration(commitment, term) {
    if (term === 'ANNUAL') return 'P1Y';
    if (commitment === 'PERPETUAL') return 'P1Y';
    return 'P1M';
}

function buildImage(mnemonicIcon) {
    if (!Array.isArray(mnemonicIcon) || mnemonicIcon.length === 0)
        return undefined;
    const suffix = '?format=png&width=800&height=800';
    if (mnemonicIcon.length === 1) return `${mnemonicIcon[0]}${suffix}`;
    return mnemonicIcon.map((icon) => `${icon}${suffix}`);
}

function getCurrencyCode(offer) {
    try {
        return JSON.parse(offer.analytics).currencyCode;
    } catch {
        return undefined;
    }
}

export function injectJsonLd(fields, offer, regularOffer, pageUrl) {
    if (!fields?.cardTitle || !offer) return null;

    const currency = getCurrencyCode(offer);
    if (!currency) return null;

    const { price } = offer?.priceDetails ?? {};
    if (price == null) return null;

    const url = getPageUrl(pageUrl);

    const dedupId = `json-ld-product-${url}`;
    if (document.head.querySelector(`script[data-id="${dedupId}"]`))
        return null;

    const priceStr = String(price);

    const priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: priceStr,
        priceCurrency: currency,
        billingDuration: getBillingDuration(offer.commitment, offer.term),
        billingIncrement: 1,
    };

    const regularPrice =
        offer?.priceDetails?.priceWithoutDiscount ??
        regularOffer?.priceDetails?.price;
    if (regularPrice != null && regularPrice !== price) {
        priceSpecification.priceWithoutDiscount = String(regularPrice);
    }

    const schemaOffer = {
        '@type': 'Offer',
        '@id': `${url}#offer`,
        url,
        priceCurrency: currency,
        price: priceStr,
        availability: 'https://schema.org/InStock',
        category: 'Subscription',
        seller: { '@id': 'https://www.adobe.com/#org' },
        itemOffered: { '@id': `${url}#product` },
        priceSpecification,
    };

    const image = buildImage(fields.mnemonicIcon);
    const description = fields.description?.value
        ? stripHtml(fields.description.value)
        : undefined;

    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        '@id': `${url}#product`,
        name: fields.cardTitle,
        brand: { '@type': 'Brand', name: 'Adobe' },
        offers: [schemaOffer],
    };

    if (description) jsonLd.description = description;
    if (image) jsonLd.image = image;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.id = dedupId;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return script;
}
