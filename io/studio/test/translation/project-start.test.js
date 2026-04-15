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
function createFetchStub(routes = {}, defaultResponse = { ok: true, status: 200, json: () => Promise.resolve({}) }) {
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

async function executeProjectStart(service, params) {
    try {
        const context = await service.prepareProjectStart(params);
        const versioningResult = await service.runVersioningStage(context);
        if (!versioningResult.success) {
            throw service.createProjectStartError(500, 'Failed to version target fragments');
        }
        await service.runPostVersioningStage(context);
        return service.finalizeProjectStart(context);
    } catch (error) {
        if (service.isProjectStartError(error)) {
            return {
                error: {
                    statusCode: error.statusCode,
                    body: {
                        error: error.message,
                    },
                },
            };
        }

        return {
            error: {
                statusCode: 500,
                body: {
                    error: `Internal server error - ${error.message}`,
                },
            },
        };
    }
}

describe('Translation project-start', () => {
    let projectStartService;
    let mockLogger;
    let fetchStub;

    const baseParams = {
        __ow_headers: { authorization: 'Bearer token' },
        projectId: 'test-project-id',
        surface: 'acom',
        batchSize: 10,
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
            { name: 'projectType', values: ['translation'] },
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

        // Setup setTimeout stub for retry delays
        sinon.stub(global, 'setTimeout').callsFake((fn) => {
            fn();
            return 1;
        });

        // Default fetch stub (will be overridden in tests)
        fetchStub = sinon.stub();

        // Load module with mocks using proxyquire
        projectStartService = proxyquire('../../src/translation/project-start-service.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
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
            expect(projectStartService.prepareProjectStart).to.be.a('function');
            expect(projectStartService.runVersioningStage).to.be.a('function');
            expect(projectStartService.runPostVersioningStage).to.be.a('function');
            expect(projectStartService.finalizeProjectStart).to.be.a('function');
        });

        it('should return 400 if project ID is missing', async () => {
            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                surface: 'acom',
            };

            const result = await executeProjectStart(projectStartService, params);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.include('projectId');
        });

        it('should return 400 if surface is missing', async () => {
            const params = {
                __ow_headers: { authorization: 'Bearer token' },
                projectId: 'test-project-id',
            };

            const result = await executeProjectStart(projectStartService, params);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.include('surface');
        });

        it('should return 500 if translation project is not found', async () => {
            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.error(500, 'Not Found'),
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Error fetching translation project/));
        });

        it('should return 400 if translation project is incomplete (no items)', async () => {
            const mockProjectCF = createMockProjectCF();

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.error.statusCode).to.equal(400);
            expect(result.error.body.error).to.equal('Translation project is incomplete (missing items or locales)');
            expect(mockLogger.warn).to.have.been.calledWith(
                'No items to translate found in translation project: test-project-id',
            );
        });

        it('should return 400 if translation project is incomplete (missing locales)', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1', '/content/dam/mas/foo/en_US/fragment2'],
                targetLocales: [],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.error.statusCode).to.equal(400);
            expect(mockLogger.warn).to.have.been.calledWith('No locales found in translation project');
        });

        it('should return 500 if translation project fails to start', async () => {
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

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Failed to start translation project');
        });

        it('should successfully start translation project', async () => {
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

            const result = await executeProjectStart(projectStartService, params);

            expect(result.statusCode).to.equal(200);
            expect(result.body.message).to.equal('Translation project started');
            expect(result.body.submissionDate).to.equal('2026-02-04T11:00:00Z');
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Successfully sent loc request/));
        });

        it('should handle unexpected errors and return 500', async () => {
            setupFetchStub({});
            fetchStub.rejects(new Error('Unexpected fetch error'));

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal(
                'Internal server error - Failed to fetch translation project: Unexpected fetch error',
            );
        });
    });

    describe('Rollout project type', () => {
        it('should start rollout project and return "Rollout project started" when projectType is rollout', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                projectType: ['rollout'],
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                targetLocales: ['de_DE', 'fr_FR'],
            });
            const updatedFragment = getUpdatedFragment(mockProjectCF);

            const { stub, callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(updatedFragment, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/localeSync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            expect(result.body.message).to.equal('Rollout project started');
            expect(result.body.submissionDate).to.equal('2026-02-04T11:00:00Z');
            expect(callCounts['/bin/localeSync']).to.equal(1);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.be.undefined;
            const localeSyncCall = stub.getCalls().find((call) => call.args[0].includes('/bin/localeSync'));
            expect(localeSyncCall).to.exist;
            const requestBody = JSON.parse(localeSyncCall.args[1].body);
            expect(requestBody.items).to.be.an('array').with.lengthOf(1);
            expect(requestBody.items[0]).to.deep.include({
                contentPath: '/content/dam/mas/foo/en_US/fragment1',
                targetLocales: ['de_DE', 'fr_FR'],
                syncNestedCFs: false,
            });
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Project type: rollout/));
            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/Successfully sent rollout request/));
        });

        it('should return 500 when projectType is rollout and rollout request fails', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                projectType: ['rollout'],
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/localeSync': [
                    responses.error(500, 'Internal Server Error'),
                    responses.error(500, 'Internal Server Error'),
                    responses.error(500, 'Internal Server Error'),
                ],
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal('Failed to start rollout only project');
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to send rollout request/));
        });

        it('should use translation flow when projectType is translation', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                projectType: ['translation'],
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });
            const updatedFragment = getUpdatedFragment(mockProjectCF);

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(updatedFragment, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            expect(result.body.message).to.equal('Translation project started');
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(1);
        });
    });

    describe('Translation project fetching', () => {
        it('should fetch project with correct headers', async () => {
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

            await executeProjectStart(projectStartService, params);

            // Find the call that fetched the project
            const projectFetchCall = stub
                .getCalls()
                .find((call) => call.args[0].includes('/adobe/sites/cf/fragments/test-project-123'));

            expect(projectFetchCall).to.exist;
            expect(projectFetchCall.args[0]).to.equal('https://test-odin.com/adobe/sites/cf/fragments/test-project-123');
            expect(projectFetchCall.args[1]).to.deep.include({
                headers: {
                    Authorization: 'Bearer token',
                    'User-Agent': 'mas-translation-project',
                },
            });
        });

        it('should handle fetch errors gracefully', async () => {
            const { stub } = createFetchStub({});
            stub.rejects(new Error('Network error'));
            global.fetch = stub;

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal(
                'Internal server error - Failed to fetch translation project: Network error',
            );
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Error fetching translation project/));
        });
    });

    describe('Batch processing with retry logic', () => {
        it('should send translation items as single batch (cfPaths array)', async () => {
            const items = Array.from({ length: 15 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: items,
            });

            const { stub, callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(1);
            const locCall = stub.getCalls().find((call) => call.args[0].includes('/bin/sendToLocalisationAsync'));
            expect(locCall).to.exist;
            const requestBody = JSON.parse(locCall.args[1].body);
            expect(requestBody.cfPaths).to.be.an('array').with.lengthOf(15);
            expect(requestBody.cfPaths).to.deep.equal(items);
        });

        it('should process versioning in batches', async () => {
            // 15 fragments × 1 locale = 15 itemsToVersion (batch size 10 → 2 batches)
            const items = Array.from({ length: 15 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: items,
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': (url, options, callCount) =>
                    responses.ok({ items: [{ id: `version-target-${callCount}` }] }),
                '/versions': { ok: true },
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(1);
            expect(callCounts['/adobe/sites/cf/fragments?path=']).to.equal(15);
            expect(callCounts['/versions']).to.equal(15);
        });

        it('should process versioning with custom batch size when batchSize param is provided', async () => {
            // 30 fragments × 1 locale = 30 itemsToVersion (batch size 25 → 2 batches)
            const items = Array.from({ length: 30 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: items,
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': (url, options, callCount) =>
                    responses.ok({ items: [{ id: `version-target-${callCount}` }] }),
                '/versions': { ok: true },
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const params = {
                ...baseParams,
                batchSize: 25,
            };

            const result = await executeProjectStart(projectStartService, params);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(1);
            expect(callCounts['/adobe/sites/cf/fragments?path=']).to.equal(30);
            expect(callCounts['/versions']).to.equal(30);
        });

        it('should retry failed requests up to 3 times', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                // Fail twice, then succeed on third attempt
                '/bin/sendToLocalisationAsync': [responses.error(500, 'Error'), responses.error(500, 'Error'), { ok: true }],
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(3);
        });

        it('should fail after max retries exhausted', async () => {
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

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
            expect(mockLogger.error).to.have.been.calledWith(sinon.match(/Failed to send loc request/));
        });

        it('should handle network errors with retry', async () => {
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

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/bin/sendToLocalisationAsync']).to.equal(3);
        });

        it('should call onBatchCompleted with cumulative counts after each versioning batch', async () => {
            // 15 fragments × 1 locale = 15 items to version → 2 batches (10 + 5) with batchSize=10
            const items = Array.from({ length: 15 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);
            const mockProjectCF = setProjectFields(createMockProjectCF(), { fragments: items });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': (url, options, callCount) =>
                    responses.ok({ items: [{ id: `version-target-${callCount}` }] }),
                '/versions': { ok: true },
            });

            const context = await projectStartService.prepareProjectStart(baseParams);
            const onBatchCompleted = sinon.stub().resolves();

            await projectStartService.runVersioningStage(context, { onBatchCompleted });

            expect(onBatchCompleted).to.have.been.calledTwice;
            expect(onBatchCompleted.firstCall.args[0]).to.deep.equal({
                completedItemCount: 10,
                failedItemCount: 0,
                itemCount: 15,
            });
            expect(onBatchCompleted.secondCall.args[0]).to.deep.equal({
                completedItemCount: 15,
                failedItemCount: 0,
                itemCount: 15,
            });
        });

        it('should apply default rpsLimit of 10 when not provided in params', async () => {
            // 15 fragments × 1 locale = 15 items to version → 2 batches (batchSize=10)
            // default rpsLimit=10 → minBatchMs = 10/10*1000 = 1000ms
            // With Date.now stubbed to 0, elapsed=0 → wait=1000ms per batch
            const items = Array.from({ length: 15 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);
            const mockProjectCF = setProjectFields(createMockProjectCF(), { fragments: items });

            sinon.stub(Date, 'now').returns(0);

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': (url, options, callCount) =>
                    responses.ok({ items: [{ id: `version-target-${callCount}` }] }),
                '/versions': { ok: true },
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.statusCode).to.equal(200);
            // 2 versioning batches → 2 throttle sleeps at 1000ms each
            const throttleCalls = global.setTimeout.args.filter(([, delay]) => delay === 1000);
            expect(throttleCalls).to.have.lengthOf(2);
        });

        it('should use rpsLimit from params when provided', async () => {
            // 15 fragments × 1 locale = 15 items to version → 3 batches (batchSize=5)
            // rpsLimit=10 → minBatchMs = 5/10*1000 = 500ms (batchSize≤rpsLimit: burst stays within limit)
            // With Date.now stubbed to 0, elapsed=0 → wait=500ms per batch
            const items = Array.from({ length: 15 }, (_, i) => `/content/dam/mas/foo/en_US/fragment${i + 1}`);
            const mockProjectCF = setProjectFields(createMockProjectCF(), { fragments: items });

            sinon.stub(Date, 'now').returns(0);

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': (url, options, callCount) =>
                    responses.ok({ items: [{ id: `version-target-${callCount}` }] }),
                '/versions': { ok: true },
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, { ...baseParams, batchSize: 5, rpsLimit: 10 });

            expect(result.statusCode).to.equal(200);
            // 3 versioning batches → 3 throttle sleeps at 500ms each
            const throttleCalls = global.setTimeout.args.filter(([, delay]) => delay === 500);
            expect(throttleCalls).to.have.lengthOf(3);
        });
    });

    describe('Localization request payload', () => {
        it('should send correct payload with target locales and machineTranslation flag', async () => {
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

            await executeProjectStart(projectStartService, params);

            // Find the loc request call
            const locRequestCall = stub.getCalls().find((call) => call.args[0].includes('/bin/sendToLocalisationAsync'));

            expect(locRequestCall).to.exist;
            expect(locRequestCall.args[0]).to.include('/bin/sendToLocalisationAsync');

            const requestBody = JSON.parse(locRequestCall.args[1].body);
            expect(requestBody).to.deep.equal({
                includeNestedCFs: false,
                syncNestedCFs: false,
                targetLocales: ['de_DE', 'fr_FR', 'it_IT'],
                transcreation: true,
                cfPaths: ['/content/dam/mas/foo/en_US/fragment1'],
                taskName: 'Test Project',
            });

            expect(locRequestCall.args[1].headers).to.deep.include({
                Authorization: 'Bearer token',
                'Content-Type': 'application/json',
            });
        });
    });

    describe('Update translation submission date', () => {
        it('should update submission date after successful translation project start', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
            });

            const { lastCallOptions } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=': responses.notFound(),
                '/bin/sendToLocalisationAsync': { ok: true },
            });

            const result = await executeProjectStart(projectStartService, baseParams);

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

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result).to.have.property('error');
            expect(result.error.statusCode).to.equal(500);
        });

        it('should return 500 if submissionDate field is not found', async () => {
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

            const result = await executeProjectStart(projectStartService, baseParams);

            expect(result.error.statusCode).to.equal(500);
        });
    });

    describe('Update project status', () => {
        it('should refetch the project and patch the status with the latest etag', async () => {
            const mockProjectCF = {
                ...createMockProjectCF(),
                fields: [...createMockProjectCF().fields, { name: 'status', values: ['QUEUED'] }],
            };
            const { lastCallOptions, callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': [
                    responses.ok(mockProjectCF, '"fresh-etag"'),
                    responses.ok({ success: true }),
                ],
            });

            const result = await projectStartService.updateProjectStatus('test-project-id', 'RUNNING', 'token', {
                odinEndpoint: baseParams.odinEndpoint,
            });

            expect(result).to.deep.equal({ success: true, etag: null });
            expect(callCounts['/adobe/sites/cf/fragments/test-project-id']).to.equal(2);

            const options = lastCallOptions['/adobe/sites/cf/fragments/test-project-id'];
            expect(options.method).to.equal('PATCH');
            expect(options.headers).to.deep.include({
                Authorization: 'Bearer token',
                'Content-Type': 'application/json-patch+json',
                'If-Match': '"fresh-etag"',
            });

            const patchBody = JSON.parse(options.body);
            expect(patchBody).to.deep.equal([{ op: 'replace', path: '/fields/7/values', value: ['RUNNING'] }]);
        });

        it('should skip the patch when the project does not expose a status field', async () => {
            const mockProjectCF = {
                id: 'test-project-id',
                fields: [
                    { name: 'fragments', values: [] },
                    { name: 'collections', values: [] },
                    { name: 'placeholders', values: [] },
                    { name: 'targetLocales', values: ['de_DE'] },
                    { name: 'submissionDate', values: [] },
                    { name: 'title', values: ['Test Project'] },
                    { name: 'projectType', values: ['translation'] },
                ],
            };
            const { callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"fresh-etag"'),
            });

            const result = await projectStartService.updateProjectStatus('test-project-id', 'FAILED', 'token', {
                odinEndpoint: baseParams.odinEndpoint,
            });

            expect(result).to.deep.equal({ success: false, skipped: true });
            expect(callCounts['/adobe/sites/cf/fragments/test-project-id']).to.equal(1);
        });
    });

    describe('Sync dictionary if a placeholder is synced', () => {
        it('should send correct synchronization request if a placeholder is in the payload', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: ['/content/dam/mas/foo/en_US/fragment1'],
                placeholders: ['/content/dam/mas/foo/en_US/dictionary/placeholder1'],
                targetLocales: ['de_DE'],
            });

            const { lastCallOptions, callCounts, stub } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/dictionary/index': responses.ok({
                    items: [{ id: 'dict-de-id', etag: 'test-de-ph-etag', fields: [{ name: 'entries', values: [] }] }],
                }),
                '/adobe/sites/cf/fragments/dict-de-id': responses.ok(),
                '/bin/sendToLocalisationAsync': responses.ok(),
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            const results = await executeProjectStart(projectStartService, params);
            const statusCode = results.statusCode || (results.error && results.error.statusCode);
            expect(statusCode).to.equal(200);
            expect(callCounts['/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/dictionary/index']).to.equal(2);
            const dictionarySyncCalls = stub
                .getCalls()
                .filter((call) => call.args[0] === 'https://test-odin.com/adobe/sites/cf/fragments/dict-de-id');
            expect(dictionarySyncCalls).to.have.lengthOf(1);
            expect(lastCallOptions['/adobe/sites/cf/fragments/dict-de-id'].method).to.equal('PATCH');
            expect(lastCallOptions['/adobe/sites/cf/fragments/dict-de-id'].headers).to.deep.include({
                'If-Match': 'test-de-ph-etag',
            });
            const syncBody = JSON.parse(lastCallOptions['/adobe/sites/cf/fragments/dict-de-id'].body);
            expect(syncBody).to.be.an('array');
            expect(syncBody[0]).to.have.property('op', 'replace');
            expect(syncBody[0]).to.have.property('path', '/fields/0/values');
            expect(syncBody[0].value).to.be.an('array').with.lengthOf(1);
        });

        it('should fail in case of a and issue with the synchronization request', async () => {
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

            const result = await executeProjectStart(projectStartService, params);

            expect(result.error.statusCode).to.equal(500);
        });

        it('should fail when the target dictionary index does not expose the entries field', async () => {
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: [],
                placeholders: ['/content/dam/mas/foo/en_US/dictionary/placeholder1'],
                targetLocales: ['de_DE'],
            });

            setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/dictionary/index': responses.ok({
                    items: [{ id: 'dict-de-id', etag: 'dict-de-etag', fields: [] }],
                }),
                '/adobe/sites/cf/fragments/dict-de-id/versions': responses.ok(),
                '/bin/sendToLocalisationAsync': responses.ok(),
            });

            const result = await executeProjectStart(projectStartService, {
                ...baseParams,
                surface: 'foo',
            });

            expect(result.error.statusCode).to.equal(500);
            expect(result.error.body.error).to.equal(
                'Failed to sync: 1 request(s) failed: /content/dam/mas/foo/de_DE/dictionary/index target fragments',
            );
        });
    });

    describe('Sync variations if a grouped variation is synced', () => {
        it('should send correct synchronization request if a grouped variation is in the payload', async () => {
            const groupedVariationPath = '/content/dam/mas/foo/en_US/productCode/pzn/grouped-variation';
            const parentFragmentPath = '/content/dam/mas/foo/en_US/default-fragment';
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: [groupedVariationPath],
                targetLocales: ['de_DE'],
            });
            const updatedProjectCF = getUpdatedFragment(mockProjectCF);

            const { lastCallOptions, callCounts, stub } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': [
                    responses.ok(mockProjectCF, '"test-etag"'),
                    responses.ok(updatedProjectCF, '"test-etag"'),
                ],
                '/adobe/sites/cf/fragments/referencedBy': responses.ok({
                    items: [
                        {
                            path: groupedVariationPath,
                            parentReferences: [
                                {
                                    type: 'content-fragment',
                                    path: parentFragmentPath,
                                    title: 'Parent Fragment',
                                },
                            ],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/default-fragment': responses.ok({
                    items: [
                        {
                            id: 'parent-en-id',
                            path: parentFragmentPath,
                            etag: 'parent-en-etag',
                            fields: [{ name: 'variations', values: [groupedVariationPath] }],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/default-fragment': responses.ok({
                    items: [
                        {
                            id: 'parent-de-id',
                            path: '/content/dam/mas/foo/de_DE/default-fragment',
                            etag: 'parent-de-etag',
                            fields: [{ name: 'variations', values: [] }],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments/parent-de-id': responses.ok(),
                '/bin/sendToLocalisationAsync': responses.ok(),
            });

            const params = {
                ...baseParams,
                surface: 'foo',
            };

            const result = await executeProjectStart(projectStartService, params);

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/adobe/sites/cf/fragments/referencedBy']).to.equal(1);
            expect(callCounts['/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/default-fragment']).to.equal(1);
            expect(callCounts['/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/default-fragment']).to.equal(2);
            const parentSyncCalls = stub
                .getCalls()
                .filter((call) => call.args[0] === 'https://test-odin.com/adobe/sites/cf/fragments/parent-de-id');
            expect(parentSyncCalls).to.have.lengthOf(1);

            // Verify sync request for de_DE locale (variations use PUT, not PATCH)
            const deSyncOptions = lastCallOptions['/adobe/sites/cf/fragments/parent-de-id'];
            expect(deSyncOptions.method).to.equal('PUT');
            expect(deSyncOptions.headers).to.deep.include({
                'If-Match': 'parent-de-etag',
            });
            const deSyncBody = JSON.parse(deSyncOptions.body);
            expect(deSyncBody).to.have.property('fields');
            const variationsField = deSyncBody.fields.find((f) => f.name === 'variations');
            expect(variationsField).to.exist;
            expect(variationsField.values).to.be.an('array').with.lengthOf(1);
            expect(variationsField.values[0]).to.equal('/content/dam/mas/foo/de_DE/productCode/pzn/grouped-variation');
        });

        it('should skip variation sync when the target parent already contains the localized variation', async () => {
            const groupedVariationPath = '/content/dam/mas/foo/en_US/productCode/pzn/grouped-variation';
            const localizedVariationPath = '/content/dam/mas/foo/de_DE/productCode/pzn/grouped-variation';
            const parentFragmentPath = '/content/dam/mas/foo/en_US/default-fragment';
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: [groupedVariationPath],
                targetLocales: ['de_DE'],
            });

            const { stub, callCounts } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments/referencedBy': responses.ok({
                    items: [
                        {
                            path: groupedVariationPath,
                            parentReferences: [
                                {
                                    type: 'content-fragment',
                                    path: parentFragmentPath,
                                    title: 'Parent Fragment',
                                },
                            ],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/default-fragment': responses.ok({
                    items: [
                        {
                            id: 'parent-en-id',
                            path: parentFragmentPath,
                            etag: 'parent-en-etag',
                            fields: [{ name: 'variations', values: [groupedVariationPath] }],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/default-fragment': responses.ok({
                    items: [
                        {
                            id: 'parent-de-id',
                            path: '/content/dam/mas/foo/de_DE/default-fragment',
                            etag: 'parent-de-etag',
                            fields: [{ name: 'variations', values: [localizedVariationPath] }],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments/parent-de-id/versions': responses.ok(),
                '/bin/sendToLocalisationAsync': responses.ok(),
            });

            const result = await executeProjectStart(projectStartService, {
                ...baseParams,
                surface: 'foo',
            });

            expect(result.statusCode).to.equal(200);
            expect(callCounts['/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/default-fragment']).to.equal(2);
            const parentSyncCalls = stub
                .getCalls()
                .filter((call) => call.args[0] === 'https://test-odin.com/adobe/sites/cf/fragments/parent-de-id');
            expect(parentSyncCalls).to.have.lengthOf(0);
        });

        it('should create a variations field when the target parent fragment does not have one yet', async () => {
            const groupedVariationPath = '/content/dam/mas/foo/en_US/productCode/pzn/grouped-variation';
            const parentFragmentPath = '/content/dam/mas/foo/en_US/default-fragment';
            const mockProjectCF = setProjectFields(createMockProjectCF(), {
                fragments: [groupedVariationPath],
                targetLocales: ['de_DE'],
            });

            const { lastCallOptions } = setupFetchStub({
                '/adobe/sites/cf/fragments/test-project-id': responses.ok(mockProjectCF, '"test-etag"'),
                '/adobe/sites/cf/fragments/referencedBy': responses.ok({
                    items: [
                        {
                            path: groupedVariationPath,
                            parentReferences: [
                                {
                                    type: 'content-fragment',
                                    path: parentFragmentPath,
                                    title: 'Parent Fragment',
                                },
                            ],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/en_US/default-fragment': responses.ok({
                    items: [
                        {
                            id: 'parent-en-id',
                            path: parentFragmentPath,
                            etag: 'parent-en-etag',
                            fields: [{ name: 'variations', values: [groupedVariationPath] }],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments?path=/content/dam/mas/foo/de_DE/default-fragment': responses.ok({
                    items: [
                        {
                            id: 'parent-de-id',
                            title: 'Parent Fragment DE',
                            description: 'Localized parent fragment',
                            path: '/content/dam/mas/foo/de_DE/default-fragment',
                            etag: 'parent-de-etag',
                            fields: [{ name: 'title', values: ['Parent Fragment DE'] }],
                        },
                    ],
                }),
                '/adobe/sites/cf/fragments/parent-de-id/versions': responses.ok(),
                '/adobe/sites/cf/fragments/parent-de-id': responses.ok(),
                '/bin/sendToLocalisationAsync': responses.ok(),
            });

            const result = await executeProjectStart(projectStartService, {
                ...baseParams,
                surface: 'foo',
            });

            expect(result.statusCode).to.equal(200);
            const syncBody = JSON.parse(lastCallOptions['/adobe/sites/cf/fragments/parent-de-id'].body);
            const variationsField = syncBody.fields.find((field) => field.name === 'variations');
            expect(variationsField).to.deep.equal({
                name: 'variations',
                type: 'content-fragment',
                multiple: true,
                values: ['/content/dam/mas/foo/de_DE/productCode/pzn/grouped-variation'],
            });
        });
    });
});
