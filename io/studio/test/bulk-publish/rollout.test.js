const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/rollout.js — rolloutLocales', () => {
    let rollout;
    let postToOdinWithRetryStub;
    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';

    beforeEach(() => {
        postToOdinWithRetryStub = sinon.stub().resolves(true);
        rollout = proxyquire('../../src/bulk-publish/rollout.js', {
            '../common.js': { postToOdinWithRetry: postToOdinWithRetryStub, fetchFragmentByPath: sinon.stub() },
        });
    });

    afterEach(() => sinon.restore());

    it('POSTs one localeSync item per content path with target locales', async () => {
        const ok = await rollout.rolloutLocales({
            odinEndpoint,
            authToken,
            items: [{ contentPath: '/content/dam/mas/acom/en_US/a', targetLocales: ['es_MX', 'fr_CA'] }],
        });

        expect(ok).to.be.true;
        expect(postToOdinWithRetryStub).to.have.been.calledOnce;
        const [endpoint, uri, token, payload] = postToOdinWithRetryStub.firstCall.args;
        expect(endpoint).to.equal(odinEndpoint);
        expect(uri).to.equal('/bin/localeSync');
        expect(token).to.equal(authToken);
        expect(payload).to.deep.equal({
            items: [{ contentPath: '/content/dam/mas/acom/en_US/a', targetLocales: ['es_MX', 'fr_CA'], syncNestedCFs: false }],
        });
    });

    it('returns false when the localeSync POST fails', async () => {
        postToOdinWithRetryStub.rejects(new Error('boom'));
        const ok = await rollout.rolloutLocales({
            odinEndpoint,
            authToken,
            items: [{ contentPath: '/p', targetLocales: ['es_MX'] }],
        });
        expect(ok).to.be.false;
    });
});

describe('bulk-publish/rollout.js — waitForFragments', () => {
    let rollout;
    let fetchFragmentByPathStub;
    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';

    beforeEach(() => {
        fetchFragmentByPathStub = sinon.stub();
        rollout = proxyquire('../../src/bulk-publish/rollout.js', {
            '../common.js': { postToOdinWithRetry: sinon.stub(), fetchFragmentByPath: fetchFragmentByPathStub },
        });
    });

    afterEach(() => sinon.restore());

    it('returns ready paths that resolve to status 200 and pending paths that stay 404', async () => {
        fetchFragmentByPathStub.withArgs(odinEndpoint, '/ready', authToken).resolves({ fragment: { id: 'x' }, status: 200 });
        fetchFragmentByPathStub.withArgs(odinEndpoint, '/pending', authToken).resolves({ fragment: null, status: 404 });

        const clock = sinon.useFakeTimers();
        const promise = rollout.waitForFragments({
            odinEndpoint,
            authToken,
            paths: ['/ready', '/pending'],
            maxAttempts: 3,
        });
        await clock.tickAsync(20000);
        const result = await promise;
        clock.restore();

        expect(result.ready).to.deep.equal(['/ready']);
        expect(result.pending).to.deep.equal(['/pending']);
    });
});
