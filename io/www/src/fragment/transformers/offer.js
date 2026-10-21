import { CARD_MODEL_ID, fetch } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';
import { MAS_ROOT, odinFolder, PATH_TOKENS } from '../utils/paths.js';
import { createSwrCache } from '../utils/swr-cache.js';
import { getDefaultLocaleCode, resolveCommerceCountries } from '../locales.js';
import { computeRegionLocale } from './defaultLanguage.js';
import { computeWcsCaches, createWcsContext, wcsCacheKey } from './wcs.js';
const TRANSFORMER_NAME = 'offer';
const FOLDER_PAGE_SIZE = 50;
const REFERENCE_FIELDS = ['cards', 'collections'];
// every offer baseline of a locale (en_US fallback included), as served by the `offers` action behind the CDN. The bare
// `id` parameter is only there for www.adobe.com/mas/io to accept the request, to be removed with WPS-36294
const OFFERS_URL = 'https://www.adobe.com/mas/io/offers';
const OFFERS_API_KEY = 'wcms-commerce-ims-ro-user-milo';
// a locale weighs megabytes (~600 product arrangements for en_US today, ~1800 eventually)
const OFFERS_FETCH_TIMEOUT = 10000;

// Fragment baselines folders (listed in bulk) and offer baselines of a locale are shared by every fragment & request on
// the same locale / template: single-flight + TTL, absence included, so each is requested once whatever the size of a
// collection.
const baselineCache = createSwrCache({ name: 'baselines' });
const offersCache = createSwrCache({ name: 'offers', maxEntries: 50 });

export const clearBaselineCache = () => {
    baselineCache.clear();
    offersCache.clear();
};

export const offersUrl = (locale) => `${OFFERS_URL}?api_key=${OFFERS_API_KEY}&locale=${locale}&id`;

const offerToken = ({ fields }, osi) => ({ osi, promotionCode: fields?.promoCode || undefined });

/**
 * Resolves the product arrangement code & market segment (lower cased, e.g. `com`, `edu`) of each distinct offer token
 * through one WCS batch. The returned
 * `wcsPrefetch` (`{ [env]: { [cacheKey]: resolvedOffers } }`) is reused by the `wcs` transformer, so the same artifact
 * is never requested twice. `context` must carry the request `wcsCountry` / `regionLocale` for cache keys to match.
 */
async function resolveProductArrangements(context, tokens, prefetched) {
    const wcsPrefetch = await computeWcsCaches(tokens, context, prefetched);
    const wcsContext = createWcsContext(context);
    const caches = Object.values(wcsPrefetch);
    const resolveOffer = (token) => {
        const key = wcsCacheKey(token, wcsContext);
        const offer = caches.map((cache) => cache[key]).find((offers) => offers?.length)?.[0];
        return {
            productArrangementCode: offer?.productArrangementCode,
            marketSegment: offer?.marketSegments?.[0]?.toLowerCase(),
        };
    };
    return { resolveOffer, wcsPrefetch };
}

/**
 * Every fragment of an Odin folder (recursively, paginated), fields only (a missing folder is empty), `null` on failure.
 */
async function listFolder(context, folder) {
    const items = [];
    let cursor;
    do {
        const url = odinFolder(folder, { preview: context.preview, limit: FOLDER_PAGE_SIZE, cursor });
        const response = await fetch(url, context, `baselines-${folder}`);
        if (response.status != 200) {
            logError(`failed to list baselines of ${folder}: ${response.status} ${response.message}`, context);
            return null;
        }
        items.push(...response.body.items);
        cursor = response.body.cursor;
    } while (cursor);
    return items;
}

const FRAGMENT_BASELINE_PATH = /^(?<key>[\w-]+(?:\/[\w-]+)?)\/baseline$/;

/**
 * Fragment baselines of a template, keyed by `<pa>` or `<pa>/<segment>` (market segment override, e.g. `edu`):
 * `/content/dam/mas/<surface>/<locale>/baselines/<template>/<pa>[/<segment>]/baseline`, listed once (single-flight +
 * TTL), empty folders included; failures are retried next time.
 */
