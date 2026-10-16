import stateLib from '@adobe/aio-lib-state';
import { createHash } from 'crypto';
import zlib from 'zlib';
import { fetch, getFromState, getJsonFromState, VALID_PARAMETER_VALUE_REGEX } from '../fragment/utils/common.js';
import { loadConfiguration, validateApiKey } from '../fragment/utils/configuration.js';
import { log, logError } from '../fragment/utils/log.js';
import { MAS_ROOT, odinFolder } from '../fragment/utils/paths.js';
import { createSwrCache } from '../fragment/utils/swr-cache.js';

/**
 * MWPW-186204: keeps offer baselines (`/content/dam/mas/offers/<locale>/baselines/<pa>/baseline`) in the namespace state, one key
 * per locale & product arrangement, so the fragment pipeline reads the few it needs instead of listing the whole folder
 * (~1800 product arrangements per locale).
 * - sync: non web invocations (every 15 minutes alarm, or on demand), for one `locale` or all of them,
 * - serve: web `GET ?locale=<locale>[&pa=<pa>[,<pa>…]]`, brotli compressed, with an ETag for conditional requests. Without
 *   `pa`, every offer baseline of the locale, read from its bundle (one state entry per locale). State reads are cached
 *   in container memory (see offersCache).
 */

const OFFERS_ROOT = `${MAS_ROOT}/offers`;
// market segment overrides (`<pa>/<segment>/baseline`) are not offer baselines
const BASELINE_PATH = /^\/content\/dam\/mas\/offers\/(?<locale>[\w-]+)\/baselines\/(?<pa>[\w-]+)\/baseline$/;
const PAGE_SIZE = 50;
// aio-lib-state maximum: entries are rewritten when they change, deleted when their baseline is, and all rewritten (TTL
// refresh) every REFRESH_INTERVAL to 2 × REFRESH_INTERVAL (randomized so that locales don't all refresh at once)
const TTL = 365 * 24 * 60 * 60;
const REFRESH_INTERVAL = 30 * 24 * 60 * 60 * 1000;
const STATE_BATCH_SIZE = 10;
const OFFER_BASELINE_FALLBACK_LOCALE = 'en_US';
const MAX_PRODUCT_ARRANGEMENTS = 50;
const WEB_BROTLI_QUALITY = 5;
const RESPONSE_HEADERS = { 'Content-Type': 'application/json' };
const WEB_RESPONSE_HEADERS = {
    ...RESPONSE_HEADERS,
    'Content-Encoding': 'br',
    'Access-Control-Allow-Headers': 'If-None-Match',
    'Access-Control-Expose-Headers': 'ETag',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
};

export const offerStateKey = (locale, productArrangementCode) => `offer-${locale}-${productArrangementCode}`;
// `{ refreshAt, hashes: { [offerStateKey]: hash } }` of what is stored for a locale
export const offersIndexStateKey = (locale) => `offers-index-${locale}`;
// brotli compressed (base64) `{ [pa]: offerBaseline }` of every offer baseline of a locale
export const offersBundleStateKey = (locale) => `offers-bundle-${locale}`;
// `[locale]` having offer baselines in state, so that a full sync also reconciles locales that have none anymore
export const OFFERS_LOCALES_STATE_KEY = 'offers-locales';

// Container memory cache of what web requests read from state (jittered 5 minutes TTL, stale-while-revalidate, single
// flight), so a warm container neither re-reads state nor re-encodes a locale for every request:
// - `offer-<locale>-<pa>`: stored offer baseline, '' when there is none (absence is cached too),
// - `locale-<locale>`: encoded response (`{ etag, body }`) of every offer baseline of a locale, '' when there is none.
// State errors throw, so they are never cached. Room for a few locales of ~1800 offers (≤ ~2KB each) besides every locale
// response (~250KB each).
const offersCache = createSwrCache({ name: 'offers', maxEntries: 10000 });

export function clearOffersCache() {
    offersCache.clear();
}

const hash = (value) => createHash('sha1').update(value).digest('base64url');

/**
 * Offer baseline of a product arrangement as synced in state, falling back to en_US when not localized yet.
 */
export async function readOfferBaseline(context, locale, productArrangementCode) {
    const key = offerStateKey(locale, productArrangementCode);
    const value = await offersCache.get(context, key, async () => (await getFromState(key, context)) ?? '');
    if (value || locale === OFFER_BASELINE_FALLBACK_LOCALE) return value ? JSON.parse(value) : undefined;
    return readOfferBaseline(context, OFFER_BASELINE_FALLBACK_LOCALE, productArrangementCode);
}

async function listFolder(context, folder) {
    const items = [];
    let cursor;
    do {
        const url = odinFolder(folder, { limit: PAGE_SIZE, cursor });
        const response = await fetch(url, context, 'offers-folder');
        if (response.status != 200) return null;
        items.push(...response.body.items);
        cursor = response.body.cursor;
    } while (cursor);
    return items;
}

/**
 * Serialized offer baselines of the listed items, grouped by locale: `{ [locale]: { [offerStateKey]: json } }`.
 */
