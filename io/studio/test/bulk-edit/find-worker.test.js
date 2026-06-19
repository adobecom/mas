const { expect } = require('chai');
const proxyquire = require('proxyquire');

function load(overrides = {}) {
    const patches = [];
    const job =
        overrides.job === undefined
            ? {
                  params: { find: 'school', surface: 'acom', searchIn: '*', matchCase: false },
                  authToken: 't',
                  status: 'RUNNING',
              }
            : overrides.job;
    const stubs = {
        './search.js': {
            buildSearchQuery: ({ path }) => ({ sort: [], filter: { path } }),
            buildSearchPaths: overrides.buildSearchPaths || (() => ['/content/dam/mas/acom']),
            extractLocale: () => 'en_US',
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
            '@noCallThru': true,
        },
        '../common.js': { fetchOdin: async () => ({}), '@noCallThru': true },
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
    };
    return { mod: proxyquire('../../src/bulk-edit/find-worker.js', stubs), patches };
}

describe('bulk-edit/find-worker: runFindWorker', () => {
    it('accumulates matches across pages and finishes DONE', async () => {
        const { mod, patches } = load({
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
        expect(done.results.map((r) => r.id)).to.deep.equal(['a', 'b']);
        expect(done.truncated).to.equal(false);
    });
    it('returns the full Odin fragment with matches and locale', async () => {
        const cardModelId = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';
        const fragment = {
            id: 'a',
            path: '/content/dam/mas/acom/en_US/cards/foo',
            hit: 'A',
            title: 'Card title',
            status: 'PUBLISHED',
            etag: 'etag-1',
            model: { id: cardModelId },
            fields: [{ name: 'subtitle', values: ['School discount'] }],
        };
        const { mod, patches } = load({ pages: [[fragment]] });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const result = patches[patches.length - 1].results[0];
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
        const { mod, patches } = load({
            buildSearchPaths: () => ['/content/dam/mas/acom/en_US', '/content/dam/mas/acom/fr_FR'],
            pagesByPath: {
                '/content/dam/mas/acom/en_US': [[{ id: 'en', path: '/p/en', hit: 'A' }]],
                '/content/dam/mas/acom/fr_FR': [[{ id: 'fr', path: '/p/fr', hit: 'B' }]],
            },
            job: {
                params: { find: 'school', surface: 'acom', locale: ['en_US', 'fr_FR'], searchIn: '*', matchCase: false },
                authToken: 't',
                status: 'RUNNING',
            },
        });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const done = patches[patches.length - 1];
        expect(done.status).to.equal('DONE');
        expect(done.results.map((r) => r.id)).to.deep.equal(['en', 'fr']);
    });
    it('persists progress after each page', async () => {
        const { mod, patches } = load({
            pages: [[{ id: 'a', path: '/p/a', hit: 'A' }], [{ id: 'b', path: '/p/b', hit: 'B' }]],
        });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const progressTotals = patches.filter((p) => !p.status).map((p) => p.total);
        expect(progressTotals).to.deep.equal([1, 2]);
    });
    it('marks truncated when the result cap is exceeded', async () => {
        const big = Array.from({ length: 1001 }, (_, i) => ({ id: String(i), path: `/p/${i}`, hit: 'x' }));
        const { mod, patches } = load({ pages: [big] });
        await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        const done = patches[patches.length - 1];
        expect(done.status).to.equal('DONE');
        expect(done.total).to.equal(1000);
        expect(done.truncated).to.equal(true);
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
    it('stops with CANCELLED when the job is flagged mid-pagination', async () => {
        let reads = 0;
        const { mod, patches } = load({
            pages: [[{ id: 'a', path: '/p/a', hit: 'A' }], [{ id: 'b', path: '/p/b', hit: 'B' }]],
            readJob: async () => {
                reads += 1;
                return {
                    params: { find: 'school', surface: 'acom', searchIn: '*', matchCase: false },
                    authToken: 't',
                    status: 'RUNNING',
                    cancelled: reads > 1,
                };
            },
        });
        const result = await mod.runFindWorker('job1', { odinEndpoint: 'https://odin' });
        expect(result.status).to.equal('CANCELLED');
        expect(patches[patches.length - 1].status).to.equal('CANCELLED');
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
