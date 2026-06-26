const { expect } = require('chai');
const proxyquire = require('proxyquire');

function load(overrides = {}) {
    const patches = [];
    const reports = [];
    const exports = [];
    const job =
        overrides.job === undefined
            ? {
                  params: { find: 'school', replace: 'academy', surface: 'sandbox', searchIn: '*', matchCase: false },
                  authToken: 't',
                  status: 'RUNNING',
              }
            : overrides.job;
    const stubs = {
        './search.js': {
            buildSearchQuery: ({ path }) => ({ sort: [], filter: { path } }),
            buildSearchPaths: overrides.buildSearchPaths || (() => ['/content/dam/mas/sandbox']),
            extractLocale: overrides.extractLocale || (() => 'en_US'),
            findMatches: (fragment) => (fragment.hit ? [{ field: 'subtitle', value: fragment.hit }] : []),
            async *searchPages({ query }) {
                if (overrides.error) throw new Error('AEM boom');
                const pages = overrides.pagesByPath?.[query.filter.path] ?? overrides.pages ?? [];
                for (const page of pages) yield page;
            },
            '@noCallThru': true,
        },
        './state.js': {
            readJob: overrides.readJob || (async () => job),
            patchJob: async (jobId, patch) => {
                patches.push(patch);
            },
            writeJob: async () => {},
            writeReport: async (jobId, report) => {
                reports.push(report);
            },
            readUserCsv: async () => overrides.userCsv || null,
            writeResults: async (jobId, items) => {
                exports.push({ jobId, stateResults: items });
            },
            JOB_CACHE_TTL: 604800,
            JOB_RUNNING_TTL: 1800,
            '@noCallThru': true,
        },
        './bulk-edit.js': {
            writeJobExports: async (jobId, payload) => {
                exports.push({ jobId, payload });
                return { exportedAt: '2026-01-01T00:00:00.000Z' };
            },
            writeFindFullExport: async (jobId, items) => {
                exports.push({ jobId, fullItems: items });
            },
            buildFindReport: (results) => {
                const byLocale = {};
                for (const result of results) {
                    const locale = result.locale || 'unknown';
                    byLocale[locale] = (byLocale[locale] || 0) + 1;
                }
                return { total: results.length, byLocale };
            },
            '@noCallThru': true,
        },
        '../common.js': { fetchOdin: async () => ({}), '@noCallThru': true },
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
    };
    return { mod: proxyquire('../../src/bulk-edit/find-worker.js', stubs), patches, reports, exports };
}

