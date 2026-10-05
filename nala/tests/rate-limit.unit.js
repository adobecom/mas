import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { EventEmitter } from 'node:events';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import initializeRateLimitCoordinator, { coordinateRateLimit, OriginRateLimits } from '../libs/rate-limit-coordinator.js';
import { logRateLimitedResponses, waitForRateLimit, fetchWithRateLimitRetry } from '../libs/rate-limit.js';
import GlobalRequestCounter from '../libs/global-request-counter.js';
import RequestCountingReporter from '../utils/request-counting-reporter.js';

const coordinatorModule = new URL('../libs/rate-limit-coordinator.js', import.meta.url).href;

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
    const request = { url: () => url, method: () => 'GET' };
    const stopCounting = await GlobalRequestCounter.init(page);
    logRateLimitedResponses(page);
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
                fetch: async () => ({
                    status: () => (++attempts === 1 ? 429 : 200),
                    headers: () => ({ 'retry-after': '0' }),
                    dispose: async () => {},
                }),
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
        new RequestCountingReporter({}).printRequestSummary();
        assert.match(logs.join('\n'), /ODIN_PREVIEW Requests/);
        assert.match(logs.join('\n'), /Upstream requests: 2/);
        assert.match(logs.join('\n'), /HTTP 429s: 2; GET retries: 1/);
        assert.doesNotMatch(logs.join('\n'), /token=secret/);
    } finally {
        stopCounting();
        globalThis.requestCounter.counterFile = previousCounterFile;
        for (const file of readdirSync('test-results')) unlinkSync(join('test-results', file));
        rmdirSync('test-results');
        process.chdir(cwd);
        rmdirSync(directory);
    }
});
