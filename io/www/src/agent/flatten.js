import { Defaults } from '../../../../web-components/src/defaults.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from '../../../../web-components/src/compat-version.js';
import { FF_DEFAULTS, PLACEHOLDER_PLAN_TYPE_TEXT } from '../../../../web-components/src/constants.js';
import { resolvePriceOffers } from '../../../../web-components/src/inline-price.js';
import { planTypeCaseForPrecedingChar } from '../../../../web-components/src/plan-type-text.js';
import { Price } from '../../../../web-components/src/price.js';
import { getPromoTermsUrl } from '../../../../web-components/src/upt-link.js';
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

// Pairs each closing tag with its matching opening tag, so an element's text includes nested markup
// such as a hydrated price inside an authored span. Elements are returned in document order.
function extractElements(html, tagNames = 'span|a|button') {
    const source = String(html);
    const elements = [];
    const open = [];
    const pattern = new RegExp(`<(/?)(${tagNames})\\b([^>]*)>`, 'gi');
    for (const match of source.matchAll(pattern)) {
        const [markup, closing, name, attributeSource] = match;
        const tag = name.toLowerCase();
        if (!closing) {
            open.push({
                tag,
                attributes: parseAttributes(attributeSource),
                start: match.index,
                contentStart: match.index + markup.length,
            });
            continue;
        }
        const index = open.findLastIndex((element) => element.tag === tag);
        if (index === -1) continue;
        const [{ start, contentStart, attributes }] = open.splice(index);
        elements.push({ start, tag, attributes, text: stripTags(source.slice(contentStart, match.index)) ?? '' });
    }
    return elements.sort((a, b) => a.start - b.start);
}

function inlinePriceSpans(html) {
    return [...String(html ?? '').matchAll(/<span\b([^>]*)>/gi)]
        .map((match) => ({ match, attributes: parseAttributes(match[1]) }))
        .filter(({ attributes }) => attributes.is === 'inline-price');
}

const BLOCK_START = /<(?:p|div|li|td|th|h[1-6]|section|article|blockquote)\b[^>]*>/gi;

// Mirrors precedingChar in plan-type-text.js: the copy before the token within its block.
function planTypeCase(source, index) {
    const before = source.slice(0, index);
    const blockStart = [...before.matchAll(BLOCK_START)].at(-1);
    const copy = stripTags(before.slice(blockStart ? blockStart.index + blockStart[0].length : 0)) ?? '';
    return planTypeCaseForPrecedingChar(copy.slice(-1));
}

// The card renders the `prices` field as its price slot, so it leads; other fields follow in order.
function fieldNamesInCardOrder(fields) {
    const names = Object.keys(fields ?? {});
    return names.includes('prices') ? ['prices', ...names.filter((name) => name !== 'prices')] : names;
}

// Mirrors hostOsi in plan-type-text.js. An addon lives in settings, so only the card's fields count.
function hostOsi(fields) {
    const prices = fieldNamesInCardOrder(fields)
        .flatMap((name) => inlinePriceSpans(fieldValue(fields, name)))
        .map(({ attributes }) => attributes)
        .filter((attributes) => attributes['data-template'] === 'price' && attributes['data-wcs-osi']);
    const promo = prices.find(
        (attributes) => attributes['data-promotion-code'] && attributes['data-promotion-code'] !== 'cancel-context',
    );
    return (promo ?? prices[0])?.['data-wcs-osi'] ?? fieldValue(fields, 'osi') ?? undefined;
}

