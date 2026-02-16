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
});
