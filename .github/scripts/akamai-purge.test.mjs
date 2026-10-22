import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { mock } from 'node:test';

import { blobId, formatTimestamp, previousCommit, run, selectPurgePaths, signRequest } from './akamai-purge.mjs';

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

const timing = { pollIntervalMs: 1, originTimeoutMs: 60, requestTimeoutMs: 30 };
const ORIGIN = 'https://main--mas--adobecom.aem.live';
const PURGE = `https://${credentials.host}/ccu/v3/invalidate/cpcode/production`;
const pushed = Buffer.from('pushed content');
const previous = Buffer.from('previous content');
const studioJs = { path: 'studio/src/studio.js', blob: blobId(pushed) };

function stubFetch({ origin = () => new Response(pushed), purge = purgeAccepted }) {
    const calls = [];
    mock.method(globalThis, 'fetch', async (url, init = {}) => {
        calls.push({ url, init });
        if (url.startsWith(ORIGIN)) return origin(url, init);
        if (url === PURGE) return purge(url, init);
        throw new Error(`unexpected fetch ${url}`);
    });
    return calls;
}

function purgeAccepted() {
    return Response.json({ httpStatus: 201, estimatedSeconds: 5, purgeId: 'purge-1' }, { status: 201 });
}

function purgeBodies(calls) {
    return calls.filter(({ url }) => url === PURGE).map(({ init }) => JSON.parse(init.body));
}

// Keeps the developer's signing and hook settings out of fixture commits.
const FIXTURE_GIT_CONFIG = [
    'user.name=test',
    'user.email=test@example.com',
    'commit.gpgsign=false',
    'core.hooksPath=/dev/null',
].flatMap((setting) => ['-c', setting]);

// Commits each content to f.js in a fresh repo, then runs fn inside it with the commit SHAs.
function inRepoWithVersions(contents, fn) {
    const dir = mkdtempSync(join(tmpdir(), 'akamai-purge-'));
    const git = (...args) =>
        execFileSync('git', [...FIXTURE_GIT_CONFIG, ...args], { cwd: dir })
            .toString()
            .trim();
    const cwd = process.cwd();
    try {
        git('init', '-q');
        const shas = contents.map((content) => {
            writeFileSync(join(dir, 'f.js'), content);
            git('add', 'f.js');
            git('commit', '-q', '-m', content);
            return git('rev-parse', 'HEAD');
        });
        process.chdir(dir);
        return fn(shas);
    } finally {
        process.chdir(cwd);
        rmSync(dir, { recursive: true, force: true });
    }
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

test('blobId matches git hash-object', () => {
    assert.equal(blobId(Buffer.from('hello\n')), 'ce013625030ba8dba906f756967f9e9ca394464a');
});

test('previousCommit keeps the pushed-from commit when it exists', () => {
    inRepoWithVersions(['a', 'b'], ([before, after]) => assert.equal(previousCommit(before, after), before));
});

test("previousCommit falls back to the pushed commit's parent when the pushed-from commit is missing", () => {
    inRepoWithVersions(['a', 'b'], ([parent, after]) => assert.equal(previousCommit('0'.repeat(40), after), parent));
});

test('run waits until aem.live serves the pushed version, then invalidates the CP code', async () => {
    let originCalls = 0;
    const calls = stubFetch({ origin: () => new Response(++originCalls < 3 ? previous : pushed) });
    await run({ files: [studioJs], credentials, timing });
    assert.equal(originCalls, 3);
    assert.deepEqual(purgeBodies(calls), [{ objects: [1776643] }]);
});

test('run treats a new file as ready once aem.live serves it', async () => {
    let originCalls = 0;
    const calls = stubFetch({
        origin: () => (++originCalls < 2 ? new Response('', { status: 404 }) : new Response(pushed)),
    });
    await run({ files: [{ path: 'studio/src/new-view.js', blob: blobId(pushed) }], credentials, timing });
    assert.deepEqual(purgeBodies(calls), [{ objects: [1776643] }]);
});

test('run purges right away when there are no files to wait for', async () => {
    const calls = stubFetch({});
    await run({ files: [], credentials, timing });
    assert.deepEqual(
        calls.map(({ url }) => url),
        [PURGE],
    );
});

test('run fails without purging when aem.live still serves the previous version', async () => {
    const calls = stubFetch({ origin: () => new Response(previous) });
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /aem\.live does not serve the pushed/);
    assert.deepEqual(purgeBodies(calls), []);
});

test('run fails without purging and lists the files aem.live does not serve yet', async () => {
    const calls = stubFetch({ origin: (url) => new Response(url.endsWith('studio.js') ? pushed : previous) });
    const styleCss = { path: 'studio/style.css', blob: blobId(Buffer.from('pushed style')) };
    await assert.rejects(run({ files: [studioJs, styleCss], credentials, timing }), /\(studio\/style\.css\)/);
    assert.deepEqual(purgeBodies(calls), []);
});

test('a hung aem.live request cannot outlive the polling deadline', async () => {
    const calls = stubFetch({
        // A real hung request keeps Node running through its open socket; AbortSignal.timeout does not.
        origin: (url, { signal }) =>
            new Promise((resolve, reject) => {
                const socket = setTimeout(() => {}, 60_000);
                signal.addEventListener('abort', () => {
                    clearTimeout(socket);
                    reject(signal.reason);
                });
            }),
    });
    const started = Date.now();
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /aem\.live does not serve the pushed/);
    assert.ok(Date.now() - started < 1000);
    assert.ok(calls.every(({ init }) => init.signal instanceof AbortSignal));
});

test('run fails when Akamai rejects the purge', async () => {
    stubFetch({
        purge: () => Response.json({ title: 'Forbidden', detail: 'Invalid credentials' }, { status: 403 }),
    });
    await assert.rejects(run({ files: [studioJs], credentials, timing }), /Akamai purge failed with 403: Forbidden/);
});

test('purge requests carry a timeout signal', async () => {
    const calls = stubFetch({});
    await run({ files: [studioJs], credentials, timing });
    const purges = calls.filter(({ url }) => url === PURGE);
    assert.ok(purges.length && purges.every(({ init }) => init.signal instanceof AbortSignal));
});
