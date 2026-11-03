import { expect } from '@esm-bundle/chai';
import { excludeEnterprise, isEnterpriseOffer } from '../../src/utils/enterprise-offers.js';

describe('enterprise-offers', () => {
    it('detects the string segment shape, case-insensitively', () => {
        expect(isEnterpriseOffer({ customer_segment: 'ENTERPRISE' })).to.be.true;
        expect(isEnterpriseOffer({ customer_segment: 'enterprise' })).to.be.true;
        expect(isEnterpriseOffer({ customer_segment: 'INDIVIDUAL' })).to.be.false;
    });

    it('detects the object segment shape and keeps mixed segments', () => {
        expect(isEnterpriseOffer({ customerSegments: { ENTERPRISE: true } })).to.be.true;
        expect(isEnterpriseOffer({ customerSegments: { TEAM: true, ENTERPRISE: true } })).to.be.false;
        expect(isEnterpriseOffer({ customerSegments: { TEAM: true, ENTERPRISE: false } })).to.be.false;
    });

    it('keeps items without a segment', () => {
        expect(isEnterpriseOffer({})).to.be.false;
        expect(isEnterpriseOffer(undefined)).to.be.false;
    });

    it('preserves order and identity without mutating the input', () => {
        const individual = { customer_segment: 'INDIVIDUAL' };
        const team = { customerSegments: { TEAM: true } };
        const enterprise = { customer_segment: 'ENTERPRISE' };
        const input = [individual, enterprise, team];
        const output = excludeEnterprise(input);
        expect(output).to.have.length(2);
        expect(output[0]).to.equal(individual);
        expect(output[1]).to.equal(team);
        expect(input).to.deep.equal([individual, enterprise, team]);
        expect(excludeEnterprise(undefined)).to.deep.equal([]);
    });
});
