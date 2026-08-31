import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameTags, selectRows } from '../pzn-tags-locale-to-country/pzn-tag-applier.mjs';
import { FLAGS, RULES } from '../pzn-tags-locale-to-country/pzn-tag-mapping.mjs';

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
        variationId: 'id-1',
        variationPath: '/content/dam/mas/acom/es_EC/pzn/foo',
        rule: RULES.LOCALE_TO_COUNTRY,
        flags: [],
        batchMarkets: ['EC'],
        markets: ['EC'],
        ...overrides,
    };
}

test('selectRows: NOOP rows are excluded entirely', () => {
    const report = { rows: [row({ rule: RULES.NOOP })] };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set() });
    assert.deepEqual(result.rows, []);
    assert.deepEqual(result.inBatch, []);
    assert.deepEqual(result.selected, []);
});

test('selectRows: rows outside the requested markets are excluded from the batch', () => {
    const report = { rows: [row({ batchMarkets: ['EC'] }), row({ variationId: 'id-2', batchMarkets: ['MX'] })] };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set() });
    assert.equal(result.rows.length, 2);
    assert.deepEqual(
        result.inBatch.map((r) => r.variationId),
        ['id-1'],
    );
    assert.deepEqual(
        result.selected.map((r) => r.variationId),
        ['id-1'],
    );
});

test('selectRows: rows carrying a blocking flag are skipped, not selected', () => {
    const report = { rows: [row({ flags: [FLAGS.COLLISION] })] };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set() });
    assert.deepEqual(result.selected, []);
    assert.equal(result.skipped.length, 1);
    assert.match(result.skipped[0].reason, /COLLISION/);
});

test('selectRows: a blocking flag in --allow-flags is not treated as blocking', () => {
    const report = { rows: [row({ flags: [FLAGS.COLLISION] })] };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set([FLAGS.COLLISION]) });
    assert.deepEqual(result.skipped, []);
    assert.deepEqual(
        result.selected.map((r) => r.variationId),
        ['id-1'],
    );
});

test('selectRows: informational flags (MERGED, SURFACE_DEFAULT) never block selection', () => {
    const report = { rows: [row({ flags: [FLAGS.MERGED, FLAGS.SURFACE_DEFAULT] })] };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set() });
    assert.deepEqual(result.skipped, []);
    assert.equal(result.selected.length, 1);
});

test('selectRows: falls back to `markets` when a row has no `batchMarkets`', () => {
    const report = { rows: [row({ batchMarkets: undefined, markets: ['EC'] })] };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set() });
    assert.equal(result.inBatch.length, 1);
});

test('selectRows: falls back to `report.failures` when `report.rows` is absent, to retry a failures file', () => {
    const report = {
        failures: [row({ error: 'PUT failed: 500 Internal Server Error', failedAt: '2026-08-31T00:00:00.000Z' })],
    };
    const result = selectRows(report, { markets: new Set(['EC']), allowedFlags: new Set() });
    assert.deepEqual(
        result.selected.map((r) => r.variationId),
        ['id-1'],
    );
});
