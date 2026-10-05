import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { EventEmitter } from 'node:events';
import { chromium } from '@playwright/test';
import { isStaticResource, serveStaticResource, getResourceMetrics } from '../libs/static-resource-cache.js';
import { isBootstrapRead } from '../libs/editor-bootstrap.js';
import { installEdsThrottleOnPage, isEdsEdgeHost, resolveEdsMaxRps } from '../libs/eds-throttle.js';
import { isRetryableRead, retryAfterMs } from '../libs/rate-limit.js';
import { createRunId, clearRunId, setCurrentTestName, setCurrentTestAttempt, getTitle } from '../utils/fragment-tracker.js';
import {
    initializeFragmentLedger,
    beginFragmentCreation,
    completeFragmentCreation,
    recordCreatedFragment,
    readFragmentLedger,
    completeFragmentLedger,
    trackFragmentResponses,
} from '../utils/fragment-ledger.js';
import globalTeardown, { deleteOwnedFragments, findRunFragments, printCleanupSummary } from '../utils/global.teardown.js';

test('network Docs suites track each test; benchmark and foreground-timeout suites stay cold', () => {
    const directory = resolve('nala/docs');
    const sources = readdirSync(directory, { recursive: true })
        .filter((name) => name.endsWith('.test.js'))
        .map((name) => ({ name, source: readFileSync(join(directory, name), 'utf8') }));
    assert.ok(sources.length > 0);
    for (const { name, source } of sources) {
        if ([join('benchmark', 'benchmark.test.js'), join('foreground-timeout', 'foreground-timeout.test.js')].includes(name)) {
            assert.doesNotMatch(source, /from ['"][^'"]*\/libs\/docs-test\.js['"]/, `${name} must not use static caching`);
            assert.match(source, /from ['"]@playwright\/test['"]/, `${name} must retain the plain fixture`);
            continue;
        }
        if (!source.includes('createWorkerPageSetup(')) {
            assert.match(source, /from ['"][^'"]*\/libs\/docs-test\.js['"]/, `${name} must use fresh Docs request tracking`);
            continue;
        }
        const beforeEach = source.match(/test\.beforeEach\(([\s\S]*?)\n\s*\}\);/)?.[1] ?? '';
        const afterEach = source.match(/test\.afterEach\(([\s\S]*?)\n\s*\}\);/)?.[1] ?? '';
        assert.match(beforeEach, /await workerSetup\.beginTest\(\)/, `${name} must begin per-test tracking`);
        assert.match(afterEach, /await workerSetup\.finishTest\(testInfo\)/, `${name} must finish per-test tracking`);
    }
});

const request = (url, { method = 'GET', headers = {}, type = 'script', body = null } = {}) => ({
    url: () => url,
    method: () => method,
    headers: () => headers,
    allHeaders: async () => headers,
    resourceType: () => type,
    postData: () => body,
});

function routes(url, { headers = {}, status = 200, fail = false, body = Buffer.from('asset') } = {}) {
    const stats = { fetches: 0, paces: 0, disposed: 0, bodies: [] };
    const route = () => ({
        request: () => request(url),
        fetch: async () => {
            stats.fetches++;
            await new Promise((done) => setImmediate(done));
            if (fail) throw new Error('Upstream failed');
            return {
                headers: () => ({ ...headers }),
                body: async () => body,
                status: () => status,
                dispose: async () => {
                    stats.disposed++;
                },
            };
        },
        fulfill: async (response) => {
            stats.bodies.push(response);
        },
    });
    const pace = async () => {
        stats.paces++;
    };
    return { route, pace, stats };
}

test('static classification excludes documents, APIs, auth, cookies and writes', async () => {
    assert.equal(await isStaticResource(request('https://main--mas--adobecom.aem.live/scripts/app.js')), true);
    for (const candidate of [
        request('https://main--mas--adobecom.aem.live/studio.html', { type: 'document' }),
        request('https://main--mas--adobecom.aem.live/api/data.json'),
        request('https://author-test.adobeaemcloud.com/app.js'),
        request('https://main--mas--adobecom.aem.live/app.js', { method: 'POST' }),
        request('https://main--mas--adobecom.aem.live/app.js', { headers: { authorization: 'Bearer test' } }),
        request('https://main--mas--adobecom.aem.live/app.js', { headers: { cookie: 'session=test' } }),
    ])
        assert.equal(await isStaticResource(candidate), false);
});

