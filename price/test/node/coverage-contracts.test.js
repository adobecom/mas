import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPriceHTML } from '../../src/index.js';
import { toBoolean } from '../../src/helpers.js';
import { discount } from '../../src/discount/index.js';
import { legalTemplate } from '../../src/price/legal.js';
import { formatMessage } from '../../src/price/message-format.js';
import { formatLiteral, renderPrice } from '../../src/price/template.js';
import { formatRegularPrice, formatAnnualPrice } from '../../src/price/utilities.js';
import { baseOffer, promotion, instant } from '../fixtures/cases.js';

const value = { ...baseOffer, ...baseOffer.priceDetails };
const options = { country: 'US', language: 'en' };
// The formatted price as displayed, with a plain space for a currency space.
const text = ({ currencySymbol, hasCurrencySpace, isCurrencyFirst, integer, decimalsDelimiter, decimals }) => {
    const space = hasCurrencySpace ? ' ' : '';
    const amount = integer + decimalsDelimiter + decimals;
    return isCurrencyFirst ? currencySymbol + space + amount : amount + space + currencySymbol;
};

describe('formatting helper edge contracts', () => {
    it('leaves an unrecognized boolean string undecided', () => {
        assert.equal(toBoolean('unknown'), undefined);
    });
    it('uses the default discount locale without country and language', () => {
        assert.equal(discount({}, { price: 35, priceWithoutDiscount: 100 }), '<span class="discount">65%</span>');
    });
    it('renders the tax-exclusive legal literal', () => {
        const actual = legalTemplate(
            { country: 'GB', language: 'en', displayTax: true },
            { taxDisplay: 'TAX_EXCLUSIVE', taxTerm: 'VAT' },
        );
        assert.match(actual, /<span class="price-tax-inclusivity">excl\. VAT<\/span>/);
    });
    it('preserves an unformatted currency-prefix space', () => {
        const actual = renderPrice({ ...options, displayFormatted: false }, { ...value, formatString: "'US$' #,##0.00" });
        assert.equal(actual, '<span class="price">US$\u00a029.99/mo</span>');
    });
    it('preserves an unformatted currency-suffix space', () => {
        const actual = renderPrice({ ...options, displayFormatted: false }, { ...value, formatString: "#,##0.00 '€'" });
        assert.equal(actual, '<span class="price">29.99\u00a0€/mo</span>');
    });
    it('omits an unrequested unformatted currency-suffix space', () => {
        const actual = renderPrice({ ...options, displayFormatted: false }, { ...value, formatString: "#,##0.00'€'" });
        assert.equal(actual, '<span class="price">29.99€/mo</span>');
    });
    it('uses empty decimals for an integer-only WCS leaf', () => {
        assert.equal(formatRegularPrice({ ...value, preformatted: { integer: '100', full: '100' } }).decimals, '');
    });
    it('falls back to the current price for an unsupported annual promo outcome without an undiscounted amount', () => {
        const actual = formatAnnualPrice({
            ...value,
            priceWithoutDiscount: undefined,
            instant,
            promotion: { ...promotion, displaySummary: { ...promotion.displaySummary, outcomeType: 'OTHER' } },
        });
        assert.equal(text(actual), 'US$359.88');
    });
});

