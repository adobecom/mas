import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, unlinkSync, rmdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import initializeRateLimitCoordinator, { coordinateRateLimit, OriginRateLimits } from '../libs/rate-limit-coordinator.js';
import { logRateLimitedResponses, waitForRateLimit, fetchWithRateLimitRetry } from '../libs/rate-limit.js';
import GlobalRequestCounter from '../libs/global-request-counter.js';
import RequestCountingReporter, { drainReporterOutput } from '../utils/request-counting-reporter.js';
import BaseReporter from '../utils/base-reporter.js';
import globalTeardown from '../utils/global.teardown.js';
import { createRunId } from '../utils/fragment-tracker.js';
import { initializeFragmentLedger, recordCreatedFragment } from '../utils/fragment-ledger.js';
import { chromium } from '@playwright/test';

const coordinatorModule = new URL('../libs/rate-limit-coordinator.js', import.meta.url).href;

test('reporter output drains both stdout and stderr before returning', async (t) => {
    const finished = [];
    for (const [name, stream] of [
        ['stdout', process.stdout],
        ['stderr', process.stderr],
    ]) {
        const write = stream.write.bind(stream);
        t.mock.method(stream, 'write', (chunk, callback) => {
            if (chunk !== '') return write(chunk, callback);
            setImmediate(() => {
                finished.push(name);
                callback();
            });
            return true;
        });
    }
    await drainReporterOutput();
    assert.deepEqual(finished.sort(), ['stderr', 'stdout']);
});

