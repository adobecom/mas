import { expect } from 'chai';
import { main } from '../../src/health-check/index.js';

const SHA = '0123456789abcdef0123456789abcdef01234567';

describe('health-check', () => {
    it('keeps the hello message', async () => {
        const { statusCode, body } = await main({});
        expect(statusCode).to.equal(200);
        expect(body.message).to.equal('Hello, world!');
    });

    it('returns the deployed commit', async () => {
        const { body } = await main({ deployedSha: SHA });
        expect(body.sha).to.equal(SHA);
    });

    it('returns null sha when the input is missing', async () => {
        const { body } = await main({});
        expect(body.sha).to.equal(null);
    });

    it('returns null sha for the unsubstituted placeholder', async () => {
        const { body } = await main({ deployedSha: '$DEPLOYED_SHA' });
        expect(body.sha).to.equal(null);
    });
});
