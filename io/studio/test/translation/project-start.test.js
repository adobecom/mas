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

    beforeEach(function () {
        // Increase timeout for this hook to 5 seconds to handle module loading
        this.timeout(5000);

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

        it('should return 400 if project ID is missing', async () => {
            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                surface: 'acom',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.include('projectId');
        });

        it('should return 400 if surface is missing', async () => {
            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.include('surface');
        });

        it('should return 401 if client ID is not allowed', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: false });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(401);
            expect(result.error.body.error).to.equal('Authorization failed');
        });

        it('should return 500 if translation project is not found', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });
            fetchStub.onFirstCall().resolves({
                ok: false,
                status: 500,
                statusText: 'Not Found',
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to fetch translation project/));
        });

        it('should return 400 if translation project is incomplete (no items)', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                fields: [
                    { name: 'fragments', values: [] },
                    { name: 'collections', values: [] },
                    { name: 'placeholders', values: [] },
                    { name: 'targetLocales', values: ['de_DE', 'fr_FR'] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
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
                    { name: 'fragments', values: ['/content/fragment1', '/content/fragment2'] },
                    { name: 'targetLocales', values: [] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
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
                id: 'test-project-id',
                fields: [
                    { name: 'collections', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Calls 1-3: loc request fails all retries (3 attempts)
            fetchStub.onCall(1).resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            fetchStub.onCall(2).resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            fetchStub.onCall(3).resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Failed to start translation project');
        });

        it('should successfully start translation project', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'collections', values: ['/content/collection1'] },
                    { name: 'placeholders', values: [] },
                    { name: 'targetLocales', values: ['de_DE', 'fr_FR'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Make all loc requests succeed
            fetchStub.onSecondCall().resolves({ ok: true });
            fetchStub.onThirdCall().resolves({ ok: true });

            // Make updateTranslationDate succeed
            fetchStub.onCall(3).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
                translationMapping: { acom: 'transcreation' },
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
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Internal server error - Unexpected IMS error');
            expect(mockLogger.error).to.have.been.called;
        });
    });

    describe('IMS token validation', () => {
        it('should validate token with correct client ID', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['en-US'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            fetchStub.onSecondCall().resolves({ ok: true });

            // Make updateTranslationDate succeed
            fetchStub.onThirdCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
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
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(401);
        });
    });

    describe('Translation project fetching', () => {
        it('should fetch project with correct headers', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            fetchStub.onSecondCall().resolves({ ok: true });

            // Make updateTranslationDate succeed
            fetchStub.onThirdCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-123',
                surface: 'acom',
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
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal(
                'Internal server error - Failed to fetch translation project: Network error',
            );
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Error fetching translation project/));
        });
    });

    describe('Batch processing with retry logic', () => {
        it('should process items in batches', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            // Create 15 items to test batching (BATCH_SIZE is 10)
            const items = Array.from({ length: 15 }, (_, i) => `/content/fragment${i + 1}`);

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: items },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Next 15 calls: loc requests (all succeed)
            for (let i = 1; i <= 15; i++) {
                fetchStub.onCall(i).resolves({ ok: true });
            }

            // Last call: updateTranslationDate
            fetchStub.onCall(16).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            // Should have called fetch 17 times: 1 for project fetch + 15 for loc requests + 1 for updateTranslationDate
            expect(fetchStub.callCount).to.equal(17);
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Processing batch 1 of 2/));
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Processing batch 2 of 2/));
        });

        it('should process items with custom batch size when batchSize param is provided', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            // Create 30 items to test batching with custom batch size of 25
            const items = Array.from({ length: 30 }, (_, i) => `/content/fragment${i + 1}`);

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: items },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Next 30 calls: loc requests (all succeed)
            for (let i = 1; i <= 30; i++) {
                fetchStub.onCall(i).resolves({ ok: true });
            }

            // Last call: updateTranslationDate
            fetchStub.onCall(31).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
                batchSize: 25,
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            // Should have called fetch 32 times: 1 for project fetch + 30 for loc requests + 1 for updateTranslationDate
            expect(fetchStub.callCount).to.equal(32);
            // With batchSize of 25, 30 items should be processed in 2 batches (25 + 5)
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Processing batch 1 of 2/));
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Processing batch 2 of 2/));
        });

        it('should retry failed requests up to 3 times', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Fail twice, then succeed on third attempt
            fetchStub.onCall(1).resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(2).resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(3).resolves({ ok: true });

            // Make updateTranslationDate succeed
            fetchStub.onCall(4).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            // Should retry 3 times total for the failing request
            expect(fetchStub.callCount).to.be.at.least(5); // 1 project fetch + 3 retries for loc request + 1 updateTranslationDate
        });

        it('should fail after max retries exhausted', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'collections', values: ['/content/collection1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Calls 1-3: loc request fails all 3 retries
            fetchStub.onCall(1).resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(2).resolves({ ok: false, status: 500, statusText: 'Error' });
            fetchStub.onCall(3).resolves({ ok: false, status: 500, statusText: 'Error' });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to send loc request for fragment/));
        });

        it('should handle network errors with retry', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'collections', values: ['/content/collection1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Throw network error twice, then succeed on third attempt
            fetchStub.onCall(1).rejects(new Error('Network timeout'));
            fetchStub.onCall(2).rejects(new Error('Network timeout'));
            fetchStub.onCall(3).resolves({ ok: true });

            // Make updateTranslationDate succeed
            fetchStub.onCall(4).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
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
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE', 'fr_FR', 'it_IT'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Second call: loc request
            fetchStub.onCall(1).resolves({ ok: true });

            // Third call: updateTranslationDate
            fetchStub.onCall(2).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
                translationMapping: { acom: 'transcreation' },
            };

            await projectStart.main(params);

            const locRequestCall = fetchStub.getCall(1);
            expect(locRequestCall.args[0]).to.include('/bin/sendToLocalisationAsync?path=/content/fragment1');

            const requestBody = JSON.parse(locRequestCall.args[1].body);
            expect(requestBody).to.deep.equal({
                targetLocales: ['de_DE', 'fr_FR', 'it_IT'],
                transcreation: true,
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
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1', '/content/fragment2', '/content/fragment3'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // All 3 fragments start their first attempt concurrently:
            // Call 1: fragment1 attempt 1 (succeeds)
            fetchStub.onCall(1).resolves({ ok: true });

            // Call 2: fragment2 attempt 1 (fails, will retry)
            fetchStub.onCall(2).resolves({ ok: false, status: 500, statusText: 'Error' });

            // Call 3: fragment3 attempt 1 (succeeds)
            fetchStub.onCall(3).resolves({ ok: true });

            // Now fragment2 retries:
            // Call 4: fragment2 attempt 2 (fails, will retry again)
            fetchStub.onCall(4).resolves({ ok: false, status: 500, statusText: 'Error' });

            // Call 5: fragment2 attempt 3 (fails, exhausted retries)
            fetchStub.onCall(5).resolves({ ok: false, status: 500, statusText: 'Error' });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/1 request\(s\) failed after retries/));
        });
    });

    describe('Update translation submission date', () => {
        it('should update submission date after successful translation project start', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Second call: loc request
            fetchStub.onCall(1).resolves({ ok: true });

            // Third call: updateTranslationDate
            fetchStub.onCall(2).resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);

            // Verify the PATCH request was made correctly
            const patchCall = fetchStub.getCall(2);
            expect(patchCall.args[0]).to.equal('https://test-odin.com/adobe/sites/cf/fragments/test-project-id');
            expect(patchCall.args[1].method).to.equal('PATCH');
            expect(patchCall.args[1].headers).to.deep.include({
                Authorization: 'Bearer token',
                'Content-Type': 'application/json-patch+json',
                'If-Match': '"test-etag"',
            });

            const patchBody = JSON.parse(patchCall.args[1].body);
            expect(patchBody).to.be.an('array');
            expect(patchBody[0]).to.have.property('op', 'replace');
            expect(patchBody[0]).to.have.property('path', '/fields/2/values');
            expect(patchBody[0].value).to.be.an('array').with.lengthOf(1);
            expect(patchBody[0].value[0]).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        it('should return 500 if submission date update fails', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                ],
            };

            // First call: fetch translation project
            fetchStub.onCall(0).resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Second call: loc request succeeds
            fetchStub.onCall(1).resolves({ ok: true });

            // Third call: updateTranslationDate fails
            fetchStub.onCall(2).resolves({ ok: false, status: 500, statusText: 'Internal Server Error' });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.match(
                /Internal server error - Failed to update translation project submission date/,
            );
            expect(mockLogger.error).to.have.been.calledWith(
                sinon.match(/Failed to update translation project submission date/),
            );
        });

        it('should return 500 if submissionDate field is not found', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/fragment1'] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    // Missing submissionDate field
                ],
            };

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve(mockProjectCF),
                headers: {
                    get: (name) => (name === 'etag' ? '"test-etag"' : null),
                },
            });

            // Make loc request succeed
            fetchStub.onSecondCall().resolves({ ok: true });

            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
                surface: 'acom',
                allowedClientId: 'test-client-id',
                odinEndpoint: 'https://test-odin.com',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Submission date field not found/));
        });
    });
});
