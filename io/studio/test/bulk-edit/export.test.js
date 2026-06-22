const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

function loadFilesStub() {
    const writes = {};
    const deleted = [];
    const files = {
        write: sinon.stub().callsFake(async (path, content) => {
            writes[path] = content;
        }),
        read: sinon.stub().callsFake(async (path) => Buffer.from(writes[path] || '')),
        delete: sinon.stub().callsFake(async (path) => {
            deleted.push(path);
            delete writes[path];
        }),
        generatePresignURL: sinon.stub().resolves('https://files.example/presigned'),
    };
    const mod = proxyquire('../../src/bulk-edit/export.js', {
        '@adobe/aio-lib-files': { init: async () => files },
    });
    return { mod, files, writes, deleted };
}

describe('bulk-edit/export: buildExportPaths', () => {
    it('places files under private/bulk-edit/{jobId}/', () => {
        const { mod } = loadFilesStub();
        expect(mod.buildExportPaths('abc123')).to.deep.equal({
            json: 'private/bulk-edit/abc123/results.json',
            csv: 'private/bulk-edit/abc123/results.csv',
            fullJson: 'private/bulk-edit/abc123/results-full.json',
        });
    });
});

describe('bulk-edit/export: writeJobExports', () => {
    it('writes JSON and CSV with expected content types', async () => {
        const { mod, files, writes } = loadFilesStub();
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
        const document = JSON.parse(writes['private/bulk-edit/job-1/results.json']);
        expect(document.jobId).to.equal('job-1');
        expect(document.items).to.have.lengthOf(1);
        expect(writes['private/bulk-edit/job-1/results.csv']).to.include('fragment_id,path,locale');
    });
});

describe('bulk-edit/export: readExportItems', () => {
    it('returns items from the exported JSON document', async () => {
        const { mod, writes } = loadFilesStub();
        const items = [{ id: 'a' }];
        writes['private/bulk-edit/job-1/results.json'] = JSON.stringify({ items });
        const read = await mod.readExportItems('job-1');
        expect(read).to.deep.equal(items);
    });
});

describe('bulk-edit/export: exportDownloadResponse', () => {
    it('returns a download URL in the response body', async () => {
        const { mod, files } = loadFilesStub();
        const res = await mod.exportDownloadResponse('job-1', 'json');
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.equal({
            jobId: 'job-1',
            format: 'json',
            downloadUrl: 'https://files.example/presigned',
            expiresIn: mod.PRESIGN_TTL_SECONDS,
        });
        expect(files.generatePresignURL).to.have.been.calledWith('private/bulk-edit/job-1/results.json', {
            expiryInSeconds: mod.PRESIGN_TTL_SECONDS,
            permissions: 'r',
        });
    });
});

describe('bulk-edit/export: deleteJobExports', () => {
    it('deletes both export files', async () => {
        const { mod, deleted } = loadFilesStub();
        await mod.deleteJobExports('job-1');
        expect(deleted).to.include('private/bulk-edit/job-1/results.json');
        expect(deleted).to.include('private/bulk-edit/job-1/results.csv');
        expect(deleted).to.include('private/bulk-edit/job-1/results-full.json');
    });
});
