import { expect } from 'chai';
import { main } from '../../src/actions/get-product-detail.js';

describe('get-product-detail', () => {
    it('returns 401 when no authorization header', async () => {
        const result = await main({ __ow_headers: {} });
        expect(result.statusCode).to.equal(401);
    });

    it('returns 401 when authorization header is invalid', async () => {
        const result = await main({
            __ow_headers: { authorization: 'invalid' },
        });
        expect(result.statusCode).to.equal(401);
    });
});
