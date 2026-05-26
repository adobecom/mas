import { expect } from 'chai';
import { transformer as fetchFragment } from '../../src/fragment/transformers/fetchFragment.js';

describe('fetchFragment transformer', function () {
    it('exposes phase 1 only (name and process)', function () {
        expect(fetchFragment.name).to.equal('fetchFragment');
        expect(fetchFragment.init).to.be.a('function');
        expect(fetchFragment.process).to.be.a('function');
    });
});
