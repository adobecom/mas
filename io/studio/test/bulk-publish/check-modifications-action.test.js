const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/check-modifications-action.js', function () {
    this.timeout(10000);
    let action, checkModificationsStub, isAllowedStub, checkMissingStub;
    const load = () =>
        proxyquire('../../src/bulk-publish/check-modifications-action.js', {
            './snapshot.js': { checkModifications: checkModificationsStub },
            '../../utils.js': {
                errorResponse: (status, message) => ({ statusCode: status, body: { error: message } }),
                checkMissingRequestInputs: checkMissingStub,
                getBearerToken: () => 'token',
                isAllowed: isAllowedStub,
                parseOwBody: (p) => p,
            },
        });

    beforeEach(() => {
        checkModificationsStub = sinon.stub().resolves([{ id: 'frag-1', modified: true }]);
        isAllowedStub = sinon.stub().resolves(true);
        checkMissingStub = sinon.stub().returns(null);
        action = load();
    });
    afterEach(() => sinon.restore());

    const valid = { odinEndpoint: 'https://odin', Authorization: 'Bearer token', entries: ['{"id":"frag-1"}'] };

    it('returns 200 with checkModifications results for a valid request', async () => {
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.equal([{ id: 'frag-1', modified: true }]);
        const callArg = checkModificationsStub.firstCall.args[0];
        expect(callArg.entries).to.deep.equal(valid.entries);
        expect(callArg.odinEndpoint).to.equal('https://odin');
        expect(callArg.authToken).to.equal('token');
    });

    it('returns 400 when neither aemOdinEndpoint nor odinEndpoint is provided', async () => {
        const { odinEndpoint, ...withoutEndpoint } = valid;
        const res = await action.main(withoutEndpoint);
        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.include('odinEndpoint');
        expect(checkModificationsStub).to.not.have.been.called;
    });

    it('returns 400 when required inputs are missing', async () => {
        checkMissingStub.returns('missing entries');
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(400);
        expect(checkModificationsStub).to.not.have.been.called;
    });

    it('returns 401 when auth fails', async () => {
        isAllowedStub.resolves(false);
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(401);
        expect(checkModificationsStub).to.not.have.been.called;
    });

    it('returns 400 when entries is not a non-empty array', async () => {
        const res = await action.main({ ...valid, entries: [] });
        expect(res.statusCode).to.equal(400);
        expect(res.body.error).to.include('non-empty array');
        expect(checkModificationsStub).to.not.have.been.called;
    });

    it('returns 500 and surfaces the error message when checkModifications rejects', async () => {
        checkModificationsStub.rejects(new Error('odin unreachable'));
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.equal('odin unreachable');
    });
});
