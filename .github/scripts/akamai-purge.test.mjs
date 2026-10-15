import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTimestamp, selectPurgePaths, signRequest } from './akamai-purge.mjs';

// Expected signatures come from Akamai's edgegrid-python (EdgeGridAuthHeaders.make_auth_header) with these dummy values.
const credentials = {
    host: 'akab-test.luna.akamaiapis.net',
    clientToken: 'akab-client-token-xxx',
    clientSecret: 'test-client-secret',
    accessToken: 'akab-access-token-xxx',
};
const timestamp = '20261014T22:15:00+0000';
const nonce = 'nonce-xx-0000';
const authPrefix =
    'EG1-HMAC-SHA256 client_token=akab-client-token-xxx;access_token=akab-access-token-xxx;timestamp=20261014T22:15:00+0000;nonce=nonce-xx-0000;';

test('formatTimestamp uses the EdgeGrid UTC format', () => {
    assert.equal(formatTimestamp(new Date('2026-10-14T22:15:00.123Z')), timestamp);
});

test('signRequest matches edgegrid-python for a GET with a query string', () => {
    const header = signRequest({
        method: 'GET',
        path: '/identity-management/v3/api-clients/self?apiAccess=true',
        credentials,
        timestamp,
        nonce,
    });
    assert.equal(header, `${authPrefix}signature=VgvwDWsiC4ifV+6j0SHH4TQWGugm3B6p/9Dm8fmldZk=`);
});

test('signRequest matches edgegrid-python for a POST, hashing the body', () => {
    const header = signRequest({
        method: 'POST',
        path: '/ccu/v3/invalidate/url/production',
        body: '{"objects":["https://mas.adobe.com/studio/src/studio.js"]}',
        credentials,
        timestamp,
        nonce,
    });
    assert.equal(header, `${authPrefix}signature=oydch4/ZN0J5dkaMo1z9BCLvTH6hPrJS6kUnOL+jEJI=`);
});

test('selectPurgePaths keeps only file types the mas.adobe.com property caches', () => {
    const paths = selectPurgePaths(
        [
            'studio/src/studio.js',
            'studio/style.css',
            'studio/img/logo.svg',
            'web-components/dist/mas.js',
            'studio/package.json',
            'studio/README.md',
            'studio/test/fixture.html',
            '',
        ].join('\n'),
    );
    assert.deepEqual(paths, ['studio/src/studio.js', 'studio/style.css', 'studio/img/logo.svg', 'web-components/dist/mas.js']);
});
