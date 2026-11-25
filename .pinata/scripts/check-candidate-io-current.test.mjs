import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveIoBaseUrl } from '../../studio/src/io-base-url.js';
import { CANDIDATE_IO_QUERY, checkCandidateCurrent } from './check-candidate-io-current.mjs';

const IO_FILE = 'io/studio/src/custom-field-audit/index.js';
const HEAD = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);

const harness = (respond) => {
    const urls = [];
    const logs = [];
    const fetchImpl = async (url) => {
        urls.push(url);
        return respond();
    };
    const out = { log: (line) => logs.push(line), error: (line) => logs.push(line) };
    const check = (files = [IO_FILE]) => checkCandidateCurrent(files, { headSha: HEAD, fetchImpl, out });
    return { check, urls, logs: () => logs.join('\n') };
};

const serving = (sha) => () => ({ ok: true, status: 200, json: async () => ({ message: 'Hello, world!', sha }) });

test('skips without a request when no io/studio file changed', async () => {
    const h = harness(serving(HEAD));
    assert.equal(await h.check(['studio/src/a.js']), 0);
    assert.deepEqual(h.urls, []);
    assert.match(h.logs(), /SKIP/);
});

test('asks the health check Studio uses for the candidate surface', async () => {
    const h = harness(serving(HEAD));
    await h.check();
    assert.deepEqual(h.urls, [`${resolveIoBaseUrl(CANDIDATE_IO_QUERY)}/health-check`]);
});

test('passes when the workspace serves the candidate commit', async () => {
    const h = harness(serving(HEAD.toUpperCase()));
    assert.equal(await h.check(), 0);
    assert.match(h.logs(), /OK/);
});

test('fails naming both commits when another candidate replaced it', async () => {
    const h = harness(serving(OTHER));
    assert.equal(await h.check(), 1);
    assert.match(h.logs(), new RegExp(`${OTHER}.*${HEAD}`, 's'));
});

test('fails asking for a redeploy when the workspace reports no commit', async () => {
    const h = harness(serving(null));
    assert.equal(await h.check(), 1);
    assert.match(h.logs(), /redeploy/i);
});

test('fails when the health check answers with an error status', async () => {
    const h = harness(() => ({ ok: false, status: 502, json: async () => ({}) }));
    assert.equal(await h.check(), 1);
    assert.match(h.logs(), /502/);
});

test('fails when the health check is unreachable', async () => {
    const h = harness(() => {
        throw new Error('getaddrinfo ENOTFOUND');
    });
    assert.equal(await h.check(), 1);
    assert.match(h.logs(), /ENOTFOUND/);
});

test('fails when the health check returns invalid JSON', async () => {
    const h = harness(() => ({
        ok: true,
        status: 200,
        json: async () => {
            throw new SyntaxError('Unexpected token <');
        },
    }));
    assert.equal(await h.check(), 1);
});
