import { parseFragment, serialize as innerHtml } from 'parse5';
import { applyPlanType, selectOffers } from '../../../../../price/src/offers.js';
import { buildCheckoutUrl } from '../../../../../checkout/src/buildCheckoutUrl.js';
import { resolveCheckoutData } from '../../../../../checkout/src/checkout.js';
import { CheckoutWorkflowStep, Landscape, PROVIDER_ENVIRONMENT } from '../../../../../checkout/src/constants.js';
import { is3in1Modal } from '../../../../../checkout/src/decisions.js';
import { CARD_MODEL_ID, fetch, getCountry } from '../utils/common.js';
import { log, logError } from '../utils/log.js';
import { createSwrCache } from '../utils/swr-cache.js';
import { cachedOffersOf, datasetOf, effectivePromotionCode, fragmentPromotionCode, RENDER_ENVIRONMENT } from './render.js';
import { serializeValue } from './serialize.js';

/**
 * MWPW-214840: maps a resolved card to the AUP response shape of the M@S & AUP integration architecture (§4.4.1).
 * Runs after render, on the authored markup, so structured fields (badge, ctas, addon, what's included…) are read
 * from their elements as the browser's hydrate does; text-bearing values are emitted per `type` with serialize.
 */
const DEFAULT_BADGE_COLOR = '#000000';
const DEFAULT_BADGE_BACKGROUND_COLOR = '#F8D904';
const DEFAULT_TRIAL_BADGE_BORDER_COLOR = '#31A547';
const CHECKOUT_STYLE_PATTERN = /(accent|primary|secondary)(-(outline|link))?/;
const CHECKOUT_CLIENT_ID = 'adobe_com';
const OFFER_TERMS = '/offer-terms/';
const INLINE_PRICE = 'inline-price';
/** templates whose add-on renders with a custom checkbox (see the variants' `adjustAddon`) */
const CUSTOM_CHECKBOX_TEMPLATES = ['plans', 'plans-students', 'plans-education', 'plans-v2', 'pro', 'product-pricing'];
/** authored color tokens resolved as in web-components' global.css.js */
const COLOR_TOKENS = {
    'spectrum-yellow-300-plans': '#F5C700',
    'spectrum-green-900-plans': '#05834E',
    'spectrum-gray-300-plans': '#DADADA',
    'spectrum-gray-700-plans': '#505050',
    'spectrum-red-700-plans': '#EB1000',
    'spectrum-yellow-300': '#F5C700',
    'spectrum-green-900': '#05834E',
    'spectrum-red-700': '#EB1000',
    'spectrum-yellow-300-special-offers': '#EDCC00',
    'spectrum-green-900-special-offers': '#2D9D78',
    'spectrum-gray-300-special-offers': '#D1D1D1',
    'spectrum-gray-50': '#FFFFFF',
    'spectrum-gray-100': '#F8F8F8',
    'spectrum-gray-200': '#E6E6E6',
    'spectrum-gray-300': '#D5D5D5',
    'spectrum-gray-400': '#B8B8B8',
    'spectrum-gray-500': '#909090',
    'spectrum-gray-600': '#6D6D6D',
    'spectrum-gray-700': '#494949',
    'spectrum-gray-800': '#2C2C2C',
    'spectrum-gray-900': '#1C1C1C',
    'spectrum-indigo-300': '#D3D5FF',
    'spectrum-indigo-900': '#5258E4',
    'gradient-purple-blue': 'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
    'gradient-firefly-spectrum': 'linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)',
};

const colorOf = (token) => (token ? (COLOR_TOKENS[token] ?? token) : token);
const outerHtml = (node) => innerHtml({ nodeName: '#document-fragment', childNodes: [node] });
const isPrice = (node) => node.attrs?.some(({ name, value }) => name === 'is' && value === INLINE_PRICE);

const fulfillableItemsCache = createSwrCache({ name: 'aos-fulfillable-items' });
export const clearFulfillableItemsCache = () => fulfillableItemsCache.clear();

