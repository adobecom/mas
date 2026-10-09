import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { initializeRunStaticHar, recordRunStaticHar } from '../libs/run-static-har.js';
import { installEdsThrottleOnPage } from '../libs/eds-throttle.js';
import { trackEditorReads, waitForEditorReady } from '../libs/editor-bootstrap.js';

let server;
let baseURL;
let cleanup;
let directory;
let previousDirectory;
let styleRequests = 0;
let retryRequests = 0;
let mixedRequests = 0;
const counts = { scripts: 0, documents: 0, content: 0, misses: 0 };

test.beforeAll(async () => {
    previousDirectory = process.env.NALA_STATIC_HAR_DIR;
    cleanup = initializeRunStaticHar(`nala-run-har-${randomUUID()}`);
    directory = process.env.NALA_STATIC_HAR_DIR;
    server = createServer((request, response) => {
        if (/^\/asset\d+\.js(?:\?.*)?$/.test(request.url)) {
            counts.scripts++;
            response.writeHead(200, { 'content-type': 'application/javascript', 'x-private-header': 'not-for-replay' });
            response.end('window.loaded = (window.loaded || 0) + 1;');
        } else if (request.url === '/style.css') {
            styleRequests++;
            response.writeHead(200, { 'content-type': 'text/css' });
            response.end('body { --run-har-test: 42; }');
        } else if (request.url.startsWith('/missing.js')) {
            counts.misses++;
            response.writeHead(200, { 'content-type': 'application/javascript' });
            response.end('window.missingLoaded = true;');
        } else if (request.url === '/content.json') {
            counts.content++;
            response.writeHead(200, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ sequence: counts.content }));
        } else if (request.url === '/failed.js') {
            response.writeHead(429, { 'content-type': 'application/javascript', 'retry-after': '0' });
            response.end('rate limited');
        } else if (request.url === '/retry.js') {
            retryRequests++;
            response.writeHead(retryRequests === 1 ? 429 : 200, {
                'content-type': 'application/javascript',
                'retry-after': '0',
            });
            response.end(retryRequests === 1 ? 'rate limited' : 'window.retryLoaded = true;');
        } else if (request.url === '/mixed.js') {
            mixedRequests++;
            const headers = { 'content-type': 'application/javascript' };
            if (mixedRequests === 2) headers['set-cookie'] = 'private=test; path=/';
            response.writeHead(200, headers);
            response.end('window.mixedLoaded = true;');
        } else if (request.url === '/not-found.js') {
            response.writeHead(404, { 'content-type': 'text/html' });
            response.end('not found');
        } else if (request.url.startsWith('/excluded.js')) {
            const policy = new URL(request.url, 'http://localhost').searchParams.get('policy');
            const headers = { 'content-type': 'application/javascript' };
            if (['private', 'no-store'].includes(policy)) headers['cache-control'] = policy;
            if (policy === 'vary') headers.vary = 'Cookie';
            if (policy === 'cookie') headers['set-cookie'] = 'private=test; path=/';
            response.writeHead(200, headers);
            response.end('window.excludedLoaded = true;');
        } else if (request.url === '/late.js' || request.url === '/nested.js') {
            setTimeout(() => {
                response.writeHead(200, { 'content-type': 'application/javascript' });
                response.end(
                    request.url === '/late.js'
                        ? 'import "./nested.js"; window.lateLoaded = true;'
                        : 'window.nestedLoaded = true;',
                );
            }, 300);
        } else if (request.url.startsWith('/late-seed')) {
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end('<!doctype html><script type="module">window.seedReady = true; import("/late.js");</script>');
        } else if (request.url.startsWith('/editor-seed')) {
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end(`<!doctype html><script src="/asset0.js"></script>
                <mas-repository></mas-repository><mas-fragment-editor></mas-fragment-editor>
                <merch-card><aem-fragment fragment="seed">Seed</aem-fragment></merch-card>
                <script>
                    const editor = document.querySelector('mas-fragment-editor');
                    editor.fragmentStore = { get: () => ({ id: 'seed' }), loading: false };
                    editor.initState = 'ready';
                    editor.previewResolved = true;
                    document.querySelector('mas-repository').operation = { get: () => null, subscribe: () => {} };
                    editor.dispatchEvent(new CustomEvent('fragment-loaded', { bubbles: true, composed: true }));
                </script>`);
        } else {
            counts.documents++;
            response.writeHead(200, { 'content-type': 'text/html' });
            const scripts = Array.from({ length: 119 }, (_, index) => `<script src="/asset${index}.js"></script>`).join('');
            response.end(`<!doctype html><link rel="stylesheet" href="/style.css">${scripts}
                <script>fetch("/content.json").then(r => r.json()).then(data => { window.sequence = data.sequence; });</script>`);
        }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    baseURL = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
    cleanup();
    expect(readdirSync(directory)).toEqual([]);
    rmdirSync(directory);
    rmdirSync(resolve(directory, '..'));
    if (previousDirectory !== undefined) process.env.NALA_STATIC_HAR_DIR = previousDirectory;
    await new Promise((done, reject) => server.close((error) => (error ? reject(error) : done())));
});

