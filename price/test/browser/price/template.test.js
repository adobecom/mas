import { expect } from '@esm-bundle/chai';
import { expectHtml } from '../helpers.js';
import * as snapshots from './__snapshots__/template.snapshots.js';
import expectedLiterals from './__snapshots__/price-literals.expected.json' with { type: 'json' };
import expectedMessages from '../../fixtures/message-format.expected.json' with { type: 'json' };
import { messageCases } from '../../fixtures/message-cases.js';
import priceLiteralsJson from '../../../../web-components/price-literals.json' with { type: 'json' };
import {
    ALTERNATIVE,
    PROMO_APPLIED,
    PROMO_STRIKETHROUGH,
    STRIKETHROUGH,
    formatLiteral,
    renderPrice,
    renderPriceWithAnnual,
    renderPromoPrice,
    renderPromoPriceWithAnnual,
} from '../../../src/price/template.js';

const context = {
    country: 'US',
    language: 'en',
};
const value = {
    formatString: '#0',
    price: 100,
};

const valueAbm = {
    formatString: '#0',
    price: 100,
    planType: 'ABM',
    commitment: 'YEAR',
    term: 'MONTHLY',
};

const valueDiscount = {
    formatString: '#0',
    price: 80,
    priceWithoutDiscount: 100,
};

const valueDiscountAbm = {
    formatString: '#0',
    price: 80,
    priceWithoutDiscount: 100,
    commitment: 'YEAR',
    term: 'MONTHLY',
    promotion: {
        start: '2024-11-15T04:02:37.000Z',
        end: '2030-03-01T07:59:00.000Z',
        displaySummary: {
            outcomeType: 'PERCENTAGE_DISCOUNT',
            duration: 'P12M',
            amount: 25,
            minProductQuantity: 1,
        },
    },
};

const valueNotApplicableDiscount = {
    formatString: '#0',
    price: 100,
    priceWithoutDiscount: 100,
};

const root = document.createElement('div');
document.body.append(root);

function renderAndComparePrice(id, html) {
    const el = document.createElement('p', { id });
    el.setAttribute('id', id);
    el.innerHTML = html;
    root.append(el);
    expectHtml(el.innerHTML, snapshots[id]);
}

describe('function "renderPrice"', () => {
    describe('displayPrice logic', () => {
        const promoValue = {
            formatString: '#0',
            price: 80,
            priceWithoutDiscount: 100,
            promotion: {
                start: '2024-11-15T04:02:37.000Z',
                end: '2030-03-01T07:59:00.000Z',
                displaySummary: {
                    outcomeType: 'PERCENTAGE_DISCOUNT',
                    duration: 'P12M',
                    amount: 25,
                    minProductQuantity: 1,
                },
            },
        };

        it('uses priceWithoutDiscount when promotion exists but not applied (not alternative)', function () {
            renderAndComparePrice('createPriceTemplatePromoNotApplied', renderPrice(context, promoValue));
        });

        it('uses price when promotion exists but not applied and isAlternativePrice is true', function () {
            renderAndComparePrice(
                'createPriceTemplatePromoNotAppliedAlternative',
                renderPrice(context, promoValue, console, ALTERNATIVE),
            );
        });

        it('uses priceWithoutDiscount when displayStrikethrough is true', function () {
            renderAndComparePrice(
                'createPriceTemplateStrikethrough',
                renderPrice(context, valueDiscount, console, STRIKETHROUGH),
            );
        });

        it('uses priceWithoutDiscount when displayPromoStrikethrough is true', function () {
            renderAndComparePrice(
                'createPriceTemplatePromoStrikethrough',
                renderPrice(context, valueDiscount, console, PROMO_STRIKETHROUGH),
            );
        });

        it('uses price in default case', function () {
            renderAndComparePrice('createPriceTemplateDefault', renderPrice(context, value));
        });

        it('uses price when promotion is applied', function () {
            renderAndComparePrice('createPriceTemplatePromoApplied', renderPrice(context, promoValue, console, PROMO_APPLIED));
        });
    });
});

describe('function "renderPromoPrice"', () => {
    it('displays both new & old prices', function () {
        renderAndComparePrice('createPromoPriceTemplate1', renderPromoPrice(context, valueDiscount));
    });
    it('displays only new price in case old is the same than new', function () {
        renderAndComparePrice('createPromoPriceTemplate2', renderPromoPrice(context, valueNotApplicableDiscount));
    });
    it('separates old/new price with a collapsible space when wrapClauses is set', () => {
        expect(renderPromoPrice(context, valueDiscount)).to.include('&nbsp;<span class="price price-alternative"');
        const spaced = renderPromoPrice({ ...context, wrapClauses: true }, valueDiscount);
        expect(spaced).to.not.include('&nbsp;<span class="price price-alternative"');
        expect(spaced).to.include('</span> <span class="price price-alternative"');
    });
});

