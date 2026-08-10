const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { HEADERS } = require('../../src/bulk-edit/csv.js');

const csvHeaderLine = HEADERS.join(',');

function seedExportFiles(writes, jobId) {
    writes[`private/bulk-edit/${jobId}.json`] = JSON.stringify({ items: [] });
    writes[`private/bulk-edit/${jobId}.csv`] = 'fragment_id,path\n';
}

function load({ existing = null, userCsv = null, allowed = true, seedExports = undefined } = {}) {
    const invokeAsyncAction = sinon.stub().resolves({ activationId: 'act-1' });
    const writeJob = sinon.stub().resolves();
    const readJob = sinon.stub().resolves(existing);
    const patchJob = sinon.stub().resolves();
    const readUserCsv = sinon.stub().resolves(userCsv);
    const writeUserCsv = sinon.stub().resolves();
    const deleteUserCsv = sinon.stub().resolves();
    const readDryRun = sinon.stub().resolves(null);
    const readResults = sinon.stub().resolves(null);
    const readReport = sinon.stub().resolves(null);
    const touchJobCache = sinon.stub().resolves();
    const writes = {};
    const deleted = [];
    if (seedExports === true || (seedExports !== false && existing?.exportReady)) {
        seedExportFiles(writes, 'job-1');
    }
    const files = {
        write: sinon.stub().callsFake(async (path, content) => {
            writes[path] = content;
        }),
        read: sinon.stub().callsFake(async (path) => Buffer.from(writes[path] || '')),
        delete: sinon.stub().callsFake(async (path) => {
            deleted.push(path);
            delete writes[path];
        }),
        generatePresignURL: sinon.stub().callsFake((path) => {
            const file = path.split('/').pop();
            return Promise.resolve(`https://files.example/${file}`);
        }),
    };
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
        '@adobe/aio-lib-files': { init: async () => files },
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
        readResults,
        readReport,
        touchJobCache,
        files,
        writes,
        deleted,
    };
}

