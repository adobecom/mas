import { expect } from '@esm-bundle/chai';
import { getPlanType } from '../../src/utils/plan-type.js';

describe('getPlanType', () => {
    it('maps YEAR + MONTHLY to abm', () => {
        expect(getPlanType({ commitment: 'YEAR', term: 'MONTHLY' })).to.equal('abm');
    });

    it('maps YEAR + ANNUAL to puf', () => {
        expect(getPlanType({ commitment: 'YEAR', term: 'ANNUAL' })).to.equal('puf');
    });

    it('maps MONTH + MONTHLY to m2m', () => {
        expect(getPlanType({ commitment: 'MONTH', term: 'MONTHLY' })).to.equal('m2m');
    });

    it('maps PERPETUAL to perpetual', () => {
        expect(getPlanType({ commitment: 'PERPETUAL' })).to.equal('perpetual');
    });

    it('returns null for offers without an allowed plan type', () => {
        expect(getPlanType({ commitment: 'YEAR', term: 'P3Y' })).to.equal(null);
        expect(getPlanType({ commitment: 'MONTH', term: 'ANNUAL' })).to.equal(null);
        expect(getPlanType({ commitment: 'TERM_LICENSE', term: 'P3Y' })).to.equal(null);
        expect(getPlanType({ commitment: '' })).to.equal(null);
        expect(getPlanType({})).to.equal(null);
        expect(getPlanType({ commitment: 'UNKNOWN' })).to.equal(null);
        expect(getPlanType()).to.equal(null);
        expect(getPlanType(null)).to.equal(null);
    });
});
