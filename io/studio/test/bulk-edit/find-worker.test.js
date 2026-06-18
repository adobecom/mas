const { expect } = require('chai');
const proxyquire = require('proxyquire');

function load(overrides = {}) {
    const patches = [];
    const job =
        overrides.job === undefined
            ? {
                  params: { find: 'school', surface: 'acom', searchIn: 'everywhere', matchCase: false },
                  authToken: 't',
                  status: 'RUNNING',
              }
            : overrides.job;
    const stubs = {
        './search.js': {
            buildSearchQuery: () => ({ sort: [], filter: {} }),
            extractLocale: () => 'en_US',
            findMatches: (fragment) => (fragment.hit ? [{ field: 'subtitle', value: fragment.hit }] : []),
            async *searchPages() {
                if (overrides.error) throw new Error('AEM boom');
                for (const page of overrides.pages || []) yield page;
            },
            '@noCallThru': true,
        },
        './state.js': {
            readJob: async () => job,
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
