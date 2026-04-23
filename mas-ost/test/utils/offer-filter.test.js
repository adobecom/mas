import { expect } from '@open-wc/testing';
import { offerFilter } from '../../src/utils/offer-filter.js';

function makeOffer(overrides = {}) {
    return {
        customerSegments: { INDIVIDUAL: true, TEAM: false },
        marketSegments: { COM: true, EDU: false },
        arrangement_code: 'ARRANGEMENT_1',
        name: 'Creative Cloud All Apps',
        draft: false,
        ...overrides,
    };
}

function makeAos(overrides = {}) {
    return {
        customerSegment: 'INDIVIDUAL',
        marketSegment: 'COM',
        arrangementCode: 'ARRANGEMENT_1',
        ...overrides,
    };
}

describe('offerFilter', () => {
    it('matches when all criteria pass', () => {
        const result = offerFilter(null, 'PUBLISHED', makeAos(), makeOffer());
        expect(result).to.be.true;
    });

    it('treats missing segment filters as wildcards', () => {
        const result = offerFilter(
            null,
            'PUBLISHED',
            makeAos({ customerSegment: '', marketSegment: '' }),
            makeOffer(),
        );
        expect(result).to.be.true;
    });

    it('filters out non-matching customer segment', () => {
        const result = offerFilter(
            null,
            'PUBLISHED',
            makeAos({ customerSegment: 'TEAM' }),
            makeOffer(),
        );
        expect(result).to.be.false;
    });

    it('filters out non-matching market segment', () => {
        const result = offerFilter(
            null,
            'PUBLISHED',
            makeAos({ marketSegment: 'EDU' }),
            makeOffer(),
        );
        expect(result).to.be.false;
    });

    it('hides draft offers when landscape is PUBLISHED', () => {
        const result = offerFilter(
            null,
            'PUBLISHED',
            makeAos(),
            makeOffer({ draft: true }),
        );
        expect(result).to.be.false;
    });

    it('shows draft offers when landscape is DRAFT', () => {
        const result = offerFilter(
            null,
            'DRAFT',
            makeAos(),
            makeOffer({ draft: true }),
        );
        expect(result).to.be.true;
    });

    it('matches arrangement code even when criteria does not match name', () => {
        const result = offerFilter(
            /nomatch/,
            'PUBLISHED',
            makeAos(),
            makeOffer(),
        );
        expect(result).to.be.true;
    });

    it('matches when search criteria matches name', () => {
        const result = offerFilter(
            /Creative/i,
            'PUBLISHED',
            makeAos({ arrangementCode: 'OTHER' }),
            makeOffer(),
        );
        expect(result).to.be.true;
    });

    it('matches when search criteria matches arrangement_code', () => {
        const result = offerFilter(
            /ARRANGEMENT_1/,
            'PUBLISHED',
            makeAos({ arrangementCode: 'OTHER' }),
            makeOffer(),
        );
        expect(result).to.be.true;
    });

    it('filters out when criteria does not match and arrangement codes differ', () => {
        const result = offerFilter(
            /nomatch/,
            'PUBLISHED',
            makeAos({ arrangementCode: 'OTHER' }),
            makeOffer(),
        );
        expect(result).to.be.false;
    });
});
