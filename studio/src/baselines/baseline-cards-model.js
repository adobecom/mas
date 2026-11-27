import { BASELINE_NAME, BASELINE_SOURCE_LOCALE, CARD_MODEL_PATH } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { loadOfferData } from '../common/utils/item-loading-browser.js';
import { extractLocaleFromPath, extractSurfaceFromPath, normalizeFragmentName } from '../utils.js';
import { getPlanType } from '../utils/plan-type.js';
import {
    buildBaselineFolderPath,
    CARD_OWN_FIELDS,
    DEFAULT_MARKET_SEGMENT,
    hasContent,
    parseBaselinePath,
    resolveBaselineOffer,
} from './baseline-model.js';

/**
 * Plan types a product gets a card and a collection for, in creation order.
 */
export const PLAN_TYPES = ['abm', 'm2m', 'puf'];

const PLAN_COMMITMENT_TERMS = {
    abm: 'YEAR / MONTHLY',
    m2m: 'MONTH / MONTHLY',
    puf: 'YEAR / ANNUAL',
};

const PLAN_FIELDS = new Set(['prices', 'ctas', 'callout']);
const PLAN_CARD_FIELDS = new Set([...CARD_OWN_FIELDS, ...PLAN_FIELDS, 'cardName']);
const NOT_COPIED_FIELDS = new Set(['variations', 'originalId']);
const PLAN_TYPE_TAG_PREFIX = 'mas:plan_type/';
const MARKET_SEGMENT_TAG_PREFIX = 'mas:market_segments/';

const OFFER_SELECTOR = '[data-wcs-osi]';
const PRICE_SELECTOR = '[is="inline-price"][data-wcs-osi]';
const BUY_NOW_SELECTOR = 'a[data-analytics-id="buy-now"][data-wcs-osi]';
const FREE_TRIAL_SELECTOR = 'a[data-analytics-id="free-trial"][data-wcs-osi]';

const NEW_PLAN_CARD_FIELDS = {
    osi: { type: 'text', multiple: false },
    enableBaselines: { type: 'boolean', multiple: false },
    callout: { type: 'long-text', multiple: false, mimeType: 'text/html' },
};

/**
 * @typedef {{ osi?: string, trialOsi?: string }} PlanOffer
 * @typedef {{ osi: string, trialOsi?: string, removedTrialOsi?: string, error?: string }} CheckedPlanOffer
 * @typedef {object} Product - ABM cards sharing the PA code & market segment of their offer
 * @property {string} productArrangementCode
 * @property {string} [marketSegment]
 * @property {string} [productCode]
 * @property {object[]} cards - ABM card fragments (AEM format), one per template
 * @property {Record<string, PlanOffer | CheckedPlanOffer>} offers - offers by plan type
 */

export const fieldValues = (fragment, name) => fragment.fields.find((field) => field.name === name)?.values ?? [];

const FRAGMENT_ID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Fragment ids found in pasted text, in order and lowercased: Studio search links, fragment editor links or bare ids.
 * @param {string} text
 * @returns {string[]}
 */
export const parseFragmentIds = (text) => (text.match(FRAGMENT_ID_PATTERN) ?? []).map((id) => id.toLowerCase());

/**
 * Why a fragment cannot be an ABM card to create baselines & collections from in a surface; `null` for a valid card.
 * @param {object} fragment - fragment (AEM format)
 * @param {string} surface
 * @returns {string | null}
 */
export function getAbmCardError(fragment, surface) {
    if (fragment.model?.path !== CARD_MODEL_PATH) return 'Not a card.';
    if (parseBaselinePath(fragment.path)) return 'A baseline, not a card.';
    const cardSurface = extractSurfaceFromPath(fragment.path);
    if (cardSurface !== surface) return `Surface ${cardSurface}, not ${surface}.`;
    const locale = extractLocaleFromPath(fragment.path);
    if (locale !== BASELINE_SOURCE_LOCALE) return `Locale ${locale}, not ${BASELINE_SOURCE_LOCALE}.`;
    return null;
}

const parseHtml = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template;
};

/**
 * Sets the `data-wcs-osi` of the elements matching each selector, or removes them without an OSI; the rest of the markup
 * is kept as is.
 * @param {string} html
 * @param {Array<[string, string | undefined]>} osiBySelector
 */
