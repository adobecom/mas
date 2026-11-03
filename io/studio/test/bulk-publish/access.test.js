const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('bulk-publish/access.js', () => {
    const orgId = '3B962FB55F5F922E0A495C88';
    const params = { __ow_method: 'get', __ow_headers: { authorization: 'Bearer caller-token' } };
    let action;
    let validateToken;
    let fetchStub;
    let originalFetch;

    function organizations(groupName, ident = orgId) {
        return [{ orgRef: { ident, authSrc: 'AdobeOrg' }, groups: [{ groupName }] }];
    }

    beforeEach(() => {
        originalFetch = global.fetch;
        validateToken = sinon.stub().resolves(true);
        fetchStub = sinon.stub().resolves({
            ok: true,
            json: async () => organizations('GRP-ODIN-MAS-ACOM-CURATORS'),
        });
        global.fetch = fetchStub;
        action = proxyquire('../../src/bulk-publish/access.js', {
            '../../utils.js': { isAllowed: validateToken },
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        sinon.restore();
    });

    it('allows a curator in the Studio organization', async () => {
        expect((await action.main(params)).body).to.deep.equal({ allowed: true });
    });

    it('allows an admin in the Studio organization', async () => {
        fetchStub.resolves({ ok: true, json: async () => organizations('GRP-ODIN-MAS-ADMINS') });
        expect((await action.main(params)).body).to.deep.equal({ allowed: true });
    });

    it('compares group names case-insensitively', async () => {
        fetchStub.resolves({ ok: true, json: async () => organizations('grp-odin-mas-acom-curators') });
        expect((await action.main(params)).body).to.deep.equal({ allowed: true });
    });

    it('denies editors without curator membership', async () => {
        fetchStub.resolves({ ok: true, json: async () => organizations('GRP-ODIN-MAS-NALA-EDITORS') });
        expect((await action.main(params)).body).to.deep.equal({ allowed: false });
    });

    it('denies identities without organization groups', async () => {
        fetchStub.resolves({ ok: true, json: async () => [] });
        expect((await action.main(params)).body).to.deep.equal({ allowed: false });
    });

    for (const status of [401, 403]) {
        it(`preserves IMS authorization failure status ${status}`, async () => {
            fetchStub.resolves({ ok: false, status });
            expect((await action.main(params)).error.statusCode).to.equal(status);
        });
    }

    it('ignores curator groups belonging to another organization', async () => {
        fetchStub.resolves({ ok: true, json: async () => organizations('GRP-ODIN-MAS-ACOM-CURATORS', 'untrusted') });
        expect((await action.main({ ...params, orgId: 'untrusted' })).body).to.deep.equal({ allowed: false });
    });

    it('does not trust an organization with a different authority', async () => {
        const data = organizations('GRP-ODIN-MAS-ACOM-CURATORS');
        data[0].orgRef.authSrc = 'untrusted';
        fetchStub.resolves({ ok: true, json: async () => data });
        expect((await action.main(params)).body).to.deep.equal({ allowed: false });
    });

    it('validates only the fixed Studio client and forwards only the caller token to fixed IMS', async () => {
        await action.main({ ...params, allowedClientId: 'untrusted', url: 'https://untrusted.example' });
        expect(validateToken.firstCall.args).to.deep.equal(['caller-token', 'mas-studio']);
        expect(fetchStub.firstCall.args[0]).to.equal('https://ims-na1.adobelogin.com/ims/organizations/v5');
        expect(fetchStub.firstCall.args[1].headers.Authorization).to.equal('Bearer caller-token');
        expect(fetchStub.firstCall.args[1].redirect).to.equal('error');
        expect(fetchStub.firstCall.args[1].signal).to.be.instanceOf(AbortSignal);
    });

    it('rejects missing bearer tokens without calling IMS', async () => {
        expect((await action.main({})).error.statusCode).to.equal(401);
        expect(fetchStub.called).to.be.false;
    });

    it('rejects tokens not issued for Studio', async () => {
        validateToken.resolves(false);
        expect((await action.main(params)).error.statusCode).to.equal(401);
        expect(fetchStub.called).to.be.false;
    });

    it('fails closed when token validation rejects', async () => {
        validateToken.rejects(new Error('validation unavailable'));
        expect((await action.main(params)).error.statusCode).to.equal(401);
        expect(fetchStub.called).to.be.false;
    });

    it('rejects non-GET requests', async () => {
        expect((await action.main({ ...params, __ow_method: 'post' })).error.statusCode).to.equal(405);
        expect(fetchStub.called).to.be.false;
    });

    it('fails closed on IMS errors without exposing their contents', async () => {
        fetchStub.rejects(new Error('caller-token'));
        const result = await action.main(params);
        expect(result.error.statusCode).to.equal(502);
        expect(JSON.stringify(result)).not.to.include('caller-token');
    });

    it('fails closed on an unsuccessful IMS response', async () => {
        fetchStub.resolves({ ok: false, status: 500 });
        expect((await action.main(params)).error.statusCode).to.equal(502);
    });

    it('fails closed on a malformed IMS response', async () => {
        fetchStub.resolves({ ok: true, json: async () => ({ error: 'unexpected' }) });
        expect((await action.main(params)).error.statusCode).to.equal(502);
    });

    it('prevents caching of user-specific authorization results', async () => {
        expect((await action.main(params)).headers['Cache-Control']).to.equal('no-store');
    });
});
