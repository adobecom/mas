import { expect } from '@open-wc/testing';
import {
    computePromoStatus,
    PROMO_CONTEXT_CANCEL_VALUE,
} from '../../src/utils/promo-status.js';

describe('PROMO_CONTEXT_CANCEL_VALUE', () => {
    it('equals cancel-context', () => {
        expect(PROMO_CONTEXT_CANCEL_VALUE).to.equal('cancel-context');
    });
});

describe('computePromoStatus', () => {
    it('returns configured promo when no override', () => {
        const result = computePromoStatus(undefined, 'PROMO123');
        expect(result.effectivePromoCode).to.equal('PROMO123');
        expect(result.isOverriden).to.be.false;
        expect(result.variant).to.equal('yellow');
        expect(result.className).to.equal('promo-tag');
        expect(result.text).to.equal('PROMO123');
    });

    it('returns no promo when neither override nor configured', () => {
        const result = computePromoStatus(undefined, undefined);
        expect(result.effectivePromoCode).to.be.undefined;
        expect(result.isOverriden).to.be.false;
        expect(result.variant).to.equal('neutral');
        expect(result.className).to.equal('promo-tag no-promo');
        expect(result.text).to.equal('no promo');
    });

    it('uses override when different from configured', () => {
        const result = computePromoStatus('OVERRIDE1', 'PROMO123');
        expect(result.effectivePromoCode).to.equal('OVERRIDE1');
        expect(result.isOverriden).to.be.true;
        expect(result.overridenPromoCode).to.equal('OVERRIDE1');
        expect(result.variant).to.equal('yellow');
        expect(result.text).to.equal('OVERRIDE1 (was "PROMO123")');
    });

    it('treats cancel-context as removing promo', () => {
        const result = computePromoStatus('cancel-context', 'PROMO123');
        expect(result.effectivePromoCode).to.be.undefined;
        expect(result.isOverriden).to.be.true;
        expect(result.variant).to.equal('neutral');
        expect(result.className).to.equal('promo-tag no-promo');
        expect(result.text).to.equal('no promo (was "PROMO123")');
    });

    it('does not consider override when same as configured', () => {
        const result = computePromoStatus('PROMO123', 'PROMO123');
        expect(result.effectivePromoCode).to.equal('PROMO123');
        expect(result.isOverriden).to.be.false;
    });

    it('returns override as promo when no configured and not cancel', () => {
        const result = computePromoStatus('NEWPROMO', undefined);
        expect(result.effectivePromoCode).to.equal('NEWPROMO');
        expect(result.isOverriden).to.be.true;
        expect(result.variant).to.equal('yellow');
    });

    it('does not consider cancel-context as override when no configured', () => {
        const result = computePromoStatus('cancel-context', undefined);
        expect(result.isOverriden).to.be.false;
        expect(result.effectivePromoCode).to.be.undefined;
    });
});
