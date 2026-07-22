function fieldValue(fields, name) {
    const value = fields?.[name];
    if (value && typeof value === 'object') return value.value ?? null;
    return value;
}

function stripTags(html) {
    if (!html) return null;
    return (
        String(html)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim() || null
    );
}

function extractAttr(html, attr) {
    if (!html) return null;
    const match = String(html).match(new RegExp(`${attr}="([^"]+)"`));
    return match ? match[1] : null;
}

function extractTermsUrl(html) {
    if (!html) return null;
    const match = String(html).match(/href="([^"]*offer-terms[^"]*)"/i);
    return match ? match[1] : null;
}

function parseTags(tags) {
    const result = {};
    for (const tag of tags ?? []) {
        const match = /^mas:([^/]+)\/(.+)$/.exec(tag);
        if (match) {
            const key = match[1] === 'product' ? 'product_line' : match[1];
            result[key] = match[2];
        }
    }
    return result;
}

function flattenOffer(fragment) {
    const fields = fragment?.fields ?? {};
    const prices = fieldValue(fields, 'prices');
    const ctas = fieldValue(fields, 'ctas');
    return {
        fragment: fragment?.id ?? null,
        productName: (fieldValue(fields, 'cardTitle') || '').trim() || null,
        template: fieldValue(fields, 'variant') ?? null,
        badge: stripTags(fieldValue(fields, 'badge')),
        cta_label: stripTags(ctas),
        wcs_osi: extractAttr(prices, 'data-wcs-osi'),
        checkout_osi: extractAttr(ctas, 'data-wcs-osi'),
        terms_url: extractTermsUrl(fieldValue(fields, 'description')),
        promotion_code: extractAttr(prices, 'data-promotion-code'),
        ...parseTags(fields.tags),
    };
}

export { flattenOffer };
