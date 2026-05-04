import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from '../mocks/MockFetch.js';
import { getFragmentId } from '../../../src/fragment/utils/common.js';

describe('getFragmentId', function () {
    it('returns id:null and non-200 status when fetch returns a non-200 response', async function () {
        const fetchStub = sinon
            .stub(globalThis, 'fetch')
            .returns(createResponse(503, { message: 'Service Unavailable' }, 'Service Unavailable'));
        try {
            const context = {
                networkConfig: { retries: 1, retryDelay: 0 },
                DEFAULT_HEADERS: {},
            };
            const result = await getFragmentId(context, 'https://odin.example.com/fragment/test', 'test-mark');
            expect(result.id).to.equal(null);
            expect(result.status).to.not.equal(200);
        } finally {
            fetchStub.restore();
        }
    });

    it('returns id and status 200 when fetch succeeds with a body containing id', async function () {
        const fetchStub = sinon.stub(globalThis, 'fetch').returns(createResponse(200, { id: 'fragment-abc-123' }));
        try {
            const context = {
                networkConfig: { retries: 1, retryDelay: 0 },
                DEFAULT_HEADERS: {},
            };
            const result = await getFragmentId(context, 'https://odin.example.com/fragment/test', 'test-mark');
            expect(result.id).to.equal('fragment-abc-123');
            expect(result.status).to.equal(200);
        } finally {
            fetchStub.restore();
        }
    });

    it('returns id:null and status 503 when fetch succeeds but body has no id', async function () {
        const fetchStub = sinon.stub(globalThis, 'fetch').returns(createResponse(200, {}));
        try {
            const context = {
                networkConfig: { retries: 1, retryDelay: 0 },
                DEFAULT_HEADERS: {},
            };
            const result = await getFragmentId(context, 'https://odin.example.com/fragment/test', 'test-mark');
            expect(result.id).to.equal(null);
            expect(result.status).to.equal(503);
        } finally {
            fetchStub.restore();
        }
    });

    it('returns cached id without fetching when fragmentsIds cache is populated', async function () {
        const fetchStub = sinon.stub(globalThis, 'fetch');
        try {
            const context = {
                fragmentsIds: { 'cached-mark': 'cached-fragment-id' },
                networkConfig: { retries: 1, retryDelay: 0 },
                DEFAULT_HEADERS: {},
            };
            const result = await getFragmentId(context, 'https://odin.example.com/fragment/test', 'cached-mark');
            expect(result.id).to.equal('cached-fragment-id');
            expect(result.status).to.equal(200);
            expect(fetchStub.called).to.be.false;
        } finally {
            fetchStub.restore();
        }
    });
});