for (const cleanup of ['skipped', 'empty', 'failed', 'completed']) {
    test(`CI reports tests before ${cleanup} cleanup with independent counters and pressure`, async (t) => {
        const directory = mkdtempSync(join(tmpdir(), 'nala-final-summary-'));
        const cwd = process.cwd();
        const previousCleanup = global.nalaCleanupResults;
        const env = {
            GITHUB_ACTIONS: 'true',
            GITHUB_REPOSITORY: 'adobecom/mas',
            GITHUB_REF: 'refs/pull/1357/merge',
            GITHUB_RUN_ID: '42',
            SKIP_AUTH: cleanup === 'skipped' ? 'true' : 'false',
            NALA_RUN_ID: undefined,
        };
        const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
        const logs = [];
        t.mock.method(console, 'log', (message) => logs.push(message));
        t.mock.method(console, 'info', (message) => logs.push(message));
        t.mock.method(chromium, 'launch', async () => {
            if (cleanup === 'completed') {
                const fragmentsUrl = 'https://author-test.adobeaemcloud.com/adobe/sites/cf/fragments';
                const page = new EventEmitter();
                page.route = async () => {};
                page.unrouteAll = async () => {};
                page.goto = async () => {};
                page.waitForFunction = async () => {};
                page.locator = () => ({ evaluate: async () => fragmentsUrl });
                page.evaluate = async () => {
                    page.emit('response', {
                        status: () => 404,
                        url: () => `${fragmentsUrl}/already-absent-id`,
                        request: () => ({ method: () => 'GET' }),
                    });
                    return { deletedIds: ['deleted-id'], alreadyDeletedIds: ['already-absent-id'], failures: [] };
                };
                const context = { newPage: async () => page, pages: () => [page] };
                return {
                    newContext: async () => context,
                    contexts: () => [context],
                    close: async () => page.emit('pageerror', new Error('Final browser diagnostic')),
                };
            }
            throw new Error('cleanup browser unavailable');
        });
        if (cleanup === 'completed') {
            t.mock.method(GlobalRequestCounter, 'init', async () => () => {});
            t.mock.method(GlobalRequestCounter, 'saveCountToFileSync', () => {});
        }
        process.chdir(directory);
        for (const [key, value] of Object.entries(env)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        let ledgerDirectory;
        try {
            if (cleanup !== 'skipped') {
                ledgerDirectory = join(directory, 'nala', '.runs', createRunId());
                initializeFragmentLedger();
                if (cleanup === 'failed') {
                    recordCreatedFragment({
                        id: 'owned',
                        path: '/content/dam/mas/nala/en_US/owned',
                        title: process.env.NALA_RUN_ID,
                    });
                }
                if (cleanup === 'completed') {
                    for (const id of ['deleted-id', 'already-absent-id']) {
                        recordCreatedFragment({
                            id,
                            path: `/content/dam/mas/nala/en_US/${id}`,
                            title: process.env.NALA_RUN_ID,
                        });
                    }
                }
            }
            const reporter = new BaseReporter({});
            reporter.onBegin({ projects: [{ name: 'studio', use: { baseURL: 'https://test--mas--adobecom.aem.live' } }] });
            if (cleanup !== 'skipped') {
                await reporter.onTestEnd(
                    { title: '@example,@mas-studio', retries: 0, _projectId: 'studio', annotations: [] },
                    { status: 'failed', retry: 0, duration: 1, error: { message: 'example failure' } },
                );
            }
            mkdirSync('test-results');
            const counts = (totalRequests) => ({
                serviceCounts: { ODIN_AEM: { totalRequests, methods: { GET: totalRequests } } },
                trackedUrls: { ODIN_AEM: 'https://author-test.adobeaemcloud.com' },
            });
            writeFileSync('test-results/request-count-tests.json', JSON.stringify(counts(3)));
            writeFileSync(
                'test-results/odin-pressure.json',
                JSON.stringify({
                    origin: 'https://odinpreview.corp.adobe.com',
                    elapsedMs: 1000,
                    starts: 3,
                    peakInFlight: 1,
                    peakStartsPerSecond: 3,
                    maxRps: 10,
                    maxInFlight: 3,
                    currentRps: 10,
                    completed: 3,
                    latencyMs: 300,
                    maxLatencyMs: 100,
                    waitMs: 0,
                    userAgents: ['Nala test'],
                    paths: {},
                }),
            );
            await reporter.onEnd();
            assert.equal(existsSync('test-results/request-count-tests.json'), false);
            const testOutput = logs.join('\n');
            assert.match(testOutput, /Nala Test Run Summary/);
            assert.match(testOutput, /ODIN_AEM Requests[^:]*:.*3/);
            assert.match(testOutput, /tests, including setup and inline teardown/);
            assert.doesNotMatch(testOutput, /separate CI cleanup/);
            const cleanupStart = logs.length;
            writeFileSync('test-results/request-count-unreported-tests.json', JSON.stringify(counts(9)));
            writeFileSync('test-results/request-count-cleanup.json', JSON.stringify(counts(2)));
            if (cleanup === 'failed') await assert.rejects(globalTeardown(), /cleanup browser unavailable/);
            else await globalTeardown();
            const output = logs.join('\n');
            assert.equal(output.match(/Nala Test Run Summary/g).length, 1);
            assert.equal(output.match(/---------Request Summary/g).length, 2);
            const cleanupOutput = logs.slice(cleanupStart).join('\n');
            assert.match(cleanupOutput, /ODIN_AEM Requests[^:]*:.*2/);
            assert.match(cleanupOutput, /separate CI cleanup/);
            assert.doesNotMatch(cleanupOutput, /tests, including setup and inline teardown|Nala Test Run Summary/);
            assert.ok(existsSync('test-results/request-count-unreported-tests.json'));
            assert.ok(output.indexOf('Nala Test Run Summary') < output.indexOf('Nala Global Teardown'));
            if (cleanup !== 'skipped') {
                assert.ok(output.indexOf('Request Summary') < output.indexOf('Failed Tests Summary'));
            }
            assert.doesNotMatch(output, /NaN/);
            assert.equal(existsSync('test-results/nala-summary.json'), false);
            if (cleanup === 'failed') assert.match(output, /Failed to delete.*1\/1/);
            if (cleanup === 'completed') {
                assert.doesNotMatch(cleanupOutput, /deleted-id|already-absent-id|HTTP 404/);
                assert.match(cleanupOutput, /Final browser diagnostic/);
                assert.match(cleanupOutput, /Deleted\/already absent.*2/);
                assert.ok(
                    cleanupOutput.indexOf('Final browser diagnostic') < cleanupOutput.indexOf('Fragment Cleanup Summary'),
                );
                assert.ok(
                    cleanupOutput.indexOf('Run-owned fragment cleanup completed') <
                        cleanupOutput.indexOf('Fragment Cleanup Summary'),
                );
            }
        } finally {
            for (const file of readdirSync('test-results')) unlinkSync(join('test-results', file));
            rmdirSync('test-results');
            if (ledgerDirectory) {
                for (const file of readdirSync(ledgerDirectory)) unlinkSync(join(ledgerDirectory, file));
                rmdirSync(ledgerDirectory);
                rmdirSync(join(directory, 'nala', '.runs'));
                rmdirSync(join(directory, 'nala'));
            }
            process.chdir(cwd);
            rmdirSync(directory);
            global.nalaCleanupResults = previousCleanup;
            for (const [key, value] of Object.entries(previous)) {
                if (value === undefined) delete process.env[key];
                else process.env[key] = value;
            }
        }
    });
}

test('preview starts are spaced globally before the first 429', async (t) => {
    let now = 1000;
    t.mock.method(Date, 'now', () => now);
    t.mock.method(globalThis, 'setTimeout', (resolve, delay) => {
        now += delay;
        resolve();
    });
    const limits = new OriginRateLimits();
    const origin = 'https://odinpreview.corp.adobe.com';
    const read = { path: '/read', userAgent: 'Nala' };
    const permits = await Promise.all(Array.from({ length: 3 }, () => limits.wait(origin, read)));
    assert.deepEqual(
        permits.map(({ waitMs }) => waitMs),
        [0, 100, 200],
    );
    for (const permit of permits) limits.release(origin, permit.id, 200, 10);
});

test('independent worker processes share preview concurrency and persist sanitized pressure measurements', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'nala-pressure-'));
    const origin = 'https://odinpreview.corp.adobe.com';
    const stop = await initializeRateLimitCoordinator(
        { projects: [{ outputDir: directory }] },
        { maxRps: 100, maxInFlight: 1 },
    );
    try {
        const starts = await Promise.all(
            Array.from({ length: 3 }, async () => {
                const child = spawn(
                    process.execPath,
                    [
                        '--input-type=module',
                        '-e',
                        `
                    import { coordinateRateLimit } from ${JSON.stringify(coordinatorModule)};
                    const permit = await coordinateRateLimit('acquire', ${JSON.stringify(origin)}, undefined,
                        { path: '/read', userAgent: 'Nala stable UA' });
                    const started = Date.now();
                    await new Promise(resolve => setTimeout(resolve, 60));
                    await coordinateRateLimit('release', ${JSON.stringify(origin)}, undefined,
                        { id: permit.id, status: 200, latencyMs: Date.now() - started });
                    console.log(started);
                `,
                    ],
                    { env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] },
                );
                let stdout = '';
                let stderr = '';
                child.stdout.on('data', (chunk) => (stdout += chunk));
                child.stderr.on('data', (chunk) => (stderr += chunk));
                const [code] = await once(child, 'exit');
                assert.equal(code, 0, stderr);
                return Number(stdout.trim());
            }),
        );
        starts.sort((a, b) => a - b);
        assert.ok(starts[1] - starts[0] >= 60);
        assert.ok(starts[2] - starts[1] >= 60);
    } finally {
        await stop();
    }
    const file = join(directory, 'odin-pressure.json');
    const pressure = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(pressure.starts, 3);
    assert.equal(pressure.completed, 3);
    assert.equal(pressure.peakInFlight, 1);
    assert.equal(pressure.active, 0);
    assert.ok(pressure.elapsedMs >= 180);
    assert.deepEqual(pressure.userAgents, ['Nala stable UA']);
    assert.deepEqual(pressure.paths, { '/read': 3 });
    unlinkSync(file);
    rmdirSync(directory);
});

