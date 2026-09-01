/**
 * PROTOTYPE (epic 4A, MWPW-185891) — proxy TrafficPeak/Grafana fragment-usage queries.
 *
 * The Grafana `glsa_` service token is injected as the `GRAFANA_SERVICE_TOKEN` action input
 * (sourced from `$GRAFANA_SERVICE_TOKEN` in the deploy `.env`). It NEVER appears in source, in
 * logs, or in the response body — the whole reason this proxy exists instead of a browser call:
 *   - a browser-exposed static service token is a permanent secret leak;
 *   - grafana is a third-party origin and would be CORS-blocked from mas.adobe.com anyway.
 *
 * The caller's own IMS bearer is validated first (require-adobe-auth + validateToken), so only
 * authenticated Studio users can reach it. The ClickHouse query is built HERE (server side), never
 * accepted from the client, so the client cannot inject SQL.
 *
 * TODO(4A/ops): confirm the ClickHouse table + column names (placeholder below) and the Grafana host
 * — TrafficPeak migrated to https://adobe-grafana.trafficpeak.live (old grafana-us host retired).
 */
const { Ims } = require('@adobe/aio-lib-ims');

const DEFAULT_GRAFANA_URL = 'https://adobe-grafana.trafficpeak.live';
// Datasource + schema derived from the "M@S - web_commerce_artifact" Grafana dashboard on the
// migrated adobe-grafana instance (the epic's fdyta6qpga2o0d / mas_fragment_requests were stale).
const GRAFANA_DATASOURCE_UID = 'ffmjsr3rpsrnkc';
const USAGE_TABLE = 'akamai.logs';
// The direct fragment request endpoint. FluffyJaws (M@S monitoring wiki + MWPW-185891) confirms the
// canonical source is reqPath = '/mas/io/fragment' with id/locale/api_key in the query string —
// NOT the web_commerce_artifact WCS path. Extract the exact params rather than substring-matching.
const MAS_FRAGMENT_ENDPOINT = '/mas/io/fragment';
// Per-fragment usage scans raw CDN logs, so keep the default window tight (7d) pending ops sign-off.
const DEFAULT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const authorize = async (headers = {}) => {
    const authHeader = headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token) {
            const imsValidation = await new Ims('prod').validateToken(token);
            return imsValidation.valid;
        }
    }
    return false;
};

function buildUsageQuery(fragmentId, fromMs, toMs) {
    const fromSec = Math.floor(fromMs / 1000);
    const toSec = Math.floor(toMs / 1000);
    // fragmentId is validated to /^[\w-]+$/ by the caller, so it is safe to interpolate into the
    // string literals below. api_key is pulled out of the query string with a regex capture.
    // NOTE (validate on first real run): query shape confirmed by FluffyJaws against the M@S story
    // (MWPW-185891) + monitoring wiki, but not executed here (cluster probes are gated). The one
    // thing to sanity-check live is the reqTimeSec filter form (toDateTime vs raw seconds).
    // extractURLParameter needs a leading '?', so prepend it to the bare query string.
    const qs = "concat('?', queryStr)";
    const rawSql =
        `SELECT extractURLParameter(${qs}, 'api_key') AS api_key, ` +
        `extractURLParameter(${qs}, 'locale') AS locale, country, count() AS count ` +
        `FROM ${USAGE_TABLE} ` +
        `WHERE reqPath = '${MAS_FRAGMENT_ENDPOINT}' ` +
        `AND reqTimeSec >= toDateTime(${fromSec}) AND reqTimeSec <= toDateTime(${toSec}) ` +
        `AND extractURLParameter(${qs}, 'id') = '${fragmentId}' ` +
        `GROUP BY api_key, locale, country ORDER BY count DESC ` +
        `SETTINGS hdx_query_max_execution_time=60, hdx_query_admin_comment='mas-studio-fragment-usage'`;
    return {
        from: String(fromMs),
        to: String(toMs),
        queries: [
            {
                refId: 'A',
                datasource: { type: 'grafana-clickhouse-datasource', uid: GRAFANA_DATASOURCE_UID },
                rawSql,
                format: 1,
            },
        ],
    };
}

async function main(params) {
    const headers = params.__ow_headers || {};
    try {
        if (!(await authorize(headers))) {
            return { statusCode: 401, body: 'Unauthorized: Bearer token is missing or invalid' };
        }
        const fragmentId = params.fragmentId;
        // fragment ids are UUIDs; reject anything else so it can never break out of the SQL literal
        if (!fragmentId || !/^[\w-]+$/.test(fragmentId)) {
            return { statusCode: 400, body: 'A valid fragmentId is required' };
        }
        const token = params.GRAFANA_SERVICE_TOKEN;
        if (!token) {
            return { statusCode: 503, body: 'Usage proxy not configured (missing GRAFANA_SERVICE_TOKEN)' };
        }
        const grafanaUrl = params.GRAFANA_SERVICE_URL || DEFAULT_GRAFANA_URL;
        const to = Date.now();
        const from = to - DEFAULT_WINDOW_MS;

        const response = await fetch(`${grafanaUrl}/api/ds/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(buildUsageQuery(fragmentId, from, to)),
        });
        if (!response.ok) {
            return { statusCode: response.status, body: `Grafana query failed: ${response.status}` };
        }
        // No custom headers: I/O Runtime auto-adds CORS (Access-Control-Allow-Origin) only when the
        // response has none. Setting Content-Type here would drop CORS and break the browser call.
        return { statusCode: 200, body: await response.json() };
    } catch (error) {
        return { statusCode: 500, body: `ERROR in usage proxy: ${error.toString()}` };
    }
}

exports.main = main;
