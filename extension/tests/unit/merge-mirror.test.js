const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fieldContribution, attributeFields, INTERNAL_FIELDS, EXPLICIT_EMPTY_SENTINEL } = require('../../utils/merge-mirror.js');

test('a {mimeType} object with no value inherits from the default card', () => {
    assert.equal(fieldContribution({ mimeType: 'text/html' }), 'inherit');
});

test('a value object with content comes from the variation', () => {
    assert.equal(fieldContribution({ mimeType: 'text/html', value: '<p>Save 50%</p>' }), 'set');
});

test('an empty-string value is an explicit clear', () => {
    assert.equal(fieldContribution({ mimeType: 'text/html', value: '' }), 'cleared');
});

test('the explicit-empty sentinel is a clear', () => {
    assert.equal(fieldContribution([EXPLICIT_EMPTY_SENTINEL]), 'cleared');
    assert.equal(fieldContribution(EXPLICIT_EMPTY_SENTINEL), 'cleared');
});

test('an empty array inherits, a non-empty array is set', () => {
    assert.equal(fieldContribution([]), 'inherit');
    assert.equal(fieldContribution(['a']), 'set');
});

test('undefined inherits', () => {
    assert.equal(fieldContribution(undefined), 'inherit');
});

test('null and empty string are clears, other scalars are set', () => {
    assert.equal(fieldContribution(null), 'cleared');
    assert.equal(fieldContribution(''), 'cleared');
    assert.equal(fieldContribution('x'), 'set');
});

test('an array of only empty strings is a clear', () => {
    assert.equal(fieldContribution(['']), 'cleared');
});

test('an object without value is set when another key is set', () => {
    assert.equal(fieldContribution({ mimeType: 'text/html', foo: 'bar' }), 'set');
});

test('internal fields are exported', () => {
    assert.deepEqual(INTERNAL_FIELDS, ['variations', 'pznTags', 'tags', 'compatVersion']);
});

test('the CCI promo fixture attributes only its authored fields', () => {
    const fields = {
        prices: { mimeType: 'text/html' },
        shortDescription: { mimeType: 'text/html', value: 'New subscribers save 50%' },
        description: { mimeType: 'text/html' },
        ctas: { mimeType: 'text/html' },
        variations: [],
        pznTags: [],
        tags: ['x'],
    };
    assert.deepEqual(attributeFields(fields, { variant: 'plans' }), [
        { field: 'prices', contribution: 'inherit' },
        { field: 'shortDescription', contribution: 'set' },
        { field: 'description', contribution: 'inherit' },
        { field: 'ctas', contribution: 'inherit' },
    ]);
});

test('compare-chart-column features with content are combined with the parent', () => {
    assert.deepEqual(attributeFields({ features: { value: ['f'] } }, { variant: 'compare-chart-column' }), [
        { field: 'features', contribution: 'combined' },
    ]);
});

test('compare-chart-column features cleared with [""] are still combined with the parent', () => {
    assert.deepEqual(attributeFields({ features: { value: [''] } }, { variant: 'compare-chart-column' }), [
        { field: 'features', contribution: 'combined' },
    ]);
});

test('compare-chart-column features the variation leaves unset still inherit', () => {
    assert.deepEqual(attributeFields({ features: { mimeType: 'text/html' } }, { variant: 'compare-chart-column' }), [
        { field: 'features', contribution: 'inherit' },
    ]);
});
