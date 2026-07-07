const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/index.js — dispatcher', () => {
    let action, invokeAsyncActionStub, isAllowedStub;
    beforeEach(() => {
        invokeAsyncActionStub = sinon.stub().resolves({ activationId: 'act-1' });
        isAllowedStub = sinon.stub().resolves(true);
        action = proxyquire('../../src/bulk-publish/index.js', {
            '../common.js': {
                invokeAsyncAction: invokeAsyncActionStub,
                buildSiblingActionName: () => 'MerchAtScaleStudio/bulk-publish-worker',
            },
            '../../utils.js': {
                errorResponse: (status, message) => ({ statusCode: status, body: { error: message } }),
                checkMissingRequestInputs: () => null,
                getBearerToken: () => 'token',
                isAllowed: isAllowedStub,
                parseOwBody: (p) => p,
            },
        });
    });
    afterEach(() => sinon.restore());

    const valid = { odinEndpoint: 'https://odin', Authorization: 'Bearer token', projectId: 'proj-1', publishedBy: 'u@x.com' };

    it('returns 202 and invokes the worker with projectId, publishedBy, authToken', async () => {
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(202);
        const [name, params] = invokeAsyncActionStub.firstCall.args;
        expect(name).to.equal('MerchAtScaleStudio/bulk-publish-worker');
        expect(params.projectId).to.equal('proj-1');
        expect(params.publishedBy).to.equal('u@x.com');
        expect(params.authToken).to.equal('token');
        expect(params).to.not.have.property('odinEndpoint');
    });

    it('returns 400 and does not invoke worker when projectId missing', async () => {
        action = proxyquire('../../src/bulk-publish/index.js', {
            '../common.js': {
                invokeAsyncAction: invokeAsyncActionStub,
                buildSiblingActionName: () => 'MerchAtScaleStudio/bulk-publish-worker',
            },
            '../../utils.js': {
                errorResponse: (status, message) => ({ statusCode: status, body: { error: message } }),
                checkMissingRequestInputs: (params, required) =>
                    required.includes('projectId') && !params.projectId ? 'missing projectId' : null,
                getBearerToken: () => 'token',
                isAllowed: isAllowedStub,
                parseOwBody: (p) => p,
            },
        });
        const res = await action.main({ ...valid, projectId: undefined });
        expect(res.statusCode).to.equal(400);
        expect(invokeAsyncActionStub).to.not.have.been.called;
    });

    it('returns 401 when auth fails', async () => {
        isAllowedStub.resolves(false);
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(401);
        expect(invokeAsyncActionStub).to.not.have.been.called;
    });

    it('returns 500 when invoking the worker rejects', async () => {
        invokeAsyncActionStub.rejects(new Error('Request defines parameters that are not allowed'));
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.equal('Internal server error');
    });

    it('forwards includeCards and includeVariations to the worker', async () => {
        const params = { ...valid, includeCards: true, includeVariations: false };
        await action.main(params);
        const [, workerParams] = invokeAsyncActionStub.firstCall.args;
        expect(workerParams.includeCards).to.equal(true);
        expect(workerParams.includeVariations).to.equal(false);
    });
});
