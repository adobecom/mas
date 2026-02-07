const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

function getUpdatedFragment(projectCF) {
    return {
        ...projectCF,
        fields: projectCF.fields.map((field) =>
            field.name === 'submissionDate' ? { ...field, values: ['2026-02-04T11:00:00Z'] } : field,
        ),
    };
}

/**
 * Creates a fetch stub that routes responses based on URL patterns.
 * @param {Object} routes - Map of URL patterns to response handlers
 * @param {Object} defaultResponse - Default response for unmatched routes
 * @returns {Object} - Object with the stub and call tracking
 *
 * Routes can be:
 * - String: exact match or includes check
 * - RegExp: pattern match
 *
 * Response handlers can be:
 * - Object: returned as response
 * - Function: called with (url, options, callCount) and returns response
 * - Array: sequential responses (pops from array, uses last item when empty)
 */
function createFetchStub(routes = {}, defaultResponse = { ok: true }) {
    const callCounts = {};
    const lastCallOptions = {};
    const routeResponses = {};

    // Initialize response arrays (clone to avoid mutation)
    for (const [pattern, response] of Object.entries(routes)) {
        routeResponses[pattern] = Array.isArray(response) ? [...response] : response;
    }

    const stub = sinon.stub().callsFake(async (url, options = {}) => {
        for (const [pattern] of Object.entries(routes)) {
            const matches = pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern);

            if (matches) {
                callCounts[pattern] = (callCounts[pattern] || 0) + 1;
                lastCallOptions[pattern] = options;
                const currentCount = callCounts[pattern];

                let response = routeResponses[pattern];

                // Handle array of sequential responses
                if (Array.isArray(response)) {
                    response = response.length > 1 ? response.shift() : response[0];
                }

                // Handle function response generator
                if (typeof response === 'function') {
                    response = response(url, options, currentCount);
                }

                return response;
            }
        }

        // Return default response for unmatched routes
        return typeof defaultResponse === 'function' ? defaultResponse(url, options) : defaultResponse;
    });

    return { lastCallOptions, stub, callCounts };
}

// Helper to create common response types
const responses = {
    ok: (json = {}, etag = null) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(json),
        headers: {
            get: (name) => (name === 'etag' ? etag : null),
        },
    }),
    notFound: () => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({}),
    }),
    error: (status = 500, statusText = 'Internal Server Error') => ({
        ok: false,
        status,
        statusText,
        json: () => Promise.resolve({}),
    }),
};

