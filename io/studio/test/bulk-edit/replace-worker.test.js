const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const common = require('../../src/common.js');

function frag(id, value = 'School offer') {
    return {
        id,
        title: 'T',
        description: 'D',
        fields: [{ name: 'subtitle', values: [value], path: '/fields/0' }],
    };
}

function load(overrides = {}) {
    delete require.cache[require.resolve('../../src/bulk-edit/replace-worker.js')];
    const calls = { patch: [], get: [], dryRun: [], reports: [], invokes: [] };
    const patches = [];
    const job = {
        type: 'replace',
        findJobId: 'find1',
        dryRun: overrides.dryRun || false,
        matchCase: false,
        runId: 'run1',
        status: 'RUNNING',
        results: overrides.results || [],
        cursor: overrides.cursor || 0,
        ...overrides.job,
    };
    const rows = overrides.rows || [
        {
            fragment_id: 'a',
            path: '/p/a',
            locale: 'en_US',
            field: 'subtitle',
            find: 'School offer',
            replace: 'Campus offer',
            etag: 'etag-a',
        },
        {
            fragment_id: 'b',
            path: '/p/b',
            locale: 'en_US',
            field: 'subtitle',
            find: 'School offer',
            replace: 'Campus offer',
            etag: 'etag-b',
        },
    ];
    const stubs = {
        '../common.js': {
            getFragmentWithEtag: async (endpoint, id, authToken, userAgent) => {
                calls.get.push(id);
                calls.getUserAgent = userAgent;
                if (overrides.getThrows?.[id]) throw new Error(overrides.getThrows[id]);
                const etag = id === 'a' ? 'etag-a' : 'etag-b';
                return { fragment: frag(id), etag: overrides.serverEtags?.[id] ?? etag };
            },
            patchToOdin: async (endpoint, id, authToken, patchBody, etag, userAgent) => {
                calls.patch.push({ id, patchBody, etag, userAgent });
                calls.patchAttempts = (calls.patchAttempts || 0) + 1;
                if (overrides.patch429Always) {
                    throw new Error(`PATCH request failed for fragment ${id}: 429: Too Many Requests`);
                }
                if (overrides.patchThrows) throw new Error(overrides.patchThrows);
                return { success: true };
            },
            invokeAsyncAction: async (action, p) => {
                calls.invokes.push({ action, p });
            },
            buildSiblingActionName: () => 'pkg/bulk-edit-replace-worker',
            isOdinRateLimitError: common.isOdinRateLimitError,
            '@noCallThru': true,
        },
        './replace.js': require('../../src/bulk-edit/replace.js'),
        './state.js': {
            readJob:
                overrides.readJob ||
                (async (id) => {
                    if (id === 'find1') {
                        return { params: { find: 'School', replace: 'Campus' }, status: 'DONE' };
                    }
                    return job;
                }),
            patchJob: async (jobId, patch) => {
                patches.push(patch);
            },
            readUserCsv: async () => ({ rows }),
            readDryRun: async () => overrides.dryRunStore ?? null,
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
        './bulk-edit.js': {
            resolveFindSourceItems: async () => [
                {
                    id: 'a',
                    path: '/p/a',
                    locale: 'en_US',
                    etag: 'etag-a',
                    status: 'DRAFT',
                    matches: [{ field: 'subtitle', value: 'School offer' }],
                },
                {
                    id: 'b',
                    path: '/p/b',
                    locale: 'en_US',
                    etag: 'etag-b',
                    status: 'DRAFT',
                    matches: [{ field: 'subtitle', value: 'School offer' }],
                },
            ],
            writeJobExports: async () => ({ exportedAt: '2026-01-01T00:00:00.000Z' }),
            writeFullExport: async () => {},
            '@noCallThru': true,
        },
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {}, warn() {} }) }, '@noCallThru': true },
    };
    return { mod: proxyquire('../../src/bulk-edit/replace-worker.js', stubs), calls, patches, job };
}

