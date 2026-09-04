import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    addCrossVariationFlags,
    buildReport,
    buildRow,
    groupByMarket,
    groupByParentFragment,
} from '../pzn-tags-locale-to-country/pzn-tag-diff-report.mjs';
import { FLAGS, RULES } from '../pzn-tags-locale-to-country/pzn-tag-mapping.mjs';

function record(overrides = {}) {
    return {
        surface: 'acom',
        locale: 'es_EC',
        productArrangementCode: 'photoshop',
        name: 'default',
        path: '/content/dam/mas/acom/es_EC/photoshop/pzn/default',
        id: 'id-1',
        parentFragmentId: 'parent-1',
        etag: 'etag-1',
        pznTags: ['mas:locale/es_EC'],
        ...overrides,
    };
}

test('buildRow: a locale tag maps to its market country tag and reports the target/added/removed columns', () => {
    const row = buildRow(record(), new Set(), null);
    assert.deepEqual(row.currentTags, ['mas:locale/es_EC']);
    assert.deepEqual(row.targetTags, ['mas:pzn/country/ec']);
    assert.deepEqual(row.added, ['mas:pzn/country/ec']);
    assert.deepEqual(row.removed, ['mas:locale/es_EC']);
    assert.equal(row.rule, RULES.LOCALE_TO_COUNTRY);
    assert.deepEqual(row.markets, ['EC']);
});

test('buildRow: umbrellaExpansion only runs on the en_US tree', () => {
    const enRow = buildRow(record({ locale: 'en_US', pznTags: ['mas:pzn/country/mu'] }), new Set(), null);
    assert.equal(enRow.rule, RULES.UMBRELLA_EXPANSION);
    const nonEnRow = buildRow(record({ locale: 'fr_FR', pznTags: ['mas:pzn/country/mu'] }), new Set(), null);
    assert.equal(nonEnRow.rule, RULES.NOOP);
});

test('buildRow: acom-dc runs umbrellaExpansion only — a locale tag is left untouched', () => {
    const row = buildRow(record({ surface: 'acom-dc', locale: 'en_US' }), new Set(), null);
    assert.equal(row.rule, RULES.NOOP);
    assert.deepEqual(row.currentTags, row.targetTags);
});

test("buildRow: flags TAG_DRIFT when the record's group key is in driftedGroups", () => {
    const driftedGroups = new Set(['acom|photoshop|default']);
    const row = buildRow(record(), driftedGroups, null);
    assert.ok(row.flags.includes(FLAGS.TAG_DRIFT));
});

test('buildRow: flags TAG_MISSING when an added country tag is not in knownCountries', () => {
    const row = buildRow(record(), new Set(), new Set());
    assert.ok(row.flags.includes(FLAGS.TAG_MISSING));
});

test('buildRow: no TAG_MISSING when the added country tag is already known', () => {
    const row = buildRow(record(), new Set(), new Set(['EC']));
    assert.equal(row.flags.includes(FLAGS.TAG_MISSING), false);
});

test('addCrossVariationFlags: two sibling variations collapsing onto the same market are both flagged COLLISION', () => {
    const rowA = buildRow(record({ id: 'a', locale: 'es_EC' }), new Set(), null);
    const rowB = buildRow(record({ id: 'b', locale: 'es_EC', name: 'default' }), new Set(), null);
    rowA.variationId = 'a';
    rowB.variationId = 'b';
    addCrossVariationFlags([rowA, rowB]);
    assert.ok(rowA.flags.includes(FLAGS.COLLISION));
    assert.ok(rowB.flags.includes(FLAGS.COLLISION));
});

test('addCrossVariationFlags: a lone row targeting a market is never flagged COLLISION', () => {
    const row = buildRow(record(), new Set(), null);
    row.variationId = 'a';
    addCrossVariationFlags([row]);
    assert.equal(row.flags.includes(FLAGS.COLLISION), false);
});

test('groupByParentFragment: groups rows by parentFragmentPath and counts changing rows', () => {
    const changingRow = buildRow(record(), new Set(), null);
    const noopRow = buildRow(record({ id: 'noop', pznTags: [] }), new Set(), null);
    const [group] = groupByParentFragment([changingRow, noopRow]);
    assert.equal(group.rows.length, 2);
    assert.equal(group.changing, 1);
});

test('groupByMarket: groups rows by every market in batchMarkets, sorted alphabetically', () => {
    const ecRow = buildRow(record(), new Set(), null);
    const auRow = buildRow(record({ id: 'au', locale: 'en_AU', pznTags: ['mas:locale/en_AU'] }), new Set(), null);
    const groups = groupByMarket([ecRow, auRow]);
    assert.deepEqual(
        groups.map((g) => g.market),
        ['AU', 'EC'],
    );
});

test('buildReport: totals reflect rule and flag counts across all rows', () => {
    const inventory = {
        surface: 'acom',
        authorHost: 'author-p22655-e59471.adobeaemcloud.com',
        records: [record(), record({ id: 'noop', pznTags: [] })],
    };
    const report = buildReport(inventory);
    assert.equal(report.totals.variations, 2);
    assert.equal(report.totals.changing, 1);
    assert.equal(report.totals.noop, 1);
    assert.equal(report.totals.byRule[RULES.LOCALE_TO_COUNTRY], 1);
    assert.equal(report.totals.byRule[RULES.NOOP], 1);
});

test('buildReport: blocked totals count changing rows carrying a blocking flag', () => {
    const inventory = {
        records: [record(), record({ id: 'sibling', locale: 'es_EC', name: 'default' })],
    };
    const report = buildReport(inventory);
    assert.equal(report.totals.blocked, 2);
    assert.ok(report.rows.every((row) => row.flags.includes(FLAGS.COLLISION)));
});
