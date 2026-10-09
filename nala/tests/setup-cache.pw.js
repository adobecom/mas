import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { EditorBootstrapCache, waitForEditorReady } from '../libs/editor-bootstrap.js';
import { installEdsThrottleOnPage, removePageRoutes, getPageRouteMetrics } from '../libs/eds-throttle.js';
import initializeRateLimitCoordinator, { coordinateRateLimit } from '../libs/rate-limit-coordinator.js';
import { getResourceMetrics } from '../libs/static-resource-cache.js';
import { createWorkerPageSetup } from '../utils/commerce.js';
import {
    beginFragmentCreation,
    completeFragmentCreation,
    initializeFragmentLedger,
    readFragmentLedger,
    trackFragmentResponses,
} from '../utils/fragment-ledger.js';
import { createRunId, clearRunId } from '../utils/fragment-tracker.js';
import { unlinkSync, readdirSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { test as studioTest } from '../libs/mas-test.js';
import { test as docsTest } from '../libs/docs-test.js';
import StudioPage from '../studio/studio.page.js';
import VersionPage from '../studio/versions/versions.page.js';
import { CloneSourceCache } from '../libs/clone-source-cache.js';

const AUTHOR = 'http://author-test.adobeaemcloud.com';
let server;
let baseURL;
let documentLoads;
let slowAssetStarted;
const slowRequestsFinished = new Set();

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
    repository.operation = { get: () => null, subscribe: () => {} };
    repository.fragmentInEdit = fragment;
    const editor = document.querySelector('mas-fragment-editor');
    const loaded = () => editor.dispatchEvent(new CustomEvent('fragment-loaded', { bubbles: true, composed: true }));
    let deferred = false;
    editor.fragmentStore = { get: () => fragment };
    editor.previewResolved = true;
    const card = document.createElement('merch-card');
    card.innerHTML = '<aem-fragment fragment="' + id + '">Seed</aem-fragment>';
    card.checkReady = async () => {};
    card.failed = !!fragment.failed;
    if (new URLSearchParams(location.search).has('blank')) {
        editor.previewResolved = false;
        card.style.display = 'none';
    }
    document.body.append(card);
    editor.initState = 'ready';
    if (new URLSearchParams(location.search).has('refresh')) {
        deferred = true;
        editor.fragmentStore.loading = true;
        setTimeout(() => {
            fragment.title = 'Refreshed seed';
            editor.fragmentStore.loading = false;
            loaded();
        }, 200);
    }
    if (new URLSearchParams(location.search).has('overlap')) {
        deferred = true;
        editor.fragmentStore.loading = true;
        fetch('${AUTHOR}/adobe/sites/cf/fragments/' + id + '?refresh=fast').then(() => {
            fragment.title = 'First refresh';
            editor.fragmentStore.loading = false;
        });
        fetch('${AUTHOR}/adobe/sites/cf/fragments/' + id + '?refresh=slow').then(() => {
            fragment.title = 'Last refresh';
            editor.fragmentStore.loading = false;
            loaded();
        });
    }
    for (const dependency of ['search', 'referencedBy']) {
        if (!new URLSearchParams(location.search).has(dependency + '-refresh')) continue;
        deferred = true;
        editor.fragmentStore.loading = true;
        fetch('${AUTHOR}/adobe/sites/cf/fragments/' + id + '?refresh=fast').then(() => {
            fragment.title = 'First refresh';
            editor.fragmentStore.loading = false;
        });
        fetch('${AUTHOR}/adobe/sites/cf/fragments/' + dependency + '?refresh=slow', {
            method: 'POST',
            body: JSON.stringify({ id, locale })
        }).then(() => {
            fragment.title = 'Last dependency refresh';
            editor.fragmentStore.loading = false;
            loaded();
        });
    }
    if (new URLSearchParams(location.search).has('deferred-loaded')) {
        deferred = true;
        setTimeout(() => {
            fragment.title = 'Editor initialization finished';
            loaded();
        }, 200);
    }
    if (!deferred) loaded();
}
start();
</script>`;

test.beforeAll(async () => {
    documentLoads = [];
    slowRequestsFinished.clear();
    server = createServer((request, response) => {
        documentLoads.push(request.url);
        if (request.url === '/headers-write' && request.method === 'PUT') {
            response.writeHead(200, { 'access-control-allow-origin': '*', 'content-type': 'application/json' });
            response.flushHeaders();
            setTimeout(() => {
                response.end('{}');
                slowRequestsFinished.add(request.url);
            }, 200);
            return;
        }
        if (request.url.startsWith('/slow-asset') || request.url.startsWith('/slow-read')) {
            slowAssetStarted();
            setTimeout(
                () => {
                    const read = request.url.startsWith('/slow-read');
                    response.writeHead(200, { 'content-type': read ? 'application/json' : 'image/svg+xml' });
                    response.end(read ? '{}' : '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
                    slowRequestsFinished.add(request.url);
                },
                request.url.includes('-second') ? 600 : 200,
            );
            return;
        }
        const asset = request.url.startsWith('/asset');
        response.writeHead(200, { 'content-type': asset ? 'application/javascript' : 'text/html' });
        response.end(
            asset
                ? 'globalThis.assetLoaded = true;'
                : request.url.startsWith('/editor')
                  ? editorHTML
                  : request.url.startsWith('/search-controls')
                    ? `<div id="actions"><sp-search><input type="search"></sp-search></div>${
                          request.url.includes('?frame') ? '<iframe src="/search-controls"></iframe>' : ''
                      }`
                    : `<h1>${request.url}</h1>`,
        );
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}`;
});

