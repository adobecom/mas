import stateLib from '@adobe/aio-lib-state';
import { createHash } from 'crypto';
import zlib from 'zlib';
import { fetch, getFromState, getJsonFromState, VALID_PARAMETER_VALUE_REGEX } from '../fragment/utils/common.js';
import { loadConfiguration, validateApiKey } from '../fragment/utils/configuration.js';
import { log, logError } from '../fragment/utils/log.js';
import { MAS_ROOT, odinFolder } from '../fragment/utils/paths.js';

/**
 * MWPW-186204: keeps offer baselines (`/content/dam/mas/offers/<locale>/<pa>/baseline`) in the namespace state, one key
 * per locale & product arrangement, so the fragment pipeline reads the few it needs instead of listing the whole folder
 * (~1800 product arrangements per locale).
 * - sync: non web invocations (every 15 minutes alarm, or on demand), for one `locale` or all of them,
 * - serve: web `GET ?locale=<locale>[&pa=<pa>[,<pa>…]]`, brotli compressed, with an ETag for conditional requests. Without
 *   `pa`, every offer baseline of the locale, read from its bundle (one state entry per locale).
 */

const OFFERS_ROOT = `${MAS_ROOT}/offers`;
const BASELINE_PATH = /^\/content\/dam\/mas\/offers\/(?<locale>[\w-]+)\/(?<pa>[\w-]+)\/baseline$/;
const PAGE_SIZE = 50;
// aio-lib-state maximum: entries are rewritten when they change, deleted when their baseline is
const TTL = 365 * 24 * 60 * 60;
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
// { [offerStateKey]: hash } of what is stored for a locale
export const offersIndexStateKey = (locale) => `offers-index-${locale}`;
// brotli compressed (base64) `{ [pa]: offerBaseline }` of every offer baseline of a locale
export const offersBundleStateKey = (locale) => `offers-bundle-${locale}`;

const hash = (value) => createHash('sha1').update(value).digest('base64url');

/**
 * Offer baseline of a product arrangement as synced in state, falling back to en_US when not localized yet.
 */
export async function readOfferBaseline(context, locale, productArrangementCode) {
    const { json } = await getJsonFromState(offerStateKey(locale, productArrangementCode), context);
    if (json || locale === OFFER_BASELINE_FALLBACK_LOCALE) return json ?? undefined;
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
 * Writes changed baselines of a locale & deletes removed ones. The index is only updated once they all succeeded, so a
 * failed sync is fully retried next time.
 */
async function syncLocale(context, locale, baselines) {
    const { state } = context;
    const { json: index } = await getJsonFromState(offersIndexStateKey(locale), context);
    const previous = index ?? {};
    const next = Object.fromEntries(Object.entries(baselines).map(([key, value]) => [key, hash(value)]));
    const updated = Object.keys(next).filter((key) => previous[key] !== next[key]);
    const removed = Object.keys(previous).filter((key) => !(key in next));
    await inBatches([
        ...updated.map((key) => () => state.put(key, baselines[key], { ttl: TTL })),
        ...removed.map((key) => () => state.delete(key)),
    ]);
    // the bundle is also written when missing (e.g. state synced before it existed)
    const bundled = await getFromState(offersBundleStateKey(locale), context);
    if (!index || !bundled || updated.length || removed.length) {
        await state.put(offersBundleStateKey(locale), compressBundle(locale, baselines), { ttl: TTL });
        await state.put(offersIndexStateKey(locale), JSON.stringify(next), { ttl: TTL });
    }
    return { locale, total: Object.keys(next).length, updated: updated.length, removed: removed.length };
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

function webResponse(statusCode, body, headers = {}) {
    const json = JSON.stringify(body);
    // a locale wide response weighs megabytes: maximum (default) quality would take seconds
    const params = { [zlib.constants.BROTLI_PARAM_QUALITY]: WEB_BROTLI_QUALITY };
    return {
        statusCode,
        headers: { ...WEB_RESPONSE_HEADERS, ...headers },
        body: statusCode == 304 ? undefined : zlib.brotliCompressSync(json, { params }).toString('base64'),
    };
}

/**
 * Every offer baseline of a locale, falling back to en_US ones not localized yet.
 */
async function readLocaleBaselines(context, locale) {
    const locales = [...new Set([OFFER_BASELINE_FALLBACK_LOCALE, locale])];
    const bundles = await Promise.all(locales.map((bundleLocale) => readBundle(context, bundleLocale)));
    return Object.assign({}, ...bundles);
}

async function readProductArrangementBaselines(context, locale, productArrangementCodes) {
    const baselines = await Promise.all(productArrangementCodes.map((code) => readOfferBaseline(context, locale, code)));
    return Object.fromEntries(productArrangementCodes.map((code, i) => [code, baselines[i]]).filter(([, b]) => b));
}

/**
 * `{ [pa]: offerBaseline }` of the requested product arrangements (unknown ones omitted), or of the whole locale without
 * `pa`, 404 if none is known.
 * Responds 304 when `If-None-Match` matches the ETag of the response.
 * Requires an `api_key` accepted by the fragment pipeline (same configuration).
 */
async function serve(params) {
    const context = await loadConfiguration(params, Date.now());
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
    const body = productArrangementCodes.length
        ? await readProductArrangementBaselines(context, locale, productArrangementCodes)
        : await readLocaleBaselines(context, locale);
    if (!Object.keys(body).length) {
        return webResponse(404, { message: `no offer baseline found for ${pa ?? 'any product arrangement'} in ${locale}` });
    }
    const etag = `"${hash(JSON.stringify(body))}"`;
    const statusCode = context.__ow_headers?.['if-none-match'] === etag ? 304 : 200;
    return webResponse(statusCode, body, { ETag: etag });
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
    const grouped = groupBaselines(items);
    // a requested locale is synced even when empty, so that its removed baselines are deleted
    const locales = locale ? [locale] : Object.keys(grouped);
    const results = [];
    for (const syncedLocale of locales) {
        results.push(await syncLocale(context, syncedLocale, grouped[syncedLocale] ?? {}));
    }
    log(`synced offer baselines: ${JSON.stringify(results)}`, context);
    return { statusCode: 200, headers: RESPONSE_HEADERS, body: { locales: results } };
}
