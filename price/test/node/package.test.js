import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as pricing from '@adobecom/mas-price';
import { Commitment, Term } from '@adobecom/mas-price/constants';
import { price } from '@adobecom/mas-price/price';
import { createPriceTemplate } from '@adobecom/mas-price/price/template';
import { formatRegularPrice } from '@adobecom/mas-price/price/utilities';
import { legalTemplate } from '@adobecom/mas-price/price/legal';
import { discount } from '@adobecom/mas-price/discount';
import { baseOffer } from '../fixtures/cases.js';

describe('native package exports', () => {
    const value = { ...baseOffer, ...baseOffer.priceDetails };
    const options = { country: 'US', language: 'en' };

    it('imports only the three public primitives through the package name', () => {
        assert.deepEqual(Object.keys(pricing).sort(), ['buildPriceHTML', 'selectOffers', 'sumOffers']);
    });
    it('imports without defining browser globals', () => {
        assert.equal('document' in globalThis, false);
        assert.equal('window' in globalThis, false);
    });
    it('renders identically through the package and template subpath', () => {
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