describe('Translation project-start', () => {
    let projectStart;
    let mockLogger;
    let mockIms;
    let fetchStub;

    const baseParams = {
        __ow_headers: { authorization: 'Bearer token' },
        projectId: 'test-project-id',
        surface: 'acom',
        allowedClientId: 'test-client-id',
        odinEndpoint: 'https://test-odin.com',
    };

    const createMockProjectCF = (overrides = {}) => ({
        id: 'test-project-id',
        fields: [
            { name: 'fragments', values: [] },
            { name: 'collections', values: [] },
            { name: 'placeholders', values: [] },
            { name: 'targetLocales', values: ['de_DE'] },
            { name: 'submissionDate', values: [] },
            { name: 'title', values: ['Test Project'] },
        ],
        ...overrides,
    });

    const setProjectFields = (projectCF, fieldOverrides) => {
        const project = { ...projectCF };
        project.fields = project.fields.map((field) => {
            if (fieldOverrides[field.name] !== undefined) {
                return { ...field, values: fieldOverrides[field.name] };
            }
            return field;
        });
        return project;
    };

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

        // Setup setTimeout stub for retry delays
        sinon.stub(global, 'setTimeout').callsFake((fn) => {
            fn();
            return 1;
        });

        // Default fetch stub (will be overridden in tests)
        fetchStub = sinon.stub();

        // Load module with mocks using proxyquire
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

    /**
     * Sets up fetch stub with URI-based routing for tests
     */
    function setupFetchStub(routes = {}) {
        const { lastCallOptions, stub, callCounts } = createFetchStub(routes);
        fetchStub = stub;
        global.fetch = stub;
        return { lastCallOptions, stub, callCounts };
    }

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

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(401);
            expect(result.error.body.error).to.equal('Authorization failed');
        });

        it('should return 500 if translation project is not found', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.error(500, 'Not Found'),
            });

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Error fetching translation project/));
        });

        it('should return 400 if translation project is incomplete (no items)', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = createMockProjectCF();

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
            });

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.equal('Translation project is incomplete (missing items or locales)');
            expect(mockLogger.warn).to.have.been.calledWith(
                'No items to translate found in translation project: test-project-id',
            );
        });

        it('should return 400 if translation project is incomplete (missing locales)', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1', '/content/dam/mas/foo/en_US/fragment2'],
                targetLocales: [],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
            });

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(400);
            expect(mockLogger.warn).to.have.been.calledWith('No locales found in translation project');
        });

        it('should return 500 if translation project fails to start', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                collections: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/localeSync': { ok: true },
                // Fail all 3 retries for loc request
                '/bin/sendToLocalisationAsync': [
                    responses.error(500, 'Internal Server Error'),
                    responses.error(500, 'Internal Server Error'),
                    responses.error(500, 'Internal Server Error'),
                ],
            });

            const result = await projectStart.main(baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Failed to start translation project');
        });

        it('should successfully start translation project', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                collections: ['/content/dam/mas/foo/en_US/collection1'],
                targetLocales: ['de_DE', 'fr_FR'],
            });
            const updatedFragment = getUpdatedFragment(mockProjectCF);

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(updatedFragment, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                translationMapping: { acom: 'transcreation' },
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            expect(result.body.message).to.equal('Translation project started');
            expect(result.body.submissionDate).to.equal('2026-02-04T11:00:00Z');
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Successfully sent \d+ loc requests/));
        });

        it('should handle unexpected errors and return 500', async () => {
            // Make IMS validation throw an error
            mockIms.validateTokenAllowList.rejects(new Error('Unexpected IMS error'));

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Internal server error - Unexpected IMS error');
            expect(mockLogger.error).to.have.been.called;
        });
    });

    describe('IMS token validation', () => {
        it('should validate token with correct client ID', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                targetLocales: ['en-US'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                allowedClientId: 'valid-client-id',
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

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(401);
        });
    });

    describe('Translation project fetching', () => {
        it('should fetch project with correct headers', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            const { stub } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-123': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                __ow_headers: { authorization: 'Bearer token', 'Content-Type': 'application/json' },
                projectId: 'test-project-123',
            };

            await projectStart.main(params);

            // Find the call that fetched the project
            const projectFetchCall = stub
                .getCalls()
                .find((call) => call.args[0].includes('/adobe/sites/cf/fragments/test-project-123'));

            expect(projectFetchCall).to.exist;
            expect(projectFetchCall.args[0]).to.equal('https://test-odin.com/adobe/sites/cf/fragments/test-project-123');
            expect(projectFetchCall.args[1]).to.deep.include({
                headers: {
                    Authorization: 'Bearer token',
                    'Content-Type': 'application/json',
                },
            });
        });

        it('should handle fetch errors gracefully', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const { stub } = createFetchStub({});
            stub.rejects(new Error('Network error'));
            global.fetch = stub;

            const result = await projectStart.main(baseParams);

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
            const items = Array.from({ length: 15 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: items,
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await projectStart.main(baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/adobe/sites/cf/fragments?path=']).to.equal(15);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(15);
        });

        it('should process items with custom batch size when batchSize param is provided', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            // Create 30 items to test batching with custom batch size of 25
            const items = Array.from({ length: 30 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: items,
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                batchSize: 25,
            };

            const result = await projectStart.main(params);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/adobe/sites/cf/fragments?path=']).to.equal(30);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(30);
        });

        it('should retry failed requests up to 3 times', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                // Fail twice, then succeed on third attempt
                '/bin/sendToLocalisationAsync': [responses.error(500, 'Error'), responses.error(500, 'Error'), { ok: true }],
            });

            const result = await projectStart.main(baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(3);
        });

        it('should fail after max retries exhausted', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                collections: ['/content/dam/mas/foo/en_US/collection1'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                // All 3 retries fail
                '/bin/sendToLocalisationAsync': [
                    responses.error(500, 'Error'),
                    responses.error(500, 'Error'),
                    responses.error(500, 'Error'),
                ],
            });

            const result = await projectStart.main(baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to send loc request for fragment/));
        });

        it('should handle network errors with retry', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                collections: ['/content/dam/mas/foo/en_US/collection1'],
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                // Fail all 3 retries for loc request
                '/bin/sendToLocalisationAsync': [
                    responses.error(500, 'Internal Server Error'),
                    responses.error(500, 'Internal Server Error'),
                    { ok: true },
                ],
            });

            const result = await projectStart.main(baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(3);
        });
    });

    describe('Localization request payload', () => {
        it('should send correct payload with target locales and machineTranslation flag', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                targetLocales: ['de_DE', 'fr_FR', 'it_IT'],
            });

            const { stub } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                translationMapping: { acom: 'transcreation' },
            };

            await projectStart.main(params);

            // Find the loc request call
            const locRequestCall = stub.getCalls().find((call) => call.args[0].includes('/bin/sendToLocalisationAsync'));

            expect(locRequestCall).to.exist;
            expect(locRequestCall.args[0]).to.include('/bin/sendToLocalisationAsync?path=/content/dam/mas/foo/en_US/fragment1');

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

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: [
                    '/content/dam/mas/foo/en_US/fragment1',
                    '/content/dam/mas/foo/en_US/fragment2',
                    '/content/dam/mas/foo/en_US/fragment3',
                ],
            });

            // Use a function handler to control which fragment succeeds/fails
            let fragment2CallCount = 0;
            const { stub } = createFetchStub({});
            stub.callsFake(async (url) => {
                if (url.includes('/adobe/sites/cf/fragments/test-project-id') && !url.includes('?path=')) {
                    return responses.ok(mockProjectCF, '"test-etag"');
                }
                if (url.includes('/adobe/sites/cf/fragments?path=')) {
                    return responses.notFound();
                }
                if (url.includes('/bin/sendToLocalisationAsync')) {
                    // fragment1 and fragment3 succeed, fragment2 always fails
                    if (url.includes('fragment2')) {
                        fragment2CallCount++;
                        return responses.error(500, 'Error');
                    }
                    return { ok: true };
                }
                return { ok: true };
            });
            global.fetch = stub;

            const result = await projectStart.main(baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/1 request\(s\) failed after retries/));
            expect(fragment2CallCount).to.equal(3); // 3 retry attempts
        });
    });

    describe('Update translation submission date', () => {
        it('should update submission date after successful translation project start', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            const { lastCallOptions } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await projectStart.main(baseParams);

            expect(result.statusCode).to.equal(200);

            const options = lastCallOptions['/adobe/sites/cf/fragments/test-project-id'];
            expect(options.method).to.equal('PATCH');
            expect(options.headers).to.deep.include({
                Authorization: 'Bearer token',
                'Content-Type': 'application/json-patch+json',
                'If-Match': '"test-etag"',
            });

            const patchBody = JSON.parse(options.body);
            expect(patchBody).to.be.an('array');
            expect(patchBody[0]).to.have.property('op', 'replace');
            expect(patchBody[0]).to.have.property('path', '/fields/4/values');
            expect(patchBody[0].value).to.be.an('array').with.lengthOf(1);
            expect(patchBody[0].value[0]).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        });

        it('should return 500 if submission date update fails', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            // Use function to differentiate GET vs PATCH
            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': [
                    responses.ok(mockProjectCF, '"test-etag"'),
                    responses.error(500, 'Error updating submission date'),
                ],
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await projectStart.main(baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
        });

        it('should return 500 if submissionDate field is not found', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            // Project without submissionDate field
            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: ['/content/dam/mas/foo/en_US/fragment1'] },
                    { name: 'collections', values: [] },
                    { name: 'placeholders', values: [] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    // Missing submissionDate field
                ],
            };

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': [
                    responses.ok(mockProjectCF, '"test-etag"'),
                    responses.error(500, 'Error updating submission date'),
                ],
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await projectStart.main(baseParams);

            expect(result.error.statusCode).to.equal(500);
        });
    });

    describe('Sync dictionary if a placeholder is synced', () => {
        it('should send correct synchronization request if a placeholder is in the payload', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                placeholders: ['/content/dam/mas/foo/en_US/dictionary/placeholder1'],
                targetLocales: ['de_DE', 'fr_FR', 'it_IT'],
            });

            const { lastCallOptions, callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path/content/dam/mas/foo/de_DE/fragment1': responses.notFound(),
                '/adobe/sites/cf/fragments?path/content/dam/mas/foo/fr_FR.+': responses.notFound(),
                '/adobe/sites/cf/fragments?path/content/dam/mas/foo/it_IT.+': responses.notFound(),
                '/adobe/sites/cf/fragments?path/content/dam/mas/foo/de_DE/dictionary/placeholder1': responses.notFound(),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/dictionary/index': responses.ok({
                    items: [{ id: 'dict-de-id', fields: [{ name: 'entries', values: [] }] }],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/fr_FR/dictionary/index': responses.notFound(),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/it_IT/dictionary/index': responses.notFound(),
                '/adobe/sites/cf/fragments/dict-de-id/versions': responses.ok(),
                '/adobe/sites/cf/fragments/dict-de-id': responses.ok(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            const results = await projectStart.main(params);
            expect(results.statusCode).to.equal(200);
            expect(callCounts['/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/dictionary/index']).to.equal(1);
            expect(callCounts['/adobe/sites/cf/fragments/dict-de-id']).to.equal(1);
            expect(lastCallOptions['/adobe/sites/cf/fragments/dict-de-id'].method).to.equal('PATCH');
            const syncBody = JSON.parse(lastCallOptions['/adobe/sites/cf/fragments/dict-de-id'].body);
            expect(syncBody).to.be.an('array');
            expect(syncBody[0]).to.have.property('op', 'replace');
            expect(syncBody[0]).to.have.property('path', '/fields/0/values');
            expect(syncBody[0].value).to.be.an('array').with.lengthOf(1);
        });

        it('should fail in case of a and issue with the synchronization request', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: [],
                placeholders: ['/content/dam/mas/foo/en_US/dictionary/placeholder1'],
                targetLocales: ['de_DE'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path/content/dam/mas/foo/de_DE/dictionary/placeholder1': responses.notFound(),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/dictionary/index': responses.ok({
                    items: [{ id: 'dict-de-id', fields: [{ name: 'entries', values: [] }] }],
                }),
                '/adobe/sites/cf/fragments/dict-de-id/versions': responses.ok(),
                '/adobe/sites/cf/fragments/dict-de-id': responses.error(500, 'Internal Server Error'),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
        });
    });

    describe('Version target fragments when already present', () => {
        it('should version already existing target paths', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1', '/content/dam/mas/foo/en_US/fragment2'],
                placeholders: ['/content/dam/mas/foo/en_US/dictionary/placeholder1'],
                collections: ['/content/dam/mas/foo/en_US/collection1'],
                targetLocales: ['de_DE', 'fr_FR', 'it_IT'],
            });

            const { lastCallOptions, callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/fragment1': responses.notFound(),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/fr_FR/fragment2': responses.ok({
                    items: [{ id: 'fragment2-fr-id' }],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/dictionary/placeholder1': responses.notFound(),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/dictionary/collection1': responses.notFound(),
                '/adobe/sites/cf/fragments/fragment2-fr-id/versions': { ok: true },
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            await projectStart.main(params);

            expect(callCounts['/adobe/sites/cf/fragments/fragment2-fr-id/versions']).to.equal(1);
            expect(lastCallOptions['/adobe/sites/cf/fragments/fragment2-fr-id/versions'].method).to.equal('POST');
            const versionBody = JSON.parse(lastCallOptions['/adobe/sites/cf/fragments/fragment2-fr-id/versions'].body);
            expect(versionBody).to.deep.equal({
                comment: 'translation project \"Test Project\" (test-project-id)',
                label: 'Pre-translation version',
            });
        });

        it('should fail if we fail to check target fragment', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                placeholders: [],
                collections: [],
                targetLocales: ['de_DE'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/fragment1': responses.error(
                    500,
                    'Internal Server Error',
                ),
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
        });

        it('should fail if version fails', async () => {
            mockIms.validateTokenAllowList.resolves({ valid: true });

            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                placeholders: [],
                collections: [],
                targetLocales: ['de_DE'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/fragment1': responses.ok({
                    items: [{ id: 'fragment1-de-id' }],
                }),
                '/adobe/sites/cf/fragments/fragment1-de-id/versions': responses.error(500, 'Internal Server Error'),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            const result = await projectStart.main(params);

            expect(result.error.statusCode).to.equal(500);
        });
    });
});
