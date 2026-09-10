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
    let getBearerTokenStub;
    let isAllowedStub;
    let parseOwBodyStub;
    let errorResponseStub;

    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';
    const projectId = 'proj-123';

    beforeEach(() => {
        recordSnapshotStub = sinon.stub();
        readProjectStub = sinon.stub();
        updateProjectStub = sinon.stub().resolves();
        getProjectPathsStub = sinon.stub();
        getBearerTokenStub = sinon.stub().returns(authToken);
        isAllowedStub = sinon.stub().resolves(true);
        parseOwBodyStub = sinon.stub().callsFake((p) => p);
        errorResponseStub = sinon.stub().callsFake((code, msg) => ({ statusCode: code, body: { error: msg } }));

        action = proxyquire('../../src/bulk-publish/save-snapshot-action.js', {
            './snapshot.js': { '@noCallThru': true, recordSnapshot: recordSnapshotStub },
            './project.js': {
                '@noCallThru': true,
                readProjectFragment: readProjectStub,
                updateProjectFragment: updateProjectStub,
                getProjectPaths: getProjectPathsStub,
            },
            '../../utils.js': {
                '@noCallThru': true,
                getBearerToken: getBearerTokenStub,
                isAllowed: isAllowedStub,
                parseOwBody: parseOwBodyStub,
                errorResponse: errorResponseStub,
            },
        });
    });

    afterEach(() => sinon.restore());

    it('returns 400 when odinEndpoint is missing', async () => {
        const result = await action.main({ projectId, allowedClientId: 'cid' });
        expect(result.statusCode).to.equal(400);
        expect(result.body.error).to.match(/odinEndpoint/);
    });

    it('returns 401 when isAllowed returns false', async () => {
        isAllowedStub.resolves(false);
        const result = await action.main({ projectId, aemOdinEndpoint: odinEndpoint, allowedClientId: 'cid' });
        expect(result.statusCode).to.equal(401);
    });

    it('returns 400 when projectId is missing after parseOwBody', async () => {
        parseOwBodyStub.returns({ aemOdinEndpoint: odinEndpoint });
        const result = await action.main({});
        expect(result.statusCode).to.equal(400);
        expect(result.body.error).to.match(/projectId/);
    });

    it('returns 200 with entries and calls updateProjectFragment with snapshots and lastError', async () => {
        readProjectStub.resolves({ fragment: { fields: [] } });
        getProjectPathsStub.returns(['/content/dam/a', '/content/dam/b']);
        const entries = ['{"fragmentId":"f1","versionId":"v-green","wasPublished":true,"createdAt":"2026-01-01T00:00:00Z"}'];
        recordSnapshotStub.resolves({ entries, failures: [] });

        const result = await action.main({ projectId, aemOdinEndpoint: odinEndpoint, allowedClientId: 'cid' });

        expect(result.statusCode).to.equal(200);
        expect(result.body.entries).to.deep.equal(entries);
        expect(result.body.lastError).to.equal('');
        expect(updateProjectStub).to.have.been.calledOnce;
        expect(updateProjectStub.firstCall.args[3].snapshots).to.deep.equal(entries);
        expect(updateProjectStub.firstCall.args[3].lastError).to.equal('');
    });

    it('writes lastError to project fragment when some fragments fail', async () => {
        readProjectStub.resolves({ fragment: { fields: [] } });
        getProjectPathsStub.returns(['/content/dam/a', '/content/dam/b']);
        const entries = ['{"fragmentId":"f1","versionId":"v-green","wasPublished":true,"createdAt":"2026-01-01T00:00:00Z"}'];
        const failures = [{ path: '/content/dam/b', error: 'No non-translation version found for fragment: /content/dam/b' }];
        recordSnapshotStub.resolves({ entries, failures });

        const result = await action.main({ projectId, aemOdinEndpoint: odinEndpoint, allowedClientId: 'cid' });

        expect(result.statusCode).to.equal(200);
        expect(result.body.lastError).to.include('SAVE_SNAPSHOT:');
        expect(result.body.lastError).to.include('/content/dam/b');
        expect(updateProjectStub.firstCall.args[3].lastError).to.include('SAVE_SNAPSHOT:');
    });

    it('returns 200 with empty entries and skips recordSnapshot when project has no paths', async () => {
        readProjectStub.resolves({ fragment: { fields: [] } });
        getProjectPathsStub.returns([]);

        const result = await action.main({ projectId, aemOdinEndpoint: odinEndpoint, allowedClientId: 'cid' });

        expect(result.statusCode).to.equal(200);
        expect(result.body.entries).to.deep.equal([]);
        expect(recordSnapshotStub).to.not.have.been.called;
        expect(updateProjectStub).to.not.have.been.called;
    });

    it('returns 500 on unexpected error', async () => {
        readProjectStub.rejects(new Error('network failure'));

        const result = await action.main({ projectId, aemOdinEndpoint: odinEndpoint, allowedClientId: 'cid' });

        expect(result.statusCode).to.equal(500);
        expect(result.body.error).to.equal('network failure');
    });

    it('calls parseOwBody when projectId is absent from raw params', async () => {
        parseOwBodyStub.returns({ projectId, aemOdinEndpoint: odinEndpoint });
        readProjectStub.resolves({ fragment: { fields: [] } });
        getProjectPathsStub.returns([]);

        const result = await action.main({});
        expect(parseOwBodyStub).to.have.been.calledOnce;
        expect(result.statusCode).to.equal(200);
    });
});