// Like InlinePrice.render, a price without an OSI is left as authored. The {{plan-type-text}}
// placeholder is the exception: as planTypeTextOptionsProvider does on the card, it takes the
// card's OSI and its casing from the copy before it.
function extractInlinePrices(html, cardOsi) {
    const source = String(html);
    const elements = [];
    for (const { match, attributes } of inlinePriceSpans(source)) {
        const placeholder = attributes['data-placeholder'] === PLACEHOLDER_PLAN_TYPE_TEXT;
        if (placeholder) {
            attributes['data-wcs-osi'] ||= cardOsi;
            attributes['data-plan-type-case'] ??= planTypeCase(source, match.index);
        }
        if (!attributes['data-wcs-osi']) continue;
        elements.push({ attributes, match, placeholder });
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
    let contentCountry = settings.country;
    if (locale) {
        const [language, localeCountry] = parseLocaleCode(locale);
        const surface = fragment?.path?.match(PATH_TOKENS)?.groups.surface;
        const resolved = resolveCommerceCountries(surface, locale, country || localeCountry);
        Object.assign(settings, { locale, language, country: resolved.wcsCountry.toUpperCase() });
        contentCountry = resolved.country.toUpperCase();
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
        cardOsi: hostOsi(fragment?.fields),
        contentCountry,
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
    // Exact class tokens on paired tags: `price-annual` must not match `price-annual-prefix`.
    const textForClass = (source, className) => authoredText(extractElements(source, 'span'), className) || undefined;
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
    return { html, info: renderedPriceInfo(html, valueHtml, legalHtml) };
}

// Prices hydrate concurrently, so cold WCS lookups share the hydration budget instead of adding up.
// Rendered markup goes inside the authored inline-price span, as in the browser, so the HTML stays
// balanced. A price that fails keeps its span empty and is returned as failed, so one bad OSI does
// not fail the whole card. Prices are returned in authored order with their template.
async function hydrateInlinePrices(html, runtime) {
    const source = String(html);
    const elements = extractInlinePrices(source, runtime.cardOsi);
    const results = await Promise.allSettled(elements.map(({ attributes }) => hydrateInlinePrice(runtime, attributes)));
    const prices = [];
    let hydrated = '';
    let cursor = 0;
    for (const [index, { attributes, match, placeholder }] of elements.entries()) {
        const result = results[index];
        const osi = attributes['data-wcs-osi'];
        const openingTagEnd = match.index + match[0].length;
        hydrated += source.slice(cursor, openingTagEnd);
        cursor = openingTagEnd;
        const price = { template: attributes['data-template'] ?? 'price', placeholder, osi };
        if (result.status === 'fulfilled') {
            hydrated += result.value.html;
            prices.push({ ...price, ...result.value.info });
        } else {
            prices.push({ ...price, failed: true });
            runtime.onPriceError(result.reason, osi);
        }
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
        pricesByField: Object.fromEntries(entries.map(({ name, prices }) => [name, prices])),
    };
}

// Mirrors processUptLinks (hydrate.js) and UptLink.render. A Studio-authored `a.upt-link` takes the
// card's OSI and promo code, while an `a[is="upt-link"]` carries its own. The link points to the
// promo terms page of the OSI's first offer, in the page's (content) country.
async function promoTermsInfo(element, fields, runtime) {
    if (!element) return;
    const { attributes } = element;
    const isPlaceholder = attributes.class?.split(/\s+/).includes('upt-link');
    const osi = isPlaceholder ? fieldValue(fields, 'osi') : attributes['data-wcs-osi'];
    const promotionCode = (isPlaceholder && fieldValue(fields, 'promoCode')) || attributes['data-promotion-code'];
    let href;
    if (osi) {
        const { env, language, country } = runtime.settings;
        try {
            const [[offer]] = await Promise.all(
                runtime.wcs.resolveOfferSelectors({ wcsOsi: [osi], promotionCode, country, language }),
            );
            href = getPromoTermsUrl({ env, language, country: runtime.contentCountry, offerId: offer.offerId, promotionCode });
        } catch (error) {
            runtime.onPriceError(error, osi);
        }
    }
    return { analyticsId: attributes['data-analytics-id'], href, text: element.text };
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
    // The advertised price comes from the card's own fields, never from settings such as an addon.
    const cardPrices = fieldNamesInCardOrder(fields).flatMap((name) => hydratedFields.pricesByField[name]);
    const allPrices = [...cardPrices, ...Object.values(hydratedSettings.pricesByField).flat()];
    const priceErrors = [...new Set(allPrices.filter(({ failed }) => failed).map(({ osi }) => osi))];
    const hydratedFragment = { ...fragment, fields, settings };
    const elements = htmlSources(hydratedFragment).flatMap((source) => extractElements(source));
    const cardElements = htmlSources({ fields, settings: {} }).flatMap((source) => extractElements(source));
    const mainPrice = cardPrices.find(({ template }) => template === 'price');
    // Like the card's getters, an authored legal element (not the inline plan-type token) supplies
    // the legal text with its own display options, so text it hides stays hidden; otherwise it
    // derives from the main price. As on the card, only the unit label falls back to the main price,
    // and only when the legal price rendered nothing.
    const legal = cardPrices.find(({ template, placeholder }) => template === 'legal' && !placeholder);
    const legalText = (key, className) => (legal ? legal[key] : (mainPrice?.[key] ?? authoredText(cardElements, className)));
    const unitText =
        legal && !legal.failed ? legal.unitText : (mainPrice?.unitText ?? authoredText(cardElements, 'price-unit-type'));
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
        planTypeText: legalText('planTypeText', 'price-plan-type'),
        taxText: legalText('taxText', 'price-tax-inclusivity'),
        recurrenceText: mainPrice?.recurrenceText ?? authoredText(cardElements, 'price-recurrence'),
        unitText,
        seeTermsInfo: await promoTermsInfo(seeTerms, fields, runtime),
        renewalText: authoredText(elements, 'renewal-text'),
        promoDurationText: authoredText(elements, 'promo-duration-text'),
        priceErrors: priceErrors.length ? priceErrors : undefined,
    };
}

// Authored links reach external consumers as-is, so only absolute https URLs are passed on.
function seeTermsLinkUrl(fields) {
    const link = htmlSources({ fields, settings: {} })
        .flatMap((html) => extractElements(html, 'a'))
        .find(
            ({ attributes: { href, 'data-analytics-id': analyticsId } }) =>
                analyticsId === 'see-terms' && URL.canParse(href) && new URL(href).protocol === 'https:',
        );
    return link?.attributes.href ?? null;
}

async function flattenOffer(fragment, context) {
    const fields = fragment?.fields ?? {};
    const merchCard = await extractMerchCard(fragment, context);
    return {
        fragment: fragment?.id ?? null,
        productName: (fieldValue(fields, 'cardTitle') || '').trim() || null,
        badge: stripTags(fieldValue(fields, 'badge')),
        // The promo terms link wins; otherwise a regular link authored with the see-terms analytics id.
        terms_url: merchCard.seeTermsInfo?.href ?? seeTermsLinkUrl(fields),
        ...parseTags(fields.tags),
        ...merchCard,
    };
}

export { extractMerchCard, flattenOffer };
