import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPlanType, selectOffers, sumOffers } from '../../src/index.js';
import { baseOffer } from '../fixtures/cases.js';
import { planTypeCases } from '../fixtures/offer-cases.js';

describe('applyPlanType', () => {
    for (const { id, offer, expected } of planTypeCases) {
        it(`preserves the legacy ${id} mapping`, () => {
            const result = applyPlanType(offer);
            assert.deepEqual(result, { ...offer, planType: expected });
        });
    }
    it('preserves other offer fields without mutating the input', () => {
        const offer = structuredClone(baseOffer);
        offer.planType = 'STALE';
        const before = structuredClone(offer);
        const result = applyPlanType(offer);
        assert.notEqual(result, offer);
        assert.deepEqual(result, { ...offer, planType: 'ABM' });
        assert.equal(result.priceDetails, offer.priceDetails);
        assert.deepEqual(offer, before);
    });
    for (const value of [undefined, false, 0, 'not an offer', () => {}]) {
        it(`preserves the legacy non-object return for ${typeof value}`, () => {
            assert.equal(applyPlanType(value), 'Value is not an offer');
        });
    }
    it('preserves the legacy TypeError for null', () => {
        assert.throws(() => applyPlanType(null), TypeError);
    });
});

describe('selectOffers', () => {
    it('returns the original empty array', () => {
        const offers = [];
        assert.equal(selectOffers(offers, {}), offers);
    });
    it('returns the original single-offer array without rewriting', () => {
        const offers = [structuredClone(baseOffer)];
        assert.equal(selectOffers(offers, {}), offers);
    });
    for (const [country, language] of [
        ['GB', 'EN'],
        ['US', 'MULT'],
    ]) {
        it(`prefers ${language} offers in ${country}`, () => {
            const offers = [
                { language: 'EN', id: 'en' },
                { language: 'MULT', id: 'mult' },
            ];
            assert.equal(selectOffers(offers, { country })[0].language, language);
        });
    }
    it('prioritizes a missing term over preferred language', () => {
        const offers = [{ language: 'EN', term: 'MONTHLY' }, { language: 'MULT' }];
        assert.equal(selectOffers(offers, { country: 'GB' })[0], offers[0]);
        assert.equal(offers[0].term, undefined);
    });
    it('sorts the supplied offer array in place', () => {
        const offers = [{ language: 'MULT', term: 'MONTHLY' }, { language: 'EN' }];
        const preferred = offers[1];
        selectOffers(offers, { country: 'GB' });
        assert.equal(offers[0], preferred);
    });
    it('retains order when language and term priorities tie', () => {
        const offers = [
            { id: 'a', language: 'FR' },
            { id: 'b', language: 'DE' },
        ];
        assert.equal(selectOffers(offers, { country: 'GB' })[0].id, 'a');
    });
    it('rewrites gross amounts with net amounts', () => {
        const [offer] = selectOffers([structuredClone(baseOffer)], { forceTaxExclusive: true });
        assert.equal(offer.priceDetails.price, 24.99);
        assert.equal(offer.priceDetails.priceWithoutDiscount, 33.33);
        assert.equal(offer.priceDetails.taxDisplay, 'TAX_EXCLUSIVE');
    });
    it('drops stale gross priceInfo after net rewriting', () => {
        const [offer] = selectOffers([{ ...structuredClone(baseOffer), priceInfo: {} }], { forceTaxExclusive: true });
        assert.equal(offer.priceInfo, undefined);
    });
    it('does not mutate the original gross offer', () => {
        const original = structuredClone(baseOffer);
        selectOffers([original], { forceTaxExclusive: true });
        assert.equal(original.priceDetails.price, 29.99);
    });
    it('preserves an already tax-exclusive offer by identity', () => {
        const original = structuredClone(baseOffer);
        original.priceDetails.taxDisplay = 'TAX_EXCLUSIVE';
        assert.equal(selectOffers([original], { forceTaxExclusive: true })[0], original);
    });
    it('falls back to gross amounts when net amounts are absent', () => {
        const original = structuredClone(baseOffer);
        delete original.priceDetails.priceWithoutTax;
        delete original.priceDetails.priceWithoutDiscountAndTax;
        const [offer] = selectOffers([original], { forceTaxExclusive: true });
        assert.equal(offer.priceDetails.price, 29.99);
        assert.equal(offer.priceDetails.priceWithoutDiscount, 39.99);
    });
    it('uses the undiscounted net amount for zero-price trials', () => {
        const original = structuredClone(baseOffer);
        original.offerType = 'TRIAL';
        original.priceDetails.priceWithoutTax = 0;
        assert.equal(selectOffers([original], { forceTaxExclusive: true })[0].priceDetails.price, 33.33);
    });
});

