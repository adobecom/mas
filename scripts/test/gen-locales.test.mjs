import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../content/gen-locales.mjs';
const existingFolders = ['en_US', 'fr_FR', 'de_DE'];
const folderListHits = { hits: existingFolders.map((name) => ({ name })) };
import { getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

const opts = { bucket: 'b', surface: 'sandbox', accessToken: 'tok', apiKey: 'key' };
const allLocales = getSurfaceLocales('sandbox').map(getLocaleCode);

function makeFetch(listHits) {
    const posted = [];
    globalThis.fetch = async (url, init) => {
        if (init?.method === 'POST') {
            posted.push(...JSON.parse(init.body));
            return { ok: true };
        }
        return { ok: true, json: async () => listHits };
    };
    return posted;
}

test('dry-run: no POST requests', async () => {
    const posted = makeFetch(folderListHits);
    await run({ ...opts, dryRun: true });
    assert.equal(posted.length, 0);
});

test('all folders exist: no POST requests', async () => {
    const posted = makeFetch({ hits: allLocales.map((name) => ({ name })) });
    await run(opts);
    assert.equal(posted.length, 0);
});

test('missing folders are POSTed', async () => {
    const posted = makeFetch(folderListHits);
    await run(opts);
    const postedLocales = posted.map((b) => b.path.split('/').pop()).sort();
    const expected = allLocales.filter((l) => !existingFolders.includes(l)).sort();
    assert.deepEqual(postedLocales, expected);
});

test('listExistingFolders error: run() rejects', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500, statusText: 'Internal Server Error' });
    await assert.rejects(() => run(opts), /Failed to list folders/);
});
