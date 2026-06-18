const { expect } = require('chai');
const proxyquire = require('proxyquire');

const mod = proxyquire('../../src/find-replace/replace.js', {
    '../../utils.js': {
        errorResponse: (statusCode, message) => ({ statusCode, body: { error: message } }),
    },
});

describe('find-replace/replace: main action (shell)', () => {
    it('returns 501 not-implemented for now', async () => {
        const res = await mod.main({});
        expect(res.statusCode).to.equal(501);
        expect(res.body.error).to.equal('find-replace-replace is not implemented yet');
    });
});
