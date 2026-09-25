const { expect } = require('chai');

const {
    PAGE_RETENTION_HOURS,
    MAX_PAGES_PER_HOUR,
    MAX_PAGES_RETURNED,
    readEntry,
    addPage,
    capPages,
    mergePages,
    prunePages,
    topPages,
    toEpochHour,
    HOUR_MS,
} = require('../../src/fragment-usage/pages');

const NOW_HOUR = 500000;

/** Builds a stored page entry in the shape the rollup writes. */
const entry = (requests, countries = {}, url = '', locale = '') => ({ url, locale, requests, countries });

describe('fragment-usage pages', () => {
    describe('readEntry', () => {
        it('reads a record written before countries were collected', () => {
            // Such records are still inside the retention window during a rollout. Showing a page
            // with no countries beats throwing on it.
            expect(readEntry(5, 'https://a.com')).to.deep.equal({
                url: 'https://a.com',
                locale: '',
                requests: 5,
                countries: {},
            });
        });

        it('reads a current record unchanged', () => {
            expect(readEntry(entry(5, { US: 5 }, 'https://a.com', 'en_US'))).to.deep.equal({
                url: 'https://a.com',
                locale: 'en_US',
                requests: 5,
                countries: { US: 5 },
            });
        });

        it('recovers the url from the key when the record predates storing it', () => {
            expect(readEntry({ requests: 5 }, 'https://a.com').url).to.equal('https://a.com');
        });

        it('treats a missing entry as no traffic rather than throwing', () => {
            expect(readEntry(undefined)).to.deep.equal({ url: '', locale: '', requests: 0, countries: {} });
        });
    });

    describe('addPage', () => {
        it('sums both the total and each country', () => {
            const byPage = {};
            addPage(byPage, 'https://a.com', 'en_US', 3, { US: 2, CA: 1 });
            addPage(byPage, 'https://a.com', 'en_US', 4, { US: 3, JP: 1 });
            expect(byPage['https://a.com#en_US']).to.deep.equal({
                url: 'https://a.com',
                locale: 'en_US',
                requests: 7,
                countries: { US: 5, CA: 1, JP: 1 },
            });
        });

        it('records a page that has no country breakdown', () => {
            const byPage = {};
            addPage(byPage, 'https://a.com', '', 3);
            expect(byPage['https://a.com']).to.deep.equal({
                url: 'https://a.com',
                locale: '',
                requests: 3,
                countries: {},
            });
        });

        it('keeps one url as separate entries per locale', () => {
            const byPage = {};
            addPage(byPage, 'https://a.com', 'en_US', 3, { US: 3 });
            addPage(byPage, 'https://a.com', 'en_GB', 2, { GB: 2 });
            expect(Object.keys(byPage)).to.deep.equal(['https://a.com#en_US', 'https://a.com#en_GB']);
        });

        it('keys a page with no locale on its url alone, matching legacy records', () => {
            const byPage = {};
            addPage(byPage, 'https://a.com', '', 3);
            expect(Object.keys(byPage)).to.deep.equal(['https://a.com']);
        });
    });

    describe('capPages', () => {
        it('keeps the busiest pages', () => {
            const byPage = {};
            for (let index = 0; index < MAX_PAGES_PER_HOUR + 5; index += 1) {
                byPage[`https://example.com/${index}`] = entry(index);
            }
            const capped = capPages(byPage);
            expect(Object.keys(capped)).to.have.lengthOf(MAX_PAGES_PER_HOUR);
            expect(capped).to.have.property(`https://example.com/${MAX_PAGES_PER_HOUR + 4}`);
        });

        it('leaves an hour that is already within the cap untouched', () => {
            const byPage = { 'https://a.com': entry(1) };
            expect(capPages(byPage)).to.equal(byPage);
        });

        it('breaks ties on url so the kept set is stable between runs', () => {
            const byPage = { 'https://b.com': entry(1), 'https://a.com': entry(1) };
            expect(Object.keys(capPages(byPage, 1))).to.deep.equal(['https://a.com']);
        });
    });

    describe('mergePages', () => {
        it('replaces an hour instead of accumulating it, so a retried run cannot double count', () => {
            const stored = { 10: { 'https://a.com': entry(5) } };
            const merged = mergePages(stored, { 10: { 'https://a.com': entry(5) } });
            expect(merged[10]['https://a.com']).to.deep.equal(entry(5));
        });

        it('keeps hours the incoming batch did not cover', () => {
            const merged = mergePages({ 10: { 'https://a.com': entry(1) } }, { 11: { 'https://b.com': entry(2) } });
            expect(Object.keys(merged)).to.have.members(['10', '11']);
        });

        it('does not mutate the stored map', () => {
            const stored = { 10: { 'https://a.com': entry(1) } };
            mergePages(stored, { 11: { 'https://b.com': entry(2) } });
            expect(Object.keys(stored)).to.deep.equal(['10']);
        });
    });

    describe('prunePages', () => {
        it('drops hours older than the retention window', () => {
            const pages = {
                [NOW_HOUR - PAGE_RETENTION_HOURS - 1]: { 'https://old.com': entry(1) },
                [NOW_HOUR - 1]: { 'https://new.com': entry(1) },
            };
            const pruned = prunePages(pages, NOW_HOUR);
            expect(Object.keys(pruned)).to.deep.equal([String(NOW_HOUR - 1)]);
        });

        it('keeps the oldest hour that is still inside the window', () => {
            const boundary = NOW_HOUR - PAGE_RETENTION_HOURS + 1;
            const pruned = prunePages({ [boundary]: { 'https://a.com': entry(1) } }, NOW_HOUR);
            expect(pruned).to.have.property(String(boundary));
        });
    });

    describe('topPages', () => {
        it('sums a page across hours rather than reporting only its busiest hour', () => {
            const pages = {
                10: { 'https://a.com': entry(3, { US: 3 }) },
                11: { 'https://a.com': entry(4, { US: 1, CA: 3 }) },
            };
            expect(topPages(pages)).to.deep.equal([
                { url: 'https://a.com', locale: '', requests: 7, countries: { US: 4, CA: 3 } },
            ]);
        });

        it('ranks steady traffic above a single spike', () => {
            const pages = {
                10: { 'https://steady.com': entry(5), 'https://spike.com': entry(9) },
                11: { 'https://steady.com': entry(5) },
            };
            expect(topPages(pages).map((page) => page.url)).to.deep.equal(['https://steady.com', 'https://spike.com']);
        });

        it('breaks ties on url so the order is stable between reads', () => {
            const pages = { 10: { 'https://b.com': entry(1), 'https://a.com': entry(1) } };
            expect(topPages(pages).map((page) => page.url)).to.deep.equal(['https://a.com', 'https://b.com']);
        });

        it('caps the number of rows returned', () => {
            const byPage = {};
            for (let index = 0; index < MAX_PAGES_RETURNED + 25; index += 1) {
                byPage[`https://example.com/${index}`] = entry(index);
            }
            expect(topPages({ 10: byPage })).to.have.lengthOf(MAX_PAGES_RETURNED);
        });

        it('honours an explicit limit', () => {
            const pages = { 10: { 'https://a.com': entry(3), 'https://b.com': entry(2), 'https://c.com': entry(1) } };
            expect(topPages(pages, 2)).to.have.lengthOf(2);
        });

        it('returns an empty list for a fragment with no recorded pages', () => {
            expect(topPages({})).to.deep.equal([]);
            expect(topPages(undefined)).to.deep.equal([]);
        });

        it('does not mutate the stored hours while summing them', () => {
            const stored = { 10: { 'https://a.com': entry(3, { US: 3 }) } };
            topPages(stored);
            topPages(stored);
            expect(stored[10]['https://a.com']).to.deep.equal(entry(3, { US: 3 }));
        });
    });

    describe('toEpochHour', () => {
        it('floors a timestamp to its hour', () => {
            expect(toEpochHour(HOUR_MS * 3 + 1)).to.equal(3);
        });
    });
});