test('native UUID search input sets foreground mode, and clearing it restores background mode', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(`${baseURL}/search-controls?frame`);
    const childInput = page.frameLocator('iframe').locator('input');
    await childInput.fill('48a759ce-3c9a-4158-9bc3-b21ffa07e8e4');
    expect(await childInput.inputValue()).toBe('48a759ce-3c9a-4158-9bc3-b21ffa07e8e4');
    expect(getPageRouteMetrics(page).foregroundSearchActive).toBe(false);
    const input = page.locator('#actions input');
    await input.fill('48a759ce-3c9a-4158-9bc3-b21ffa07e8e4');
    await expect.poll(() => getPageRouteMetrics(page).foregroundSearchActive).toBe(true);
    await input.fill('Plans');
    await expect.poll(() => getPageRouteMetrics(page).foregroundSearchActive).toBe(false);
    await input.fill('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(getPageRouteMetrics(page).foregroundSearchActive).toBe(false);
    await input.fill('48a759ce-3c9a-4158-9bc3-b21ffa07e8e4');
    await expect.poll(() => getPageRouteMetrics(page).foregroundSearchActive).toBe(true);
    await page.goto(baseURL);
    expect(getPageRouteMetrics(page).foregroundSearchActive).toBe(false);
    await removePageRoutes(page);
});

test('clone-source tag writes finish their response before navigation without becoming false mutation failures', async ({
    page,
}) => {
    const runId = createRunId();
    initializeFragmentLedger();
    const ledgerDirectory = resolve('nala', '.runs', runId);
    try {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        await page.route(`${AUTHOR}/**`, async (route) => {
            const method = route.request().method();
            if (method === 'OPTIONS') {
                await route.fulfill({
                    headers: {
                        'access-control-allow-origin': '*',
                        'access-control-allow-methods': 'PUT',
                        'access-control-allow-headers': 'Content-Type, If-Match',
                    },
                });
            } else if (method === 'GET') {
                await route.fulfill({
                    headers: {
                        etag: '"live-tag-etag"',
                        'access-control-allow-origin': '*',
                        'access-control-expose-headers': 'etag',
                    },
                    json: { tags: [] },
                });
            } else {
                await route.continue({ url: `${baseURL}/headers-write` });
            }
        });
        await page.evaluate((author) => {
            const repo = document.createElement('mas-repository');
            repo.fragmentInEdit = { title: 'Golden source' };
            repo.aem = {
                baseUrl: author,
                cfFragmentsUrl: `${author}/adobe/sites/cf/fragments`,
                headers: {},
                sites: {
                    cf: {
                        fragments: {
                            getById: async () => ({
                                path: '/content/dam/mas/nala/en_US/seed',
                                description: 'Seed',
                                model: { id: 'model' },
                                fields: [],
                                tags: [{ id: 'mas:test' }],
                            }),
                            create: async ({ title, name, parentPath }) => ({
                                id: 'owned',
                                title,
                                path: `${parentPath}/${name}`,
                            }),
                        },
                    },
                },
            };
            document.body.append(repo);
        }, AUTHOR);
        const cache = new CloneSourceCache(0);
        expect(await cache.get(page, 'seed')).toBe('owned');
        expect(slowRequestsFinished.has('/headers-write')).toBe(true);
        expect(documentLoads.filter((url) => url === '/headers-write')).toHaveLength(1);
        await page.goto(`${baseURL}/after-source`);
        await removePageRoutes(page);
        expect(page.isClosed()).toBe(true);
    } finally {
        if (!page.isClosed()) await removePageRoutes(page);
        for (const file of readdirSync(ledgerDirectory)) unlinkSync(join(ledgerDirectory, file));
        rmdirSync(ledgerDirectory);
        clearRunId();
    }
});

