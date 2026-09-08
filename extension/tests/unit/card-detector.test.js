const { test } = require('node:test');
const assert = require('node:assert/strict');

global.window = { MASLocales: require('../../utils/locales.js'), MASPromo: require('../../utils/promo.js') };
global.document = { documentElement: { clientHeight: 800, clientWidth: 800 } };
const { CardDetector } = require('../../utils/card-detector.js');

const detector = new CardDetector();

function fakeBareElement({
    is,
    osi,
    promotionCode,
    insideCard = false,
    text = '',
    fragmentId = null,
    masFieldOwner = null,
} = {}) {
    return {
        tagName: is === 'inline-price' ? 'SPAN' : is === 'checkout-button' ? 'BUTTON' : 'A',
        textContent: text,
        getAttribute(name) {
            if (name === 'is') return is;
            if (name === 'data-wcs-osi') return osi ?? null;
            if (name === 'data-promotion-code') return promotionCode ?? null;
            if (name === 'fragment-id') return fragmentId;
            return null;
        },
        closest(selector) {
            if (selector.includes('mas-field')) return masFieldOwner;
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

function fakeMasField({
    fragmentId = null,
    field = 'title',
    text = '',
    insideCard = false,
    commerceChild = null,
    contentSpan = null,
    promotionCode = null,
} = {}) {
    return {
        tagName: 'MAS-FIELD',
        textContent: text,
        getAttribute(name) {
            if (name === 'fragment-id') return fragmentId;
            if (name === 'field') return field;
            if (name === 'data-promotion-code') return promotionCode;
            return null;
        },
        closest(selector) {
            if (selector.includes('mas-field')) return this;
            return insideCard && selector.includes('merch-card') ? {} : null;
        },
        querySelector(selector) {
            if (selector.includes('mas-field-content')) return contentSpan;
            if (selector.includes('inline-price')) return commerceChild;
            return null;
        },
        querySelectorAll() {
            return [];
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, bottom: 0, right: 0 };
        },
    };
}

function fakeCard({ fragmentId = 'frag-1', variant = 'plans', name = 'Photoshop', tagName = 'MERCH-CARD' } = {}) {
    const aemFragment = {
        getAttribute(attr) {
            if (attr === 'fragment') return fragmentId;
            if (attr === 'title') return name;
            return null;
        },
    };
    return {
        tagName,
        variant,
        getAttribute(attr) {
            return attr === 'variant' ? variant : null;
        },
        hasAttribute() {
            return false;
        },
        querySelector(selector) {
            return selector === 'aem-fragment' ? aemFragment : null;
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

test('resolveSourceFragmentId reads the fragment id stamped on the element itself', () => {
    const d = new CardDetector();
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123', fragmentId: 'stamped-id' });
    assert.equal(d.resolveSourceFragmentId(el), 'stamped-id');
});

test('resolveSourceFragmentId falls back to the enclosing mas-field', () => {
    const d = new CardDetector();
    const owner = fakeMasField({ fragmentId: 'owner-id' });
    const el = fakeBareElement({ is: 'inline-price', osi: 'abc123', masFieldOwner: owner });
    assert.equal(d.resolveSourceFragmentId(el), 'owner-id');
});

test('resolveSourceFragmentId returns null for a standalone commerce element', () => {
    const d = new CardDetector();
    assert.equal(d.resolveSourceFragmentId(fakeBareElement({ is: 'inline-price', osi: 'abc123' })), null);
});

test('processBareElement carries the source fragment id of a mas-field hosted price', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: 'abc123', fragmentId: 'frag-9' }));
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.sourceFragmentId, 'frag-9');
});

test('processBareElement leaves the source fragment id null for a standalone price', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: 'abc123' }));
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.sourceFragmentId, null);
});

test('processCard exposes its fragment id as the source fragment id', async () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    await d.processCard(fakeCard({ fragmentId: 'frag-card' }));
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.sourceFragmentId, 'frag-card');
});

test('processMasField records a loaded content field with its fragment id', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', field: 'title', text: 'Photoshop' }));
    assert.equal(d.detectedCards.size, 1);
    const [[id, data]] = d.detectedCards.entries();
    assert.match(id, /^field-\d+$/);
    assert.equal(data.elementType, 'field');
    assert.equal(data.sourceFragmentId, 'frag-7');
    assert.equal(data.variant, 'title');
    assert.equal(data.cardName, 'Photoshop');
});

test('processMasField falls back to the field name when the field renders no text', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', field: 'description', text: '' }));
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.cardName, 'description');
});

test('processMasField skips a field whose fragment has not loaded yet', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: null }));
    assert.equal(d.detectedCards.size, 0);
});

test('processMasField records a field that loads after an earlier skipped attempt', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeMasField({ fragmentId: null });
    d.processMasField(el);
    el.getAttribute = (name) => (name === 'fragment-id' ? 'frag-late' : name === 'field' ? 'title' : null);
    d.processMasField(el);
    assert.equal(d.detectedCards.size, 1);
});

test('processMasField defers to the inner commerce element when the field renders one', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', field: 'prices', commerceChild: {} }));
    assert.equal(d.detectedCards.size, 0);
});

test('processMasField skips fields nested inside a merch-card', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', insideCard: true }));
    assert.equal(d.detectedCards.size, 0);
});

test('processMasField does not create duplicate entries for the same field', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeMasField({ fragmentId: 'frag-7' });
    d.processMasField(el);
    d.processMasField(el);
    assert.equal(d.detectedCards.size, 1);
});

test('processMasField anchors positioning on the rendered content span', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const contentSpan = { getBoundingClientRect: () => ({ top: 5, left: 5, bottom: 20, right: 40 }) };
    const el = fakeMasField({ fragmentId: 'frag-7', contentSpan });
    d.processMasField(el);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.anchorElement, contentSpan);
    assert.equal(data.element, el);
});

test('processMasField anchors on the field itself when it has no content span', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const el = fakeMasField({ fragmentId: 'frag-7' });
    d.processMasField(el);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.anchorElement, el);
});

test('cards and bare elements anchor positioning on themselves', async () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const card = fakeCard();
    const price = fakeBareElement({ is: 'inline-price', osi: 'abc123' });
    await d.processCard(card);
    d.processBareElement(price);
    const [cardData, priceData] = [...d.detectedCards.values()];
    assert.equal(cardData.anchorElement, card);
    assert.equal(priceData.anchorElement, price);
});

test('getAllCards exposes the source fragment id and anchor rect for field elements', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const contentSpan = { getBoundingClientRect: () => ({ top: 5, left: 5, bottom: 20, right: 40 }) };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', field: 'title', contentSpan }));
    const [field] = d.getAllCards();
    assert.equal(field.sourceFragmentId, 'frag-7');
    assert.equal(field.elementType, 'field');
    assert.equal(field.boundingRect.right, 40);
});
