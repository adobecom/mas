import http from 'k6/http';
import { checkResponse } from './common.js';

/*
 * MWPW-202675 — dictionary/placeholder "thundering-herd" before/after load test.
 *
 * Old dictionary cache: per (surface, locale) entry, fixed 5-min TTL, no single-flight → every
 * concurrent miss (cold start + every 5-min expiry) fires its own `dictionary/index` fetch. The
 * WORST key is the GLOBAL baseline `acom/<baseLocale>`: it is read by EVERY placeholder-bearing
 * request on EVERY surface (replace.init calls getDictionary unconditionally), so at each TTL
 * boundary the entire fleet herds onto one `direct-hydrated` Odin fragment.
 * New cache: jittered TTL + single-flight + stale-while-revalidate (createSwrCache) → at most ONE
 * refill per (surface, baseLocale) per expiry, and ONE shared refill for `acom/<baseLocale>`.
 *
 * This test must vary BOTH dimensions to expose the two shared keys:
 *   1. GLOBAL baseline `acom/<baseLocale>` — cluster many entries on the SAME base locale (e.g.
 *      en_US) across DIFFERENT surfaces, so they all read the one shared acom layer.
 *   2. SURFACE baseline `<surface>/<baseLocale>` — put SEVERAL fragment ids on the same
 *      surface+locale, proving fragment count does not multiply the surface's dictionary fetch.
 *   3. (optional) REGION overlay `<surface>/<regionLocale>` — add a `country` so a base-locale
 *      request reaches a region layer (e.g. locale=en_US + country=AU → en_AU overlay).
 *
 * Uses constant-arrival-rate: RPS is pinned (bounded, no DDoS), and must run long enough to cross
 * the ~5-min TTL at least once so a refill (not just the cold fill) is observed.
 *
 * Each request is stamped x-request-id = <RUN>-<surface>-<locale>[-<country>]-<vu>-<iter>; the
 * pipeline copies it to X-Correlation-ID on outbound Odin calls, so Splunk can count dictionary
 * fetches per run/surface/locale in isolation. Match the dictionary index fetch:
 *   "fetch" + "dictionary/index"                          → all layers
 *   "fetch" + "path=/content/dam/mas/acom/en_US/dictionary/index"  → the shared global baseline
 * Split on the <RUN>/<surface>/<locale> prefix of X-Correlation-ID.
 *
 * Hit the action ORIGIN directly (adobeioruntime.net), NOT the CDN — the CDN would serve the
 * max-age=300 cached response and never execute the pipeline.
 *
 *   TEST_FRAG_URL=14257-merchatscale-npeltier.adobeioruntime.net/api/v1/web/MerchAtScale/fragment \
 *   k6 --env RPS=10 --env DURATION=12m --env RUN=main-baseline run ./dictionary-herd.js
 *   # redeploy the branch, then:
 *   ... --env RUN=branch-202675 run ./dictionary-herd.js
 * Quick smoke (bounded, ~1 expiry): --env RPS=5 --env DURATION=6m. Default RPS=10, DURATION=12m.
 */

// RPS is PINNED (constant-arrival-rate), so front-end load is bounded and predictable — this is a
// "does it work + minimal dictionary fetches" test, NOT a stress test. Default 10 rps ≈ half the
// prod baseline in the excerpt (~19 rps), enough concurrency to overlap refill windows without
// DDoS'ing a dev namespace. The branch's dictionary→Odin fetches are decoupled from this rate
// (single-flight + jittered TTL → ~1 fetch per (surface, locale) key per ~5-min expiry), so raising
// RPS does NOT raise dictionary traffic on the branch — it only would on the old cache.
const RPS = Number(__ENV.RPS || 10);
const RUN = __ENV.RUN || 'run';
// DURATION must cross the ~5-min TTL at least once (cold fill + one refill). 12m ≈ two expiries.
const DURATION = __ENV.DURATION || '12m';

