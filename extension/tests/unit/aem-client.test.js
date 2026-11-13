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

const FRAGMENT_ID = '369630bd-47aa-4eeb-9660-0fa52158d910';

function respond(status, body) {
    global.fetch = async () => ({ ok: status < 400, status, statusText: '', text: async () => body });
}

async function missFor(status, body) {
    respond(status, body);
    const error = await new AEMClient().fetchFragmentData(FRAGMENT_ID, 'en_GB', 'IN').catch((e) => e);
    return error.miss;
}

test('a 404 naming a DAM path reports the language the fragment has no copy in', async () => {
    const body = JSON.stringify({
        message: 'Fragment with identifier /content/dam/mas/acom/en_GB/ccsn_direct_individual/pzn/cc-lapsed not found',
    });
    assert.deepEqual(await missFor(404, body), { kind: 'missing-locale', locale: 'en_GB' });
});

test('a 404 naming the id reports the fragment as not found', async () => {
    const body = JSON.stringify({ message: `Fragment with identifier ${FRAGMENT_ID} not found` });
    assert.deepEqual(await missFor(404, body), { kind: 'not-found' });
});

test('a 404 with an unreadable body reports the fragment as not found', async () => {
    assert.deepEqual(await missFor(404, 'not json'), { kind: 'not-found' });
});

test('a server error carries no miss', async () => {
    assert.equal(await missFor(503, '{}'), undefined);
});

async function errorsLoggedFor(status, body) {
    const logged = [];
    const original = console.error;
    console.error = (...args) => logged.push(args);
    try {
        await missFor(status, body);
    } finally {
        console.error = original;
    }
    return logged.length;
}

test('a 404 is an answer, not logged as an error', async () => {
    assert.equal(
        await errorsLoggedFor(404, JSON.stringify({ message: `Fragment with identifier ${FRAGMENT_ID} not found` })),
        0,
    );
});

test('a server error is still logged', async () => {
    assert.equal(await errorsLoggedFor(503, '{}'), 1);
});
