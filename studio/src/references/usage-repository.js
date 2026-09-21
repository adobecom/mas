/**
 * Fragment usage from Akamai request logs (MWPW-185891).
 *
 * Studio never talks to Grafana directly: the `glsa_` service token has to stay server side, and
 * Grafana would CORS-block a browser POST anyway. This calls the `fragment-usage` IO Runtime
 * action, which reads pre-aggregated pages that an hourly job writes -- so the call is a cheap
 * State lookup, not a log scan.
 *
 * Every failure degrades to `{ available: false }` (action not deployed, auth, CORS, network). The
 * usage row then renders "Usage data unavailable" and the rest of the editor is untouched.
 */

import { REGION_GROUPS } from '../locales.js';

const IMS_ORG_ID = '3B962FB55F5F922E0A495C88';

/** Label for a page that no single region accounts for. */
export const GLOBAL_REGION = 'Global';

/**
 * Share of a page's requests one region must hold before the page is filed under it.
 *
 * Almost no page is served from a single region -- measured over an hour of live traffic, only 18
 * of the 400 busiest pages were -- so filing by "spans more than one region" would label 95% of
 * them Global and leave the regional groups empty. Requiring a dominant share instead splits the
 * same pages usefully. Tunable: it is a presentation threshold, not a fact about the data.
 */
export const DOMINANT_REGION_SHARE = 0.8;

/** Country code -> region name, derived from the same grouping the locale picker uses. */
const COUNTRY_REGIONS = new Map(REGION_GROUPS.flatMap(({ name, countries }) => countries.map((country) => [country, name])));

/**
 * Country codes whose Adobe-facing name differs from their ISO code.
 *
 * Akamai reports ISO 3166 alpha-2, so the United Kingdom arrives as `GB`, but every Adobe surface
 * (locale picker, URL prefix, the design for this panel) calls it `uk`.
 */
const COUNTRY_DISPLAY_ALIASES = { GB: 'uk' };

/**
 * Region a page belongs to, or Global when no one region dominates its traffic.
 *
 * Countries outside REGION_GROUPS still count toward the total but vote for no region, so traffic
 * we cannot attribute pushes a page toward Global rather than toward a region it may not belong to.
 *
 * @param {Object} countries country code -> request count
 * @returns {string} region name, or GLOBAL_REGION
 */
export function resolveRegion(countries) {
    let total = 0;
    const byRegion = new Map();

    for (const [country, requests] of Object.entries(countries ?? {})) {
        const count = Number(requests) || 0;
        if (count <= 0) continue;
        total += count;
        const region = COUNTRY_REGIONS.get(String(country).toUpperCase());
        if (region) byRegion.set(region, (byRegion.get(region) ?? 0) + count);
    }

    if (!total) return GLOBAL_REGION;

    let leader = null;
    let leaderCount = 0;
    for (const [region, count] of byRegion) {
        if (count > leaderCount) {
            leader = region;
            leaderCount = count;
        }
    }

    return leaderCount / total >= DOMINANT_REGION_SHARE ? leader : GLOBAL_REGION;
}

/**
 * Country codes for display, busiest first.
 * @param {Object} countries country code -> request count
 * @returns {Array<string>} lower-cased codes, e.g. ['us', 'uk']
 */
export function formatCountries(countries) {
    return Object.entries(countries ?? {})
        .filter(([, requests]) => (Number(requests) || 0) > 0)
        .sort(([countryA, a], [countryB, b]) => (Number(b) || 0) - (Number(a) || 0) || countryA.localeCompare(countryB))
        .map(([country]) => {
            const code = String(country).toUpperCase();
            return (COUNTRY_DISPLAY_ALIASES[code] ?? code).toLowerCase();
        });
}

/**
 * Groups pages into the regions the panel lists, keeping only regions that have pages.
 *
 * Global leads because it is the largest group in practice; the rest follow the locale picker's
 * order so the two read the same way.
 *
 * @param {Array<{ region: string }>} pages normalised pages
 * @returns {Array<{ region: string, pages: Array }>} ordered, non-empty groups
 */
export function groupPagesByRegion(pages) {
    const order = [GLOBAL_REGION, ...REGION_GROUPS.map(({ name }) => name)];
    return order
        .map((region) => ({ region, pages: (pages ?? []).filter((page) => page.region === region) }))
        .filter((group) => group.pages.length > 0);
}

/**
 * Whether a value is an absolute http(s) URL, and so safe to render as an href.
 * @param {*} url candidate url
 * @returns {boolean} true when the value parses to an http or https URL
 */
function isLinkableUrl(url) {
    try {
        const { protocol } = new URL(String(url ?? ''));
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Keeps only entries with a usable absolute http(s) URL, and files each under a region.
 *
 * Rows are page-and-locale, not page: the same URL serves several locales and those are separate
 * audiences, so two rows can share a url and differ only in locale.
 *
 * The list is rendered as clickable links, so anything that is not an absolute http(s) URL is
 * dropped rather than shown as a dead row -- and this is the guard that stops a hostile referer
 * value (`javascript:`, `data:`) from ever reaching an href.
 *
 * @param {Array} raw pages from the action
 * @returns {Array<{ url: string, locale: string, requests: number, countries: Array<string>, region: string }>} rows
 */
function normalizePages(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((page) => isLinkableUrl(page?.url))
        .map((page) => ({
            url: String(page.url),
            locale: String(page.locale ?? ''),
            requests: Number(page.requests) || 0,
            countries: formatCountries(page.countries),
            region: resolveRegion(page.countries),
        }));
}

/**
 * Normalises the action payload into the shape the UI renders.
 * @param {Object} payload body returned by the fragment-usage action
 * @returns {{ available: boolean, updatedAt?: string|null, pages?: Array }}
 */
export function parseUsageResponse(payload) {
    if (!payload || payload.available !== true) return { available: false };

    return {
        available: true,
        updatedAt: payload.updatedAt ?? null,
        pages: normalizePages(payload.pages),
    };
}

function resolveToken() {
    return sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
}

function resolveIoBaseUrl() {
    return document.querySelector('meta[name="io-base-url"]')?.content;
}

/**
 * Whether an external-usage lookup can succeed at all in this environment.
 *
 * Checked before the editor starts a load so that a Studio build with no IO backend wired up (unit
 * tests, a local page without the io-base-url meta) skips the request entirely. Starting it anyway
 * costs two full editor re-renders -- one to show the spinner, one to clear it -- for a call that
 * was always going to return { available: false }.
 * @returns {boolean} true when both the IO base URL and an IMS token are resolvable
 */
export function canFetchFragmentUsage() {
    return Boolean(resolveIoBaseUrl() && resolveToken());
}

/**
 * Fetches usage for one fragment.
 * @param {string} fragmentId fragment id
 * @param {{ signal?: AbortSignal, fetchImpl?: typeof fetch, ioBaseUrl?: string, token?: string }} [options]
 * @returns {Promise<{ available: boolean, updatedAt?: string|null, pages?: Array }>}
 */
export async function fetchFragmentUsage(fragmentId, options = {}) {
    const { signal, fetchImpl = fetch, ioBaseUrl = resolveIoBaseUrl(), token = resolveToken() } = options;

    if (!fragmentId || !ioBaseUrl || !token) return { available: false };

    try {
        const response = await fetchImpl(`${ioBaseUrl}/fragment-usage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-gw-ims-org-id': IMS_ORG_ID,
            },
            body: JSON.stringify({ fragmentId }),
            signal,
        });

        if (!response.ok) return { available: false };

        return parseUsageResponse(await response.json());
    } catch {
        return { available: false };
    }
}