const ready = (page) => page.waitForFunction(() => window.loaded === 119 && window.sequence);

test('current-run HAR eliminates the 119-asset burst across three independent workers', async ({ browser }) => {
    await recordRunStaticHar({ browser, name: 'docs', urls: [baseURL], ready });
    expect(counts).toEqual({ scripts: 119, documents: 1, content: 1, misses: 0 });
    const har = JSON.parse(readFileSync(join(directory, 'docs.har'), 'utf8'));
    expect(har.log.entries).toHaveLength(120);
    expect(har.log.entries.every(({ response }) => !response.headers.some(({ name }) => name === 'x-private-header'))).toBe(
        true,
    );
    expect(existsSync(join(directory, 'docs.recording.har'))).toBe(false);

    const worker = `
        import { chromium } from '@playwright/test';
        import { installEdsThrottleOnPage } from './nala/libs/eds-throttle.js';
        import { getResourceMetrics } from './nala/libs/static-resource-cache.js';
        const browser = await chromium.launch();
        try {
            for (let index = 0; index < 2; index++) {
                const context = await browser.newContext({ serviceWorkers: 'block' });
                try {
                    const page = await context.newPage();
                    await installEdsThrottleOnPage(page);
                    await page.goto(process.argv[1]);
                    await page.waitForFunction(() => window.loaded === 119 && window.sequence);
                    const style = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--run-har-test'));
                    if (style.trim() !== '42') throw new Error('Stylesheet was not replayed');
                } finally { await context.close(); }
            }
            console.log(JSON.stringify(getResourceMetrics()));
        } finally { await browser.close(); }
    `;
    const runWorker = () =>
        new Promise((done, reject) => {
            const child = spawn(process.execPath, ['--input-type=module', '-e', worker, baseURL], {
                cwd: process.cwd(),
                env: { ...process.env, NALA_EDS_THROTTLE_DISABLED: '1' },
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => {
                stdout += data;
            });
            child.stderr.on('data', (data) => {
                stderr += data;
            });
            child.on('error', reject);
            child.on('exit', (code) =>
                code === 0 ? done(JSON.parse(stdout.trim())) : reject(new Error(stderr || `Worker exited ${code}`)),
            );
        });
    const results = await Promise.all([runWorker(), runWorker(), runWorker()]);
    expect(results).toEqual(Array(3).fill({ cacheHits: 240, upstreamRequests: 0 }));
    expect(counts).toEqual({ scripts: 119, documents: 7, content: 7, misses: 0 });
    expect(styleRequests).toBe(1);
});

test('HAR misses, different URLs, and cookie-bearing requests stay live', async ({ browser }) => {
    const before = { ...counts };
    const publicContext = await browser.newContext();
    try {
        const page = await publicContext.newPage();
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        await ready(page);
        expect(counts.scripts).toBe(before.scripts);
        await page.addScriptTag({ url: `${baseURL}/asset0.js?version=current` });
        expect(counts.scripts - before.scripts).toBe(1);
        await page.addScriptTag({ url: `${baseURL}/missing.js` });
        expect(await page.evaluate(() => window.missingLoaded)).toBe(true);
        expect(counts.misses - before.misses).toBe(1);
    } finally {
        await publicContext.close();
    }
    const context = await browser.newContext();
    try {
        await context.addCookies([{ name: 'session', value: 'test', url: baseURL }]);
        const page = await context.newPage();
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        await ready(page);
        expect(counts.scripts - before.scripts).toBe(120);
        await page.addScriptTag({ url: `${baseURL}/missing.js?version=current` });
        expect(await page.evaluate(() => window.missingLoaded)).toBe(true);
        expect(counts.misses - before.misses).toBe(2);
    } finally {
        await context.close();
    }
});

test('a new invocation cannot replay the previous invocation archive', async ({ browser }) => {
    const previous = directory;
    const cleanupNext = initializeRunStaticHar(`nala-run-har-${randomUUID()}`);
    const next = process.env.NALA_STATIC_HAR_DIR;
    expect(next).not.toBe(previous);
    const before = counts.scripts;
    const context = await browser.newContext();
    try {
        const page = await context.newPage();
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        await ready(page);
        expect(counts.scripts - before).toBe(119);
        expect(existsSync(join(next, 'docs.har'))).toBe(false);
    } finally {
        await context.close();
        cleanupNext();
        rmdirSync(next);
        rmdirSync(resolve(next, '..'));
        process.env.NALA_STATIC_HAR_DIR = directory;
    }
});

test('missing static assets are reported, excluded from HAR, and remain live in tests', async ({ browser }) => {
    await recordRunStaticHar({
        browser,
        name: 'studio',
        urls: [baseURL],
        ready: async (page) => {
            await ready(page);
            await expect(page.addScriptTag({ url: `${baseURL}/not-found.js` })).rejects.toThrow();
        },
    });
    const har = JSON.parse(readFileSync(join(directory, 'studio.har'), 'utf8'));
    expect(har.log.entries.some((entry) => entry.request.url === `${baseURL}/not-found.js`)).toBe(false);
    const context = await browser.newContext();
    try {
        const page = await context.newPage();
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        const response = page.waitForResponse(`${baseURL}/not-found.js`);
        await expect(page.addScriptTag({ url: `${baseURL}/not-found.js` })).rejects.toThrow();
        expect((await response).status()).toBe(404);
        await page.unrouteAll({ behavior: 'wait' });
    } finally {
        await context.close();
        unlinkSync(join(directory, 'studio.har'));
    }
});

test('a transient static seed 429 is retried and only success is recorded', async ({ browser }) => {
    await recordRunStaticHar({
        browser,
        name: 'studio',
        urls: [baseURL],
        ready: async (page) => {
            await ready(page);
            await page.addScriptTag({ url: `${baseURL}/retry.js` });
            expect(await page.evaluate(() => window.retryLoaded)).toBe(true);
        },
    });
    expect(retryRequests).toBe(2);
    const har = JSON.parse(readFileSync(join(directory, 'studio.har'), 'utf8'));
    expect(har.log.entries.filter(({ request }) => request.url === `${baseURL}/retry.js`)).toHaveLength(1);
    expect(har.log.entries.every(({ response }) => response.status === 200)).toBe(true);
    unlinkSync(join(directory, 'studio.har'));
});

test('persistent rate-limited static seed responses fail setup and remove the raw archive', async ({ browser }) => {
    await expect(
        recordRunStaticHar({
            browser,
            name: 'studio',
            urls: [baseURL],
            ready: async (page) => {
                await ready(page);
                await page.evaluate(async () => {
                    await fetch('/failed.js');
                });
                await expect(page.addScriptTag({ url: `${baseURL}/failed.js` })).rejects.toThrow();
            },
        }),
    ).rejects.toThrow(`Static HAR seed failed: HTTP 429 ${baseURL}/failed.js`);
    expect(existsSync(join(directory, 'studio.har'))).toBe(false);
    expect(existsSync(join(directory, 'studio.recording.har'))).toBe(false);
});

test('multiple seeds finish lazy module graphs before publishing a replayable archive', async ({ browser }) => {
    const cleanupNext = initializeRunStaticHar(`nala-run-har-${randomUUID()}`);
    const next = process.env.NALA_STATIC_HAR_DIR;
    try {
        await recordRunStaticHar({
            browser,
            name: 'studio',
            urls: [`${baseURL}/late-seed-first`, `${baseURL}/late-seed-second`],
            ready: (page) => page.waitForFunction(() => window.seedReady),
        });
        const har = JSON.parse(readFileSync(join(next, 'studio.har'), 'utf8'));
        expect(new Set(har.log.entries.map(({ request }) => new URL(request.url).pathname))).toEqual(
            new Set(['/late.js', '/nested.js']),
        );
        expect(har.log.entries.every(({ response }) => response.content.text)).toBe(true);
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            await installEdsThrottleOnPage(page);
            await page.goto(`${baseURL}/late-seed-replay`);
            await page.waitForFunction(() => window.lateLoaded && window.nestedLoaded);
        } finally {
            await context.close();
        }
    } finally {
        cleanupNext();
        rmdirSync(next);
        rmdirSync(resolve(next, '..'));
        process.env.NALA_STATIC_HAR_DIR = directory;
    }
});

