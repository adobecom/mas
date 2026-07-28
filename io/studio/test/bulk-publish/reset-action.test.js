const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish reset-action', () => {
    let action, updateProjectFragment, readProjectFragment, isAllowed;

    const PENDING = JSON.stringify({ fragmentId: 'f1', versionId: 'v1', publishComplete: false });
    const params = { projectId: 'proj-1', odinEndpoint: 'https://odin', __ow_headers: { authorization: 'Bearer t' } };

    beforeEach(() => {
        updateProjectFragment = sinon.stub().resolves();
        readProjectFragment = sinon.stub().resolves({ fragment: { id: 'proj-1' } });
        isAllowed = sinon.stub().resolves(true);

        action = proxyquire('../../src/bulk-publish/reset-action.js', {
            './project.js': {
                PROJECT_STATUS: require('../../src/bulk-publish/project.js').PROJECT_STATUS,
                readProjectFragment,
                updateProjectFragment,
                getProjectSnapshots: sinon.stub().returns([PENDING]),
                removePendingMarker: require('../../src/bulk-publish/project.js').removePendingMarker,
            },
            '../../utils.js': {
                errorResponse: (statusCode, message) => ({ statusCode, body: { error: message } }),
                getBearerToken: () => 't',
                isAllowed,
                parseOwBody: (p) => p,
            },
        });
    });

    afterEach(() => sinon.restore());

    it('resets a stuck project to Draft', async () => {
        const res = await action.main(params);

        expect(res.statusCode).to.equal(200);
        expect(updateProjectFragment.firstCall.args[3].status).to.equal('Draft');
    });

    it('strips the pending marker so the next publish takes a fresh snapshot', async () => {
        await action.main(params);

        const written = updateProjectFragment.firstCall.args[3];
        expect(JSON.parse(written.snapshots[0])).to.not.have.property('publishComplete');
    });

    it('preserves the snapshot entries themselves for revert history', async () => {
        await action.main(params);

        const written = updateProjectFragment.firstCall.args[3];
        expect(written.snapshots).to.have.lengthOf(1);
        expect(JSON.parse(written.snapshots[0]).fragmentId).to.equal('f1');
        expect(JSON.parse(written.snapshots[0]).versionId).to.equal('v1');
    });

    it('clears lastError', async () => {
        await action.main(params);

        expect(updateProjectFragment.firstCall.args[3].lastError).to.equal('');
    });

    it('rejects an unauthorized caller without writing', async () => {
        isAllowed.resolves(false);

        const res = await action.main(params);

        expect(res.statusCode).to.equal(401);
        expect(updateProjectFragment).to.not.have.been.called;
    });

    it('reports a 400 when projectId is missing', async () => {
        const res = await action.main({ odinEndpoint: 'https://odin', __ow_headers: { authorization: 'Bearer t' } });

        expect(res.statusCode).to.equal(400);
        expect(updateProjectFragment).to.not.have.been.called;
    });
});
