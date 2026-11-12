const stripHtml = (html) =>
    new DOMParser().parseFromString(html, 'text/html').body.textContent;

function buildImage(mnemonicIcon) {
    if (!Array.isArray(mnemonicIcon) || !mnemonicIcon.length) return undefined;
    // Schema.org image should be raster; Adobe CDN converts SVG icons via these params
    const images = mnemonicIcon.map(
        (icon) => `${icon}?format=png&width=800&height=800`,
    );
    return images.length === 1 ? images[0] : images;
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
    if (!currency) {
        console.warn(
            '[json-ld] No currency code found in offer analytics — JSON-LD injection skipped',
        );
        return null;
    }

    const { price, priceWithoutDiscount } = offer.priceDetails ?? {};
    if (price == null) return null;

    const url = pageUrl.split('?')[0];
    const dedupId = `json-ld-product-${url}`;
    // One JSON-LD product block per page URL by design — DA authors use a single signal link per page
    if (document.head.querySelector(`script[data-id="${dedupId}"]`))
        return null;

    let effectivePrice = price;
    let regularPrice =
        priceWithoutDiscount ?? regularOffer?.priceDetails?.price;
    // Two base offers: the lower price is the offer, the higher the regular one.
    if (
        priceWithoutDiscount == null &&
        regularPrice != null &&
        regularPrice < price
    ) {
        [effectivePrice, regularPrice] = [regularPrice, price];
    }

    const priceStr = String(effectivePrice);

    const priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: priceStr,
        priceCurrency: currency,
        billingDuration:
            offer.term === 'ANNUAL' || offer.commitment === 'PERPETUAL'
                ? 'P1Y'
                : 'P1M',
        billingIncrement: 1,
    };

    if (regularPrice != null && regularPrice !== effectivePrice) {
        priceSpecification.priceWithoutDiscount = String(regularPrice);
    }

    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        '@id': `${url}#product`,
        name: fields.cardTitle.value
            ? stripHtml(fields.cardTitle.value)
            : fields.cardTitle,
        brand: { '@type': 'Brand', name: 'Adobe' },
        offers: [
            {
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
            },
        ],
    };

    const description =
        fields.description?.value && stripHtml(fields.description.value);
    if (description) jsonLd.description = description;
    const image = buildImage(fields.mnemonicIcon);
    if (image) jsonLd.image = image;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.id = dedupId;
    script.textContent = JSON.stringify(jsonLd);
    document.head.append(script);
    return script;
}
