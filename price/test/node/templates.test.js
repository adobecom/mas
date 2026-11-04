import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
    formatLiteral,
    renderAttributes,
    renderSpan,
    createPriceTemplate,
    createPromoPriceTemplate,
    createPriceWithAnnualTemplate,
    createPromoPriceWithAnnualTemplate,
    defaultLiterals,
    cssClassNames,
    literalKeys,
    htmlPattern,
    WCS_TAX_DISPLAY_EXCLUSIVE,
} from '../../src/price/template.js';
import {
    formatRegularPrice,
    formatOpticalPrice,
    formatAnnualPrice,
    isPromotionActive,
    selectPreformattedPrice,
    makeSpacesAroundNonBreaking,
    currencyIsFirstChar,
} from '../../src/price/utilities.js';
import * as prices from '../../src/price/index.js';
import { legalTemplate } from '../../src/price/legal.js';
import { discount } from '../../src/discount/index.js';
import { Commitment, Term } from '../../src/constants.js';
import { baseOffer, promotion, priceInfo, instant } from '../fixtures/cases.js';
import { messageCases } from '../fixtures/message-cases.js';

const expectedMessages = JSON.parse(await readFile(new URL('../fixtures/message-format.expected.json', import.meta.url)));

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

describe('template compatibility exports', () => {
    const options = { country: 'US', language: 'en', instant };
    const value = { ...baseOffer, ...baseOffer.priceDetails };
    for (const name of [
        'price',
        'pricePromo',
        'priceOptical',
        'priceStrikethrough',
        'pricePromoStrikethrough',
        'priceAnnual',
        'priceAlternative',
        'priceOpticalAlternative',
        'priceWithAnnual',
        'pricePromoWithAnnual',
        'legal',
    ]) {
        it(`${name} renders without a browser environment`, () => {
            assert.match(prices[name](options, value), /^<span class="price/);
        });
    }
    for (const [name, factory] of Object.entries({
        createPriceTemplate,
        createPromoPriceTemplate,
        createPriceWithAnnualTemplate,
        createPromoPriceWithAnnualTemplate,
    })) {
        it(`${name} produces a reusable formatter`, () => {
            const template = factory();
            assert.equal(template(options, value), template(options, value));
        });
    }
    it('retains the legal template alias', () => {
        assert.equal(prices.legal, legalTemplate);
    });
    it('retains the promotion utility alias', () => {
        assert.equal(prices.isPromotionActive, isPromotionActive);
    });
    it('formats a localized discount', () => {
        assert.equal(discount(options, { price: 35, priceWithoutDiscount: 100 }), '<span class="discount">65%</span>');
    });
    it('escapes attribute values', () => {
        assert.equal(renderAttributes({ title: `&<>'"` }), ' title="&amp;&lt;&gt;&#39;&quot;"');
    });
    it('only includes supported attribute types', () => {
        assert.equal(
            renderAttributes({ count: 1, active: true, off: false, empty: null, object: {}, array: [] }),
            ' count="1" active',
        );
    });
    it('omits attributes for non-objects', () => {
        assert.equal(renderAttributes(null), '');
    });
    it('renders empty content as a disabled span', () => {
        assert.equal(renderSpan('price', undefined), '<span class="price disabled"></span>');
    });
    it('converts surrounding spaces to non-breaking entities', () => {
        assert.equal(renderSpan('label', ' value ', null, true), '<span class="label">&nbsp;value&nbsp;</span>');
    });
    it('retains the tax display selector value', () => {
        assert.equal(WCS_TAX_DISPLAY_EXCLUSIVE, 'TAX_EXCLUSIVE');
    });
    it('retains default literal and class selectors', () => {
        assert.equal(defaultLiterals[literalKeys.perUnitLabel], '{perUnit, select, LICENSE {per license} other {}}');
        assert.equal(cssClassNames.containerAnnual, 'price-annual');
        assert.equal('<strong>text</strong>'.replace(htmlPattern, ''), 'text');
    });
    it('exports immutable commitment and term values', () => {
        assert.equal(Commitment.YEAR, 'YEAR');
        assert.equal(Term.ANNUAL, 'ANNUAL');
        assert.ok(Object.isFrozen(Commitment));
        assert.ok(Object.isFrozen(Term));
    });
    it('respects an explicit past promotion instant', () => {
        const promoValue = { ...value, promotion };
        const result = createPromoPriceWithAnnualTemplate()({ ...options, instant: '2020-01-01' }, promoValue);
        assert.doesNotMatch(result, /price-strikethrough/);
    });
    it('uses current time when no annual promo instant is supplied', () => {
        const promoValue = { ...value, promotion: { ...promotion, end: '2099-01-01' } };
        assert.match(
            createPromoPriceWithAnnualTemplate()({ ...options, instant: undefined }, promoValue),
            /price-strikethrough/,
        );
    });
});

describe('formatting utilities', () => {
    const data = { ...baseOffer, ...baseOffer.priceDetails };
    it('formats the regular monthly amount', () => {
        assert.equal(formatRegularPrice(data).accessiblePrice, 'US$29.99');
    });
    it('formats a per-month optical amount', () => {
        assert.equal(formatOpticalPrice({ ...data, term: 'ANNUAL', price: 120 }).accessiblePrice, 'US$10.00');
    });
    it('formats an annual total', () => {
        assert.equal(formatAnnualPrice(data).accessiblePrice, 'US$359.88');
    });
    it('uses twelve monthly amounts when a promotion duration is not numeric', () => {
        const result = formatAnnualPrice({
            ...data,
            promotion: { ...promotion, displaySummary: { ...promotion.displaySummary, duration: 'invalid' } },
            instant,
        });
        assert.equal(result, 359.88);
    });
    it('preserves the currency position selector', () => {
        assert.equal(currencyIsFirstChar("'US$'#,##0.00", 'US$'), true);
    });
    it('converts leading and trailing whitespace', () => {
        assert.equal(makeSpacesAroundNonBreaking(' text '), '&nbsp;text&nbsp;');
    });
    it('selects the as-is WCS leaf', () => {
        assert.equal(selectPreformattedPrice({ priceInfo }), priceInfo.asIs.withDiscount.withTax);
    });
    it('uses numeric formatting for promo annual totals', () => {
        assert.equal(selectPreformattedPrice({ priceInfo, displayAnnual: true, promotion }), undefined);
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
