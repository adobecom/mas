import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as pricing from '../../src/index.js';
import { Commitment, Term } from '../../src/constants.js';
import { price } from '../../src/price/index.js';
import { createPriceTemplate } from '../../src/price/template.js';
import { formatRegularPrice } from '../../src/price/utilities.js';
import { legalTemplate } from '../../src/price/legal.js';
import { discount } from '../../src/discount/index.js';
import { baseOffer } from '../fixtures/cases.js';

describe('native shared source entry points', () => {
    const value = { ...baseOffer, ...baseOffer.priceDetails };
    const options = { country: 'US', language: 'en' };

    it('imports the shared price primitives through the source entry point', () => {
        assert.deepEqual(Object.keys(pricing).sort(), ['applyPlanType', 'buildPriceHTML', 'selectOffers', 'sumOffers']);
    });
    it('imports without defining browser globals', () => {
        assert.equal('document' in globalThis, false);
        assert.equal('window' in globalThis, false);
    });
    it('renders identically through the source entry point and template', () => {
        assert.equal(pricing.buildPriceHTML([baseOffer], options), price(options, value));
    });
    it('exports the extracted commitment and term constants', () => {
        assert.equal(Commitment.YEAR, baseOffer.commitment);
        assert.equal(Term.MONTHLY, baseOffer.term);
    });
    it('exports the default price template factory', () => {
        assert.equal(createPriceTemplate()(options, value), price(options, value));
    });
    it('exports the regular price formatter', () => {
        assert.equal(formatRegularPrice(value).integer, '29');
        assert.equal(formatRegularPrice(value).decimals, '99');
    });
    it('exports the legal template', () => {
        assert.equal(pricing.buildPriceHTML([baseOffer], { ...options, template: 'legal' }), legalTemplate(options, value));
    });
    it('exports the discount template', () => {
        assert.equal(pricing.buildPriceHTML([baseOffer], { ...options, template: 'discount' }), discount(options, value));
    });
});
