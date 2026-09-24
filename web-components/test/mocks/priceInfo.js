// WCS pre-split trees keyed by osi. Written by hand, not the formatter under
// test, so parity trees can prove the pre-split path matches the numeric path.

const usdFormat = {
    currencySymbol: 'US$',
    decimalsDelimiter: '.',
    usePrecision: true,
    isCurrencyFirst: true,
    hasCurrencySpace: false,
};

const leaf = (integer, decimals, full) => ({ integer, decimals, full });

const format = ({
    currencySymbol,
    isCurrencyFirst,
    hasCurrencySpace,
    decimalsDelimiter = '.',
    usePrecision = true,
}) => ({
    currencySymbol,
    decimalsDelimiter,
    usePrecision,
    isCurrencyFirst,
    hasCurrencySpace,
});

// puf-mult: US$599.88/yr, optical US$49.99/mo, no discount.
const puf = {
    format: usdFormat,
    recurrence: { term: 'ANNUAL' },
    asIs: { withDiscount: { withTax: leaf('599', '88', 'US$599.88') } },
    annualized: { withDiscount: { withTax: leaf('599', '88', 'US$599.88') } },
    optical: { withDiscount: { withTax: leaf('49', '99', 'US$49.99') } },
};

// abm-promo-mult: US$43.99/mo discounted, US$54.99/mo without discount.
const abmPromo = {
    format: usdFormat,
    recurrence: { term: 'MONTHLY' },
    asIs: {
        withDiscount: { withTax: leaf('43', '99', 'US$43.99') },
        withoutDiscount: { withTax: leaf('54', '99', 'US$54.99') },
    },
};

// abm-mult: US$54.99/mo, no discount.
const abm = {
    format: usdFormat,
    recurrence: { term: 'MONTHLY' },
    asIs: { withDiscount: { withTax: leaf('54', '99', 'US$54.99') } },
};

export const preformattedTrees = {
    puf,
    'abm-promo': abmPromo,
    abm,
};

// Distinct from the offer price (599.88), so a test can prove the leaf renders.
export const distinctTrees = {
    puf: {
        format: usdFormat,
        recurrence: { term: 'ANNUAL' },
        asIs: { withDiscount: { withTax: leaf('777', '11', 'US$777.11') } },
        annualized: {
            withDiscount: { withTax: leaf('777', '11', 'US$777.11') },
        },
        optical: { withDiscount: { withTax: leaf('64', '77', 'US$64.77') } },
    },
    // abm-mult is YEAR/MONTHLY, the annualized path. `annualized` differs from
    // `asIs` and from both 54.99 * 12 (offer price) and 88.22 * 12 (asIs leaf),
    // so only indexing the annualized leaf can produce it.
    abm: {
        format: usdFormat,
        recurrence: { term: 'MONTHLY' },
        asIs: { withDiscount: { withTax: leaf('88', '22', 'US$88.22') } },
        annualized: {
            withDiscount: { withTax: leaf('911', '33', 'US$911.33') },
        },
    },
};

// Both discount states carry the same leaf: the price/index.test.js fixtures
// have priceWithoutDiscount === price, so strikethrough shows the same digits.
const bothStates = (withTax) => ({
    withDiscount: { withTax },
    withoutDiscount: { withTax },
});

