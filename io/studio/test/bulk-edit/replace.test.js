const { expect } = require('chai');
const proxyquire = require('proxyquire');

const mod = proxyquire('../../src/bulk-edit/replace.js', {
    '../../utils.js': {
        errorResponse: (statusCode, message) => ({ statusCode, body: { error: message } }),
    },
});

describe('bulk-edit/replace: main action (shell)', () => {
    it('returns 501 not-implemented for now', async () => {
        const res = await mod.main({});
        expect(res.statusCode).to.equal(501);
        expect(res.body.error).to.equal('bulk-edit-replace is not implemented yet');
    });
});
