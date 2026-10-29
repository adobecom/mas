const { test } = require('node:test');
const assert = require('node:assert/strict');

const { FragmentParser } = require('../../utils/fragment-parser.js');

const parser = new FragmentParser();

test('a /pzn/ path is a grouped variation with its audience from pznTags', () => {
    const v = parser.classifyVariation({
        path: '/content/dam/mas/acom/en_US/ccsn/pzn/cc-lapsed',
        fields: { pznTags: ['mas:pzn/cc-lapsed', 'mas:pzn/country/us'] },
    });
    assert.deepEqual(v, { type: 'grouped', audiences: ['cc-lapsed'], promotionName: null, legacy: false });
});

test('a promotions/ path is a promo variation even without a promotion tag', () => {
    assert.equal(parser.classifyVariation({ path: '/content/dam/mas/acom/en_US/promotions/cci/card', tags: [] }).type, 'promo');
});

test('a promotion tag names the promo', () => {
    assert.equal(
        parser.classifyVariation({
            path: '/content/dam/mas/acom/en_US/promotions/x/card',
            tags: [{ id: 'mas:promotion/cci' }],
        }).promotionName,
        'cci',
    );
});

test('a promo without a promotion tag is named after its promotions folder', () => {
    const v = parser.classifyVariation({ path: '/content/dam/mas/acom/en_US/promotions/cci/card', tags: [] });
    assert.equal(v.promotionName, 'cci');
});

test('a non-default locale path is a legacy locale variation', () => {
    assert.deepEqual(parser.classifyVariation({ path: '/content/dam/mas/acom/fr_CA/card', fields: {} }), {
        type: 'locale',
        audiences: [],
        promotionName: null,
        legacy: true,
    });
});

test('a default-locale fragment that is neither grouped nor promo has no variation type', () => {
    assert.equal(parser.classifyVariation({ path: '/content/dam/mas/acom/en_US/card', fields: {} }).type, null);
});

test('a grouped variation under en_US reports isVariation', () => {
    const info = parser.parseVariationInfo({ path: '/content/dam/mas/acom/en_US/ccsn/pzn/cc-lapsed', fields: {} });
    assert.equal(info.isVariation, true);
    assert.equal(info.variationType, 'grouped');
});

test('extractVariations puts a promotions/ path without a tag in the promo bucket', () => {
    const buckets = parser.extractVariations({
        fields: { variations: ['a'] },
        references: { a: { id: 'a', path: '/content/dam/mas/acom/en_US/promotions/cci/card', tags: [] } },
    });
    assert.equal(buckets.promo.length, 1);
});

test('extractVariations gives grouped buckets their audiences', () => {
    const buckets = parser.extractVariations({
        fields: { variations: ['a'] },
        references: {
            a: {
                id: 'a',
                path: '/content/dam/mas/acom/en_US/ccsn/pzn/cc-lapsed',
                fields: { pznTags: ['mas:pzn/cc-lapsed'] },
            },
        },
    });
    assert.deepEqual(buckets.grouped[0].audiences, ['cc-lapsed']);
});

test('the popup summary labels a parent with variations and lists them', () => {
    const s = parser.summarizeVariationInfo({
        locale: 'en_US',
        isVariation: false,
        variationType: null,
        localeDefaultLocale: null,
        variations: { locale: [], promo: [{ promotionName: 'cci' }], grouped: [{ audiences: ['cc-lapsed'], name: 'n' }] },
    });
    assert.equal(s.typeLabel, 'Default (Parent)');
    assert.deepEqual(s.variationLabels, ['Promotion variation · cci', 'Grouped variation · cc-lapsed']);
});

test('the popup summary marks a locale variation as legacy', () => {
    const s = parser.summarizeVariationInfo({
        locale: 'fr_CA',
        isVariation: true,
        variationType: 'locale',
        localeDefaultLocale: 'fr_FR',
        variations: { locale: [], promo: [], grouped: [] },
    });
    assert.equal(s.typeLabel, 'Locale variation (legacy)');
    assert.equal(s.parentLocale, 'fr_FR');
});