test('recording excludes private responses, unsupported Vary, cookies, and authorization', async ({ browser }) => {
    await recordRunStaticHar({
        browser,
        name: 'studio',
        urls: [baseURL],
        ready: async (page) => {
            await ready(page);
            for (const policy of ['private', 'no-store', 'vary', 'cookie']) {
                await page.addScriptTag({ url: `${baseURL}/excluded.js?policy=${policy}` });
            }
            await page.setExtraHTTPHeaders({ authorization: 'synthetic-test-token' });
            await page.addScriptTag({ url: `${baseURL}/excluded.js?policy=authorization` });
        },
    });

    const source = readFileSync(join(directory, 'studio.har'), 'utf8');
    const har = JSON.parse(source);
    expect(
        har.log.entries.filter(({ request }) => request.url.includes('/excluded.js')).map(({ request }) => request.url),
    ).toEqual([]);
    expect(har.log.entries).toHaveLength(120);
    expect(source).not.toContain('excluded.js');
    expect(source).not.toContain('synthetic-test-token');
    expect(har.log.entries.every(({ request, response }) => !request.cookies.length && !response.cookies.length)).toBe(true);
});

test('a URL that returns a cookie-bearing response is excluded even if an earlier response was public', async ({ browser }) => {
    await recordRunStaticHar({
        browser,
        name: 'studio',
        urls: [baseURL],
        ready: async (page) => {
            await ready(page);
            await page.addScriptTag({ url: `${baseURL}/mixed.js` });
            await page.addScriptTag({ url: `${baseURL}/mixed.js` });
        },
    });

    expect(mixedRequests).toBe(2);
    const har = JSON.parse(readFileSync(join(directory, 'studio.har'), 'utf8'));
    expect(har.log.entries).toHaveLength(120);
    expect(har.log.entries.some(({ request }) => request.url === `${baseURL}/mixed.js`)).toBe(false);
});

