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
    it('writes JSON and CSV for find jobs', async () => {
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

    it('writes JSON only for replace jobs', async () => {
        const { mod, files, writes } = loadFilesStub();
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
        expect(writes['private/bulk-edit/job-1/results.csv']).to.equal(undefined);
    });

    it('writeFullExport stores modified fragments for dry-run replace jobs', async () => {
        const { mod, writes } = loadFilesStub();
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
        const document = JSON.parse(writes['private/bulk-edit/job-1/results-full.json']);
        expect(document.type).to.equal('replace');
        expect(document.items).to.have.lengthOf(1);
        expect(document.items[0].fields[0].values[0]).to.equal('Campus offer');
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

describe('bulk-edit/export: exportFileExists', () => {
    it('returns true when the export file is readable', async () => {
        const { mod, writes } = loadFilesStub();
        writes['private/bulk-edit/job-1/results.json'] = '{}';
        expect(await mod.exportFileExists('job-1', 'json')).to.equal(true);
    });
    it('returns false when the export file is missing', async () => {
        const { mod } = loadFilesStub();
        expect(await mod.exportFileExists('job-1', 'json')).to.equal(false);
    });
});

describe('bulk-edit/export: exportPresignUrl', () => {
    it('returns a presigned URL for JSON or CSV paths', async () => {
        const { mod, files, writes } = loadFilesStub();
        writes['private/bulk-edit/job-1/results.json'] = '{}';
        writes['private/bulk-edit/job-1/results.csv'] = 'fragment_id\n';
        expect(await mod.exportPresignUrl('job-1', 'json')).to.equal('https://files.example/presigned');
        expect(await mod.exportPresignUrl('job-1', 'csv')).to.equal('https://files.example/presigned');
        expect(files.generatePresignURL.callCount).to.equal(2);
    });
});

describe('bulk-edit/export: exportRedirectResponse', () => {
    it('returns 302 with a presigned Location for JSON', async () => {
        const { mod, files, writes } = loadFilesStub();
        writes['private/bulk-edit/job-1/results.json'] = '{"jobId":"job-1"}';
        const res = await mod.exportRedirectResponse('job-1', 'json');
        expect(res.statusCode).to.equal(302);
        expect(res.headers.Location).to.equal('https://files.example/presigned');
        expect(files.generatePresignURL.firstCall.args[0]).to.equal('private/bulk-edit/job-1/results.json');
    });
    it('returns 302 with a presigned Location for CSV', async () => {
        const { mod, files, writes } = loadFilesStub();
        writes['private/bulk-edit/job-1/results.csv'] = 'fragment_id,path\n';
        const res = await mod.exportRedirectResponse('job-1', 'csv');
        expect(res.statusCode).to.equal(302);
        expect(files.generatePresignURL.firstCall.args[0]).to.equal('private/bulk-edit/job-1/results.csv');
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
