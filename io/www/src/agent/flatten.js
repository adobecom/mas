import { Defaults } from '../../../../web-components/src/defaults.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from '../../../../web-components/src/compat-version.js';
import { Price } from '../../../../web-components/src/price.js';
import { Wcs } from '../../../../web-components/src/wcs.js';

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
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/\s+/g, ' ')
            .trim() || null
    );
}

function extractTermsUrl(html) {
    if (!html) return null;
    const match = String(html).match(/href="([^"]*offer-terms[^"]*)"/i);
    return match ? match[1] : null;
}

function parseTags(tags) {
    const result = {};
    const omitted = new Set([
        'offer_type',
        'product_code',
        'cloud',
        'commitment',
        'product_line',
        'plan_type',
        'market_segments',
        'studio',
    ]);
    for (const tag of tags ?? []) {
        const match = /^mas:([^/]+)\/(.+)$/.exec(tag);
        if (match) {
            const key = match[1] === 'product' ? 'product_line' : match[1];
            if (omitted.has(key)) continue;
            result[key] = match[2];
        }
    }
    return result;
}

function parseAttributes(source) {
    const attributes = {};
    const pattern = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    for (const match of source.matchAll(pattern)) {
        attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
    }
    return attributes;
}

function extractElements(html) {
    const elements = [];
    const pattern = /<(span|a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    for (const match of String(html).matchAll(pattern)) {
        elements.push({
            tag: match[1].toLowerCase(),
            attributes: parseAttributes(match[2]),
            text: stripTags(match[3]) ?? '',
        });
    }
    return elements;
}

function extractInlinePrices(html) {
    const elements = [];
    const pattern = /<span\b([^>]*)>/gi;
    for (const match of String(html).matchAll(pattern)) {
        const attributes = parseAttributes(match[1]);
        if (attributes.is !== 'inline-price') continue;
        elements.push({
            tag: 'span',
            attributes,
            match,
            text: '',
        });
    }
    return elements;
}

function htmlSources(fragment) {
    return [...Object.values(fragment.fields), ...Object.values(fragment.settings)]
        .map((value) => (value && typeof value === 'object' && !Array.isArray(value) ? value.value : value))
        .filter((value) => typeof value === 'string' && value.includes('<'));
}

function toDataset(attributes) {
    return Object.fromEntries(
        Object.entries(attributes)
            .filter(([name]) => name.startsWith('data-'))
            .map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]),
    );
}

function createPriceRuntime(fragment) {
    const settings = {
        ...Defaults,
        ...(fragment?.settings ?? {}),
    };
    const startup = {
        literals: {
            price: fragment?.priceLiterals ?? {},
        },
        providers: {
            price: new Set(),
        },
        settings,
    };
    const price = Price(startup);
    const wcs = Wcs(startup);
    if (fragment?.wcs) wcs.prefillWcsCache(fragment.wcs);
    return {
        price,
        promotionCode: fieldValue(fragment?.fields, 'promoCode') ?? undefined,
        settings,
        useGlobalPromotionCode:
            fieldValue(fragment?.fields, 'compatVersion') >= COMPAT_VERSION_GLOBAL_PROMO_CODE ||
            Boolean(fragment?.promoProject),
        wcs,
    };
}

function renderedPriceInfo(html, valueHtml, legalHtml) {
    const textForClass = (source, className) => {
        const pattern = new RegExp(
            `<span\\b[^>]*class\\s*=\\s*(?:"[^"]*\\b${className}\\b[^"]*"|'[^']*\\b${className}\\b[^']*')[^>]*>([\\s\\S]*?)<\\/span>`,
            'i',
        );
        return stripTags(String(source).match(pattern)?.[1]) ?? undefined;
    };
    const priceTextForClass = (source, className) => textForClass(source, className);
    const legalTextForClass = (className) => textForClass(legalHtml, className);
    const taxText = legalTextForClass('price-tax-inclusivity') ?? priceTextForClass(html, 'price-tax-inclusivity');
    const unitText = legalTextForClass('price-unit-type') ?? priceTextForClass(html, 'price-unit-type');
    const strikethrough = priceTextForClass(valueHtml, 'price-strikethrough');
    const primary =
        priceTextForClass(valueHtml, 'price-alternative') ??
        priceTextForClass(valueHtml, 'price') ??
        stripTags(valueHtml) ??
        undefined;
    const renderedPrimary =
        priceTextForClass(html, 'price-alternative') ?? priceTextForClass(html, 'price') ?? stripTags(html) ?? undefined;
    const recurrenceText = renderedPrimary
        ?.replace(primary, '')
        .replace(taxText ?? '', '')
        .replace(unitText ?? '', '')
        .trim();

    return {
        value: primary,
        promoPrice: strikethrough && primary !== strikethrough ? primary : undefined,
        regularPrice: strikethrough ?? primary,
        annualPrice: priceTextForClass(valueHtml, 'price-annual'),
        planTypeText: legalTextForClass('price-plan-type'),
        taxText,
        recurrenceText: recurrenceText || undefined,
        unitText,
    };
}