function groupBaselines(items) {
    const locales = {};
    for (const { id, path, model, fields } of items) {
        const match = path.match(BASELINE_PATH);
        if (!match) continue;
        const { locale, pa } = match.groups;
        locales[locale] ??= {};
        locales[locale][offerStateKey(locale, pa)] = JSON.stringify({ id, path, model, fields });
    }
    return locales;
}

async function inBatches(tasks) {
    for (let i = 0; i < tasks.length; i += STATE_BATCH_SIZE) {
        await Promise.all(tasks.slice(i, i + STATE_BATCH_SIZE).map((task) => task()));
    }
}

/**
 * Writes changed baselines of a locale & deletes removed ones, or rewrites them all once the refresh deadline is passed so
 * that unchanged ones never expire. New keys are tracked in the index (with an unknown hash) before being written, and the
 * index is only updated with their hashes once they all succeeded, so a sync failing midway is fully retried next time:
 * changed keys are rewritten, removed ones deleted. A locale without baselines anymore has its index & bundle deleted too.
 */
async function syncLocale(context, locale, baselines) {
    const { state } = context;
    const { json: index } = await getJsonFromState(offersIndexStateKey(locale), context);
    const previous = index?.hashes ?? {};
    const refresh = !(Date.now() < index?.refreshAt);
    const next = Object.fromEntries(Object.entries(baselines).map(([key, value]) => [key, hash(value)]));
    const updated = Object.keys(next).filter((key) => refresh || previous[key] !== next[key]);
    const removed = Object.keys(previous).filter((key) => !(key in next));
    const total = Object.keys(next).length;
    const added = updated.filter((key) => !(key in previous));
    if (added.length) {
        const hashes = { ...previous, ...Object.fromEntries(added.map((key) => [key, ''])) };
        await state.put(offersIndexStateKey(locale), JSON.stringify({ refreshAt: index?.refreshAt, hashes }), { ttl: TTL });
    }
    await inBatches([
        ...updated.map((key) => () => state.put(key, baselines[key], { ttl: TTL })),
        ...removed.map((key) => () => state.delete(key)),
    ]);
    if (!total) {
        await Promise.all([state.delete(offersBundleStateKey(locale)), state.delete(offersIndexStateKey(locale))]);
        return { locale, total, updated: 0, removed: removed.length };
    }
    // the bundle is also written when missing (e.g. state synced before it existed)
    const bundled = await getFromState(offersBundleStateKey(locale), context);
    if (!bundled || updated.length || removed.length) {
        const refreshAt = refresh ? Date.now() + REFRESH_INTERVAL * (1 + Math.random()) : index.refreshAt;
        await state.put(offersBundleStateKey(locale), compressBundle(locale, baselines), { ttl: TTL });
        await state.put(offersIndexStateKey(locale), JSON.stringify({ refreshAt, hashes: next }), { ttl: TTL });
    }
    return { locale, total, updated: updated.length, removed: removed.length };
}

const writeTrackedLocales = (context, tracked) =>
    context.state.put(OFFERS_LOCALES_STATE_KEY, JSON.stringify([...tracked].sort()), { ttl: TTL });

/**
 * Syncs the requested locale, or every listed one plus those tracked in state (to delete them when they have none
 * anymore). Listed locales are tracked before any of their entries is written, and untracked only once they are all
 * deleted, so that a sync failing midway never leaves entries of an untracked locale behind. The tracked locales are
 * rewritten every sync, so they never expire.
 */
async function syncLocales(context, locale, grouped) {
    const { json: synced } = await getJsonFromState(OFFERS_LOCALES_STATE_KEY, context);
    const tracked = new Set(synced);
    const listed = Object.keys(grouped);
    const untracked = listed.filter((listedLocale) => !tracked.has(listedLocale));
    if (untracked.length) {
        for (const untrackedLocale of untracked) tracked.add(untrackedLocale);
        await writeTrackedLocales(context, tracked);
    }
    // a requested locale is synced even when empty, so that its removed baselines are deleted
    const locales = locale ? [locale] : [...new Set([...listed, ...tracked])];
    const results = [];
    for (const syncedLocale of locales) {
        results.push(await syncLocale(context, syncedLocale, grouped[syncedLocale] ?? {}));
    }
    for (const { locale: syncedLocale, total } of results) {
        if (!total) tracked.delete(syncedLocale);
    }
    await writeTrackedLocales(context, tracked);
    return results;
}

function compressBundle(locale, baselines) {
    const prefix = offerStateKey(locale, '');
    const bundle = Object.fromEntries(
        Object.entries(baselines).map(([key, value]) => [key.slice(prefix.length), JSON.parse(value)]),
    );
    return zlib.brotliCompressSync(JSON.stringify(bundle)).toString('base64');
}

async function readBundle(context, locale) {
    const value = await getFromState(offersBundleStateKey(locale), context);
    return value ? JSON.parse(zlib.brotliDecompressSync(Buffer.from(value, 'base64')).toString('utf-8')) : {};
}