const swapOsis = (html, osiBySelector) => {
    const template = parseHtml(html);
    for (const [selector, osi] of osiBySelector) {
        for (const element of template.content.querySelectorAll(selector)) {
            if (osi) element.setAttribute('data-wcs-osi', osi);
            else element.remove();
        }
    }
    return template.innerHTML;
};

/**
 * OSI of the free trial CTA of a card.
 */
export const getTrialOsi = (card) =>
    parseHtml(fieldValues(card, 'ctas')[0] ?? '')
        .content.querySelector(FREE_TRIAL_SELECTOR)
        ?.getAttribute('data-wcs-osi');

/**
 * Whether a card looks free: no price nor CTA bound to an offer. Its `osi` field is ignored, as a free card can keep
 * the one of the card it was copied from.
 */
export const isFreeCard = (card) =>
    ['prices', 'ctas'].every((name) =>
        fieldValues(card, name).every((html) => !parseHtml(html).content.querySelector(OFFER_SELECTOR)),
    );

/**
 * Market segment of a card, read from its market segment tag, else the default one; upper case like WCS ones.
 */
export const getCardMarketSegment = (card) => {
    const tagId = (card.tags ?? []).map(normalizeTagId).find((id) => id.startsWith(MARKET_SEGMENT_TAG_PREFIX));
    return (tagId?.slice(MARKET_SEGMENT_TAG_PREFIX.length) ?? DEFAULT_MARKET_SEGMENT).toUpperCase();
};

/**
 * Key of a product: its PA code & market segment.
 * @param {Product} product
 * @returns {string}
 */
export const getProductKey = ({ productArrangementCode, marketSegment }) => `${productArrangementCode}/${marketSegment}`;

/**
 * Groups the ABM cards by the PA code & market segment of their own `osi`, in paste order. The ABM offer & trial of a
 * product are read from its first card: its `osi` and its free trial CTA.
 * @param {object[]} cards - card fragments (AEM format)
 * @param {{ cache?: Map, timeoutMs?: number }} [options] - `cache` is the `loadOfferData` cache of the page
 * @returns {Promise<{ products: Product[], unresolvedCards: object[] }>} `unresolvedCards`: cards whose offer has no PA
 * code
 */
export async function groupCardsByProduct(cards, { cache, timeoutMs } = {}) {
    const offers = await Promise.all(
        cards.map((card) => resolveBaselineOffer(fieldValues(card, 'osi')[0], {}, { cache, timeoutMs })),
    );
    const products = new Map();
    const unresolvedCards = [];
    cards.forEach((card, index) => {
        const { productArrangementCode, marketSegment, productCode } = offers[index];
        if (!productArrangementCode) {
            unresolvedCards.push(card);
            return;
        }
        const key = getProductKey({ productArrangementCode, marketSegment });
        const product = products.get(key);
        if (product) {
            product.cards.push(card);
            return;
        }
        products.set(key, {
            productArrangementCode,
            marketSegment,
            productCode,
            cards: [card],
            offers: { abm: { osi: fieldValues(card, 'osi')[0], trialOsi: getTrialOsi(card) } },
        });
    });
    return { products: [...products.values()], unresolvedCards };
}

/**
 * Templates of a product with several ABM cards. Their offers resolve to the same product, so they get one baseline, copied
 * from the first of them, and the same plan offers.
 * @param {Product} product
 * @returns {Array<[string, object[]]>} each template with its cards, in paste order
 */
export function getSharedTemplateCards({ cards }) {
    const cardsByTemplate = new Map();
    for (const card of cards) {
        const template = fieldValues(card, 'variant')[0];
        cardsByTemplate.set(template, [...(cardsByTemplate.get(template) ?? []), card]);
    }
    return [...cardsByTemplate].filter(([, templateCards]) => templateCards.length > 1);
}

/**
 * Why an offer cannot be the `plan` offer of a product: its PA code & market segment must be the product ones and its
 * commitment & term the plan ones. `null` for a valid offer.
 * @param {object | null} offer - resolved WCS offer
 * @param {{ productArrangementCode: string, marketSegment: string }} product
 * @param {string} plan
 * @returns {string | null}
 */
