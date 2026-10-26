const { test } = require('node:test');
const assert = require('node:assert/strict');

global.window = { MASLocales: require('../../utils/locales.js'), MASPromo: require('../../utils/promo.js') };
global.document = { documentElement: { clientHeight: 800, clientWidth: 800 } };
const { CardDetector, DETECTABLE_TAGS, waitForDetectableElement } = require('../../utils/card-detector.js');

const detector = new CardDetector();

const VISIBLE_BOX = { top: 0, left: 0, right: 120, bottom: 24, width: 120, height: 24 };
const HIDDEN_BOX = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };

function fakeBareElement({
    is,
    osi,
    promotionCode,
    insideCard = false,
    text = '',
    fragmentId = null,
    masFieldOwner = null,
    visible = true,
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
            return visible ? VISIBLE_BOX : HIDDEN_BOX;
        },
    };
}

function fakeMasField({
    fragmentId = null,
    field = 'title',
    text = '',
    insideCard = false,
    commerceChild = null,
    contentSpan = undefined,
    visible = true,
} = {}) {
    // mas-field renders its content inside a [data-role="mas-field-content"] span; a visible field
    // has a boxed span, a hidden responsive variant a zero-size one. Tests pass contentSpan: null to
    // model a field whose content element the detector must fall back past.
    const span =
        contentSpan === undefined ? { getBoundingClientRect: () => (visible ? VISIBLE_BOX : HIDDEN_BOX) } : contentSpan;
    return {
        tagName: 'MAS-FIELD',
        textContent: text,
        getAttribute(name) {
            if (name === 'fragment-id') return fragmentId;
            if (name === 'field') return field;
            return null;
        },
        closest(selector) {
            if (selector.includes('mas-field')) return this;
            return insideCard && selector.includes('merch-card') ? {} : null;
        },
        querySelector(selector) {
            if (selector.includes('mas-field-content')) return span;
            if (selector.includes('inline-price')) return commerceChild;
            return null;
        },
        querySelectorAll() {
            return [];
        },
        getBoundingClientRect() {
            return HIDDEN_BOX;
        },
        parentElement: null,
    };
}

function fakeCard({
    fragmentId = 'frag-1',
    variant = 'plans',
    name = 'Photoshop',
    tagName = 'MERCH-CARD',
    visible = true,
} = {}) {
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
            return visible ? VISIBLE_BOX : HIDDEN_BOX;
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

test('processBareElement skips a hidden (zero-size) price', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: 'abc123', visible: false }));
    assert.equal(d.detectedCards.size, 0);
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

test('processCard skips a hidden (zero-size) card', async () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    await d.processCard(fakeCard({ fragmentId: 'frag-card', visible: false }));
    assert.equal(d.detectedCards.size, 0);
});

test('processCard keeps the visible twin when a hidden duplicate shares its fragment id', async () => {
    // Responsive pages ship a desktop and a mobile-web copy of a card with the same fragment id;
    // whichever is walked first must not claim the fragment and leave the visible one unbadged.
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    await d.processCard(fakeCard({ fragmentId: 'dup', visible: false, name: 'Hidden' }));
    await d.processCard(fakeCard({ fragmentId: 'dup', visible: true, name: 'Visible' }));
    assert.equal(d.detectedCards.size, 1);
    assert.equal(d.detectedCards.get('dup').cardName, 'Visible');
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
    el.getAttribute = fakeMasField({ fragmentId: 'frag-late' }).getAttribute;
    d.processMasField(el);
    assert.equal(d.detectedCards.size, 1);
});

test('processMasField records a price field as a field, carrying the inner offer id', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    const commerceChild = {
        getAttribute: (name) => (name === 'data-wcs-osi' ? 'abc123' : null),
        getBoundingClientRect: () => VISIBLE_BOX,
    };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', field: 'price', commerceChild, contentSpan: null }));
    assert.equal(d.detectedCards.size, 1);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.elementType, 'field');
    assert.equal(data.variant, 'price');
    assert.equal(data.osi, 'abc123');
    assert.equal(data.anchorElement, commerceChild);
});

test('processBareElement skips a price rendered inside a mas-field', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processBareElement(fakeBareElement({ is: 'inline-price', osi: 'abc123', masFieldOwner: {} }));
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
    const contentSpan = { getBoundingClientRect: () => ({ top: 5, left: 5, bottom: 20, right: 40, width: 35, height: 15 }) };
    const el = fakeMasField({ fragmentId: 'frag-7', contentSpan });
    d.processMasField(el);
    const [[, data]] = d.detectedCards.entries();
    assert.equal(data.anchorElement, contentSpan);
    assert.equal(data.element, el);
});

test('fieldAnchor prefers the content span, then the commerce child, then the field itself', () => {
    const contentSpan = {};
    const commerceChild = {};
    const bare = fakeMasField({ contentSpan: null });
    assert.equal(detector.fieldAnchor(fakeMasField({ contentSpan, commerceChild })), contentSpan);
    assert.equal(detector.fieldAnchor(fakeMasField({ contentSpan: null, commerceChild })), commerceChild);
    assert.equal(detector.fieldAnchor(bare), bare);
});

