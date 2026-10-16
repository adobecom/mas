import { parseFragment } from 'parse5';
import { applyPlanType, selectOffers, sumOffers, buildPriceHTML } from '@adobecom/mas-price';
import { log, logError } from '../utils/log.js';

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

/**
 * Direct invocation only. The activation ticket must supply environment/options
 * and decide how retained inline-price hooks interact with browser hydration.
 */
async function render(context, { environment, resolveOptions } = {}) {
    const loggingContext = { ...context, loggedTransformer: 'render' };
    const fail = (message) => {
        logError(message, loggingContext);
        throw new Error(message);
    };
    if (!environment) fail('Render requires an explicit environment');
    if (!resolveOptions) fail('Render requires a resolveOptions provider');
    const logger = {
        warn: (message, details) => log(`${message} ${JSON.stringify(details)}`, loggingContext),
        error: (message, literal) => logError(`${message} ${JSON.stringify(literal)}`, loggingContext),
    };
    const renderValue = async (html, fragment, fieldName, valueIndex) => {
        const fieldFail = (message) => fail(`${fragment.id ?? context.id}.${fieldName} (${environment}): ${message}`);
        const replacements = [];
        for (const { attributes, location } of priceElements(html, fieldFail)) {
            const options = await resolveOptions({ context, fragment, fieldName, valueIndex, attributes });
            checkOptions(options, fieldFail);
            const cache = context.body.wcs?.[environment];
            if (!cache) fieldFail(`No WCS cache for environment ${environment}`);
            const selected = options.wcsOsi.map((osi, index) => {
                const key = [
                    osi,
                    options.country.toLowerCase(),
                    options.country.toUpperCase() === 'GB' ? '' : 'mult',
                    options.promotionCodes[index].toLowerCase(),
                ]
                    .filter(Boolean)
                    .join('-');
                const offers = cache[key];
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

export const transformer = { name: 'render', process: render };
