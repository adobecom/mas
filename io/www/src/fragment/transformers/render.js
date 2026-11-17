import { parseFragment } from 'parse5';
import { applyPlanType, selectOffers, sumOffers } from '../../../../../price/src/offers.js';
import { buildPriceHTML } from '../../../../../price/src/price.js';
import { getCountry, getRegionalLocale } from '../utils/common.js';
import { log, logError } from '../utils/log.js';

const RENDER_ENVIRONMENT = 'prod';
const PROMO_CONTEXT_CANCEL_VALUE = 'cancel-context';
const UNRESOLVED_LITERAL = /^(\{\{)?price-literal-/;
const BOOLEAN_OPTIONS = [
    'displayOldPrice',
    'displayPerUnit',
    'displayRecurrence',
    'displayTax',
    'displayPlanType',
    'displayAnnual',
    'forceTaxExclusive',
    'perpetual',
    'alternativePrice',
];

const REQUIRED_OPTIONS = [
    'country',
    'language',
    'wcsOsi',
    'promotionCodes',
    'promotionCode',
    'displayTax',
    'forceTaxExclusive',
];

function priceElements(html, fail) {
    const prices = [];
    const visit = (node, inTemplate = false) => {
        const attributes = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
        if (node.tagName === 'span' && attributes.is === 'inline-price') {
            if (inTemplate) fail('Cannot resolve inline prices inside an inert template');
            const location = node.sourceCodeLocation;
            if (!location.endTag) fail('Inline price requires an explicit closing wrapper');
            prices.push({ attributes, location });
        }
        for (const child of node.childNodes ?? []) visit(child, inTemplate);
        if (node.content) visit(node.content, true);
    };
    visit(parseFragment(html, { sourceCodeLocationInfo: true }));
    prices.sort((a, b) => a.location.startOffset - b.location.startOffset);
    for (let index = 1; index < prices.length; index++) {
        if (prices[index].location.startOffset < prices[index - 1].location.endTag.endOffset) {
            fail('Nested inline-price placeholders are not supported');
        }
    }
    return prices;
}

function checkOptions(options, fail) {
    if (!options) fail('Caller must supply resolved options');
    for (const key of REQUIRED_OPTIONS) {
        if (options[key] == null) fail(`Caller must resolve ${key}`);
    }
    if (!options.wcsOsi.length) fail('Resolved OSI set must not be empty');
    if (options.promotionCodes.length !== options.wcsOsi.length) {
        fail('Resolved promotionCodes must align with wcsOsi');
    }
    if (options.promotionCodes.includes('cancel-context') || options.promotionCode === 'cancel-context') {
        fail('Caller must resolve cancel-context to an empty promotion code');
    }
    for (const literal of Object.values(options.literals ?? {})) {
        if (/^(\{\{)?price-literal-/.test(literal)) fail(`Unresolved price-literal: ${literal}`);
    }
}

const toList = (value) => value.split(',').map((entry) => entry.trim());

/** WCS cache key of the `wcs` transformer: final osi, lowercased country, `mult` except for GB, promotion code */
const offerCacheKey = (osi, country, promotionCode = '') =>
    [osi, country.toLowerCase(), country.toUpperCase() === 'GB' ? '' : 'mult', promotionCode.toLowerCase()]
        .filter(Boolean)
        .join('-');

/**
 * cached offers of `osi`, one of the `osis` of a price: the `wcs` transformer fetches (outside preview) a
 * comma-joined `data-wcs-osi` as one artifact, cached under the joined key, whose offers are then picked by osi
 */
function cachedOffersOf(cache, osi, osis, country, promotionCode) {
    const key = offerCacheKey(osi, country, promotionCode);
    if (cache[key]?.length || osis.length < 2) return { key, offers: cache[key] };
    const joinedKey = offerCacheKey(osis.join(','), country, promotionCode);
    return { key: joinedKey, offers: cache[joinedKey]?.filter(({ offerSelectorIds }) => offerSelectorIds.includes(osi)) };
}

/** element `data-*` attributes, camel cased as in the browser's dataset */
function datasetOf(attributes) {
    const dataset = {};
    for (const [name, value] of Object.entries(attributes)) {
        if (!name.startsWith('data-')) continue;
        dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    }
    return dataset;
}

/** fragment promotion code, as inherited by its elements without one */
const fragmentPromotionCode = (context, fragment) => fragment.fields?.promoCode ?? context.body.fields?.promoCode;
const effectivePromotionCode = (code) => (code === PROMO_CONTEXT_CANCEL_VALUE ? '' : code);

/**
 * Resolves an inline price's options from its data attributes as the browser's `collectPriceOptions`
 * does, against what the `wcs` transformer cached: final (substituted) OSIs, the element's promotion
 * code or else its fragment's one (`cancel-context` meaning none), the request commerce country. Card
 * settings supply the plan type & annual defaults, the replaced price literals the labels.
 */
function resolvePriceOptions({ context, fragment, attributes }) {
    const dataset = datasetOf(attributes);
    const settings = fragment.settings ?? context.body.settings ?? {};
    const { wcsOsi = '', promotionCode, quantity, ...rest } = dataset;
    const osis = toList(wcsOsi).filter(Boolean);
    const codes = toList(promotionCode ?? fragmentPromotionCode(context, fragment) ?? '').map(effectivePromotionCode);
    const promotionCodes = osis.map((_, index) => (codes.length > 1 ? (codes[index] ?? '') : codes[0]));
    const literals = Object.fromEntries(
        Object.entries({ ...context.body.priceLiterals, ...fragment.priceLiterals }).filter(
            ([, literal]) => literal && !UNRESOLVED_LITERAL.test(literal),
        ),
    );
    const options = {
        ...rest,
        country: context.wcsCountry ?? getCountry(context),
        language: getRegionalLocale(context).split('_')[0],
        wcsOsi: osis,
        promotionCodes,
        promotionCode: promotionCodes[0] ?? '',
        quantity: quantity ? toList(quantity).map(Number) : [1],
        literals,
    };
    for (const key of BOOLEAN_OPTIONS) {
        const value = rest[key] ?? settings[key];
        if (value != null) options[key] = ['true', '1'].includes(String(value));
    }
    options.displayTax ??= false;
    options.forceTaxExclusive ??= false;
    return options;
}

/**
 * Renders every inline price of the root and referenced fragments from the `wcs` cache.
 * Direct invocation requires an explicit environment & options provider.
 */
async function render(context, { environment, resolveOptions } = {}) {
    const loggingContext = { ...context, loggedTransformer: 'render' };
    const fail = (message) => {
        logError(message, loggingContext);
        throw new Error(message);
    };
    if (!environment) fail('Render requires an explicit environment');
    if (!resolveOptions) fail('Render requires a resolveOptions provider');
    const cache = context.body.wcs?.[environment];
    const logger = {
        warn: (message, details) => log(`${message} ${JSON.stringify(details)}`, loggingContext),
        error: (message, literal) => logError(`${message} ${JSON.stringify(literal)}`, loggingContext),
    };
    const renderValue = async (html, fragment, fieldName, valueIndex) => {
        const fieldFail = (message) => fail(`${fragment.id ?? context.id}.${fieldName} (${environment}): ${message}`);
        const prices = priceElements(html, fieldFail);
        if (prices.length && !cache) fieldFail(`No WCS cache for environment ${environment}`);
        const replacements = [];
        for (const { attributes, location } of prices) {
            const options = await resolveOptions({ context, fragment, fieldName, valueIndex, attributes });
            checkOptions(options, fieldFail);
            const selected = options.wcsOsi.map((osi, index) => {
                const { key, offers } = cachedOffersOf(
                    cache,
                    osi,
                    options.wcsOsi,
                    options.country,
                    options.promotionCodes[index],
                );
                if (!offers?.length) fieldFail(`No cached offers for ${key}`);
                return selectOffers(offers.map(applyPlanType), options)[0];
            });
            let offer;
            if (options.template === 'discount' && selected.length === 2) {
                const [discountedOffer, referenceOffer] = selected;
                offer = {
                    ...discountedOffer,
                    priceInfo: undefined,
                    priceDetails: {
                        ...discountedOffer.priceDetails,
                        priceWithoutDiscount: referenceOffer.priceDetails?.price,
                    },
                };
            } else {
                offer = sumOffers(selected, { logger });
            }
            replacements.push({
                start: location.startTag.endOffset,
                end: location.endTag.startOffset,
                html: buildPriceHTML([offer], options, { logger }),
            });
        }
        for (const replacement of replacements.reverse()) {
            html = html.slice(0, replacement.start) + replacement.html + html.slice(replacement.end);
        }
        return html;
    };

    // Commit field changes only after every placeholder has resolved successfully.
    const updates = [];
    const fragments = new Set([context.body]);
    for (const reference of Object.values(context.body.references ?? {})) {
        if (reference.value) fragments.add(reference.value);
    }
    for (const fragment of fragments) {
        for (const [fieldName, field] of Object.entries(fragment.fields ?? {})) {
            const value = typeof field === 'string' || Array.isArray(field) ? field : field?.value;
            let result = value;
            if (typeof value === 'string') {
                result = await renderValue(value, fragment, fieldName);
            } else if (Array.isArray(value)) {
                const entries = [];
                for (const [index, entry] of value.entries()) {
                    entries.push(typeof entry === 'string' ? await renderValue(entry, fragment, fieldName, index) : entry);
                }
                if (entries.some((entry, index) => entry !== value[index])) result = entries;
            }
            if (result !== value) updates.push({ fragment, fieldName, field, result });
        }
    }
    for (const { fragment, fieldName, field, result } of updates) {
        if (typeof field === 'string' || Array.isArray(field)) fragment.fields[fieldName] = result;
        else field.value = result;
    }
    return context;
}

/**
 * Pipeline step, only active with a `type` (see serialize): prices are resolved from the prod WCS cache
 * of the response. A price that can't be rendered (e.g. offer missing from the cache) is logged by
 * `render` and leaves every field unrendered, as delivered without a `type`.
 */
async function process(context) {
    if (!context.type) return context;
    try {
        return await render(context, { environment: RENDER_ENVIRONMENT, resolveOptions: resolvePriceOptions });
    } catch {
        return context;
    }
}

export const transformer = { name: 'render', process };
export {
    cachedOffersOf,
    datasetOf,
    effectivePromotionCode,
    fragmentPromotionCode,
    render,
    RENDER_ENVIRONMENT,
    resolvePriceOptions,
};