test('native repository operation notifications prioritize mutation dependencies only until the operation completes', async ({
    page,
}) => {
    await installEdsThrottleOnPage(page);
    await page.route('**/reactive-store.js', (route) =>
        route.fulfill({ path: resolve('studio/src/reactivity/reactive-store.js'), contentType: 'application/javascript' }),
    );
    await page.goto(baseURL);
    await page.evaluate(async () => {
        const { ReactiveStore } = await import('/reactive-store.js');
        const repository = document.createElement('mas-repository');
        repository.operation = new ReactiveStore(null);
        document.body.append(repository);
        for (const [id, value] of [
            ['start', 'create'],
            ['finish', null],
        ]) {
            const button = document.createElement('button');
            button.id = id;
            button.textContent = id;
            button.addEventListener('click', () => repository.operation.set(value));
            document.body.append(button);
        }
    });
    await page.locator('#start').click();
    await expect.poll(() => getPageRouteMetrics(page).foregroundMutationActive).toBe(true);
    await page.locator('#finish').click();
    await expect.poll(() => getPageRouteMetrics(page).foregroundMutationActive).toBe(false);
    await removePageRoutes(page);
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
        if (new URL(request.url()).searchParams.get('refresh') === 'slow') {
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
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

for (const cached of [false, true]) {
    test(`same-document editor navigation loads the new fragment with bootstrap caching ${cached}`, async ({ browser }) => {
        const cache = new EditorBootstrapCache();
        const calls = [];
        const { page, context } = await seedPage(browser, cache, calls);
        const studio = new StudioPage(page);
        const open = (url) => (cached ? cache.open(page, url) : studio.openPage(url));
        try {
            await open(`${baseURL}/editor#page=fragment-editor&fragmentId=source-a`);
            await open(`${baseURL}/editor#page=fragment-editor&fragmentId=source-b`);
            expect(await page.locator('mas-fragment-editor').evaluate((editor) => editor.fragmentStore.get().id)).toBe(
                'source-b',
            );
            expect(calls).toHaveLength(6);
        } finally {
            await context.close();
        }
    });
}

test('locale-only navigation preserves the loaded source and an event arriving before hashchange remains valid', async ({
    browser,
}) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const { page, context } = await seedPage(browser, cache, calls);
    try {
        await cache.open(page, `${baseURL}/editor#page=fragment-editor&fragmentId=source-a`);
        await page.goto(`${baseURL}/editor#page=fragment-editor&fragmentId=source-a&locale=tr_TR`);
        await waitForEditorReady(page, 'source-a');
        expect(calls).toHaveLength(3);
        await page.evaluate(() => {
            const editor = document.querySelector('mas-fragment-editor');
            editor.fragmentStore.get().id = 'source-b';
            document.querySelector('aem-fragment').setAttribute('fragment', 'source-b');
            location.hash = 'page=fragment-editor&fragmentId=source-b';
            editor.dispatchEvent(new CustomEvent('fragment-loaded', { bubbles: true, composed: true }));
        });
        await waitForEditorReady(page, 'source-b');
        expect(await page.evaluate(() => window.__nalaLoadedEditor)).toBe('source-b');
    } finally {
        await context.close();
    }
});

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

test('save setup reuses only the source snapshot; each fresh context clones and saves live', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const clones = [];
    for (let index = 0; index < 2; index++) {
        const { page, context } = await seedPage(browser, cache, calls);
        try {
            await page.route(`${AUTHOR}/bin/wcmcommand`, async (route) => {
                clones.push(route.request().postData());
                await route.fulfill({
                    status: 200,
                    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
                    body: JSON.stringify({ id: `clone-${clones.length}` }),
                });
            });
            await cache.open(page, `${baseURL}/editor#page=fragment-editor&fragmentId=seed-a`);
            expect(await page.locator('mas-fragment-editor').evaluate((editor) => editor.fragmentStore.get().title)).toBe(
                'Original seed',
            );
            const cloned = await page.evaluate(async (author) => {
                const clone = await fetch(`${author}/bin/wcmcommand`, { method: 'POST', body: 'clone seed-a' });
                const { id } = await clone.json();
                await fetch(`${author}/adobe/sites/cf/fragments/${id}`);
                await fetch(`${author}/adobe/sites/cf/fragments/${id}`, { method: 'PUT', body: 'save clone' });
                return id;
            }, AUTHOR);
            expect(cloned).toBe(`clone-${index + 1}`);
            await page.locator('mas-fragment-editor').evaluate((editor) => {
                editor.fragmentStore.get().title = 'Dirty clone state';
            });
        } finally {
            await context.close();
        }
    }
    expect(clones).toEqual(['clone seed-a', 'clone seed-a']);
    expect(cache.metrics).toEqual({ coldLoads: 1, reusedLoads: 1, replayedReads: 3 });
    expect(calls.filter(({ url }) => /\/clone-[12]$/.test(url))).toHaveLength(4);
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

test('editor setup waits for background fragment refresh before allowing edits', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const calls = [];
    const url = `${baseURL}/editor?refresh#fragmentId=seed-a`;
    const { page, context } = await seedPage(browser, cache, calls);
    try {
        await cache.open(page, url);
        expect(
            await page.locator('mas-fragment-editor').evaluate((editor) => ({
                loading: editor.fragmentStore.loading,
                title: editor.fragmentStore.get().title,
            })),
        ).toEqual({ loading: false, title: 'Refreshed seed' });
    } finally {
        await context.close();
    }
});

test('new fragment initialization does not require a preview before its template is selected', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const { page, context } = await seedPage(browser, cache, []);
    try {
        await page.goto(`${baseURL}/editor?refresh&blank#fragmentId=seed-a`);
        await waitForEditorReady(page, 'seed-a', { preview: false });
        expect(
            await page.locator('mas-fragment-editor').evaluate((editor) => ({
                loading: editor.fragmentStore.loading,
                title: editor.fragmentStore.get().title,
                previewResolved: editor.previewResolved,
            })),
        ).toEqual({ loading: false, title: 'Refreshed seed', previewResolved: false });
        await expect(page.locator('merch-card')).toBeHidden();
    } finally {
        await context.close();
    }
});

test('editor setup waits for every overlapping source refresh, not the first cleared loading flag', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const { page, context } = await seedPage(browser, cache, []);
    try {
        await cache.open(page, `${baseURL}/editor?overlap#fragmentId=seed-a`);
        expect(await page.locator('mas-fragment-editor').evaluate((editor) => editor.fragmentStore.get().title)).toBe(
            'Last refresh',
        );
    } finally {
        await context.close();
    }
});

for (const dependency of ['search', 'referencedBy']) {
    test(`editor setup waits for ${dependency} hydration after the fragment GET and loading flag settle`, async ({
        browser,
    }) => {
        const cache = new EditorBootstrapCache();
        const calls = [];
        const { page, context } = await seedPage(browser, cache, calls);
        try {
            await cache.open(page, `${baseURL}/editor?${dependency}-refresh#fragmentId=seed-a`);
            expect(await page.locator('mas-fragment-editor').evaluate((editor) => editor.fragmentStore.get().title)).toBe(
                'Last dependency refresh',
            );
            expect(calls.some(({ method, url }) => method === 'POST' && url.endsWith(`/${dependency}?refresh=slow`))).toBe(
                true,
            );
        } finally {
            await context.close();
        }
    });
}

