import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { getFragmentByPathOrNull, isFragmentNotFoundError } from '../../../src/common/utils/fragment-api.js';

describe('fragment-api', () => {
    const path = '/content/dam/mas/sandbox/en_US/my-card';

    describe('isFragmentNotFoundError', () => {
        it('returns true for 404 status', () => {
            expect(isFragmentNotFoundError(Object.assign(new Error('Fragment not found'), { status: 404 }))).to.be.true;
        });

        it('returns true for 404 response status', () => {
            expect(isFragmentNotFoundError({ response: { status: 404 } })).to.be.true;
        });

        it('returns false for other statuses', () => {
            expect(isFragmentNotFoundError({ status: 500 })).to.be.false;
        });

        it('prefers status over message', () => {
            expect(isFragmentNotFoundError(Object.assign(new Error('Upstream 404'), { status: 500 }))).to.be.false;
        });

        it('returns true for 404 in message when status is missing', () => {
            expect(isFragmentNotFoundError(new Error('Failed to get fragment: 404 Not Found'))).to.be.true;
        });

        it('returns false for messages without a 404 code when status is missing', () => {
            expect(isFragmentNotFoundError(new Error('Folder not found'))).to.be.false;
            expect(isFragmentNotFoundError(new Error('Request id 14040 failed'))).to.be.false;
            expect(isFragmentNotFoundError(undefined)).to.be.false;
        });
    });

    describe('getFragmentByPathOrNull', () => {
        it('returns the fragment and forwards lookup options', async () => {
            const fragment = { path };
            const options = { signal: new AbortController().signal };
            const fragmentsApi = { getByPath: sinon.stub().resolves(fragment) };

            expect(await getFragmentByPathOrNull(fragmentsApi, path, options)).to.equal(fragment);
            expect(fragmentsApi.getByPath.calledOnceWithExactly(path, options)).to.be.true;
        });

        it('returns null for an empty lookup result', async () => {
            const fragmentsApi = { getByPath: sinon.stub().resolves(undefined) };

            expect(await getFragmentByPathOrNull(fragmentsApi, path)).to.be.null;
        });

        it('returns null for not-found errors', async () => {
            const fragmentsApi = {
                getByPath: sinon.stub().rejects(Object.assign(new Error('Fragment not found'), { status: 404 })),
            };
            const result = await getFragmentByPathOrNull(fragmentsApi, path);
            expect(result).to.be.null;
        });

        it('returns null for 404 errors without a status', async () => {
            const fragmentsApi = {
                getByPath: sinon.stub().rejects(new Error('Failed to get fragment: 404 Not Found')),
            };
            expect(await getFragmentByPathOrNull(fragmentsApi, path)).to.be.null;
        });

        it('rethrows non-not-found errors', async () => {
            const error = new Error('Server error');
            const fragmentsApi = { getByPath: sinon.stub().rejects(error) };

            expect(await getFragmentByPathOrNull(fragmentsApi, path).catch((err) => err)).to.equal(error);
        });
    });
});