test('recovery grants are spaced at least 100ms apart even for already queued requests', async (t) => {
    let now = 1000;
    t.mock.method(Date, 'now', () => now);
    t.mock.method(globalThis, 'setTimeout', (resolve, delay) => {
        now += delay;
        resolve();
    });
    const limits = new OriginRateLimits();
    const origin = 'https://service.example';
    limits.cooldown(origin, 2000);
    assert.deepEqual(await Promise.all([limits.wait(origin), limits.wait(origin), limits.wait(origin)]), [1000, 1100, 1200]);
});

async function worker(action, origin, deadline) {
    const child = spawn(
        process.execPath,
        [
            '--input-type=module',
            '-e',
            `import { coordinateRateLimit } from ${JSON.stringify(coordinatorModule)};
            await coordinateRateLimit(${JSON.stringify(action)}, ${JSON.stringify(origin)}, ${JSON.stringify(deadline)});
            console.log(Date.now());`,
        ],
        { env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    const [code] = await once(child, 'exit');
    assert.equal(code, 0, stderr);
    return Number(stdout.trim());
}

test('separate workers share cooldowns, stagger recovery and leave unrelated origins independent', async (t) => {
    const stop = await initializeRateLimitCoordinator();
    t.after(stop);
    const origin = 'https://odinpreview.corp.adobe.com';
    const deadline = Date.now() + 1000;
    await worker('cooldown', origin, deadline);
    const recovering = Promise.all(Array.from({ length: 3 }, () => worker('wait', origin)));
    assert.ok((await worker('wait', 'https://other.example')) < deadline);
    const times = (await recovering).sort((a, b) => a - b);
    assert.ok(times[0] >= deadline);
    assert.ok(times[1] - times[0] >= 90);
    assert.ok(times[2] - times[1] >= 90);
});

test('a later 429 extends queued waits and a fresh invocation never inherits cooldowns', async () => {
    const origin = 'https://service.example';
    const stop = await initializeRateLimitCoordinator();
    const firstEndpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
    try {
        await coordinateRateLimit('cooldown', origin, Date.now() + 150);
        const waiting = coordinateRateLimit('wait', origin);
        const deadline = Date.now() + 350;
        await coordinateRateLimit('cooldown', origin, deadline);
        await waiting;
        assert.ok(Date.now() >= deadline);
        await coordinateRateLimit('cooldown', origin, Date.now() + 60000);
    } finally {
        await stop();
    }
    const stopNext = await initializeRateLimitCoordinator();
    try {
        assert.notEqual(process.env.NALA_RATE_LIMIT_COORDINATOR, firstEndpoint);
        assert.equal(await coordinateRateLimit('wait', origin), 0);
    } finally {
        await stopNext();
    }
});

test('coordinator failures are explicit rather than silently bypassing cooldowns', async () => {
    const stop = await initializeRateLimitCoordinator();
    const endpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
    await stop();
    process.env.NALA_RATE_LIMIT_COORDINATOR = endpoint;
    try {
        await assert.rejects(coordinateRateLimit('wait', 'https://service.example'), /fetch failed/);
    } finally {
        delete process.env.NALA_RATE_LIMIT_COORDINATOR;
    }
});

test('request summary counts Odin preview, retries and rate-limit waits without logging query secrets', async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'nala-rate-summary-'));
    const cwd = process.cwd();
    const previousCounterFile = globalThis.requestCounter.counterFile;
    const logs = [];
    t.mock.method(console, 'log', (message) => logs.push(message));
    t.mock.method(console, 'warn', () => {});
    process.chdir(directory);
    mkdirSync('test-results');
    globalThis.requestCounter.counterFile = './test-results/request-count.json';
    const page = new EventEmitter();
    const url = 'https://odinpreview.corp.adobe.com/adobe/contentFragments/byPath?token=secret';
    const request = { url: () => url, method: () => 'GET', headerValue: async () => 'Nala test' };
    const stopCounting = await GlobalRequestCounter.init(page);
    logRateLimitedResponses(page);
    let stopCoordinator = await initializeRateLimitCoordinator({ projects: [{ outputDir: join(directory, 'test-results') }] });
    try {
        page.emit('request', request);
        page.emit('response', {
            status: () => 429,
            request: () => request,
            headers: () => ({ 'retry-after': '0.01' }),
        });
        await waitForRateLimit(url);
        let attempts = 0;
        await fetchWithRateLimitRetry(
            {
                request: () => request,
                fetch: async () => {
                    const status = ++attempts === 1 ? 429 : 200;
                    return {
                        status: () => status,
                        headers: () => ({ 'retry-after': '0' }),
                        dispose: async () => {},
                    };
                },
            },
            () => waitForRateLimit(url),
        );
        GlobalRequestCounter.saveCountToFileSync();
        const file = readdirSync('test-results')[0];
        const data = JSON.parse(readFileSync(join('test-results', file), 'utf8'));
        assert.equal(data.serviceCounts.ODIN_PREVIEW.totalRequests, 1);
        assert.equal(data.rateLimits['https://odinpreview.corp.adobe.com'].responses429, 2);
        assert.equal(data.rateLimits['https://odinpreview.corp.adobe.com'].retries, 1);
        assert.ok(data.rateLimits['https://odinpreview.corp.adobe.com'].waitMs >= 10);
        await stopCoordinator();
        stopCoordinator = null;
        new RequestCountingReporter({}).printRequestSummary();
        assert.match(logs.join('\n'), /ODIN_PREVIEW Requests/);
        assert.match(logs.join('\n'), /Upstream requests: 2/);
        assert.match(logs.join('\n'), /HTTP 429s: 2; GET retries: 1/);
        assert.match(logs.join('\n'), /Upstream reads: 2; peak in-flight: 1/);
        assert.match(logs.join('\n'), /User agents: Nala test/);
        assert.match(logs.join('\n'), /summed request waits/);
        assert.doesNotMatch(logs.join('\n'), /token=secret/);
    } finally {
        if (stopCoordinator) await stopCoordinator();
        stopCounting();
        globalThis.requestCounter.counterFile = previousCounterFile;
        for (const file of readdirSync('test-results')) unlinkSync(join('test-results', file));
        rmdirSync('test-results');
        process.chdir(cwd);
        rmdirSync(directory);
    }
});

