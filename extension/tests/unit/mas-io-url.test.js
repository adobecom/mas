const { test } = require('node:test');
const assert = require('node:assert/strict');

const { AEMClient } = require('../../api/aem-client.js');
const { isAllowedMasIOUrl } = require('../../utils/validators.js');

global.window = { MASLocales: require('../../utils/locales.js') };
const { CardDetector } = require('../../utils/card-detector.js');

const FRAGMENT_ID = '86248907-1cb6-4d1e-8b3f-a42dee95d9bc';

function captureUrl() {
    const captured = {};
    global.fetch = async (url) => {
        captured.url = url;
        return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => '{}' };
    };
    return captured;
}

test('falls back to the production IO base when the page supplies none', async () => {
    const captured = captureUrl();
    await new AEMClient().fetchFragmentData(FRAGMENT_ID, 'en_US');
    assert.ok(captured.url.startsWith('https://www.adobe.com/mas/io/fragment'));
});

test('uses the IO base the page declares', async () => {
    const captured = captureUrl();
    const client = new AEMClient({ masIOUrl: 'https://www.stage.adobe.com/mas/io' });
    await client.fetchFragmentData(FRAGMENT_ID, 'en_US');
    assert.ok(captured.url.startsWith('https://www.stage.adobe.com/mas/io/fragment'));
});

test('ignores an IO base that is not an allowed Adobe host', async () => {
    const captured = captureUrl();
    const client = new AEMClient({ masIOUrl: 'https://evil.example.com/mas/io' });
    await client.fetchFragmentData(FRAGMENT_ID, 'en_US');
    assert.ok(captured.url.startsWith('https://www.adobe.com/mas/io/fragment'));
});

test('uses the WCS api key the page declares', async () => {
    const captured = captureUrl();
    const client = new AEMClient({ wcsApiKey: 'wcms-commerce-ims-ro-user-milo' });
    await client.fetchFragmentData(FRAGMENT_ID, 'en_US');
    assert.equal(new URL(captured.url).searchParams.get('api_key'), 'wcms-commerce-ims-ro-user-milo');
});

test('reads the IO base and api key off mas-commerce-service', () => {
    global.document = {
        querySelector: () => ({
            getAttribute: (name) =>
                ({ 'mas-io-url': 'https://www.stage.adobe.com/mas/io', 'wcs-api-key': 'some-key' })[name] || null,
        }),
    };
    assert.deepEqual(new CardDetector().getServiceConfig(), {
        masIOUrl: 'https://www.stage.adobe.com/mas/io',
        wcsApiKey: 'some-key',
    });
});

test('returns an empty config when the page has no commerce service', () => {
    global.document = { querySelector: () => null };
    assert.deepEqual(new CardDetector().getServiceConfig(), {});
});

test('accepts adobe.com IO bases over https', () => {
    assert.equal(isAllowedMasIOUrl('https://www.adobe.com/mas/io'), true);
    assert.equal(isAllowedMasIOUrl('https://www.stage.adobe.com/mas/io'), true);
});

test('rejects look-alike hosts, non-https and malformed IO bases', () => {
    assert.equal(isAllowedMasIOUrl('https://adobe.com.evil.net/mas/io'), false);
    assert.equal(isAllowedMasIOUrl('http://www.adobe.com/mas/io'), false);
    assert.equal(isAllowedMasIOUrl('not-a-url'), false);
    assert.equal(isAllowedMasIOUrl(''), false);
    assert.equal(isAllowedMasIOUrl(null), false);
});