async function fetchFragmentBaselines(context, surface, locale, template) {
    const folder = `${MAS_ROOT}/${surface}/${locale}/baselines/${template}`;
    const entry = await baselineCache.get(context, folder, async () => {
        const items = await listFolder(context, folder);
        if (!items) return null;
        const keyed = items.map((item) => [item.path.slice(folder.length + 1).match(FRAGMENT_BASELINE_PATH)?.groups.key, item]);
        return { baselines: Object.fromEntries(keyed.filter(([key]) => key)) };
    });
    return entry?.baselines ?? {};
}

/**
 * Fragment baseline of a product arrangement & its market segment override, if any.
 */
const selectFragmentBaselines = (baselines, { productArrangementCode, marketSegment }) => ({
    fragmentBaseline: baselines[productArrangementCode],
    fragmentSegmentBaseline: marketSegment ? baselines[`${productArrangementCode}/${marketSegment}`] : undefined,
});

/**
 * Card fields an offer baseline provides. Offer model fields are MCS's, not the card's: they are mapped explicitly, and
 * the others are dropped (e.g. MCS `description` is a product name and `shortDescription` a marketing blurb, while a
 * card's are its body copy and legal text). `icons` are MCS renditions, svg first: the card's icon is the first one,
 * with the product name as its alt text.
 */
const toCardFields = ({ name, icons }) => ({
    ...(name && { cardTitle: name }),
    ...(icons?.length && { mnemonicIcon: [icons[0]], ...(name && { mnemonicAlt: [name] }) }),
});

/**
 * `{ [pa]: offerBaseline }` of a locale, fetched once for all product arrangements (`{}` when the locale has none);
 * failures are not cached and retried next time.
 */
function fetchOfferBaselines(context, locale) {
    // offers have no preview: `preview` would move offersCache to localStorage
    return offersCache.get({ ...context, preview: false }, locale, async () => {
        const networkConfig = { ...context.networkConfig, fetchTimeout: OFFERS_FETCH_TIMEOUT };
        const response = await fetch(offersUrl(locale), { ...context, networkConfig }, `offers-${locale}`);
        if (response.status == 200) return response.body;
        if (response.status == 404) return {};
        logError(`failed to fetch offer baselines of ${locale}: ${response.status} ${response.message}`, context);
        return null;
    });
}

/**
 * Offer baseline (offer model, MCS copy & assets) of a product arrangement, from
 * `/content/dam/mas/offers/<locale>/baselines/<pa>/baseline`, falling back to en_US, with its fields mapped to card
 * fields.
 */
async function getOfferBaseline(context, productArrangementCode) {
    const offerBaseline = (await fetchOfferBaselines(context, context.defaultLocale))?.[productArrangementCode];
    return offerBaseline && { ...offerBaseline, fields: toCardFields(offerBaseline.fields) };
}

/**
 * Request infos when no fragment `id` is requested (ADR CONT-0005): `offer`, `template` & `surface` select the main body,
 * the most specific baseline: the fragment baseline for that template & the offer market segment, the fragment baseline
 * for that template, or the offer baseline.
 * Same shape as fetchFragment's request infos, plus the `wcsPrefetch` used to resolve the offer.
 */
export async function resolveOfferInfos(initContext) {
    const { offer, template, surface, locale, country } = initContext;
    const defaultLocale = getDefaultLocaleCode(surface, locale);
    if (!defaultLocale) {
        return { status: 400, message: `Default locale not found for requested locale '${locale}' on surface '${surface}'` };
    }
    const countries = resolveCommerceCountries(surface, locale, country);
    const regionLocale = computeRegionLocale({ ...initContext, defaultLocale });
    const context = { ...initContext, ...countries, regionLocale, defaultLocale };
    // fragment baselines are listed while the offer is resolved
    const fragmentBaselines = fetchFragmentBaselines(context, surface, defaultLocale, template);
    const { resolveOffer, wcsPrefetch } = await resolveProductArrangements(context, [{ osi: offer }]);
    const resolved = resolveOffer({ osi: offer });
    const { productArrangementCode } = resolved;
    if (!productArrangementCode) {
        return { status: 404, message: `No product arrangement found for offer '${offer}'` };
    }
    const [offerBaseline, { fragmentBaseline, fragmentSegmentBaseline }] = await Promise.all([
        getOfferBaseline(context, productArrangementCode),
        fragmentBaselines.then((baselines) => selectFragmentBaselines(baselines, resolved)),
    ]);
    const baseline = fragmentSegmentBaseline ?? fragmentBaseline ?? offerBaseline;
    if (!baseline) {
        return {
            status: 404,
            message: `No baseline found for offer '${offer}' (${productArrangementCode}) and template '${template}'`,
        };
    }
    // listed baselines are fields only, their variations (references) can not be hydrated
    const body = { ...baseline, references: {}, referencesTree: [] };
    log(`using ${body.path} as main body for offer '${offer}' and template '${template}'`, initContext);
    return {
        status: 200,
        body,
        surface,
        parsedLocale: defaultLocale,
        fragmentPath: body.path.match(PATH_TOKENS).groups.fragmentPath,
        ...countries,
        wcsPrefetch,
    };
}