describe('currency format contracts', () => {
    const format = (formatString, price, usePrecision = true) =>
        text(formatRegularPrice({ ...value, formatString, price, usePrecision }));
    for (const [name, formatString, price, usePrecision, expected] of [
        ['groups multiple thousands', "'US$'#,##0.00", 1234567.891, true, 'US$1,234,567.89'],
        ['groups with a space and a comma decimal', "# ##0,00 'DKK'", 1200.24, true, '1 200,24 DKK'],
        ['groups with a dot and a comma decimal', "#.##0,00 '€'", 1200.24, true, '1.200,24 €'],
        ['infers a comma decimal delimiter for a dot-grouped integer mask', "'€'#.##0", 1234, false, '€1.234'],
        ['formats an integer mask without grouping', "'¥'#0", 29.99, false, '¥30'],
        ['rounds to an integer without precision', "'US$'#,##0.00", 1234.5, false, 'US$1,235'],
        ['formats a price mask without a currency symbol', '#0.00', 29.99, true, '29.99'],
        ['keeps the sign of a negative amount', "'US$'#,##0.00", -1234.5, true, 'US$-1,234.50'],
        ['keeps the sign of a negative amount rounded to zero cents', "'US$'#,##0.00", -0.001, true, 'US$-0.00'],
        ['drops the sign of a negative amount rounded to zero', "'¥'#,##0", -0.3, false, '¥0'],
        ['keeps the mask decimals in the integer without a precision flag', "'US$'#,##0.00", 1234.5, undefined, 'US$1,234.50'],
    ]) {
        it(name, () => {
            assert.equal(format(formatString, price, usePrecision), expected);
        });
    }
    it('renders the mask decimals as integer digits without a precision flag', () => {
        const { integer, decimalsDelimiter, decimals } = formatRegularPrice({ ...value, usePrecision: undefined });
        assert.deepEqual([integer, decimalsDelimiter, decimals], ['29.99', '', '']);
    });
    it('fails an amount that is not a number instead of rendering it', () => {
        for (const isIndianPrice of [false, true]) {
            assert.throws(() => formatRegularPrice({ ...value, price: NaN, isIndianPrice }), /Invalid price amount: NaN/);
        }
    });
    it('still renders a WCS leaf for an amount that is not a number', () => {
        const preformatted = { integer: '29', decimals: '99', full: '29.99' };
        assert.equal(formatRegularPrice({ ...value, price: NaN, preformatted }).integer, '29');
    });
    it('fails an active annual percentage promotion without an undiscounted price', () => {
        const offer = { ...baseOffer, promotion, priceDetails: { ...baseOffer.priceDetails, priceWithoutDiscount: undefined } };
        const promoOptions = { ...options, instant, displayAnnual: true, promotionCode: 'PROMO' };
        assert.throws(() => buildPriceHTML([offer], promoOptions), /Invalid price amount: NaN/);
    });
    it('groups Indian prices in lakhs and crores', () => {
        const parts = (usePrecision) => formatRegularPrice({ ...value, price: 12345678.9, usePrecision, isIndianPrice: true });
        assert.equal(text(parts(true)), 'US$1,23,45,678.90');
        assert.equal(text(parts(false)), 'US$1,23,45,679');
    });
});

describe('ICU subset contracts', () => {
    for (const [name, message] of [
        ['plural', '{n, plural, one {# item} other {# items}}'],
        ['selectordinal', '{n, selectordinal, one {#st} other {#th}}'],
        ['date', '{n, date, short}'],
        ['time', '{n, time}'],
        ['a named number style', '{n, number, percent}'],
        ['an unsupported number skeleton stem', '{n, number, ::currency/USD}'],
        ['a fraction stem with options', '{n, number, ::.00/w}'],
        ['a number skeleton without stems', '{n, number, ::}'],
        ['an empty number style', '{n, number, }'],
        ['an unterminated number style', '{n, number, ::.00'],
        ['an unclosed number argument', '{n, number'],
        ['a select without other', '{n, select, a {A}}'],
        ['a duplicate select key', '{n, select, other {a} other {b}}'],
        ['an unterminated select case', '{n, select, other {a'],
        ['an unclosed select', '{n, select, other {a}'],
        ['an unknown argument type', '{n, foo}'],
        ['an argument without a name', '{}'],
    ]) {
        it(`rejects ${name} like an invalid message`, () => {
            const errors = [];
            const actual = formatLiteral(
                { label: message },
                'en-US',
                'label',
                { n: 1 },
                { error: (...args) => errors.push(args) },
            );
            assert.equal(actual, '');
            assert.deepEqual(errors, [['Failed to format literal:', message]]);
        });
    }
    it('rejects a missing value', () => {
        assert.throws(() => formatMessage('{n}', 'en-US', {}));
    });
    it('rejects an invalid locale', () => {
        assert.throws(() => formatMessage('plain', 'en_US', {}), RangeError);
    });
    it('uses the runtime default locale when none is supplied', () => {
        assert.equal(formatMessage('literal', undefined), 'literal');
    });
    it('uses the formatting fallback for a valid but unsupported locale', () => {
        assert.equal(formatMessage('{n, number}', 'zz-ZZ', { n: 123 }), '123');
    });
    it('formats the same message for several locales', () => {
        const message = '{n, number, ::.00}';
        assert.equal(formatMessage(message, 'en-US', { n: 1234.5 }), '1,234.50');
        assert.equal(formatMessage(message, 'de-DE', { n: 1234.5 }), '1.234,50');
        assert.equal(formatMessage(message, 'en-US', { n: 0.5 }), '0.50');
    });
    it('falls back to the default literal only when the key is absent', () => {
        assert.equal(formatLiteral({}, 'en-US', 'priceUnavailableLabel', {}), 'no price available');
        assert.equal(formatLiteral({ priceUnavailableLabel: null }, 'en-US', 'priceUnavailableLabel', {}), '');
    });
});
