import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeHtml, toBoolean } from '../../src/helpers.js';
import { discount } from '../../src/discount/index.js';
import { legalTemplate } from '../../src/price/legal.js';
import { formatMessage } from '../../src/price/message-format.js';
import formatNumber from '../../src/price/numberFormat.js';
import { createPriceTemplate } from '../../src/price/template.js';
import { formatRegularPrice, formatAnnualPrice } from '../../src/price/utilities.js';
import { baseOffer, promotion, instant } from '../fixtures/cases.js';

const value = { ...baseOffer, ...baseOffer.priceDetails };
const options = { country: 'US', language: 'en' };

describe('formatting helper edge contracts', () => {
    it('escapes an absent value as empty text', () => {
        assert.equal(escapeHtml(undefined), '');
    });
    it('uses the caller boolean default for an unrecognized string', () => {
        assert.equal(toBoolean('unknown', false), false);
    });
    it('uses the default discount locale when context is absent', () => {
        assert.equal(discount(undefined, { price: 35, priceWithoutDiscount: 100 }), '<span class="discount">65%</span>');
    });
    it('renders the tax-exclusive legal literal', () => {
        const actual = legalTemplate(
            { country: 'GB', language: 'en', displayTax: true },
            { taxDisplay: 'TAX_EXCLUSIVE', taxTerm: 'VAT' },
        );
        assert.match(actual, /<span class="price-tax-inclusivity">excl\. VAT<\/span>/);
    });
    it('preserves an unformatted currency-prefix space', () => {
        const actual = createPriceTemplate()(
            { ...options, displayFormatted: false },
            { ...value, formatString: "'US$' #,##0.00" },
        );
        assert.equal(actual, '<span class="price">US$\u00a029.99/mo</span>');
    });
    it('preserves an unformatted currency-suffix space', () => {
        const actual = createPriceTemplate()(
            { ...options, displayFormatted: false },
            { ...value, formatString: "#,##0.00 '€'" },
        );
        assert.equal(actual, '<span class="price">29.99\u00a0€/mo</span>');
    });
    it('omits an unrequested unformatted currency-suffix space', () => {
        const actual = createPriceTemplate()(
            { ...options, displayFormatted: false },
            { ...value, formatString: "#,##0.00'€'" },
        );
        assert.equal(actual, '<span class="price">29.99€/mo</span>');
    });
    it('infers a comma decimal delimiter for a dot-grouped integer mask', () => {
        assert.equal(
            formatRegularPrice({ ...value, formatString: "'€'#.##0", price: 1234, usePrecision: false }).accessiblePrice,
            '€1.234',
        );
    });
    it('formats an integer mask without grouping', () => {
        assert.equal(formatRegularPrice({ ...value, formatString: "'¥'#0", usePrecision: false }).accessiblePrice, '¥30');
    });
    it('formats a price mask without a currency symbol', () => {
        assert.equal(formatRegularPrice({ ...value, formatString: '#0.00' }).accessiblePrice, '29.99');
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
        assert.equal(actual.accessiblePrice, 'US$359.88');
    });
});

describe('number mask edge contracts', () => {
    for (const { name, mask, amount, settings, expected } of [
        { name: 'retains literal prefix and suffix', mask: 'USD #,##0.00 end', amount: 1234.5, expected: 'USD 1,234.50 end' },
        { name: 'uses default separators for a delimiter-free mask', mask: '#0', amount: 12, expected: '12' },
        { name: 'omits optional trailing decimals', mask: '#.##', amount: 1, expected: '1' },
        { name: 'drops the sign on a rounded zero', mask: '#0', amount: -0.1, expected: '0' },
        { name: 'adds an explicit positive sign', mask: '+#0', amount: 12, expected: '+12' },
        { name: 'retains a negative sign with a positive-sign mask', mask: '+#0', amount: -12, expected: '-12' },
        { name: 'allows absent sign settings', mask: '#0', amount: -12, settings: null, expected: '-12' },
        {
            name: 'suppresses an unrequested negative sign when enforced',
            mask: '#0',
            amount: -12,
            settings: { enforceMaskSign: true },
            expected: '12',
        },
        {
            name: 'retains a requested negative sign when enforced',
            mask: '-#0',
            amount: -12,
            settings: { enforceMaskSign: true },
            expected: '-12',
        },
        { name: 'pads required leading zeroes', mask: '00000.00', amount: 1.2, expected: '00001.20' },
        { name: 'omits an optional zero integer', mask: '#', amount: 0, expected: '' },
        { name: 'groups multiple thousands', mask: '#,##0.00', amount: 1234567.89, expected: '1,234,567.89' },
        { name: 'returns the original amount for an empty mask', mask: '', amount: 12, expected: 12 },
        { name: 'returns a nonnumeric input unchanged', mask: '#0', amount: 'not a number', expected: 'not a number' },
    ]) {
        it(name, () => {
            assert.equal(formatNumber(mask, amount, settings), expected);
        });
    }
});

describe('ICU parsing and locale edge contracts', () => {
    for (const [name, message, parameters, error] of [
        ['rejects an unsafe plural offset', '{n, plural, offset:9007199254740992 other {x}}', { n: 1 }, SyntaxError],
        ['rejects an empty number style', '{n, number, }', { n: 1 }, SyntaxError],
        ['rejects an unterminated number style', '{n, number, integer', { n: 1 }, SyntaxError],
        ['rejects multiple fraction-precision options', '{n, number, ::.00/foo/bar}', { n: 1 }, RangeError],
    ]) {
        it(name, () => {
            assert.throws(() => formatMessage(message, 'en-US', parameters), error);
        });
    }
    it('formats a narrow era skeleton', () => {
        assert.equal(formatMessage('{d, date, ::GGGGG}', 'en-US', { d: Date.UTC(2025, 0, 1) }), '1/1/2025 A');
    });
    it('uses the runtime default locale when none is supplied', () => {
        assert.equal(formatMessage('literal', undefined), 'literal');
    });
    it('uses the formatting fallback for a valid but unsupported locale', () => {
        assert.equal(formatMessage('{n, number}', 'zz-ZZ', { n: 123 }), '123');
    });
    it('respects a locale hour-cycle extension', () => {
        assert.equal(formatMessage('{d, time, ::jmm}', 'en-US-u-hc-h23', { d: Date.UTC(2025, 0, 1, 0, 15) }), '00:15');
    });
    it('resolves the locale hour cycle when hourCycles is unavailable', (context) => {
        context.mock.getter(Intl.Locale.prototype, 'hourCycles', () => undefined);
        assert.equal(formatMessage('{d, time, ::jmm}', 'en-US', { d: Date.UTC(2025, 0, 1, 0, 15) }), '12:15 AM');
    });
    it('rejects an unsupported runtime hour cycle', (context) => {
        context.mock.getter(Intl.Locale.prototype, 'hourCycles', () => ['unsupported']);
        assert.throws(
            () => formatMessage('{d, time, ::jmm}', 'en-US', { d: Date.UTC(2025, 0, 1) }),
            /Invalid message: unsupported/,
        );
    });
});
