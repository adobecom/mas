import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { EditorBootstrapCache } from '../libs/editor-bootstrap.js';
import { installEdsThrottleOnPage } from '../libs/eds-throttle.js';
import { createWorkerPageSetup } from '../utils/commerce.js';

const AUTHOR = 'http://author-test.adobeaemcloud.com';
let server;
let baseURL;
let documentLoads;

const editorHTML = `<!doctype html>
<mas-repository></mas-repository><mas-fragment-editor></mas-fragment-editor>
<script>
async function start() {
    const params = new URLSearchParams(location.hash.slice(1));
    const id = params.get('fragmentId');
    const locale = params.get('locale') || 'en_US';
    const responses = await Promise.all([
        fetch('${AUTHOR}/adobe/sites/cf/fragments/' + id + '?locale=' + locale),
        fetch('${AUTHOR}/adobe/sites/cf/fragments/search', { method: 'POST', body: JSON.stringify({ id, locale }) }),
        fetch('${AUTHOR}/adobe/sites/cf/models/model')
    ]);
    const fragment = await responses[0].json();
    const repository = document.querySelector('mas-repository');
    repository.operation = { get: () => null };
    repository.fragmentInEdit = fragment;
    const editor = document.querySelector('mas-fragment-editor');
    editor.fragmentStore = { get: () => fragment };
    editor.previewResolved = true;
    const card = document.createElement('merch-card');
    card.innerHTML = '<aem-fragment fragment="' + id + '">Seed</aem-fragment>';
    card.checkReady = async () => {};
    card.failed = !!fragment.failed;
    document.body.append(card);
    editor.initState = 'ready';
}
start();
</script>`;

test.beforeAll(async () => {
    documentLoads = [];
    server = createServer((request, response) => {
        documentLoads.push(request.url);
        const asset = request.url.startsWith('/asset');
        response.writeHead(200, { 'content-type': asset ? 'application/javascript' : 'text/html' });
        response.end(
            asset
                ? 'globalThis.assetLoaded = true;'
                : request.url.startsWith('/editor')
                  ? editorHTML
                  : `<h1>${request.url}</h1>`,
        );
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

async function seedPage(browser, cache, calls, failed = false) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await installEdsThrottleOnPage(page);
    await page.route(`${AUTHOR}/**`, async (route) => {
        const request = route.request();
        if (request.method() !== 'OPTIONS')
            calls.push({ url: request.url(), method: request.method(), body: request.postData() });
        const id = new URL(request.url()).pathname.split('/').pop();
        await route.fulfill({
            status: 200,
            headers: {
                'content-type': 'application/json',
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
            },
            body: JSON.stringify({ id, title: 'Original seed', failed }),
        });
    });
    await cache.install(page);
    return { page, context };
}

test('repeated seed bootstrap is isolated; all post-setup reads and writes stay live', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const url = `${baseURL}/editor#page=fragment-editor&fragmentId=seed-a`;
    const first = await seedPage(browser, cache, calls);
    await cache.open(first.page, url);
    expect(calls).toHaveLength(3);
    await first.page.evaluate(() => {
        document.querySelector('mas-fragment-editor').fragmentStore.get().title = 'Unsaved local edit';
        localStorage.setItem('local-test-edit', 'changed');
    });
    await first.context.close();

    const second = await seedPage(browser, cache, calls);
    try {
        await cache.open(second.page, url);
        expect(calls).toHaveLength(3);
        expect(cache.metrics).toEqual({ coldLoads: 1, reusedLoads: 1, replayedReads: 3 });
        expect(
            await second.page.evaluate(() => ({
                title: document.querySelector('mas-fragment-editor').fragmentStore.get().title,
                storage: localStorage.getItem('local-test-edit'),
            })),
        ).toEqual({ title: 'Original seed', storage: null });
        await second.page.evaluate(async (author) => {
            await fetch(`${author}/adobe/sites/cf/fragments/seed-a?locale=en_US`);
            await fetch(`${author}/adobe/sites/cf/fragments/search`, {
                method: 'POST',
                body: JSON.stringify({ id: 'seed-a', locale: 'en_US' }),
            });
            await fetch(`${author}/adobe/sites/cf/fragments/seed-a`, { method: 'PUT', body: 'write' });
            await fetch(`${author}/adobe/sites/cf/fragments/seed-a/deleteAndUnpublish`, { method: 'DELETE' });
        }, AUTHOR);
        expect(calls).toHaveLength(7);
        await second.page.reload();
        await expect(second.page.locator('merch-card')).toBeVisible();
        expect(calls).toHaveLength(10);
    } finally {
        await second.context.close();
    }
});

test('static routing reuses public assets but keeps cookie-bearing contexts live', async ({ browser }) => {
    const assetURL = `${baseURL}/asset.js`;
    const loads = () => documentLoads.filter((url) => url === '/asset.js').length;
    for (const cookie of [false, false, true, true]) {
        const context = await browser.newContext();
        try {
            if (cookie) await context.addCookies([{ name: 'session', value: 'offline', url: baseURL }]);
            const page = await context.newPage();
            await installEdsThrottleOnPage(page);
            await page.goto(baseURL);
            await page.evaluate(async (url) => {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.onload = resolve;
                    script.onerror = reject;
                    script.src = url;
                    document.head.append(script);
                });
            }, assetURL);
            expect(await page.evaluate(() => globalThis.assetLoaded)).toBe(true);
        } finally {
            await context.close();
        }
    }
    expect(loads()).toBe(3);
});