test('editor setup waits for its public loaded event across quiet asynchronous initialization gaps', async ({ browser }) => {
    const cache = new EditorBootstrapCache();
    const { page, context } = await seedPage(browser, cache, []);
    try {
        await cache.open(page, `${baseURL}/editor?deferred-loaded#fragmentId=seed-a`);
        expect(await page.locator('mas-fragment-editor').evaluate((editor) => editor.fragmentStore.get().title)).toBe(
            'Editor initialization finished',
        );
    } finally {
        await context.close();
    }
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

test('creation rejects a failed live POST without retrying or waiting for a success toast', async ({ page }) => {
    const runId = createRunId();
    initializeFragmentLedger();
    const directory = resolve('nala/.runs', runId);
    try {
        await page.goto(baseURL);
        await page.setContent(`
            <button id="create">Create</button><div role="menuitem">Merch Card</div>
            <mas-create-dialog>
                <sp-textfield id="fragment-title"><input></sp-textfield>
                <osi-field id="osi"><button id="offerSelectorToolButtonOSI">Offer</button></osi-field>
                <sp-button>Create</sp-button>
            </mas-create-dialog>
            <div id="offers" hidden><input id="offer-search"><button id="next">Next</button><button id="use">Use</button></div>
        `);
        await page.evaluate(() => {
            document.querySelector('#offerSelectorToolButtonOSI').onclick = () => {
                document.querySelector('#offers').hidden = false;
            };
            document.querySelector('#use').onclick = () => {
                document.querySelector('#offers').hidden = true;
            };
            document.querySelector('sp-button').onclick = () => fetch('/adobe/sites/cf/fragments', { method: 'POST' });
        });
        let writes = 0;
        await page.route('**/adobe/sites/cf/fragments', (route) => {
            writes++;
            return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"create failed"}' });
        });
        const studio = new StudioPage(page);
        studio.createButton = page.locator('#create');
        studio.ost = {
            searchField: page.locator('#offer-search'),
            nextButton: page.locator('#next'),
            priceUse: page.locator('#use'),
            popup: page.locator('#offers'),
        };
        await expect(studio.createFragment({ osi: 'test-offer', variant: 'plans' })).rejects.toThrow(
            'Fragment creation must succeed (HTTP 500)',
        );
        expect(writes).toBe(1);
        expect(readFragmentLedger()).toMatchObject({ fragments: [], recover: true });
    } finally {
        for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
        rmdirSync(directory);
        clearRunId();
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
    fixtureTest(`${name} fixture closes its page with pending static reads`, async ({ page }, testInfo) => {
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
    for (const kind of ['asset', 'read']) {
        fixtureTest(`${name} fixture cancels pending ${kind} handlers during owned teardown`, async ({ page }, testInfo) => {
            globalThis.requestCounter.counterFile = testInfo.outputPath('request-count.json');
            let requestsStarted = 0;
            const started = new Promise((resolve) => {
                slowAssetStarted = () => {
                    if (++requestsStarted === 2) resolve();
                };
            });
            await page.goto(baseURL);
            await page.evaluate(
                ({ baseURL, name, kind }) => {
                    for (const suffix of ['first', 'second']) {
                        const url = `${baseURL}/slow-${kind}-${name}-${suffix}${kind === 'asset' ? '.svg' : ''}`;
                        if (kind === 'asset') {
                            const image = new Image();
                            image.src = url;
                            document.body.append(image);
                        } else {
                            fetch(url).then((response) => response.json());
                        }
                    }
                },
                { baseURL, name, kind },
            );
            await started;
        });
    }
}

for (const [method, path] of [
    ['GET', '/adobe/sites/cf/models/queued'],
    ['POST', '/adobe/sites/cf/fragments/search'],
    ['POST', '/adobe/sites/cf/fragments/referencedBy'],
]) {
    test(`closing a page cancels its queued author ${method} ${path} read without closing another page in the same context`, async ({
        browser,
    }) => {
        const origin = 'https://odinpreview.corp.adobe.com';
        const previousCoordinator = process.env.NALA_RATE_LIMIT_COORDINATOR;
        const stop = await initializeRateLimitCoordinator(undefined, { maxRps: 10, maxInFlight: 3 });
        const held = [];
        const context = await browser.newContext();
        try {
            for (let index = 0; index < 3; index++) {
                held.push(await coordinateRateLimit('acquire', origin, undefined, { path: `/held-${index}` }));
            }
            await coordinateRateLimit('cooldown', origin, Date.now() + 5000);
            const closing = await context.newPage();
            const live = await context.newPage();
            await installEdsThrottleOnPage(closing);
            await installEdsThrottleOnPage(live);
            await closing.goto(baseURL);
            await live.goto(baseURL);
            await closing.evaluate(
                ({ author, method, path }) => {
                    fetch(`${author}${path}`, { method }).catch(() => {});
                },
                { author: AUTHOR, method, path },
            );
            await expect.poll(() => getPageRouteMetrics(closing).pendingRoutes).toBe(1);
            await removePageRoutes(closing);
            await expect.poll(() => getPageRouteMetrics(closing).cancelledReads).toBe(1);
            expect(closing.isClosed()).toBe(true);
            expect(getPageRouteMetrics(closing).teardownMs).toBeLessThan(1000);
            expect(live.isClosed()).toBe(false);
            await live.goto(`${baseURL}/still-live`);
            await expect(live.locator('h1')).toHaveText('/still-live');
        } finally {
            for (const permit of held) {
                await coordinateRateLimit('release', origin, undefined, {
                    id: permit.id,
                    status: 200,
                    latencyMs: 1,
                });
            }
            await context.close();
            await stop();
            if (previousCoordinator === undefined) delete process.env.NALA_RATE_LIMIT_COORDINATOR;
            else process.env.NALA_RATE_LIMIT_COORDINATOR = previousCoordinator;
        }
    });
}

for (const [method, path] of [
    ['GET', '/adobe/sites/cf/fragments/search'],
    ['POST', '/adobe/sites/cf/fragments/referencedBy'],
]) {
    test(`application cancellation releases a queued ${method} ${path} before page teardown`, async ({ page }) => {
        const previousCoordinator = process.env.NALA_RATE_LIMIT_COORDINATOR;
        const stop = await initializeRateLimitCoordinator(undefined, { maxRps: 10, maxInFlight: 3 });
        try {
            await installEdsThrottleOnPage(page);
            await page.goto(baseURL);
            await coordinateRateLimit('cooldown', AUTHOR, Date.now() + 5000);
            await page.evaluate(
                ({ author, method, path }) => {
                    window.pendingRead = new AbortController();
                    fetch(`${author}${path}`, { method, signal: window.pendingRead.signal }).catch(() => {});
                },
                { author: AUTHOR, method, path },
            );
            await expect.poll(() => getPageRouteMetrics(page).pendingRoutes).toBe(1);
            await page.evaluate(() => window.pendingRead.abort());
            await expect.poll(() => getPageRouteMetrics(page).applicationCancelledReads, { timeout: 1000 }).toBe(1);
            await expect.poll(() => getPageRouteMetrics(page).pendingRoutes, { timeout: 1000 }).toBe(0);
            expect(page.isClosed()).toBe(false);
            await page.goto(`${baseURL}/after-cancel`);
            await expect(page.locator('h1')).toHaveText('/after-cancel');
            await removePageRoutes(page);
        } finally {
            await stop();
            if (previousCoordinator === undefined) delete process.env.NALA_RATE_LIMIT_COORDINATOR;
            else process.env.NALA_RATE_LIMIT_COORDINATOR = previousCoordinator;
        }
    });
}

test('an aborted native referencedBy POST is not reported as a failed write', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(baseURL);
    await page.route(`${AUTHOR}/adobe/sites/cf/fragments/referencedBy`, (route) => route.abort('aborted'));
    const failure = page.waitForEvent('requestfailed', (request) => request.url().endsWith('/referencedBy'));
    await page.evaluate((author) => {
        fetch(`${author}/adobe/sites/cf/fragments/referencedBy`, { method: 'POST' }).catch(() => {});
    }, AUTHOR);
    await failure;
    await removePageRoutes(page);
    expect(page.isClosed()).toBe(true);
});

test('cancelling an in-flight static load cannot poison another page load or its completed cache entry', async ({
    browser,
}) => {
    const context = await browser.newContext();
    const pages = [await context.newPage(), await context.newPage()];
    let upstream = 0;
    const started = new Promise((resolve) => {
        slowAssetStarted = () => {
            if (++upstream === 2) resolve();
        };
    });
    const path = '/slow-asset-isolated-second.svg';
    try {
        for (const page of pages) {
            await installEdsThrottleOnPage(page);
            await page.goto(baseURL);
            await page.evaluate((url) => {
                window.imageLoaded = false;
                const image = new Image();
                image.onload = () => {
                    window.imageLoaded = true;
                };
                image.src = url;
                document.body.append(image);
            }, `${baseURL}${path}`);
        }
        await started;
        await removePageRoutes(pages[0]);
        expect(slowRequestsFinished.has(path)).toBe(false);
        await pages[1].waitForFunction(() => window.imageLoaded);
        await expect.poll(() => getPageRouteMetrics(pages[0]).cancelledReads).toBe(1);
        const cached = await context.newPage();
        await installEdsThrottleOnPage(cached);
        await cached.goto(baseURL);
        await cached.evaluate((url) => {
            const image = new Image();
            window.imageLoaded = false;
            image.onload = () => {
                window.imageLoaded = true;
            };
            image.src = url;
            document.body.append(image);
        }, `${baseURL}${path}`);
        await cached.waitForFunction(() => window.imageLoaded);
        expect(upstream).toBe(2);
    } finally {
        await context.close();
    }
});

test('owned teardown waits for a native creation mutation and persists its response before closing', async ({ page }) => {
    const previousRunId = process.env.NALA_RUN_ID;
    const runId = createRunId();
    const directory = resolve('nala/.runs', runId);
    initializeFragmentLedger();
    const stopTracking = trackFragmentResponses(page);
    try {
        await installEdsThrottleOnPage(page);
        await page.goto(baseURL);
        let mutationStarted;
        const started = new Promise((resolve) => {
            mutationStarted = resolve;
        });

        await page.route(`${AUTHOR}/adobe/sites/cf/fragments`, async (route) => {
            mutationStarted();
            await new Promise((done) => setTimeout(done, 200));
            await route.fulfill({
                status: 201,
                headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
                body: JSON.stringify({
                    id: 'abcd',
                    path: '/content/dam/mas/nala/en_US/abcd',
                    title: runId,
                }),
            });
        });
        beginFragmentCreation('create');
        await page.evaluate((author) => {
            fetch(`${author}/adobe/sites/cf/fragments`, { method: 'POST', body: '{}' });
        }, AUTHOR);
        await started;
        let persistedBeforeClose = false;
        await removePageRoutes(page, async () => {
            await stopTracking();
            persistedBeforeClose = !page.isClosed() && readFragmentLedger().fragments.some(({ id }) => id === 'abcd');
        });
        expect(persistedBeforeClose).toBe(true);
        expect(page.isClosed()).toBe(true);
    } finally {
        for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
        rmdirSync(directory);
        clearRunId();
        if (previousRunId !== undefined) process.env.NALA_RUN_ID = previousRunId;
    }
});

test('owned teardown surfaces a native mutation transport failure and still completes response tracking', async ({ page }) => {
    await installEdsThrottleOnPage(page);
    await page.goto(baseURL);
    let mutationStarted;
    const started = new Promise((resolve) => {
        mutationStarted = resolve;
    });
    let writes = 0;
    await page.route(`${AUTHOR}/adobe/sites/cf/fragments/abcd`, async (route) => {
        if (route.request().method() === 'OPTIONS') {
            await route.fulfill({
                headers: {
                    'access-control-allow-origin': '*',
                    'access-control-allow-methods': 'PUT',
                },
            });
            return;
        }
        writes++;
        mutationStarted();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.abort('failed');
    });
    await page.evaluate((author) => {
        fetch(`${author}/adobe/sites/cf/fragments/abcd`, { method: 'PUT' }).catch(() => {});
    }, AUTHOR);
    await started;
    let trackingCompleted = false;
    await expect(
        removePageRoutes(page, async () => {
            trackingCompleted = true;
        }),
    ).rejects.toThrow(`PUT ${AUTHOR}/adobe/sites/cf/fragments/abcd: net::ERR_FAILED`);
    expect(trackingCompleted).toBe(true);
    expect(writes).toBe(1);
    expect(page.isClosed()).toBe(true);
});

for (const status of [200, 500]) {
    test(`save waits for the live response and refreshed state without a toast (HTTP ${status})`, async ({ page }) => {
        let writes = 0;
        await page.goto(baseURL);
        await page.setContent(
            '<mas-repository></mas-repository><mas-fragment-editor></mas-fragment-editor>' +
                '<mas-side-nav><mas-side-nav-item label="Save">Save</mas-side-nav-item></mas-side-nav>',
        );
        await page.route('**/adobe/sites/cf/fragments/saved', (route) => {
            writes++;
            return route.fulfill({ status, contentType: 'application/json', body: '{}' });
        });
        await page.evaluate(() => {
            const fragment = { id: 'saved', hasChanges: false };
            const repo = document.querySelector('mas-repository');
            const editor = document.querySelector('mas-fragment-editor');
            let saving = false;
            repo.fragmentInEdit = fragment;
            repo.operation = { get: () => saving };
            editor.fragment = fragment;
            window.dirtyAtSave = [];
            setTimeout(() => {
                fragment.hasChanges = true;
            }, 150);
            document.querySelector('mas-side-nav-item').addEventListener('click', async () => {
                window.dirtyAtSave.push(fragment.hasChanges);
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
        expect(writes).toBe(1);
        expect(await page.evaluate(() => window.dirtyAtSave)).toEqual([true]);
    });
}

for (const status of [200, 500]) {
    test(`delete performs one mutation and verifies its response without a toast (HTTP ${status})`, async ({ page }) => {
        const studio = new StudioPage(page);
        await page.route(`${baseURL}/delete-editor`, (route) =>
            route.fulfill({
                contentType: 'text/html',
                body:
                    '<mas-repository></mas-repository><mas-fragment-editor><div id="fragment-editor">' +
                    '<div id="editor-content">Editor</div></div></mas-fragment-editor>' +
                    '<merch-card><aem-fragment fragment="deleted">Card</aem-fragment></merch-card>' +
                    '<mas-side-nav><mas-side-nav-item label="Delete">Delete</mas-side-nav-item></mas-side-nav>' +
                    '<sp-dialog variant="confirmation" hidden><sp-button>Delete</sp-button></sp-dialog>',
            }),
        );
        await page.goto(`${baseURL}/delete-editor`);
        let writes = 0;
        await page.route('**/fragments/deleted/deleteAndUnpublish', (route) => {
            writes++;
            return route.fulfill({ status, contentType: 'application/json', body: '{}' });
        });
        await page.evaluate(() => {
            const fragment = { id: 'deleted' };
            const repo = document.querySelector('mas-repository');
            const editor = document.querySelector('mas-fragment-editor');
            let deleting = false;
            repo.fragmentInEdit = fragment;
            repo.operation = { get: () => deleting };
            editor.fragmentStore = { get: () => fragment };
            editor.initState = 'ready';
            editor.previewResolved = true;
            editor.dispatchEvent(new CustomEvent('fragment-loaded', { bubbles: true, composed: true }));
            document.querySelector('mas-side-nav-item').addEventListener('click', () => {
                document.querySelector('sp-dialog').hidden = false;
            });
            document.querySelector('sp-button').addEventListener('click', async () => {
                deleting = true;
                await fetch('/adobe/sites/cf/fragments/deleted/deleteAndUnpublish', { method: 'DELETE' });
                deleting = false;
            });
        });
        if (status === 200) await studio.deleteCard('deleted');
        else await expect(studio.deleteCard('deleted')).rejects.toThrow('Fragment deletion must succeed');
        expect(writes).toBe(1);
    });
}

for (const dirtyFirst of [true, false]) {
    test(`discard waits for dirty state, enabled Save and completed navigation (${dirtyFirst ? 'model first' : 'Save first'})`, async ({
        browser,
    }) => {
        const cache = new EditorBootstrapCache();
        const calls = [];
        const clicks = [];
        const { page, context } = await seedPage(browser, cache, calls);
        try {
            const studio = new StudioPage(page);
            await page.exposeFunction('recordDiscard', (state) => clicks.push(state));
            await cache.open(page, `${baseURL}/editor#fragmentId=seed-a`);
            page.setDefaultTimeout(1500);
            await page.evaluate((dirtyFirst) => {
                const fragment = document.querySelector('mas-repository').fragmentInEdit;
                fragment.hasChanges = false;
                document.querySelector('mas-fragment-editor').innerHTML =
                    '<div id="fragment-editor"><div id="editor-content">Editor</div></div>';
                document.body.insertAdjacentHTML(
                    'beforeend',
                    '<div class="nav-breadcrumbs"><sp-breadcrumb-item>Fragments</sp-breadcrumb-item></div>' +
                        '<mas-side-nav><mas-side-nav-item label="Save" disabled>Save</mas-side-nav-item></mas-side-nav>' +
                        '<sp-dialog variant="confirmation" hidden><sp-button>Discard</sp-button></sp-dialog>',
                );
                const save = document.querySelector('mas-side-nav-item[label="Save"]');
                document.querySelector('sp-breadcrumb-item').addEventListener('click', async () => {
                    await window.recordDiscard({ dirty: fragment.hasChanges, saveEnabled: !save.hasAttribute('disabled') });
                    if (fragment.hasChanges) document.querySelector('sp-dialog').hidden = false;
                });
                document.querySelector('sp-button').addEventListener('click', () => {
                    fragment.hasChanges = false;
                    document.querySelector('#editor-content').hidden = true;
                    document.querySelector('sp-dialog').hidden = true;
                    document.querySelector('merch-card').remove();
                    document.querySelector('mas-fragment-editor').initState = 'loading';
                    setTimeout(() => {
                        history.replaceState(null, '', '#page=content');
                        window.addEventListener('hashchange', () => window.start(), { once: true });
                    }, 150);
                });
                setTimeout(
                    () => {
                        fragment.title = 'Unsaved local edit';
                        fragment.hasChanges = true;
                    },
                    dirtyFirst ? 150 : 300,
                );
                setTimeout(() => save.removeAttribute('disabled'), dirtyFirst ? 300 : 150);
            }, dirtyFirst);
            await studio.discardEditorChanges(studio.editor);
            expect(clicks).toEqual([{ dirty: true, saveEnabled: true }]);
            expect(calls).toHaveLength(6);
            expect(await page.locator('mas-repository').evaluate((repo) => repo.fragmentInEdit.title)).toBe('Original seed');
        } finally {
            await context.close();
        }
    });
}

test('RTE clearing waits for the empty model and deletes once without assuming selection boundaries', async ({ page }) => {
    await page.setContent('<rte-field></rte-field>');
    await page.evaluate(() => {
        const field = document.querySelector('rte-field');
        const root = field.attachShadow({ mode: 'open' });
        root.innerHTML = '<div class="ProseMirror" contenteditable="true">Save 20%</div>';
        const editor = root.querySelector('.ProseMirror');
        class Selection {
            static atStart() {
                return { from: 1 };
            }
            static atEnd() {
                return { to: 7 };
            }
        }
        const selection = new Selection();
        selection.from = 1;
        selection.to = 7;
        field.editorView = { state: { selection, doc: { textContent: 'Save 20%' } } };
        window.deletions = 0;
        editor.addEventListener('input', (event) => {
            window.deletions++;
            const value = event.target.textContent;
            setTimeout(() => {
                field.editorView.state.doc.textContent = value;
            }, 200);
        });
    });
    const field = page.locator('rte-field .ProseMirror');
    await new StudioPage(page).editor.clearRteField(field);
    await expect(field).toHaveText('');
    expect(await page.evaluate(() => window.deletions)).toBe(1);
});

test('picker selection recovers a closed initial transition, scopes its option and waits for the selected label', async ({
    page,
}) => {
    await page.setContent(
        '<sp-picker><button id="button">Select color</button><sp-overlay></sp-overlay><sp-menu>' +
            '<span role="option" value="default" tabindex="-1" hidden>Default</span></sp-menu></sp-picker>' +
            '<span role="option">Default</span>',
    );
    await page.evaluate(() => {
        const picker = document.querySelector('sp-picker');
        const button = picker.querySelector('button');
        const overlay = picker.querySelector('sp-overlay');
        const option = picker.querySelector('[role="option"]');
        option.value = 'default';
        picker.optionsMenu = picker.querySelector('sp-menu');
        picker.open = false;
        overlay.state = 'closed';
        window.pickerOpens = 0;
        button.addEventListener('keydown', (event) => {
            event.preventDefault();
            window.pickerKey = event.key;
            window.pickerOpens++;
            const first = window.pickerOpens === 1;
            picker.open = true;
            option.hidden = false;
            overlay.state = 'opening';
            setTimeout(() => {
                if (first) {
                    picker.open = false;
                    option.hidden = true;
                }
                overlay.state = first ? 'closed' : 'opened';
                if (!first) option.focus();
            }, 100);
        });
        option.addEventListener('click', () => {
            picker.open = false;
            picker.value = 'default';
            overlay.state = 'closed';
            option.hidden = true;
            setTimeout(() => {
                button.textContent = 'Default';
                picker.dispatchEvent(new Event('change', { bubbles: true }));
            }, 100);
        });
    });
    await new StudioPage(page).editor.selectPickerOption(page.locator('sp-picker'), 'Default');
    expect(await page.evaluate(() => ({ key: window.pickerKey, opens: window.pickerOpens }))).toEqual({
        key: 'ArrowDown',
        opens: 2,
    });
    await expect(page.locator('sp-picker button')).toHaveText('Default');
});

test('version readiness waits for history, selected data and preview hydration', async ({ page }) => {
    await page.setContent(
        '<version-page><div class="version-item" hidden>Current</div>' +
            '<div class="preview-content"><sp-progress-circle></sp-progress-circle>' +
            '<div class="preview-column" hidden>Preview</div></div></version-page>',
    );
    await page.evaluate(() => {
        const view = document.querySelector('version-page');
        view.loading = true;
        view.loadingVersionData = true;
        setTimeout(() => {
            view.fragment = { id: 'seed' };
            view.loading = false;
            view.querySelector('.version-item').hidden = false;
        }, 100);
        setTimeout(() => {
            view.selectedVersionData = { id: 'selected' };
            view.loadingVersionData = false;
        }, 200);
        setTimeout(() => {
            view.querySelector('sp-progress-circle').remove();
            view.querySelector('.preview-column').hidden = false;
        }, 300);
    });
    const versions = new VersionPage(page);
    await versions.waitForVersionPageLoaded();
    await expect(versions.previewColumns).toBeVisible();
    await expect(versions.loadingSpinner).toHaveCount(0);
});

test('version search waits for filtered DOM rendering before returning', async ({ page }) => {
    await page.setContent(
        '<version-page><sp-search><input></sp-search>' +
            '<div class="version-list-content"><div class="version-item">Alice</div>' +
            '<div class="version-item">Bob</div></div></version-page>',
    );
    await page.evaluate(() => {
        const view = document.querySelector('version-page');
        view.searchQuery = '';
        view.updateComplete = Promise.resolve();
        view.querySelector('input').addEventListener('input', (event) => {
            view.searchQuery = event.target.value.toLowerCase();
            view.updateComplete = new Promise((resolve) => {
                setTimeout(() => {
                    view.querySelector('.version-list-content').innerHTML = ['Alice', 'Bob']
                        .filter((author) => author.toLowerCase().includes(view.searchQuery))
                        .map((author) => `<div class="version-item">${author}</div>`)
                        .join('');
                    resolve();
                }, 150);
            });
        });
    });
    const versions = new VersionPage(page);
    await versions.searchVersions('ALICE');
    await expect(versions.versionItems).toHaveText(['Alice']);
    await versions.clearSearch();
    await expect(versions.versionItems).toHaveText(['Alice', 'Bob']);
});

test('version breadcrumbs wait for completed navigation and click once', async ({ page }) => {
    await page.goto(baseURL);
    await page.setContent(
        '<div class="nav-breadcrumbs"><sp-breadcrumb-item>Fragments</sp-breadcrumb-item>' +
            '<sp-breadcrumb-item>Editor</sp-breadcrumb-item></div>',
    );
    await page.evaluate(() => {
        window.breadcrumbClicks = 0;
        for (const [index, item] of [...document.querySelectorAll('sp-breadcrumb-item')].entries()) {
            item.addEventListener('click', () => {
                window.breadcrumbClicks++;
                setTimeout(() => {
                    location.hash = `page=${index ? 'fragment-editor' : 'content'}`;
                }, 150);
            });
        }
    });
    const versions = new VersionPage(page);
    await versions.clickBreadcrumbEditor();
    expect(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('page')).toBe('fragment-editor');
    await versions.clickBreadcrumbFragmentsTable();
    expect(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('page')).toBe('content');
    expect(await page.evaluate(() => window.breadcrumbClicks)).toBe(2);
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

test('Docs diagnostics do not leak earlier errors or suppress recurring errors across test boundaries', async ({
    browser,
}, testInfo) => {
    globalThis.requestCounter.counterFile = testInfo.outputPath('request-count.json');
    const setup = createWorkerPageSetup({ pages: [{ name: 'US', url: '/docs' }] });
    await setup.setupWorkerPages({ browser, baseURL });
    try {
        for (const message of ['Earlier failure', null, 'Recurring failure']) {
            await setup.beginTest();
            const page = await setup.getPage('US');
            if (message) {
                await Promise.all([
                    page.waitForEvent('console', (event) => event.text() === `MAS Error: ${message}`),
                    page.evaluate((message) => console.error(`MAS Error: ${message}`), message),
                ]);
            }
            const failure = {
                status: 'failed',
                error: { message: 'Synthetic assertion' },
                attach: async () => {},
            };
            await setup.finishTest(failure);
            if (message) expect(failure.error.message).toContain(message);
            else expect(failure.error.message).toBe('Synthetic assertion');
            expect(failure.error.message).not.toContain(
                message === 'Earlier failure' ? 'Recurring failure' : 'Earlier failure',
            );
        }
    } finally {
        await setup.cleanupWorkerPages();
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

for (const kind of ['asset', 'read']) {
    test(`worker Docs pages drain ${kind} handlers at the per-test boundary without removing routes`, async ({
        browser,
    }, testInfo) => {
        globalThis.requestCounter.counterFile = testInfo.outputPath('request-count.json');
        const setup = createWorkerPageSetup({ pages: [{ name: 'US', url: '/docs' }] });
        await setup.setupWorkerPages({ browser, baseURL });
        await setup.beginTest();
        let requestsStarted = 0;
        const started = new Promise((resolve) => {
            slowAssetStarted = () => {
                if (++requestsStarted === 2) resolve();
            };
        });
        try {
            const page = await setup.getPage('US');
            await page.evaluate(
                ({ baseURL, kind }) => {
                    for (const suffix of ['first', 'second']) {
                        const url = `${baseURL}/slow-${kind}-Worker-${suffix}${kind === 'asset' ? '.svg' : ''}`;
                        if (kind === 'asset') {
                            const image = new Image();
                            image.src = url;
                            document.body.append(image);
                        } else {
                            fetch(url).then((response) => response.json());
                        }
                    }
                },
                { baseURL, kind },
            );
            await started;
            await setup.finishTest(testInfo);
            expect(slowRequestsFinished.has(`/slow-${kind}-Worker-second${kind === 'asset' ? '.svg' : ''}`)).toBe(true);
            const before = getResourceMetrics().upstreamRequests;
            await page.addScriptTag({ url: `${baseURL}/asset-worker-boundary-${kind}.js` });
            expect(getResourceMetrics().upstreamRequests).toBe(before + 1);
        } finally {
            await setup.cleanupWorkerPages();
        }
    });
}