test('Studio HAR installs readiness before the first loaded event and closes each seed before the next', async ({
    browser,
}) => {
    const pages = [];
    await recordRunStaticHar({
        browser,
        name: 'studio',
        urls: [`${baseURL}/editor-seed#fragmentId=seed`, `${baseURL}/editor-seed?ost=new#fragmentId=seed`],
        prepare: async (page) => {
            expect(page.context().pages()).toEqual([page]);
            expect(pages.every((previous) => previous.isClosed())).toBe(true);
            pages.push(page);
            await trackEditorReads(page);
        },
        ready: (page) => waitForEditorReady(page, 'seed'),
    });
    expect(pages).toHaveLength(2);
    expect(pages.every((page) => page.isClosed())).toBe(true);
    const har = JSON.parse(readFileSync(join(directory, 'studio.har'), 'utf8'));
    expect(new Set(har.log.entries.map(({ request }) => request.url))).toEqual(new Set([`${baseURL}/asset0.js`]));
});

test('missing readiness instrumentation fails explicitly instead of waiting for an impossible event', async ({ page }) => {
    await page.goto(`${baseURL}/editor-seed#fragmentId=seed`);
    await expect(waitForEditorReady(page, 'seed')).rejects.toThrow(
        'Editor readiness tracking must be installed before navigating to Studio',
    );
});
