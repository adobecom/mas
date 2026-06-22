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
    const deleteJobExports = sinon.stub().resolves();
    const readDryRun = sinon.stub().resolves(null);
    const readResults = sinon.stub().resolves(null);
    const readReport = sinon.stub().resolves(null);
    const touchJobCache = sinon.stub().resolves();
    const exportPresignUrl = sinon.stub().callsFake(async (jobId, format) => `https://files.example/${jobId}.${format}`);
    const readExportFullItems = sinon.stub().resolves(existing?.results || doneJobResults);
    const readExportItems = sinon.stub().resolves(existing?.results || doneJobResults);
    const writeJobExports = sinon.stub().resolves({ exportedAt: '2026-01-01T00:00:00.000Z' });
    const exportFileExists = sinon.stub().resolves(true);
    const writeFullExport = sinon.stub().resolves();
    const resolveFindSourceItems = sinon.stub().callsFake(async (jobId, job) => {
        const state = await readResults(jobId);
        if (state?.length) return state;
        if (job?.results?.length) return job.results;
        return doneJobResults;
    });
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
            readResults,
            readReport,
            touchJobCache,
            JOB_CACHE_TTL: 7 * 24 * 60 * 60,
            '@noCallThru': true,
        },
        './export.js': {
            exportPresignUrl,
            exportFileExists,
            deleteJobExports,
            readExportFullItems,
            readExportItems,
            writeJobExports,
            writeFullExport,
            '@noCallThru': true,
        },
        './find-results.js': {
            resolveFindSourceItems,
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
        deleteJobExports,
        readDryRun,
        readResults,
        readReport,
        touchJobCache,
        exportPresignUrl,
        exportFileExists,
        readExportFullItems,
        readExportItems,
        writeJobExports,
        writeFullExport,
        resolveFindSourceItems,
    };
}

const findParams = {
    type: 'find',
    find: 'school',
    surface: 'sandbox',
    searchIn: '*',
    odinEndpoint: 'https://odin.example',
};

const doneJobResults = [
    {
        id: 'frag-1',
        path: '/content/dam/mas/sandbox/en_US/foo',
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
        path: '/content/dam/mas/sandbox/en_US/bar',
        locale: 'en_US',
        status: 'PUBLISHED',
        etag: 'e2',
        matches: [{ field: 'subtitle', value: 'academy' }],
    },
];

const doneJob = { status: 'DONE', total: 2, results: doneJobResults };

