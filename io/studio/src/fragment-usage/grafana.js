/**
 * Grafana/TrafficPeak client for fragment usage (MWPW-185891).
 *
 * The `glsa_` service token is injected as an action input and never appears in source, in logs, or
 * in any response body. That is the whole reason this runs server side: a browser-exposed static
 * service token would be a permanent secret leak, and Grafana is a third-party origin that a
 * mas.adobe.com page could not reach anyway.
 *
 * IMPORTANT -- /api/ds/query expands `$__timeFilter` server side but does NOT expand Grafana
 * template variables (`${table}`, `$statusCode`) or the ClickHouse `$__conditionalAll` macro. Those
 * are resolved by the Grafana frontend before it posts. Copying SQL out of a dashboard panel
 * therefore fails with `Syntax error ... ($)` or `Missing columns: '$__all'`. Every query built here
 * must be fully literal, which is why the time bounds are interpolated as explicit epoch seconds.
 */

const { MAX_PAGES_PER_HOUR, MAX_COUNTRIES_PER_PAGE, addPage, capPages } = require('./pages');

const DEFAULT_GRAFANA_URL = 'https://adobe-grafana.trafficpeak.live';
const GRAFANA_DATASOURCE_UID = 'ffmjsr3rpsrnkc';
const GRAFANA_ORG_ID = '2';
const USAGE_TABLE = 'akamai.logs';

/** Canonical direct-request endpoint; id/locale/api_key travel in the query string. */
const MAS_FRAGMENT_ENDPOINT = '/mas/io/fragment';

/** Matches the dashboard's cap. A 1h rollup lands in ~1.5s, so this is headroom, not a target. */
const MAX_EXECUTION_SECONDS = 60;

/**
 * Width of each sub-window the pages query is split into.
 *
 * Grouping by country multiplies the row count, and the window the rollup asks for (LOOKBACK_HOURS)
 * is wider than one hour, so a single request returns a response large enough to be worth avoiding:
 * measured at ~1.1MB for one hour, against ~0.49MB for a 15-minute slice. Splitting also makes each
 * query cheap (~0.3s), so the run is faster in total than the single wide query it replaces.
 *
 * Sub-windows are summed back together per hour by fetchHourlyPages, so this is purely a transport
 * concern and does not change what gets stored.
 */
const CHUNK_SECONDS = 15 * 60;

/**
 * Referer query parameters that change which cards a page shows, and so must survive
 * canonicalisation.
 *
 * Nearly every query string on a referer is campaign tracking (`sdid`, `mv`, `gad_source`,
 * `ttclid`), and keeping those would let one page fill the whole list under dozens of ad variants.
 * These two are different: `plan=edu|team|individual` and `tab` select what the page renders, so
 * collapsing them would merge pages that genuinely show different fragments. Measured over 15
 * minutes of live traffic, `plan` appears on 1.4% of referers and `tab` on 0.01%, so the extra
 * cardinality is negligible.
 */
const KEPT_PAGE_PARAMS = ['plan', 'tab'];

/**
 * SQL for the allowlisted portion of a referer's query string, as a leading-`&` fragment.
 *
 * Values are cut to a leading run of safe characters rather than taken whole: malformed referers
 * in live traffic carry a second, sometimes percent-encoded, `?` inside the value
 * (`plan=individual%3Fsdid%3DZKD5F75J`), and this is also what keeps arbitrary referer text out of
 * a URL that Studio later renders as a link.
 *
 * `referer` is Nullable, and a bare array literal over a Nullable column is rejected by ClickHouse
 * ("Nested type Array(String) cannot be inside Nullable type"), so this is built by string concat
 * with an explicit ifNull rather than with arrayFilter.
 *
 * @returns {string} SQL expression evaluating to '' or '&name=value&name=value'
 */
function buildKeptParamsSql() {
    const ref = "ifNull(referer, '')";
    return `concat(${KEPT_PAGE_PARAMS.map((name) => {
        const raw = `extractURLParameter(${ref}, '${name}')`;
        return `if(${raw} != '', concat('&${name}=', substringUTF8(extract(${raw}, '^[A-Za-z0-9_-]+'), 1, 32)), '')`;
    }).join(', ')})`;
}