async function hydrateInlinePrice(runtime, attributes) {
    const dataset = toDataset(attributes);
    const options = runtime.price.collectPriceOptions({
        ...runtime.settings,
        ...dataset,
        promotionCode: dataset.promotionCode || (runtime.useGlobalPromotionCode ? runtime.promotionCode : undefined),
        displayFormatted: false,
    });
    const offerGroups = await Promise.all(runtime.wcs.resolveOfferSelectors(options));
    const offers = offerGroups.flat();
    const html = runtime.price.buildPriceHTML(offers, options);
    const valueHtml = runtime.price.buildPriceHTML(offers, {
        ...options,
        displayRecurrence: false,
        displayPerUnit: false,
        displayTax: false,
    });
    const legalHtml = runtime.price.buildPriceHTML(offers, {
        ...options,
        template: 'legal',
    });
    return {
        html,
        price: {
            template: options.template ?? 'price',
            wcsOsi: attributes['data-wcs-osi'],
            promotionCode: options.promotionCode ?? offers[0]?.promotion?.promotionCode,
            ...renderedPriceInfo(html, valueHtml, legalHtml),
        },
    };
}

async function hydrateInlinePrices(html, runtime) {
    const prices = [];
    let hydrated = '';
    let cursor = 0;
    for (const element of extractInlinePrices(html)) {
        const match = element.match;
        const result = await hydrateInlinePrice(runtime, element.attributes);
        hydrated += String(html).slice(cursor, match.index);
        hydrated += result.html;
        cursor = match.index + match[0].length;
        prices.push(result.price);
    }
    hydrated += String(html).slice(cursor);
    return { html: hydrated, prices };
}

async function hydrateRecord(record, runtime, prices) {
    const hydrated = {};
    for (const [name, value] of Object.entries(record ?? {})) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value.value : value;
        if (typeof source !== 'string' || !source.includes('<')) {
            hydrated[name] = value;
            continue;
        }
        const result = await hydrateInlinePrices(source, runtime);
        prices.push(...result.prices);
        hydrated[name] =
            value && typeof value === 'object' && !Array.isArray(value) ? { ...value, value: result.html } : result.html;
    }
    return hydrated;
}

function ctaInfo(element) {
    if (!element) return;
    const attributes = {
        href: element.attributes['data-href'],
        ...element.attributes,
    };
    return {
        analyticsId: attributes['data-analytics-id'],
        href: attributes.href,
        text: element.text,
    };
}

function authoredText(elements, className) {
    return elements.find((element) => element.attributes.class?.split(/\s+/).includes(className))?.text;
}

async function extractMerchCard(fragment) {
    const runtime = createPriceRuntime(fragment);
    const prices = [];
    const fields = await hydrateRecord(fragment?.fields, runtime, prices);
    const settings = await hydrateRecord(fragment?.settings, runtime, prices);
    const hydratedFragment = { ...fragment, fields, settings };
    const elements = htmlSources(hydratedFragment).flatMap(extractElements);
    const mainPrice = prices.find((price) => price.template === 'price');
    const seeTerms = elements.find(
        (element) =>
            element.tag === 'a' &&
            (element.attributes.is === 'upt-link' || element.attributes.class?.split(/\s+/).includes('upt-link')),
    );
    return {
        title: stripTags(fieldValue(fields, 'cardTitle')) ?? undefined,
        subtitle: stripTags(fieldValue(fields, 'subtitle')) ?? undefined,
        promoText: stripTags(fieldValue(fields, 'promoText')) ?? undefined,
        description: stripTags(fieldValue(fields, 'description')) ?? undefined,
        shortDescription: stripTags(fieldValue(fields, 'shortDescription')) ?? undefined,
        callout: stripTags(fieldValue(fields, 'callout')) ?? undefined,
        promoPrice: mainPrice?.promoPrice,
        regularPrice: mainPrice?.regularPrice,
        annualPrice: mainPrice?.annualPrice,
        planTypeText: mainPrice?.planTypeText ?? authoredText(elements, 'price-plan-type'),
        taxText: mainPrice?.taxText ?? authoredText(elements, 'price-tax-inclusivity'),
        recurrenceText: mainPrice?.recurrenceText ?? authoredText(elements, 'price-recurrence'),
        unitText: mainPrice?.unitText ?? authoredText(elements, 'price-unit-type'),
        seeTermsInfo: ctaInfo(seeTerms),
        renewalText: authoredText(elements, 'renewal-text'),
        promoDurationText: authoredText(elements, 'promo-duration-text'),
    };
}

async function flattenOffer(fragment) {
    const fields = fragment?.fields ?? {};
    const ctas = fieldValue(fields, 'ctas');
    const merchCard = await extractMerchCard(fragment);
    return {
        fragment: fragment?.id ?? null,
        productName: (fieldValue(fields, 'cardTitle') || '').trim() || null,
        badge: stripTags(fieldValue(fields, 'badge')),
        cta_label: stripTags(ctas),
        terms_url: extractTermsUrl(fieldValue(fields, 'description')),
        ...parseTags(fields.tags),
        ...merchCard,
    };
}

export { extractMerchCard, flattenOffer };