describe('bulk-edit/replace-worker: patchOrThrow', () => {
    it('attempts once, trips the shared gate, and logs the cooldown on a 429', async () => {
        let calls = 0;
        const patchToOdin = async () => {
            calls += 1;
            throw new Error('PATCH request failed for fragment a: 429: Too Many Requests');
        };
        const warn = sinon.stub();
        const mod = proxyquire('../../src/bulk-edit/replace-worker.js', {
            '../common.js': { ...common, patchToOdin, '@noCallThru': true },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {}, warn }) }, '@noCallThru': true },
        });
        const gate = mod.createRateLimitGate();
        try {
            await mod.patchOrThrow('https://odin', 'a', 'token', [], 'etag-a', gate);
            expect.fail('expected throw');
        } catch (error) {
            expect(calls).to.equal(1);
            expect(error.message).to.include('429');
        }
        expect(gate.cooldownUntil).to.be.greaterThan(Date.now());
        expect(warn.calledOnce).to.equal(true);
        const logged = JSON.parse(warn.firstCall.args[0]);
        expect(logged.event).to.equal('bulk-edit-replace-429-cooldown');
    });

    it('does not retry and does not trip the gate on a non-429 failure', async () => {
        let calls = 0;
        const patchToOdin = async () => {
            calls += 1;
            throw new Error('PATCH request failed for fragment a: 500: Server Error');
        };
        const mod = proxyquire('../../src/bulk-edit/replace-worker.js', {
            '../common.js': { ...common, patchToOdin, '@noCallThru': true },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {}, warn() {} }) }, '@noCallThru': true },
        });
        const gate = mod.createRateLimitGate();
        try {
            await mod.patchOrThrow('https://odin', 'a', 'token', [], 'etag-a', gate);
            expect.fail('expected throw');
        } catch (error) {
            expect(calls).to.equal(1);
            expect(error.message).to.include('500');
        }
        expect(gate.cooldownUntil).to.equal(0);
    });

    it('a tripped gate makes the next call wait out the cooldown before attempting', async () => {
        const setTimeoutStub = sinon.stub(global, 'setTimeout').callsFake((fn) => {
            fn();
            return 1;
        });
        try {
            const mod = proxyquire('../../src/bulk-edit/replace-worker.js', {
                '../common.js': { ...common, patchToOdin: async () => ({ success: true }), '@noCallThru': true },
                '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {}, warn() {} }) }, '@noCallThru': true },
            });
            const gate = mod.createRateLimitGate();
            mod.tripRateLimitGate(gate);
            await mod.patchOrThrow('https://odin', 'a', 'token', [], 'etag-a', gate);
            const delays = setTimeoutStub.getCalls().map((call) => call.args[1]);
            expect(delays.some((ms) => ms >= 60000)).to.equal(true);
        } finally {
            setTimeoutStub.restore();
        }
    });
});

describe('bulk-edit/replace-worker: buildWorkPlan', () => {
    it('groups rows by fragment and excludes no-op rows', () => {
        const { mod } = load();
        const plan = mod.buildWorkPlan([
            {
                fragment_id: 'b',
                path: '/p/b',
                locale: 'en_US',
                field: 'subtitle',
                find: 'x',
                replace: 'y',
                etag: 'e2',
            },
            {
                fragment_id: 'a',
                path: '/p/a',
                locale: 'en_US',
                field: 'subtitle',
                find: 'x',
                replace: 'y',
                etag: 'e1',
            },
            {
                fragment_id: 'a',
                path: '/p/a',
                locale: 'en_US',
                field: 'title',
                find: 'z',
                replace: 'q',
                etag: 'e1',
            },
        ]);
        expect(plan.map((i) => i.id)).to.deep.equal(['a', 'b']);
        expect(plan[0].rows).to.have.length(2);
        expect(plan[1].rows).to.have.length(1);
    });
});

describe('bulk-edit/replace-worker: processFragment', () => {
    it('skips with etag_mismatch when server etag differs from CSV', async () => {
        const { mod } = load({ serverEtags: { a: 'etag-stale' } });
        const item = {
            id: 'a',
            path: '/p/a',
            locale: 'en_US',
            etag: 'etag-a',
            rows: [{ field: 'subtitle', find: 'School offer', replace: 'Campus offer' }],
        };
        const result = await mod.processFragment(item, {
            odinEndpoint: 'https://odin',
            authToken: 'token',
            matchCase: false,
            dryRun: false,
        });
        expect(result.status).to.equal('SKIPPED');
        expect(result.reason).to.equal('etag_mismatch');
    });
});

describe('bulk-edit/replace-worker: buildDryRunResult', () => {
    it('returns the modified fragment payload without persisting to Odin', () => {
        const { mod } = load();
        const item = { id: 'a', path: '/p/a', locale: 'en_US', rows: [{ field: 'subtitle', find: 'School offer' }] };
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
            patches: [],
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
            matches: [{ field: 'subtitle', value: 'School offer' }],
        });
    });
});