/**
 * Builds the hourly consuming-pages query: the top pages driving each fragment's traffic, the
 * locale each page requested it in, and the countries those pages were served from.
 *
 * `referer` is the page whose markup requested the fragment. It is NULL or empty for non-browser
 * consumers (the Creative Cloud desktop app sends none), so those rows are excluded rather than
 * bucketed under a fake "unknown" page -- a missing referer means "we cannot know", not "no page".
 *
 * `cutQueryStringAndFragment` collapses per-visit query permutations onto one canonical page, which
 * is what stops a single page from filling the whole list under different tracking parameters.
 * KEPT_PAGE_PARAMS are then added back, so pages that differ in what they render stay distinct.
 *
 * Rows are keyed by page AND locale, not by page alone. The same URL genuinely serves several
 * locales -- measured on live traffic, `adobe.com/` requested this fragment endpoint in 15 of them
 * within a single 15-minute window -- and collapsing those would merge audiences that see
 * different content into one row.
 *
 * Countries are aggregated AFTER the rows are grouped, not by adding country to the GROUP BY.
 * Adding it there would change what the row_number cap counts: the cap would rank page-and-country
 * pairs, so a page serving six countries would consume six of the slots and the list would show
 * fewer pages than it does today.
 *
 * The country arrays are sorted by request count and sliced, so a page reached from a long tail of
 * countries keeps the ones that actually characterise it. The page total is summed separately,
 * before the slice, so that tail still counts towards it.
 *
 * @param {number} fromSec window start, epoch seconds, inclusive
 * @param {number} toSec window end, epoch seconds, exclusive
 * @returns {string} fully literal SQL
 */
function buildPagesQuery(fromSec, toSec) {
    const kept = buildKeptParamsSql();
    return (
        'SELECT bucket, fragmentId, page, locale, countries, counts, requests FROM (' +
        'SELECT bucket, fragmentId, page, locale, ' +
        `arraySlice(arraySort((country, hits) -> -hits, groupArray(country), groupArray(hits)), 1, ${MAX_COUNTRIES_PER_PAGE}) AS countries, ` +
        `arraySlice(arrayReverseSort(groupArray(hits)), 1, ${MAX_COUNTRIES_PER_PAGE}) AS counts, ` +
        'sum(hits) AS requests, ' +
        'row_number() OVER (PARTITION BY bucket, fragmentId ORDER BY sum(hits) DESC) AS rn FROM (' +
        'SELECT toUnixTimestamp(toStartOfHour(reqTimeSec)) AS bucket, ' +
        "NULLIF(extractURLParameter(concat('?', queryStr), 'id'), '') AS fragmentId, " +
        "extractURLParameter(concat('?', queryStr), 'locale') AS locale, " +
        `concat(cutQueryStringAndFragment(ifNull(referer, '')), ` +
        `if(${kept} != '', concat('?', substringUTF8(${kept}, 2)), '')) AS page, ` +
        'country, ' +
        'count() AS hits ' +
        `FROM ${USAGE_TABLE} ` +
        `WHERE reqPath = '${MAS_FRAGMENT_ENDPOINT}' ` +
        `AND reqTimeSec >= toDateTime(${fromSec}) ` +
        `AND reqTimeSec < toDateTime(${toSec}) ` +
        'AND fragmentId IS NOT NULL ' +
        "AND referer IS NOT NULL AND referer != '' " +
        'GROUP BY bucket, fragmentId, page, locale, country' +
        ') GROUP BY bucket, fragmentId, page, locale' +
        `) WHERE rn <= ${MAX_PAGES_PER_HOUR} ` +
        `SETTINGS hdx_query_max_execution_time=${MAX_EXECUTION_SECONDS}, ` +
        "hdx_query_admin_comment='mas-studio-fragment-pages-rollup'"
    );
}

