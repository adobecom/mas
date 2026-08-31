const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('fragment-usage/usage.js', () => {
    let usageAction;
    let mockIms;
    let fetchStub;

    const TOKEN = 'glsa_test_token_value';
    const baseParams = {
        __ow_headers: { authorization: 'Bearer ims-user-token' },
        fragmentId: '77fffd31-3a9d-4881-a5ed-455a28afc880',
        GRAFANA_SERVICE_TOKEN: TOKEN,
    };

    beforeEach(() => {
        mockIms = { validateToken: sinon.stub().resolves({ valid: true }) };
        fetchStub = sinon.stub();
        global.fetch = fetchStub;
        usageAction = proxyquire('../../src/fragment-usage/usage.js', {
            '@adobe/aio-lib-ims': { Ims: sinon.stub().returns(mockIms) },
        });
    });

    afterEach(() => sinon.restore());

    it('returns 401 when the caller IMS token is invalid', async () => {
        mockIms.validateToken.resolves({ valid: false });
        const result = await usageAction.main(baseParams);
        expect(result.statusCode).to.equal(401);
        expect(fetchStub.called).to.equal(false);
    });

    it('returns 400 for a missing or non-uuid-shaped fragmentId (no SQL injection)', async () => {
        expect((await usageAction.main({ ...baseParams, fragmentId: undefined })).statusCode).to.equal(400);
        expect((await usageAction.main({ ...baseParams, fragmentId: "x' OR '1'='1" })).statusCode).to.equal(400);
        expect(fetchStub.called).to.equal(false);
    });

    it('returns 503 when the Grafana service token input is absent', async () => {
        const result = await usageAction.main({ ...baseParams, GRAFANA_SERVICE_TOKEN: undefined });
        expect(result.statusCode).to.equal(503);
        expect(fetchStub.called).to.equal(false);
    });

    it('forwards to Grafana with the token in the auth header, and never leaks it in the body', async () => {
        const grafanaJson = { results: { A: { frames: [] } } };
        fetchStub.resolves({ ok: true, status: 200, json: async () => grafanaJson });
        const result = await usageAction.main(baseParams);

        expect(fetchStub.calledOnce).to.equal(true);
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.include('/api/ds/query');
        expect(opts.headers.Authorization).to.equal(`Bearer ${TOKEN}`);
        // server builds the SQL; the fragment id is bound, the client never supplies SQL
        expect(opts.body).to.include(baseParams.fragmentId);
        expect(opts.body).to.include('GROUP BY locale, api_key, country');

        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.equal(grafanaJson);
        // the service token must not appear anywhere in the response
        expect(JSON.stringify(result)).to.not.include(TOKEN);
    });

    it('passes through a non-ok Grafana status without leaking details', async () => {
        fetchStub.resolves({ ok: false, status: 403, json: async () => ({}) });
        const result = await usageAction.main(baseParams);
        expect(result.statusCode).to.equal(403);
        expect(JSON.stringify(result)).to.not.include(TOKEN);
    });
});