describe('function "renderPriceWithAnnual"', function () {
    it('displays ABM with annual price', () => {
        renderAndComparePrice('createPriceWithAnnualTemplate1', renderPriceWithAnnual(context, valueAbm));
    });
});

describe('function "renderPromoPriceWithAnnual"', function () {
    it('displays ABM with annual price and old price', () => {
        renderAndComparePrice(
            'createPromoPriceWithAnnualTemplate1',
            renderPromoPriceWithAnnual({ ...context, quantity: 1 }, valueDiscountAbm),
        );
    });
    it('separates old/new price with a collapsible space when wrapClauses is set', () => {
        const ctx = { ...context, quantity: 1 };
        expect(renderPromoPriceWithAnnual(ctx, valueDiscountAbm)).to.include('&nbsp;<span class="price price-alternative"');
        const spaced = renderPromoPriceWithAnnual({ ...ctx, wrapClauses: true }, valueDiscountAbm);
        expect(spaced).to.not.include('&nbsp;<span class="price price-alternative"');
        expect(spaced).to.include('</span> <span class="price price-alternative"');
    });
});

describe('Promotion price display with annual template', () => {
    const basePromoContext = {
        country: 'AU',
        language: 'en',
    };

    const promoValue = {
        formatString: "'A$'#,##0.00",
        price: 23.23,
        priceWithoutDiscount: 30.99,
        commitment: 'YEAR',
        term: 'MONTHLY',
        quantity: 1,
        promotion: {
            start: '2024-11-15T04:02:37.000Z',
            end: '2030-03-01T07:59:00.000Z',
            outcomeType: 'PERCENTAGE_DISCOUNT',
            duration: 'P6M',
            amount: 25,
            minProductQuantity: 1,
            displaySummary: {
                outcomeType: 'PERCENTAGE_DISCOUNT',
                duration: 'P6M',
                amount: 25,
                minProductQuantity: 1,
            },
        },
    };

    const template = renderPromoPriceWithAnnual;

    it('displays annual price with promotion applied when promotion is active', () => {
        const promoContext = {
            ...basePromoContext,
            instant: '2024-12-01T00:00:00.000Z',
        };
        renderAndComparePrice('annualTemplatePromo', template(promoContext, promoValue));
    });

    it('displays annual price with promotion applied when promotion is active #2', () => {
        const promoContext = {
            ...basePromoContext,
            instant: '2025-05-02T07:00:00.000Z',
        };
        renderAndComparePrice(
            'annualTemplatePromo2',
            template(promoContext, {
                price: 48.49,
                priceWithoutDiscount: 96.99,
                priceWithoutTax: 44.08,
                priceWithoutDiscountAndTax: 88.17,
                usePrecision: true,
                formatString: "'A$'#,##0.00",
                taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                taxTerm: 'GST',
                commitment: 'YEAR',
                term: 'MONTHLY',
                promotion: {
                    start: '2025-04-02T07:00:00.000Z',
                    end: '2025-05-31T06:59:00.000Z',
                    displaySummary: {
                        outcomeType: 'PERCENTAGE_DISCOUNT',
                        duration: 'P6M',
                        amount: 50.0,
                        minProductQuantity: 1,
                    },
                },
            }),
        );
    });

    it('displays annual price based on regular price when promotion has not started yet', () => {
        const promoContext = {
            ...basePromoContext,
            instant: '2024-11-15T03:02:37.000Z',
        };
        renderAndComparePrice('annualTemplatePromoNotStarted', template(promoContext, promoValue));
    });

    it('displays annual price based on regular price when promotion has expired', () => {
        const promoContext = {
            ...basePromoContext,
            instant: '2030-03-01T08:59:00.000Z',
        };
        renderAndComparePrice('annualTemplatePromoExpired', template(promoContext, promoValue));
    });

    it('format price literals with links', () => {
        const literals = {
            lang: 'fr',
            taxInclusiveLabel:
                '{taxTerm, select, GST {TPS comprise} VAT {TVA comprise <u>underline</u> <strong>bold</strong> <a href="https://www.adobe.com/test.html">link</a> and another <a href="https://www.adobe.com/test2.html">link2</a> and text} TAX {taxes comprises} IVA {IVA comprise} SST {SST comprise} KDV {KDV comprise} other {}}',
        };
        const parameters = {
            taxTerm: 'VAT',
        };
        const formattedLiteral = formatLiteral(literals, 'fr-FR', 'taxInclusiveLabel', parameters);
        expect(formattedLiteral).to.be.equal(
            'TVA comprise underline bold <a href="https://www.adobe.com/test.html">link</a> and another <a href="https://www.adobe.com/test2.html">link2</a> and text',
        );
    });

    it('formats the ICU subset used by price literals', () => {
        const literals = {
            recurrence: "{recurrenceTerm, select, MONTH {al mese} YEAR {all'anno} other {}}",
            nested: '{planType, select, ABM {{label} ABM} other {none}}',
            discount: '{remainingPercent, number, ::scale/0.1 .#}折',
            fixed: '{remainingPercent, number, ::scale/0.1 .0}折',
            plural: '{count, plural, one {#} other {# items}}',
            quoted: "it''s {x}",
            noOther: '{planType, select, ABM {abm}}',
        };
        const format = (key, parameters) => formatLiteral(literals, 'zh-TW', key, parameters);
        expect(format('recurrence', { recurrenceTerm: 'YEAR' })).to.equal("all'anno");
        expect(format('recurrence', { recurrenceTerm: 'DAY' })).to.equal('');
        expect(format('nested', { planType: 'ABM', label: 'Annual' })).to.equal('Annual ABM');
        expect(format('nested', { planType: 'M2M' })).to.equal('none');
        expect(format('discount', { remainingPercent: 65 })).to.equal('6.5折');
        expect(format('discount', { remainingPercent: 70 })).to.equal('7折');
        expect(format('fixed', { remainingPercent: 100 })).to.equal('10.0折');
        expect(format('recurrence', {})).to.equal('');
        expect(format('plural', { count: 2 })).to.equal('');
        expect(format('quoted', { x: 'y' })).to.equal("it's y");
        expect(format('noOther', { planType: 'ABM' })).to.equal('');
    });
});

