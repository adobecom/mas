const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const TOKEN = 'xyz'.repeat(4);

describe('bulk-publish/report-action.js', function () {
    this.timeout(10000);
    let action, generateReportStub, readProjectStub, isAllowedStub, checkMissingStub, loggerStub;
    const projectWithStatus = (status) => ({ fragment: { fields: [{ name: 'status', values: [status] }] } });
    const load = () =>
        proxyquire('../../src/bulk-publish/report-action.js', {
            '@adobe/aio-sdk': { Core: { Logger: () => loggerStub } },
            './report.js': { generateReport: generateReportStub },
            './project.js': {
                PROJECT_STATUS: {
                    PUBLISHED: 'Published',
                    PARTIALLY_PUBLISHED: 'Partially published',
                    FAILED: 'Failed',
                },
                readProjectFragment: readProjectStub,
            },
            '../../utils.js': {
                errorResponse: (status, message) => ({ statusCode: status, body: { error: message } }),
                checkMissingRequestInputs: checkMissingStub,
                getBearerToken: () => TOKEN,
                isAllowed: isAllowedStub,
                parseOwBody: (p) => p,
            },
        });

    beforeEach(() => {
        loggerStub = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), debug: sinon.stub() };
        generateReportStub = sinon.stub().resolves({
            summary: { total: 1, live: 1, failed: 0, notLive: 0 },
            errors: [{ path: '/content/dam/mas/acom/en_US/a', message: 'boom' }],
            rows: [],
        });
        readProjectStub = sinon.stub().resolves(projectWithStatus('Published'));
        isAllowedStub = sinon.stub().resolves(true);
        checkMissingStub = sinon.stub().returns(null);
        action = load();
    });
    afterEach(() => sinon.restore());

    const valid = { odinEndpoint: 'https://odin', Authorization: `Bearer ${TOKEN}`, projectId: 'p1' };

    it('returns 200 with the report for a Published project', async () => {
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(200);
        expect(res.body.summary.live).to.equal(1);
        expect(generateReportStub.firstCall.args[0]).to.include({ projectId: 'p1', odinEndpoint: 'https://odin' });
    });

    it('returns 400 when the endpoint is missing', async () => {
        const { odinEndpoint, ...withoutEndpoint } = valid;
        const res = await action.main(withoutEndpoint);
        expect(res.statusCode).to.equal(400);
        expect(generateReportStub.called).to.equal(false);
    });

    it('returns 400 when required inputs are missing', async () => {
        checkMissingStub.returns('missing projectId');
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(400);
        expect(generateReportStub.called).to.equal(false);
    });

    it('returns 401 when authorization fails', async () => {
        isAllowedStub.resolves(false);
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(401);
        expect(generateReportStub.called).to.equal(false);
    });

    ['Draft', 'Publishing'].forEach((status) => {
        it(`returns 409 for a ${status} project`, async () => {
            readProjectStub.resolves(projectWithStatus(status));
            const res = await action.main(valid);
            expect(res.statusCode).to.equal(409);
            expect(generateReportStub.called).to.equal(false);
        });
    });

    it('returns 500 when generateReport rejects', async () => {
        generateReportStub.rejects(new Error('odin unreachable'));
        const res = await action.main(valid);
        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.equal('odin unreachable');
    });

    it('never exposes the token in the response or in logger calls', async () => {
        const res = await action.main(valid);
        const logged = ['info', 'warn', 'error', 'debug'].flatMap((level) => loggerStub[level].args.flat());
        expect(JSON.stringify(res.body)).to.not.include(TOKEN);
        expect(JSON.stringify(logged)).to.not.include(TOKEN);
    });
});
