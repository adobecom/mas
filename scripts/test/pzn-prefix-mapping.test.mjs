import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ADDED_TAGS,
    PRESERVED_TAGS,
    PREFIX_RENAMES,
    RULES,
    applyPrefixRename,
    pathToTagId,
    requiredTargetTags,
    tagIdToPath,
} from '../pzn-tag-prefix-rename/pzn-prefix-mapping.mjs';

test('tagIdToPath / pathToTagId: round-trip inside the pzn namespace, undefined outside it', () => {
    assert.equal(tagIdToPath('mas:pzn/pzn-edu'), '/content/cq:tags/mas/pzn/pzn-edu');
    assert.equal(pathToTagId('/content/cq:tags/mas/pzn/pzn-edu'), 'mas:pzn/pzn-edu');
    assert.equal(tagIdToPath('mas:product/x'), undefined);
    assert.equal(pathToTagId('/content/cq:tags/mas/product/x'), undefined);
});

test('applyPrefixRename: each of the seven old ids maps to its pzn- prefixed target', () => {
    for (const [from, to] of Object.entries(PREFIX_RENAMES)) {
        const result = applyPrefixRename([from]);
        assert.deepEqual(result.tags, [to]);
        assert.deepEqual(result.mapped, [{ from, to }]);
        assert.equal(result.rule, RULES.PREFIX_RENAME);
    }
});

test('applyPrefixRename: general, site-pivot, logged-in, country/us and an unrelated tag pass through unchanged', () => {
    const tags = ['mas:pzn/general', 'mas:pzn/site-pivot', 'mas:pzn/logged-in', 'mas:pzn/country/us', 'mas:product/x'];
    const result = applyPrefixRename(tags);
    assert.deepEqual(result.tags, tags);
    assert.deepEqual(result.mapped, []);
    assert.equal(result.rule, RULES.NOOP);
});

test('applyPrefixRename: idempotent — re-applying to the output is a no-op', () => {
    const tags = Object.keys(PREFIX_RENAMES);
    const first = applyPrefixRename(tags);
    const second = applyPrefixRename(first.tags);
    assert.deepEqual(second.tags, first.tags);
    assert.equal(second.rule, RULES.NOOP);
});

test('applyPrefixRename: rule is NOOP when nothing changes', () => {
    assert.equal(applyPrefixRename([]).rule, RULES.NOOP);
    assert.equal(applyPrefixRename(['mas:pzn/general']).rule, RULES.NOOP);
});

test('applyPrefixRename: dedupes and preserves order', () => {
    const result = applyPrefixRename(['mas:pzn/edu', 'mas:pzn/general', 'mas:pzn/edu']);
    assert.deepEqual(result.tags, ['mas:pzn/pzn-edu', 'mas:pzn/general']);
});

test('requiredTargetTags: includes the added tags, contains no duplicates, and contains no old rename source id', () => {
    const required = requiredTargetTags();
    assert.ok(ADDED_TAGS.every((tag) => required.includes(tag)));
    assert.ok(PRESERVED_TAGS.every((tag) => required.includes(tag)));
    assert.equal(new Set(required).size, required.length);
    assert.ok(Object.keys(PREFIX_RENAMES).every((oldId) => !required.includes(oldId)));
});