test('seed, locale, URL overrides and worker caches have separate cold snapshots', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const urls = [
        `${baseURL}/editor#fragmentId=seed-a`,
        `${baseURL}/editor#fragmentId=seed-b`,
        `${baseURL}/editor#fragmentId=seed-a&locale=fr_FR`,
        `${baseURL}/editor?ost=new#fragmentId=seed-a`,
    ];
    for (const url of urls) {
        const { page, context } = await seedPage(browser, cache, calls);
        try {
            await cache.open(page, url);
        } finally {
            await context.close();
        }
    }
    expect(calls).toHaveLength(12);
    expect(cache.snapshots.size).toBe(4);
    const independentCache = new EditorBootstrapCache();
    const { page, context } = await seedPage(browser, independentCache, calls);
    try {
        await independentCache.open(page, urls[0]);
        expect(calls).toHaveLength(15);
    } finally {
        await context.close();
    }
});

test('failed bootstrap never commits a snapshot', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const url = `${baseURL}/editor#fragmentId=seed-a`;
    const failed = await seedPage(browser, cache, calls, true);
    try {
        await expect(cache.open(failed.page, url)).rejects.toThrow('must resolve');
        expect(cache.snapshots.size).toBe(0);
    } finally {
        await failed.context.close();
    }
    const recovered = await seedPage(browser, cache, calls);
    try {
        await cache.open(recovered.page, url);
        expect(calls).toHaveLength(6);
        expect(cache.snapshots.size).toBe(1);
    } finally {
        await recovered.context.close();
    }
});

test('bootstrap disable flag keeps warm seeds live with the same readiness boundary', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const url = `${baseURL}/editor#fragmentId=seed-a`;
    const first = await seedPage(browser, cache, calls);
    try {
        await cache.open(first.page, url);
    } finally {
        await first.context.close();
    }
    const previous = process.env.NALA_EDITOR_BOOTSTRAP_DISABLED;
    process.env.NALA_EDITOR_BOOTSTRAP_DISABLED = '1';
    const second = await seedPage(browser, cache, calls);
    try {
        await cache.open(second.page, url);
        expect(calls).toHaveLength(6);
        expect(cache.metrics.replayedReads).toBe(0);
    } finally {
        if (previous === undefined) delete process.env.NALA_EDITOR_BOOTSTRAP_DISABLED;
        else process.env.NALA_EDITOR_BOOTSTRAP_DISABLED = previous;
        await second.context.close();
    }
});

test('Docs loads only requested named pages and shares concurrent initialization', async ({ browser }, testInfo) => {
    globalThis.requestCounter.counterFile = testInfo.outputPath('request-count.json');
    const setup = createWorkerPageSetup({
        pages: [
            { name: 'US', url: '/docs?locale=en_US' },
            { name: 'FR', url: '/docs?locale=fr_FR' },
            { name: 'dark', url: '/docs?theme=dark' },
        ],
    });
    const before = documentLoads.length;
    await setup.setupWorkerPages({ browser, baseURL });
    expect(documentLoads.length).toBe(before);
    await setup.beginTest();
    try {
        const [first, again] = await Promise.all([setup.getPage('US'), setup.getPage('US')]);
        expect(first).toBe(again);
        expect(first.context().pages()).toHaveLength(1);
        await expect(first.locator('h1')).toHaveText('/docs?locale=en_US');
        expect(await first.evaluate(() => navigator.userAgent)).toBe('Nala offline regression');
        const french = await setup.getPage('FR');
        expect(french).not.toBe(first);
        await expect(french.locator('h1')).toHaveText('/docs?locale=fr_FR');
        expect(setup.pages.dark).toBeUndefined();
        await expect(setup.getPage('missing')).rejects.toThrow('Unknown worker page');
        await setup.finishTest(testInfo);
    } finally {
        await setup.cleanupWorkerPages();
    }
});
