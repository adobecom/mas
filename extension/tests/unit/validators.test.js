const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl } = require('../../utils/validators.js');

test('UUID validator accepts canonical UUIDs', () => {
    assert.equal(isValidUUID('550e8400-e29b-41d4-a716-446655440000'), true);
});

test('UUID validator rejects non-UUIDs', () => {
    assert.equal(isValidUUID('../../../etc/passwd'), false);
    assert.equal(isValidUUID(''), false);
    assert.equal(isValidUUID(null), false);
    assert.equal(isValidUUID('550e8400-e29b-41d4-a716'), false);
    assert.equal(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra'), false);
});

test('Locale validator accepts aa_AA form', () => {
    assert.equal(isValidLocale('en_US'), true);
    assert.equal(isValidLocale('fr_CA'), true);
});

test('Locale validator rejects bad forms', () => {
    assert.equal(isValidLocale('en-US'), false);
    assert.equal(isValidLocale('en_us'), false);
    assert.equal(isValidLocale('en_US&admin=true'), false);
    assert.equal(isValidLocale(''), false);
    assert.equal(isValidLocale(null), false);
});

test('Country validator accepts AA form', () => {
    assert.equal(isValidCountry('US'), true);
    assert.equal(isValidCountry('JP'), true);
});

test('Country validator rejects bad forms', () => {
    assert.equal(isValidCountry('us'), false);
    assert.equal(isValidCountry('USA'), false);
    assert.equal(isValidCountry('U S'), false);
    assert.equal(isValidCountry(''), false);
    assert.equal(isValidCountry(null), false);
});

test('Open-URL allowlist accepts mas.adobe.com https', () => {
    assert.equal(isAllowedOpenUrl('https://mas.adobe.com/studio.html#x'), true);
});

test('Open-URL allowlist rejects evil hosts', () => {
    assert.equal(isAllowedOpenUrl('https://evil.com/studio.html'), false);
    assert.equal(isAllowedOpenUrl('javascript:alert(1)'), false);
    assert.equal(isAllowedOpenUrl('data:text/html,<script>...</script>'), false);
    assert.equal(isAllowedOpenUrl('http://mas.adobe.com/studio.html'), false);
});

test('Open-URL allowlist rejects malformed URLs', () => {
    assert.equal(isAllowedOpenUrl(''), false);
    assert.equal(isAllowedOpenUrl(null), false);
    assert.equal(isAllowedOpenUrl('not a url'), false);
});
