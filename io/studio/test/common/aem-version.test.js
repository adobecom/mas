const { expect } = require('chai');
const sinon = require('sinon');
const { createVersion, restoreVersion, fetchVersionHistory } = require('../../src/common/aem-version.js');

describe('Shared native AEM version transport', () => {
    const endpoint = 'https://author.example.com';
    const id = '11111111-1111-4111-8111-111111111111';
    const path = `/adobe/sites/cf/fragments/${id}/versions`;

    it('creates native snapshots with strict fragment-bound Location validation for history', async () => {
        const request = sinon.stub().resolves({
            headers: { get: () => `${endpoint}${path}/v%201` },
        });
        const version = await createVersion(endpoint, id, undefined, 'Change-set: request', 'token', {
            request,
            strictLocation: true,
        });
        expect(version).to.equal('v 1');
        expect(request.firstCall.args.slice(0, 3)).to.deep.equal([endpoint, path, 'token']);
        expect(JSON.parse(request.firstCall.args[3].body)).to.deep.equal({ comment: 'Change-set: request' });
    });

    for (const location of [
        null,
        `${endpoint}${path}/../other`,
        `https://other.example.com${path}/v1`,
        `${endpoint}${path}/v1?unsafe=1`,
        `${endpoint}${path}/v1#unsafe`,
        `${endpoint}${path}/encoded%2Fseparator`,
        'https://[',
    ]) {
        it(`rejects unsafe native Location ${location}`, async () => {
            const request = sinon.stub().resolves({ headers: { get: () => location } });
            try {
                await createVersion(endpoint, id, undefined, 'Change-set: request', 'token', {
                    request,
                    strictLocation: true,
                });
                expect.fail('Expected invalid Location');
            } catch (error) {
                expect(error.statusCode).to.equal(502);
            }
        });
    }

    it('preserves downstream status errors rather than turning authorization failures into success', async () => {
        const failure = Object.assign(new Error('Forbidden'), { statusCode: 403 });
        const request = sinon.stub().rejects(failure);
        try {
            await createVersion(endpoint, id, undefined, 'Comment', 'token', { request });
            expect.fail('Expected denied version');
        } catch (error) {
            expect(error).to.equal(failure);
        }
    });

    it('keeps bulk native full restore and missing-history semantics', async () => {
        const request = sinon.stub().resolves({ ok: false, status: 404 });
        await restoreVersion(endpoint, id, 'v1', 'token', { request });
        expect(request.firstCall.args[1]).to.equal(`${path}/restore/v1`);
        expect(request.firstCall.args[3]).to.deep.equal({ method: 'POST' });
        expect(await fetchVersionHistory(endpoint, id, 'token', { request })).to.deep.equal([]);
        request.resolves({ ok: true, json: async () => ({ items: [{ id: 'v2' }] }) });
        expect(await fetchVersionHistory(endpoint, id, 'token', { request })).to.deep.equal([{ id: 'v2' }]);
    });
});
