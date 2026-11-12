import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
    ALTERNATIVE,
    ANNUAL,
    OPTICAL,
    PLAIN,
    PROMO_STRIKETHROUGH,
    STRIKETHROUGH,
    formatLiteral,
    makeSpacesAroundNonBreaking,
    renderPrice,
    renderPriceWithAnnual,
    renderPromoPrice,
    renderPromoPriceWithAnnual,
    renderSpan,
} from '../../src/price/template.js';
import { formatRegularPrice, formatOpticalPrice, formatAnnualPrice, isPromotionActive } from '../../src/price/utilities.js';
import { legalTemplate } from '../../src/price/legal.js';
import { discount } from '../../src/discount/index.js';
import { Commitment, Term } from '../../src/constants.js';
import { baseOffer, promotion, instant } from '../fixtures/cases.js';
import { messageCases } from '../fixtures/message-cases.js';

const expectedMessages = JSON.parse(await readFile(new URL('../fixtures/message-format.expected.json', import.meta.url)));
// The formatted price as displayed, with a plain space for a currency space.
const text = ({ currencySymbol, hasCurrencySpace, isCurrencyFirst, integer, decimalsDelimiter, decimals }) => {
    const space = hasCurrencySpace ? ' ' : '';
    const amount = integer + decimalsDelimiter + decimals;
    return isCurrencyFirst ? currencySymbol + space + amount : amount + space + currencySymbol;
};

describe('legacy ICU golden literals', () => {
    for (const { id, message, locale, parameters, expected } of messageCases(expectedMessages)) {
        it(`preserves ${id}`, () => {
            const errors = [];
            const actual = formatLiteral({ label: message }, locale, 'label', parameters, {
                error: (...args) => errors.push(args),
            });
            assert.equal(actual, expected);
        });
    }
});

