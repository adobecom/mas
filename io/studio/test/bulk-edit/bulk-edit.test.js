const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { HEADERS } = require('../../src/bulk-edit/csv.js');

const csvHeaderLine = HEADERS.join(',');

function load({ existing = null, userCsv = null, allowed = true } = {}) {
    const invokeAsyncAction = sinon.stub().resolves({ activationId: 'act-1' });
    const writeJob = sinon.stub().resolves();
    const readJob = sinon.stub().resolves(existing);
    const patchJob = sinon.stub().resolves();
    const readUserCsv = sinon.stub().resolves(userCsv);
    const writeUserCsv = sinon.stub().resolves();
    const deleteUserCsv = sinon.stub().resolves();
    const readDryRun = sinon.stub().resolves(null);
    const readReport = sinon.stub().resolves(null);
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
        './state.js': {
            readJob,
            writeJob,
            patchJob,
            readUserCsv,
            writeUserCsv,
            deleteUserCsv,
            readDryRun,
            readReport,
            '@noCallThru': true,
        },
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
    });
    return {
        mod,
        invokeAsyncAction,
        writeJob,
        readJob,
        patchJob,
        readUserCsv,
        writeUserCsv,
        deleteUserCsv,
        readDryRun,
        readReport,
    };
}

const findParams = {
    type: 'find',
    find: 'school',
    surface: 'acom',
    searchIn: '*',
    odinEndpoint: 'https://odin.example',
};

const doneJobResults = [
    {
        id: 'frag-1',
        path: '/content/dam/mas/acom/en_US/foo',
        locale: 'en_US',
        status: 'PUBLISHED',
        etag: 'e1',
        matches: [
            { field: 'subtitle', value: 'school' },
            { field: 'tags', value: 'tag-a' },
        ],
    },
    {
        id: 'frag-2',
        path: '/content/dam/mas/acom/en_US/bar',
        locale: 'en_US',
        status: 'PUBLISHED',
        etag: 'e2',
        matches: [{ field: 'subtitle', value: 'academy' }],
    },
];

const doneJob = { status: 'DONE', total: 2, results: doneJobResults };

