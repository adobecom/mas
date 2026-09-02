const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildStudioUrl, STUDIO_BASE_URL } = require('../../utils/studio-url.js');

const FRAGMENT_ID = '12345678-1234-1234-1234-123456789abc';

function hashParams(url) {
    return new URLSearchParams(url.split('#')[1]);
}

test('content view carries the card locale and surface path', () => {
    const url = buildStudioUrl({ view: 'content', fragmentId: FRAGMENT_ID, variant: 'catalog', locale: 'fr_FR' });
    assert.ok(url.startsWith(`${STUDIO_BASE_URL}/studio.html#`));
    const params = hashParams(url);
    assert.equal(params.get('page'), 'content');
    assert.equal(params.get('query'), FRAGMENT_ID);
    assert.equal(params.get('locale'), 'fr_FR');
    assert.equal(params.get('path'), 'acom');
});

test('content view falls back to en_US when no locale is given', () => {
    const url = buildStudioUrl({ view: 'content', fragmentId: FRAGMENT_ID, variant: 'ccd-slice' });
    const params = hashParams(url);
    assert.equal(params.get('locale'), 'en_US');
    assert.equal(params.get('path'), 'ccd');
});

test('content view maps unknown variants to the acom surface', () => {
    const url = buildStudioUrl({ view: 'content', fragmentId: FRAGMENT_ID, variant: 'mystery' });
    assert.equal(hashParams(url).get('path'), 'acom');
});

test('content view rejects invalid locale or fragment id', () => {
    assert.equal(buildStudioUrl({ view: 'content', fragmentId: FRAGMENT_ID, locale: 'javascript:alert(1)' }), null);
    assert.equal(buildStudioUrl({ view: 'content', fragmentId: 'not-a-uuid', locale: 'fr_FR' }), null);
});

test('fragment-editor view carries locale, surface, and fragment id', () => {
    const url = buildStudioUrl({
        view: 'fragment-editor',
        locale: 'de_DE',
        surface: 'acom',
        fragmentId: FRAGMENT_ID,
    });
    const params = hashParams(url);
    assert.equal(params.get('page'), 'fragment-editor');
    assert.equal(params.get('locale'), 'de_DE');
    assert.equal(params.get('path'), 'acom');
    assert.equal(params.get('fragmentId'), FRAGMENT_ID);
});

test('fragment-editor view omits fragmentId when not provided', () => {
    const url = buildStudioUrl({ view: 'fragment-editor', locale: 'de_DE', surface: 'acom' });
    assert.equal(hashParams(url).get('fragmentId'), null);
});

test('unknown views build no URL', () => {
    assert.equal(buildStudioUrl({ view: 'settings', fragmentId: FRAGMENT_ID }), null);
});
