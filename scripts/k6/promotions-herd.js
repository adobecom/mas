import http from 'k6/http';
import { checkResponse } from './common.js';

/*
 * MWPW-202263 — promotions "thundering-herd" before/after load test.
 *
 * Old promotions cache: one global entry, fixed 5-min TTL → every concurrent miss (cold start +
 * every 5-min expiry) fires its own /content/dam/mas/promotions folder fetch = herd.
 * New cache: per-surface, stale-while-revalidate + single-flight + jittered TTL → at most one
 * folder fetch per surface per expiry.
 *
 * Unlike the ramp/step scripts, this uses constant-vus: steady concurrency is what makes requests
 * overlap at each TTL boundary and exposes the herd. Run long enough to cross the ~5-min TTL twice.
 *
 * Each request is stamped x-request-id = <RUN>-<surface>-<vu>-<iter>; the pipeline copies it to
 * X-Correlation-ID on outbound Odin calls, so Splunk can count promo-list fetches per run + surface
 * (match: "fetch" + "path=/content/dam/mas/promotions&limit=50", isolated from all other traffic).
 *
 * Hit the action ORIGIN directly (adobeioruntime.net), NOT the CDN — the CDN would serve the
 * max-age=300 cached response and never execute the pipeline.
 *
 *   TEST_FRAG_URL=14257-merchatscale-npeltier.adobeioruntime.net/api/v1/web/MerchAtScale/fragment \
 *   k6 --env USERS=10 --env DURATION=15m --env RUN=main-baseline run ./promotions-herd.js
 *   # redeploy the branch, then:
 *   ... --env RUN=branch-202263 run ./promotions-herd.js
 */

const NB_USER = __ENV.USERS || 10;
const RUN = __ENV.RUN || 'run';

// One published fragment per DISTINCT surface (surface is derived from the fragment's Odin path).
// Real prod-observed id/locale pairs, so they resolve against odin.adobe.com.
const SURFACES = [
    { surface: 'acom', id: '4149d5c8-a4b7-494d-90b4-be8502a10722', locale: 'de_AT' },
    { surface: 'ccd', id: '26083f87-e887-4cb7-a06b-4d13d49f470b', locale: 'fr_FR' },
    { surface: 'express', id: '8220e56c-4278-4c46-a2fb-d0915122a802', locale: 'en_US' },
];

export const options = {
    scenarios: {
        herd: {
            executor: 'constant-vus',
            vus: NB_USER,
            duration: __ENV.DURATION || '15m',
        },
    },
    thresholds: { http_req_failed: ['rate<0.05'] },
};

export default function () {
    const LOG = __ENV.LOG || false;
    const baseUrl = `https://${__ENV.TEST_FRAG_URL}`;
    const api_key = __ENV.APIKEY || 'wcms-commerce-ims-ro-user-milo';
    const t = SURFACES[__VU % SURFACES.length]; // round-robin surfaces across users
    const url = `${baseUrl}?id=${t.id}&locale=${t.locale}&api_key=${api_key}`;
    const res = http.get(url, {
        headers: { 'x-request-id': `${RUN}-${t.surface}-${__VU}-${__ITER}` },
        tags: { surface: t.surface, run: RUN },
    });
    checkResponse(res, () => {}, LOG);
}