export function getPlanOfferError(offer, { productArrangementCode, marketSegment }, plan) {
    if (!offer) return 'The offer could not be loaded.';
    if (offer.productArrangementCode !== productArrangementCode) {
        return `The offer is for ${offer.productArrangementCode}, not ${productArrangementCode}.`;
    }
    const offerSegment = offer.marketSegments?.[0];
    if (offerSegment !== marketSegment) return `The offer is for ${offerSegment}, not ${marketSegment}.`;
    if (getPlanType(offer) !== plan) {
        return `The offer is ${offer.commitment} / ${offer.term}, ${plan.toUpperCase()} needs ${PLAN_COMMITMENT_TERMS[plan]}.`;
    }
    return null;
}

/**
 * Checks the offer & trial of each plan of a product that has an offer. A wrong offer gets an `error`; a wrong trial is
 * dropped (`removedTrialOsi`), its CTA is removed from the plan card.
 * @param {Product} product
 * @param {{ cache?: Map, timeoutMs?: number }} [options] - `cache` is the `loadOfferData` cache of the page
 * @returns {Promise<Record<string, CheckedPlanOffer>>}
 */
export async function checkPlanOffers(product, { cache, timeoutMs } = {}) {
    const loadOffer = (wcsOsi) => (wcsOsi ? loadOfferData({}, { fallbackWcsOsi: wcsOsi, cache, timeoutMs }) : null);
    const plans = PLAN_TYPES.filter((plan) => product.offers[plan]?.osi);
    const checked = await Promise.all(
        plans.map(async (plan) => {
            const { osi, trialOsi } = product.offers[plan];
            const [offer, trial] = await Promise.all([loadOffer(osi), loadOffer(trialOsi)]);
            const result = { osi };
            const error = getPlanOfferError(offer, product, plan);
            if (error) result.error = error;
            if (trialOsi && getPlanOfferError(trial, product, plan)) result.removedTrialOsi = trialOsi;
            else if (trialOsi) result.trialOsi = trialOsi;
            return [plan, result];
        }),
    );
    return Object.fromEntries(checked);
}

/**
 * Fields a baseline takes from an ABM card: all but the card own fields and the plan fields (prices, CTAs, callout).
 * @param {object} card - card fragment (AEM format)
 * @returns {object[]} AEM fields
 */
export const buildBaselineFields = (card) =>
    card.fields.filter(({ name, values }) => !CARD_OWN_FIELDS.has(name) && !PLAN_FIELDS.has(name) && hasContent(values));

/**
 * Tag ids with `mas:plan_type/<plan>` as the only plan type tag.
 * @param {Array<string | { id: string }>} tags
 * @param {string} plan
 * @returns {string[]}
 */
export const withPlanTypeTag = (tags, plan) => [
    ...tags.map(normalizeTagId).filter((tagId) => tagId && !tagId.startsWith(PLAN_TYPE_TAG_PREFIX)),
    `${PLAN_TYPE_TAG_PREFIX}${plan}`,
];

const isPlanPart = (part) => PLAN_TYPES.includes(part?.toLowerCase());

/**
 * Parts of a title before its last one, without a plan part, and its last part (`undefined` for a single part title).
 */
const splitTitle = (title) => {
    const parts = title
        .split(':')
        .map((part) => part.trim())
        .filter(Boolean);
    const last = parts.length > 1 ? parts.pop() : undefined;
    if (parts.length > 1 && isPlanPart(parts.at(-1))) parts.pop();
    return { parts, last };
};

/**
 * Title of a plan card: the plan inserted before the last part of the ABM card title, e.g.
 * "CC: Mini Compare Mweb: Illustrator: Team: default" → "CC: Mini Compare Mweb: Illustrator: Team: PUF: default".
 * A plan part already there is replaced.
 */
export function buildPlanTitle(title, plan) {
    const { parts, last } = splitTitle(title);
    return [...parts, plan.toUpperCase(), last].filter(Boolean).join(': ');
}

/**
 * Title of a baseline: the last part of the ABM card title replaced by "baseline", without a plan part.
 */
