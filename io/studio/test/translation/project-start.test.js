const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('Translation project-start', () => {
    let projectStart;
    let mockLogger;
    let mockIms;
    let fetchStub;
    let setTimeoutStub;

    beforeEach(() => {
        // Setup logger mock
        mockLogger = {
            info: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
        };

        // Setup IMS mock
        mockIms = {
            validateTokenAllowList: sinon.stub(),
        };

        const ImsConstructorStub = sinon.stub().returns(mockIms);

        // Setup fetch stub
        fetchStub = sinon.stub();

        // Setup setTimeout stub for retry delays
        setTimeoutStub = sinon.stub(global, 'setTimeout').callsFake((fn) => {
            fn();
            return 1;
        });

        // Load module with mocks using proxyquire
        // Note: utils.js is not stubbed and will use actual implementation
        projectStart = proxyquire('../../src/translation/project-start.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
            '@adobe/aio-lib-ims': {
                Ims: ImsConstructorStub,
            },
            fetch: fetchStub,
            global: {
                fetch: fetchStub,
            },
        });

        // Override global fetch
        global.fetch = fetchStub;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('main function', () => {
        it('should be defined', () => {
            expect(projectStart.main).to.be.a('function');
        });

        it('should return 400 if required parameters are missing', async () => {
            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                // Missing projectId
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.include('projectId');
        });

        it('should return 403 if client ID is not allowed', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: false });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(403);
            expect(result.error.body.error).to.equal('Forbidden: Invalid client ID');
        });

        it('should return 404 if translation project is not found', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });
            fetchStub.onFirstCall().resolves({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(404);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to fetch translation project/));
        });

        it('should return 400 if translation project is incomplete (no items)', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: [] },
                    { name: 'targetLocales', values: ['de_DE', 'fr_FR'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.equal('Translation project is incomplete (missing items or locales)');
            expect(mockLogger.warn).to.have.been.calledWith('No items to translate found in translation project');
        });

        it('should return 400 if translation project is incomplete (missing locales)', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1', '/content/fragment2'] },
                    { name: 'targetLocales', values: [] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(400);
            expect(mockLogger.warn).to.have.been.calledWith('No locales found in translation project');
        });

        it('should return 500 if translation project fails to start', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // Make all loc requests fail
            fetchStub.onSecondCall().resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Failed to start translation project');
        });

        it('should successfully start translation project', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1', '/content/fragment2'] },
                    { name: 'targetLocales', values: ['de_DE', 'fr_FR'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // Make all loc requests succeed
            fetchStub.onSecondCall().resolves({ ok: true });
            fetchStub.onThirdCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            expect(result.body.message).to.equal('Translation project started');
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Successfully sent \d+ loc requests/));
        });

        it('should handle unexpected errors and return 500', async () => {
            // Make IMS validation throw an error
            mockIms.validateTokenAllowList.rejects(new Error('Unexpected IMS error'));

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Internal server error');
            expect(mockLogger.error).to.have.been.called;
        });
    });

    describe('IMS token validation', () => {
        it('should validate token with correct client ID', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['en-US'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            fetchStub.onSecondCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'valid-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            await projectStart.main(params);

            // Verify IMS was called with the token (extracted by getBearerToken from utils)
            expect(mockIms.validateTokenAllowList).to.have.been.called;
            const callArgs = mockIms.validateTokenAllowList.firstCall.args;
            expect(callArgs[0]).to.equal('token'); // Bearer token without 'Bearer ' prefix
            expect(callArgs[1]).to.deep.equal(['valid-client-id']);
        });

        it('should reject token with invalid response', async () => {
            mockIms.validateTokenAllowList.resolves(null);

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(403);
        });
    });

    describe('Translation project fetching', () => {
        it('should fetch project with correct headers', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            fetchStub.onSecondCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-123',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            await projectStart.main(params);

            expect(fetchStub.firstCall.args[0]).to.equal('https://test-odin.com/adobe/sites/cf/fragments/test-project-123');
            expect(fetchStub.firstCall.args[1]).to.deep.include({
                headers: {
                    Authorization: 'Bearer token',
                },
            });
        });

        it('should handle fetch errors gracefully', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });
            fetchStub.onFirstCall().rejects(new Error('Network error'));

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(404);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Error fetching translation project/));
        });
    });

    describe('Batch processing with retry logic', () => {
        it('should process items in batches', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            // Create 15 items to test batching (BATCH_SIZE is 10)
            const items = Array.from({ length: 15 }, (_, i) => `/content/fragment${i + 1}`);

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: items },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // Make all subsequent calls succeed
            fetchStub.resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            // Should have called fetch 16 times: 1 for project fetch + 15 for loc requests
            expect(fetchStub.callCount).to.equal(16);
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Processing batch 1 of 2/));
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Processing batch 2 of 2/));
        });

        it('should retry failed requests up to 3 times', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // Fail twice, then succeed
            fetchStub.onSecondCall().resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onThirdCall().resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(3).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            // Should retry 3 times total for the failing request
            expect(fetchStub.callCount).to.be.at.least(4); // 1 project fetch + 3 retries for loc request
        });

        it('should fail after max retries exhausted', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // Fail all retry attempts
            fetchStub.resolves({ ok: false, status: 500, statusText: 'Error' });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to send loc request for fragment/));
        });

        it('should handle network errors with retry', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // Throw network error twice, then succeed
            fetchStub.onSecondCall().rejects(new Error('Network timeout'));
            fetchStub.onThirdCall().rejects(new Error('Network timeout'));
            fetchStub.onCall(3).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            expect(mockLogger.warn).to.have.been.calledWith(sinon.match(/Error sending loc request for fragment/));
        });
    });

    describe('Localization request payload', () => {
        it('should send correct payload with target locales and machineTranslation flag', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE', 'fr_FR', 'it_IT'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            fetchStub.onSecondCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            await projectStart.main(params);

            const locRequestCall = fetchStub.secondCall;
            expect(locRequestCall.args[0]).to.include('/bin/sendToLocalisationAsync?path=/content/fragment1');

            const requestBody = JSON.parse(locRequestCall.args[1].body);
            expect(requestBody).to.deep.equal({
                targetLocales: ['de_DE', 'fr_FR', 'it_IT'],
                machineTranslation: true,
            });

            expect(locRequestCall.args[1].headers).to.deep.include({
                Authorization: 'Bearer token',
                'Content-Type': 'application/json',
            });
        });
    });

    describe('Mixed success and failure scenarios', () => {
        it('should report partial failures when some requests fail', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'items', values: ['/content/fragment1', '/content/fragment2', '/content/fragment3'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
            });

            // First loc request succeeds
            fetchStub.onSecondCall().resolves({ ok: true });

            // Second loc request fails all retries
            fetchStub.onCall(2).resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(3).resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(4).resolves({ ok: false, status: 500, statusText: 'Error' });

            // Third loc request succeeds
            fetchStub.onCall(5).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/1 request\(s\) failed after retries/));
        });
    });
});
