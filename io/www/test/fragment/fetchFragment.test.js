import { expect } from 'chai';
import { transformer as fetchFragment } from '../../src/fragment/transformers/fetchFragment.js';

describe('fetchFragment transformer', function () {
    it('init returns 400 when id is missing', async function () {
        const result = await fetchFragment.init({ promises: {}, locale: 'en_US' });
        expect(result.status).to.equal(400);
        expect(result.message).to.match(/id.*locale/i);
    });

    it('init returns 400 when locale is missing', async function () {
        const result = await fetchFragment.init({ promises: {}, id: 'some-id' });
        expect(result.status).to.equal(400);
    });

    it('exposes phase 1 only (name and process)', function () {
        expect(fetchFragment.name).to.equal('fetchFragment');
        expect(fetchFragment.init).to.be.a('function');
        expect(fetchFragment.process).to.be.a('function');
    });
});
