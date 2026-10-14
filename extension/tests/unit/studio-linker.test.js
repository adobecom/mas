const { test } = require('node:test');
const assert = require('node:assert/strict');

const sent = [];
global.chrome = { runtime: { sendMessage: (message) => sent.push(message) } };
const { StudioLinker } = require('../../utils/studio-linker.js');

const linker = new StudioLinker();

function lastMessage() {
    return sent[sent.length - 1];
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

test('a bare price keeps the content view', () => {
    linker.openInStudio('uuid-3', { locale: 'en_US', elementType: 'price' });
    assert.equal(lastMessage().view, 'content');
});
