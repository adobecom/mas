const { test } = require('node:test');
const assert = require('node:assert/strict');

const { AEMClient } = require('../../api/aem-client.js');
const { resolveMasIOUrl } = require('../../utils/validators.js');

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
    const client = new AEMClient({ masIOUrl: 'www.stage.adobe.com' });
    await client.fetchFragmentData(FRAGMENT_ID, 'en_US');
    assert.ok(captured.url.startsWith('https://www.stage.adobe.com/mas/io/fragment'));
});

test('ignores an IO base that is not an allowed Adobe host', async () => {
    const captured = captureUrl();
    const client = new AEMClient({ masIOUrl: 'main--evil--repo.aem.page' });
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
            getAttribute: (name) => ({ 'mas-io-url': 'www.stage.adobe.com', 'wcs-api-key': 'some-key' })[name] || null,
        }),
    };
    assert.deepEqual(new CardDetector().getServiceConfig(), {
        masIOUrl: 'www.stage.adobe.com',
        wcsApiKey: 'some-key',
    });
});

test('returns an empty config when the page has no commerce service', () => {
    global.document = { querySelector: () => null };
    assert.deepEqual(new CardDetector().getServiceConfig(), {});
});

test('builds IO bases from runtime workspaces and adobe.com hosts', () => {
    const runtime = '.adobeioruntime.net/api/v1/web/MerchAtScale';
    assert.equal(resolveMasIOUrl('axel'), `https://14257-merchatscale-axel${runtime}`);
    assert.equal(resolveMasIOUrl('14257-merchatscale-qa'), `https://14257-merchatscale-qa${runtime}`);
    assert.equal(resolveMasIOUrl('www.adobe.com'), 'https://www.adobe.com/mas/io');
    assert.equal(resolveMasIOUrl('www.stage.adobe.com'), 'https://www.stage.adobe.com/mas/io');
});

test('keeps accepting full urls with an allowed host', () => {
    const runtime = '.adobeioruntime.net/api/v1/web/MerchAtScale';
    assert.equal(resolveMasIOUrl(`https://14257-merchatscale-axel${runtime}`), `https://14257-merchatscale-axel${runtime}`);
    assert.equal(resolveMasIOUrl('https://www.adobe.com/mas/io'), 'https://www.adobe.com/mas/io');
});

test('rejects foreign hosts, localhost and malformed IO bases', () => {
    for (const value of [
        'http://www.adobe.com/mas/io',
        'https://12345-evil.adobeioruntime.net/api/v1/web/MerchAtScale',
        'https://www.adobe.com@evil.com/mas/io',
        'main--evil--repo.aem.page',
        'adobe.com.evil.net',
        'evil.com/.adobe.com',
        '12345-evil.adobeioruntime.net',
        'localhost:2023',
        '',
        null,
    ]) {
        assert.equal(resolveMasIOUrl(value), undefined, String(value));
    }
});
