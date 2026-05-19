import { expect } from '@open-wc/testing';
import {
    PlanType,
    computePlanType,
    applyPlanType,
} from '../../src/utils/plan-types.js';

describe('PlanType enum', () => {
    it('exposes all plan type constants', () => {
        expect(PlanType.ABM).to.equal('ABM');
        expect(PlanType.PUF).to.equal('PUF');
        expect(PlanType.M2M).to.equal('M2M');
        expect(PlanType.PERPETUAL).to.equal('PERPETUAL');
        expect(PlanType.P3Y).to.equal('P3Y');
    });
});

describe('computePlanType', () => {
    it('returns ABM for YEAR commitment + MONTHLY term', () => {
        expect(computePlanType('YEAR', 'MONTHLY')).to.equal('ABM');
    });

    it('returns PUF for YEAR commitment + ANNUAL term', () => {
        expect(computePlanType('YEAR', 'ANNUAL')).to.equal('PUF');
    });

    it('returns M2M for MONTH commitment + MONTHLY term', () => {
        expect(computePlanType('MONTH', 'MONTHLY')).to.equal('M2M');
    });

    it('returns PERPETUAL for PERPETUAL commitment', () => {
        expect(computePlanType('PERPETUAL', undefined)).to.equal('PERPETUAL');
    });

    it('returns P3Y for TERM_LICENSE commitment + P3Y term', () => {
        expect(computePlanType('TERM_LICENSE', 'P3Y')).to.equal('P3Y');
    });

    it('returns empty string for undefined commitment', () => {
        expect(computePlanType(undefined, 'MONTHLY')).to.equal(
            'Value is not an offer',
        );
    });

    it('returns empty string for empty commitment', () => {
        expect(computePlanType('', 'MONTHLY')).to.equal('');
    });

    it('returns empty string for YEAR commitment with unrecognized term', () => {
        expect(computePlanType('YEAR', 'P3Y')).to.equal('');
    });

    it('returns empty string for MONTH commitment with ANNUAL term', () => {
        expect(computePlanType('MONTH', 'ANNUAL')).to.equal('');
    });

    it('returns empty string for TERM_LICENSE with MONTHLY term', () => {
        expect(computePlanType('TERM_LICENSE', 'MONTHLY')).to.equal('');
    });

    it('returns empty string for unknown commitment', () => {
        expect(computePlanType('UNKNOWN', 'MONTHLY')).to.equal('');
    });
});

describe('applyPlanType', () => {
    it('attaches computed planType to offer object', () => {
        const offer = { commitment: 'YEAR', term: 'MONTHLY', price: 100 };
        const result = applyPlanType(offer);
        expect(result.planType).to.equal('ABM');
        expect(result.price).to.equal(100);
    });

    it('returns new object without mutating original', () => {
        const offer = { commitment: 'MONTH', term: 'MONTHLY' };
        const result = applyPlanType(offer);
        expect(result).to.not.equal(offer);
        expect(offer.planType).to.be.undefined;
    });

    it('returns error string for non-object input', () => {
        expect(applyPlanType('not an object')).to.equal(
            'Value is not an offer',
        );
        expect(applyPlanType(42)).to.equal('Value is not an offer');
        expect(applyPlanType(null)).to.equal('Value is not an offer');
    });
});
