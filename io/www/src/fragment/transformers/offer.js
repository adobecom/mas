import { CARD_MODEL_ID, fetch } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';
import { MAS_ROOT, odinFolder, PATH_TOKENS } from '../utils/paths.js';
import { createSwrCache } from '../utils/swr-cache.js';
import { getDefaultLocaleCode, resolveCommerceCountries } from '../locales.js';
import { computeRegionLocale } from './defaultLanguage.js';
import { computeWcsCaches, createWcsContext, wcsCacheKey } from './wcs.js';
import { offerStateKey, readOfferBaseline } from '../../offers/index.js';

const TRANSFORMER_NAME = 'offer';
const FOLDER_PAGE_SIZE = 50;
const REFERENCE_FIELDS = ['cards', 'collections'];

// Fragment baselines folders (listed in bulk) & offer baselines (read from state) are shared by every fragment & request
// on the same locale / template: single-flight + TTL, absence included, so each is requested once whatever the size of
// a collection.
const baselineCache = createSwrCache({ name: 'baselines' });

export const clearBaselineCache = () => baselineCache.clear();

const offerToken = ({ fields }, osi) => ({ osi, promotionCode: fields?.promoCode || undefined });

/**
 * Resolves the product arrangement code of each distinct offer token through one WCS batch. The returned
 * `wcsPrefetch` (`{ [env]: { [cacheKey]: resolvedOffers } }`) is reused by the `wcs` transformer, so the same artifact
 * is never requested twice. `context` must carry the request `wcsCountry` / `regionLocale` for cache keys to match.
 */
async function resolveProductArrangements(context, tokens, prefetched) {
    const wcsPrefetch = await computeWcsCaches(tokens, context, prefetched);
    const wcsContext = createWcsContext(context);
    const caches = Object.values(wcsPrefetch);
    const paCode = (token) => {
        const key = wcsCacheKey(token, wcsContext);
        return caches.map((cache) => cache[key]).find((offers) => offers?.length)?.[0]?.productArrangementCode;
    };
    return { paCode, wcsPrefetch };
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

/**
 * Fragment baselines of a template, keyed by product arrangement code:
 * `/content/dam/mas/<surface>/<locale>/baselines/<template>/<pa>`, listed once (single-flight + TTL), empty folders
 * included; failures are retried next time.
 */
async function fetchFragmentBaselines(context, surface, locale, template) {
    const folder = `${MAS_ROOT}/${surface}/${locale}/baselines/${template}`;
    const entry = await baselineCache.get(context, folder, async () => {
        const items = await listFolder(context, folder);
        if (!items) return null;
        const keyed = items.map((item) => [item.path.slice(folder.length + 1), item]);
        return { baselines: Object.fromEntries(keyed.filter(([pa]) => !pa.includes('/'))) };
    });
    return entry?.baselines ?? {};
}

/**
 * Offer baseline (offer model, MCS copy & assets) of a product arrangement, as synced in state by the `offers` action
 * from `/content/dam/mas/offers/<locale>/<pa>/baseline`, falling back to en_US.
 */
async function getOfferBaseline(context, productArrangementCode) {
    const { defaultLocale } = context;
    const key = offerStateKey(defaultLocale, productArrangementCode);
    const entry = await baselineCache.get(context, key, async () => ({
        body: await readOfferBaseline(context, defaultLocale, productArrangementCode),
    }));
    return entry.body;
}

/**
 * Request infos when no fragment `id` is requested (MWPW-186204): `offer`, `template` & `surface` select the main body,
 * the fragment baseline for that template if any, the offer baseline otherwise.
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
    const { paCode, wcsPrefetch } = await resolveProductArrangements(context, [{ osi: offer }]);
    const productArrangementCode = paCode({ osi: offer });
    if (!productArrangementCode) {
        return { status: 404, message: `No product arrangement found for offer '${offer}'` };
    }
    const [offerBaseline, fragmentBaseline] = await Promise.all([
        getOfferBaseline(context, productArrangementCode),
        fragmentBaselines.then((baselines) => baselines[productArrangementCode]),
    ]);
    const baseline = fragmentBaseline ?? offerBaseline;
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
 * Looks up offer & fragment baselines of the requested fragment and of each card it references (MWPW-186204), so a
 * single baseline can hold the content common to all fragments of a product arrangement & template.
 * Each distinct offer, offer baseline & fragment baseline is requested once. Failures are not fatal.
 * @returns {{ status: 200, baselines: { [fragmentId]: { offerBaseline, fragmentBaseline } }, wcsPrefetch }}
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
    const { paCode, wcsPrefetch } = await resolveProductArrangements(context, tokens, prefetched);
    const entries = targets.map(async ({ fragment, token, template }) => {
        const productArrangementCode = paCode(token);
        if (!productArrangementCode) {
            logError(`No product arrangement found for offer '${token.osi}' of ${fragment.id}`, initContext);
            return [fragment.id, {}];
        }
        const [offerBaseline, fragmentBaseline] = await Promise.all([
            getOfferBaseline(context, productArrangementCode),
            fragmentBaselines[template].then((baselines) => baselines[productArrangementCode]),
        ]);
        return [fragment.id, { offerBaseline, fragmentBaseline }];
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