const findParams = {
    type: 'find',
    find: 'school',
    replace: 'academy',
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

const sampleCsvRow = `${csvHeaderLine}\n` + 'frag-1,/content/dam/mas/sandbox/en_US/foo,en_US,subtitle,school,e1,PUBLISHED\n';

describe('bulk-edit: computeJobId', () => {
    it('is stable for identical params and tag order', () => {
        const { mod } = load();
        const a = mod.computeJobId({ ...findParams, tags: ['b', 'a'] });
        const b = mod.computeJobId({ ...findParams, tags: ['a', 'b'] });
        expect(a).to.equal(b);
    });
    it('changes when replace changes', () => {
        const { mod } = load();
        expect(mod.computeJobId(findParams)).to.not.equal(mod.computeJobId({ ...findParams, replace: 'campus' }));
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
    it('400s an invalid searchIn scope without persisting a job', async () => {
        const { mod, invokeAsyncAction, writeJob } = load();
        const res = await mod.handlePost({ ...findParams, searchIn: 'cardTitle' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('cardTitle');
        expect(writeJob.called).to.equal(false);
        expect(invokeAsyncAction.called).to.equal(false);
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
        const { mod, invokeAsyncAction, writeJob, deleteUserCsv, deleted } = load({
            existing: { status: 'DONE', results: [{ id: 'a' }], total: 1 },
        });
        const res = await mod.handlePost({ ...findParams, forceRefresh: true });
        expect(res.statusCode).to.equal(202);
        expect(res.body.reused).to.equal(false);
        expect(deleteUserCsv.calledOnceWith(res.body.jobId)).to.equal(true);
        expect(deleted.some((path) => path.includes(res.body.jobId))).to.equal(true);
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
        const ctx = load({ existing: { ...doneJob, exportReady: true, results: [] }, seedExports: false });
        ctx.readResults.resolves(doneJobResults);
        const res = await ctx.mod.handleGet({ jobId: 'job-1' });
        expect(res.statusCode).to.equal(200);
        expect(ctx.files.write.callCount).to.be.greaterThan(0);
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
                etag: 'e1',
                status: 'PUBLISHED',
            },
        ];
        const { mod, writeUserCsv, files, writes, readUserCsv, patchJob } = load({ existing: doneJob });
        readUserCsv.resolves({ rows: uploadedRows });
        const res = await mod.handleCsvUpload(csvPost);
        expect(res.statusCode).to.equal(202);
        expect(res.body.rowsAccepted).to.equal(1);
        expect(res.body.filteredByUpload).to.equal(true);
        expect(res.body.total).to.equal(1);
        expect(res.body.report.total).to.equal(1);
        expect(res.body.exportReady).to.equal(true);
        expect(writeUserCsv.calledOnce).to.equal(true);
        expect(files.write.callCount).to.be.greaterThan(0);
        const exportPayload = JSON.parse(writes['private/bulk-edit/job-1.json']);
        expect(exportPayload.filteredByUpload).to.equal(true);
        expect(exportPayload.items).to.have.lengthOf(1);
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
        const badCsv = `${csvHeaderLine}\nmissing,/p,en_US,subtitle,x,e1,PUBLISHED\n`;
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
            rows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school' }],
        };
        const { mod, deleteUserCsv, files, writes, readUserCsv, patchJob } = load({
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
        expect(files.write.callCount).to.be.greaterThan(0);
        const exportPayload = JSON.parse(writes['private/bulk-edit/job-1.json']);
        expect(exportPayload.filteredByUpload).to.equal(false);
        expect(exportPayload.items).to.have.lengthOf(2);
        expect(patchJob.called).to.equal(true);
    });
    it('404s when no CSV was uploaded', async () => {
        const { mod } = load({ existing: doneJob, userCsv: null });
        const res = await mod.handleCsvDelete({ jobId: 'job-1' });
        expect(res.error.statusCode).to.equal(404);
    });
});

const findJobDone = {
    type: 'find',
    status: 'DONE',
    runId: 'find-run-1',
    params: { matchCase: false, find: 'school', replace: 'academy' },
    results: doneJobResults,
};
const replaceCsv = {
    uploadedAt: '2026-01-01T00:00:00.000Z',
    rows: [{ fragment_id: 'frag-1', path: '/p/foo', locale: 'en_US', field: 'subtitle', find: 'school' }],
};

describe('bulk-edit: computeReplaceJobId', () => {
    const actionableRows = [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school', replace: 'academy', etag: 'e1' }];
    it('produces a structured replace.{find12}.{mode}.{csv8} id', () => {
        const { mod } = load();
        const id = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, actionableRows, findRunId: 'run-1' });
        expect(id).to.match(/^replace\.abcdef012345\.live\.[0-9a-f]{8}$/);
    });
    it('distinguishes dry from live runs', () => {
        const { mod } = load();
        const dry = mod.computeReplaceJobId('abcdef0123456789', { dryRun: true, actionableRows, findRunId: 'run-1' });
        const live = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, actionableRows, findRunId: 'run-1' });
        expect(dry).to.not.equal(live);
        expect(dry).to.include('.dry.');
    });
    it('changes when the CSV rows change', () => {
        const { mod } = load();
        const a = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, actionableRows, findRunId: 'run-1' });
        const b = mod.computeReplaceJobId('abcdef0123456789', {
            dryRun: false,
            actionableRows: [{ ...actionableRows[0], fragment_id: 'frag-2' }],
            findRunId: 'run-1',
        });
        expect(a).to.not.equal(b);
    });
    it('does not change when only replace values differ', () => {
        const { mod } = load();
        const a = mod.computeReplaceJobId('abcdef0123456789', { dryRun: false, actionableRows, findRunId: 'run-1' });
        const b = mod.computeReplaceJobId('abcdef0123456789', {
            dryRun: false,
            actionableRows: [{ ...actionableRows[0], replace: 'campus' }],
            findRunId: 'run-1',
        });
        expect(a).to.equal(b);
    });
    it('changes when the find job run changes', () => {
        const { mod } = load();
        const base = { dryRun: false, actionableRows };
        const first = mod.computeReplaceJobId('abcdef0123456789', { ...base, findRunId: 'run-a' });
        const renewed = mod.computeReplaceJobId('abcdef0123456789', { ...base, findRunId: 'run-b' });
        expect(first).to.not.equal(renewed);
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
    it('uses generated CSV rows when no CSV was uploaded', async () => {
        const ctx = load({ userCsv: null });
        ctx.readJob.withArgs('find-1').resolves(findJobDone);
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.statusCode).to.equal(202);
        expect(ctx.writeJob.firstCall.args[1].total).to.equal(1);
    });
    it('400s when the find job has no results', async () => {
        const ctx = load({ userCsv: null });
        ctx.readJob.withArgs('find-1').resolves({ ...findJobDone, results: [] });
        ctx.readResults.resolves([]);
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('no results');
    });
    it('400s when no rows would change fragments', async () => {
        const ctx = load({ userCsv: null });
        ctx.readJob.withArgs('find-1').resolves({
            ...findJobDone,
            params: { matchCase: false, find: 'school', replace: 'school' },
        });
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('no rows with replace values');
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
        const replaceJobId = ctx.mod.computeReplaceJobId('find-1', {
            dryRun: false,
            actionableRows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school', replace: 'academy', etag: 'e1' }],
            findRunId: findJobDone.runId,
        });
        ctx.readJob.withArgs(replaceJobId).resolves({ type: 'replace', status: 'RUNNING', findRunId: findJobDone.runId });
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.body.reused).to.equal(true);
        expect(ctx.writeJob.called).to.equal(false);
        expect(ctx.invokeAsyncAction.called).to.equal(false);
    });
    it('starts a new replace job when the find job was refreshed', async () => {
        const ctx = loadReplace();
        const replaceJobId = ctx.mod.computeReplaceJobId('find-1', {
            dryRun: false,
            actionableRows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school', replace: 'academy', etag: 'e1' }],
            findRunId: 'find-run-0',
        });
        ctx.readJob.withArgs(replaceJobId).resolves({ type: 'replace', status: 'DONE', findRunId: 'find-run-0' });
        ctx.readJob.withArgs('find-1').resolves({ ...findJobDone, runId: 'find-run-2' });
        const res = await ctx.mod.handlePost(replaceParams);
        expect(res.body.reused).to.equal(false);
        expect(ctx.writeJob.calledOnce).to.equal(true);
    });
});

