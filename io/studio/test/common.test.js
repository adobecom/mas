const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('common.js - fetchOdin', () => {
    let common;
    let mockLogger;
    let fetchStub;
    let performanceStub;

    const odinEndpoint = 'https://test-odin.example.com';
    const authToken = 'test-auth-token';

    beforeEach(function () {
        // Increase timeout for this hook to 5 seconds to handle module loading
        this.timeout(5000);

        mockLogger = {
            info: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
        };

        fetchStub = sinon.stub();

        performanceStub = {
            now: sinon.stub(),
        };
        performanceStub.now.onFirstCall().returns(0);
        performanceStub.now.onSecondCall().returns(150.5);

        common = proxyquire('../src/common.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
        });

        global.fetch = fetchStub;
        global.performance = performanceStub;
    });

    afterEach(() => {
        sinon.restore();
        delete global.fetch;
    });

    describe('successful requests', () => {
        it('should make a GET request with correct URL and headers', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns('"etag-value"'),
                },
            };
            fetchStub.resolves(mockResponse);

            const result = await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(fetchStub).to.have.been.calledOnce;
            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/api/test',
                sinon.match({
                    headers: {
                        Authorization: 'Bearer test-auth-token',
                        'User-Agent': 'mas-translation-project',
                    },
                    method: 'GET',
                    body: null,
                }),
            );
            expect(result).to.equal(mockResponse);
        });

        it('should make a POST request with body and Content-Type header', async () => {
            const mockResponse = {
                ok: true,
                status: 201,
                statusText: 'Created',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            const body = JSON.stringify({ key: 'value' });
            const result = await common.fetchOdin(odinEndpoint, '/api/resource', authToken, {
                method: 'POST',
                body,
            });

            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/api/resource',
                sinon.match({
                    headers: {
                        Authorization: 'Bearer test-auth-token',
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body,
                }),
            );
            expect(result).to.equal(mockResponse);
        });

        it('should make a PATCH request with custom Content-Type', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            const body = JSON.stringify([{ op: 'replace', path: '/field', value: 'new' }]);
            const result = await common.fetchOdin(odinEndpoint, '/api/resource/123', authToken, {
                method: 'PATCH',
                body,
                contentType: 'application/json-patch+json',
            });

            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/api/resource/123',
                sinon.match({
                    headers: {
                        Authorization: 'Bearer test-auth-token',
                        'Content-Type': 'application/json-patch+json',
                    },
                    method: 'PATCH',
                    body,
                }),
            );
            expect(result).to.equal(mockResponse);
        });

        it('should include If-Match header when etag is provided', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns('"new-etag"'),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/resource/123', authToken, {
                method: 'PATCH',
                body: JSON.stringify({ data: 'test' }),
                etag: '"original-etag"',
            });

            expect(fetchStub).to.have.been.calledWith(
                sinon.match.string,
                sinon.match({
                    headers: sinon.match({
                        'If-Match': '"original-etag"',
                    }),
                }),
            );
        });

        it('should not add Content-Type header for GET request even with body', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken, {
                method: 'GET',
                body: 'should-be-ignored-anyway',
            });

            const callArgs = fetchStub.firstCall.args[1];
            expect(callArgs.headers).to.not.have.property('Content-Type');
        });

        it('should not add Content-Type header for non-GET request without body', async () => {
            const mockResponse = {
                ok: true,
                status: 204,
                statusText: 'No Content',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/resource/123', authToken, {
                method: 'DELETE',
            });

            const callArgs = fetchStub.firstCall.args[1];
            expect(callArgs.headers).to.not.have.property('Content-Type');
        });

        it('should log successful request with duration', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns('"test-etag"'),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(mockLogger.info).to.have.been.calledWith(
                sinon.match(/GET \/api\/test: 200 \(OK\) \(etag: "test-etag"\) - \d+\.\d+ms/),
            );
        });
    });

    describe('ignored errors', () => {
        it('should return response without throwing when status is in ignoreErrors', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            const result = await common.fetchOdin(odinEndpoint, '/api/missing', authToken, {
                ignoreErrors: [404],
            });

            expect(result).to.equal(mockResponse);
            expect(mockLogger.error).to.not.have.been.called;
        });

        it('should return response for multiple ignored error codes', async () => {
            const mockResponse = {
                ok: false,
                status: 409,
                statusText: 'Conflict',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            const result = await common.fetchOdin(odinEndpoint, '/api/conflict', authToken, {
                ignoreErrors: [404, 409, 410],
            });

            expect(result).to.equal(mockResponse);
            expect(mockLogger.error).to.not.have.been.called;
        });

        it('should log info even for ignored errors', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/missing', authToken, {
                ignoreErrors: [404],
            });

            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/GET \/api\/missing: 404 \(Not Found\)/));
        });
    });

    describe('error handling', () => {
        it('should throw error for non-ok response not in ignoreErrors', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: sinon.stub().resolves({}),
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            let error;
            try {
                await common.fetchOdin(odinEndpoint, '/api/broken', authToken);
            } catch (e) {
                error = e;
            }

            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal('GET /api/broken failed with status 500: Internal Server Error');
        });

        it('should log error with JSON body when available', async () => {
            const errorBody = { error: 'Something went wrong', code: 'ERR_001' };
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: sinon.stub().resolves(errorBody),
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            try {
                await common.fetchOdin(odinEndpoint, '/api/bad-request', authToken, {
                    method: 'POST',
                    body: JSON.stringify({ invalid: 'data' }),
                });
            } catch (e) {
                // Expected to throw
            }

            expect(mockLogger.error).to.have.been.calledWith(
                sinon.match(/POST \/api\/bad-request: 400 \(Bad Request - .*Something went wrong.*\)/),
            );
        });

        it('should handle non-JSON error response body gracefully', async () => {
            const mockResponse = {
                ok: false,
                status: 502,
                statusText: 'Bad Gateway',
                json: sinon.stub().rejects(new SyntaxError('Unexpected token')),
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            let error;
            try {
                await common.fetchOdin(odinEndpoint, '/api/gateway-error', authToken);
            } catch (e) {
                error = e;
            }

            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal('GET /api/gateway-error failed with status 502: Bad Gateway');
            expect(mockLogger.error).to.have.been.calledWith('GET /api/gateway-error: 502 (Bad Gateway)');
        });

        it('should handle empty error body', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: sinon.stub().resolves({}),
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            try {
                await common.fetchOdin(odinEndpoint, '/api/forbidden', authToken);
            } catch (e) {
                // Expected to throw
            }

            // Empty object should not append error message
            expect(mockLogger.error).to.have.been.calledWith('GET /api/forbidden: 403 (Forbidden)');
        });

        it('should throw error with correct method in message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: sinon.stub().resolves({}),
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            let error;
            try {
                await common.fetchOdin(odinEndpoint, '/api/resource', authToken, {
                    method: 'PUT',
                    body: JSON.stringify({ data: 'test' }),
                });
            } catch (e) {
                error = e;
            }

            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal('PUT /api/resource failed with status 500: Internal Server Error');
        });

        it('should not throw when error status is explicitly ignored', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            const result = await common.fetchOdin(odinEndpoint, '/api/error', authToken, {
                ignoreErrors: [500],
            });

            expect(result).to.equal(mockResponse);
        });
    });

    describe('default options', () => {
        it('should use default values when options object is empty', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken, {});

            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/api/test',
                sinon.match({
                    method: 'GET',
                    body: null,
                }),
            );
        });

        it('should use default values when options is undefined', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/api/test',
                sinon.match({
                    method: 'GET',
                    body: null,
                }),
            );
        });

        it('should default to empty ignoreErrors array', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: sinon.stub().resolves({}),
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            // Without ignoreErrors, 404 should throw
            let error;
            try {
                await common.fetchOdin(odinEndpoint, '/api/missing', authToken);
            } catch (e) {
                error = e;
            }

            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal('GET /api/missing failed with status 404: Not Found');
        });
    });

    describe('URL construction', () => {
        it('should correctly concatenate endpoint and URI', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin('https://api.example.com', '/v1/resource/123', authToken);

            expect(fetchStub).to.have.been.calledWith('https://api.example.com/v1/resource/123', sinon.match.object);
        });

        it('should handle URI with query parameters', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/search?query=test&limit=10', authToken);

            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/api/search?query=test&limit=10',
                sinon.match.object,
            );
        });
    });

    describe('various HTTP methods', () => {
        it('should support DELETE method', async () => {
            const mockResponse = {
                ok: true,
                status: 204,
                statusText: 'No Content',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/resource/123', authToken, {
                method: 'DELETE',
            });

            expect(fetchStub).to.have.been.calledWith(
                sinon.match.string,
                sinon.match({
                    method: 'DELETE',
                }),
            );
        });

        it('should support PUT method with body', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            const body = JSON.stringify({ name: 'updated' });
            await common.fetchOdin(odinEndpoint, '/api/resource/123', authToken, {
                method: 'PUT',
                body,
            });

            expect(fetchStub).to.have.been.calledWith(
                sinon.match.string,
                sinon.match({
                    method: 'PUT',
                    body,
                    headers: sinon.match({
                        'Content-Type': 'application/json',
                    }),
                }),
            );
        });
    });

    describe('response header handling', () => {
        it('should log etag from response headers', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().withArgs('etag').returns('"response-etag-123"'),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/etag: "response-etag-123"/));
        });

        it('should handle null etag in response', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(mockLogger.info).to.have.been.calledWith(sinon.match(/etag: null/));
        });

        it('should handle missing headers object gracefully', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: null,
            };
            fetchStub.resolves(mockResponse);

            // Should not throw even with null headers
            const result = await common.fetchOdin(odinEndpoint, '/api/test', authToken);
            expect(result).to.equal(mockResponse);
        });
    });

    describe('getFragmentWithEtag', () => {
        it('should return the fragment JSON and etag header', async () => {
            const fragment = { id: 'fragment-123', title: 'Test fragment' };
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: sinon.stub().callsFake((headerName) => (headerName === 'etag' ? '"fragment-etag"' : null)),
                },
                json: sinon.stub().resolves(fragment),
            };
            fetchStub.resolves(mockResponse);

            const result = await common.getFragmentWithEtag(odinEndpoint, 'fragment-123', authToken);

            expect(fetchStub).to.have.been.calledOnce;
            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/adobe/sites/cf/fragments/fragment-123',
                sinon.match({
                    method: 'GET',
                    headers: sinon.match({
                        Authorization: 'Bearer test-auth-token',
                        'User-Agent': 'mas-translation-project',
                    }),
                }),
            );
            expect(mockResponse.json).to.have.been.calledOnce;
            expect(result).to.deep.equal({
                fragment,
                etag: '"fragment-etag"',
            });
        });

        it('should fall back to Etag header casing when etag is missing', async () => {
            const fragment = { id: 'fragment-456' };
            const headersGetStub = sinon.stub();
            headersGetStub.withArgs('etag').returns(null);
            headersGetStub.withArgs('Etag').returns('"etag-from-uppercase-header"');
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: {
                    get: headersGetStub,
                },
                json: sinon.stub().resolves(fragment),
            };
            fetchStub.resolves(mockResponse);

            const result = await common.getFragmentWithEtag(odinEndpoint, 'fragment-456', authToken);

            expect(result).to.deep.equal({
                fragment,
                etag: '"etag-from-uppercase-header"',
            });
        });
    });

    describe('deleteFragmentById', () => {
        it('should send DELETE with If-Match when etag is provided', async () => {
            const mockResponse = {
                ok: true,
                status: 204,
                statusText: 'No Content',
                headers: {
                    get: sinon.stub().returns(null),
                },
            };
            fetchStub.resolves(mockResponse);

            await common.deleteFragmentById(odinEndpoint, 'fragment-789', authToken, '"delete-etag"');

            expect(fetchStub).to.have.been.calledOnce;
            expect(fetchStub).to.have.been.calledWith(
                'https://test-odin.example.com/adobe/sites/cf/fragments/fragment-789',
                sinon.match({
                    method: 'DELETE',
                    body: null,
                    headers: sinon.match({
                        Authorization: 'Bearer test-auth-token',
                        'If-Match': '"delete-etag"',
                    }),
                }),
            );
        });
    });

    describe('429 retry behaviour', () => {
        beforeEach(() => {
            // Stub setTimeout to immediately resolve so tests don't wait 60 s for real
            sinon.stub(global, 'setTimeout').callsFake((fn) => {
                fn();
                return 1;
            });
        });
        // No afterEach needed — outer afterEach calls sinon.restore() which restores setTimeout

        it('should retry once on 429 and return the successful response', async () => {
            const headersGet429 = sinon.stub();
            headersGet429.withArgs('Retry-After').returns('60');
            headersGet429.returns(null);
            const mock429 = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: sinon.stub().resolves({}),
                headers: { get: headersGet429 },
            };
            const mock200 = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: sinon.stub().returns(null) },
            };
            fetchStub.onFirstCall().resolves(mock429);
            fetchStub.onSecondCall().resolves(mock200);

            const result = await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(fetchStub).to.have.been.calledTwice;
            expect(result).to.equal(mock200);
            expect(global.setTimeout).to.have.been.calledOnce;
            expect(global.setTimeout.firstCall.args[1]).to.equal(60000);
            expect(mockLogger.warn).to.have.been.calledWith(sinon.match(/429 Too Many Requests.*attempt 1\/3.*waiting 60s/));
        });

        it('should exhaust retries and throw after 3 consecutive 429 responses', async () => {
            const headersGet429 = sinon.stub();
            headersGet429.withArgs('Retry-After').returns('60');
            headersGet429.returns(null);
            const mock429 = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: sinon.stub().resolves({}),
                headers: { get: headersGet429 },
            };
            fetchStub.resolves(mock429);

            let error;
            try {
                await common.fetchOdin(odinEndpoint, '/api/test', authToken);
            } catch (e) {
                error = e;
            }

            expect(fetchStub).to.have.been.calledThrice;
            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.include('status 429');
        });

        it('should wait exactly the Retry-After header duration', async () => {
            const headersGet429 = sinon.stub();
            headersGet429.withArgs('Retry-After').returns('30');
            headersGet429.returns(null);
            const mock429 = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: sinon.stub().resolves({}),
                headers: { get: headersGet429 },
            };
            const mock200 = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: sinon.stub().returns(null) },
            };
            fetchStub.onFirstCall().resolves(mock429);
            fetchStub.onSecondCall().resolves(mock200);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(global.setTimeout).to.have.been.calledOnce;
            expect(global.setTimeout.firstCall.args[1]).to.equal(30000);
        });

        it('should parse Retry-After as an HTTP-date and wait until then', async () => {
            // Pin "now" to a known instant and ask Odin to retry 45 s later
            const nowMs = Date.UTC(2026, 4, 12, 17, 30, 0);
            sinon.stub(Date, 'now').returns(nowMs);
            const retryAt = new Date(nowMs + 45 * 1000).toUTCString();

            const headersGet429 = sinon.stub();
            headersGet429.withArgs('Retry-After').returns(retryAt);
            headersGet429.returns(null);
            const mock429 = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: sinon.stub().resolves({}),
                headers: { get: headersGet429 },
            };
            const mock200 = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: sinon.stub().returns(null) },
            };
            fetchStub.onFirstCall().resolves(mock429);
            fetchStub.onSecondCall().resolves(mock200);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(global.setTimeout).to.have.been.calledOnce;
            expect(global.setTimeout.firstCall.args[1]).to.equal(45000);
        });

        it('should fall back to 65 s when Retry-After header is absent', async () => {
            const mock429 = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: sinon.stub().resolves({}),
                headers: { get: sinon.stub().returns(null) }, // no Retry-After header
            };
            const mock200 = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: sinon.stub().returns(null) },
            };
            fetchStub.onFirstCall().resolves(mock429);
            fetchStub.onSecondCall().resolves(mock200);

            await common.fetchOdin(odinEndpoint, '/api/test', authToken);

            expect(global.setTimeout).to.have.been.calledOnce;
            expect(global.setTimeout.firstCall.args[1]).to.equal(65000);
        });
    });
});