export const buildBaselineTitle = (title) => [...splitTitle(title).parts, BASELINE_NAME].join(': ');

/**
 * Title of a collection: "<prefix>: <Template>: <label>: [<SEGMENT>: ]<PLAN>", prefix & template being the first two
 * parts of the title of an ABM card of the template; the market segment is only there when it is not the default one.
 */
export const buildCollectionTitle = (cardTitle, label, plan, marketSegment) => {
    const segment = marketSegment?.toLowerCase() === DEFAULT_MARKET_SEGMENT ? undefined : marketSegment?.toUpperCase();
    return [...splitTitle(cardTitle).parts.slice(0, 2), label?.trim(), segment, plan.toUpperCase()].filter(Boolean).join(': ');
};

/**
 * Fields of a plan card: the card own fields, plan fields & `cardName` of the ABM card, everything else being inherited
 * from the baseline. `osi` is the plan offer, baselines are enabled, `mas:plan_type/<plan>` is the only plan type tag,
 * `callout` shows the disclaimer placeholder, prices & Buy now CTAs get the plan offer, Free trial CTAs the plan trial
 * or are removed without one; other OSIs are kept.
 * @param {object} card - ABM card fragment (AEM format)
 * @param {{ plan: string, osi: string, trialOsi?: string, disclaimerKey?: string }} planCard
 * @returns {object[]} AEM fields
 */
export function buildPlanCardFields(card, { plan, osi, trialOsi, disclaimerKey }) {
    const overrides = {
        osi: () => [osi],
        enableBaselines: () => [true],
        tags: (values) => withPlanTypeTag(values, plan),
        prices: (values) => values.map((html) => swapOsis(html, [[PRICE_SELECTOR, osi]])),
        ctas: (values) =>
            values.map((html) =>
                swapOsis(html, [
                    [BUY_NOW_SELECTOR, osi],
                    [FREE_TRIAL_SELECTOR, trialOsi],
                ]),
            ),
        callout: () => [disclaimerKey ? `<p>{{${disclaimerKey}}}</p>` : ''],
        cardName: (values) => values.map((name) => name && buildPlanTitle(name, plan)),
    };
    const fields = card.fields
        .filter(({ name }) => PLAN_CARD_FIELDS.has(name) && !NOT_COPIED_FIELDS.has(name))
        .map((field) => (overrides[field.name] ? { ...field, values: overrides[field.name](field.values ?? []) } : field));
    const missing = Object.entries(NEW_PLAN_CARD_FIELDS).filter(
        ([name]) => !fields.some((field) => field.name === name) && (name !== 'callout' || disclaimerKey),
    );
    return [...fields, ...missing.map(([name, field]) => ({ name, ...field, values: overrides[name]([]) }))];
}

const folderOf = (path) => path.slice(0, path.lastIndexOf('/'));

const buildBaselineItem = (surface, product, card) => {
    const { productArrangementCode, marketSegment, productCode } = product;
    const template = fieldValues(card, 'variant')[0];
    const baseline = { surface, locale: BASELINE_SOURCE_LOCALE, template, productArrangementCode, marketSegment, productCode };
    return {
        type: 'baseline',
        path: `${buildBaselineFolderPath(baseline)}/${BASELINE_NAME}`,
        title: buildBaselineTitle(card.title),
        osi: fieldValues(card, 'osi')[0],
        ...baseline,
        fields: buildBaselineFields(card),
    };
};

/**
 * Allocates fragment names in folders, a `-1`, `-2`… suffix making a name unique against the taken paths.
 * @param {Iterable<string>} takenPaths
 * @returns {(parentPath: string, title: string) => { path: string, name: string }}
 */
const createPathAllocator = (takenPaths) => {
    const taken = new Set(takenPaths);
    return (parentPath, title) => {
        const baseName = normalizeFragmentName(title);
        let name = baseName;
        for (let suffix = 1; taken.has(`${parentPath}/${name}`); suffix++) name = `${baseName}-${suffix}`;
        const path = `${parentPath}/${name}`;
        taken.add(path);
        return { path, name };
    };
};

