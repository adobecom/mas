import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { getPageRouteMetrics, installEdsThrottleOnPage, throttleEdsGap } from '../libs/eds-throttle.js';
import { getResourceMetrics } from '../libs/static-resource-cache.js';
import { signIn } from '../libs/ims-auth.js';
import { getRateLimitMetrics } from '../libs/rate-limit.js';
import initializeRateLimitCoordinator, { coordinateRateLimit } from '../libs/rate-limit-coordinator.js';
import GlobalRequestCounter from '../libs/global-request-counter.js';

let server;
let baseURL;
const requests = new Map();
let warnings;
let originalWarn;
let pressureActive = 0;
let pressurePeak = 0;
const pressureUserAgents = new Set();

test.describe('concurrent settings reads', () => {
    let previousOrigin;
    let previousEndpoint;
    let stop;
    const path = '/adobe/contentFragments/byPath';
    const settings = (status = 200) => `${baseURL}${path}?path=/content/dam/mas/nala/settings/index&status=${status}`;

    test.beforeEach(async () => {
        previousOrigin = process.env.NALA_ODIN_PREVIEW_ORIGIN;
        previousEndpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
        process.env.NALA_ODIN_PREVIEW_ORIGIN = baseURL;
        stop = await initializeRateLimitCoordinator(undefined, { maxRps: 1000, maxInFlight: 1 });
        requests.delete(path);
    });

    test.afterEach(async () => {
        await stop();
        if (previousOrigin === undefined) delete process.env.NALA_ODIN_PREVIEW_ORIGIN;
        else process.env.NALA_ODIN_PREVIEW_ORIGIN = previousOrigin;
        process.env.NALA_RATE_LIMIT_COORDINATOR = previousEndpoint;
    });

    for (const status of [200, 404, 500]) {
        test(`20 overlapping settings lookups use one upstream read, preserve HTTP ${status} and never cache it`, async ({
            page,
        }) => {
            await installEdsThrottleOnPage(page);
            await page.goto(baseURL);
            GlobalRequestCounter.setTargetUrl(baseURL, 'COALESCED_READ_TEST');
            const stopCounting = await GlobalRequestCounter.init(page);
            try {
                const results = await page.evaluate(
                    (url) =>
                        Promise.all(
                            Array.from({ length: 20 }, async () => {
                                const response = await fetch(url);
                                return { status: response.status, body: await response.json() };
                            }),
                        ),
                    settings(status),
                );
                expect(results).toEqual(Array(20).fill({ status, body: { sequence: 1 } }));
                expect(requests.get(path)).toHaveLength(1);
                expect(getPageRouteMetrics(page).coalescedSettingsReads).toBe(19);
                expect(globalThis.requestCounter.serviceCounts.COALESCED_READ_TEST.coalescedReads).toBe(19);
                expect(await page.evaluate(async (url) => (await fetch(url)).json(), settings(status))).toEqual({
                    sequence: 2,
                });
                expect(requests.get(path)).toHaveLength(2);
            } finally {
                stopCounting();
            }
        });
    }

    test('distinct authorization headers and fragment lookups remain independent', async ({ page }) => {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        await page.evaluate(async (url) => {
            await Promise.all([
                fetch(url, { headers: { Authorization: 'Bearer synthetic-a' } }),
                fetch(url, { headers: { Authorization: 'Bearer synthetic-b' } }),
                fetch(url.replace('/settings/index', '/en_US/card')),
                fetch(url.replace('/settings/index', '/en_US/card')),
            ]);
        }, settings());
        expect(requests.get(path)).toHaveLength(4);
        expect(getPageRouteMetrics(page).coalescedSettingsReads).toBe(0);
    });

    test('authentication timing exemption does not bypass Odin read permits or settings coalescing', async ({ page }) => {
        await installEdsThrottleOnPage(page, { nativeCooldowns: false });
        await page.goto(baseURL);
        const responses = await page.evaluate(
            (url) => Promise.all(Array.from({ length: 4 }, async () => (await fetch(url)).json())),
            settings(),
        );
        expect(responses).toEqual(Array(4).fill({ sequence: 1 }));
        expect(requests.get(path)).toHaveLength(1);
        expect(getPageRouteMetrics(page).coalescedSettingsReads).toBe(3);
    });

    test('a mutation starts a fresh settings read rather than joining the pre-mutation request', async ({ page }) => {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        await Promise.all([
            page.waitForRequest(settings()),
            page.evaluate((url) => {
                window.firstSettingsRead = fetch(url).then((response) => response.json());
            }, settings()),
        ]);
        const result = await page.evaluate(async (url) => {
            await fetch('/settings-change', { method: 'PUT' });
            const second = fetch(url).then((response) => response.json());
            return Promise.all([window.firstSettingsRead, second]);
        }, settings());
        expect(result).toEqual([{ sequence: 1 }, { sequence: 2 }]);
        expect(requests.get(path)).toHaveLength(2);
        expect(getPageRouteMetrics(page).coalescedSettingsReads).toBe(0);
    });

    test('cancelling the first consumer does not cancel the other consumer', async ({ page }) => {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        const result = await page.evaluate(async (url) => {
            const controller = new AbortController();
            const first = fetch(url, { signal: controller.signal }).catch((error) => error.name);
            const second = fetch(url).then((response) => response.json());
            setTimeout(() => controller.abort(), 100);
            return Promise.all([first, second]);
        }, settings());
        expect(result).toEqual(['AbortError', { sequence: 1 }]);
        expect(requests.get(path)).toHaveLength(1);
        expect(getPageRouteMetrics(page).coalescedSettingsReads).toBe(1);
    });

    test('cancelling every queued consumer releases the shared acquisition and allows a fresh read', async ({ page }) => {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        const permit = await coordinateRateLimit('acquire', baseURL);
        try {
            const result = await page.evaluate(async (url) => {
                const controllers = [new AbortController(), new AbortController()];
                const reads = controllers.map((controller) =>
                    fetch(url, { signal: controller.signal }).catch((error) => error.name),
                );
                setTimeout(() => {
                    for (const controller of controllers) controller.abort();
                }, 100);
                return Promise.all(reads);
            }, settings());
            expect(result).toEqual(['AbortError', 'AbortError']);
            await expect.poll(() => getPageRouteMetrics(page).pendingRoutes).toBe(0);
            expect(requests.get(path)).toBeUndefined();
        } finally {
            await coordinateRateLimit('release', baseURL, undefined, { id: permit.id, status: 200, latencyMs: 0 });
        }
        expect(await page.evaluate(async (url) => (await fetch(url)).json(), settings())).toEqual({ sequence: 1 });
        expect(requests.get(path)).toHaveLength(1);
    });

    test('separate owned pages never share their settings reads', async ({ browser }) => {
        const context = await browser.newContext();
        try {
            const pages = await Promise.all([context.newPage(), context.newPage()]);
            for (const page of pages) {
                await installEdsThrottleOnPage(page);
                await page.goto(baseURL);
            }
            await Promise.all(pages.map((page) => page.evaluate(async (url) => (await fetch(url)).json(), settings())));
            expect(requests.get(path)).toHaveLength(2);
            expect(pages.map((page) => getPageRouteMetrics(page).coalescedSettingsReads)).toEqual([0, 0]);
        } finally {
            await context.close();
        }
    });
});

