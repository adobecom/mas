const { test } = require('node:test');
const assert = require('node:assert/strict');

global.window = { MASLocales: require('../../utils/locales.js'), MASPromo: require('../../utils/promo.js') };
global.document = { documentElement: { clientHeight: 800, clientWidth: 800 } };
const { CardDetector } = require('../../utils/card-detector.js');

const detector = new CardDetector();

function fakeBareElement({ is, osi, promotionCode, insideCard = false, text = '' } = {}) {
    return {
        tagName: is === 'inline-price' ? 'SPAN' : is === 'checkout-button' ? 'BUTTON' : 'A',
        textContent: text,
        getAttribute(name) {
            if (name === 'is') return is;
            if (name === 'data-wcs-osi') return osi ?? null;
            if (name === 'data-promotion-code') return promotionCode ?? null;
            return null;
        },
        closest(selector) {
            return insideCard && selector.includes('merch-card') ? {} : null;
        },
        querySelectorAll() {
            return [];
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, bottom: 0, right: 0 };
        },
    };
}

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

test('recognises country segments beyond the previously hardcoded subset', () => {
    assert.deepEqual(detector.localeFromUrl('/fr/be/x'), { locale: 'fr_BE', country: 'BE' });
    assert.deepEqual(detector.localeFromUrl('/es/mx/x'), { locale: 'es_MX', country: 'MX' });
    assert.deepEqual(detector.localeFromUrl('/en/sg/x'), { locale: 'en_SG', country: 'SG' });
});

test('ignores second segments that are not country codes', () => {
    assert.deepEqual(detector.localeFromUrl('/de/xx/x'), { locale: 'de_DE', country: 'DE' });
});

test('returns null for langstore and non-locale segments', () => {
    assert.equal(detector.localeFromUrl('/langstore/en/x'), null);
    assert.equal(detector.localeFromUrl('/products/photoshop.html'), null);
    assert.equal(detector.localeFromUrl('/xx/x'), null);
    assert.equal(detector.localeFromUrl(''), null);
    assert.equal(detector.localeFromUrl(null), null);
});

test('classifyBareElementType maps is="inline-price" to price', () => {
    assert.equal(detector.classifyBareElementType(fakeBareElement({ is: 'inline-price' })), 'price');
});

test('classifyBareElementType maps checkout-link/checkout-button to cta', () => {
    assert.equal(detector.classifyBareElementType(fakeBareElement({ is: 'checkout-link' })), 'cta');
    assert.equal(detector.classifyBareElementType(fakeBareElement({ is: 'checkout-button' })), 'cta');
});

test('classifyBareElementType returns null for unrelated elements', () => {
    assert.equal(detector.classifyBareElementType(fakeBareElement({ is: 'something-else' })), null);
});

test('isInsideCard detects elements nested under a merch-card', () => {
    assert.equal(detector.isInsideCard(fakeBareElement({ insideCard: true })), true);
    assert.equal(detector.isInsideCard(fakeBareElement({ insideCard: false })), false);
});

test('processBareElement skips elements nested inside a merch-card', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: 'abc123', insideCard: true }));
    assert.equal(d.detectedCards.size, 0);
});

test('processBareElement skips elements without data-wcs-osi', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: null }));
    assert.equal(d.detectedCards.size, 0);
});

test('processBareElement records a price element with synthetic id and osi', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123', text: '$19.99/mo' });
    d.processBareElement(el);
    assert.equal(d.detectedCards.size, 1);
    const [[id, data]] = d.detectedCards.entries();
    assert.match(id, /^price-\d+$/);
    assert.equal(data.elementType, 'price');
    assert.equal(data.osi, 'abc123');
    assert.equal(data.displayText, '$19.99/mo');
    assert.equal(data.fragmentId, id);
    assert.equal(data.cardName, '$19.99/mo');
});

test('processBareElement falls back to osi for cardName when the element has no rendered text', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123', text: '' });
    d.processBareElement(el);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.cardName, 'abc123');
});

test('processBareElement records a cta element as elementType cta', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'checkout-button', osi: 'xyz789', text: 'Buy now' }));
    const [[id, data]] = d.detectedCards.entries();
    assert.match(id, /^cta-\d+$/);
    assert.equal(data.elementType, 'cta');
});

test('processBareElement treats cancel-context as a sentinel, not a promo code', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123', promotionCode: 'cancel-context' });
    d.processBareElement(el);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.promotion.hasCancelContext, true);
    assert.equal(data.promotion.effectiveCode, null);
});

test('processBareElement surfaces a real promotion code', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123', promotionCode: 'SAVE20' });
    d.processBareElement(el);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.promotion.effectiveCode, 'SAVE20');
});

test('processBareElement does not create duplicate entries for the same element', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123' });
    d.processBareElement(el);
    d.processBareElement(el);
    assert.equal(d.detectedCards.size, 1);
});

test('getAllCards preserves promotion data for price/cta elements', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: 'abc123', promotionCode: 'SAVE20' }));
    const [card] = d.getAllCards();
    assert.equal(card.promotion.effectiveCode, 'SAVE20');
    assert.equal(card.osi, 'abc123');
    assert.equal(card.elementType, 'price');
});