/**
 * Runs a query against the ClickHouse datasource and returns the first frame's columns.
 * @param {string} rawSql fully literal SQL
 * @param {number} fromMs window start in milliseconds
 * @param {number} toMs window end in milliseconds
 * @param {object} options { token, url }
 * @returns {Promise<Array<Array<*>>>} column-oriented values
 */
async function runQuery(rawSql, fromMs, toMs, { token, url }) {
    // `|| DEFAULT` rather than a destructuring default: an unset $GRAFANA_SERVICE_URL is
    // interpolated by aio as an empty string, not undefined, so a parameter default would not fire
    // and the fetch would be issued against a relative URL.
    const base = url || DEFAULT_GRAFANA_URL;
    const response = await fetch(`${base}/api/ds/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Grafana-Org-Id': GRAFANA_ORG_ID,
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            from: String(fromMs),
            to: String(toMs),
            queries: [
                {
                    refId: 'A',
                    datasource: { type: 'grafana-clickhouse-datasource', uid: GRAFANA_DATASOURCE_UID },
                    format: 1,
                    queryType: 'table',
                    rawSql,
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Grafana query failed: ${response.status}`);
    }

    const payload = await response.json();
    const result = payload?.results?.A;
    if (result?.error) {
        throw new Error(`Grafana query error: ${result.error}`);
    }
    return result?.frames?.[0]?.data?.values ?? [];
}

/**
 * Folds one query result frame into the accumulating per-fragment map.
 * @param {Array<Array<*>>} values column-oriented frame values
 * @param {object} byFragment accumulator, mutated
 */
function collectPages(values, byFragment) {
    const [
        bucketSeconds = [],
        fragmentIds = [],
        pageUrls = [],
        locales = [],
        countryNames = [],
        countryCounts = [],
        pageRequests = [],
    ] = values;
    for (let index = 0; index < fragmentIds.length; index += 1) {
        const fragmentId = fragmentIds[index];
        const page = pageUrls[index];
        if (!fragmentId || !page) continue;

        const names = countryNames[index] ?? [];
        const counts = countryCounts[index] ?? [];
        const countries = {};
        for (let position = 0; position < names.length; position += 1) {
            countries[names[position]] = Number(counts[position]) || 0;
        }

        const epochHour = Math.floor(bucketSeconds[index] / 3600);
        if (!byFragment[fragmentId]) byFragment[fragmentId] = {};
        if (!byFragment[fragmentId][epochHour]) byFragment[fragmentId][epochHour] = {};
        addPage(byFragment[fragmentId][epochHour], page, locales[index], pageRequests[index], countries);
    }
}

/**
 * Fetches the top consuming pages, and the countries they were served from, per fragment per hour.
 *
 * The window is walked in CHUNK_SECONDS slices and summed back together, so the caller sees whole
 * hours and does not need to know the query was split. Each hour is capped once at the end rather
 * than per slice, because a page that ranks below the cap in every individual slice can still be
 * among the busiest once the slices are added up.
 *
 * @param {number} fromMs window start in milliseconds
 * @param {number} toMs window end in milliseconds
 * @param {object} options { token, url }
 * @returns {Promise<object>} fragmentId -> { epochHour: { key: { url, locale, requests, countries } } }
 */
async function fetchHourlyPages(fromMs, toMs, options) {
    const fromSec = Math.floor(fromMs / 1000);
    const toSec = Math.floor(toMs / 1000);

    const byFragment = {};
    for (let start = fromSec; start < toSec; start += CHUNK_SECONDS) {
        const end = Math.min(start + CHUNK_SECONDS, toSec);
        const values = await runQuery(buildPagesQuery(start, end), start * 1000, end * 1000, options);
        collectPages(values, byFragment);
    }

    for (const hours of Object.values(byFragment)) {
        for (const [hour, byPage] of Object.entries(hours)) {
            hours[hour] = capPages(byPage);
        }
    }
    return byFragment;
}

module.exports = {
    CHUNK_SECONDS,
    MAX_EXECUTION_SECONDS,
    buildPagesQuery,
    fetchHourlyPages,
};