const buildPlanCardItem = (card, plan, { osi, trialOsi }, disclaimerKey, allocatePath, baseline) => {
    const title = buildPlanTitle(card.title, plan);
    const parentPath = folderOf(card.path);
    return {
        type: 'card',
        plan,
        ...allocatePath(parentPath, title),
        parentPath,
        title,
        baseline,
        fields: buildPlanCardFields(card, { plan, osi, trialOsi, disclaimerKey }),
        tags: withPlanTypeTag(card.tags ?? [], plan),
    };
};

const buildCollectionItem = ({ card, marketSegment }, plan, label, cards, allocatePath) => {
    const title = buildCollectionTitle(card.title, label, plan, marketSegment);
    const parentPath = folderOf(card.path);
    return {
        type: 'collection',
        plan,
        ...allocatePath(parentPath, title),
        parentPath,
        title,
        cards,
        fields: [
            { name: 'label', type: 'text', multiple: false, values: [title] },
            { name: 'cards', type: 'content-fragment', multiple: true, values: cards },
            { name: 'enableBaselines', type: 'boolean', multiple: false, values: [true] },
        ],
    };
};

/**
 * Baselines, plan cards & collections to create from products with checked offers, in creation order: one baseline per
 * template, PA code & market segment, copied from its ABM card; one card per template & plan the product has a valid
 * offer for, inheriting from that baseline; one collection per template, market segment & plan with the cards of that
 * plan, in paste order, with baselines enabled. A plan no product has gets no collection. Free cards are not copied: each one joins, as is, the
 * collections of its template & market segment. Everything is created in en_US; cards & collections next to the ABM
 * cards, with a `-1`, `-2`… suffix when their name is the one of a pasted card or of another planned item.
 * @param {{ surface: string, products: Product[], freeCards?: object[], cardIds?: string[], label: string,
 * disclaimerKeys?: Record<string, string> }} plan - `products` hold the result of `checkPlanOffers` as `offers`;
 * `cardIds` are the ids of all pasted cards, in paste order; `disclaimerKeys` are placeholder keys by plan type
 * @returns {object[]} items, each with its `type` ('baseline' | 'card' | 'collection'), unique `path`, `title` and
 * AEM `fields`; baselines also carry what `createBaseline` needs, cards their `tags` & `baseline` path, collections
 * their `cards` paths
 */
export function buildBaselineCardsPlan({ surface, products, freeCards = [], cardIds = [], label, disclaimerKeys = {} }) {
    const baselines = new Map();
    const cards = [];
    const collectionGroups = new Map();
    const pastedCards = [...products.flatMap((product) => product.cards), ...freeCards];
    const allocatePath = createPathAllocator(pastedCards.map(({ path }) => path));
    const entry = (card, path) => ({ index: cardIds.indexOf(card.id), path });
    for (const product of products) {
        for (const card of product.cards) {
            const baseline = buildBaselineItem(surface, product, card);
            if (!baselines.has(baseline.path)) baselines.set(baseline.path, baseline);
            const groupKey = `${baseline.template}/${product.marketSegment}`;
            if (!collectionGroups.has(groupKey)) {
                collectionGroups.set(groupKey, { card, marketSegment: product.marketSegment, cards: {} });
            }
            const groupCards = collectionGroups.get(groupKey).cards;
            for (const plan of PLAN_TYPES) {
                const offer = product.offers[plan];
                if (!offer?.osi || offer.error) continue;
                const planCard = buildPlanCardItem(card, plan, offer, disclaimerKeys[plan], allocatePath, baseline.path);
                cards.push(planCard);
                (groupCards[plan] ??= []).push(entry(card, planCard.path));
            }
        }
    }
    for (const card of freeCards) {
        const group = collectionGroups.get(`${fieldValues(card, 'variant')[0]}/${getCardMarketSegment(card)}`);
        for (const plan of PLAN_TYPES) group?.cards[plan]?.push(entry(card, card.path));
    }
    const collections = [...collectionGroups.values()].flatMap((group) =>
        PLAN_TYPES.filter((plan) => group.cards[plan]).map((plan) => {
            const paths = group.cards[plan].toSorted((a, b) => a.index - b.index).map(({ path }) => path);
            return buildCollectionItem(group, plan, label, paths, allocatePath);
        }),
    );
    return [...baselines.values(), ...cards, ...collections];
}