test('preview requests are paced before any 429 and in-flight capacity is shared', async () => {
    const origin = 'https://odinpreview.corp.adobe.com';
    const limits = new OriginRateLimits({ maxRps: 100, maxInFlight: 1 });
    const read = { path: '/adobe/contentFragments/byPath', userAgent: 'Nala' };
    const first = await limits.wait(origin, read);
    const queued = limits.wait(origin, read);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(limits.snapshot().starts, 1);
    limits.release(origin, first.id, 200, 40);
    const second = await queued;
    assert.ok(second.waitMs >= 40);
    limits.release(origin, second.id, 200, 1);
    assert.equal(limits.snapshot().peakInFlight, 1);
    assert.equal(limits.snapshot().completed, 2);
    assert.deepEqual(limits.snapshot().userAgents, ['Nala']);
    assert.deepEqual(limits.snapshot().paths, { '/adobe/contentFragments/byPath': 2 });
    assert.equal(limits.snapshot().active, 0);
});

test('preview rate decreases once per burst and recovers only after sustained successful reads', async (t) => {
    let now = 1000;
    t.mock.method(Date, 'now', () => now);
    t.mock.method(globalThis, 'setTimeout', (resolve, delay) => {
        now += delay;
        resolve();
    });
    const origin = 'https://odinpreview.corp.adobe.com';
    const limits = new OriginRateLimits();
    for (let index = 0; index < 10; index++) limits.cooldown(origin, 2000);
    assert.equal(limits.snapshot().currentRps, 5);
    now = 2100;
    limits.cooldown(origin, 2200);
    assert.equal(limits.snapshot().currentRps, 2.5);
    now = 15000;
    for (let index = 0; index < 20; index++) {
        const permit = await limits.wait(origin, { path: '/read', userAgent: 'Nala' });
        limits.release(origin, permit.id, 200, 10);
    }
    assert.ok(limits.snapshot().currentRps > 2.5);
    assert.ok(limits.snapshot().currentRps <= 10);
    assert.equal(limits.snapshot().active, 0);
});