describe('common.js - processBatchWithConcurrency', () => {
    let common;
    let setTimeoutStub;

    beforeEach(function () {
        this.timeout(5000);

        const mockLogger = {
            info: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
        };

        setTimeoutStub = sinon.stub(global, 'setTimeout').callsFake((fn) => {
            fn();
            return 1;
        });

        common = proxyquire('../src/common.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should process all items across batches and return results in order', async () => {
        const items = [10, 20, 30, 40, 50];
        const processor = (item) => Promise.resolve(item * 2);

        const results = await common.processBatchWithConcurrency(items, 2, processor);

        expect(results).to.deep.equal([20, 40, 60, 80, 100]);
    });

    it('should not throttle when rpsLimit is not provided', async () => {
        await common.processBatchWithConcurrency([1, 2, 3], 3, (item) => Promise.resolve(item));

        expect(setTimeoutStub).not.to.have.been.called;
    });

    it('should sleep the remaining time when a batch completes before minBatchMs', async () => {
        // batchSize=5, rpsLimit=10 → minBatchMs = 500ms; elapsed = 100ms → wait = 400ms
        const dateNowStub = sinon.stub(Date, 'now');
        dateNowStub.onCall(0).returns(0); // batchStart
        dateNowStub.onCall(1).returns(100); // after Promise.all

        await common.processBatchWithConcurrency([1, 2, 3, 4, 5], 5, (item) => Promise.resolve(item), 10);

        expect(setTimeoutStub).to.have.been.calledOnce;
        expect(setTimeoutStub.firstCall.args[1]).to.equal(400);
    });

    it('should not sleep when a batch takes longer than minBatchMs', async () => {
        // batchSize=5, rpsLimit=10 → minBatchMs = 500ms; elapsed = 600ms → no sleep needed
        const dateNowStub = sinon.stub(Date, 'now');
        dateNowStub.onCall(0).returns(0); // batchStart
        dateNowStub.onCall(1).returns(600); // after Promise.all

        await common.processBatchWithConcurrency([1, 2, 3, 4, 5], 5, (item) => Promise.resolve(item), 10);

        expect(setTimeoutStub).not.to.have.been.called;
    });

    it('should call onBatchCompleted with the current batch results after each batch', async () => {
        const items = [1, 2, 3, 4];
        const processor = (item) => Promise.resolve({ value: item, success: true });
        const onBatchCompleted = sinon.stub().resolves();

        await common.processBatchWithConcurrency(items, 2, processor, null, onBatchCompleted);

        expect(onBatchCompleted).to.have.been.calledTwice;
        expect(onBatchCompleted.firstCall.args[0]).to.deep.equal([
            { value: 1, success: true },
            { value: 2, success: true },
        ]);
        expect(onBatchCompleted.secondCall.args[0]).to.deep.equal([
            { value: 3, success: true },
            { value: 4, success: true },
        ]);
    });

    it('should throttle once per batch across multiple batches', async () => {
        // 4 items, batchSize=2, rpsLimit=10 → minBatchMs = 200ms
        // batch 1: elapsed=50ms → wait=150ms; batch 2: elapsed=50ms → wait=150ms
        const dateNowStub = sinon.stub(Date, 'now');
        dateNowStub.onCall(0).returns(0); // batch 1 start
        dateNowStub.onCall(1).returns(50); // batch 1 end
        dateNowStub.onCall(2).returns(300); // batch 2 start
        dateNowStub.onCall(3).returns(350); // batch 2 end

        const results = await common.processBatchWithConcurrency([1, 2, 3, 4], 2, (item) => Promise.resolve(item), 10);

        expect(results).to.deep.equal([1, 2, 3, 4]);
        expect(setTimeoutStub).to.have.been.calledTwice;
        expect(setTimeoutStub.firstCall.args[1]).to.equal(150);
        expect(setTimeoutStub.secondCall.args[1]).to.equal(150);
    });
});

describe('common.js - postToOdinWithRetry - 429 passthrough', () => {
    let common;
    let mockLogger;
    let fetchStub;

    const odinEndpoint = 'https://test-odin.example.com';
    const authToken = 'test-auth-token';

    beforeEach(function () {
        this.timeout(5000);

        mockLogger = {
            info: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
        };

        fetchStub = sinon.stub();

        // Stub setTimeout to immediately call the callback (avoids real 60 s waits)
        sinon.stub(global, 'setTimeout').callsFake((fn) => {
            fn();
            return 1;
        });

        common = proxyquire('../src/common.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
        });

        global.fetch = fetchStub;
        global.performance = { now: sinon.stub().returns(0) };
    });

    afterEach(() => {
        sinon.restore();
        delete global.fetch;
    });

    it('should not add backoff retries on top when fetchOdin exhausts 429 retries', async () => {
        const headersGet = sinon.stub();
        headersGet.withArgs('Retry-After').returns('60');
        headersGet.returns(null);
        const mock429 = {
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            json: sinon.stub().resolves({}),
            headers: { get: headersGet },
        };
        fetchStub.resolves(mock429);

        let error;
        try {
            await common.postToOdinWithRetry(odinEndpoint, '/api/loc', authToken, { data: 'test' });
        } catch (e) {
            error = e;
        }

        // fetchOdin retries 3× internally (max429Retries default = 3).
        // postToOdinWithRetry must NOT stack its own retries on top → exactly 3 fetch calls total.
        expect(fetchStub).to.have.been.calledThrice;
        expect(error).to.be.an.instanceOf(Error);
        expect(error.message).to.include('status 429');
    });
});
