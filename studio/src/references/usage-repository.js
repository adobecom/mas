/**
 * PROTOTYPE (epic 4A, MWPW-185891) — fragment usage from Akamai request logs via Grafana.
 *
 * The Studio client never talks to Grafana directly: the `glsa_` service token must stay server side
 * (a browser-exposed static token is a permanent leak) and Grafana would CORS-block a browser POST
 * anyway. So this calls the `fragment-usage` IO Runtime action (`io/studio/src/fragment-usage`),
 * which holds the token as a deploy secret, builds the ClickHouse query, and returns the raw Grafana
 * ds/query JSON. `parseUsageResponse` turns that columnar response into rows and is fully unit-tested.
 *
 * `fetchFragmentUsage` degrades to `{ available: false }` on any failure (action not deployed yet,
 * no token, auth, CORS, network), so nothing renders until the proxy is live — the shipped reference
 * list is never affected.
 *
 * Scope note: the query groups by locale / api_key / country — request COUNTS per consumer, the
 * closest available signal for "who uses this fragment". Actual referer PAGE URLs would need a
 * different ClickHouse query (a referer/url column), which is unconfirmed and out of this slice.
 */

const IMS_ORG_ID = '3B962FB55F5F922E0A495C88';

/**
 * Parses a Grafana `/api/ds/query` response (columnar frames) into usage rows.
 * @param {Object} response the ds/query JSON returned by the proxy
 * @param {string} [refId]
 * @returns {Array<{ apiKey: string, locale: string, country: string, count: number }>}
 */
export function parseUsageResponse(response, refId = 'A') {
    const frames = response?.results?.[refId]?.frames;
    if (!Array.isArray(frames) || !frames.length) return [];
    const rows = [];
    for (const frame of frames) {
        const fields = frame?.schema?.fields ?? [];
        const columns = frame?.data?.values ?? [];
        const indexOf = (name) => fields.findIndex((field) => field.name === name);
        const apiKeyIndex = indexOf('api_key');
        const localeIndex = indexOf('locale');
        const countryIndex = indexOf('country');
        const countIndex = indexOf('count');
        const length = columns[countIndex]?.length ?? 0;
        for (let i = 0; i < length; i += 1) {
            rows.push({
                apiKey: apiKeyIndex >= 0 ? columns[apiKeyIndex][i] : '',
                locale: localeIndex >= 0 ? columns[localeIndex][i] : '',
                country: countryIndex >= 0 ? columns[countryIndex][i] : '',
                count: Number(columns[countIndex][i]) || 0,
            });
        }
    }
    return rows;
}

/**
 * Fetches fragment usage via the `fragment-usage` IO action. Degrades to `{ available: false }` on
 * any failure so the caller renders nothing intrusive.
 * @param {string} fragmentId
 * @param {{ signal?: AbortSignal, fetchImpl?: typeof fetch, ioBaseUrl?: string }} [options]
 * @returns {Promise<{ available: boolean, rows?: Array<Object>, totalCount?: number }>}
 */
export async function fetchFragmentUsage(fragmentId, { signal, fetchImpl = fetch, ioBaseUrl } = {}) {
    if (!fragmentId) return { available: false };
    const base = ioBaseUrl ?? document.querySelector('meta[name="io-base-url"]')?.content;
    if (!base) return { available: false };
    try {
        const response = await fetchImpl(`${base}/fragment-usage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
                'x-gw-ims-org-id': IMS_ORG_ID,
            },
            body: JSON.stringify({ fragmentId }),
            signal,
        });
        if (!response.ok) return { available: false };
        const rows = parseUsageResponse(await response.json());
        return { available: true, rows, totalCount: rows.reduce((sum, r) => sum + r.count, 0) };
    } catch {
        return { available: false };
    }
}