test('processMasField skips a field that renders no visible content', () => {
    // A field whose content span and commerce child have no box is a hidden responsive variant;
    // badging it would pin an invisible badge, so it is not detected.
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', contentSpan: null }));
    assert.equal(d.detectedCards.size, 0);
});

test('processMasField skips a field hidden behind a zero-size content span', () => {
    const d = new CardDetector();
    d.pageLocale = { locale: 'en_US', country: 'US' };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', visible: false }));
    assert.equal(d.detectedCards.size, 0);
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
    const contentSpan = { getBoundingClientRect: () => ({ top: 5, left: 5, bottom: 20, right: 40, width: 35, height: 15 }) };
    d.processMasField(fakeMasField({ fragmentId: 'frag-7', field: 'title', contentSpan }));
    const [field] = d.getAllCards();
    assert.equal(field.sourceFragmentId, 'frag-7');
    assert.equal(field.elementType, 'field');
    assert.equal(field.boundingRect.right, 40);
});

function fakeCustomElements(definedTags) {
    const defined = new Set(definedTags);
    const waiters = new Map();
    return {
        whenDefined(tag) {
            if (defined.has(tag)) return Promise.resolve();
            return new Promise((resolve) => waiters.set(tag, resolve));
        },
        define(tag) {
            defined.add(tag);
            waiters.get(tag)?.();
        },
    };
}

test('the initial scan proceeds when mas-field defines but merch-card never does', async () => {
    const ce = fakeCustomElements(['mas-field']);
    await assert.doesNotReject(waitForDetectableElement(ce, DETECTABLE_TAGS));
});

test('the initial scan proceeds once a commerce element upgrades after start', async () => {
    const ce = fakeCustomElements([]);
    const ready = waitForDetectableElement(ce, DETECTABLE_TAGS);
    ce.define('inline-price');
    await assert.doesNotReject(ready);
});

test('detectable tags cover the commerce-only elements, not just merch-card', () => {
    assert.ok(DETECTABLE_TAGS.includes('mas-field'));
    assert.ok(DETECTABLE_TAGS.includes('inline-price'));
    assert.ok(DETECTABLE_TAGS.includes('merch-card'));
});

function fakeTarget({ box, parentElement = null } = {}) {
    let scrolled = false;
    const t = {
        style: {},
        parentElement,
        getBoundingClientRect: () => box,
        scrollIntoView: () => {
            scrolled = true;
        },
    };
    Object.defineProperty(t, 'scrolled', { get: () => scrolled });
    return t;
}

test('highlightCard scrolls the detected anchor into view', () => {
    const d = new CardDetector();
    const anchor = fakeTarget({ box: VISIBLE_BOX });
    d.detectedCards.set('x', { anchorElement: anchor });
    d.highlightCard('x');
    assert.equal(anchor.scrolled, true);
    assert.equal(anchor.style.outline, '3px solid #ff0000');
});

test('highlightCard climbs to the nearest boxed ancestor when the anchor has no box', () => {
    const d = new CardDetector();
    const parent = fakeTarget({ box: VISIBLE_BOX });
    const anchor = fakeTarget({ box: HIDDEN_BOX, parentElement: parent });
    d.detectedCards.set('x', { anchorElement: anchor });
    d.highlightCard('x');
    assert.equal(anchor.scrolled, false);
    assert.equal(parent.scrolled, true);
});

test('highlightCard does nothing when no ancestor renders a box', () => {
    const d = new CardDetector();
    const anchor = fakeTarget({ box: HIDDEN_BOX });
    d.detectedCards.set('x', { anchorElement: anchor });
    assert.doesNotThrow(() => d.highlightCard('x'));
    assert.equal(anchor.scrolled, false);
});

function commerceService(attrs) {
    return { getAttribute: (name) => attrs[name] ?? null };
}

// Starts a detector the way content.js does, on a page whose mas-commerce-service is whatever service() returns.
function startedDetector(service) {
    const saved = { document: global.document, MutationObserver: global.MutationObserver, location: window.location };
    global.document = {
        ...global.document,
        body: {},
        documentElement: { ...global.document.documentElement, lang: 'en' },
        querySelector: (selector) => (selector === 'mas-commerce-service' ? service() : null),
    };
    global.MutationObserver = class {
        observe() {}
    };
    window.location = { pathname: '/' };
    const log = console.log;
    console.log = () => {};
    const d = new CardDetector();
    d.initialize();
    console.log = log;
    const restore = () => {
        global.document = saved.document;
        global.MutationObserver = saved.MutationObserver;
        window.location = saved.location;
    };
    return { d, restore };
}

test('a detector started before Milo adds mas-commerce-service takes the locale Milo gives it later', () => {
    let service = null;
    const { d, restore } = startedDetector(() => service);
    try {
        service = commerceService({ locale: 'en_GB', country: 'IN', language: 'en' });
        assert.deepEqual(d.currentLocale(), { locale: 'en_GB', country: 'IN' });
    } finally {
        restore();
    }
});

test('without mas-commerce-service the locale falls back to en_US', () => {
    const { d, restore } = startedDetector(() => null);
    try {
        assert.deepEqual(d.currentLocale(), { locale: 'en_US', country: 'US' });
    } finally {
        restore();
    }
});
