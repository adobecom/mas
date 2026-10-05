import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { installEdsThrottleOnPage, throttleEdsGap } from '../libs/eds-throttle.js';
import { getResourceMetrics } from '../libs/static-resource-cache.js';

let server;
let baseURL;
const requests = new Map();
let warnings;
let originalWarn;

test.beforeAll(async () => {
    server = createServer((request, response) => {
        const { pathname } = new URL(request.url, 'http://localhost');
        const calls = requests.get(pathname) ?? [];
        calls.push({ time: Date.now(), method: request.method });
        requests.set(pathname, calls);
        const limited =
            pathname === '/persistent.js' || pathname === '/write' || (pathname.endsWith('.js') && calls.length === 1);
        const headers = { 'content-type': pathname.endsWith('.js') ? 'application/javascript' : 'text/html' };
        if (pathname !== '/fallback.js') headers['retry-after'] = pathname === '/persistent.js' ? '0' : '1';
        response.writeHead(limited ? 429 : 200, headers);
        response.end(limited ? 'rate limited' : 'window.rateLimitRecovered = true;');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test.beforeEach(() => {
    warnings = [];
    originalWarn = console.warn;
    console.warn = (message) => warnings.push(message);
});

test.afterEach(() => {
    console.warn = originalWarn;
});

for (const [path, delay] of [
    ['/seconds.js', 1000],
    ['/fallback.js', 10000],
]) {
    test(`static GET honors the ${delay / 1000}s cooldown, retries once and caches only success`, async ({ page }) => {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        const metrics = getResourceMetrics();
        const url = `${baseURL}${path}?token=do-not-log`;
        await page.addScriptTag({ url });
        expect(await page.evaluate(() => window.rateLimitRecovered)).toBe(true);
        const calls = requests.get(path);
        expect(calls).toHaveLength(2);
        expect(calls[1].time - calls[0].time).toBeGreaterThanOrEqual(delay);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain(`HTTP 429 GET ${baseURL}${path}`);
        expect(warnings[0]).toContain(`cooldown ${delay / 1000}s`);
        expect(warnings[0]).not.toContain('do-not-log');
        await page.addScriptTag({ url });
        expect(calls).toHaveLength(2);
        expect(getResourceMetrics().upstreamRequests - metrics.upstreamRequests).toBe(2);
        expect(getResourceMetrics().cacheHits - metrics.cacheHits).toBe(1);
    });
}

test('persistent 429s reach the browser unchanged, log each attempt once and are never cached', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(baseURL);
    for (const attempts of [2, 4]) {
        const response = page.waitForResponse(`${baseURL}/persistent.js`);
        await expect(page.addScriptTag({ url: `${baseURL}/persistent.js` })).rejects.toThrow();
        expect((await response).status()).toBe(429);
        expect(requests.get('/persistent.js')).toHaveLength(attempts);
        expect(warnings).toHaveLength(attempts);
    }
});

test('native write 429s are logged without retry and cool down subsequent requests with pacing/cache disabled', async ({
    page,
}) => {
    const previous = process.env.NALA_EDS_THROTTLE_DISABLED;
    process.env.NALA_EDS_THROTTLE_DISABLED = '1';
    try {
        await installEdsThrottleOnPage(page, { cache: false });
        await page.goto(baseURL);
        expect(await page.evaluate(async () => (await fetch('/write?token=do-not-log', { method: 'POST' })).status)).toBe(429);
        const first = requests.get('/write')[0];
        await page.evaluate(() => fetch('/read'));
        expect(requests.get('/write')).toHaveLength(1);
        expect(requests.get('/read')[0].time - first.time).toBeGreaterThanOrEqual(1000);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain(`HTTP 429 POST ${baseURL}/write`);
        expect(warnings[0]).not.toContain('do-not-log');
    } finally {
        if (previous === undefined) delete process.env.NALA_EDS_THROTTLE_DISABLED;
        else process.env.NALA_EDS_THROTTLE_DISABLED = previous;
    }
});

test('already queued EDS requests preserve spacing after a cooldown', async ({ page }) => {
    await installEdsThrottleOnPage(page, { cache: false });
    await page.goto(baseURL);
    await page.evaluate(() => fetch('/write', { method: 'POST' }));
    const first = requests.get('/write').at(-1).time;
    const times = await Promise.all(Array.from({ length: 3 }, () => throttleEdsGap(20, baseURL).then(() => Date.now())));
    expect(times[0] - first).toBeGreaterThanOrEqual(1000);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(50);
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(50);
});
