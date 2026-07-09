const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/save-snapshot-action.js', () => {
    let action;
    let recordSnapshotStub;
    let readProjectStub;
    let updateProjectStub;
    let getProjectPathsStub;

    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';
    const projectId = 'proj-123';

    beforeEach(() => {
        recordSnapshotStub = sinon.stub();
        readProjectStub = sinon.stub();
        updateProjectStub = sinon.stub().resolves();
        getProjectPathsStub = sinon.stub();

        action = proxyquire('../../src/bulk-publish/save-snapshot-action.js', {
            './snapshot.js': { '@noCallThru': true, recordSnapshot: recordSnapshotStub },
            './project.js': {
                '@noCallThru': true,
                readProjectFragment: readProjectStub,
                updateProjectFragment: updateProjectStub,
                getProjectPaths: getProjectPathsStub,
            },
        });
    });

    afterEach(() => sinon.restore());

    it('returns 400 when projectId is missing', async () => {
        const result = await action.main({ authToken, aemOdinEndpoint: odinEndpoint });
        expect(result.statusCode).to.equal(400);
        expect(result.body.error).to.match(/projectId/);
    });

    it('returns 400 when authToken is missing', async () => {
        const result = await action.main({ projectId, aemOdinEndpoint: odinEndpoint });
        expect(result.statusCode).to.equal(400);
        expect(result.body.error).to.match(/authToken/);
    });

    it('returns 200 with entries and calls updateProjectFragment with snapshots', async () => {
        readProjectStub.resolves({ fragment: { fields: [] } });
        getProjectPathsStub.returns(['/content/dam/a', '/content/dam/b']);
        const entries = ['{"fragmentId":"f1","versionId":"v-green","wasPublished":true,"createdAt":"2026-01-01T00:00:00Z"}'];
        recordSnapshotStub.resolves(entries);

        const result = await action.main({ projectId, authToken, aemOdinEndpoint: odinEndpoint });

        expect(result.statusCode).to.equal(200);
        expect(result.body.entries).to.deep.equal(entries);
        expect(updateProjectStub).to.have.been.calledOnce;
        expect(updateProjectStub.firstCall.args[3].snapshots).to.deep.equal(entries);
    });

    it('returns 200 with empty entries and skips recordSnapshot when project has no paths', async () => {
        readProjectStub.resolves({ fragment: { fields: [] } });
        getProjectPathsStub.returns([]);

        const result = await action.main({ projectId, authToken, aemOdinEndpoint: odinEndpoint });

        expect(result.statusCode).to.equal(200);
        expect(result.body.entries).to.deep.equal([]);
        expect(recordSnapshotStub).to.not.have.been.called;
        expect(updateProjectStub).to.not.have.been.called;
    });

    it('returns 500 on unexpected error', async () => {
        readProjectStub.rejects(new Error('network failure'));

        const result = await action.main({ projectId, authToken, aemOdinEndpoint: odinEndpoint });

        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.equal('network failure');
    });
});
