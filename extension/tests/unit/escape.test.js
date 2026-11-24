const { test } = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtmlText, escapeHtmlAttr, plainText } = require('../../utils/escape.js');

test('escapeHtmlText escapes <, >, &', () => {
    assert.equal(escapeHtmlText('<script>'), '&lt;script&gt;');
    assert.equal(escapeHtmlText('a & b'), 'a &amp; b');
});

test('escapeHtmlText leaves quotes alone (text context)', () => {
    assert.equal(escapeHtmlText('"hi"'), '"hi"');
    assert.equal(escapeHtmlText("'hi'"), "'hi'");
});

test('escapeHtmlText handles empty and null safely', () => {
    assert.equal(escapeHtmlText(''), '');
    assert.equal(escapeHtmlText(null), '');
    assert.equal(escapeHtmlText(undefined), '');
});

test('escapeHtmlText escapes & first to avoid double-encoding', () => {
    assert.equal(escapeHtmlText('&lt;'), '&amp;lt;');
});

test('escapeHtmlAttr escapes <, >, &, ", \'', () => {
    assert.equal(escapeHtmlAttr('"><img>'), '&quot;&gt;&lt;img&gt;');
    assert.equal(escapeHtmlAttr("' onerror=alert(1)"), '&#39; onerror=alert(1)');
});

test('escapeHtmlAttr preserves non-special characters', () => {
    assert.equal(escapeHtmlAttr('abc-123_xyz'), 'abc-123_xyz');
});

test('escapeHtmlAttr handles empty and null safely', () => {
    assert.equal(escapeHtmlAttr(''), '');
    assert.equal(escapeHtmlAttr(null), '');
    assert.equal(escapeHtmlAttr(undefined), '');
});

test('escapeHtmlAttr ordering: & escaped before < to avoid double-encoding', () => {
    assert.equal(escapeHtmlAttr('&"'), '&amp;&quot;');
});

test('escapeHtmlAttr handles surrogate pairs without splitting', () => {
    assert.equal(escapeHtmlAttr('🎉'), '🎉');
});

test('plainText drops the markup of a rich-text title', () => {
    assert.equal(plainText('<strong>Create at the highest level.</strong>'), 'Create at the highest level.');
});

test('plainText decodes the entities rich text uses', () => {
    assert.equal(
        plainText('Save&nbsp;55% &amp; more &lt;now&gt; &quot;CC&quot; &#39;Pro&#39;'),
        'Save 55% & more <now> "CC" \'Pro\'',
    );
});

test('plainText handles empty and null safely', () => {
    assert.deepEqual([plainText(''), plainText(null), plainText(undefined)], ['', '', '']);
});