/**
 * Root fragment (whose osi & template can be overridden by the `offer` & `template` parameters) and every card /
 * collection of its references tree, with the offer token & template their baselines are looked up with.
 */
function collectTargets({ body, offer, template }) {
    const targets = [{ fragment: body, osi: offer ?? body.fields?.osi, template: template ?? body.fields?.variant }];
    const visit = (tree = []) => {
        for (const { fieldName, identifier, referencesTree } of tree) {
            if (!REFERENCE_FIELDS.includes(fieldName)) continue;
            const fragment = body.references?.[identifier]?.value;
            if (!fragment) continue;
            if (fragment.model?.id === CARD_MODEL_ID) {
                targets.push({ fragment, osi: fragment.fields?.osi, template: fragment.fields?.variant });
            }
            visit(referencesTree);
        }
    };
    visit(body.referencesTree);
    return targets
        .filter(({ osi, template }) => osi && template)
        .map((target) => ({ ...target, token: offerToken(target.fragment, target.osi) }));
}

/**
 * Looks up offer & fragment baselines of the requested fragment and of each card it references (ADR CONT-0005), so a
 * single baseline can hold the content common to all fragments of a product arrangement & template.
 * Each distinct offer, offer baseline & fragment baseline is requested once. Failures are not fatal.
 * @returns {{ status: 200, baselines: { [fragmentId]: { offerBaseline, fragmentBaseline, fragmentSegmentBaseline } }, wcsPrefetch }}
 */
async function init(initContext) {
    const { promises } = initContext;
    const fragmentInfos = await promises.defaultLanguage;
    if (fragmentInfos?.status != 200) return null;
    const { wcsCountry, wcsPrefetch: prefetched } = await promises.requestInfos;
    const { body, defaultLocale, regionLocale, surface } = fragmentInfos;
    const targets = collectTargets({ ...initContext, body });
    if (!targets.length) {
        logDebug(() => 'no offer & template to look baselines up with', initContext);
        return null;
    }
    const context = { ...initContext, wcsCountry, regionLocale, defaultLocale };
    const tokens = [...new Map(targets.map(({ token }) => [`${token.osi}-${token.promotionCode}`, token])).values()];
    // one listing per template, while offers are resolved
    const fragmentBaselines = Object.fromEntries(
        [...new Set(targets.map(({ template }) => template))].map((template) => [
            template,
            fetchFragmentBaselines(context, surface, defaultLocale, template),
        ]),
    );
    const { resolveOffer, wcsPrefetch } = await resolveProductArrangements(context, tokens, prefetched);
    const entries = targets.map(async ({ fragment, token, template }) => {
        const resolved = resolveOffer(token);
        const { productArrangementCode } = resolved;
        if (!productArrangementCode) {
            logError(`No product arrangement found for offer '${token.osi}' of ${fragment.id}`, initContext);
            return [fragment.id, {}];
        }
        const [offerBaseline, fragmentBaselinesOfOffer] = await Promise.all([
            getOfferBaseline(context, productArrangementCode),
            fragmentBaselines[template].then((baselines) => selectFragmentBaselines(baselines, resolved)),
        ]);
        return [fragment.id, { offerBaseline, ...fragmentBaselinesOfOffer }];
    });
    return { status: 200, baselines: Object.fromEntries(await Promise.all(entries)), wcsPrefetch };
}

async function process(context) {
    const result = await context.promises?.[TRANSFORMER_NAME];
    if (result?.status != 200) return context;
    const { baselines, wcsPrefetch } = result;
    return { ...context, baselines, wcsPrefetch };
}

export const transformer = {
    name: TRANSFORMER_NAME,
    process,
    init,
};
