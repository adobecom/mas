import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import { chunkUrls, formatTimestamp, run, selectPurgePaths, signRequest } from './akamai-purge.mjs';

// Expected signatures come from Akamai's edgegrid-python (EdgeGridAuthHeaders.make_auth_header) with these dummy values.
const credentials = {
    host: 'akab-test.luna.akamaiapis.net',
    clientToken: 'akab-client-token-xxx',
    clientSecret: 'test-client-secret',
    accessToken: 'akab-access-token-xxx',
};
const timestamp = '20261014T22:15:00+0000';
const nonce = 'nonce-xx-0000';
const authPrefix =
    'EG1-HMAC-SHA256 client_token=akab-client-token-xxx;access_token=akab-access-token-xxx;timestamp=20261014T22:15:00+0000;nonce=nonce-xx-0000;';

const timing = { pollIntervalMs: 1, originTimeoutMs: 60, edgeTimeoutMs: 60, requestTimeoutMs: 30 };
const ORIGIN = 'https://main--mas--adobecom.aem.live';
const EDGE = 'https://mas.adobe.com';
const PURGE = `https://${credentials.host}/ccu/v3/invalidate/url/production`;
const previous = Buffer.from('old content');
const studioJs = { path: 'studio/src/studio.js', previous };

function stubFetch({ origin, edge = () => new Response('new content'), purge = () => purgeAccepted() }) {
    const calls = [];
    mock.method(globalThis, 'fetch', async (url, init = {}) => {
        calls.push({ url, init });
        if (url.startsWith(ORIGIN)) return origin(url, init);
        if (url.startsWith(EDGE)) return edge(url, init);
        if (url === PURGE) return purge(url, init);
        throw new Error(`unexpected fetch ${url}`);
    });
    return calls;
}

function purgeAccepted() {
    return Response.json({ httpStatus: 201, estimatedSeconds: 0, purgeId: 'purge-1' }, { status: 201 });
}

function purgedUrls(calls) {
    return calls.filter(({ url }) => url === PURGE).flatMap(({ init }) => JSON.parse(init.body).objects);
}

test.afterEach(() => mock.restoreAll());

test('formatTimestamp uses the EdgeGrid UTC format', () => {
    assert.equal(formatTimestamp(new Date('2026-10-14T22:15:00.123Z')), timestamp);
});

test('signRequest matches edgegrid-python for a GET with a query string', () => {
    const header = signRequest({
        method: 'GET',
        path: '/identity-management/v3/api-clients/self?apiAccess=true',
        credentials,
        timestamp,
        nonce,
    });
    assert.equal(header, `${authPrefix}signature=VgvwDWsiC4ifV+6j0SHH4TQWGugm3B6p/9Dm8fmldZk=`);
});

test('signRequest matches edgegrid-python for a POST, hashing the body', () => {
    const header = signRequest({
        method: 'POST',
        path: '/ccu/v3/invalidate/url/production',
        body: '{"objects":["https://mas.adobe.com/studio/src/studio.js"]}',
        credentials,
        timestamp,
        nonce,
    });
    assert.equal(header, `${authPrefix}signature=oydch4/ZN0J5dkaMo1z9BCLvTH6hPrJS6kUnOL+jEJI=`);
});

test('selectPurgePaths splits NUL-separated diff output and keeps only file types the property caches', () => {
    const paths = selectPurgePaths(
        [
            'studio/src/studio.js',
            'studio/style.css',
            'studio/img/café.svg',
            'web-components/dist/mas.js',
            'studio/package.json',
            'studio/README.md',
            'studio/test/fixture.html',
            '',
        ].join('\0'),
    );
    assert.deepEqual(paths, ['studio/src/studio.js', 'studio/style.css', 'studio/img/café.svg', 'web-components/dist/mas.js']);
});

test('chunkUrls keeps every purge body within the byte limit, in order', () => {
    const urls = Array.from({ length: 7 }, (value, index) => `${EDGE}/studio/src/${'x'.repeat(index * 10)}.js`);
    const chunks = chunkUrls(urls, 200);
    assert.ok(chunks.length > 1);
    assert.deepEqual(chunks.flat(), urls);
    for (const chunk of chunks) assert.ok(Buffer.byteLength(JSON.stringify({ objects: chunk })) <= 200);
});

test('run waits until aem.live moves past the previous version, purges, then checks the edge', async () => {
    let originCalls = 0;
    const calls = stubFetch({
        origin: () => new Response(++originCalls < 3 ? previous : 'new content'),
    });
    await run({ files: [studioJs], credentials, timing });
    assert.equal(originCalls, 3);
    assert.deepEqual(purgedUrls(calls), [`${EDGE}/studio/src/studio.js`]);
    assert.ok(calls.some(({ url }) => url === `${EDGE}/studio/src/studio.js`));
});

test('run accepts a newer version on aem.live, e.g. from a later merge', async () => {
    const calls = stubFetch({ origin: () => new Response('content from a later merge') });
    await run({ files: [studioJs], credentials, timing });
    assert.deepEqual(purgedUrls(calls), [`${EDGE}/studio/src/studio.js`]);
});

test('run treats a new file as ready once aem.live serves it', async () => {
    let originCalls = 0;
    const calls = stubFetch({
        origin: () => (++originCalls < 2 ? new Response('', { status: 404 }) : new Response('new content')),
    });
    await run({ files: [{ path: 'studio/src/new-view.js', previous: null }], credentials, timing });
    assert.deepEqual(purgedUrls(calls), [`${EDGE}/studio/src/new-view.js`]);
});

test('run fails without purging when aem.live still serves the previous version', async () => {
    const calls = stubFetch({ origin: () => new Response(previous) });
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /aem\.live still serves the previous version/);
    assert.deepEqual(purgedUrls(calls), []);
});

test('run purges the ready files, then fails for the stale ones', async () => {
    const calls = stubFetch({
        origin: (url) => new Response(url.endsWith('studio.js') ? 'new content' : previous),
    });
    const styleCss = { path: 'studio/style.css', previous };
    await assert.rejects(run({ files: [studioJs, styleCss], credentials, timing }), /studio\/style\.css/);
    assert.deepEqual(purgedUrls(calls), [`${EDGE}/studio/src/studio.js`]);
});

test('a hung aem.live request cannot outlive the polling deadline', async () => {
    const calls = stubFetch({
        origin: (url, { signal }) =>
            new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    });
    const started = Date.now();
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /aem\.live still serves the previous version/);
    assert.ok(Date.now() - started < 1000);
    assert.ok(calls.every(({ init }) => init.signal instanceof AbortSignal));
});

test('run fails when Akamai rejects the purge', async () => {
    stubFetch({
        origin: () => new Response('new content'),
        purge: () => Response.json({ title: 'Forbidden', detail: 'Invalid credentials' }, { status: 403 }),
    });
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /Akamai purge failed with 403: Forbidden/);
});

test('run fails when mas.adobe.com still serves the previous version after the purge', async () => {
    const calls = stubFetch({ origin: () => new Response('new content'), edge: () => new Response(previous) });
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /mas\.adobe\.com still serves the previous/);
    assert.ok(calls.filter(({ url }) => url === PURGE).every(({ init }) => init.signal instanceof AbortSignal));
});
