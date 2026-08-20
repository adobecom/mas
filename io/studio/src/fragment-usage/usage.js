/**
 * PROTOTYPE (epic 4A, MWPW-185891) — proxy TrafficPeak/Grafana fragment-usage queries.
 *
 * The Grafana `glsa_` service token is injected as the `GRAFANA_TRAFFICPEAK_TOKEN` action input
 * (sourced from `$GRAFANA_TRAFFICPEAK_TOKEN` in the deploy `.env`). It NEVER appears in source, in
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
const GRAFANA_DATASOURCE_UID = 'fdyta6qpga2o0d';
const GRAFANA_ORG_ID = 750;
const USAGE_TABLE = 'mas_fragment_requests'; // TODO(4A): confirm with WCMS Ops
const DEFAULT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    const rawSql =
        `SELECT locale, api_key, country, count(*) AS count FROM ${USAGE_TABLE} ` +
        `WHERE fragment_id = '${fragmentId}' AND timestamp >= fromUnixTimestamp64Milli(${fromMs}) ` +
        `AND timestamp <= fromUnixTimestamp64Milli(${toMs}) GROUP BY locale, api_key, country ORDER BY count DESC`;
    return {
        from: String(fromMs),
        to: String(toMs),
        queries: [
            {
                refId: 'A',
                datasource: { type: 'grafana-clickhouse-datasource', uid: GRAFANA_DATASOURCE_UID },
                rawSql,
                format: 1,
                meta: { orgId: GRAFANA_ORG_ID },
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
        const token = params.GRAFANA_TRAFFICPEAK_TOKEN;
        if (!token) {
            return { statusCode: 503, body: 'Usage proxy not configured (missing GRAFANA_TRAFFICPEAK_TOKEN)' };
        }
        const grafanaUrl = params.GRAFANA_TRAFFICPEAK_URL || DEFAULT_GRAFANA_URL;
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
        return {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            statusCode: 200,
            body: await response.json(),
        };
    } catch (error) {
        return { statusCode: 500, body: `ERROR in usage proxy: ${error.toString()}` };
    }
}

exports.main = main;
