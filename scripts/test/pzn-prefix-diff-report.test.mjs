import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildReport,
    buildRow,
    groupByParentFragment,
    groupByTargetTag,
} from '../pzn-tag-prefix-rename/pzn-prefix-diff-report.mjs';
import { FLAGS, RULES } from '../pzn-tag-prefix-rename/pzn-prefix-mapping.mjs';

function record(overrides = {}) {
    return {
        surface: 'acom',
        locale: 'en_US',
        productArrangementCode: 'photoshop',
        name: 'default',
        sourceField: 'pznTags',
        path: '/content/dam/mas/acom/en_US/photoshop/pzn/default',
        id: 'id-1',
        parentFragmentId: 'parent-1',
        etag: 'etag-1',
        tags: ['mas:pzn/edu'],
        ...overrides,
    };
}

test('buildRow: a record tagged mas:pzn/edu yields targetTags/added/removed', () => {
    const row = buildRow(record(), new Set(), null);
    assert.deepEqual(row.currentTags, ['mas:pzn/edu']);
    assert.deepEqual(row.targetTags, ['mas:pzn/pzn-edu']);
    assert.deepEqual(row.added, ['mas:pzn/pzn-edu']);
    assert.deepEqual(row.removed, ['mas:pzn/edu']);
    assert.equal(row.rule, RULES.PREFIX_RENAME);
});

test('buildRow: a record tagged only mas:pzn/general yields rule NOOP with currentTags equal to targetTags', () => {
    const row = buildRow(record({ tags: ['mas:pzn/general'] }), new Set(), null);
    assert.equal(row.rule, RULES.NOOP);
    assert.deepEqual(row.currentTags, row.targetTags);
});

test('buildRow: flags TAG_MISSING when a target tag is absent from the taxonomy snapshot', () => {
    const row = buildRow(record(), new Set(), new Set());
    assert.ok(row.flags.includes(FLAGS.TAG_MISSING));
});

test('buildRow: no TAG_MISSING when the added tag is already known', () => {
    const row = buildRow(record(), new Set(), new Set(['mas:pzn/pzn-edu']));
    assert.equal(row.flags.includes(FLAGS.TAG_MISSING), false);
});

test("buildRow: flags TAG_DRIFT when the record's group key is in driftedGroups", () => {
    const driftedGroups = new Set(['acom|photoshop|default|pznTags']);
    const row = buildRow(record(), driftedGroups, null);
    assert.ok(row.flags.includes(FLAGS.TAG_DRIFT));
});

test('buildRow: preserves the source etag and sourceField, so currentTags is a usable rollback target', () => {
    const row = buildRow(record(), new Set(), null);
    assert.equal(row.etag, 'etag-1');
    assert.equal(row.sourceField, 'pznTags');
});

test('groupByParentFragment: groups rows by parentFragmentPath and counts changing rows', () => {
    const changingRow = buildRow(record(), new Set(), null);
    const noopRow = buildRow(record({ id: 'noop', tags: [] }), new Set(), null);
    const [group] = groupByParentFragment([changingRow, noopRow]);
    assert.equal(group.rows.length, 2);
    assert.equal(group.changing, 1);
});

test('groupByTargetTag: groups changing rows by every tag in `added`', () => {
    const eduRow = buildRow(record(), new Set(), null);
    const smbRow = buildRow(record({ id: 'smb', tags: ['mas:pzn/smb'] }), new Set(), null);
    const groups = groupByTargetTag([eduRow, smbRow]);
    assert.deepEqual(
        groups.map((g) => g.tag),
        ['mas:pzn/pzn-edu', 'mas:pzn/pzn-smb'],
    );
});

test('buildReport: totals reflect rule and flag counts across all rows', () => {
    const inventory = {
        surface: 'acom',
        authorHost: 'author-p22655-e59471.adobeaemcloud.com',
        records: [record(), record({ id: 'noop', tags: [] })],
    };
    const report = buildReport(inventory);
    assert.equal(report.totals.rows, 2);
    assert.equal(report.totals.changing, 1);
    assert.equal(report.totals.noop, 1);
    assert.equal(report.totals.byRule[RULES.PREFIX_RENAME], 1);
    assert.equal(report.totals.byRule[RULES.NOOP], 1);
});

test('buildReport: taxonomy from the inventory drives TAG_MISSING totals', () => {
    const inventory = {
        records: [record()],
        taxonomy: { existingTagIds: [] },
    };
    const report = buildReport(inventory);
    assert.equal(report.totals.byFlag[FLAGS.TAG_MISSING], 1);
});
