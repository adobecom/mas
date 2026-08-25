const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FragmentParser } = require('../../utils/fragment-parser.js');

const P = new FragmentParser();

test('promoCode field is grouped under pricing', () => {
    const parsed = P.parseFragmentData({
        id: 'e',
        fields: [{ name: 'promoCode', values: ['SUMMER25'] }],
    });
    const grouped = P.groupFieldsByCategory(parsed);
    assert.equal(grouped.pricing.promoCode.value, 'SUMMER25');
    assert.equal(grouped.metadata.promoCode, undefined);
});