// a locale wide response weighs megabytes: maximum (default) quality would take seconds
const compress = (json) =>
    zlib.brotliCompressSync(json, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: WEB_BROTLI_QUALITY } }).toString('base64');

function encode(body) {
    const json = JSON.stringify(body);
    return { etag: `"${hash(json)}"`, body: compress(json) };
}

function webResponse(statusCode, body) {
    return { statusCode, headers: WEB_RESPONSE_HEADERS, body: compress(JSON.stringify(body)) };
}

/**
 * 200 with the encoded offer baselines, or 304 when `If-None-Match` matches their ETag.
 */
function offersResponse(context, { etag, body }) {
    const notModified = context.__ow_headers?.['if-none-match'] === etag;
    return {
        statusCode: notModified ? 304 : 200,
        headers: { ...WEB_RESPONSE_HEADERS, ETag: etag },
        body: notModified ? undefined : body,
    };
}

/**
 * Every offer baseline of a locale, falling back to en_US ones not localized yet, encoded. Resolves '' when there is none:
 * absence is cached too, so that it replaces what another container's sync deleted once the cached entry expires (a null
 * value would keep serving the stale one).
 */
function readLocaleBaselines(context, locale) {
    return offersCache.get(context, `locale-${locale}`, async () => {
        const locales = [...new Set([OFFER_BASELINE_FALLBACK_LOCALE, locale])];
        const bundles = await Promise.all(locales.map((bundleLocale) => readBundle(context, bundleLocale)));
        const baselines = Object.assign({}, ...bundles);
        return Object.keys(baselines).length ? encode(baselines) : '';
    });
}

async function readProductArrangementBaselines(context, locale, productArrangementCodes) {
    const baselines = await Promise.all(productArrangementCodes.map((code) => readOfferBaseline(context, locale, code)));
    const body = Object.fromEntries(productArrangementCodes.map((code, i) => [code, baselines[i]]).filter(([, b]) => b));
    return Object.keys(body).length ? encode(body) : null;
}

/**
 * `{ [pa]: offerBaseline }` of the requested product arrangements (unknown ones omitted), or of the whole locale without
 * `pa`, 404 if none is known.
 * Responds 304 when `If-None-Match` matches the ETag of the response.
 * Requires an `api_key` accepted by the fragment pipeline (same configuration).
 */
async function serve(params) {
    // offers have no preview: `preview` would move offersCache to localStorage
    const context = { ...(await loadConfiguration(params, Date.now())), preview: false };
    const validation = validateApiKey(context);
    if (validation.statusCode !== 200) return webResponse(validation.statusCode, { message: validation.message });
    const { locale, pa } = context;
    const productArrangementCodes = [...new Set(pa?.split(',').filter(Boolean))];
    if (!locale) return webResponse(400, { message: 'requested parameter locale is not present' });
    const invalid = [locale, ...productArrangementCodes].find((value) => !VALID_PARAMETER_VALUE_REGEX.test(value));
    if (invalid) return webResponse(400, { message: `invalid parameter value '${invalid}'` });
    if (productArrangementCodes.length > MAX_PRODUCT_ARRANGEMENTS) {
        return webResponse(400, { message: `at most ${MAX_PRODUCT_ARRANGEMENTS} product arrangements can be requested` });
    }
    const encoded = productArrangementCodes.length
        ? await readProductArrangementBaselines(context, locale, productArrangementCodes)
        : await readLocaleBaselines(context, locale);
    if (!encoded) {
        return webResponse(404, { message: `no offer baseline found for ${pa ?? 'any product arrangement'} in ${locale}` });
    }
    return offersResponse(context, encoded);
}

export async function main(params) {
    const { locale } = params;
    const context = {
        ...params,
        requestId: `offers-${Date.now()}`,
        loggedTransformer: 'offers',
        DEFAULT_HEADERS: { Accept: 'application/json' },
        networkConfig: { fetchTimeout: 10000, ...params.networkConfig },
    };
    /* c8 ignore next 3*/
    if (!context.state) {
        context.state = await stateLib.init();
    }
    if (params.__ow_method) return serve(context);
    if (locale && !VALID_PARAMETER_VALUE_REGEX.test(locale)) {
        return { statusCode: 400, headers: RESPONSE_HEADERS, body: { message: "invalid parameter 'locale'" } };
    }
    const folder = locale ? `${OFFERS_ROOT}/${locale}` : OFFERS_ROOT;
    const items = await listFolder(context, folder);
    if (!items) {
        logError(`failed to list offer baselines of ${folder}`, context);
        return { statusCode: 503, headers: RESPONSE_HEADERS, body: { message: `failed to list ${folder}` } };
    }
    const results = await syncLocales(context, locale, groupBaselines(items));
    log(`synced offer baselines: ${JSON.stringify(results)}`, context);
    // this container may serve web requests too: don't let it serve what it just replaced
    if (results.some(({ updated, removed }) => updated || removed)) clearOffersCache();
    return { statusCode: 200, headers: RESPONSE_HEADERS, body: { locales: results } };
}
