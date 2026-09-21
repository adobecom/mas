/**
 * Consuming-page aggregation for fragment usage (MWPW-185891).
 *
 * Akamai records the page a fragment request came from in the `referer` column, and the country the
 * request came from in `country`, so "which pages use this fragment, and where are they served" is
 * derivable from one log scan -- no page audit or crawl is involved.
 *
 * A "page" here is a page URL AND the locale it requested the fragment in: the same URL serves
 * several locales (`adobe.com/` was seen in 15 of them inside one 15-minute window), and those are
 * different audiences seeing different content, so they are counted separately.
 *
 * Pages are stored per hour so the rollup keeps one merge rule for everything it writes: an hour
 * that is fetched again replaces the hour that was stored. That is what makes a retried or
 * double-fired alarm harmless.
 *
 * Only a short window is retained (PAGE_RETENTION_HOURS). This answers "where is this fragment used
 * right now", which does not need months of history, and per-hour page maps are far wider than
 * per-hour integers.
 */

/** Seven days: long enough that a weekly-traffic page still shows up, short enough to stay small. */
const PAGE_RETENTION_HOURS = 24 * 7;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Epoch hour for a timestamp. Pages are keyed by it, so the rollup and the reader agree on what
 * "an hour" is without either carrying a date library.
 * @param {number} ms milliseconds since the epoch
 * @returns {number} epoch hour
 */
function toEpochHour(ms) {
    return Math.floor(ms / HOUR_MS);
}

/**
 * Pages kept per fragment per hour. The tail of a fragment's referer distribution is long and
 * uninteresting (single-visit pages, one-off query permutations); capping keeps the rollup payload
 * bounded regardless of how widely a fragment is used.
 */
const MAX_PAGES_PER_HOUR = 20;

/**
 * Countries kept per page per hour. A busy page is reached from a long tail of countries that each
 * contribute a handful of requests; keeping every one multiplies the stored record for detail no
 * reader acts on. The kept countries are the busiest ones, so the region a page mostly serves is
 * always represented.
 */
const MAX_COUNTRIES_PER_PAGE = 12;

/** Rows handed to the UI. The dialog is a scannable list, not an analytics export. */
const MAX_PAGES_RETURNED = 100;

/**
 * Key for one page-and-locale row.
 *
 * `#` is a safe separator rather than an arbitrary one: the query builds every page with
 * cutQueryStringAndFragment, which strips the fragment, so a stored URL cannot contain `#`. A page
 * seen without a locale keys on the URL alone, which is also the shape legacy records use.
 *
 * @param {string} url page url
 * @param {string} [locale] locale the page requested the fragment in
 * @returns {string} storage key
 */
function pageKey(url, locale) {
    return locale ? `${url}#${locale}` : url;
}

/**
 * Reads one stored page entry into its current shape.
 *
 * Records written before countries and locales were collected hold a bare request count under a
 * bare-URL key. They are still inside the retention window during a rollout, so they are read
 * rather than discarded -- a fragment whose pages briefly show no countries is a better outcome
 * than one that throws. The key is the fallback URL, so no key parsing is needed to recover it.
 * The fallback is on a falsy url, not just a missing one, so a blank stored value recovers too.
 *
 * @param {number|object} entry stored value
 * @param {string} [key] storage key the entry was read from
 * @returns {{ url: string, locale: string, requests: number, countries: object }} normalised entry
 */
function readEntry(entry, key = '') {
    if (typeof entry === 'number') return { url: key, locale: '', requests: entry, countries: {} };
    return {
        url: entry?.url || key,
        locale: entry?.locale ?? '',
        requests: Number(entry?.requests) || 0,
        countries: entry?.countries ?? {},
    };
}

/**
 * Adds one page observation into an hour map, summing both the total and the per-country counts.
 *
 * Used to combine the sub-windows of a single hour, which are fetched separately, so this sums
 * rather than replaces. Whole-hour replacement is mergePages' job.
 *
 * @param {object} byPage hour map to add into, mutated
 * @param {string} url page url
 * @param {string} locale locale the page requested the fragment in
 * @param {number} requests request count to add
 * @param {object} countries country -> request count
 */
