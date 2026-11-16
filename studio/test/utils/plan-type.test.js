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

    const unmappedOffers = [
        { commitment: 'YEAR', term: 'P3Y' },
        { commitment: 'MONTH', term: 'ANNUAL' },
        { commitment: 'TERM_LICENSE', term: 'P3Y' },
        { commitment: '' },
        {},
        { commitment: 'UNKNOWN' },
        undefined,
        null,
    ];
    for (const offer of unmappedOffers) {
        it(`returns null for ${JSON.stringify(offer)}`, () => {
            expect(getPlanType(offer)).to.equal(null);
        });
    }
});
