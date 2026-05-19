import { expect } from 'chai';
import { onOriginResponse } from '../main.js';

describe('onOriginResponse', () => {
    let request;
    let response;

    beforeEach(() => {
        request = {};
        response = { status: 200 };
    });

    describe('429 → 529 conversion', () => {
        it('converts 429 to 529', () => {
            response.status = 429;
            onOriginResponse(request, response);
            expect(response.status).to.equal(529);
        });

        it('returns undefined (does not return a new response object)', () => {
            response.status = 429;
            const result = onOriginResponse(request, response);
            expect(result).to.be.undefined;
        });
    });

    describe('passthrough — non-429 responses are not modified', () => {
        const statusCodes = [200, 304, 400, 403, 404, 500, 503, 504, 529];

        for (const status of statusCodes) {
            it(`does not modify ${status} response`, () => {
                response.status = status;
                onOriginResponse(request, response);
                expect(response.status).to.equal(status);
            });
        }
    });

    describe('request object', () => {
        it('does not modify the request object', () => {
            response.status = 429;
            const requestSnapshot = { ...request };
            onOriginResponse(request, response);
            expect(request).to.deep.equal(requestSnapshot);
        });
    });
});