// Every braced entry of price-literals.json, formatted with one fixed argument
// set. Expected values were recorded with intl-messageformat before it was
// removed (MWPW-209048), so this keeps that parity checked in CI.
describe('price-literals.json parity', () => {
    const args = {
        recurrenceTerm: 'MONTH',
        perUnit: 'LICENSE',
        taxTerm: 'VAT',
        planType: 'ABM',
        alternativePrice: 'US$10.00',
        strikethroughPrice: 'US$20.00',
        remainingPercent: 65,
        discount: 35,
    };
    priceLiteralsJson.data.forEach(({ lang, ...literals }) => {
        Object.entries(literals)
            .filter(([, value]) => typeof value === 'string' && value.includes('{'))
            .forEach(([key]) => {
                it(`${lang} ${key}`, () => {
                    expect(formatLiteral(literals, lang, key, args)).to.equal(expectedLiterals[lang]?.[key]);
                });
            });
    });
});

// The ICU subset authored overrides may use (select, apostrophe quoting,
// arguments, number skeletons), including invalid and unsupported messages,
// which format to ''. Each message is formatted with a fixed value set per
// group; expected values were recorded with intl-messageformat 9.13.
describe('ICU message parity', () => {
    const valueSets = {
        text: [{ x: 'X', y: 'Y', g: 'a' }, { x: 0, y: '', g: 'z' }, { x: null, y: undefined }, {}],
        number: [{ n: 1234567.891 }, { n: '0.5' }, { n: -1 }, {}],
    };
    const canonicalCases = messageCases(expectedMessages);
    const canonicalParameters = new Map(canonicalCases.map(({ id, parameters }) => [id, parameters]));
    const legacyCases = messageCases(expectedMessages, valueSets)
        .filter(({ id, parameters }) => {
            const canonical = canonicalParameters.get(id);
            return (
                Object.keys(parameters).length !== Object.keys(canonical).length ||
                Object.entries(parameters).some(
                    ([key, value]) => !Object.hasOwn(canonical, key) || !Object.is(canonical[key], value),
                )
            );
        })
        .map(({ id, ...testCase }) => ({ id: `${id}/legacy-inputs`, ...testCase }));

    for (const { id, message, locale, parameters, expected } of [...canonicalCases, ...legacyCases]) {
        it(`preserves ${id}`, () => {
            const errors = [];
            const actual = formatLiteral({ label: message }, locale, 'label', parameters, {
                error: (...args) => errors.push(args),
            });
            expect(actual, JSON.stringify(errors)).to.equal(expected);
        });
    }

    it('rejects a fraction stem with options', () => {
        expect(formatLiteral({ message: '{n, number, ::.00/@@#/w}' }, 'en', 'message', { n: 1 })).to.equal('');
    });

    it('formats in the default locale when none is given', () => {
        const message = '{n, number} {n, number, ::.00}';
        const format = (locale) => formatLiteral({ message }, locale, 'message', { n: 1234.5 });
        expect(format(undefined)).to.equal(format(new Intl.NumberFormat().resolvedOptions().locale));
    });
});
