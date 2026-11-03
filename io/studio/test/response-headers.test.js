const { expect } = require('chai');
const { exposeRequestId } = require('../src/response-headers.js');

const EXPOSE_HEADER = 'Access-Control-Expose-Headers';

describe('exposeRequestId', () => {
    it('exposes x-request-id to the browser', async () => {
        const main = exposeRequestId(async () => ({ statusCode: 200, body: {} }));
        const response = await main({});
        expect(response.headers[EXPOSE_HEADER]).to.equal('x-request-id');
    });

    it('keeps the status and body', async () => {
        const main = exposeRequestId(async () => ({ statusCode: 202, body: { accepted: true } }));
        const response = await main({});
        expect(response).to.include({ statusCode: 202 });
        expect(response.body).to.deep.equal({ accepted: true });
    });

    it('keeps the headers the action set', async () => {
        const main = exposeRequestId(async () => ({ statusCode: 200, headers: { 'Content-Type': 'text/csv' } }));
        const response = await main({});
        expect(response.headers['Content-Type']).to.equal('text/csv');
    });

    it('passes the params to the action', async () => {
        const main = exposeRequestId(async (params) => ({ statusCode: 200, body: params }));
        const response = await main({ a: 1 });
        expect(response.body).to.deep.equal({ a: 1 });
    });

    it('lets the action reject', async () => {
        const failure = new Error('boom');
        const main = exposeRequestId(async () => {
            throw failure;
        });
        const caught = await main({}).catch((err) => err);
        expect(caught).to.equal(failure);
    });
});

describe('Studio-facing actions', () => {
    [
        'members/list.js',
        'bulk-publish/access.js',
        'bulk-publish/index.js',
        'bulk-publish/revert-action.js',
        'bulk-publish/reset-action.js',
        'bulk-publish/check-modifications-action.js',
        'bulk-publish/save-snapshot-action.js',
        'bulk-edit/bulk-edit.js',
        'translation/project-start.js',
        'fragment-usage/usage.js',
        'ost-products/read.js',
    ].forEach((file) => {
        it(`${file} exposes x-request-id`, async () => {
            const { main } = require(`../src/${file}`);
            const response = await main({ __ow_method: 'options', __ow_headers: {} });
            expect(response.headers?.[EXPOSE_HEADER]).to.equal('x-request-id');
        }).timeout(10000);
    });
});