const attributesOf = (node) => Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
const classesOf = (node) => (attributesOf(node).class ?? '').split(/\s+/);
const toInteger = (value) => (value == null ? undefined : Number.parseInt(value, 10));
const toBoolean = (value) => (value == null ? undefined : ['true', '1'].includes(String(value)));

/** every element below `node`, in document order */
function descendantsOf(node) {
    const elements = [];
    for (const child of node.childNodes) {
        if (!child.tagName) continue;
        elements.push(child, ...descendantsOf(child));
    }
    return elements;
}

const elementsOf = (html) => (html ? descendantsOf(parseFragment(html)) : []);

/** raw value of a field: rich text ones are `{ value, mimeType }`, other ones are plain values */
function rawOf(fields, name) {
    const field = fields[name];
    return field?.mimeType ? field.value : field;
}

function badgeOf(html, defaults, text) {
    if (!html) return null;
    let content = html;
    let badge = defaults;
    const [element] = elementsOf(html);
    if (element?.tagName === 'merch-badge') {
        const attributes = attributesOf(element);
        content = innerHtml(element);
        badge = {
            ...defaults,
            ...(attributes['background-color'] && { backgroundColor: attributes['background-color'] }),
            ...(attributes['border-color'] && { borderColor: attributes['border-color'] }),
            ...(attributes.color && { color: attributes.color }),
            ...(attributes.icon && { icon: attributes.icon }),
        };
    }
    const value = text(content);
    if (!value) return null;
    const resolved = { text: value, ...badge };
    for (const key of ['color', 'backgroundColor', 'borderColor']) {
        if (key in resolved) resolved[key] = colorOf(resolved[key]);
    }
    return resolved;
}

