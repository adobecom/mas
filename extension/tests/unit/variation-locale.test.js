const { test } = require('node:test');
const assert = require('node:assert/strict');

const { FragmentParser } = require('../../utils/fragment-parser.js');

const parser = new FragmentParser();

const servedFrFr = {
    id: '1063beaf-7843-420d-a0fb-88d43e78cd9c',
    path: '/content/dam/mas/acom/fr_FR/create111111',
    fields: {},
};

test('reports the served locale when the request was not a fallback', () => {
    const info = parser.parseVariationInfo(servedFrFr, 'fr_FR');
    assert.equal(info.locale, 'fr_FR');
    assert.equal(info.requestedLocale, 'fr_FR');
    assert.equal(info.fellBackToDefault, false);
});

test('flags the fallback when a regional locale resolves to its parent', () => {
    const info = parser.parseVariationInfo(servedFrFr, 'fr_CA');
    assert.equal(info.requestedLocale, 'fr_CA');
    assert.equal(info.locale, 'fr_FR');
    assert.equal(info.fellBackToDefault, true);
});

test('does not flag a fallback when no requested locale is supplied', () => {
    const info = parser.parseVariationInfo(servedFrFr);
    assert.equal(info.requestedLocale, null);
    assert.equal(info.fellBackToDefault, false);
});

test('keeps served-path fields untouched by the fallback comparison', () => {
    const info = parser.parseVariationInfo(servedFrFr, 'fr_CA');
    assert.equal(info.surface, 'acom');
    assert.equal(info.fragmentPath, 'create111111');
});
