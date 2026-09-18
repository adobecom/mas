const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);
const { expect } = chai;

function createMockStateModule() {
    const store = new Map();
    return {
        readValue: sinon.stub().callsFake(async (key) => {
            const entry = store.get(key);
            if (!entry) return null;
            if (Date.now() >= entry.expiresAt) {
                store.delete(key);
                return null;
            }
            return entry.value;
        }),
        writeValue: sinon.stub().callsFake(async (key, value, ttl) => {
            store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
            return value;
        }),
    };
}

function tokenResponse(accessToken, expiresIn) {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ access_token: accessToken, expires_in: expiresIn }),
    };
}

describe('service-auth', () => {
    let mockStateModule;
    let serviceAuth;
    let fetchStub;
    let clock;
    let mockLogger;

    const params = {
        imsClientId: 'client-1',
        imsClientSecret: 'secret-1',
        imsScopes: 'AdobeID,openid,read_organizations',
        imsTokenUrl: 'https://ims-test.adobelogin.com/ims/token/v3',
    };

    beforeEach(function () {
        this.timeout(5000);
        mockStateModule = createMockStateModule();
        mockLogger = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() };
        serviceAuth = proxyquire('../../src/translation/service-auth.js', {
            './state.js': mockStateModule,
            '@adobe/aio-sdk': { Core: { Logger: sinon.stub().returns(mockLogger) } },
        });
        fetchStub = sinon.stub();
        global.fetch = fetchStub;
    });

    afterEach(() => {
        sinon.restore();
        if (clock) {
            clock.restore();
            clock = null;
        }
    });

    it('POSTs to the IMS token endpoint with a client-credentials body and returns the access token', async () => {
        fetchStub.resolves(tokenResponse('token-abc', 3600));

        const token = await serviceAuth.getServiceToken({ params });

        expect(token).to.equal('token-abc');
        expect(fetchStub).to.have.been.calledOnce;
        const [url, options] = fetchStub.firstCall.args;
        expect(url).to.equal(params.imsTokenUrl);
        expect(options.method).to.equal('POST');
        expect(options.headers['Content-Type']).to.equal('application/x-www-form-urlencoded');
        const body = new URLSearchParams(options.body);
        expect(body.get('client_id')).to.equal('client-1');
        expect(body.get('client_secret')).to.equal('secret-1');
        expect(body.get('grant_type')).to.equal('client_credentials');
        expect(body.get('scope')).to.equal('AdobeID,openid,read_organizations');
    });

    it('joins an array of imsScopes with commas per the IMS scope format', async () => {
        fetchStub.resolves(tokenResponse('token-abc', 3600));
        const arrayScopeParams = { ...params, imsScopes: ['AdobeID', 'openid', 'read_organizations'] };

        await serviceAuth.getServiceToken({ params: arrayScopeParams });

        const [, options] = fetchStub.firstCall.args;
        const body = new URLSearchParams(options.body);
        expect(body.get('scope')).to.equal('AdobeID,openid,read_organizations');
    });

    it('dedupes concurrent cold-cache calls into a single IMS request', async () => {
        fetchStub.resolves(tokenResponse('token-abc', 3600));

        const [first, second] = await Promise.all([
            serviceAuth.getServiceToken({ params }),
            serviceAuth.getServiceToken({ params }),
        ]);

        expect(first).to.equal('token-abc');
        expect(second).to.equal('token-abc');
        expect(fetchStub).to.have.been.calledOnce;
    });

    it('returns the cached token without re-invoking IMS within the cached lifetime', async () => {
        fetchStub.resolves(tokenResponse('token-abc', 3600));

        const first = await serviceAuth.getServiceToken({ params });
        const second = await serviceAuth.getServiceToken({ params });

        expect(first).to.equal('token-abc');
        expect(second).to.equal('token-abc');
        expect(fetchStub).to.have.been.calledOnce;
    });

    it('refreshes the token once the cached entry is within 5 minutes of expiry', async () => {
        clock = sinon.useFakeTimers(Date.now());
        fetchStub.onCall(0).resolves(tokenResponse('token-abc', 600));
        fetchStub.onCall(1).resolves(tokenResponse('token-def', 3600));

        const first = await serviceAuth.getServiceToken({ params });
        expect(first).to.equal('token-abc');

        clock.tick(5 * 60 * 1000 + 1000);

        const second = await serviceAuth.getServiceToken({ params });

        expect(second).to.equal('token-def');
        expect(fetchStub).to.have.been.calledTwice;
    });

    it('throws when the IMS token endpoint returns a non-2xx response', async () => {
        fetchStub.resolves({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: () => Promise.resolve({}),
        });

        let error;
        try {
            await serviceAuth.getServiceToken({ params });
        } catch (e) {
            error = e;
        }

        expect(error).to.be.instanceOf(Error);
    });

    it('throws instead of sending a request when client credentials or scopes are missing', async () => {
        let error;
        try {
            await serviceAuth.getServiceToken({ params: { ...params, imsClientId: undefined } });
        } catch (e) {
            error = e;
        }

        expect(error).to.be.instanceOf(Error);
        expect(fetchStub).to.not.have.been.called;
    });

    it('throws when the IMS response is missing access_token', async () => {
        fetchStub.resolves({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: () => Promise.resolve({ expires_in: 3600 }),
        });

        let error;
        try {
            await serviceAuth.getServiceToken({ params });
        } catch (e) {
            error = e;
        }

        expect(error).to.be.instanceOf(Error);
    });

    it('throws when the IMS response has a missing or non-numeric expires_in', async () => {
        fetchStub.resolves({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: () => Promise.resolve({ access_token: 'token-abc' }),
        });

        let error;
        try {
            await serviceAuth.getServiceToken({ params });
        } catch (e) {
            error = e;
        }

        expect(error).to.be.instanceOf(Error);
    });
});
