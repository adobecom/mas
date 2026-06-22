const { expect } = require('chai');
const proxyquire = require('proxyquire');

function frag(id, value = 'School offer') {
    return { id, title: 'T', description: 'D', fields: [{ name: 'subtitle', values: [value] }] };
}

function load(overrides = {}) {
    const calls = { put: [], get: [], dryRun: [], reports: [], invokes: [] };
    const patches = [];
    const job = {
        type: 'replace',
        findJobId: 'find1',
        replace: overrides.replace ?? 'Campus',
        dryRun: overrides.dryRun || false,
        matchCase: false,
        runId: 'run1',
        status: 'RUNNING',
        results: overrides.results || [],
        cursor: overrides.cursor || 0,
        ...overrides.job,
    };
    const rows = overrides.rows || [
        { fragment_id: 'a', path: '/p/a', locale: 'en_US', field: 'subtitle', find: 'School', replace: '' },
        { fragment_id: 'b', path: '/p/b', locale: 'en_US', field: 'subtitle', find: 'School', replace: '' },
    ];
    const stubs = {
        '../common.js': {
            getFragmentWithEtag: async (endpoint, id) => {
                calls.get.push(id);
                if (overrides.getThrows?.[id]) throw new Error(overrides.getThrows[id]);
                return { fragment: frag(id), etag: `etag-${id}-${calls.get.length}` };
            },
            putToOdin: async (endpoint, id) => {
                calls.put.push(id);
                if (overrides.putThrows) throw new Error(overrides.putThrows);
                return { success: true };
            },
            invokeAsyncAction: async (action, p) => {
                calls.invokes.push({ action, p });
            },
            buildSiblingActionName: () => 'pkg/bulk-edit-replace-worker',
            '@noCallThru': true,
        },
        './replace.js': require('../../src/bulk-edit/replace.js'),
        './state.js': {
            readJob:
                overrides.readJob ||
                (async (id) => {
                    if (id === 'find1') return { params: { find: 'School' }, status: 'DONE' };
                    return job;
                }),
            patchJob: async (jobId, patch) => {
                patches.push(patch);
            },
            readUserCsv: async () => ({ rows }),
            writeDryRun: async (jobId, list) => {
                calls.dryRun.push(list);
            },
            writeReport: async (jobId, report) => {
                calls.reports.push(report);
            },
            writeResults: async (jobId, items) => {
                calls.results = items;
            },
            JOB_CACHE_TTL: 604800,
            JOB_RUNNING_TTL: 1800,
            '@noCallThru': true,
        },
        './export.js': {
            writeJobExports: async () => ({ exportedAt: '2026-01-01T00:00:00.000Z' }),
            writeFullExport: async () => {},
            '@noCallThru': true,
        },
        './find-results.js': {
            resolveFindSourceItems: async () => [],
            '@noCallThru': true,
        },
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
    };
    return { mod: proxyquire('../../src/bulk-edit/replace-worker.js', stubs), calls, patches, job };
}

describe('bulk-edit/replace-worker: buildWorkPlan', () => {
    it('groups rows by fragment, drops no-op rows, and sorts by id', () => {
        const { mod } = load();
        const plan = mod.buildWorkPlan(
            [
                { fragment_id: 'b', field: 'subtitle', find: 'x' },
                { fragment_id: 'a', field: 'subtitle', find: 'x' },
                { fragment_id: 'a', field: 'title', find: 'z' },
                { fragment_id: 'a', field: 'callout', find: 'q' },
            ],
            'y',
            'x',
        );
        expect(plan.map((i) => i.id)).to.deep.equal(['a', 'b']);
        expect(plan[0].rows).to.have.length(3);
        expect(plan[1].rows).to.have.length(1);
    });
});

