import { Defaults } from '../../../../web-components/src/defaults.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from '../../../../web-components/src/compat-version.js';
import { FF_DEFAULTS } from '../../../../web-components/src/constants.js';
import { resolvePriceOffers } from '../../../../web-components/src/inline-price.js';
import { Price } from '../../../../web-components/src/price.js';
import { Wcs } from '../../../../web-components/src/wcs.js';
import { parseLocaleCode, resolveCommerceCountries } from '../fragment/locales.js';
import { PATH_TOKENS } from '../fragment/utils/paths.js';

function fieldValue(fields, name) {
    const value = fields?.[name];
    if (value && typeof value === 'object') return value.value ?? null;
    return value;
}

// Node has no DOMParser (web-components/src/json-ld.js stripHtml needs one), so markup is stripped
// with a regex. `&amp;` is decoded last so an encoded entity such as `&amp;quot;` stays `&quot;`.
function stripTags(html) {
    if (!html) return null;
    return (
        String(html)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim() || null
    );
}

// Authored links reach external consumers as-is, so only absolute https URLs are passed on.
function httpsUrl(href) {
    return URL.canParse(href) && new URL(href).protocol === 'https:' ? href : null;
}

function extractTermsUrl(html) {
    if (!html) return null;
    const match = String(html).match(/href="([^"]*offer-terms[^"]*)"/i);
    return match ? httpsUrl(match[1]) : null;
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
        'segment',
        'studio',
    ]);
    for (const tag of tags ?? []) {
        const match = /^mas:([^/]+)\/(.+)$/.exec(tag);
        if (match) {
            const key = match[1] === 'product' ? 'product_line' : match[1] === 'market_segments' ? 'market_segment' : match[1];
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

function extractElements(html, tagNames = 'span|a|button') {
    const elements = [];
    const pattern = new RegExp(`<(${tagNames})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'gi');
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
        // Like InlinePrice.render, a price without an OSI is left as authored.
        if (attributes.is !== 'inline-price' || !attributes['data-wcs-osi']) continue;
        elements.push({ attributes, match });
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

function createPriceRuntime(fragment, { locale, country, onPriceError } = {}) {
    const { env, landscape, wcsApiKey, wcsURL } = Defaults;
    const settings = {
        ...Defaults,
        ...(fragment?.settings ?? {}),
        // Fragment settings are authored content: they must not redirect or widen WCS requests.
        env,
        landscape,
        wcsApiKey,
        wcsURL,
    };
    if (locale) {
        const [language, localeCountry] = parseLocaleCode(locale);
        const surface = fragment?.path?.match(PATH_TOKENS)?.groups.surface;
        const { wcsCountry } = resolveCommerceCountries(surface, locale, country || localeCountry);
        Object.assign(settings, { locale, language, country: wcsCountry.toUpperCase() });
    }
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
    const wcs = Wcs({ ...startup, fetchTimeout: 5000 });
    if (fragment?.wcs) wcs.prefillWcsCache(fragment.wcs);
    return {
        onPriceError,
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
    const text = (source) => stripTags(source) ?? undefined;
    const textForClass = (source, className) => {
        const pattern = new RegExp(
            `<span\\b[^>]*class\\s*=\\s*(?:"[^"]*\\b${className}\\b[^"]*"|'[^']*\\b${className}\\b[^']*')[^>]*>([\\s\\S]*?)<\\/span>`,
            'i',
        );
        return text(String(source).match(pattern)?.[1]);
    };
    const legalTextForClass = (className) => textForClass(legalHtml, className);
    const taxText = legalTextForClass('price-tax-inclusivity') ?? textForClass(html, 'price-tax-inclusivity');
    const unitText = legalTextForClass('price-unit-type') ?? textForClass(html, 'price-unit-type');
    const strikethrough = textForClass(valueHtml, 'price-strikethrough');
    const primary = textForClass(valueHtml, 'price-alternative') ?? textForClass(valueHtml, 'price') ?? text(valueHtml);
    const renderedPrimary = textForClass(html, 'price-alternative') ?? textForClass(html, 'price') ?? text(html);
    const recurrenceText = renderedPrimary
        ?.replace(primary, '')
        .replace(taxText ?? '', '')
        .replace(unitText ?? '', '')
        .trim();

    return {
        promoPrice: strikethrough && primary !== strikethrough ? primary : undefined,
        regularPrice: strikethrough ?? primary,
        annualPrice: textForClass(valueHtml, 'price-annual'),
        planTypeText: legalTextForClass('price-plan-type'),
        taxText,
        recurrenceText: recurrenceText || undefined,
        unitText,
    };
}

// Mirrors InlinePrice.render for a fragment-backed merch card, which always opts its prices into
// FF_DEFAULTS: only explicitly authored options go through collectPriceOptions, so the per-unit
// and tax defaults resolve from the offer's segments exactly as they do on the card.
async function hydrateInlinePrice(runtime, attributes) {
    const dataset = toDataset(attributes);
    const priceOptions = runtime.price.collectPriceOptions({
        ...dataset,
        promotionCode: dataset.promotionCode || (runtime.useGlobalPromotionCode ? runtime.promotionCode : undefined),
        displayFormatted: false,
        [FF_DEFAULTS]: true,
    });
    const options = { ...runtime.settings, ...priceOptions };
    const offerGroups = await Promise.all(runtime.wcs.resolveOfferSelectors(options));
    const offers = await resolvePriceOffers(offerGroups, options, priceOptions);
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
            ...renderedPriceInfo(html, valueHtml, legalHtml),
        },
    };
}

// Prices hydrate concurrently, so cold WCS lookups share the hydration budget instead of adding up.
// A price that fails keeps its original span and is left out of the result, so one bad OSI does
// not fail the whole card.
async function hydrateInlinePrices(html, runtime) {
    const source = String(html);
    const elements = extractInlinePrices(source);
    const results = await Promise.allSettled(elements.map(({ attributes }) => hydrateInlinePrice(runtime, attributes)));
    const prices = [];
    let hydrated = '';
    let cursor = 0;
    for (const [index, { attributes, match }] of elements.entries()) {
        const result = results[index];
        hydrated += source.slice(cursor, match.index);
        if (result.status === 'fulfilled') {
            hydrated += result.value.html;
            prices.push(result.value.price);
        } else {
            hydrated += match[0];
            runtime.onPriceError(result.reason, attributes['data-wcs-osi']);
        }
        cursor = match.index + match[0].length;
    }
    hydrated += source.slice(cursor);
    return { html: hydrated, prices };
}

async function hydrateRecord(record, runtime) {
    const entries = await Promise.all(
        Object.entries(record ?? {}).map(async ([name, value]) => {
            const isWrapped = value && typeof value === 'object' && !Array.isArray(value);
            const source = isWrapped ? value.value : value;
            if (typeof source !== 'string' || !source.includes('<')) return { name, value, prices: [] };
            const result = await hydrateInlinePrices(source, runtime);
            return { name, value: isWrapped ? { ...value, value: result.html } : result.html, prices: result.prices };
        }),
    );
    return {
        record: Object.fromEntries(entries.map(({ name, value }) => [name, value])),
        prices: entries.flatMap(({ prices }) => prices),
    };
}

function ctaInfo(element) {
    if (!element) return;
    const attributes = {
        href: element.attributes['data-href'],
        ...element.attributes,
    };
    return {
        analyticsId: attributes['data-analytics-id'],
        href: httpsUrl(attributes.href) ?? undefined,
        text: element.text,
    };
}

function authoredText(elements, className) {
    return elements.find((element) => element.attributes.class?.split(/\s+/).includes(className))?.text;
}

async function extractMerchCard(fragment, context) {
    const runtime = createPriceRuntime(fragment, context);
    const [hydratedFields, hydratedSettings] = await Promise.all([
        hydrateRecord(fragment?.fields, runtime),
        hydrateRecord(fragment?.settings, runtime),
    ]);
    const fields = hydratedFields.record;
    const settings = hydratedSettings.record;
    const prices = [...hydratedFields.prices, ...hydratedSettings.prices];
    const hydratedFragment = { ...fragment, fields, settings };
    const elements = htmlSources(hydratedFragment).flatMap((source) => extractElements(source));
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
        ctas: extractElements(fieldValue(fields, 'ctas'), 'a|button')
            .filter(({ text }) => text)
            .map(({ text }) => ({ label: text })),
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

async function flattenOffer(fragment, context) {
    const fields = fragment?.fields ?? {};
    const merchCard = await extractMerchCard(fragment, context);
    return {
        fragment: fragment?.id ?? null,
        productName: (fieldValue(fields, 'cardTitle') || '').trim() || null,
        badge: stripTags(fieldValue(fields, 'badge')),
        terms_url: extractTermsUrl(fieldValue(fields, 'description')),
        ...parseTags(fields.tags),
        ...merchCard,
    };
}

export { extractMerchCard, flattenOffer };