describe('price renderers', () => {
    const options = { country: 'US', language: 'en', instant };
    const value = { ...baseOffer, ...baseOffer.priceDetails };
    for (const [name, render] of Object.entries({
        renderPrice,
        renderPromoPrice,
        renderPriceWithAnnual,
        renderPromoPriceWithAnnual,
        legalTemplate,
    })) {
        it(`${name} renders without a browser environment`, () => {
            assert.match(render(options, value), /^<span class="price/);
        });
    }
    it('adds the container classes of the render flags in a fixed order', () => {
        const flags = ANNUAL | ALTERNATIVE | PROMO_STRIKETHROUGH | STRIKETHROUGH | OPTICAL;
        assert.match(
            renderPrice(options, value, console, flags),
            /^<span class="price price-optical price-strikethrough price-promo-strikethrough price-alternative price-annual">/,
        );
    });
    it('hides the per-unit and tax labels of a plain price', () => {
        const labelled = { ...options, displayPerUnit: true, displayTax: true };
        assert.match(renderPrice(labelled, value), /per license.*incl\. VAT/);
        assert.equal(renderPrice(labelled, value, console, PLAIN), renderPrice(options, value));
    });
    it('renders the monthly price of a price with annual as an alternative price when the old price shows', () => {
        assert.match(
            renderPriceWithAnnual({ ...options, displayOldPrice: true }, value),
            /^<span class="price price-alternative">/,
        );
        assert.match(renderPriceWithAnnual(options, value), /^<span class="price">/);
    });
    it('formats a localized discount', () => {
        assert.equal(discount(options, { price: 35, priceWithoutDiscount: 100 }), '<span class="discount">65%</span>');
    });
    it('renders empty content as a disabled span', () => {
        assert.equal(renderSpan('price', undefined), '<span class="price disabled"></span>');
    });
    it('converts surrounding spaces to non-breaking entities', () => {
        assert.equal(makeSpacesAroundNonBreaking(' value '), '&nbsp;value&nbsp;');
    });
    it('exports immutable commitment and term values', () => {
        assert.equal(Commitment.YEAR, 'YEAR');
        assert.equal(Term.ANNUAL, 'ANNUAL');
        assert.ok(Object.isFrozen(Commitment));
        assert.ok(Object.isFrozen(Term));
    });
    it('respects an explicit past promotion instant', () => {
        const promoValue = { ...value, promotion };
        const result = renderPromoPriceWithAnnual({ ...options, instant: '2020-01-01' }, promoValue);
        assert.doesNotMatch(result, /price-strikethrough/);
    });
    it('uses current time when no annual promo instant is supplied', () => {
        const promoValue = { ...value, promotion: { ...promotion, end: '2099-01-01' } };
        assert.match(renderPromoPriceWithAnnual({ ...options, instant: undefined }, promoValue), /price-strikethrough/);
    });
});

describe('formatting utilities', () => {
    const data = { ...baseOffer, ...baseOffer.priceDetails };
    it('formats the regular monthly amount', () => {
        assert.equal(text(formatRegularPrice(data)), 'US$29.99');
    });
    it('formats a per-month optical amount', () => {
        assert.equal(text(formatOpticalPrice({ ...data, term: 'ANNUAL', price: 120 })), 'US$10.00');
    });
    it('formats an annual total', () => {
        assert.equal(text(formatAnnualPrice(data)), 'US$359.88');
    });
    it('uses twelve monthly amounts when a promotion duration is not numeric', () => {
        const result = formatAnnualPrice({
            ...data,
            promotion: { ...promotion, displaySummary: { ...promotion.displaySummary, duration: 'invalid' } },
            instant,
        });
        assert.equal(result, 359.88);
    });
    for (const [label, at, expected] of [
        ['start boundary', promotion.start, true],
        ['end boundary', promotion.end, true],
        ['before start', '2020-01-01', false],
        ['after end', '2030-01-01', false],
    ]) {
        it(`reports promotion activity at ${label}`, () => {
            assert.equal(isPromotionActive(promotion, at), expected);
        });
    }
});

describe('legal template custom plan type label', () => {
    const shortDescription =
        '<em>Fee applies of half your remaining annual commitment if you cancel after 14 days.</em> <span class="icon-button" data-tooltip="Details"></span>';
    const vat = { taxDisplay: 'TAX_INCLUSIVE_DETAILS', taxTerm: 'VAT', planType: 'ABM' };
    const options = {
        country: 'CH',
        language: 'en',
        displayTax: true,
        displayPlanType: true,
        literals: { taxInclusiveLabel: 'incl. VAT', planTypeLabel: 'Annual, billed monthly' },
    };
    const planTypeOf = (html) => html.match(/<span class="price-plan-type[^"]*">(.*?)<\/span><\/span>$/)[1];

    it('renders the authored HTML as the plan type, after the dotted tax label', () => {
        const actual = legalTemplate({ ...options, customPlanTypeLabel: shortDescription }, vat);
        assert.match(actual, /<span class="price-tax-inclusivity">incl\. VAT\. <\/span>/);
        assert.equal(planTypeOf(actual), shortDescription);
        assert.doesNotMatch(actual, /Annual, billed monthly/);
    });
    it('renders it whatever the offer plan type', () => {
        const actual = legalTemplate({ ...options, customPlanTypeLabel: shortDescription }, { ...vat, planType: undefined });
        assert.equal(planTypeOf(actual), shortDescription);
    });
    it('keeps the authored casing', () => {
        const actual = legalTemplate({ ...options, planTypeCase: 'upper', customPlanTypeLabel: '<em>fee applies</em>' }, vat);
        assert.equal(planTypeOf(actual), '<em>fee applies</em>');
    });
    it('honors displayDot', () => {
        const actual = legalTemplate({ ...options, displayDot: false, customPlanTypeLabel: shortDescription }, vat);
        assert.match(actual, /<span class="price-tax-inclusivity">incl\. VAT<\/span>/);
    });
    it('is ignored when the plan type line is off', () => {
        const actual = legalTemplate({ ...options, displayPlanType: false, customPlanTypeLabel: shortDescription }, vat);
        assert.equal(actual, legalTemplate({ ...options, displayPlanType: false }, vat));
        assert.doesNotMatch(actual, /Fee applies/);
    });
    it('falls back to the plan type literal when absent or empty', () => {
        const literal = legalTemplate(options, vat);
        assert.equal(planTypeOf(literal), 'Annual, billed monthly');
        assert.equal(legalTemplate({ ...options, customPlanTypeLabel: '' }, vat), literal);
    });
});
