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
