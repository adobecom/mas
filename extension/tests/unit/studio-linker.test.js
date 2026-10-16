const { test } = require('node:test');
const assert = require('node:assert/strict');

const sent = [];
global.chrome = { runtime: { sendMessage: (message) => sent.push(message) } };
const { StudioLinker } = require('../../utils/studio-linker.js');
const { buildStudioUrl } = require('../../utils/studio-url.js');

const linker = new StudioLinker();

const CCD_FRAGMENT_ID = '12345678-1234-1234-1234-123456789abc';

function lastMessage() {
    return sent[sent.length - 1];
}

function hashParams(url) {
    return new URLSearchParams(url.split('#')[1]);
}

test('a card opens the content view scoped by its template variant', () => {
    linker.openInStudio('uuid-1', { variant: 'ccd-slice', locale: 'en_US', elementType: 'card' });
    const message = lastMessage();
    assert.equal(message.view, 'content');
    assert.equal(message.variant, 'ccd-slice');
    assert.equal(message.fragmentId, 'uuid-1');
});

test('a field opens its source fragment directly, carrying no variant', () => {
    linker.openInStudio('uuid-2', { variant: 'title', locale: 'en_US', elementType: 'field' });
    const message = lastMessage();
    assert.equal(message.view, 'fragment-editor');
    assert.equal(message.fragmentId, 'uuid-2');
    assert.equal(message.variant, undefined);
});

test('an unwrapped price opens its source fragment directly, not a content search', () => {
    linker.openInStudio(CCD_FRAGMENT_ID, { locale: 'en_US', elementType: 'price' });
    const message = lastMessage();
    assert.equal(message.view, 'fragment-editor');
    assert.equal(message.fragmentId, CCD_FRAGMENT_ID);
    assert.equal(message.variant, undefined);
});

test('an unwrapped CTA opens its source fragment directly, not a content search', () => {
    linker.openInStudio(CCD_FRAGMENT_ID, { locale: 'en_US', elementType: 'cta' });
    assert.equal(lastMessage().view, 'fragment-editor');
});

test('the final URL for an unwrapped price from a non-acom fragment targets the editor, not the acom surface', () => {
    linker.openInStudio(CCD_FRAGMENT_ID, { locale: 'en_US', elementType: 'price' });
    const params = hashParams(buildStudioUrl(lastMessage()));
    assert.equal(params.get('page'), 'fragment-editor');
    assert.equal(params.get('fragmentId'), CCD_FRAGMENT_ID);
    assert.equal(params.get('path'), null);
});
