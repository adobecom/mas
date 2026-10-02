import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { EditorBootstrapCache, waitForEditorReady } from '../libs/editor-bootstrap.js';
import { installEdsThrottleOnPage } from '../libs/eds-throttle.js';
import { createWorkerPageSetup } from '../utils/commerce.js';
import {
    beginFragmentCreation,
    completeFragmentCreation,
    initializeFragmentLedger,
    readFragmentLedger,
} from '../utils/fragment-ledger.js';
import { createRunId, clearRunId } from '../utils/fragment-tracker.js';
import { unlinkSync, readdirSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { test as studioTest } from '../libs/mas-test.js';
import { test as docsTest } from '../libs/docs-test.js';
import StudioPage from '../studio/studio.page.js';

const AUTHOR = 'http://author-test.adobeaemcloud.com';
let server;
let baseURL;
let documentLoads;
let slowAssetStarted;

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
        if (request.url.startsWith('/slow-asset')) {
            slowAssetStarted();
            setTimeout(() => {
                response.writeHead(200, { 'content-type': 'image/svg+xml' });
                response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
            }, 200);
            return;
        }
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

test('editor bootstrap does not turn commerce preview failures into setup assertions', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const url = `${baseURL}/editor#fragmentId=seed-a`;
    const failed = await seedPage(browser, cache, calls, true);
    try {
        await cache.open(failed.page, url);
        expect(await failed.page.locator('merch-card').evaluate((card) => card.failed)).toBe(true);
        expect(cache.snapshots.size).toBe(1);
    } finally {
        await failed.context.close();
    }
    const recovered = await seedPage(browser, cache, calls);
    try {
        await cache.open(recovered.page, url);
        expect(calls).toHaveLength(3);
        expect(cache.snapshots.size).toBe(1);
    } finally {
        await recovered.context.close();
    }
});

test('fragment registration waits for navigation and the newly initialized run-owned editor', async ({ page }) => {
    const previousRunId = process.env.NALA_RUN_ID;
    const runId = createRunId();
    const directory = resolve('nala/.runs', runId);
    initializeFragmentLedger();
    try {
        await page.goto(baseURL);
        await page.setContent('<mas-repository></mas-repository>');
        await page.evaluate((runId) => {
            location.hash = 'page=fragment-editor&fragmentId=created';
            const repo = document.querySelector('mas-repository');
            repo.fragmentInEdit = {
                id: 'previous',
                title: runId,
                path: '/content/dam/mas/nala/en_GB/previous',
            };
            setTimeout(() => {
                repo.fragmentInEdit = {
                    id: 'created',
                    title: runId,
                    path: '/content/dam/mas/nala/en_GB/created',
                };
            }, 150);
        }, runId);
        const token = beginFragmentCreation('create');
        expect(await completeFragmentCreation(token, page)).toBe('created');
        expect(readFragmentLedger().fragments.map(({ id }) => id)).toEqual(['created']);
        expect(readFragmentLedger().recover).toBe(false);
    } finally {
        for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
        rmdirSync(directory);
        clearRunId();
        if (previousRunId !== undefined) process.env.NALA_RUN_ID = previousRunId;
    }
});

test('editor readiness does not wait for unresolved live commerce', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const { page, context } = await seedPage(browser, cache, []);
    try {
        await cache.open(page, `${baseURL}/editor#fragmentId=seed-a`);
        await page.locator('merch-card').evaluate((card) => {
            card.checkReady = () => {
                throw new Error('Commerce resolution must be asserted by the test, not editor setup');
            };
        });
        await waitForEditorReady(page, 'seed-a');
    } finally {
        await context.close();
    }
});

for (const [name, fixtureTest] of [
    ['Studio', studioTest],
    ['Docs', docsTest],
]) {
    fixtureTest(`${name} fixture finishes pending static routes before closing the page`, async ({ page }, testInfo) => {
        globalThis.requestCounter.counterFile = testInfo.outputPath('request-count.json');
        const started = new Promise((resolve) => {
            slowAssetStarted = resolve;
        });
        await page.goto(baseURL);
        await page.evaluate((url) => {
            const image = new Image();
            image.src = url;
            document.body.append(image);
        }, `${baseURL}/slow-asset-${name}.svg`);
        await started;
    });
}

for (const status of [200, 500]) {
    test(`save waits for the live response and refreshed state without a toast (HTTP ${status})`, async ({ page }) => {
        await page.goto(baseURL);
        await page.setContent(
            '<mas-repository></mas-repository><mas-fragment-editor></mas-fragment-editor>' +
                '<mas-side-nav><mas-side-nav-item label="Save">Save</mas-side-nav-item></mas-side-nav>',
        );
        await page.route('**/adobe/sites/cf/fragments/saved', (route) =>
            route.fulfill({ status, contentType: 'application/json', body: '{}' }),
        );
        await page.evaluate(() => {
            const fragment = { id: 'saved', hasChanges: true };
            const repo = document.querySelector('mas-repository');
            const editor = document.querySelector('mas-fragment-editor');
            let saving = false;
            repo.fragmentInEdit = fragment;
            repo.operation = { get: () => saving };
            editor.fragment = fragment;
            document.querySelector('mas-side-nav-item').addEventListener('click', async () => {
                saving = true;
                const response = await fetch('/adobe/sites/cf/fragments/saved', { method: 'PUT' });
                if (response.ok) fragment.hasChanges = false;
                saving = false;
            });
        });
        const studio = new StudioPage(page);
        if (status === 200) {
            await studio.saveCard();
            expect(await page.locator('mas-repository').evaluate((repo) => repo.fragmentInEdit.hasChanges)).toBe(false);
        } else {
            await expect(studio.saveCard()).rejects.toThrow('Fragment save must succeed');
        }
    });
}

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