describe('sumOffers', () => {
    for (const empty of [null, undefined, []]) {
        it(`returns null for ${JSON.stringify(empty) ?? 'undefined'}`, () => {
            assert.equal(sumOffers(empty), null);
        });
    }
    it('preserves a single offer by identity', () => {
        assert.equal(sumOffers([baseOffer]), baseOffer);
    });
    it('rounds each summed price field to two decimal places', () => {
        const offers = [structuredClone(baseOffer), structuredClone(baseOffer)];
        offers[0].priceDetails.price = 10.333;
        offers[1].priceDetails.price = 20.666;
        const result = sumOffers(offers);
        assert.equal(result.priceDetails.price, 31);
        assert.equal(result.priceDetails.priceWithoutTax, 49.98);
        assert.equal(result.priceDetails.priceWithoutDiscount, 79.98);
        assert.equal(result.priceDetails.priceWithoutDiscountAndTax, 66.66);
    });
    it('preserves first-offer metadata', () => {
        const result = sumOffers([baseOffer, { ...baseOffer, customerSegment: 'TEAM' }]);
        assert.equal(result.customerSegment, 'INDIVIDUAL');
    });
    it('concatenates offer selector IDs', () => {
        assert.deepEqual(sumOffers([baseOffer, { ...baseOffer, offerSelectorIds: ['addon'] }]).offerSelectorIds, [
            'osi-base',
            'addon',
        ]);
    });
    it('omits missing offer selector IDs from the combined list', () => {
        assert.deepEqual(sumOffers([baseOffer, { ...baseOffer, offerSelectorIds: undefined }]).offerSelectorIds, ['osi-base']);
    });
    it('drops stale priceInfo on soft bundles', () => {
        assert.equal(sumOffers([{ ...baseOffer, priceInfo: {} }, baseOffer]).priceInfo, undefined);
    });
    it('leaves input offers unchanged', () => {
        const offers = [structuredClone(baseOffer), structuredClone(baseOffer)];
        const before = structuredClone(offers);
        sumOffers(offers);
        assert.deepEqual(offers, before);
    });
    it('sums every annualized field', () => {
        const annualized = {
            annualizedPrice: 12.11,
            annualizedPriceWithoutTax: 10,
            annualizedPriceWithoutDiscount: 20,
            annualizedPriceWithoutDiscountAndTax: 18,
        };
        const offer = { ...baseOffer, priceDetails: { ...baseOffer.priceDetails, annualized } };
        assert.deepEqual(sumOffers([offer, offer]).priceDetails.annualized, {
            annualizedPrice: 24.22,
            annualizedPriceWithoutTax: 20,
            annualizedPriceWithoutDiscount: 40,
            annualizedPriceWithoutDiscountAndTax: 36,
        });
    });
    it('retains first-offer values when combined sums are not positive', () => {
        const first = { priceDetails: { price: 1 } };
        assert.equal(sumOffers([first, { priceDetails: { price: -2 } }]).priceDetails.price, 1);
    });
    it('handles absent price details and annualized fields', () => {
        assert.deepEqual(sumOffers([{}, {}]).priceDetails, {});
    });
    it('sums annualized values present on only one offer', () => {
        const offer = { priceDetails: { annualized: { annualizedPrice: 10, annualizedPriceWithoutTax: 0 } } };
        assert.deepEqual(sumOffers([{}, offer]).priceDetails.annualized, { annualizedPrice: 10 });
    });
    for (const [field, label] of [
        ['commitment', 'commitment types'],
        ['term', 'terms'],
        ['formatString', 'currency formats'],
    ]) {
        it(`reports mismatched ${label} without rejecting the sum`, () => {
            const second = structuredClone(baseOffer);
            if (field === 'formatString') second.priceDetails.formatString = '#0';
            else second[field] = 'OTHER';
            const warnings = [];
            const result = sumOffers([baseOffer, second], { logger: { warn: (...args) => warnings.push(args) } });
            assert.equal(result.priceDetails.price, 59.98);
            assert.equal(warnings.length, 1);
            assert.match(warnings[0][0], new RegExp(label));
        });
    }
});
