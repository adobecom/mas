const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

function load({ existing = null, allowed = true } = {}) {
    const invokeAsyncAction = sinon.stub().resolves({ activationId: 'act-1' });
    const writeJob = sinon.stub().resolves();
    const readJob = sinon.stub().resolves(existing);
    const patchJob = sinon.stub().resolves();
    const mod = proxyquire('../../src/bulk-edit/bulk-edit.js', {
        '../../utils.js': {
            errorResponse: (statusCode, message) => ({ error: { statusCode, body: { error: message } } }),
            getBearerToken: () => 'token',
            isAllowed: async () => allowed,
            parseOwBody: (p) => p,
            '@noCallThru': true,
        },
        '../common.js': {
            invokeAsyncAction,
            buildSiblingActionName: (params, name) => `MerchAtScaleStudio/${name}`,
            '@noCallThru': true,
        },
        './state.js': { readJob, writeJob, patchJob, '@noCallThru': true },
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
    });
    return { mod, invokeAsyncAction, writeJob, readJob, patchJob };
}

const findParams = { type: 'find', find: 'school', surface: 'acom', searchIn: '*' };

describe('bulk-edit: computeJobId', () => {
    it('is stable for identical params and tag order', () => {
        const { mod } = load();
        const a = mod.computeJobId({ ...findParams, tags: ['b', 'a'] });
        const b = mod.computeJobId({ ...findParams, tags: ['a', 'b'] });
        expect(a).to.equal(b);
    });
    it('changes when a search field changes', () => {
        const { mod } = load();
        expect(mod.computeJobId(findParams)).to.not.equal(mod.computeJobId({ ...findParams, find: 'academy' }));
    });
});

describe('bulk-edit: handlePost', () => {
    it('creates a job, invokes the find worker, returns 202 reused:false', async () => {
        const { mod, invokeAsyncAction, writeJob } = load();
        const res = await mod.handlePost(findParams);
        expect(res.statusCode).to.equal(202);
        expect(res.body.reused).to.equal(false);
        expect(res.body.jobId).to.be.a('string');
        expect(writeJob.calledOnce).to.equal(true);
        expect(invokeAsyncAction.calledOnce).to.equal(true);
        expect(invokeAsyncAction.firstCall.args[0]).to.equal('MerchAtScaleStudio/bulk-edit-find-worker');
        expect(invokeAsyncAction.firstCall.args[1]).to.deep.equal({ jobId: res.body.jobId });
    });
    it('reuses a RUNNING job without writing or invoking', async () => {
        const { mod, invokeAsyncAction, writeJob } = load({ existing: { status: 'RUNNING' } });
        const res = await mod.handlePost(findParams);
        expect(res.statusCode).to.equal(202);
        expect(res.body.reused).to.equal(true);
        expect(writeJob.called).to.equal(false);
        expect(invokeAsyncAction.called).to.equal(false);
    });
    it('reuses a DONE job (cached results)', async () => {
        const { mod, invokeAsyncAction } = load({ existing: { status: 'DONE' } });
        const res = await mod.handlePost(findParams);
        expect(res.body.reused).to.equal(true);
        expect(invokeAsyncAction.called).to.equal(false);
    });
    it('recreates when the existing job FAILED', async () => {
        const { mod, invokeAsyncAction, writeJob } = load({ existing: { status: 'FAILED' } });
        const res = await mod.handlePost(findParams);
        expect(res.body.reused).to.equal(false);
        expect(writeJob.calledOnce).to.equal(true);
        expect(invokeAsyncAction.calledOnce).to.equal(true);
    });
    it('400s an unsupported type', async () => {
        const { mod } = load();
        const res = await mod.handlePost({ type: 'replace', find: 'x', surface: 'acom' });
        expect(res.error.statusCode).to.equal(400);
    });
    it('400s missing required inputs', async () => {
        const { mod } = load();
        const res = await mod.handlePost({ type: 'find', surface: 'acom' });
        expect(res.error.statusCode).to.equal(400);
    });
    it('401s a disallowed caller', async () => {
        const { mod } = load({ allowed: false });
        const res = await mod.handlePost(findParams);
        expect(res.error.statusCode).to.equal(401);
    });
    it('cancels a superseded RUNNING job before starting the new one', async () => {
        const { mod, readJob, patchJob, writeJob } = load();
        readJob.withArgs('old-job').resolves({ status: 'RUNNING' });
        const res = await mod.handlePost({ ...findParams, supersedes: 'old-job' });
        expect(patchJob.calledWith('old-job', { cancelled: true })).to.equal(true);
        expect(writeJob.calledOnce).to.equal(true);
        expect(res.body.reused).to.equal(false);
    });
    it('does not cancel a superseded job that is not RUNNING', async () => {
        const { mod, readJob, patchJob } = load();
        readJob.withArgs('old-job').resolves({ status: 'DONE' });
        await mod.handlePost({ ...findParams, supersedes: 'old-job' });
        expect(patchJob.called).to.equal(false);
    });
    it('does not reuse a RUNNING job already flagged cancelled', async () => {
        const { mod, invokeAsyncAction, writeJob } = load({ existing: { status: 'RUNNING', cancelled: true } });
        const res = await mod.handlePost(findParams);
        expect(res.body.reused).to.equal(false);
        expect(writeJob.calledOnce).to.equal(true);
        expect(invokeAsyncAction.calledOnce).to.equal(true);
    });
});