function addPage(byPage, url, locale, requests, countries = {}) {
    const key = pageKey(url, locale);
    const current = byPage[key] ?? { url, locale: locale ?? '', requests: 0, countries: {} };
    current.requests += Number(requests) || 0;
    for (const [country, count] of Object.entries(countries)) {
        if (!country) continue;
        current.countries[country] = (current.countries[country] ?? 0) + (Number(count) || 0);
    }
    byPage[key] = current;
}

/**
 * Keeps only the busiest pages in an hour map.
 *
 * Each sub-window is capped independently in SQL, so combining them can exceed the per-hour cap --
 * capping again after they are summed is what makes the stored hour match the cap. Capping the
 * sub-windows alone would not: a page that is 21st in every sub-window but busiest overall would be
 * dropped before it was ever added up.
 *
 * @param {object} byPage key -> { url, locale, requests, countries }
 * @param {number} [limit] maximum pages kept
 * @returns {object} capped hour map
 */
function capPages(byPage, limit = MAX_PAGES_PER_HOUR) {
    const entries = Object.entries(byPage ?? {});
    if (entries.length <= limit) return byPage ?? {};
    const kept = {};
    entries
        .sort(([keyA, a], [keyB, b]) => b.requests - a.requests || keyA.localeCompare(keyB))
        .slice(0, limit)
        .forEach(([key, entry]) => {
            kept[key] = entry;
        });
    return kept;
}

/**
 * Merge freshly fetched hourly page maps into the stored ones, replacing whole hours.
 * @param {object} stored epochHour -> { key: { url, locale, requests, countries } }
 * @param {object} incoming epochHour -> { key: { url, locale, requests, countries } }
 * @returns {object} merged map
 */
function mergePages(stored, incoming) {
    return { ...stored, ...incoming };
}

/**
 * Drop hours that have aged out of the page retention window.
 * @param {object} pages epochHour -> { key: { url, locale, requests, countries } }
 * @param {number} nowHour current epoch hour
 * @param {number} [retentionHours] override for tests
 * @returns {object} pruned map
 */
function prunePages(pages, nowHour, retentionHours = PAGE_RETENTION_HOURS) {
    const oldest = nowHour - retentionHours;
    const kept = {};
    for (const [hour, byPage] of Object.entries(pages)) {
        if (Number(hour) > oldest) kept[hour] = byPage;
    }
    return kept;
}

/**
 * Collapse the per-hour maps into one ranked list of pages.
 *
 * Totals are summed across the retained hours, so a page that is steadily busy outranks one that
 * spiked once -- which is the order a user scanning "where is this used" wants. Country counts are
 * summed the same way, so the caller can tell which region a page predominantly serves.
 *
 * @param {object} pages epochHour -> { key: { url, locale, requests, countries } }
 * @param {number} [limit] maximum rows returned
 * @returns {Array<{ url: string, locale: string, requests: number, countries: object }>} ranked, busiest first
 */
function topPages(pages, limit = MAX_PAGES_RETURNED) {
    const totals = {};
    for (const byPage of Object.values(pages ?? {})) {
        for (const [key, entry] of Object.entries(byPage ?? {})) {
            const { url, locale, requests, countries } = readEntry(entry, key);
            addPage(totals, url, locale, requests, countries);
        }
    }

    return Object.values(totals)
        .map(({ url, locale, requests, countries }) => ({ url, locale, requests, countries }))
        .sort((a, b) => b.requests - a.requests || a.url.localeCompare(b.url) || a.locale.localeCompare(b.locale))
        .slice(0, limit);
}

module.exports = {
    PAGE_RETENTION_HOURS,
    HOUR_MS,
    MAX_PAGES_PER_HOUR,
    MAX_COUNTRIES_PER_PAGE,
    MAX_PAGES_RETURNED,
    toEpochHour,
    readEntry,
    addPage,
    capPages,
    mergePages,
    prunePages,
    topPages,
};