const sampleCsvRow =
    `${csvHeaderLine}\n` + 'frag-1,/content/dam/mas/sandbox/en_US/foo,en_US,subtitle,school,academy,e1,PUBLISHED\n';

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
        const res = await mod.handlePost({ type: 'bogus', find: 'x', surface: 'sandbox' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include("unsupported type 'bogus'");
    });
    it('400s missing required inputs', async () => {
        const { mod } = load();
        const res = await mod.handlePost({ type: 'find', surface: 'sandbox' });
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
        const { mod, invokeAsyncAction, writeJob, deleteUserCsv, deleteJobExports } = load({
            existing: { status: 'DONE', results: [{ id: 'a' }], total: 1 },
        });
        const res = await mod.handlePost({ ...findParams, forceRefresh: true });
        expect(res.statusCode).to.equal(202);
        expect(res.body.reused).to.equal(false);
        expect(deleteUserCsv.calledOnceWith(res.body.jobId)).to.equal(true);
        expect(deleteJobExports.calledOnceWith(res.body.jobId)).to.equal(true);
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
    it('returns a progress envelope without items while RUNNING', async () => {
        const { mod } = load({ existing: { status: 'RUNNING', total: 3, results: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } });
        const res = await mod.handleGet({ jobId: 'j' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.done).to.equal(false);
        expect(res.body.total).to.equal(3);
        expect(res.body.items).to.equal(undefined);
    });
    it('returns done:true and exportReady on DONE', async () => {
        const { mod } = load({ existing: { status: 'DONE', total: 1, exportReady: true, results: [] } });
        const res = await mod.handleGet({ jobId: 'j' });
        expect(res.body.done).to.equal(true);
        expect(res.body.exportReady).to.equal(true);
        expect(res.body.items).to.equal(undefined);
    });
    it('includes presigned export URLs on terminal find jobs', async () => {
        const { mod } = load({ existing: { status: 'DONE', total: 1, exportReady: true, results: [] } });
        const res = await mod.handleGet({ jobId: 'job-1' });
        expect(res.body.exports).to.deep.equal({
            json: 'https://files.example/job-1.json',
            csv: 'https://files.example/job-1.csv',
        });
    });
    it('includes the per-locale find report when present', async () => {
        const { mod, readReport } = load({ existing: { status: 'RUNNING', total: 3, results: [{ id: 'a' }] } });
        readReport.resolves({ total: 3, byLocale: { en_US: 2, fr_FR: 1 } });
        const res = await mod.handleGet({ jobId: 'j' });
        expect(res.body.report).to.deep.equal({ total: 3, byLocale: { en_US: 2, fr_FR: 1 } });
    });
    it('500s on FAILED with partial total', async () => {
        const { mod } = load({ existing: { status: 'FAILED', error: 'boom', total: 2 } });
        const res = await mod.handleGet({ jobId: 'j' });
        expect(res.error.statusCode).to.equal(500);
        expect(res.error.body.total).to.equal(2);
    });
    it('returns done:true on CANCELLED (200)', async () => {
        const { mod } = load({ existing: { status: 'CANCELLED', total: 2, exportReady: true, results: [] } });
        const res = await mod.handleGet({ jobId: 'j' });
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
    it('sets filteredByUpload when a user CSV upload exists', async () => {
        const { mod } = load({
            existing: { ...doneJob, exportReady: true, results: [] },
            userCsv: {
                rows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school' }],
            },
        });
        const res = await mod.handleGet({ jobId: 'job-1' });
        expect(res.body.filteredByUpload).to.equal(true);
        expect(res.body.items).to.equal(undefined);
    });
    it('400s when jobId uses a .json or .csv suffix', async () => {
        const { mod } = load({ existing: { ...doneJob, exportReady: true, results: [] } });
        const jsonRes = await mod.handleGet({ jobId: 'job-1.json' });
        const csvRes = await mod.handleGet({ jobId: 'job-1.csv' });
        expect(jsonRes.error.statusCode).to.equal(400);
        expect(csvRes.error.statusCode).to.equal(400);
        expect(jsonRes.error.body.error).to.include('poll response');
    });
    it('refreshes cache TTL on terminal poll GET', async () => {
        const { mod, touchJobCache } = load({ existing: { ...doneJob, exportReady: true, results: [] } });
        await mod.handleGet({ jobId: 'job-1' });
        expect(touchJobCache.callCount).to.equal(1);
    });
    it('regenerates missing export files from state results on poll', async () => {
        const ctx = load({ existing: { ...doneJob, exportReady: true, results: [] } });
        let checked = false;
        ctx.exportFileExists.callsFake(async () => {
            if (!checked) {
                checked = true;
                return false;
            }
            return true;
        });
        ctx.readResults.resolves(doneJobResults);
        const res = await ctx.mod.handleGet({ jobId: 'job-1' });
        expect(res.statusCode).to.equal(200);
        expect(ctx.writeJobExports.callCount).to.equal(1);
        expect(res.body.exports.json).to.equal('https://files.example/job-1.json');
    });
});

describe('bulk-edit: handleCsvUpload', () => {
    const csvPost = {
        jobId: 'job-1',
        __ow_body: sampleCsvRow,
        __ow_headers: { authorization: 'Bearer token', 'content-type': 'text/csv' },
    };

    it('stores parsed rows, refreshes filtered exports, and returns 202', async () => {
        const uploadedRows = [
            {
                fragment_id: 'frag-1',
                path: '/content/dam/mas/sandbox/en_US/foo',
                locale: 'en_US',
                field: 'subtitle',
                find: 'school',
                replace: 'academy',
                etag: 'e1',
                status: 'PUBLISHED',
            },
        ];
        const { mod, writeUserCsv, writeJobExports, readUserCsv, patchJob } = load({ existing: doneJob });
        readUserCsv.resolves({ rows: uploadedRows });
        const res = await mod.handleCsvUpload(csvPost);
        expect(res.statusCode).to.equal(202);
        expect(res.body.rowsAccepted).to.equal(1);
        expect(res.body.filteredByUpload).to.equal(true);
        expect(res.body.total).to.equal(1);
        expect(res.body.report.total).to.equal(1);
        expect(res.body.exportReady).to.equal(true);
        expect(writeUserCsv.calledOnce).to.equal(true);
        expect(writeJobExports.calledOnce).to.equal(true);
        expect(writeJobExports.firstCall.args[1].filteredByUpload).to.equal(true);
        expect(writeJobExports.firstCall.args[1].items).to.have.lengthOf(1);
        expect(patchJob.called).to.equal(true);
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

describe('bulk-edit: handleCsvDelete', () => {
    it('removes uploaded CSV and restores unfiltered exports', async () => {
        const uploaded = {
            rows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school', replace: 'academy' }],
        };
        const { mod, deleteUserCsv, writeJobExports, readUserCsv, patchJob } = load({
            existing: { ...doneJob, exportReady: true },
            userCsv: uploaded,
        });
        readUserCsv.onFirstCall().resolves(uploaded);
        readUserCsv.onSecondCall().resolves(null);
        const res = await mod.handleCsvDelete({ jobId: 'job-1' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.filteredByUpload).to.equal(false);
        expect(res.body.total).to.equal(2);
        expect(res.body.report.total).to.equal(2);
        expect(deleteUserCsv.calledOnceWith('job-1')).to.equal(true);
        expect(writeJobExports.calledOnce).to.equal(true);
        expect(writeJobExports.firstCall.args[1].filteredByUpload).to.equal(false);
        expect(writeJobExports.firstCall.args[1].items).to.have.lengthOf(2);
        expect(patchJob.called).to.equal(true);
    });
    it('404s when no CSV was uploaded', async () => {
        const { mod } = load({ existing: doneJob, userCsv: null });
        const res = await mod.handleCsvDelete({ jobId: 'job-1' });
        expect(res.error.statusCode).to.equal(404);
    });
});

const findJobDone = { type: 'find', status: 'DONE', runId: 'find-run-1', params: { matchCase: false, find: 'school' }, results: doneJobResults };
const replaceCsv = {
    uploadedAt: '2026-01-01T00:00:00.000Z',
    rows: [{ fragment_id: 'frag-1', path: '/p/foo', locale: 'en_US', field: 'subtitle', find: 'school', replace: 'academy' }],
};
describe('bulk-edit: resolveFindSourceItems', () => {
    it('prefers state results over file exports', async () => {
        const ctx = load({ existing: { ...doneJob, exportReady: true, results: [] } });
        const stateItems = [{ id: 'state-1', matches: [{ field: 'subtitle', value: 'school' }] }];
        ctx.readResults.resolves(stateItems);
        const items = await ctx.mod.resolveFindSourceItems('job-1', { exportReady: true, results: [] });
        expect(items).to.deep.equal(stateItems);
        expect(ctx.readExportFullItems.called).to.equal(false);
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
            find: 'x',
            surface: 'sandbox',
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
    it('routes DELETE to handleCsvDelete', async () => {
        const uploaded = {
            rows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school', replace: 'academy' }],
        };
        const { mod, deleteUserCsv } = load({ existing: { ...doneJob, exportReady: true }, userCsv: uploaded });
        const res = await mod.main({ __ow_method: 'delete', allowedClientId: 'mas-studio', jobId: 'job-1' });
        expect(res.statusCode).to.equal(200);
        expect(deleteUserCsv.calledOnceWith('job-1')).to.equal(true);
    });
    it('405s an unsupported method', async () => {
        const { mod } = load();
        const res = await mod.main({ __ow_method: 'patch' });
        expect(res.error.statusCode).to.equal(405);
    });
});
