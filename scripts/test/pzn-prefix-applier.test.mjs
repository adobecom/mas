import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveTagsFor, sameTags, selectRows } from '../pzn-tag-prefix-rename/pzn-prefix-applier.mjs';
import { FLAGS, RULES } from '../pzn-tag-prefix-rename/pzn-prefix-mapping.mjs';

test('sameTags: equal arrays in order are equal', () => {
    assert.equal(sameTags(['a', 'b'], ['a', 'b']), true);
});

test('sameTags: same elements in a different order are not equal', () => {
    assert.equal(sameTags(['a', 'b'], ['b', 'a']), false);
});

test('sameTags: different lengths are not equal', () => {
    assert.equal(sameTags(['a'], ['a', 'b']), false);
});

function row(overrides = {}) {
    return {
        fragmentId: 'id-1',
        fragmentPath: '/content/dam/mas/acom/en_US/photoshop/pzn/default',
        sourceField: 'pznTags',
        rule: RULES.PREFIX_RENAME,
        flags: [],
        added: ['mas:pzn/pzn-edu'],
        ...overrides,
    };
}

test('selectRows: NOOP rows are excluded entirely', () => {
    const report = { rows: [row({ rule: RULES.NOOP })] };
    const result = selectRows(report, { tags: new Set(['mas:pzn/pzn-edu']), allowedFlags: new Set() });
    assert.deepEqual(result.rows, []);
    assert.deepEqual(result.inBatch, []);
    assert.deepEqual(result.selected, []);
});

test('selectRows: rows outside the requested tag batch are excluded', () => {
    const report = {
        rows: [row({ added: ['mas:pzn/pzn-edu'] }), row({ fragmentId: 'id-2', added: ['mas:pzn/pzn-smb'] })],
    };
    const result = selectRows(report, { tags: new Set(['mas:pzn/pzn-edu']), allowedFlags: new Set() });
    assert.equal(result.rows.length, 2);
    assert.deepEqual(
        result.inBatch.map((r) => r.fragmentId),
        ['id-1'],
    );
    assert.deepEqual(
        result.selected.map((r) => r.fragmentId),
        ['id-1'],
    );
});

test('selectRows: rows carrying a blocking flag are skipped, not selected', () => {
    const report = { rows: [row({ flags: [FLAGS.TAG_MISSING] })] };
    const result = selectRows(report, { tags: new Set(['mas:pzn/pzn-edu']), allowedFlags: new Set() });
    assert.deepEqual(result.selected, []);
    assert.equal(result.skipped.length, 1);
    assert.match(result.skipped[0].reason, /TAG_MISSING/);
});

test('selectRows: a blocking flag in --allow-flags is not treated as blocking', () => {
    const report = { rows: [row({ flags: [FLAGS.TAG_MISSING] })] };
    const result = selectRows(report, { tags: new Set(['mas:pzn/pzn-edu']), allowedFlags: new Set([FLAGS.TAG_MISSING]) });
    assert.deepEqual(result.skipped, []);
    assert.deepEqual(
        result.selected.map((r) => r.fragmentId),
        ['id-1'],
    );
});

test('selectRows: falls back to `report.failures` when `report.rows` is absent, to retry a failures file', () => {
    const report = {
        failures: [row({ error: 'PUT failed: 500 Internal Server Error', failedAt: '2026-08-31T00:00:00.000Z' })],
    };
    const result = selectRows(report, { tags: new Set(['mas:pzn/pzn-edu']), allowedFlags: new Set() });
    assert.deepEqual(
        result.selected.map((r) => r.fragmentId),
        ['id-1'],
    );
});

test('liveTagsFor: normalizes path-form metadata tags to ids, matching the inventory', () => {
    const fragment = { tags: [{ path: '/content/cq:tags/mas/pzn/edu' }, { id: 'mas:pzn/general' }] };
    assert.deepEqual(liveTagsFor(fragment, 'metadataTags'), ['mas:pzn/edu', 'mas:pzn/general']);
});

test('liveTagsFor: normalizes path-form CF field values to ids, matching the inventory', () => {
    const fragment = {
        fields: [{ name: 'pznTags', values: ['/content/cq:tags/mas/pzn/edu', 'mas:pzn/general'] }],
    };
    assert.deepEqual(liveTagsFor(fragment, 'pznTags'), ['mas:pzn/edu', 'mas:pzn/general']);
});

test('liveTagsFor: drops unresolvable field values the same way the inventory does', () => {
    const fragment = { fields: [{ name: 'pznTags', values: [null, ''] }] };
    assert.deepEqual(liveTagsFor(fragment, 'pznTags'), []);
});