test('EDS pacing covers preview and custom MAS hosts and defaults to 45 RPS outside CI', (t) => {
    const previous = {
        CI: process.env.CI,
        NALA_EDS_MAX_RPS: process.env.NALA_EDS_MAX_RPS,
        NALA_EDS_THROTTLE_DISABLED: process.env.NALA_EDS_THROTTLE_DISABLED,
    };
    t.after(() => {
        for (const [name, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
    });
    delete process.env.NALA_EDS_MAX_RPS;
    delete process.env.NALA_EDS_THROTTLE_DISABLED;
    for (const ci of ['', '1', 'true']) {
        process.env.CI = ci;
        assert.equal(resolveEdsMaxRps(), 45);
    }
    for (const host of ['main--mas--adobecom.aem.page', 'mas.adobe.com', 'mas.stage.adobe.com']) {
        assert.equal(isEdsEdgeHost(`https://${host}/app.js`), true);
    }
    assert.equal(isEdsEdgeHost('http://localhost/app.js'), false);
    process.env.NALA_EDS_MAX_RPS = '25';
    assert.equal(resolveEdsMaxRps(), 25);
    process.env.NALA_EDS_THROTTLE_DISABLED = '1';
    assert.equal(resolveEdsMaxRps(), 0);
});

test('static cache deduplicates concurrent misses, paces once, and strips decoded-body headers', async () => {
    const before = getResourceMetrics();
    const { route, pace, stats } = routes('https://localhost/concurrent.js', {
        headers: { 'content-encoding': 'gzip', 'content-length': '20', vary: 'Accept-Encoding' },
    });
    await Promise.all([serveStaticResource(route(), pace), serveStaticResource(route(), pace)]);
    await serveStaticResource(route(), pace);
    assert.equal(stats.fetches, 1);
    assert.equal(stats.paces, 1);
    assert.equal(stats.disposed, 1);
    assert.equal(stats.bodies.length, 3);
    assert.equal(stats.bodies[0].headers['content-encoding'], undefined);
    assert.equal(stats.bodies[0].headers['content-length'], undefined);
    assert.equal(getResourceMetrics().cacheHits - before.cacheHits, 2);
});

test('uncacheable static responses are not shared, even by concurrent contexts', async () => {
    for (const [index, options] of [
        { headers: { 'cache-control': 'no-store' } },
        { headers: { 'cache-control': 'Private' } },
        { headers: { 'set-cookie': 'session=test' } },
        { headers: { vary: '*' } },
        { headers: { vary: 'Cookie' } },
        { status: 429, headers: { 'retry-after': '0' } },
    ].entries()) {
        const { route, pace, stats } = routes(`https://localhost/excluded-${index}.js`, options);
        await Promise.all([serveStaticResource(route(), pace), serveStaticResource(route(), pace)]);
        await serveStaticResource(route(), pace);
        assert.equal(stats.fetches, options.status === 429 ? 6 : 3);
        assert.equal(stats.paces, options.status === 429 ? 6 : 3);
    }
});

test('Retry-After honors seconds and HTTP dates, with a 10s fallback for invalid or missing values', () => {
    const now = Date.parse('2026-10-02T16:00:00Z');
    assert.equal(retryAfterMs('3', now), 3000);
    assert.equal(retryAfterMs('0', now), 0);
    assert.equal(retryAfterMs('Fri, 02 Oct 2026 16:00:04 GMT', now), 4000);
    assert.equal(retryAfterMs('Fri, 02 Oct 2026 15:59:59 GMT', now), 0);
    for (const value of [undefined, '', ' ', '-1', 'invalid']) assert.equal(retryAfterMs(value, now), 10000);
});

test('read retries exclude writes, documents, authentication, streams and ranges', async () => {
    assert.equal(
        await isRetryableRead(
            request('https://odinpreview.corp.adobe.com/adobe/contentFragments/byPath', {
                type: 'fetch',
                headers: { authorization: 'test-only' },
            }),
        ),
        true,
    );
    for (const candidate of [
        request('https://service.example/data', { type: 'fetch', method: 'POST' }),
        request('https://service.example/data', { type: 'document' }),
        request('https://service.example/signin/continue', { type: 'fetch' }),
        request('https://service.example/oauth/authorize', { type: 'xhr' }),
        request('https://service.example/data', { type: 'fetch', headers: { range: 'bytes=0-100' } }),
        request('https://service.example/events', { type: 'fetch', headers: { accept: 'text/event-stream' } }),
    ])
        assert.equal(await isRetryableRead(candidate), false);
});

test('authentication logs native 429s without blocking subsequent sign-in requests', async (t) => {
    t.mock.method(globalThis, 'setTimeout', () => assert.fail('Authentication must not wait for a native cooldown'));
    const warnings = t.mock.method(console, 'warn', () => {});
    const page = new EventEmitter();
    let handleRoute;
    page.route = async (pattern, handler) => {
        handleRoute = handler;
    };
    await installEdsThrottleOnPage(page, { cache: false, replayHar: false, nativeCooldowns: false });
    const limited = request('https://auth.services.adobe.com/signin/v1/audit?token=do-not-log', {
        method: 'POST',
        type: 'fetch',
    });
    page.emit('response', {
        status: () => 429,
        request: () => limited,
        headers: () => ({ 'retry-after': '60' }),
    });
    let continued = 0;
    await handleRoute({
        request: () => request('https://auth.services.adobe.com/signin/v1/continue', { method: 'POST', type: 'fetch' }),
        continue: async () => {
            continued++;
        },
    });
    assert.equal(continued, 1);
    assert.equal(warnings.mock.calls.length, 1);
    const message = warnings.mock.calls[0].arguments[0];
    assert.match(message, /HTTP 429 POST .*signin\/v1\/audit; Retry-After: 60/);
    assert.match(message, /logging only \(no Nala cooldown\)/);
    assert.doesNotMatch(message, /do-not-log/);
});

test('native 429 cooldowns apply to every origin, including IMS and other third-party services', async (t) => {
    let now = Date.now();
    t.mock.method(Date, 'now', () => now);
    const delays = [];
    t.mock.method(globalThis, 'setTimeout', (done, delay) => {
        delays.push(delay);
        now += delay;
        done();
    });
    const warnings = t.mock.method(console, 'warn', () => {});
    const previous = process.env.NALA_EDS_THROTTLE_DISABLED;
    process.env.NALA_EDS_THROTTLE_DISABLED = '1';
    t.after(() => {
        if (previous === undefined) delete process.env.NALA_EDS_THROTTLE_DISABLED;
        else process.env.NALA_EDS_THROTTLE_DISABLED = previous;
    });

    for (const origin of [
        'https://auth.services.adobe.com',
        'https://ims-na1.adobelogin.com',
        'https://commerce.adobe.com',
        'https://external.example',
        'https://rate-limit-test--mas--adobecom.aem.live',
        'https://rate-limit-test--mas--adobecom.aem.page',
        'https://author-rate-limit-test.adobeaemcloud.com',
        'https://milo.adobe.com',
        'https://mas.adobe.com',
        'http://localhost:54321',
        'http://127.0.0.1:54321',
    ]) {
        const page = new EventEmitter();
        let handleRoute;
        page.route = async (pattern, handler) => {
            handleRoute = handler;
        };
        await installEdsThrottleOnPage(page, { cache: false, replayHar: false });
        const limited = request(`${origin}/signin/v1/audit?token=do-not-log`, { method: 'POST', type: 'fetch' });
        page.emit('response', {
            status: () => 429,
            url: () => limited.url(),
            request: () => limited,
            headers: () => ({ 'retry-after': '60' }),
        });

        let continued = 0;
        const before = delays.length;
        for (const [path, method, type] of [
            ['/signin/v1/continue', 'POST', 'fetch'],
            ['/en_US/config', 'GET', 'document'],
        ]) {
            await handleRoute({
                request: () => request(`${origin}${path}`, { method, type }),
                continue: async () => {
                    continued++;
                },
            });
        }
        assert.equal(continued, 2);
        assert.deepEqual(delays.slice(before), [60000, 100], `${origin}: honor Retry-After and stagger recovery`);
        const message = warnings.mock.calls.at(-1).arguments[0];
        assert.match(message, /HTTP 429 POST/);
        assert.match(message, /Retry-After: 60/);
        assert.doesNotMatch(message, /do-not-log/);
        assert.match(message, /cooldown 60s/);
    }
});

test('cookie-setting 429s are neither retried nor cached across contexts', async () => {
    const { route, pace, stats } = routes('https://localhost/cookie-limited.js', {
        status: 429,
        headers: { 'retry-after': '0', 'set-cookie': 'session=test' },
    });
    await serveStaticResource(route(), pace);
    await serveStaticResource(route(), pace);
    assert.equal(stats.fetches, 2);
    assert.equal(stats.paces, 2);
    assert.equal(stats.disposed, 2);
    assert.equal(stats.bodies.length, 2);
    assert.ok(stats.bodies.every(({ status }) => status === 429));
});

test('failed static requests propagate and do not poison the cache', async () => {
    const url = 'https://localhost/recovered.js';
    const failing = routes(url, { fail: true });
    const results = await Promise.allSettled([
        serveStaticResource(failing.route(), failing.pace),
        serveStaticResource(failing.route(), failing.pace),
    ]);
    assert.ok(results.every(({ status }) => status === 'rejected'));
    const recovered = routes(url);
    await serveStaticResource(recovered.route(), recovered.pace);
    assert.equal(recovered.stats.fetches, 1);
});

test('static cache retains at most 256 entries and excludes bodies over 256 KiB', async () => {
    for (let index = 0; index <= 256; index++) {
        const { route, pace } = routes(`https://localhost/bounded-${index}.js`);
        await serveStaticResource(route(), pace);
    }
    const evicted = routes('https://localhost/bounded-0.js');
    await serveStaticResource(evicted.route(), evicted.pace);
    assert.equal(evicted.stats.fetches, 1);
    const retained = routes('https://localhost/bounded-256.js');
    await serveStaticResource(retained.route(), retained.pace);
    assert.equal(retained.stats.fetches, 0);
    const oversized = routes('https://localhost/oversized.js', { body: Buffer.alloc(256 * 1024 + 1) });
    await serveStaticResource(oversized.route(), oversized.pace);
    await serveStaticResource(oversized.route(), oversized.pace);
    assert.equal(oversized.stats.fetches, 2);
});

test('bootstrap classification includes author search reads, never mutations or other services', () => {
    const base = 'https://author-test.adobeaemcloud.com/adobe/sites/cf/fragments';
    assert.equal(isBootstrapRead(request(`${base}/seed`)), true);
    assert.equal(isBootstrapRead(request(`${base}/search`, { method: 'POST', body: '{}' })), true);
    for (const candidate of [
        request(base, { method: 'POST' }),
        request(`${base}/seed`, { method: 'PUT' }),
        request(`${base}/seed/deleteAndUnpublish`, { method: 'DELETE' }),
        request('https://commerce.adobe.com/adobe/sites/cf/fragments/seed'),
    ])
        assert.equal(isBootstrapRead(candidate), false);
});

test('ledger persists pending intents, exact owned IDs, response recovery, and completion tombstones', async (t) => {
    const runId = createRunId();
    const directory = resolve('nala/.runs', runId);
    initializeFragmentLedger();
    t.after(() => {
        for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
        rmdirSync(directory);
        clearRunId();
    });
    assert.deepEqual(readFragmentLedger(), { fragments: [], recover: false });
    setCurrentTestName('Create test');
    setCurrentTestAttempt(2, 1);
    assert.ok(getTitle().endsWith('.w2.r1'));
    const token = beginFragmentCreation('clone');
    assert.equal(readFragmentLedger().recover, true);
    const owned = { id: 'owned', title: getTitle(), path: '/content/dam/mas/nala/en_US/owned' };
    assert.throws(() => recordCreatedFragment({ ...owned, title: 'Other execution' }), /not owned/);
    assert.throws(() => recordCreatedFragment({ ...owned, path: '/content/dam/other/owned' }), /not owned/);
    const page = new EventEmitter();
    const stop = trackFragmentResponses(page);
    page.emit('response', {
        request: () => request('https://author-test.adobeaemcloud.com/adobe/sites/cf/fragments'),
        status: () => 201,
        headers: () => ({ 'content-type': 'application/json' }),
        json: async () => owned,
    });
    await stop();
    assert.equal(readFragmentLedger().fragments[0].id, 'owned');
    assert.equal(readFragmentLedger().recover, true);
    const id = await completeFragmentCreation(token, { waitForFunction: async () => {}, evaluate: async () => owned });
    assert.equal(id, 'owned');
    assert.equal(readFragmentLedger().recover, false);
    completeFragmentLedger();
    assert.deepEqual(readFragmentLedger(), { fragments: [], recover: false });
    assert.deepEqual(readdirSync(directory), ['run.json']);
});

test('exact cleanup uses live ETags, skips 404s, refuses foreign data, and reports partial failures', async (t) => {
    const runId = 'nala-run-offline';
    const deleted = [];
    const entries = ['owned', 'gone', 'foreign', 'wrong-path', 'unavailable', 'last'].map((id) => ({
        id,
        path: `/content/dam/mas/nala/en_US/${id}`,
        title: runId,
    }));
    globalThis.document = {
        querySelector: () => ({
            aem: {
                cfFragmentsUrl: 'https://author-test.adobeaemcloud.com/adobe/sites/cf/fragments',
                headers: { authorization: 'Bearer offline' },
                sites: {
                    cf: {
                        fragments: {
                            delete: async (fragment) => {
                                deleted.push(fragment);
                            },
                        },
                    },
                },
            },
        }),
    };
    t.after(() => {
        delete globalThis.document;
    });
    t.mock.method(globalThis, 'fetch', async (url) => {
        const id = url.split('/').pop();
        return {
            status: id === 'gone' ? 404 : id === 'unavailable' ? 503 : 200,
            ok: !['gone', 'unavailable'].includes(id),
            headers: new Headers({ etag: `live-${id}` }),
            json: async () => ({
                id,
                title: id === 'foreign' ? 'Another run' : runId,
                path: id === 'wrong-path' ? '/content/dam/mas/elsewhere' : entries.find((entry) => entry.id === id).path,
            }),
        };
    });
    const result = await deleteOwnedFragments({ fragments: entries, runId });
    assert.deepEqual(result.deletedIds, ['owned', 'last']);
    assert.deepEqual(result.alreadyDeletedIds, ['gone']);
    assert.deepEqual(
        result.failures.map(({ id }) => id),
        ['foreign', 'wrong-path', 'unavailable'],
    );
    assert.deepEqual(
        deleted.map(({ etag }) => etag),
        ['live-owned', 'live-last'],
    );
});

test('empty run cleanup and repeated cleanup do not start a browser', async (t) => {
    const runId = createRunId();
    const directory = resolve('nala/.runs', runId);
    const skipAuth = process.env.SKIP_AUTH;
    delete process.env.SKIP_AUTH;
    initializeFragmentLedger();
    t.after(() => {
        for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
        rmdirSync(directory);
        if (skipAuth === undefined) delete process.env.SKIP_AUTH;
        else process.env.SKIP_AUTH = skipAuth;
        clearRunId();
    });
    t.mock.method(chromium, 'launch', async () => {
        throw new Error('Empty cleanup must not launch a browser');
    });
    await globalTeardown();
    process.env.NALA_RUN_ID = runId;
    await globalTeardown();
    assert.deepEqual(global.nalaCleanupResults, { totalFound: 0, totalDeleted: 0, totalFailed: 0 });
});

test('recovery search filters by run marker, includes translations, and deduplicates paginated results', async (t) => {
    const queries = [];
    globalThis.document = {
        querySelector: () => ({
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            search: async function* (query) {
                                queries.push(query);
                                yield [{ id: 'known', title: 'nala-run-offline', path: `${query.path}/known` }];
                                yield [
                                    { id: query.path, title: 'nala-run-offline', path: `${query.path}/owned` },
                                    { id: 'foreign', title: 'Another run', path: `${query.path}/foreign` },
                                ];
                            },
                        },
                    },
                },
            },
        }),
    };
    t.after(() => {
        delete globalThis.document;
    });

    const locales = ['en_US', 'fr_FR', 'en_CA', 'en_GB', 'en_AU', 'translations'];
    const found = await findRunFragments({
        runId: 'nala-run-offline',
        locales,
        knownIds: ['known'],
    });
    assert.equal(found.length, locales.length);
    assert.deepEqual(
        queries,
        locales.map((locale) => ({ path: `/content/dam/mas/nala/${locale}`, query: 'nala-run-offline' })),
    );
});

test('cleanup summary preserves colored totals and exposes per-path outcomes', (t) => {
    const previous = global.nalaCleanupResults;
    const lines = [];
    t.mock.method(console, 'log', (line) => lines.push(line));
    t.after(() => {
        global.nalaCleanupResults = previous;
    });
    global.nalaCleanupResults = {
        totalFound: 3,
        totalDeleted: 2,
        totalFailed: 1,
        paths: [
            { path: '/content/dam/mas/nala/en_US', found: 2, deleted: 2, failed: 0 },
            { path: '/content/dam/mas/nala/en_GB', found: 1, deleted: 0, failed: 1, searchError: 'Search unavailable' },
        ],
    };
    printCleanupSummary();
    const output = lines.join('\n');
    assert.match(output, /\x1b\[1m\x1b\[34m---------Fragment Cleanup Summary---------/);
    assert.match(output, /Successfully deleted/);
    assert.match(output, /Failed to delete/);
    assert.match(output, /nala\/en_US/);
    assert.match(output, /nala\/en_GB/);
    assert.match(output, /Recovery search failed: Search unavailable/);
});
