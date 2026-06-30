import { strict as assert } from 'assert';
import { test } from 'node:test';
import { getParentReference } from '../content/common.js';

const ROOT = '/content/dam/mas';

test('regional locale points to surface default', () => {
    // fr_CA is a region of fr_FR in express
    assert.equal(getParentReference('express', 'fr_CA'), `${ROOT}/express/fr_FR/dictionary/index`);
});

test('surface default locale points to acom default', () => {
    // fr_FR is a surface default in express; acom default for fr is fr_FR
    assert.equal(getParentReference('express', 'fr_FR'), `${ROOT}/acom/fr_FR/dictionary/index`);
});

test('acom locale has no parent', () => {
    assert.equal(getParentReference('acom', 'en_US'), null);
    assert.equal(getParentReference('acom', 'fr_FR'), null);
});

test('surface default whose acom equivalent exists resolves correctly', () => {
    // en_US is a surface default in express; acom default for en is en_US
    assert.equal(getParentReference('express', 'en_US'), `${ROOT}/acom/en_US/dictionary/index`);
});

test('sandbox surface default inherits from acom', () => {
    // sandbox uses ACOM locales; de_DE is a default locale
    assert.equal(getParentReference('sandbox', 'de_DE'), `${ROOT}/acom/de_DE/dictionary/index`);
});

test('sandbox regional locale points to surface default', () => {
    // de_AT is a region of de_DE in sandbox
    assert.equal(getParentReference('sandbox', 'de_AT'), `${ROOT}/sandbox/de_DE/dictionary/index`);
});