describe('bulk-edit: handleReplaceGet', () => {
    it('returns replace progress counters and report on DONE', async () => {
        const job = {
            type: 'replace',
            dryRun: false,
            status: 'DONE',
            exportReady: true,
            processed: 2,
            succeeded: 1,
            skipped: 1,
            failed: 0,
            conflicts: 0,
            total: 2,
            results: [],
        };
        const ctx = load({ existing: job });
        ctx.readReport.resolves({ dryRun: false, totalFragments: 2 });
        const res = await ctx.mod.handleGet({ jobId: 'replace.x.live.y' });
        expect(res.body.dryRun).to.equal(false);
        expect(res.body.total).to.equal(2);
        expect(res.body.succeeded).to.equal(1);
        expect(res.body.report.totalFragments).to.equal(2);
        expect(res.body.items).to.equal(undefined);
    });
    it('includes JSON export URL only on terminal replace jobs', async () => {
        const jobId = 'replace.x.dry.y';
        const job = { type: 'replace', dryRun: true, status: 'DONE', exportReady: true, results: [] };
        const ctx = load({ existing: job, seedExports: false });
        ctx.writes[`private/bulk-edit/${jobId}.json`] = JSON.stringify({ items: [] });
        ctx.readReport.resolves({ dryRun: true, totalFragments: 1 });
        const res = await ctx.mod.handleGet({ jobId });
        expect(res.body.exports).to.deep.equal({ json: `https://files.example/${jobId}.json` });
        expect(res.body.exports.csv).to.equal(undefined);
    });
    it('400s when jobId uses a .json or .csv suffix', async () => {
        const job = { type: 'replace', dryRun: true, status: 'DONE', exportReady: true, results: [] };
        const ctx = load({ existing: job });
        const res = await ctx.mod.handleGet({ jobId: 'replace.x.dry.y.csv' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('poll response');
    });
    it('regenerates missing replace export from state results on poll', async () => {
        const jobId = 'replace.x.dry.y';
        const job = { type: 'replace', dryRun: true, status: 'DONE', exportReady: true, results: [] };
        const ctx = load({ existing: job, seedExports: false });
        ctx.readResults.resolves([
            { id: 'a', path: '/p/a', locale: 'en_US', status: 'WOULD_REPLACE', matches: [{ field: 'subtitle', value: 'x' }] },
        ]);
        ctx.readReport.resolves({ dryRun: true, totalFragments: 1 });
        const res = await ctx.mod.handleGet({ jobId });
        expect(res.statusCode).to.equal(200);
        expect(ctx.files.write.callCount).to.be.greaterThan(0);
        expect(res.body.exports.json).to.equal(`https://files.example/${jobId}.json`);
    });
    it('reports done:true, touches the cache, and includes the report for a CANCELLED replace job', async () => {
        const job = {
            type: 'replace',
            dryRun: false,
            status: 'CANCELLED',
            exportReady: true,
            processed: 1,
            succeeded: 1,
            skipped: 0,
            failed: 0,
            conflicts: 0,
            total: 2,
            results: [],
        };
        const ctx = load({ existing: job });
        ctx.readReport.resolves({ dryRun: false, totalFragments: 1 });
        const res = await ctx.mod.handleGet({ jobId: 'replace.x.live.y' });
        expect(res.body.done).to.equal(true);
        expect(res.body.report.totalFragments).to.equal(1);
        expect(ctx.touchJobCache.calledOnce).to.equal(true);
    });
    it('resolves the export URL for a CANCELLED replace job', async () => {
        const jobId = 'replace.x.live.y';
        const job = { type: 'replace', dryRun: false, status: 'CANCELLED', exportReady: true, results: [] };
        const ctx = load({ existing: job, seedExports: false });
        ctx.writes[`private/bulk-edit/${jobId}.json`] = JSON.stringify({ items: [] });
        ctx.readReport.resolves({ dryRun: false, totalFragments: 0 });
        const res = await ctx.mod.handleGet({ jobId });
        expect(res.body.exports).to.deep.equal({ json: `https://files.example/${jobId}.json` });
    });
});

describe('bulk-edit: resolveFindSourceItems', () => {
    it('prefers state results over file exports', async () => {
        const ctx = load({ existing: { ...doneJob, exportReady: true, results: [] } });
        const stateItems = [{ id: 'state-1', matches: [{ field: 'subtitle', value: 'school' }] }];
        ctx.readResults.resolves(stateItems);
        const items = await ctx.mod.resolveFindSourceItems('job-1', { exportReady: true, results: [] });
        expect(items).to.deep.equal(stateItems);
    });
});

const findActionParams = { __ow_action_name: '/14257-MerchAtScaleStudio/bulk-edit-find' };
const replaceActionParams = { __ow_action_name: '/14257-MerchAtScaleStudio/bulk-edit-replace' };

describe('bulk-edit: resolveBulkEditMode', () => {
    it('derives find from bulkEditMode input', () => {
        const { mod } = load();
        expect(mod.resolveBulkEditMode({ bulkEditMode: 'find' })).to.equal('find');
    });
    it('derives replace from bulkEditMode input', () => {
        const { mod } = load();
        expect(mod.resolveBulkEditMode({ bulkEditMode: 'replace' })).to.equal('replace');
    });
    it('derives find from __ow_action_name', () => {
        const { mod } = load();
        expect(mod.resolveBulkEditMode(findActionParams)).to.equal('find');
    });
    it('derives replace from __ow_action_name', () => {
        const { mod } = load();
        expect(mod.resolveBulkEditMode(replaceActionParams)).to.equal('replace');
    });
    it('returns null when action name is missing', () => {
        const { mod } = load();
        expect(mod.resolveBulkEditMode({})).to.equal(null);
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
            ...findActionParams,
            allowedClientId: 'mas-studio',
            odinEndpoint: 'https://odin.example',
            find: 'x',
            surface: 'sandbox',
        });
        expect(isAllowed.firstCall.args[1]).to.equal('mas-studio');
    });
    it('routes POST to handlePost', async () => {
        const { mod } = load();
        const res = await mod.main({ __ow_method: 'post', ...findActionParams, allowedClientId: 'mas-studio', ...findParams });
        expect(res.statusCode).to.equal(202);
    });
    it('routes text/csv POST to handleCsvUpload', async () => {
        const { mod, writeUserCsv } = load({ existing: doneJob });
        const res = await mod.main({
            __ow_method: 'post',
            ...findActionParams,
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
            ...findActionParams,
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
        const res = await mod.main({ __ow_method: 'get', ...findActionParams, jobId: 'j' });
        expect(res.statusCode).to.equal(200);
    });
    it('400s when __ow_action_name is missing', async () => {
        const { mod } = load();
        const res = await mod.main({ __ow_method: 'delete' });
        expect(res.error.statusCode).to.equal(400);
    });
});

describe('bulk-edit: mode-specific endpoints', () => {
    it('bulk-edit-find POST forces type find without type in body', async () => {
        const { mod } = load();
        const findMain = mod.createModeMain('find');
        const { find, replace, surface, odinEndpoint } = findParams;
        const res = await findMain({
            __ow_method: 'post',
            allowedClientId: 'mas-studio',
            find,
            replace,
            surface,
            odinEndpoint,
        });
        expect(res.statusCode).to.equal(202);
    });

    it('bulk-edit-find GET rejects replace jobIds', async () => {
        const { mod } = load({
            existing: { type: 'replace', status: 'DONE', total: 1, exportReady: true },
        });
        const findMain = mod.createModeMain('find');
        const res = await findMain({ __ow_method: 'get', jobId: 'replace.abc.dry.12345678' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('bulk-edit-replace');
    });

    it('bulk-edit-replace GET rejects find jobIds', async () => {
        const { mod } = load({ existing: { type: 'find', status: 'DONE', total: 1 } });
        const replaceMain = mod.createModeMain('replace');
        const res = await replaceMain({ __ow_method: 'get', jobId: 'abc123' });
        expect(res.error.statusCode).to.equal(400);
        expect(res.error.body.error).to.include('bulk-edit-find');
    });

    it('bulk-edit-replace POST 401s a disallowed caller', async () => {
        const { mod } = load({ allowed: false });
        const replaceMain = mod.createModeMain('replace');
        const res = await replaceMain({
            __ow_method: 'post',
            allowedClientId: 'mas-studio',
            findJobId: 'find-1',
            odinEndpoint: 'https://odin.example',
        });
        expect(res.error.statusCode).to.equal(401);
    });

    it('bulk-edit-replace rejects CSV upload', async () => {
        const { mod } = load({ existing: doneJob });
        const replaceMain = mod.createModeMain('replace');
        const res = await replaceMain({
            __ow_method: 'post',
            allowedClientId: 'mas-studio',
            jobId: 'job-1',
            __ow_body: sampleCsvRow,
            __ow_headers: { 'content-type': 'text/csv', authorization: 'Bearer token' },
        });
        expect(res.error.statusCode).to.equal(405);
    });

    it('bulk-edit-find DELETE removes uploaded CSV', async () => {
        const uploaded = { rows: [{ fragment_id: 'frag-1', field: 'subtitle', find: 'school' }] };
        const { mod, deleteUserCsv, readUserCsv } = load({ existing: doneJob, userCsv: uploaded });
        readUserCsv.onFirstCall().resolves(uploaded);
        readUserCsv.onSecondCall().resolves(null);
        const findMain = mod.createModeMain('find');
        const res = await findMain({ __ow_method: 'delete', jobId: 'job-1' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.filteredByUpload).to.equal(false);
        expect(deleteUserCsv.calledOnce).to.equal(true);
    });
});

describe('bulk-edit: export helpers', () => {
    it('places files under private/bulk-edit/{jobId}', () => {
        const { mod } = load();
        expect(mod.buildExportPaths('abc123')).to.deep.equal({
            json: 'private/bulk-edit/abc123.json',
            csv: 'private/bulk-edit/abc123.csv',
            fullJson: 'private/bulk-edit/abc123-full.json',
        });
    });

    it('writeJobExports writes JSON and CSV for find jobs', async () => {
        const { mod, files, writes } = load();
        await mod.writeJobExports('job-1', {
            type: 'find',
            items: [
                {
                    id: 'a',
                    path: '/p/a',
                    locale: 'en_US',
                    etag: 'e1',
                    status: 'PUBLISHED',
                    matches: [{ field: 'subtitle', value: 'school' }],
                },
            ],
            report: { total: 1, byLocale: { en_US: 1 } },
            filteredByUpload: false,
            dryRun: false,
        });
        expect(files.write.callCount).to.equal(2);
        expect(files.write.firstCall.args[2]).to.deep.equal({ contentType: 'application/json' });
        expect(files.write.secondCall.args[2]).to.deep.equal({ contentType: 'text/csv' });
        const document = JSON.parse(writes['private/bulk-edit/job-1.json']);
        expect(document.jobId).to.equal('job-1');
        expect(document.items).to.have.lengthOf(1);
        expect(writes['private/bulk-edit/job-1.csv']).to.include('fragment_id,path,locale');
        expect(writes['private/bulk-edit/job-1.csv']).to.not.include(',replace,');
    });

    it('writeJobExports writes JSON only for replace jobs', async () => {
        const { mod, files, writes } = load();
        await mod.writeJobExports('job-1', {
            type: 'replace',
            items: [
                {
                    id: 'a',
                    path: '/p/a',
                    locale: 'en_US',
                    status: 'REPLACED',
                    matches: [{ field: 'subtitle', value: 'school' }],
                },
            ],
            report: { totalFragments: 1 },
            filteredByUpload: false,
            dryRun: false,
        });
        expect(files.write.callCount).to.equal(1);
        expect(files.write.firstCall.args[2]).to.deep.equal({ contentType: 'application/json' });
        expect(writes['private/bulk-edit/job-1.csv']).to.equal(undefined);
    });

    it('writeFullExport stores modified fragments for dry-run replace jobs', async () => {
        const { mod, writes } = load();
        await mod.writeFullExport('job-1', 'replace', [
            {
                id: 'a',
                path: '/p/a',
                locale: 'en_US',
                status: 'WOULD_REPLACE',
                title: 'T',
                description: 'D',
                fields: [{ name: 'subtitle', values: ['Campus offer'] }],
                matches: [{ field: 'subtitle', value: 'School' }],
            },
        ]);
        const document = JSON.parse(writes['private/bulk-edit/job-1-full.json']);
        expect(document.type).to.equal('replace');
        expect(document.items).to.have.lengthOf(1);
        expect(document.items[0].fields[0].values[0]).to.equal('Campus offer');
    });

    it('readExportItems returns items from the exported JSON document', async () => {
        const { mod, writes } = load();
        const items = [{ id: 'a' }];
        writes['private/bulk-edit/job-1.json'] = JSON.stringify({ items });
        const read = await mod.readExportItems('job-1');
        expect(read).to.deep.equal(items);
    });

    it('exportFileExists returns true when the export file is readable', async () => {
        const { mod, writes } = load();
        writes['private/bulk-edit/job-1.json'] = '{}';
        expect(await mod.exportFileExists('job-1', 'json')).to.equal(true);
    });

    it('exportFileExists returns false when the export file is missing', async () => {
        const { mod } = load();
        expect(await mod.exportFileExists('job-1', 'json')).to.equal(false);
    });

    it('exportPresignUrl returns a presigned URL for JSON or CSV paths', async () => {
        const { mod, files, writes } = load();
        writes['private/bulk-edit/job-1.json'] = '{}';
        writes['private/bulk-edit/job-1.csv'] = 'fragment_id\n';
        expect(await mod.exportPresignUrl('job-1', 'json')).to.equal('https://files.example/job-1.json');
        expect(await mod.exportPresignUrl('job-1', 'csv')).to.equal('https://files.example/job-1.csv');
        expect(files.generatePresignURL.callCount).to.equal(2);
    });

    it('exportRedirectResponse returns 302 with a presigned Location for JSON', async () => {
        const { mod, files, writes } = load();
        writes['private/bulk-edit/job-1.json'] = '{"jobId":"job-1"}';
        const res = await mod.exportRedirectResponse('job-1', 'json');
        expect(res.statusCode).to.equal(302);
        expect(res.headers.Location).to.equal('https://files.example/job-1.json');
        expect(files.generatePresignURL.firstCall.args[0]).to.equal('private/bulk-edit/job-1.json');
    });

    it('exportRedirectResponse returns 302 with a presigned Location for CSV', async () => {
        const { mod, files, writes } = load();
        writes['private/bulk-edit/job-1.csv'] = 'fragment_id,path\n';
        const res = await mod.exportRedirectResponse('job-1', 'csv');
        expect(res.statusCode).to.equal(302);
        expect(files.generatePresignURL.firstCall.args[0]).to.equal('private/bulk-edit/job-1.csv');
    });

    it('deleteJobExports deletes all export files', async () => {
        const { mod, deleted } = load();
        await mod.deleteJobExports('job-1');
        expect(deleted).to.include('private/bulk-edit/job-1.json');
        expect(deleted).to.include('private/bulk-edit/job-1.csv');
        expect(deleted).to.include('private/bulk-edit/job-1-full.json');
    });
});
