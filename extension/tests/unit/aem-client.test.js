const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AEMClient } = require('../../api/aem-client.js');

test('uses the extension WCS API key', () => {
    assert.equal(new AEMClient().wcsApiKey, 'wcms-commerce-ims-ro-user-milo-extension');
});

test('fragment URL carries id, api_key and locale', async () => {
    const client = new AEMClient();
    let requested;
    global.fetch = async (url) => {
        requested = url;
        return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => '{}' };
    };

    await client.fetchFragmentData('86248907-1cb6-4d1e-8b3f-a42dee95d9bc', 'en_US');

    const params = new URL(requested).searchParams;
    assert.equal(params.get('id'), '86248907-1cb6-4d1e-8b3f-a42dee95d9bc');
    assert.equal(params.get('api_key'), 'wcms-commerce-ims-ro-user-milo-extension');
    assert.equal(params.get('locale'), 'en_US');
});

test('country is appended only when it differs from the locale', async () => {
    const client = new AEMClient();
    const urls = [];
    global.fetch = async (url) => {
        urls.push(url);
        return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => '{}' };
    };

    await client.fetchFragmentData('86248907-1cb6-4d1e-8b3f-a42dee95d9bc', 'en_US', 'US');
    await client.fetchFragmentData('86248907-1cb6-4d1e-8b3f-a42dee95d9bc', 'en_US', 'CA');

    assert.equal(new URL(urls[0]).searchParams.get('country'), null);
    assert.equal(new URL(urls[1]).searchParams.get('country'), 'CA');
});

test('rejects a malformed locale before calling the network', async () => {
    const client = new AEMClient();
    global.fetch = async () => assert.fail('fetch must not be called for an invalid locale');

    await assert.rejects(() => client.fetchFragmentData('86248907-1cb6-4d1e-8b3f-a42dee95d9bc', 'en-US'), /Invalid locale/);
});