/** `…/product-icons/svg/creative-cloud.svg` → `Creative Cloud`, for icons authored without alt */
const altOf = (icon) =>
    decodeURIComponent(icon.split('/').pop().split('.')[0])
        .split(/[-_]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

function mnemonicsOf(fields) {
    const alts = fields.mnemonicAlt ?? [];
    const links = fields.mnemonicLink ?? [];
    return (fields.mnemonicIcon ?? [])
        .map((icon, index) => ({ icon, alt: alts[index] || (icon && altOf(icon)), link: links[index] || undefined }))
        .filter(({ icon }) => icon);
}

/** the first offer cached by the `wcs` transformer for each osi, or undefined when one is missing */
function cachedOffers(osis, promotionCode, { context, report }) {
    const cache = context.body.wcs?.[RENDER_ENVIRONMENT] ?? {};
    const country = context.wcsCountry ?? getCountry(context);
    const offers = [];
    for (const osi of osis) {
        const { key, offers: cached } = cachedOffersOf(cache, osi, osis, country, promotionCode);
        if (!cached?.length) {
            report(`no cached offers for ${key}`);
            return undefined;
        }
        offers.push(selectOffers(cached.map(applyPlanType), { country })[0]);
    }
    return offers;
}

function checkoutUrlOf(checkout, osis, scope) {
    const offers = cachedOffers(osis, checkout.promotionCode, scope);
    if (!offers) return undefined;
    const { context } = scope;
    const data = resolveCheckoutData(
        offers,
        {
            checkoutClientId: CHECKOUT_CLIENT_ID,
            checkoutWorkflowStep: checkout.workflowStep ?? CheckoutWorkflowStep.EMAIL,
            checkoutMarketSegment: checkout.marketSegment,
            country: context.wcsCountry ?? getCountry(context),
            promotionCode: checkout.promotionCode || undefined,
            quantity: [1],
            modal: checkout.modal,
        },
        { env: PROVIDER_ENVIRONMENT.PRODUCTION, landscape: Landscape.PUBLISHED, is3in1: is3in1Modal(checkout.modal) },
    );
    return buildCheckoutUrl(data).toString();
}

function ctaOf(element, scope) {
    const attributes = attributesOf(element);
    const dataset = datasetOf(attributes);
    const [, variant, , style = 'fill'] = CHECKOUT_STYLE_PATTERN.exec(attributes.class ?? '') ?? [];
    const cta = {
        text: scope.text(innerHtml(element)),
        ...(variant && { variant, style }),
        isCheckout: Boolean(dataset.wcsOsi),
        url: attributes.href,
        target: attributes.target,
        analyticsId: dataset.analyticsId,
    };
    if (!cta.isCheckout) return cta;
    const osis = dataset.wcsOsi.split(',').map((osi) => osi.trim());
    const checkout = {
        workflow: dataset.checkoutWorkflow,
        workflowStep: dataset.checkoutWorkflowStep,
        marketSegment: dataset.checkoutMarketSegment,
        quantity: toInteger(dataset.quantity) || undefined,
        promotionCode: effectivePromotionCode(
            dataset.promotionCode ?? fragmentPromotionCode(scope.context, scope.fragment) ?? '',
        ),
        perpetual: toBoolean(dataset.perpetual),
        entitlement: toBoolean(dataset.entitlement),
        upgrade: toBoolean(dataset.upgrade),
        modal: dataset.modal,
    };
    return { ...cta, wcsOsi: dataset.wcsOsi, url: checkoutUrlOf(checkout, osis, scope), checkout };
}

/** MCS fulfillable items `{ code, name, icon, tooltip }` of a product arrangement, `[]` when AOS is not configured */
async function fulfillableItemsOf(productArrangementCode, context) {
    const { AOS_URL, AOS_API_KEY } = context;
    if (!productArrangementCode || !AOS_URL?.startsWith('http') || !AOS_API_KEY) return [];
    const url = new URL(AOS_URL.endsWith('/offers') ? AOS_URL : `${AOS_URL}/offers`);
    const query = {
        country: context.wcsCountry ?? getCountry(context),
        merchant: 'ADOBE',
        service_providers: 'MERCHANDISING',
        locale: context.locale,
        landscape: 'PUBLISHED',
        arrangement_code: productArrangementCode,
    };
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
    const load = async () => {
        const headers = { ...context.DEFAULT_HEADERS, 'x-api-key': AOS_API_KEY };
        const response = await fetch(url.toString(), { ...context, DEFAULT_HEADERS: headers }, 'aos');
        if (response.status !== 200) return null;
        const offer = response.body.find(({ merchandising }) => merchandising);
        return (offer?.merchandising.fulfillable_items ?? []).map(({ code, copy = {}, assets }) => ({
            code,
            name: copy.name,
            icon: assets?.icons?.svg,
            tooltip: copy.short_description ?? copy.description,
        }));
    };
    return (await fulfillableItemsCache.get(context, url.toString(), load)) ?? [];
}

const normalized = (name) =>
    name
        ?.toLowerCase()
        .replace(/^adobe\s+/, '')
        .replace(/[^a-z0-9]/g, '');

/**
 * fulfillable item of an authored app: the one of its `data-fi-code`, else (experimental, until authors pick codes)
 * the one with an icon named as its alt, description or icon file
 */
function fulfillableItemFor(code, names, fulfillableItems) {
    if (code) return fulfillableItems.find((item) => item.code === code);
    const keys = names.map(normalized).filter(Boolean);
    return fulfillableItems.find(({ name, icon }) => icon && keys.includes(normalized(name)));
}

/** pro section: `<h4>{icon}{title}</h4><ul><li>row</li>…</ul>`, as studio's pro-whats-included */
function sectionOf(section, { value }) {
    const descendants = descendantsOf(section);
    const heading = descendants.find(({ tagName }) => tagName === 'h4');
    if (!heading) return { title: value(innerHtml(section)), items: [] };
    const [lead] = heading.childNodes.filter(({ tagName }) => tagName);
    const isIcon = lead && (lead.tagName.startsWith('sp-icon-') || ['merch-icon', 'svg'].includes(lead.tagName));
    const title = { nodeName: '#document-fragment', childNodes: heading.childNodes.filter((node) => !isIcon || node !== lead) };
    return {
        icon: isIcon ? (attributesOf(lead).src ?? (lead.tagName === 'svg' ? undefined : lead.tagName)) : undefined,
        title: value(innerHtml(title)),
        items: descendants.filter(({ tagName }) => tagName === 'li').map((item) => value(innerHtml(item))),
    };
}

const isAppList = ({ tagName }) => tagName === 'merch-mnemonic-list';

/**
 * in-card what's included: `.whats-included-label` or `[slot=heading]` header on the first feature; mnemonic list
 * items matching a fulfillable item go to `includedApps`, enriched where not authored, followed by the offer baseline's
 * `includedApps` codes not authored; other items go to `whatsIncluded`
 */
function featuresOf(html, codes, fulfillableItems, { text, value }) {
    const elements = elementsOf(html);
    const heading = elements.find(
        (element) => classesOf(element).includes('whats-included-label') || attributesOf(element).slot === 'heading',
    );
    const includedApps = [];
    const whatsIncluded = [];
    for (const element of elements) {
        if (classesOf(element).includes('section')) {
            whatsIncluded.push(sectionOf(element, { value }));
            continue;
        }
        if (!isAppList(element)) continue;
        const descendants = descendantsOf(element);
        const icon = descendants.find(({ tagName }) => tagName === 'merch-icon' || tagName === 'img');
        const description = descendants.find((descendant) => attributesOf(descendant).slot === 'description');
        const { src, alt, href, 'data-fi-code': iconCode } = icon ? attributesOf(icon) : {};
        const code = attributesOf(element)['data-fi-code'] ?? iconCode;
        const name = description ? text(innerHtml(description)) : '';
        const item = fulfillableItemFor(code, [alt, name, src && altOf(src)], fulfillableItems);
        if (!code && !item) {
            whatsIncluded.push({ icon: src, alt, description: value(innerHtml(description ?? element)), href });
            continue;
        }
        includedApps.push({
            icon: src || item?.icon,
            alt: alt || item?.name,
            code: code ?? item.code,
            name: name || item?.name,
            tooltip: item?.tooltip,
            href,
        });
    }
    const authoredCodes = new Set(includedApps.map(({ code }) => code));
    for (const code of codes.filter((code) => !authoredCodes.has(code))) {
        const item = fulfillableItems.find((fulfillableItem) => fulfillableItem.code === code);
        includedApps.push({ icon: item?.icon, alt: item?.name, code, name: item?.name, tooltip: item?.tooltip });
    }
    const features = [
        { id: 'includedApps', items: includedApps },
        { id: 'whatsIncluded', items: whatsIncluded },
    ].filter(({ items }) => items.length);
    if (features.length && heading && text(innerHtml(heading))) features[0].header = value(innerHtml(heading));
    return features;
}

/** add-on offers: one per inline price, its plan type authored on the price or its paragraph, else the offer's */
function addonOffersOf(root, scope, planType) {
    const offers = [];
    for (const node of root.childNodes) {
        if (!node.tagName) continue;
        const attributes = attributesOf(node);
        if (!isPrice(node)) {
            offers.push(...addonOffersOf(node, scope, attributes['data-plan-type'] || planType));
            continue;
        }
        const dataset = datasetOf(attributes);
        const promotionCode = effectivePromotionCode(
            dataset.promotionCode ?? fragmentPromotionCode(scope.context, scope.fragment) ?? '',
        );
        const [offer] = cachedOffers([dataset.wcsOsi], promotionCode, scope) ?? [];
        offers.push({
            planType: dataset.planType || planType || offer?.planType,
            offerType: offer?.offerType,
            wcsOsi: dataset.wcsOsi,
            price: scope.text(outerHtml(node)),
        });
    }
    return offers;
}

/** drops inline prices, so the label is the add-on copy only */
function withoutPrices(node) {
    node.childNodes = node.childNodes.filter((child) => !isPrice(child));
    for (const child of node.childNodes) if (child.childNodes) withoutPrices(child);
    return node;
}

function addonOf(html, confirmation, template, scope) {
    const { text, value } = scope;
    // as hydrate's, on the text: rendered prices carry `disabled` classes
    if (!html || /disabled/.test(text(html))) return null;
    const [element] = elementsOf(html);
    const isAddon = element?.tagName === 'merch-addon';
    const content = isAddon ? innerHtml(element) : html;
    return {
        background: isAddon ? attributesOf(element).background : undefined,
        customCheckbox: CUSTOM_CHECKBOX_TEMPLATES.includes(template),
        label: text(innerHtml(withoutPrices(parseFragment(content)))),
        offers: addonOffersOf(parseFragment(content), scope),
        confirmation: confirmation ? value(confirmation) : undefined,
    };
}

function quantitySelectOf(html) {
    const element = elementsOf(html).find(({ tagName }) => tagName === 'merch-quantity-select');
    if (!element) return null;
    const attributes = attributesOf(element);
    return {
        title: attributes.title,
        min: toInteger(attributes.min),
        max: toInteger(attributes.max),
        step: toInteger(attributes.step),
        default: toInteger(attributes['default-value']),
    };
}

/** first offer terms link of the text-bearing fields */
function seeTermsOf(htmls, { text }) {
    for (const html of htmls) {
        const link = elementsOf(html).find(
            (element) => element.tagName === 'a' && attributesOf(element).href?.includes(OFFER_TERMS),
        );
        if (link) return { label: text(innerHtml(link)), url: attributesOf(link).href };
    }
    return undefined;
}

/** AUP area → fields it's built from, to report the layer (`product`, `template`, `fragment`, `mask`…) each comes from */
const SOURCE_FIELDS = {
    title: ['cardTitle'],
    subtitle: ['subtitle'],
    badge: ['badge'],
    trialBadge: ['trialBadge'],
    mnemonics: ['mnemonicIcon'],
    backgroundImage: ['backgroundImage'],
    description: ['description'],
    shortDescription: ['shortDescription'],
    promoText: ['promoText'],
    callout: ['callout'],
    price: ['prices'],
    ctas: ['ctas'],
    features: ['includedApps', 'whatsIncluded'],
    addon: ['addon'],
    customFields: ['customFields'],
    perUnitLabel: ['perUnitLabel'],
};

const isFilled = (fields, name) => ![rawOf(fields, name)].flat().every((entry) => [undefined, null, ''].includes(entry));

const SOURCE_ORDER = ['product', 'template', 'segment', 'plan', 'fragment', 'mask'];

const sourcesOf = (fields, fieldSources = {}) => {
    const areas = Object.entries(SOURCE_FIELDS).flatMap(([area, names]) =>
        names
            .filter((name) => isFilled(fields, name))
            .flatMap((name) => [fieldSources[name] ?? 'fragment'].flat().map((source) => [source, area])),
    );
    return SOURCE_ORDER.map((source) => ({
        source,
        fields: [...new Set(areas.filter(([layer]) => layer === source).map(([, area]) => area))],
    })).filter(({ fields: sourceFields }) => sourceFields.length);
};

async function mapCard(context) {
    const { body: fragment, type } = context;
    const { fields } = fragment;
    const settings = fragment.settings ?? {};
    const report = (message, isError) => (isError ? logError : log)(`aup ${fragment.id}: ${message}`, context);
    const value = (html) => serializeValue(html, type, report);
    const text = (html) => serializeValue(html, 'text', report);
    const scope = { context, fragment, report, text, value };
    const raw = (name) => rawOf(fields, name);
    const richValue = (name) => (raw(name) ? value(raw(name)) : undefined);
    const osi = raw('osi');
    const [offer] = (osi && cachedOffers([osi], effectivePromotionCode(raw('promoCode') ?? ''), scope)) || [];
    const labels = raw('customFieldLabels') ?? [];
    const productArrangementCode = offer?.productArrangementCode;
    const includedAppCodes = [raw('includedApps') ?? []].flat();
    const fulfillableItems =
        includedAppCodes.length || elementsOf(raw('whatsIncluded')).some(isAppList)
            ? await fulfillableItemsOf(productArrangementCode, context)
            : [];
    const secureLabel = settings.secureLabel ?? (raw('showSecureLabel') ? '' : undefined);
    return {
        fragment: fragment.id,
        template: raw('variant'),
        analyticsId: raw('tags')
            ?.find((tag) => tag.startsWith('mas:product_code/'))
            ?.split('/')[1],
        offerId: context.offerId ?? offer?.offerId,
        osi,
        productArrangementCode,
        title: richValue('cardTitle'),
        subtitle: raw('subtitle'),
        badge: badgeOf(
            raw('badge'),
            {
                color: raw('badgeColor') || DEFAULT_BADGE_COLOR,
                backgroundColor: raw('badgeBackgroundColor') || DEFAULT_BADGE_BACKGROUND_COLOR,
                borderColor: raw('borderColor') || undefined,
            },
            text,
        ),
        trialBadge: badgeOf(
            raw('trialBadge'),
            { borderColor: raw('trialBadgeBorderColor') || DEFAULT_TRIAL_BADGE_BORDER_COLOR },
            text,
        ),
        mnemonics: mnemonicsOf(fields),
        description: richValue('description'),
        shortDescription: richValue('shortDescription'),
        promoText: richValue('promoText'),
        promoCode: raw('promoCode') || null,
        callout: richValue('callout') ?? null,
        price: richValue('prices'),
        ctas: elementsOf(raw('ctas'))
            .filter(({ tagName }) => tagName === 'a' || tagName === 'button')
            .map((element) => ctaOf(element, scope)),
        features: featuresOf(raw('whatsIncluded'), includedAppCodes, fulfillableItems, scope),
        addon: addonOf(raw('addon') ?? settings.addon, raw('addonConfirmation'), raw('variant'), scope),
        quantitySelect: quantitySelectOf(raw('quantitySelect') ?? settings.quantitySelect),
        secureTransaction: secureLabel === undefined ? null : { enabled: true, ...(secureLabel && { label: secureLabel }) },
        customFields: (raw('customFields') ?? [])
            .map((html, index) => ({ label: labels[index] ?? '', value: value(html) }))
            .filter((field) => field.label || field.value.length),
        perUnitLabel: raw('perUnitLabel'),
        backgroundImage: raw('backgroundImage') ? { src: raw('backgroundImage'), alt: raw('backgroundImageAltText') } : null,
        style: { backgroundColor: raw('backgroundColor'), borderColor: raw('borderColor'), size: raw('size') },
        seeTerms: seeTermsOf([raw('description'), raw('shortDescription'), raw('callout'), raw('prices')], scope),
        tags: raw('tags') ?? [],
        pznTags: raw('pznTags') ?? [],
        sources: sourcesOf(fields, context.fieldSourcesById?.[fragment.id]),
    };
}

/**
 * Pipeline step, active for api keys bound to the `aup` mapping (see configuration) with a `type`: the card body is
 * replaced by its AUP shape. Collections are left as delivered.
 */
async function aup(context) {
    if (context.mapping !== 'aup' || !context.type) return context;
    if (context.body?.model?.id !== CARD_MODEL_ID) {
        log(`aup mapping only applies to cards, ${context.body?.id} is left as delivered`, context);
        return context;
    }
    context.body = await mapCard(context);
    return context;
}

export const transformer = { name: 'aup', process: aup };