// Data table — one row per (surface, apiKey, fragment id, locale[, country]), sampled from a real
// 5-minute prod window (~5.7k requests; see MWPW-202675 excerpt). Each id resolves to its TRUE Odin
// surface server-side (surface is derived from the fragment path, not from apiKey/`surface` here —
// the `surface` label is only a client-side proxy for splitting Splunk). `apiKey` is per-row because
// it is validated server-side; override with --env APIKEY to force one.
//
// The sample is shaped to expose the two shared dictionary keys the new cache protects:
//   • GLOBAL `acom/<baseLocale>` — ~30 rows are en_US across 6 surfaces, so they all read the one
//     shared `acom/en_US` layer (the worst herd: it mirrors prod, where en_US is ~49% of traffic);
//   • SURFACE `<surface>/en_US` — 2-3 distinct ids per surface prove it is fetched once per surface,
//     not once per fragment.
// Region overlays (`<surface>/<regionLocale>`) are exercised by the en_US + country rows (AU/IN/GB/
// JP/DE/FR/CH/HK — all observed in prod), plus a non-en_US locale mix for realism.
const FRAGMENTS = [
    { surface: 'acom', apiKey: 'wcms-commerce-ims-ro-user-milo', id: '7d40eee3-1440-4cc0-bdf0-38e9d15d6ba6', locale: 'en_US' },
    { surface: 'acom', apiKey: 'wcms-commerce-ims-ro-user-milo', id: 'e6e35985-bcc3-4d2a-bbe5-c9eb4b3851e8', locale: 'en_US' },
    { surface: 'acom', apiKey: 'wcms-commerce-ims-ro-user-milo', id: '622eaa80-2b16-4a4d-a68f-88fd85674ca6', locale: 'en_US' },
    { surface: 'cc', apiKey: 'wcms-commerce-ims-ro-user-milo-cc', id: '8dfc7546-4f5c-4807-bbfa-22ba63aa6559', locale: 'en_US' },
    { surface: 'cc', apiKey: 'wcms-commerce-ims-ro-user-milo-cc', id: '8c6e70d4-1549-4565-9b79-81ea015b128f', locale: 'en_US' },
    { surface: 'cc', apiKey: 'wcms-commerce-ims-ro-user-milo-cc', id: 'ac667a75-9a67-4b44-9212-19ef5e1ed23c', locale: 'en_US' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_10', id: 'b7e9a40c-564a-48bb-b302-a6e490243aaf', locale: 'en_US' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_10', id: '26083f87-e887-4cb7-a06b-4d13d49f470b', locale: 'en_US' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_10', id: 'e80b797d-f075-478f-8765-5b66e7dd46d5', locale: 'en_US' },
    { surface: 'cchome', apiKey: 'CCHomeWeb1', id: '8a5d5b39-ea18-4e0f-803b-9f8405095adb', locale: 'en_US' },
    { surface: 'cchome', apiKey: 'CCHomeWeb1', id: 'adf49c08-6eae-4031-9df5-1d953580036b', locale: 'en_US' },
    { surface: 'dc', apiKey: 'wcms-commerce-ims-ro-user-milo-dc', id: 'eb87df8b-1642-4858-95e0-ce50b15fa12f', locale: 'en_US' },
    { surface: 'dc', apiKey: 'wcms-commerce-ims-ro-user-milo-dc', id: 'f0895cee-13d3-4b4c-88bd-5c935853b678', locale: 'en_US' },
    { surface: 'dc', apiKey: 'wcms-commerce-ims-ro-user-milo-dc', id: '3c587332-9c69-423f-a368-a52b23550364', locale: 'en_US' },
    { surface: 'express', apiKey: 'AdobeExpressWeb', id: '034430e2-34cd-4466-9448-15d4c5c969ff', locale: 'en_US' },
    { surface: 'express', apiKey: 'AdobeExpressWeb', id: '8220e56c-4278-4c46-a2fb-d0915122a802', locale: 'en_US' },
    { surface: 'express', apiKey: 'AdobeExpressWeb', id: '882fe968-0702-4e81-a175-3ddad85ce13f', locale: 'en_US' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_9', id: '26083f87-e887-4cb7-a06b-4d13d49f470b', locale: 'en_US' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_8', id: '1bed0673-83cd-4494-b48b-9af1603bd3e4', locale: 'en_US' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_8', id: '98433df0-160b-41a1-88fb-06c63aacadab', locale: 'en_US' },
    // Region overlays — en_US base + country → `<surface>/<regionLocale>` overlay (all prod-observed):
    {
        surface: 'ccd',
        apiKey: 'CreativeCloud_v6_10',
        id: '26083f87-e887-4cb7-a06b-4d13d49f470b',
        locale: 'en_US',
        country: 'AU',
    },
    { surface: 'cchome', apiKey: 'CCHomeWeb1', id: '8a5d5b39-ea18-4e0f-803b-9f8405095adb', locale: 'en_US', country: 'IN' },
    {
        surface: 'ccd',
        apiKey: 'CreativeCloud_v6_10',
        id: '73c62faf-cd8e-4a61-a372-d88124d1e466',
        locale: 'en_US',
        country: 'GB',
    },
    {
        surface: 'ccd',
        apiKey: 'CreativeCloud_v6_9',
        id: '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4',
        locale: 'en_US',
        country: 'JP',
    },
    {
        surface: 'ccd',
        apiKey: 'CreativeCloud_v6_10',
        id: '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4',
        locale: 'en_US',
        country: 'DE',
    },
    {
        surface: 'ccd',
        apiKey: 'CreativeCloud_v6_10',
        id: '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4',
        locale: 'en_US',
        country: 'CH',
    },
    {
        surface: 'ccd',
        apiKey: 'CreativeCloud_v6_10',
        id: 'e80b797d-f075-478f-8765-5b66e7dd46d5',
        locale: 'en_US',
        country: 'HK',
    },
    // Non-en_US locale mix (own base language → distinct acom/<baseLocale> layers):
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_10', id: '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4', locale: 'fr_FR' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_10', id: '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4', locale: 'de_DE' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_10', id: '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4', locale: 'ja_JP' },
    { surface: 'acom', apiKey: 'wcms-commerce-ims-ro-user-milo', id: '86bf8962-2bd9-4c18-a51b-f8a779d17f0c', locale: 'ko_KR' },
    { surface: 'acom', apiKey: 'wcms-commerce-ims-ro-user-milo', id: '745bf04d-0112-4468-a6d4-15db07e93578', locale: 'en_IN' },
    { surface: 'cchome', apiKey: 'CCHomeWeb1', id: '26083f87-e887-4cb7-a06b-4d13d49f470b', locale: 'es_ES' },
    { surface: 'ccd', apiKey: 'CreativeCloud_v6_9', id: 'b7e9a40c-564a-48bb-b302-a6e490243aaf', locale: 'zh_CN' },
    { surface: 'acom', apiKey: 'wcms-commerce-ims-ro-user-milo', id: '745bf04d-0112-4468-a6d4-15db07e93578', locale: 'en_GB' },
];

export const options = {
    scenarios: {
        herd: {
            executor: 'constant-arrival-rate',
            rate: RPS, // iterations (requests) per second — the hard RPS cap
            timeUnit: '1s',
            duration: DURATION,
            // Enough VUs to sustain the rate even if the origin is slow (rate / min-RTT headroom);
            // k6 warns (not floods) if it can't keep up rather than exceeding the cap.
            preAllocatedVUs: Math.max(10, RPS * 3),
            maxVUs: Math.max(20, RPS * 6),
        },
    },
    thresholds: { http_req_failed: ['rate<0.05'] },
};

export default function () {
    const LOG = __ENV.LOG || false;
    const baseUrl = `https://${__ENV.TEST_FRAG_URL}`;
    // Cycle each VU through EVERY row over successive iterations (VU + ITER), so at any instant the
    // live VUs are spread across all surfaces/fragments — maximising overlap at each TTL boundary.
    const t = FRAGMENTS[(__VU + __ITER) % FRAGMENTS.length];
    const api_key = __ENV.APIKEY || t.apiKey; // per-row key (validated server-side); --env APIKEY forces one
    const country = t.country ? `&country=${t.country}` : '';
    const url = `${baseUrl}?id=${t.id}&locale=${t.locale}${country}&api_key=${api_key}`;
    const geo = t.country ? `${t.locale}-${t.country}` : t.locale;
    const res = http.get(url, {
        headers: { 'x-request-id': `${RUN}-${t.surface}-${geo}-${__VU}-${__ITER}` },
        tags: { surface: t.surface, locale: t.locale, run: RUN },
    });
    checkResponse(res, () => {}, LOG);
}