describe('bulk-edit/replace-worker: runReplaceWorker', () => {
    it('patches each fragment and finishes DONE', async () => {
        const { mod, calls, patches } = load();
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(result.succeeded).to.equal(2);
        expect(calls.patch.map((entry) => entry.id)).to.deep.equal(['a', 'b']);
        expect(patches[patches.length - 1].status).to.equal('DONE');
        expect(patches[patches.length - 1].exportReady).to.equal(true);
    });

    it('attributes Odin GET and PATCH to the bulk-edit user agent', async () => {
        const { mod, calls } = load();
        await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(calls.getUserAgent).to.equal('mas-bulk-edit');
        expect(calls.patch.every((entry) => entry.userAgent === 'mas-bulk-edit')).to.equal(true);
    });

    it('dry-run applies replacements in memory, makes no PATCH, and exports modified fragments', async () => {
        const { mod, calls } = load({ dryRun: true });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(calls.patch).to.deep.equal([]);
        expect(calls.dryRun.length).to.be.greaterThan(0);
        const list = calls.dryRun[calls.dryRun.length - 1];
        expect(list.every((r) => r.status === 'WOULD_REPLACE')).to.equal(true);
        expect(list[0].fields[0].values[0]).to.equal('Campus offer');
    });

    it('records SKIPPED on 412 without retrying', async () => {
        const { mod, calls } = load({ patchThrows: 'PATCH /x failed with status 412: Precondition Failed' });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(result.skipped).to.equal(2);
        expect(calls.patch).to.have.length(2);
    });

    it('marks fragments FAILED on 429 without retrying (no doomed backoff attempts)', async () => {
        const { mod, calls } = load({ patch429Always: true });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(result.status).to.equal('DONE');
        expect(result.failed).to.equal(2);
        expect(calls.patchAttempts).to.equal(2);
    });

    it('gates a later fragment instead of hammering Odin again after a 429', async () => {
        const delays = [];
        sinon.stub(global, 'setTimeout').callsFake((fn, ms) => {
            delays.push(ms);
            fn();
            return 1;
        });
        try {
            const { mod, calls } = load({ patch429Always: true });
            const result = await mod.runReplaceWorker('job1', {
                odinEndpoint: 'https://odin',
                runId: 'run1',
                params: { batchSize: '1' },
            });
            expect(result.failed).to.equal(2);
            expect(calls.patchAttempts).to.equal(2);
            expect(delays.some((ms) => ms >= 60000)).to.equal(true);
        } finally {
            sinon.restore();
        }
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
        expect(calls.patch.map((entry) => entry.id)).to.deep.equal(['b']);
    });

    it('resumes a dry-run from the persisted dry-run store, not job.results', async () => {
        const priorA = {
            id: 'a',
            path: '/p/a',
            locale: 'en_US',
            etag: 'etag-a',
            status: 'WOULD_REPLACE',
            matches: [{ field: 'subtitle', value: 'School offer' }],
        };
        const { mod, calls } = load({ dryRun: true, cursor: 1, results: [], dryRunStore: [priorA] });
        const result = await mod.runReplaceWorker('job1', { odinEndpoint: 'https://odin', runId: 'run1' });
        expect(calls.get).to.deep.equal(['b']);
        expect(result.processed).to.equal(2);
        expect(calls.results.map((item) => item.id)).to.deep.equal(['a', 'b']);
        expect(calls.reports[calls.reports.length - 1].totalFragments).to.equal(2);
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

    it('throttles between batches to honor rpsLimit', async () => {
        const delays = [];
        sinon.stub(global, 'setTimeout').callsFake((fn, ms) => {
            delays.push(ms);
            fn();
            return 1;
        });
        try {
            const { mod } = load();
            const result = await mod.runReplaceWorker('job1', {
                odinEndpoint: 'https://odin',
                runId: 'run1',
                params: { batchSize: '1', rpsLimit: '1' },
            });
            expect(result.status).to.equal('DONE');
            expect(delays.some((ms) => ms >= 900)).to.equal(true);
        } finally {
            sinon.restore();
        }
    });

    it('does not throttle when rpsLimit is unset', async () => {
        const delays = [];
        sinon.stub(global, 'setTimeout').callsFake((fn, ms) => {
            delays.push(ms);
            fn();
            return 1;
        });
        try {
            const { mod } = load();
            await mod.runReplaceWorker('job1', {
                odinEndpoint: 'https://odin',
                runId: 'run1',
                params: { batchSize: '1' },
            });
            expect(delays.some((ms) => ms >= 900)).to.equal(false);
        } finally {
            sinon.restore();
        }
    });

    it('stops as SUPERSEDED without writing terminal status when runId changes', async () => {
        const { mod, patches } = load({
            readJob: async (id) => {
                if (id === 'find1') return { params: { find: 'School', replace: 'Campus' }, status: 'DONE' };
                return {
                    findJobId: 'find1',
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
