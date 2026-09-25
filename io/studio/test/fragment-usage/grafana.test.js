const { expect } = require('chai');
const sinon = require('sinon');

const { buildPagesQuery, fetchHourlyPages, CHUNK_SECONDS, MAX_EXECUTION_SECONDS } = require('../../src/fragment-usage/grafana');
const { MAX_PAGES_PER_HOUR, MAX_COUNTRIES_PER_PAGE } = require('../../src/fragment-usage/pages');

const HOUR_SECONDS = 3600;

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

        /** A window exactly one chunk wide, so a test issues a single query. */
        const oneChunk = (fromSec) => [fromSec * 1000, (fromSec + CHUNK_SECONDS) * 1000];

        it('reshapes column results into fragment -> hour -> page -> requests and countries', async () => {
            stubFetch(
                frame(
                    [1700000000, 1700000000],
                    ['frag-a', 'frag-a'],
                    ['https://a.com', 'https://b.com'],
                    [['US', 'CA'], ['JP']],
                    [[5, 2], [3]],
                ),
            );

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(result).to.deep.equal({
                'frag-a': {
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
            stubFetch(frame([1700000000], ['frag-a'], ['https://a.com'], [['US', 'GB', 'DE']], [[10, 4, 1]], [''], [20]));

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(result['frag-a'][472222]['https://a.com'].requests).to.equal(20);
        });

        it('splits the window into chunks rather than asking for it all at once', async () => {
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages(1700000000000, 1700000000000 + HOUR_SECONDS * 1000, { token: 't' });

            expect(fetchStub.callCount).to.equal(HOUR_SECONDS / CHUNK_SECONDS);
        });

        it('sums a page across the chunks of one hour instead of keeping only the last', async () => {
            stubFetch(frame([1700000000], ['frag-a'], ['https://a.com'], [['US']], [[2]]));

            const result = await fetchHourlyPages(1700000000000, 1700000000000 + HOUR_SECONDS * 1000, { token: 't' });

            const page = result['frag-a'][472222]['https://a.com'];
            expect(page.requests).to.equal(2 * (HOUR_SECONDS / CHUNK_SECONDS));
            expect(page.countries).to.deep.equal({ US: 2 * (HOUR_SECONDS / CHUNK_SECONDS) });
        });

        it('caps an hour after its chunks are summed, not within each chunk', async () => {
            // A page ranked below the cap in every individual chunk can still be among the busiest
            // once the chunks are added up, so capping per chunk would drop it.
            const pageCount = MAX_PAGES_PER_HOUR + 5;
            const buckets = Array(pageCount).fill(1700000000);
            const fragmentIds = Array(pageCount).fill('frag-a');
            const pages = Array.from({ length: pageCount }, (unused, index) => `https://example.com/${index}`);
            const countries = Array.from({ length: pageCount }, () => ['US']);
            const counts = Array.from({ length: pageCount }, (unused, index) => [pageCount - index]);
            stubFetch(frame(buckets, fragmentIds, pages, countries, counts));

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(Object.keys(result['frag-a'][472222])).to.have.lengthOf(MAX_PAGES_PER_HOUR);
            expect(result['frag-a'][472222]).to.have.property('https://example.com/0');
        });

        it('keeps one url as separate rows when it served several locales', async () => {
            stubFetch(
                frame(
                    [1700000000, 1700000000],
                    ['frag-a', 'frag-a'],
                    ['https://a.com', 'https://a.com'],
                    [['US'], ['GB']],
                    [[5], [2]],
                    ['en_US', 'en_GB'],
                ),
            );

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(result['frag-a'][472222]).to.deep.equal({
                'https://a.com#en_US': { url: 'https://a.com', locale: 'en_US', requests: 5, countries: { US: 5 } },
                'https://a.com#en_GB': { url: 'https://a.com', locale: 'en_GB', requests: 2, countries: { GB: 2 } },
            });
        });

        it('skips rows with no page', async () => {
            stubFetch(frame([1700000000], ['frag-a'], [null], [['US']], [[7]]));

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('skips rows with no fragment id', async () => {
            stubFetch(frame([1700000000], [null], ['https://a.com'], [['US']], [[7]]));

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('returns nothing when the window had no traffic', async () => {
            stubFetch({ results: { A: { frames: [] } } });

            const result = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(result).to.deep.equal({});
        });

        it('sends the token as a bearer header and never in the body', async () => {
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages(...oneChunk(1700000000), { token: 'glsa_secret' });

            const [, options] = fetchStub.firstCall.args;
            expect(options.headers.Authorization).to.equal('Bearer glsa_secret');
            expect(options.body).to.not.contain('glsa_secret');
        });

        it('targets the org the MAS service account belongs to', async () => {
            stubFetch(frame([], [], [], [], []));

            await fetchHourlyPages(...oneChunk(1700000000), { token: 't' });

            expect(fetchStub.firstCall.args[1].headers['X-Grafana-Org-Id']).to.equal('2');
        });

        it('throws on a non-ok response', async () => {
            stubFetch({}, false, 502);

            const error = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' }).then(
                () => null,
                (thrown) => thrown,
            );

            expect(error).to.be.an('error');
            expect(error.message).to.contain('502');
        });

        it('throws when Grafana reports a query error', async () => {
            stubFetch({ results: { A: { error: 'Syntax error' } } });

            const error = await fetchHourlyPages(...oneChunk(1700000000), { token: 't' }).then(
                () => null,
                (thrown) => thrown,
            );

            expect(error).to.be.an('error');
            expect(error.message).to.contain('Syntax error');
        });
    });
});
