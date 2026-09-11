import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    BUCKETS,
    MISSING_STATUS,
    bucketFor,
    fetchStatus,
    linesFor,
    outputPathFor,
    parseLinks,
    parseStudioLink,
    run,
} from '../pzn-tags-locale-to-country/link-status-split.mjs';

const link = (id, surface = 'acom') => `https://mas.adobe.com/studio.html#page=content&path=${surface}&query=${id}`;

async function withTempDir(fn) {
    const dir = mkdtempSync(join(tmpdir(), 'link-status-split-'));
    try {
        await fn(dir);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const jsonResponse = (body) => ({ ok: true, status: 200, json: async () => body });

function stubFetch(statusById) {
    const calls = [];
    const fetchImpl = async (url) => {
        const id = url.split('/').pop();
        calls.push(url);
        const status = statusById[id];
        if (status === 404) return { ok: false, status: 404 };
        if (status === 500) return { ok: false, status: 500 };
        return jsonResponse({ status });
    };
    return { fetchImpl, calls };
}

test('parseStudioLink: extracts the surface and fragment id from the hash', () => {
    assert.deepEqual(parseStudioLink(link('id-1')), { link: link('id-1'), surface: 'acom', id: 'id-1' });
});

test('parseStudioLink: returns null for a line without a query parameter', () => {
    assert.equal(parseStudioLink('https://mas.adobe.com/studio.html#page=content&path=acom'), null);
});

test('parseStudioLink: returns null for a blank line', () => {
    assert.equal(parseStudioLink('   '), null);
});

test('parseLinks: drops duplicate ids and keeps first-seen order', () => {
    const entries = parseLinks([link('b'), link('a'), link('b'), ''].join('\n'));
    assert.deepEqual(
        entries.map((entry) => entry.id),
        ['b', 'a'],
    );
});

test('bucketFor: maps each Studio status to its own bucket', () => {
    assert.deepEqual(['DRAFT', 'MODIFIED', 'PUBLISHED'].map(bucketFor), ['draft', 'modified', 'published']);
});

test('bucketFor: sends an unrecognised status to the other bucket', () => {
    assert.equal(bucketFor('UNPUBLISHED'), 'other');
});

test('bucketFor: sends a null status to the other bucket', () => {
    assert.equal(bucketFor(null), 'other');
});

test('outputPathFor: names the output after the input plus the bucket', () => {
    assert.equal(outputPathFor('/tmp/ACOM-31-08.txt', 'draft'), '/tmp/ACOM-31-08-draft.txt');
});

test('linesFor: emits bare links for a status bucket', () => {
    const entries = [
        { link: link('a'), status: 'DRAFT' },
        { link: link('b'), status: 'PUBLISHED' },
    ];
    assert.deepEqual(linesFor(entries, 'draft'), [link('a')]);
});

test('linesFor: appends the status to each line of the other bucket', () => {
    const entries = [{ link: link('a'), status: 'UNPUBLISHED' }];
    assert.deepEqual(linesFor(entries, 'other'), [`${link('a')}\tUNPUBLISHED`]);
});

test('fetchStatus: returns the status field of the fragment', async () => {
    const { fetchImpl } = stubFetch({ 'id-1': 'MODIFIED' });
    assert.equal(await fetchStatus('https://author', 'id-1', {}, fetchImpl), 'MODIFIED');
});

test('fetchStatus: reports a deleted fragment as missing', async () => {
    const { fetchImpl } = stubFetch({ 'id-1': 404 });
    assert.equal(await fetchStatus('https://author', 'id-1', {}, fetchImpl), MISSING_STATUS);
});

test('fetchStatus: retries a server error once before giving up', async () => {
    const { fetchImpl, calls } = stubFetch({ 'id-1': 500 });
    assert.equal(await fetchStatus('https://author', 'id-1', {}, fetchImpl), 'ERROR 500');
    assert.equal(calls.length, 2);
});

test('fetchStatus: does not retry a client error', async () => {
    const calls = [];
    const fetchImpl = async () => {
        calls.push(1);
        return { ok: false, status: 403 };
    };
    assert.equal(await fetchStatus('https://author', 'id-1', {}, fetchImpl), 'ERROR 403');
    assert.equal(calls.length, 1);
});

test('run: writes one file per populated bucket and routes unknown statuses to other', async () => {
    await withTempDir(async (dir) => {
        const inputFile = join(dir, 'links.txt');
        writeFileSync(inputFile, [link('d'), link('m'), link('p'), link('u'), link('gone')].join('\n'));
        const { fetchImpl } = stubFetch({ d: 'DRAFT', m: 'MODIFIED', p: 'PUBLISHED', u: 'UNPUBLISHED', gone: 404 });

        const written = await run({ inputFile, authorHost: 'author', token: 't', apiKey: 'k', concurrency: 2, fetchImpl });

        assert.deepEqual(
            written.map(({ bucket, count }) => [bucket, count]),
            [
                ['draft', 1],
                ['modified', 1],
                ['published', 1],
                ['other', 2],
            ],
        );
        assert.equal(readFileSync(outputPathFor(inputFile, 'draft'), 'utf8'), `${link('d')}\n`);
        assert.equal(
            readFileSync(outputPathFor(inputFile, 'other'), 'utf8'),
            `${link('u')}\tUNPUBLISHED\n${link('gone')}\t${MISSING_STATUS}\n`,
        );
    });
});

test('run: skips a bucket with no links instead of writing an empty file', async () => {
    await withTempDir(async (dir) => {
        const inputFile = join(dir, 'links.txt');
        writeFileSync(inputFile, link('p'));
        const { fetchImpl } = stubFetch({ p: 'PUBLISHED' });

        await run({ inputFile, authorHost: 'author', token: 't', apiKey: 'k', fetchImpl });

        for (const bucket of BUCKETS.filter((name) => name !== 'published')) {
            assert.equal(existsSync(outputPathFor(inputFile, bucket)), false);
        }
    });
});

test('run: rejects an input file with no Studio links', async () => {
    await withTempDir(async (dir) => {
        const inputFile = join(dir, 'links.txt');
        writeFileSync(inputFile, 'not a link\n');
        await assert.rejects(() => run({ inputFile, authorHost: 'author', token: 't', apiKey: 'k' }), /No Studio links/);
    });
});