test('abandoned preview permits expire and invalid budgets fail explicitly', async (t) => {
    let now = 1000;
    t.mock.method(Date, 'now', () => now);
    t.mock.method(console, 'warn', () => {});
    const origin = 'https://odinpreview.corp.adobe.com';
    const limits = new OriginRateLimits({ maxInFlight: 1 });
    const read = { path: '/read', userAgent: 'Nala' };
    const lost = await limits.wait(origin, read);
    now += 90001;
    const replacement = await limits.wait(origin, read);
    assert.throws(() => limits.release(origin, lost.id, 200, 1), /expired/);
    limits.release(origin, replacement.id, 200, 1);
    assert.equal(limits.snapshot().active, 0);
    assert.throws(() => new OriginRateLimits({ maxRps: 0 }), /MAX_RPS/);
    assert.throws(() => new OriginRateLimits({ maxInFlight: 1.5 }), /MAX_IN_FLIGHT/);
});

test('read transport failure releases its permit, and a retry reacquires capacity after cooldown', async (t) => {
    t.mock.method(console, 'warn', () => {});
    const stop = await initializeRateLimitCoordinator();
    t.after(stop);
    const request = {
        url: () => 'https://odinpreview.corp.adobe.com/adobe/contentFragments/byPath?secret=do-not-retain',
        headerValue: async () => 'Nala',
        method: () => 'GET',
    };
    await assert.rejects(
        fetchWithRateLimitRetry(
            {
                request: () => request,
                fetch: async (options) => {
                    assert.equal(options.timeout, 60000);
                    throw new Error('transport failed');
                },
            },
            async () => {},
        ),
        /transport failed/,
    );
    let attempts = 0;
    const result = await fetchWithRateLimitRetry(
        {
            request: () => request,
            fetch: async () => ({
                status: () => (attempts === 1 ? 429 : 200),
                headers: () => ({ 'retry-after': '0.01' }),
                dispose: async () => {},
            }),
        },
        async () => {
            attempts++;
        },
    );
    assert.equal(attempts, 2);
    assert.equal(result.status(), 200);
});
