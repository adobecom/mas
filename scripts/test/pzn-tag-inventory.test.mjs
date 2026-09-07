import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByParent, tagFrequency } from '../pzn-tags-locale-to-country/pzn-tag-inventory.mjs';

function record(overrides = {}) {
    return {
        surface: 'acom',
        locale: 'en_US',
        productArrangementCode: 'photoshop',
        name: 'default',
        pznTags: [],
        ...overrides,
    };
}

test('groupByParent: locales of the same (surface, productArrangementCode, name) collapse into one group', () => {
    const records = [record({ locale: 'en_US' }), record({ locale: 'fr_FR' })];
    const groups = groupByParent(records);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].locales.length, 2);
});

test('groupByParent: identical pznTags across locales report tagDrift "identical"', () => {
    const records = [
        record({ locale: 'en_US', pznTags: ['mas:pzn/country/ec'] }),
        record({ locale: 'fr_FR', pznTags: ['mas:pzn/country/ec'] }),
    ];
    const [group] = groupByParent(records);
    assert.equal(group.tagDrift, 'identical');
    assert.deepEqual(group.distinctTagSets, ['mas:pzn/country/ec']);
});

test('groupByParent: differing pznTags across locales report tagDrift "drifted"', () => {
    const records = [
        record({ locale: 'en_US', pznTags: ['mas:pzn/country/ec'] }),
        record({ locale: 'fr_FR', pznTags: ['mas:locale/fr_FR'] }),
    ];
    const [group] = groupByParent(records);
    assert.equal(group.tagDrift, 'drifted');
    assert.equal(group.distinctTagSets.length, 2);
});

test('groupByParent: different productArrangementCode or name never merge into the same group', () => {
    const records = [record({ productArrangementCode: 'photoshop' }), record({ productArrangementCode: 'illustrator' })];
    const groups = groupByParent(records);
    assert.equal(groups.length, 2);
});

test('tagFrequency: counts records by their (order-independent) tag set', () => {
    const records = [
        record({ pznTags: ['mas:pzn/country/ec'] }),
        record({ pznTags: ['mas:pzn/country/ec'] }),
        record({ pznTags: ['mas:locale/fr_FR'] }),
    ];
    const frequency = tagFrequency(records);
    assert.deepEqual(frequency, [
        { tags: 'mas:pzn/country/ec', count: 2 },
        { tags: 'mas:locale/fr_FR', count: 1 },
    ]);
});

test('tagFrequency: empty pznTags is grouped under "(none)"', () => {
    const frequency = tagFrequency([record({ pznTags: [] })]);
    assert.deepEqual(frequency, [{ tags: '(none)', count: 1 }]);
});

test('tagFrequency: ties are broken alphabetically by the tag-set key', () => {
    const records = [record({ pznTags: ['b'] }), record({ pznTags: ['a'] })];
    const frequency = tagFrequency(records);
    assert.deepEqual(
        frequency.map((f) => f.tags),
        ['a', 'b'],
    );
});