// Trees for the template matrix fixtures in test/price/data.json, keyed by the
// fixture prefix. Digits and format mirror what the numeric path renders, so
// the matrix can run on both response formats against one set of snapshots.
// `annualized` only where WCS would send it (YEAR commitment); the other
// fixtures exercise the missing-leaf fallback.
export const dataTrees = {
    ABM: {
        format: format({
            currencySymbol: 'US$',
            isCurrencyFirst: false,
            hasCurrencySpace: true,
        }),
        recurrence: { term: 'MONTHLY' },
        asIs: bothStates(leaf('1', '23', '1.23 US$')),
        annualized: bothStates(leaf('14', '81', '14.81 US$')),
        optical: { withDiscount: { withTax: leaf('1', '23', '1.23 US$') } },
    },
    M2M: {
        format: format({
            currencySymbol: 'US$',
            isCurrencyFirst: true,
            hasCurrencySpace: true,
            usePrecision: false,
        }),
        recurrence: { term: 'MONTHLY' },
        asIs: bothStates(leaf('12', undefined, 'US$ 12')),
        optical: {
            withDiscount: { withTax: leaf('13', undefined, 'US$ 13') },
        },
    },
    PERPETUAL: {
        format: format({
            currencySymbol: 'US$',
            isCurrencyFirst: true,
            hasCurrencySpace: false,
        }),
        recurrence: { term: 'NONE' },
        asIs: bothStates(leaf('123', '46', 'US$123.46')),
        optical: {
            withDiscount: { withTax: leaf('123', '46', 'US$123.46') },
        },
    },
    PUF: {
        format: format({
            currencySymbol: 'US$',
            isCurrencyFirst: false,
            hasCurrencySpace: false,
            usePrecision: false,
        }),
        recurrence: { term: 'ANNUAL' },
        asIs: bothStates(leaf('1,235', undefined, '1,235US$')),
        annualized: bothStates(leaf('1,235', undefined, '1,235US$')),
        optical: {
            withDiscount: { withTax: leaf('103', undefined, '103US$') },
        },
    },
    'PUF-CHF-1YEAR': {
        format: format({
            currencySymbol: 'CHF',
            isCurrencyFirst: true,
            hasCurrencySpace: true,
        }),
        recurrence: { term: 'ANNUAL' },
        asIs: bothStates(leaf('1,234', '57', 'CHF 1,234.57')),
        annualized: bothStates(leaf('1,234', '57', 'CHF 1,234.57')),
        optical: {
            withDiscount: { withTax: leaf('102', '88', 'CHF 102.88') },
        },
    },
    'PUF-CHF-2YEARS': {
        format: format({
            currencySymbol: 'CHF',
            isCurrencyFirst: true,
            hasCurrencySpace: true,
        }),
        recurrence: { term: 'TWO_YEARS' },
        asIs: bothStates(leaf('2,345', '68', 'CHF 2,345.68')),
        annualized: bothStates(leaf('2,345', '68', 'CHF 2,345.68')),
        optical: {
            withDiscount: { withTax: leaf('97', '74', 'CHF 97.74') },
        },
    },
};

// Gross tree for the segment offers used by the tax matrix: price 1.99 gross,
// priceWithoutTax 1.59. WCS only sends the gross leaf, so a locale/segment that
// forces tax exclusivity must fall back to the net amount instead of pairing
// these digits with an excluding-tax label.
export const segmentTrees = Object.fromEntries(
    ['individual', 'business', 'student', 'university'].map((segment) => [
        segment,
        {
            format: usdFormat,
            recurrence: { term: 'MONTHLY' },
            asIs: { withDiscount: { withTax: leaf('1', '99', 'US$1.99') } },
        },
    ]),
);
export const segmentGrossAmount = '1.99';
export const segmentNetAmount = '1.59';

// tax-exclusive-mult is TAX_INCLUSIVE_DETAILS with distinct gross/net amounts
// (49.98 / 41.65 and 62.47 / 52.06), so forcing tax exclusivity changes the
// number. The tree carries the gross digits it must not render when forced.
export const taxInclusiveGrossTree = {
    'tax-exclusive': {
        format: format({
            currencySymbol: '&euro;',
            isCurrencyFirst: false,
            hasCurrencySpace: true,
            decimalsDelimiter: ',',
        }),
        recurrence: { term: 'MONTHLY' },
        asIs: {
            withDiscount: { withTax: leaf('49', '98', '49,98 &euro;') },
            withoutDiscount: { withTax: leaf('62', '47', '62,47 &euro;') },
        },
    },
};
