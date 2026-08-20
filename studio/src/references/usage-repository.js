/**
 * PROTOTYPE — fragment usage from Akamai request logs via Grafana (epic 4A, MWPW-185891).
 *
 * This is deliberately NOT wired to Grafana directly. Two hard constraints, both confirmed in
 * research (`.claude/plans/` usage-research):
 *   1. The Grafana `glsa_` bearer is a static, long-lived service token. In browser JS it is
 *      trivially extractable => a permanent secret compromise. It must live only in an IO Runtime
 *      action's `inputs` (the same pattern as `io/studio` ost-products-read), never client-side.
 *   2. `grafana-us.trafficpeak.live` is a third-party origin that will not send CORS headers for
 *      mas.adobe.com, so a browser POST is blocked regardless of the token.
 *
 * Therefore `fetchFragmentUsage` targets a FUTURE IO action proxy (`USAGE_ENDPOINT`), not Grafana,
 * and returns `{ available: false }` on any failure so a missing/unbuilt proxy renders nothing and
 * never breaks the fragment editor. `buildUsageQuery` / `parseUsageResponse` are pure and fully
 * unit-tested today against mocked Grafana JSON, so the contract is ready the moment ops provisions
 * the token + action.
 *
 * Scope note: the epic's documented query groups by fragment_id / locale / api_key / country — that
 * yields request COUNTS per consumer dimension, which is the closest available signal for "who uses
 * this fragment". Actual referer PAGE URLs would need a different ClickHouse query (a referer/url
 * column), whose schema is unconfirmed — flagged, not built.
 */

export const GRAFANA_DATASOURCE_UID = 'fdyta6qpga2o0d';
export const GRAFANA_ORG_ID = 750;

// Future IO Runtime action that proxies Grafana with the service token. Not yet implemented.
export const USAGE_ENDPOINT = '/mas/io/fragment/usage';

// ClickHouse source for the Akamai fragment-request logs. Table name is a placeholder pending
// confirmation with the 4A/ops owners; the dimension columns match the epic spec.
const USAGE_TABLE = 'mas_fragment_requests';
const DEFAULT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // last 30 days

/**
 * Builds a Grafana `/api/ds/query` request body for the per-consumer usage of one fragment.
 * @param {string} fragmentId
 * @param {{ fromMs?: number, toMs?: number, refId?: string }} [options]
 * @returns {Object} the ds/query body (datasource ref + one raw ClickHouse SQL query)
 */
export function buildUsageQuery(fragmentId, { fromMs, toMs, refId = 'A' } = {}) {
    if (!fragmentId) throw new Error('fragmentId is required');
    const to = toMs ?? Date.now();
    const from = fromMs ?? to - DEFAULT_WINDOW_MS;
    const datasource = { type: 'grafana-clickhouse-datasource', uid: GRAFANA_DATASOURCE_UID };
    const rawSql =
        `SELECT locale, api_key, country, count(*) AS count FROM ${USAGE_TABLE} ` +
        `WHERE fragment_id = '${fragmentId}' AND timestamp >= fromUnixTimestamp64Milli(${from}) ` +
        `AND timestamp <= fromUnixTimestamp64Milli(${to}) GROUP BY locale, api_key, country ORDER BY count DESC`;
    return {
        from: String(from),
        to: String(to),
        queries: [{ refId, datasource, rawSql, format: 1, meta: { orgId: GRAFANA_ORG_ID } }],
    };
}

/**
 * Parses a Grafana `/api/ds/query` response (columnar frames) into usage rows.
 * @param {Object} response the ds/query JSON
 * @param {string} [refId]
 * @returns {Array<{ locale: string, apiKey: string, country: string, count: number }>}
 */
export function parseUsageResponse(response, refId = 'A') {
    const frames = response?.results?.[refId]?.frames;
    if (!Array.isArray(frames) || !frames.length) return [];
    const rows = [];
    for (const frame of frames) {
        const fields = frame?.schema?.fields ?? [];
        const columns = frame?.data?.values ?? [];
        const indexOf = (name) => fields.findIndex((f) => f.name === name);
        const li = indexOf('locale');
        const ai = indexOf('api_key');
        const ci = indexOf('country');
        const ni = indexOf('count');
        const length = columns[ni]?.length ?? 0;
        for (let i = 0; i < length; i += 1) {
            rows.push({
                locale: li >= 0 ? columns[li][i] : '',
                apiKey: ai >= 0 ? columns[ai][i] : '',
                country: ci >= 0 ? columns[ci][i] : '',
                count: Number(columns[ni][i]) || 0,
            });
        }
    }
    return rows;
}

/**
 * Fetches fragment usage via the future IO proxy. Degrades to `{ available: false }` on any error
 * (no proxy yet, auth failure, CORS, network) so the caller can render nothing intrusive.
 * @param {string} fragmentId
 * @param {{ signal?: AbortSignal, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<{ available: boolean, rows?: Array<Object>, totalCount?: number }>}
 */
export async function fetchFragmentUsage(fragmentId, { signal, fetchImpl = fetch } = {}) {
    if (!fragmentId) return { available: false };
    try {
        const response = await fetchImpl(USAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildUsageQuery(fragmentId)),
            signal,
        });
        if (!response.ok) return { available: false };
        const rows = parseUsageResponse(await response.json());
        return { available: true, rows, totalCount: rows.reduce((sum, r) => sum + r.count, 0) };
    } catch {
        return { available: false };
    }
}
