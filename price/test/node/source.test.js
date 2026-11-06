import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPriceHTML } from '../../src/price.js';
import { Commitment, Term } from '../../src/constants.js';
import { createPriceTemplate } from '../../src/price/template.js';
import { formatRegularPrice } from '../../src/price/utilities.js';
import { legalTemplate } from '../../src/price/legal.js';
import { discount } from '../../src/discount.js';
import { baseOffer } from '../fixtures/cases.js';

describe('native shared source entry points', () => {
    const value = { ...baseOffer, ...baseOffer.priceDetails };
    const options = { country: 'US', language: 'en' };

    it('imports without defining browser globals', () => {
        assert.equal('document' in globalThis, false);
        assert.equal('window' in globalThis, false);
    });
    it('renders identically through the renderer and template factory', () => {
        assert.equal(buildPriceHTML([baseOffer], options), createPriceTemplate()(options, value));
    });
    it('exports the extracted commitment and term constants', () => {
        assert.equal(Commitment.YEAR, baseOffer.commitment);
        assert.equal(Term.MONTHLY, baseOffer.term);
    });
    it('exports the regular price formatter', () => {
        assert.equal(formatRegularPrice(value).integer, '29');
        assert.equal(formatRegularPrice(value).decimals, '99');
    });
    it('exports the legal template', () => {
        assert.equal(buildPriceHTML([baseOffer], { ...options, template: 'legal' }), legalTemplate(options, value));
    });
    it('exports the discount template', () => {
        assert.equal(buildPriceHTML([baseOffer], { ...options, template: 'discount' }), discount(options, value));
    });
});