const sampleCsvRow =
    `${csvHeaderLine}\n` +
    'frag-1,/content/dam/mas/acom/en_US/foo,en_US,subtitle,school,academy,e1,PUBLISHED\n';

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
    it('is stable for equivalent single and array searchIn', () => {
        const { mod } = load();
        expect(mod.computeJobId({ ...findParams, searchIn: 'subtitle' })).to.equal(
            mod.computeJobId({ ...findParams, searchIn: ['subtitle'] }),
        );
    });
    it('is stable for searchIn array order', () => {
        const { mod } = load();
        const a = mod.computeJobId({ ...findParams, searchIn: ['calloutText', 'subtitle'] });
        const b = mod.computeJobId({ ...findParams, searchIn: ['subtitle', 'calloutText'] });
        expect(a).to.equal(b);
    });
    it('changes when searchIn scopes change', () => {
        const { mod } = load();
        expect(mod.computeJobId({ ...findParams, searchIn: 'subtitle' })).to.not.equal(
            mod.computeJobId({ ...findParams, searchIn: ['subtitle', 'calloutText'] }),
        );
    });
    it('is stable for equivalent single and array locale', () => {
        const { mod } = load();
        expect(mod.computeJobId({ ...findParams, locale: 'en_US' })).to.equal(
            mod.computeJobId({ ...findParams, locale: ['en_US'] }),
        );
    });
    it('is stable for locale array order', () => {
        const { mod } = load();
        const a = mod.computeJobId({ ...findParams, locale: ['fr_FR', 'en_US'] });
        const b = mod.computeJobId({ ...findParams, locale: ['en_US', 'fr_FR'] });
        expect(a).to.equal(b);
    });
    it('changes when locale scopes change', () => {
        const { mod } = load();
        expect(mod.computeJobId({ ...findParams, locale: 'en_US' })).to.not.equal(
            mod.computeJobId({ ...findParams, locale: ['en_US', 'fr_FR'] }),
        );
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
        const invokeArgs = invokeAsyncAction.firstCall.args[1];
        expect(invokeArgs.jobId).to.equal(res.body.jobId);
        expect(invokeArgs.authToken).to.equal('token');
        expect(invokeArgs.runId).to.be.a('string');
    });
    it('does not persist the auth token in job state', async () => {
        const { mod, writeJob, invokeAsyncAction } = load();
        await mod.handlePost(findParams);
        expect(writeJob.firstCall.args[1]).to.not.have.property('authToken');
        expect(writeJob.firstCall.args[1].runId).to.equal(invokeAsyncAction.firstCall.args[1].runId);
    });
    it('400s when odinEndpoint is missing, without persisting a job', async () => {
        const { mod, invokeAsyncAction, writeJob } = load();
        const { odinEndpoint, ...withoutEndpoint } = findParams;
        const res = await mod.handlePost(withoutEndpoint);
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('odinEndpoint');
        expect(invokeAsyncAction.called).to.equal(false);
        expect(writeJob.called).to.equal(false);
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
        const res = await mod.handlePost({ type: 'bogus', find: 'x', surface: 'acom' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include("unsupported type 'bogus'");
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
    it('re-runs a DONE job when forceRefresh is true', async () => {
        const { mod, invokeAsyncAction, writeJob, deleteUserCsv } = load({
            existing: { status: 'DONE', results: [{ id: 'a' }], total: 1 },
        });
        const res = await mod.handlePost({ ...findParams, forceRefresh: true });
        expect(res.statusCode).to.equal(202);
        expect(res.body.reused).to.equal(false);
        expect(deleteUserCsv.calledOnceWith(res.body.jobId)).to.equal(true);
        expect(writeJob.calledOnce).to.equal(true);
        expect(invokeAsyncAction.calledOnce).to.equal(true);
    });
    it('does not clear uploaded CSV without forceRefresh', async () => {
        const { mod, deleteUserCsv } = load({ existing: { status: 'DONE' } });
        await mod.handlePost(findParams);
        expect(deleteUserCsv.called).to.equal(false);
    });
    it('supersedes a RUNNING job with a fresh runId when forceRefresh is true', async () => {
        const { mod, readJob, patchJob, invokeAsyncAction, writeJob } = load();
        readJob.resolves({ status: 'RUNNING', runId: 'old-run' });
        const res = await mod.handlePost({ ...findParams, forceRefresh: true });
        expect(patchJob.called).to.equal(false);
        expect(writeJob.calledOnce).to.equal(true);
        const newRunId = writeJob.firstCall.args[1].runId;
        expect(newRunId).to.be.a('string');
        expect(newRunId).to.not.equal('old-run');
        expect(invokeAsyncAction.firstCall.args[1].runId).to.equal(newRunId);
        expect(res.body.reused).to.equal(false);
    });
    it('accepts forceRefresh as the string "true"', async () => {
        const { mod, invokeAsyncAction } = load({ existing: { status: 'DONE' } });
        const res = await mod.handlePost({ ...findParams, forceRefresh: 'true' });
        expect(res.body.reused).to.equal(false);
        expect(invokeAsyncAction.calledOnce).to.equal(true);
    });
});

describe('bulk-edit: handleGet', () => {
    it('returns a page of items using offset and default limit', async () => {
        const { mod } = load({ existing: { status: 'RUNNING', total: 3, results: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } });
        const res = await mod.handleGet({ jobId: 'j', offset: '1' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.done).to.equal(false);
        expect(res.body.offset).to.equal(1);
        expect(res.body.limit).to.equal(50);
        expect(res.body.items.map((i) => i.id)).to.deep.equal(['b', 'c']);
    });
    it('pages results with offset and limit like AEM fragment search', async () => {
        const results = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
        const { mod } = load({ existing: { status: 'DONE', total: 5, results } });
        const first = await mod.handleGet({ jobId: 'j', offset: '0', limit: '2' });
        expect(first.body.offset).to.equal(0);
        expect(first.body.limit).to.equal(2);
        expect(first.body.total).to.equal(5);
        expect(first.body.items.map((i) => i.id)).to.deep.equal(['a', 'b']);
        const second = await mod.handleGet({ jobId: 'j', offset: '2', limit: '2' });
        expect(second.body.items.map((i) => i.id)).to.deep.equal(['c', 'd']);
    });
    it('caps limit at 50', async () => {
        const { mod } = load({ existing: { status: 'DONE', total: 1, results: [{ id: 'a' }] } });
        const res = await mod.handleGet({ jobId: 'j', limit: '200' });
        expect(res.body.limit).to.equal(50);
    });
    it('returns done:true on DONE', async () => {
        const { mod } = load({ existing: { status: 'DONE', total: 1, results: [{ id: 'a' }] } });
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
    it('filters JSON items when a user CSV upload exists', async () => {
        const { mod } = load({
            existing: doneJob,
            userCsv: {
                rows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school' }],
            },
        });
        const res = await mod.handleGet({ jobId: 'job-1' });
        expect(res.body.filteredByUpload).to.equal(true);
        expect(res.body.total).to.equal(1);
        expect(res.body.items).to.have.lengthOf(1);
        expect(res.body.items[0].matches).to.deep.equal([{ field: 'subtitle', value: 'school' }]);
    });
    it('returns CSV with Content-Disposition when jobId ends in .csv', async () => {
        const { mod } = load({ existing: doneJob });
        const res = await mod.handleGet({ jobId: 'job-1.csv' });
        expect(res.statusCode).to.equal(200);
        expect(res.headers['Content-Type']).to.equal('text/csv; charset=utf-8');
        expect(res.headers['Content-Disposition']).to.equal('attachment; filename="job-1.csv"');
        expect(res.body).to.include(csvHeaderLine);
        expect(res.body).to.include('frag-1');
        expect(res.body).to.include('school');
    });
    it('400s CSV download while job is still RUNNING', async () => {
        const { mod } = load({ existing: { status: 'RUNNING', total: 0, results: [] } });
        const res = await mod.handleGet({ jobId: 'job-1.csv' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('not ready for CSV export');
    });
});

describe('bulk-edit: handleCsvUpload', () => {
    const csvPost = {
        jobId: 'job-1',
        __ow_body: sampleCsvRow,
        __ow_headers: { authorization: 'Bearer token', 'content-type': 'text/csv' },
    };

    it('stores parsed rows and returns 202', async () => {
        const { mod, writeUserCsv } = load({ existing: doneJob });
        const res = await mod.handleCsvUpload(csvPost);
        expect(res.statusCode).to.equal(202);
        expect(res.body.rowsAccepted).to.equal(1);
        expect(writeUserCsv.calledOnce).to.equal(true);
        expect(writeUserCsv.firstCall.args[0]).to.equal('job-1');
        expect(writeUserCsv.firstCall.args[1].rows).to.have.lengthOf(1);
    });
    it('400s when jobId is missing', async () => {
        const { mod } = load({ existing: doneJob });
        const res = await mod.handleCsvUpload({ __ow_body: sampleCsvRow });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('jobId');
    });
    it('400s when CSV body is empty', async () => {
        const { mod } = load({ existing: doneJob });
        const res = await mod.handleCsvUpload({ jobId: 'job-1', __ow_body: '  ' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('missing CSV body');
    });
    it('400s when a CSV row is not in the original job', async () => {
        const { mod } = load({ existing: doneJob });
        const badCsv = `${csvHeaderLine}\nmissing,/p,en_US,subtitle,x,,e1,PUBLISHED\n`;
        const res = await mod.handleCsvUpload({ jobId: 'job-1', __ow_body: badCsv });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('not found in job results');
    });
    it('400s upload on a RUNNING job', async () => {
        const { mod } = load({ existing: { status: 'RUNNING', results: [] } });
        const res = await mod.handleCsvUpload(csvPost);
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('not ready for upload');
    });
    it('400s JSON upload type via handlePost', async () => {
        const { mod } = load({ existing: doneJob });
        const res = await mod.handlePost({ type: 'upload', jobId: 'job-1', csv: sampleCsvRow });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include("unsupported type 'upload'");
    });
});

const findJobDone = { type: 'find', status: 'DONE', params: { matchCase: false }, results: doneJobResults };
const replaceCsv = {
    uploadedAt: '2026-01-01T00:00:00.000Z',
    rows: [{ fragment_id: 'frag-1', path: '/p/foo', locale: 'en_US', field: 'subtitle', find: 'school', replace: 'academy' }],
};

describe('bulk-edit: computeReplaceJobId', () => {
    it('produces a structured replace.{find12}.{mode}.{csv8} id', () => {
        const { mod } = load();
        const id = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, userCsv: replaceCsv });
        expect(id).to.match(/^replace\.abcdef012345\.live\.[0-9a-f]{8}$/);
    });
    it('distinguishes dry from live runs', () => {
        const { mod } = load();
        const dry = mod.computeReplaceJobId('abcdef0123456789', { dryRun: true, userCsv: replaceCsv });
        const live = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, userCsv: replaceCsv });
        expect(dry).to.not.equal(live);
        expect(dry).to.include('.dry.');
    });
    it('changes when the CSV rows change', () => {
        const { mod } = load();
        const a = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, userCsv: replaceCsv });
        const b = mod.computeReplaceJobId('abcdef0123456789', {
            dryRun: false,
            userCsv: { rows: [{ ...replaceCsv.rows[0], replace: 'campus' }] },
        });
        expect(a).to.not.equal(b);
    });
});

describe('bulk-edit: handleReplacePost', () => {
    const replaceParams = { type: 'replace', findJobId: 'find-1', odinEndpoint: 'https://odin.example' };

    function loadReplace(extra = {}) {
        const ctx = load({ userCsv: replaceCsv, ...extra });
        ctx.readJob.withArgs('find-1').resolves(findJobDone);
        return ctx;
    }

    it('creates a replace job and invokes the replace worker', async () => {
        const ctx = loadReplace();
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.statusCode).to.equal(202);
        expect(res.body.reused).to.equal(false);
        expect(res.body.dryRun).to.equal(false);
        expect(res.body.jobId).to.match(/^replace\./);
        expect(ctx.writeJob.calledOnce).to.equal(true);
        const written = ctx.writeJob.firstCall.args[1];
        expect(written.type).to.equal('replace');
        expect(written.findJobId).to.equal('find-1');
        expect(written.total).to.equal(1);
        expect(ctx.invokeAsyncAction.firstCall.args[0]).to.equal('MerchAtScaleStudio/bulk-edit-replace-worker');
    });
    it('passes dryRun through and marks the job', async () => {
        const ctx = loadReplace();
        const res = await ctx.mod.handlePost({ ...replaceParams, dryRun: true });
        expect(res.body.dryRun).to.equal(true);
        expect(ctx.writeJob.firstCall.args[1].dryRun).to.equal(true);
    });
    it('404s when the find job is missing', async () => {
        const ctx = load({ userCsv: replaceCsv });
        ctx.readJob.withArgs('find-1').resolves(null);
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.error.statusCode).to.equal(404);
    });
    it('400s when the find job is not DONE', async () => {
        const ctx = load({ userCsv: replaceCsv });
        ctx.readJob.withArgs('find-1').resolves({ status: 'RUNNING' });
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('not ready');
    });
    it('400s when no replace values were uploaded', async () => {
        const ctx = load({ userCsv: null });
        ctx.readJob.withArgs('find-1').resolves(findJobDone);
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('no replace values');
    });
    it('400s when findJobId is missing', async () => {
        const { mod } = load();
        const res = await mod.handlePost({ type: 'replace', odinEndpoint: 'https://odin.example' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('findJobId');
    });
    it('reuses an existing RUNNING replace job', async () => {
        const ctx = load({ userCsv: replaceCsv });
        ctx.readJob.withArgs('find-1').resolves(findJobDone);
        ctx.readJob.resolves({ type: 'replace', status: 'RUNNING' });
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.body.reused).to.equal(true);
        expect(ctx.writeJob.called).to.equal(false);
        expect(ctx.invokeAsyncAction.called).to.equal(false);
    });
});

describe('bulk-edit: handleReplaceGet', () => {
    it('paginates real-run results and exposes counters + report on DONE', async () => {
        const job = {
            type: 'replace',
            dryRun: false,
            status: 'DONE',
            processed: 2,
            succeeded: 1,
            skipped: 1,
            failed: 0,
            conflicts: 0,
            results: [
                { id: 'a', status: 'REPLACED' },
                { id: 'b', status: 'SKIPPED' },
            ],
        };
        const ctx = load({ existing: job });
        ctx.readReport.resolves({ dryRun: false, totalFragments: 2 });
        const res = await ctx.mod.handleGet({ jobId: 'replace.x.live.y', limit: '1' });
        expect(res.body.dryRun).to.equal(false);
        expect(res.body.total).to.equal(2);
        expect(res.body.items.map((i) => i.id)).to.deep.equal(['a']);
        expect(res.body.succeeded).to.equal(1);
        expect(res.body.report.totalFragments).to.equal(2);
        expect(ctx.readDryRun.called).to.equal(false);
    });
    it('sources items from the dry-run list for a dry-run job', async () => {
        const job = { type: 'replace', dryRun: true, status: 'DONE', results: [] };
        const ctx = load({ existing: job });
        ctx.readDryRun.resolves([{ id: 'a', status: 'WOULD_REPLACE' }]);
        const res = await ctx.mod.handleGet({ jobId: 'replace.x.dry.y' });
        expect(ctx.readDryRun.calledOnce).to.equal(true);
        expect(res.body.items[0].status).to.equal('WOULD_REPLACE');
    });
    it('exports the dry-run list as CSV with status populated', async () => {
        const job = { type: 'replace', dryRun: true, status: 'DONE', results: [] };
        const ctx = load({ existing: job });
        ctx.readDryRun.resolves([
            {
                id: 'a',
                path: '/p/a',
                locale: 'en_US',
                status: 'WOULD_REPLACE',
                matches: [{ field: 'subtitle', value: 'school' }],
            },
        ]);
        const res = await ctx.mod.handleGet({ jobId: 'replace.x.dry.y.csv' });
        expect(res.headers['Content-Type']).to.equal('text/csv; charset=utf-8');
        expect(res.body).to.include('WOULD_REPLACE');
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
            './state.js': {
                readJob: sinon.stub().resolves(null),
                writeJob: sinon.stub().resolves(),
                readUserCsv: sinon.stub().resolves(null),
                writeUserCsv: sinon.stub().resolves(),
                '@noCallThru': true,
            },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, error() {} }) }, '@noCallThru': true },
        });
        await mod.main({
            __ow_method: 'post',
            allowedClientId: 'mas-studio',
            odinEndpoint: 'https://odin.example',
            type: 'find',
            find: 'x',
            surface: 'acom',
        });
        expect(isAllowed.firstCall.args[1]).to.equal('mas-studio');
    });
    it('routes POST to handlePost', async () => {
        const { mod } = load();
        const res = await mod.main({ __ow_method: 'post', allowedClientId: 'mas-studio', ...findParams });
        expect(res.statusCode).to.equal(202);
    });
    it('routes text/csv POST to handleCsvUpload', async () => {
        const { mod, writeUserCsv } = load({ existing: doneJob });
        const res = await mod.main({
            __ow_method: 'post',
            allowedClientId: 'mas-studio',
            jobId: 'job-1',
            __ow_body: sampleCsvRow,
            __ow_headers: { 'content-type': 'text/csv', authorization: 'Bearer token' },
        });
        expect(res.statusCode).to.equal(202);
        expect(writeUserCsv.calledOnce).to.equal(true);
    });
    it('routes multipart POST to handleCsvUpload', async () => {
        const { mod, writeUserCsv } = load({ existing: doneJob });
        const boundary = '----BulkEditFormBoundary';
        const body =
            `------BulkEditFormBoundary\r\n` +
            `Content-Disposition: form-data; name="file"; filename="demo.csv"\r\n` +
            `Content-Type: text/csv\r\n\r\n` +
            `${sampleCsvRow}\r\n` +
            `------BulkEditFormBoundary--\r\n`;
        const res = await mod.main({
            __ow_method: 'post',
            allowedClientId: 'mas-studio',
            jobId: 'job-1',
            __ow_body: body,
            __ow_headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, authorization: 'Bearer token' },
        });
        expect(res.statusCode).to.equal(202);
        expect(writeUserCsv.calledOnce).to.equal(true);
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