describe('bulk-edit/replace-worker: buildDryRunResult', () => {
    it('returns the modified fragment payload without persisting to Odin', () => {
        const { mod } = load();
        const item = { id: 'a', path: '/p/a', locale: 'en_US', rows: [{ field: 'subtitle', find: 'School' }] };
        const fragment = {
            id: 'a',
            etag: 'e1',
            title: 'T',
            description: 'D',
            fields: [{ name: 'subtitle', values: ['School offer'] }],
        };
        const applied = {
            title: 'T',
            description: 'D',
            fields: [{ name: 'subtitle', values: ['Campus offer'] }],
            changed: true,
            rowStatuses: [],
        };
        expect(mod.buildDryRunResult(item, fragment, applied)).to.deep.equal({
            id: 'a',
            path: '/p/a',
            locale: 'en_US',
            etag: 'e1',
            status: 'WOULD_REPLACE',
            title: 'T',
            description: 'D',
            fields: [{ name: 'subtitle', values: ['Campus offer'] }],
            matches: [{ field: 'subtitle', value: 'School' }],
        });
    });
});

describe('bulk-edit/replace-worker: runReplaceWorker', () => {
    it('replaces each fragment and finishes DONE', async () => {
        const { mod, calls, patches } = load();
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(result.succeeded).to.equal(2);
        expect(calls.put).to.deep.equal(['a', 'b']);
        expect(patches[patches.length - 1].status).to.equal('DONE');
        expect(patches[patches.length - 1].exportReady).to.equal(true);
        expect(patches[patches.length - 1].results).to.deep.equal([]);
    });

    it('dry-run applies replacements in memory, makes no PUT, and exports modified fragments', async () => {
        const { mod, calls } = load({ dryRun: true });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(calls.put).to.deep.equal([]);
        expect(calls.dryRun.length).to.be.greaterThan(0);
        const list = calls.dryRun[calls.dryRun.length - 1];
        expect(list.every((r) => r.status === 'WOULD_REPLACE')).to.equal(true);
        expect(list[0].fields[0].values[0]).to.equal('Campus offer');
        expect(list[0].title).to.equal('T');
        expect(calls.reports[0].dryRun).to.equal(true);
        expect(calls.reports[0].totalFragments).to.equal(2);
        expect(calls.results).to.have.lengthOf(2);
    });

    it('retries once on 412 then records CONFLICT', async () => {
        const { mod, calls } = load({ putThrows: 'PUT /x failed with status 412: Precondition Failed' });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(result.conflicts).to.equal(2);
        expect(calls.put).to.have.length(4);
    });

    it('isolates a single fragment failure and keeps going', async () => {
        const { mod, patches } = load({ getThrows: { a: 'boom' } });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(result.failed).to.equal(1);
        expect(result.succeeded).to.equal(1);
        const done = patches[patches.length - 1];
        expect(done.status).to.equal('DONE');
    });

    it('resumes from the stored cursor, skipping processed fragments', async () => {
        const prior = { id: 'a', path: '/p/a', locale: 'en_US', status: 'REPLACED', matches: [] };
        const { mod, calls } = load({ cursor: 1, results: [prior] });
        await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(calls.get).to.deep.equal(['b']);
        expect(calls.put).to.deep.equal(['b']);
    });

    it('self-continues when the soft time budget is exceeded', async () => {
        const { mod, calls } = load();
        const result = await mod.runReplaceWorker('job1', {
            odinEndpoint: 'https://odin',
            runId: 'run1',
            params: { batchSize: '1', softBudgetMs: '0' },
        });
        expect(result.continued).to.equal(true);
        expect(calls.invokes).to.have.length(1);
        expect(calls.invokes[0].p).to.deep.include({ jobId: 'job1', runId: 'run1' });
    });

    it('stops as SUPERSEDED without writing terminal status when runId changes', async () => {
        const { mod, patches } = load({
            readJob: async (id) => {
                if (id === 'find1') return { params: { find: 'School' }, status: 'DONE' };
                return {
                    findJobId: 'find1',
                    replace: 'Campus',
                    runId: 'newer',
                    status: 'RUNNING',
                    results: [],
                    cursor: 0,
                };
            },
        });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('SUPERSEDED');
        expect(patches.some((p) => p.status === 'DONE')).to.equal(false);
    });
});