test.beforeAll(async () => {
    server = createServer((request, response) => {
        const { pathname, searchParams } = new URL(request.url, 'http://localhost');
        const calls = requests.get(pathname) ?? [];
        calls.push({ time: Date.now(), method: request.method, url: request.url });
        requests.set(pathname, calls);
        if (pathname === '/adobe/contentFragments/byPath') {
            const sequence = calls.length;
            setTimeout(() => {
                response.writeHead(Number(searchParams.get('status') || 200), { 'content-type': 'application/json' });
                response.end(JSON.stringify({ sequence }));
            }, 250);
            return;
        }
        if (pathname.startsWith('/pressure/slow')) {
            pressureUserAgents.add(request.headers['user-agent']);
            pressureActive++;
            pressurePeak = Math.max(pressurePeak, pressureActive);
            setTimeout(() => {
                pressureActive--;
                response.writeHead(200, { 'content-type': 'application/json' });
                response.end('{}');
            }, 200);
            return;
        }

        if (pathname === '/reset-read') {
            request.socket.destroy();
            return;
        }
        if (pathname.startsWith('/overload-')) {
            response.writeHead(Number(pathname.split('-').at(-1)), { 'retry-after': '0.1' });
            response.end('overloaded');
            return;
        }
        if (pathname === '/login') {
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end(`
                <input id="EmailPage-EmailField">
                <button data-id="EmailPage-ContinueButton">Continue</button>
                <section id="password" hidden>
                    <a>Reset your password</a>
                    <input id="PasswordPage-PasswordField">
                    <button data-id="PasswordPage-ContinueButton">Sign in</button>
                </section>
                <section id="passkey" hidden>
                    <button data-id="PasskeyNudgePage-SkipButton">Skip</button>
                </section>
                <div id="welcome" hidden>Welcome</div>
                <script>
                    document.querySelector('[data-id=EmailPage-ContinueButton]').addEventListener('click', async () => {
                        await fetch('/signin/v1/audit', { method: 'POST' });
                        const response = await fetch('/email', { method: 'POST' });
                        if (response.ok) document.querySelector('#password').hidden = false;
                    });
                    document.querySelector('[data-id=PasswordPage-ContinueButton]').addEventListener('click', async () => {
                        await fetch('/signin/v1/password-audit', { method: 'POST' });
                        const response = await fetch('/password', { method: 'POST' });
                        if (response.ok) document.querySelector('#passkey').hidden = false;
                    });
                    document.querySelector('[data-id=PasskeyNudgePage-SkipButton]').addEventListener('click', async () => {
                        const response = await fetch('/skip', { method: 'POST' });
                        if (response.ok) document.querySelector('#welcome').hidden = false;
                        if (response.ok) location.hash = 'page=welcome';
                    });
                </script>
            `);
            return;
        }
        const limited =
            pathname === '/persistent.js' ||
            pathname === '/write' ||
            pathname === '/persistent-read' ||
            pathname === '/cookie-read' ||
            pathname === '/signin/v1/audit' ||
            pathname === '/signin/v1/password-audit' ||
            (pathname === '/read-once' && calls.length === 1) ||
            (pathname.endsWith('.js') && calls.length === 1);
        const headers = { 'content-type': pathname.endsWith('.js') ? 'application/javascript' : 'text/html' };
        if (pathname !== '/fallback.js') headers['retry-after'] = pathname === '/persistent.js' ? '0' : '1';
        if (pathname === '/signin/v1/audit') headers['retry-after'] = '60';
        if (pathname === '/signin/v1/password-audit') headers['retry-after'] = '6';
        if (pathname === '/persistent-read' || pathname === '/cookie-read') headers['retry-after'] = '0';
        if (pathname === '/cookie-read') headers['set-cookie'] = 'limited=test; Path=/';
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

test('preview pressure is bounded across fresh contexts before any 429', async ({ browser }) => {
    const previousOrigin = process.env.NALA_ODIN_PREVIEW_ORIGIN;
    const previousEndpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
    process.env.NALA_ODIN_PREVIEW_ORIGIN = baseURL;
    const stop = await initializeRateLimitCoordinator(undefined, { maxRps: 100, maxInFlight: 2 });
    const contexts = [];
    try {
        const pages = [];
        for (let index = 0; index < 3; index++) {
            const context = await browser.newContext({ userAgent: 'Nala pressure regression' });
            contexts.push(context);
            const page = await context.newPage();
            await installEdsThrottleOnPage(page);
            await page.goto(baseURL);
            pages.push(page);
        }
        await Promise.all(
            pages.map((page, index) =>
                page.evaluate(async (index) => {
                    await Promise.all(Array.from({ length: 4 }, (_, read) => fetch(`/pressure/slow-${index}-${read}`)));
                }, index),
            ),
        );
        expect(pressurePeak).toBe(2);
        expect(pressureActive).toBe(0);
        expect([...pressureUserAgents]).toEqual(['Nala pressure regression']);
        expect(warnings).toHaveLength(0);
        expect([...requests.keys()].filter((path) => path.startsWith('/pressure/slow'))).toHaveLength(12);
    } finally {
        await Promise.all(contexts.map((context) => context.close()));
        await stop();
        if (previousOrigin === undefined) delete process.env.NALA_ODIN_PREVIEW_ORIGIN;
        else process.env.NALA_ODIN_PREVIEW_ORIGIN = previousOrigin;
        process.env.NALA_RATE_LIMIT_COORDINATOR = previousEndpoint;
    }
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

test('authentication static assets still honor cooldowns with native cooldowns disabled', async ({ page }) => {
    await installEdsThrottleOnPage(page, { nativeCooldowns: false });
    await page.goto(baseURL);
    await page.addScriptTag({ url: `${baseURL}/auth-static.js` });
    const calls = requests.get('/auth-static.js');
    expect(calls).toHaveLength(2);
    expect(calls[1].time - calls[0].time).toBeGreaterThanOrEqual(1000);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('cooldown 1s');
});

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

test('live API reads retry once after cooldown, preserve headers and are never cached', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(baseURL);
    const before = getRateLimitMetrics()[baseURL] ?? { responses429: 0, retries: 0, waitMs: 0 };
    const read = () =>
        page.evaluate(async () => {
            const response = await fetch('/read-once?token=do-not-log');
            return { status: response.status, body: await response.text(), retryAfter: response.headers.get('retry-after') };
        });
    expect(await read()).toEqual({ status: 200, body: 'window.rateLimitRecovered = true;', retryAfter: '1' });
    const calls = requests.get('/read-once');
    expect(calls).toHaveLength(2);
    expect(calls[1].time - calls[0].time).toBeGreaterThanOrEqual(1000);
    expect((await read()).status).toBe(200);
    expect(calls).toHaveLength(3);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).not.toContain('do-not-log');
    const after = getRateLimitMetrics()[baseURL];
    expect(after.responses429 - before.responses429).toBe(1);
    expect(after.retries - before.retries).toBe(1);
    expect(after.waitMs - before.waitMs).toBeGreaterThanOrEqual(1000);
});

test('persistent API 429s return unchanged and cookie-setting reads are not retried', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(baseURL);
    for (const [path, attempts] of [
        ['/persistent-read', 2],
        ['/cookie-read', 1],
    ]) {
        const response = await page.evaluate(async (path) => {
            const response = await fetch(path);
            return { status: response.status, body: await response.text() };
        }, path);
        expect(response).toEqual({ status: 429, body: 'rate limited' });
        expect(requests.get(path)).toHaveLength(attempts);
    }
    expect(warnings).toHaveLength(3);
    expect(await page.context().cookies(baseURL)).toEqual([expect.objectContaining({ name: 'limited', value: 'test' })]);
});

test('contexts share a cooldown and release queued API reads without a recovery burst', async ({ browser }) => {
    const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
    try {
        const pages = await Promise.all(contexts.map((context) => context.newPage()));
        for (const page of pages) {
            await installEdsThrottleOnPage(page);
            await page.goto(baseURL);
        }
        await pages[0].evaluate(() => fetch('/write', { method: 'POST' }));
        const limitedAt = requests.get('/write').at(-1).time;
        await Promise.all(pages.map((page, index) => page.evaluate((index) => fetch(`/queued-read-${index}`), index)));
        const times = pages.map((_, index) => requests.get(`/queued-read-${index}`)[0].time).sort((a, b) => a - b);
        expect(times[0] - limitedAt).toBeGreaterThanOrEqual(1000);
        for (let index = 1; index < times.length; index++) {
            expect(times[index] - times[index - 1]).toBeGreaterThanOrEqual(90);
        }
    } finally {
        await Promise.all(contexts.map((context) => context.close()));
    }
});

for (const status of [503, 529]) {
    test(`HTTP ${status} with Retry-After stays visible and paces the next read without retrying`, async ({ page }) => {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        const response = await page.evaluate(async (status) => {
            const response = await fetch(`/overload-${status}`);
            return { status: response.status, body: await response.text() };
        }, status);
        expect(response).toEqual({ status, body: 'overloaded' });
        expect(requests.get(`/overload-${status}`)).toHaveLength(1);
        await page.evaluate((status) => fetch(`/after-overload-${status}`), status);
        expect(
            requests.get(`/after-overload-${status}`)[0].time - requests.get(`/overload-${status}`)[0].time,
        ).toBeGreaterThanOrEqual(100);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain(`HTTP ${status} GET`);
        expect(getRateLimitMetrics()[baseURL][`responses${status}`]).toBe(1);
    });
}

test('persistent API connection resets fail after one bounded retry without leaking headers', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(baseURL);
    const failure = page.waitForEvent('requestfailed', (request) => request.url().includes('/reset-read'));
    const result = await page.evaluate(async () => {
        try {
            await fetch('/reset-read?token=do-not-log', { headers: { authorization: 'do-not-log-authorization' } });
            return 'unexpected success';
        } catch {
            return 'browser network failure';
        }
    });
    expect(result).toBe('browser network failure');
    await failure;
    expect(requests.get('/reset-read')).toHaveLength(2);
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toContain('transient connection failure; retrying once');
    expect(warnings[1]).toContain('GET network failure');
    expect(warnings[2]).toContain('Transport failure GET');
    for (const warning of warnings) expect(warning).not.toContain('do-not-log');
});

for (const nativeCooldowns of [true, false]) {
    const mode = nativeCooldowns ? 'test cooldowns' : 'authentication logging only';
    test(`sign-in with ${mode} submits each form once and logs audit 429s`, async ({ page }) => {
        test.setTimeout(nativeCooldowns ? 75000 : 10000);
        const before = new Map([...requests].map(([path, calls]) => [path, calls.length]));
        await installEdsThrottleOnPage(page, { cache: false, nativeCooldowns });
        await page.goto(`${baseURL}/login`);
        await signIn(page, {
            email: 'nala@example.test',
            password: 'not-a-real-password',
            welcomeUrlPattern: /\/login#page=welcome$/,
            timeout: nativeCooldowns ? 70000 : 5000,
        });
        await expect(page.locator('#welcome')).toBeVisible();
        const calls = (path) => requests.get(path).slice(before.get(path) ?? 0);
        const audit = calls('/signin/v1/audit');
        const email = calls('/email');
        const password = calls('/password');
        expect(audit).toHaveLength(1);
        expect(email).toHaveLength(1);
        expect(password).toHaveLength(1);
        expect(calls('/skip')).toHaveLength(1);
        const emailDelay = email[0].time - audit[0].time;
        const passwordDelay = password[0].time - calls('/signin/v1/password-audit')[0].time;
        if (nativeCooldowns) {
            expect(emailDelay).toBeGreaterThanOrEqual(60000);
            expect(passwordDelay).toBeGreaterThanOrEqual(6000);
        } else {
            expect(emailDelay).toBeLessThan(5000);
            expect(passwordDelay).toBeLessThan(5000);
        }
        expect(warnings).toHaveLength(2);
        const policy = nativeCooldowns ? 'cooldown 60s' : 'logging only (no Nala cooldown)';
        expect(warnings[0]).toContain(`HTTP 429 POST ${baseURL}/signin/v1/audit;`);
        expect(warnings[0]).toContain(`Retry-After: 60; ${policy}.`);
        expect(warnings[0]).toContain('time:');
        expect(warnings[0]).toContain('worker:');
    });
}
