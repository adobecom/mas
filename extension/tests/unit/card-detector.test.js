const { test } = require('node:test');
const assert = require('node:assert/strict');

global.window = { MASLocales: require('../../utils/locales.js') };
const { CardDetector } = require('../../utils/card-detector.js');

const detector = new CardDetector();

test('resolves locale from language segment via MASLocales defaults', () => {
    assert.deepEqual(detector.localeFromUrl('/de/products/photoshop.html'), { locale: 'de_DE', country: 'DE' });
    assert.deepEqual(detector.localeFromUrl('/fr/creativecloud/plans.html'), { locale: 'fr_FR', country: 'FR' });
    assert.deepEqual(detector.localeFromUrl('/pt/x'), { locale: 'pt_BR', country: 'BR' });
});

test('maps URL segment aliases to canonical locales', () => {
    assert.deepEqual(detector.localeFromUrl('/jp/creativecloud.html'), { locale: 'ja_JP', country: 'JP' });
    assert.deepEqual(detector.localeFromUrl('/kr/x'), { locale: 'ko_KR', country: 'KR' });
    assert.deepEqual(detector.localeFromUrl('/tw/x'), { locale: 'zh_TW', country: 'TW' });
    assert.deepEqual(detector.localeFromUrl('/hk/x'), { locale: 'zh_HK', country: 'HK' });
    assert.deepEqual(detector.localeFromUrl('/no/x'), { locale: 'nb_NO', country: 'NO' });
});

test('applies second-segment country override', () => {
    assert.deepEqual(detector.localeFromUrl('/fr/ca/x'), { locale: 'fr_CA', country: 'CA' });
    assert.deepEqual(detector.localeFromUrl('/de/at/x'), { locale: 'de_AT', country: 'AT' });
});

test('returns null for langstore and non-locale segments', () => {
    assert.equal(detector.localeFromUrl('/langstore/en/x'), null);
    assert.equal(detector.localeFromUrl('/products/photoshop.html'), null);
    assert.equal(detector.localeFromUrl('/xx/x'), null);
    assert.equal(detector.localeFromUrl(''), null);
    assert.equal(detector.localeFromUrl(null), null);
});