describe('bulk-edit/find-worker: runFindWorker', () => {
    it('accumulates matches across pages and finishes DONE', async () => {
        const { mod, patches, exports } = load({
            pages: [
                [{ id: 'a', path: '/p/a', hit: 'A' }],
                [
                    { id: 'b', path: '/p/b', hit: 'B' },
                    { id: 'c', path: '/p/c' },
                ],
            ],
        });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const done = patches[patches.length - 1];
        expect(done.status).to.equal('DONE');
        expect(done.total).to.equal(2);
        expect(done.exportReady).to.equal(true);
        expect(done.results).to.deep.equal([]);
        const exportPayload = exports.find((entry) => entry.payload)?.payload;
        expect(exportPayload.items.map((r) => r.id)).to.deep.equal(['a', 'b']);
        const stateWrite = exports.find((entry) => entry.stateResults);
        expect(stateWrite.stateResults.map((r) => r.id)).to.deep.equal(['a', 'b']);
    });
    it('returns the full Odin fragment with matches and locale', async () => {
        const cardModelId = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';
        const fragment = {
            id: 'a',
            path: '/content/dam/mas/sandbox/en_US/cards/foo',
            hit: 'A',
            title: 'Card title',
            status: 'PUBLISHED',
            etag: 'etag-1',
            model: { id: cardModelId },
            fields: [{ name: 'subtitle', values: ['School discount'] }],
        };
        const { mod, exports } = load({ pages: [[fragment]] });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const result = exports.find((entry) => entry.stateResults)?.stateResults[0];
        expect(result.id).to.equal(fragment.id);
        expect(result.path).to.equal(fragment.path);
        expect(result.title).to.equal(fragment.title);
        expect(result.status).to.equal(fragment.status);
        expect(result.etag).to.equal(fragment.etag);
        expect(result.model).to.deep.equal(fragment.model);
        expect(result.fields).to.deep.equal(fragment.fields);
        expect(result.locale).to.equal('en_US');
        expect(result.matches).to.deep.equal([{ field: 'subtitle', value: fragment.hit }]);
    });
    it('searches each locale path and merges results', async () => {
        const { mod, patches, exports } = load({
            buildSearchPaths: () => ['/content/dam/mas/sandbox/en_US', '/content/dam/mas/sandbox/fr_FR'],
            pagesByPath: {
                '/content/dam/mas/sandbox/en_US': [[{ id: 'en', path: '/p/en', hit: 'A' }]],
                '/content/dam/mas/sandbox/fr_FR': [[{ id: 'fr', path: '/p/fr', hit: 'B' }]],
            },
            job: {
                params: { find: 'school', surface: 'sandbox', locale: ['en_US', 'fr_FR'], searchIn: '*', matchCase: false },
                authToken: 't',
                status: 'RUNNING',
            },
        });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const done = patches[patches.length - 1];
        expect(done.status).to.equal('DONE');
        const exportPayload = exports.find((entry) => entry.payload)?.payload;
        expect(exportPayload.items.map((r) => r.id)).to.deep.equal(['en', 'fr']);
    });
    it('writes an incremental per-locale report as results accumulate', async () => {
        const { mod, reports } = load({
            buildSearchPaths: () => ['/content/dam/mas/sandbox/en_US', '/content/dam/mas/sandbox/fr_FR'],
            pagesByPath: {
                '/content/dam/mas/sandbox/en_US': [
                    [
                        { id: 'en1', path: '/content/dam/mas/sandbox/en_US/a', hit: 'A' },
                        { id: 'en2', path: '/content/dam/mas/sandbox/en_US/b', hit: 'B' },
                    ],
                ],
                '/content/dam/mas/sandbox/fr_FR': [[{ id: 'fr1', path: '/content/dam/mas/sandbox/fr_FR/c', hit: 'C' }]],
            },
            extractLocale: (path) => path.match(/\/mas\/sandbox\/([^/]+)\//)?.[1] ?? null,
            job: {
                params: { find: 'school', surface: 'sandbox', locale: ['en_US', 'fr_FR'], searchIn: '*', matchCase: false },
                status: 'RUNNING',
            },
        });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const final = reports[reports.length - 1];
        expect(final.total).to.equal(3);
        expect(final.byLocale).to.deep.equal({ en_US: 2, fr_FR: 1 });
    });
    it('persists progress after each page', async () => {
        const { mod, patches } = load({
            pages: [[{ id: 'a', path: '/p/a', hit: 'A' }], [{ id: 'b', path: '/p/b', hit: 'B' }]],
        });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const progressTotals = patches.filter((p) => !p.status).map((p) => p.total);
        expect(progressTotals).to.deep.equal([1, 2]);
    });
    it('collects all matches without a result cap', async () => {
        const big = Array.from({ length: 1001 }, (_, i) => ({ id: String(i), path: `/p/${i}`, hit: 'x' }));
        const { mod, patches } = load({ pages: [big] });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const done = patches[patches.length - 1];
        expect(done.status).to.equal('DONE');
        expect(done.total).to.equal(1001);
    });
    it('marks FAILED and rethrows on AEM error', async () => {
        const { mod, patches } = load({ error: true });
        let threw = false;
        try {
            await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        } catch {
            threw = true;
        }
        expect(threw).to.equal(true);
        expect(patches[patches.length - 1]).to.include({ status: 'FAILED' });
    });
    it('throws when odinEndpoint is missing', async () => {
        const { mod } = load({ pages: [[{ id: 'a', path: '/p/a', hit: 'A' }]] });
        let threw = false;
        try {
            await mod.runFindWorker('job1', { odinEndpoint: undefined });
        } catch (error) {
            threw = true;
            expect(error.message).to.include('odinEndpoint');
        }
        expect(threw).to.equal(true);
    });
    it('throws when the job record is missing', async () => {
        const { mod } = load({ job: null });
        let threw = false;
        try {
            await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        } catch {
            threw = true;
        }
        expect(threw).to.equal(true);
    });
    it('stops with SUPERSEDED and writes no terminal status when the runId no longer matches', async () => {
        const { mod, patches } = load({
            pages: [[{ id: 'a', path: '/p/a', hit: 'A' }], [{ id: 'b', path: '/p/b', hit: 'B' }]],
            job: {
                params: { find: 'school', replace: 'academy', surface: 'sandbox', searchIn: '*', matchCase: false },
                status: 'RUNNING',
                runId: 'new-run',
            },
        });
        const result = await mod.runFindWorker('job1', { odinEndpoint: 'https://odin', runId: 'old-run' });
        expect(result.status).to.equal('SUPERSEDED');
        expect(patches.some((p) => p.status === 'DONE')).to.equal(false);
        expect(patches.length).to.equal(0);
    });
    it('stops with CANCELLED when the job is flagged mid-pagination', async () => {
        let reads = 0;
        const { mod, patches } = load({
            pages: [[{ id: 'a', path: '/p/a', hit: 'A' }], [{ id: 'b', path: '/p/b', hit: 'B' }]],
            readJob: async () => {
                reads += 1;
                return {
                    params: { find: 'school', replace: 'academy', surface: 'sandbox', searchIn: '*', matchCase: false },
                    authToken: 't',
                    status: 'RUNNING',
                    cancelled: reads > 1,
                };
            },
        });
        const result = await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        expect(result.status).to.equal('CANCELLED');
        expect(patches[patches.length - 1].status).to.equal('CANCELLED');
        expect(patches[patches.length - 1].exportReady).to.equal(true);
    });
});

describe('bulk-edit/find-worker: main', () => {
    it('returns 200 with DONE on success', async () => {
        const { mod } = load({ pages: [[{ id: 'a', path: '/p/a', hit: 'A' }]] });
        const res = await mod.main({ jobId: 'job1', odinEndpoint: 'https://odin' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.status).to.equal('DONE');
    });
    it('returns 500 when the worker throws', async () => {
        const { mod } = load({ error: true });
        const res = await mod.main({ jobId: 'job1', odinEndpoint: 'https://odin' });
        expect(res.statusCode).to.equal(500);
    });
});
