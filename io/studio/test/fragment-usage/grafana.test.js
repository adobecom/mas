const { expect } = require('chai');
const sinon = require('sinon');

const { buildPagesQuery, fetchHourlyPages, MAX_EXECUTION_SECONDS } = require('../../src/fragment-usage/grafana');
const { MAX_PAGES_PER_HOUR, MAX_COUNTRIES_PER_PAGE } = require('../../src/fragment-usage/pages');

const HOUR_SECONDS = 3600;
const FRAGMENT = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';

describe('fragment-usage grafana', () => {
    describe('buildPagesQuery', () => {
        const sql = buildPagesQuery(1700000000, 1700003600);

        it('emits fully literal SQL', () => {
            // /api/ds/query does not expand template variables or $__conditionalAll -- those are
            // resolved by the Grafana frontend. Anything left containing '$' fails with a syntax
            // error at runtime, so this is the guard against copying SQL out of a dashboard panel.
            expect(sql).to.not.contain('$');
        });

        it('interpolates explicit epoch bounds rather than relying on $__timeFilter', () => {
            expect(sql).to.contain('toDateTime(1700000000)');
            expect(sql).to.contain('toDateTime(1700003600)');
        });

        it('treats the window as half open so adjacent runs cannot overlap an hour', () => {
            expect(sql).to.contain('reqTimeSec >= toDateTime(1700000000)');
            expect(sql).to.contain('reqTimeSec < toDateTime(1700003600)');
        });

        it('scopes the query to the fragment endpoint', () => {
            expect(sql).to.contain("reqPath = '/mas/io/fragment'");
        });

        it('counts only successful responses so failed fragment requests cannot create usage records', () => {
            expect(sql).to.contain('AND ((statusCode >= 200 AND statusCode < 300) OR statusCode = 304) ');
        });

        it('keeps only adobe.com referers so a third-party page cannot take a page slot', () => {
            expect(sql).to.contain(
                "AND (lower(domain(ifNull(referer, ''))) = 'adobe.com' OR endsWith(lower(domain(ifNull(referer, ''))), '.adobe.com')) ",
            );
        });

        it('excludes rows with no referer rather than bucketing them as an unknown page', () => {
            expect(sql).to.contain('referer IS NOT NULL');
            expect(sql).to.contain("referer != ''");
        });

        it('collapses query-string permutations onto one canonical page', () => {
            expect(sql).to.contain("cutQueryStringAndFragment(ifNull(referer, ''))");
        });

        it('keeps the query parameters that change what a page renders', () => {
            // Dropping these would merge pages showing genuinely different content; keeping the
            // rest would let one page fill the list under dozens of campaign variants.
            expect(sql).to.contain("extractURLParameter(ifNull(referer, ''), 'plan')");
            expect(sql).to.contain("extractURLParameter(ifNull(referer, ''), 'tab')");
        });

        it('cuts a kept parameter to safe characters so referer text cannot reach a rendered link', () => {
            expect(sql).to.contain("extract(extractURLParameter(ifNull(referer, ''), 'plan'), '^[A-Za-z0-9_-]+')");
        });

        it('reads the referer through ifNull, which ClickHouse requires for a Nullable column', () => {
            expect(sql).to.not.contain('extractURLParameter(referer');
        });

        it('keys rows by page and locale, because one url serves several locales', () => {
            expect(sql).to.contain("extractURLParameter(concat('?', queryStr), 'locale') AS locale");
            expect(sql).to.contain(') GROUP BY bucket, fragmentId, page, locale');
        });

        it('caps pages per fragment per hour so a widely used fragment cannot flood the payload', () => {
            expect(sql).to.contain(`rn <= ${MAX_PAGES_PER_HOUR}`);
        });

        it('ranks pages by their total across countries, not by a single country', () => {
            // The cap is applied to pages. Ranking on anything narrower would let a page that is
            // busiest overall lose its slot to one that merely dominates a single country.
            expect(sql).to.contain('row_number() OVER (PARTITION BY bucket, fragmentId ORDER BY sum(hits) DESC)');
        });

        it('aggregates countries after grouping by page so the cap still counts pages', () => {
            // Adding country to the page GROUP BY would make the row_number cap rank
            // page-and-country pairs, so a page serving several countries would consume several
            // slots and the list would show fewer pages than before.
            expect(sql).to.contain('GROUP BY bucket, fragmentId, page, locale, country');
            expect(sql).to.contain(') GROUP BY bucket, fragmentId, page, locale');
        });

        it('returns each page total across every country, not only the kept ones', () => {
            // The country arrays are sliced, so a total derived from them would undercount any page
            // served in more countries than are kept.
            expect(sql).to.contain('sum(hits) AS requests');
            expect(sql).to.match(/^SELECT bucket, fragmentId, page, locale, countries, counts, requests FROM/);
        });

        it('keeps the busiest countries rather than an arbitrary slice of them', () => {
            // groupArray does not promise an order, so the arrays are sorted by request count
            // before they are sliced.
            expect(sql).to.contain('arraySort((country, hits) -> -hits, groupArray(country), groupArray(hits))');
            expect(sql).to.contain(`, 1, ${MAX_COUNTRIES_PER_PAGE})`);
        });

        it('caps execution time so a slow scan cannot hang the action', () => {
            expect(sql).to.contain(`hdx_query_max_execution_time=${MAX_EXECUTION_SECONDS}`);
        });

        it('tags the query so it is attributable in TrafficPeak', () => {
            expect(sql).to.contain('mas-studio-fragment-pages-rollup');
        });
    });

    describe('fetchHourlyPages', () => {
        let fetchStub;
        let realFetch;

        // `locales` and `requests` are appended rather than placed next to `pages` so a test that
        // does not care about them stays readable; an empty locale keys the row on the url alone,
        // and the default total is what the kept countries add up to.
        const frame = (
            buckets,
            fragmentIds,
            pages,
            countries,
            counts,
            locales = pages.map(() => ''),
            requests = counts.map((row) => row.reduce((sum, count) => sum + count, 0)),
        ) => ({
            results: {
                A: { frames: [{ data: { values: [buckets, fragmentIds, pages, locales, countries, counts, requests] } }] },
            },
        });

        afterEach(() => {
            if (fetchStub) global.fetch = realFetch;
            fetchStub = undefined;
        });

        // Assigned rather than sinon.stub(global, 'fetch'): sibling suites in this repo replace
        // global.fetch by assignment and never put it back, so wrapping would throw "already
        // wrapped" depending on file order. Capturing and restoring keeps this file order
        // independent without leaking a stub into whatever runs next.
        function stubFetch(payload, ok = true, status = 200) {
            realFetch = global.fetch;
            fetchStub = sinon.stub().resolves({ ok, status, json: async () => payload });
            global.fetch = fetchStub;
        }

        /** The clock hour holding 1700000000, so a test issues a single query. */
        const HOUR_START = 472222 * HOUR_SECONDS;
        const oneHour = [HOUR_START * 1000, (HOUR_START + HOUR_SECONDS) * 1000];

        /** The exclusive end bound of every query sent, in epoch seconds. */
        const queryEnds = () =>
            fetchStub.getCalls().map((call) => {
                const { rawSql } = JSON.parse(call.args[1].body).queries[0];
                return Number(rawSql.match(/reqTimeSec < toDateTime\((\d+)\)/)[1]);
            });

        it('reshapes column results into fragment -> hour -> page -> requests and countries', async () => {
            stubFetch(
                frame(
                    [1700000000, 1700000000],
                    [FRAGMENT, FRAGMENT],
                    ['https://a.com', 'https://b.com'],
                    [['US', 'CA'], ['JP']],
                    [[5, 2], [3]],
                ),
            );

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result).to.deep.equal({
                [FRAGMENT]: {
                    472222: {
                        'https://a.com': { url: 'https://a.com', locale: '', requests: 7, countries: { US: 5, CA: 2 } },
                        'https://b.com': { url: 'https://b.com', locale: '', requests: 3, countries: { JP: 3 } },
                    },
                },
            });
        });

        it('takes a page total from the query rather than from its kept countries', async () => {
            // The query keeps only the busiest countries, so their counts can add up to less than
            // the page actually served.
            stubFetch(frame([1700000000], [FRAGMENT], ['https://a.com'], [['US', 'GB', 'DE']], [[10, 4, 1]], [''], [20]));

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result[FRAGMENT][472222]['https://a.com'].requests).to.equal(20);
        });

        it('queries one hour at a time so the query ranks pages over whole hours', async () => {
            // The query keeps the busiest pages per hour. Splitting an hour across queries would
            // rank each part on its own, and a page just below the cut in every part would be
            // dropped before the parts were added up.
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages(HOUR_START * 1000, (HOUR_START + 3 * HOUR_SECONDS) * 1000, { token: 't' });

            expect(queryEnds()).to.deep.equal([
                HOUR_START + HOUR_SECONDS,
                HOUR_START + 2 * HOUR_SECONDS,
                HOUR_START + 3 * HOUR_SECONDS,
            ]);
        });

        it('ends the first query on the hour when the window starts mid-hour', async () => {
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages((HOUR_START + 1800) * 1000, (HOUR_START + 2 * HOUR_SECONDS) * 1000, { token: 't' });

            expect(queryEnds()).to.deep.equal([HOUR_START + HOUR_SECONDS, HOUR_START + 2 * HOUR_SECONDS]);
        });

        it('keeps one url as separate rows when it served several locales', async () => {
            stubFetch(
                frame(
                    [1700000000, 1700000000],
                    [FRAGMENT, FRAGMENT],
                    ['https://a.com', 'https://a.com'],
                    [['US'], ['GB']],
                    [[5], [2]],
                    ['en_US', 'en_GB'],
                ),
            );

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result[FRAGMENT][472222]).to.deep.equal({
                'https://a.com#en_US': { url: 'https://a.com', locale: 'en_US', requests: 5, countries: { US: 5 } },
                'https://a.com#en_GB': { url: 'https://a.com', locale: 'en_GB', requests: 2, countries: { GB: 2 } },
            });
        });

        it('skips rows with no page', async () => {
            stubFetch(frame([1700000000], [FRAGMENT], [null], [['US']], [[7]]));

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('skips rows with no fragment id', async () => {
            stubFetch(frame([1700000000], [null], ['https://a.com'], [['US']], [[7]]));

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('skips fragment ids that are not uuids', async () => {
            // Live traffic carries ids like this one. Storing them would add a State key per typo.
            stubFetch(frame([1700000000], ['wrong-fragment-id'], ['https://a.com'], [['US']], [[7]]));

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('returns nothing when the window had no traffic', async () => {
            stubFetch({ results: { A: { frames: [] } } });

            const result = await fetchHourlyPages(...oneHour, { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('sends the token as a bearer header and never in the body', async () => {
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages(...oneHour, { token: 'glsa_secret' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers.Authorization).to.equal('Bearer glsa_secret');
            expect(options.body).to.not.contain('glsa_secret');
        });

        it('targets the org the MAS service account belongs to', async () => {
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages(...oneHour, { token: 't' });

            expect(fetchStub.firstCall.args[1].headers['X-Grafana-Org-Id']).to.equal('2');
        });

        it('throws on a non-ok response', async () => {
            stubFetch({}, false, 502);

            const error = await fetchHourlyPages(...oneHour, { token: 't' }).then(
                () => null,
                (thrown) => thrown,
            );

            expect(error).to.be.an('error');
            expect(error.message).to.contain('502');
        });

        it('throws when Grafana reports a query error', async () => {
            stubFetch({ results: { A: { error: 'Syntax error' } } });

            const error = await fetchHourlyPages(...oneHour, { token: 't' }).then(
                () => null,
                (thrown) => thrown,
            );

            expect(error).to.be.an('error');
            expect(error.message).to.contain('Syntax error');
        });
    });
});