describe('bulk-edit: handleGet', () => {
    it('returns a RUNNING delta sliced by offset', async () => {
        const { mod } = load({ existing: { status: 'RUNNING', total: 3, results: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } });
        const res = await mod.handleGet({ jobId: 'j', offset: '1' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.done).to.equal(false);
        expect(res.body.items.map((i) => i.id)).to.deep.equal(['b', 'c']);
    });
    it('returns done:true on DONE', async () => {
        const { mod } = load({ existing: { status: 'DONE', total: 1, results: [{ id: 'a' }], truncated: false } });
        const res = await mod.handleGet({ jobId: 'j', offset: '0' });
        expect(res.body.done).to.equal(true);
    });
    it('500s on FAILED with partial total', async () => {
        const { mod } = load({ existing: { status: 'FAILED', error: 'boom', total: 2 } });
        const res = await mod.handleGet({ jobId: 'j' });
        expect(res.error.statusCode).to.equal(500);
        expect(res.error.body.total).to.equal(2);
    });
    it('returns done:true on CANCELLED (200)', async () => {
        const { mod } = load({ existing: { status: 'CANCELLED', total: 2, results: [{ id: 'a' }, { id: 'b' }] } });
        const res = await mod.handleGet({ jobId: 'j', offset: '0' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.done).to.equal(true);
    });
    it('404s an unknown jobId', async () => {
        const { mod } = load({ existing: null });
        const res = await mod.handleGet({ jobId: 'nope' });
        expect(res.error.statusCode).to.equal(404);
    });
    it('400s a missing jobId', async () => {
        const { mod } = load();
        const res = await mod.handleGet({});
        expect(res.error.statusCode).to.equal(400);
    });
});

describe('bulk-edit: main routing', () => {
    it('does not let the request body override the injected allowedClientId', async () => {
        const isAllowed = sinon.stub().resolves(true);
        const mod = proxyquire('../../src/bulk-edit/bulk-edit.js', {
            '../../utils.js': {
                errorResponse: (statusCode, message) => ({ error: { statusCode, body: { error: message } } }),
                getBearerToken: () => 'token',
                isAllowed,
                parseOwBody: (p) => ({ ...p, allowedClientId: 'attacker-client' }),
                '@noCallThru': true,
            },
            '../common.js': {
                invokeAsyncAction: sinon.stub().resolves({ activationId: 'a' }),
                buildSiblingActionName: (params, name) => `MerchAtScaleStudio/${name}`,
                '@noCallThru': true,
            },
            './state.js': { readJob: sinon.stub().resolves(null), writeJob: sinon.stub().resolves(), '@noCallThru': true },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
        });
        await mod.main({ __ow_method: 'post', allowedClientId: 'mas-studio', type: 'find', find: 'x', surface: 'acom' });
        expect(isAllowed.firstCall.args[1]).to.equal('mas-studio');
    });
    it('routes POST to handlePost', async () => {
        const { mod } = load();
        const res = await mod.main({ __ow_method: 'post', ...findParams });
        expect(res.statusCode).to.equal(202);
    });
    it('routes GET to handleGet', async () => {
        const { mod } = load({ existing: { status: 'RUNNING', total: 0, results: [] } });
        const res = await mod.main({ __ow_method: 'get', jobId: 'j' });
        expect(res.statusCode).to.equal(200);
    });
    it('405s an unsupported method', async () => {
        const { mod } = load();
        const res = await mod.main({ __ow_method: 'delete' });
        expect(res.error.statusCode).to.equal(405);
    });
});
