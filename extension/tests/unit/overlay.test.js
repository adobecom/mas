const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

const source = readFileSync(resolve(__dirname, '../../content/overlay.js'), 'utf8');
const SOURCE_ID = '11111111-1111-1111-1111-111111111111';
const PARENT_ID = '22222222-2222-2222-2222-222222222222';
const variationInfo = { locale: 'fr_FR', localeDefaultLocale: 'en_US' };

function createFixture() {
    const requests = [];
    const opened = [];
    const parent = { id: PARENT_ID, path: '/content/dam/mas/acom/en_US/parent', fields: [] };
    const window = {
        MASCardDetector: { getServiceConfig: () => ({ apiKey: 'test-api-key' }) },
        MASStudioLinker: {
            openParentInStudio: (variation, id) => opened.push({ variation, id }),
        },
    };
    const chrome = {
        runtime: {
            sendMessage: (request, callback) => {
                requests.push(request);
                callback({ success: true, data: parent });
            },
        },
    };
    runInNewContext(source, { window, chrome });
    const overlay = window.MASCardOverlay;
    for (const overlayId of ['field-1', 'price-1', 'cta-1', SOURCE_ID]) {
        overlay.overlays.set(overlayId, { cardData: { sourceFragmentId: SOURCE_ID } });
    }
    return { overlay, requests, opened, parent };
}

for (const overlayId of ['field-1', 'price-1', 'cta-1', SOURCE_ID]) {
    test(`Parent fetch for ${overlayId} uses the source fragment UUID`, () => {
        const { overlay, requests } = createFixture();

        overlay.openParentFragment(overlayId, variationInfo);

        assert.equal(requests[0].fragmentId, SOURCE_ID);
    });
}

test('Parent fetch requests the locale-default locale, not the displayed variation locale', () => {
    const { overlay, requests } = createFixture();

    overlay.openParentFragment('field-1', variationInfo);

    assert.equal(requests[0].locale, 'en_US');
});

test('Parent navigation opens the returned locale-default fragment', () => {
    const { overlay, opened } = createFixture();

    overlay.openParentFragment('field-1', variationInfo);

    assert.equal(opened[0].id, PARENT_ID);
    assert.equal(opened[0].variation, variationInfo);
});

test('Parent response is cached under the source fragment and locale-default locale', () => {
    const { overlay, parent } = createFixture();

    overlay.openParentFragment('field-1', variationInfo);

    assert.equal(overlay.fragmentDataCache.get(`${SOURCE_ID}|en_US|`), parent);
});

test('Parent navigation uses a cached source-fragment parent without fetching again', () => {
    const { overlay, requests, opened, parent } = createFixture();
    overlay.fragmentDataCache.set(`${SOURCE_ID}|en_US|`, parent);

    overlay.openParentFragment('field-1', variationInfo);

    assert.equal(requests.length, 0);
    assert.equal(opened[0].id, PARENT_ID);
});

test('different overlays for the same source fragment share the parent response', () => {
    const { overlay, requests } = createFixture();
    overlay.openParentFragment('field-1', variationInfo);

    overlay.openParentFragment('price-1', variationInfo);

    assert.equal(requests.length, 1);
});

const CARD_NAME = 'Create at the highest level.';

test('a field panel title names its card and its field', () => {
    const { overlay } = createFixture();
    assert.equal(
        overlay.panelTitle({ cardName: CARD_NAME, elementType: 'field', variant: 'subtitle' }),
        `${CARD_NAME} · subtitle`,
    );
});

test('a price panel title names its card and its role', () => {
    const { overlay } = createFixture();
    assert.equal(overlay.panelTitle({ cardName: CARD_NAME, elementType: 'price', variant: 'plans' }), `${CARD_NAME} · price`);
});

test('a card panel title is the card name alone', () => {
    const { overlay } = createFixture();
    assert.equal(overlay.panelTitle({ cardName: CARD_NAME, elementType: 'card', variant: 'plans' }), CARD_NAME);
});

test('a collection panel title keeps its prefix', () => {
    const { overlay } = createFixture();
    assert.equal(overlay.panelTitle({ cardName: 'Plans', elementType: 'collection' }), 'Collection: Plans');
});

test('a field still named after itself does not repeat its name', () => {
    const { overlay } = createFixture();
    assert.equal(overlay.panelTitle({ cardName: 'subtitle', elementType: 'field', variant: 'subtitle' }), 'subtitle');
});

test('a card name arriving later keeps the field in an open panel title', () => {
    const { overlay } = createFixture();
    const header = { textContent: '' };
    const cardData = { cardName: 'Come back', elementType: 'field', variant: 'subtitle' };
    overlay.overlays.set('field-9', { cardData, panel: { querySelector: () => header } });
    overlay.updateCardNameInPanel('field-9', CARD_NAME);
    assert.equal(header.textContent, `${CARD_NAME} · subtitle`);
});

test('a wheel over the panel scrolls the panel instead of reaching the page', () => {
    const { overlay } = createFixture();
    const listeners = [];
    overlay.keepWheelInside({ addEventListener: (type, listener, options) => listeners.push({ type, listener, options }) });
    let stopped = false;
    listeners[0].listener({ stopPropagation: () => (stopped = true) });
    assert.deepEqual([listeners[0].type, listeners[0].options.passive, stopped], ['wheel', true, true]);
});
